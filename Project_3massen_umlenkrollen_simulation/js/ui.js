'use strict'

// ── Einstieg (ES-Module, kein main.js, kein requestAnimationFrame-Loop). ──────
// Statische Sim: Parameteränderung → computeEquilibrium → updateScene + Analyse.

import { store, DOM, initDOM } from './state.js'
import {
  M1_DEFAULT, M1_MIN, M1_MAX, M1_STEP,
  M3_DEFAULT, M3_MIN, M3_MAX, M3_STEP,
  M2_DEFAULT, M2_MIN, M2_MAX, M2_STEP,
  PULLEY_DIST_DEFAULT_CM, PULLEY_DIST_MIN_CM, PULLEY_DIST_MAX_CM, PULLEY_DIST_STEP_CM,
  ROPE_LEN_DEFAULT_CM, ROPE_LEN_STEP_CM, ROPE_LEN_MIN_FACTOR, ROPE_LEN_MAX_FACTOR,
  AUTOZOOM_MARGIN, AUTOZOOM_DURATION_MS,
  PIXELS_PER_CM, SVG_CENTER_X, SVG_W, SVG_H,
} from './constants.js'
import { computeEquilibrium } from './physics.js'
import { drawBackground, updateScene, updateAnalysis, drawGrid } from './render.js'

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

// Dynamische Kopplung: Seillängen-Slider min/max = pulleyDist·[MIN..MAX]-Faktor
function applyRopeLenBounds() {
  const min = store.pulleyDistCm * ROPE_LEN_MIN_FACTOR
  const max = store.pulleyDistCm * ROPE_LEN_MAX_FACTOR
  DOM.ropeLenSlider.min = min
  DOM.ropeLenSlider.max = max
  if (store.ropeLenCm < min) store.ropeLenCm = min
  if (store.ropeLenCm > max) store.ropeLenCm = max
  DOM.ropeLenSlider.value = store.ropeLenCm
}

// ── Auto-Zoom ─────────────────────────────────────────────────────────────────
// Die viewBox umfaßt immer mindestens die Standardansicht (0,0,SVG_W,SVG_H) und zoomt
// nur so weit heraus, wie nötig, sobald gezeichneter Inhalt (Massen, Vektoren INKL.
// Pfeilspitzen, Labels) den Rand erreicht. Oben verankert (xMidYMin), horizontal
// zentriert. Die Anpassung wird smooth getweent (kein Sprung).
const _vb = { x: 0, y: 0, w: SVG_W, h: SVG_H } // aktuell dargestellte viewBox
let _vbAnim = null

function targetViewBox() {
  let bb
  try { bb = DOM.mainSvg.getBBox() } catch { return { x: 0, y: 0, w: SVG_W, h: SVG_H } }
  const M = AUTOZOOM_MARGIN
  const left = bb.x, right = bb.x + bb.width, bottom = bb.y + bb.height
  // Nur herauszoomen, wenn der Inhalt den Standardrahmen wirklich verlässt; dann mit
  // Rand-Puffer, damit er nicht bündig am Rand klebt. Sonst exakt Standardansicht (1,00×).
  const minX = left < 0 ? left - M : 0
  const maxX = right > SVG_W ? right + M : SVG_W
  const maxY = bottom > SVG_H ? bottom + M : SVG_H // oben bei 0 verankert
  return { x: minX, y: 0, w: maxX - minX, h: maxY }
}

function setViewBox(v) {
  DOM.mainSvg.setAttribute('viewBox', `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`)
}

// Zoomfaktor (linear, relativ zur Standardansicht): <1 = herausgezoomt.
function updateZoomReadout() {
  store.zoomFactor = 1 / Math.max(_vb.w / SVG_W, _vb.h / SVG_H)
  if (DOM.zoomReadout) DOM.zoomReadout.textContent = `Zoom: ${store.zoomFactor.toFixed(2).replace('.', ',')}×`
}

function applyAutoZoom() {
  const t = targetViewBox()
  // Raster auf die Ziel-Ausdehnung erweitern (füllt beim Herauszoomen die Fläche)
  drawGrid(t.x, 0, t.x + t.w, t.h)
  // Nichts zu tun, wenn Ziel praktisch schon erreicht
  const near = Math.abs(t.x - _vb.x) < 0.5 && Math.abs(t.w - _vb.w) < 0.5 && Math.abs(t.h - _vb.h) < 0.5
  if (near) { Object.assign(_vb, t); setViewBox(_vb); updateZoomReadout(); return }
  const start = { ..._vb }
  const t0 = performance.now()
  const ease = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2) // easeInOutQuad
  if (_vbAnim) cancelAnimationFrame(_vbAnim)
  const step = now => {
    const k = Math.min(1, (now - t0) / AUTOZOOM_DURATION_MS)
    const e = ease(k)
    _vb.x = start.x + (t.x - start.x) * e
    _vb.y = start.y + (t.y - start.y) * e
    _vb.w = start.w + (t.w - start.w) * e
    _vb.h = start.h + (t.h - start.h) * e
    setViewBox(_vb)
    updateZoomReadout()
    _vbAnim = k < 1 ? requestAnimationFrame(step) : null
  }
  _vbAnim = requestAnimationFrame(step)
}

// ── Parameter aus UI lesen ────────────────────────────────────────────────────
function readInputs() {
  store.m1 = parseFloat(DOM.m1Slider.value)
  store.m3 = parseFloat(DOM.m3Slider.value)
  store.pulleyDistCm = parseFloat(DOM.pulleyDistSlider.value)
  // Erst den aktuellen Reglerwert lesen, DANN an die (evtl. neuen) Grenzen klemmen.
  // (Reihenfolge kritisch: applyRopeLenBounds schreibt den Slider zurück — würde man
  //  vorher klemmen, überschriebe es die gerade getätigte Reglerbewegung.)
  store.ropeLenCm = parseFloat(DOM.ropeLenSlider.value)
  applyRopeLenBounds()
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
  applyAutoZoom() // nach updateScene: bbox des gezeichneten Inhalts steht fest
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
  DOM.togGravity.checked = false
  DOM.togTension.checked = false
  DOM.togComponents.checked = false
  DOM.togComponentValues.checked = false
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