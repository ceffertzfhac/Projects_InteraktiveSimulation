'use strict'

// ── Einstieg (ES-Module, kein main.js, kein requestAnimationFrame-Loop). ──────
// Statische Sim: Parameteränderung → computeEquilibrium → updateScene + Analyse.

import { store, DOM, initDOM } from './state.js'
import {
  M1_DEFAULT, M1_MIN, M1_MAX, M1_STEP,
  M3_DEFAULT, M3_MIN, M3_MAX, M3_STEP,
  M2_DEFAULT, M2_MIN, M2_MAX, M2_STEP,
  PULLEY_DIST_DEFAULT_CM, PULLEY_DIST_MIN_CM, PULLEY_DIST_MAX_CM, PULLEY_DIST_STEP_CM,
  ROPE_LEN_DEFAULT_CM, ROPE_LEN_STEP_CM,
  PIXELS_PER_CM, SVG_CENTER_X,
} from './constants.js'
import { computeEquilibrium } from './physics.js'
import { drawBackground, updateScene, updateAnalysis } from './render.js'

// ── Theme (einheitlicher Key fh_theme auf allen Seiten) ──────────────────────
function setupTheme() {
  const saved = localStorage.getItem('fh_theme')
  const dark = saved ? saved === 'dark' : window.matchMedia?.('(prefers-color-scheme: dark)').matches
  document.body.classList.toggle('dark', dark)
  document.body.classList.toggle('light', !dark)
  DOM.themeToggle?.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark')
    document.body.classList.toggle('light', !isDark)
    localStorage.setItem('fh_theme', isDark ? 'dark' : 'light')
  })
}

// ── Slider-Anzeigewerte ───────────────────────────────────────────────────────
function syncSliderLabels() {
  DOM.m1Value.textContent = `${store.m1.toFixed(2)} kg`
  DOM.m3Value.textContent = `${store.m3.toFixed(2)} kg`
  DOM.m2Value.textContent = `${store.m2.toFixed(2)} kg`
  DOM.pulleyDistValue.textContent = `${store.pulleyDistCm.toFixed(1)} cm`
  DOM.ropeLenValue.textContent = `${store.ropeLenCm.toFixed(1)} cm`
  DOM.m2PlusBtn.disabled = store.m2 >= M2_MAX
  DOM.m2MinusBtn.disabled = store.m2 <= M2_MIN
}

// Dynamische Kopplung: Seillängen-Slider min/max = pulleyDist·0,8 … pulleyDist·1,6
function applyRopeLenBounds() {
  const min = store.pulleyDistCm * 0.8
  const max = store.pulleyDistCm * 1.6
  DOM.ropeLenSlider.min = min
  DOM.ropeLenSlider.max = max
  if (store.ropeLenCm < min) store.ropeLenCm = min
  if (store.ropeLenCm > max) store.ropeLenCm = max
  DOM.ropeLenSlider.value = store.ropeLenCm
}

// ── Parameter aus UI lesen ────────────────────────────────────────────────────
function readInputs() {
  store.m1 = parseFloat(DOM.m1Slider.value)
  store.m3 = parseFloat(DOM.m3Slider.value)
  store.pulleyDistCm = parseFloat(DOM.pulleyDistSlider.value)
  applyRopeLenBounds()
  store.ropeLenCm = parseFloat(DOM.ropeLenSlider.value)
  store.showGravity = DOM.togGravity.checked
  store.showTension = DOM.togTension.checked
  store.showComponents = DOM.togComponents.checked
  store.showComponentValues = DOM.togComponentValues.checked
}

// ── Kern-Update: berechnen + rendern ──────────────────────────────────────────
function update() {
  readInputs()
  syncSliderLabels()
  const pulleyDist = store.pulleyDistCm * PIXELS_PER_CM
  const pulleyLeftX = SVG_CENTER_X - pulleyDist / 2
  const pulleyRightX = SVG_CENTER_X + pulleyDist / 2
  const segLenPx = store.ropeLenCm * PIXELS_PER_CM
  store.equilibrium = computeEquilibrium(store.m1, store.m2, store.m3, pulleyLeftX, pulleyRightX, segLenPx)
  updateScene()
  updateAnalysis()
}

// ── Reset auf Defaults ────────────────────────────────────────────────────────
function resetSim() {
  DOM.m1Slider.value = M1_DEFAULT
  DOM.m3Slider.value = M3_DEFAULT
  store.m2 = M2_DEFAULT
  DOM.pulleyDistSlider.value = PULLEY_DIST_DEFAULT_CM
  store.pulleyDistCm = PULLEY_DIST_DEFAULT_CM
  applyRopeLenBounds()
  DOM.ropeLenSlider.value = ROPE_LEN_DEFAULT_CM
  DOM.togGravity.checked = true
  DOM.togTension.checked = true
  DOM.togComponents.checked = true
  DOM.togComponentValues.checked = true
  DOM.togGrid.checked = false
  DOM.gridGroup.style.visibility = 'hidden'
  update()
}

// ── Debounce (Slider-Ziehen) ──────────────────────────────────────────────────
function debounce(fn, ms) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms) }
}

// ── Event-Wiring ──────────────────────────────────────────────────────────────
function setupUI() {
  const debouncedUpdate = debounce(update, 15)
  const sliders = [DOM.m1Slider, DOM.m3Slider, DOM.pulleyDistSlider, DOM.ropeLenSlider]
  sliders.forEach(s => s.addEventListener('input', debouncedUpdate))
  const toggles = [DOM.togGravity, DOM.togTension, DOM.togComponents, DOM.togComponentValues]
  toggles.forEach(t => t.addEventListener('change', update))

  // m₂-Stepper (Schritt 0,1, Clamp an Grenzen)
  DOM.m2PlusBtn.addEventListener('click', () => {
    if (store.m2 < M2_MAX) {
      store.m2 = Math.min(parseFloat((store.m2 + M2_STEP).toPrecision(12)), M2_MAX)
      update()
    }
  })
  DOM.m2MinusBtn.addEventListener('click', () => {
    if (store.m2 > M2_MIN) {
      store.m2 = Math.max(parseFloat((store.m2 - M2_STEP).toPrecision(12)), M2_MIN)
      update()
    }
  })

  DOM.togGrid.addEventListener('change', () => {
    DOM.gridGroup.style.visibility = DOM.togGrid.checked ? 'visible' : 'hidden'
  })

  DOM.resetBtn.addEventListener('click', resetSim)

  // Einklappbare Analyse-Sidebar
  DOM.analysisToggle?.addEventListener('click', () => {
    const collapsed = DOM.appLayout.classList.toggle('analysis-collapsed')
    DOM.analysisToggle.setAttribute('aria-expanded', String(!collapsed))
  })
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
function init() {
  initDOM()
  setupTheme()
  drawBackground()
  setupUI()
  // Initiale Slider-Attribute (min/max/step) aus Konstanten setzen
  DOM.m1Slider.min = M1_MIN; DOM.m1Slider.max = M1_MAX; DOM.m1Slider.step = M1_STEP
  DOM.m3Slider.min = M3_MIN; DOM.m3Slider.max = M3_MAX; DOM.m3Slider.step = M3_STEP
  DOM.pulleyDistSlider.min = PULLEY_DIST_MIN_CM; DOM.pulleyDistSlider.max = PULLEY_DIST_MAX_CM
  DOM.pulleyDistSlider.step = PULLEY_DIST_STEP_CM
  DOM.ropeLenSlider.step = ROPE_LEN_STEP_CM
  resetSim()
}

init()