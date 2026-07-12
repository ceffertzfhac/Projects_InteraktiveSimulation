'use strict'

// ── Einstieg (ES-Module, kein main.js, kein requestAnimationFrame-Loop) ──────
// Werkzeug ohne Zeit-Animation: Parameteränderung → berechnen → neu zeichnen.

import { store, DOM, initDOM } from './state.js'
import {
  DEFAULT_FUNC, DELTA_STEP, T0_MIN, T0_MAX, T0_STEP, T0_FINE_STEP,
  T0_DEFAULT, DELTA_DEFAULT, FUNCS,
} from './constants.js'
import { sampleCurve, xRange, analyze, deltaBounds } from './physics.js'
import { drawGraph, updateOverlay, updateAnalysis } from './render.js'
import { fmt } from '../../shared/js/format.js'

// ── Theme (einheitlicher Key fh_theme auf allen Seiten) ──────────────────────
function setupTheme() {
  const saved = localStorage.getItem('fh_theme')
  const dark = saved ? saved === 'dark' : window.matchMedia?.('(prefers-color-scheme: dark)').matches
  document.body.classList.toggle('dark', dark)
  document.body.classList.toggle('light', !dark)
  store.isDarkMode = dark
  DOM.themeToggle?.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark')
    document.body.classList.toggle('light', !isDark)
    store.isDarkMode = isDark
    localStorage.setItem('fh_theme', isDark ? 'dark' : 'light')
  })
}

// ── Δt-Slider dynamisch an den Rand koppeln (asymmetrisch, s. physics.js) ────
function applyDeltaBounds() {
  const t0 = parseFloat(DOM.t0Slider.value)
  const { min, max } = deltaBounds(t0, DOM.togCentered.checked)
  DOM.deltaSlider.min = min.toFixed(2)
  DOM.deltaSlider.max = max.toFixed(2)
  let v = parseFloat(DOM.deltaSlider.value)
  if (v > max) v = max
  else if (v < min) v = min
  DOM.deltaSlider.value = v
}

// ── Parameter aus UI lesen ────────────────────────────────────────────────────
function readInputs() {
  const checked = DOM.funcRadios.find(r => r.checked)
  store.funcKey = checked ? checked.value : DEFAULT_FUNC
  store.t0 = parseFloat(DOM.t0Slider.value)
  store.centered = DOM.togCentered.checked
  applyDeltaBounds()   // vor dem Lesen von Δt (schreibt den Slider ggf. zurück)
  store.delta = parseFloat(DOM.deltaSlider.value)
  store.showTangent = DOM.togTangent.checked
  store.showSecant = DOM.togSecant.checked
}

// ── Slider-Anzeigewerte ───────────────────────────────────────────────────────
function syncLabels() {
  DOM.t0Value.textContent = fmt(store.t0) + ' s'
  DOM.deltaValue.textContent = fmt(store.delta) + ' s'
}

// ── Statische MathJax-Varianten nur ein-/ausblenden (kein Laufzeit-Typeset) ──
function syncFormulaVariants() {
  for (const k of Object.keys(FUNCS)) {
    DOM.titleVariants[k].style.display = k === store.funcKey ? '' : 'none'
    DOM.panelFuncVariants[k].style.display = k === store.funcKey ? '' : 'none'
  }
  DOM.diffqVariants.centered.style.display = store.centered ? '' : 'none'
  DOM.diffqVariants.forward.style.display = store.centered ? 'none' : ''
}

// ── Kern-Update: lesen → berechnen → zeichnen ────────────────────────────────
function update() {
  readInputs()
  store.curve = sampleCurve(store.funcKey)
  Object.assign(store, xRange(store.curve.xs))
  store.analysis = analyze(store.funcKey, store.t0, store.delta, store.centered)
  syncLabels()
  syncFormulaVariants()
  drawGraph()
  updateOverlay()
  updateAnalysis()
}

// ── Step-Buttons: t₀ um ±T0_FINE_STEP verschieben ────────────────────────────
function stepT0(step) {
  const slider = DOM.t0Slider
  let v = parseFloat(slider.value) + step
  const min = parseFloat(slider.min), max = parseFloat(slider.max)
  if (v < min) v = min
  if (v > max) v = max
  slider.value = v
  update()
}

// ── Reset auf Defaults ────────────────────────────────────────────────────────
function resetSim() {
  DOM.funcRadios.forEach(r => { r.checked = r.value === DEFAULT_FUNC })
  DOM.t0Slider.value = T0_DEFAULT
  DOM.deltaSlider.value = DELTA_DEFAULT
  DOM.togTangent.checked = false
  DOM.togSecant.checked = false
  DOM.togCentered.checked = true
  update()
}

// ── Event-Wiring ──────────────────────────────────────────────────────────────
function setupUI() {
  DOM.funcRadios.forEach(r => r.addEventListener('change', update))
  DOM.t0Slider.addEventListener('input', update)
  DOM.deltaSlider.addEventListener('input', update)
  DOM.t0StepDown.addEventListener('click', () => stepT0(-T0_FINE_STEP))
  DOM.t0StepUp.addEventListener('click', () => stepT0(T0_FINE_STEP))
  ;[DOM.togTangent, DOM.togSecant, DOM.togCentered].forEach(t => t.addEventListener('change', update))
  DOM.resetBtn.addEventListener('click', resetSim)

  // Einklappbare Analyse-Sidebar (Default eingeklappt via HTML-Klasse)
  DOM.analysisToggle?.addEventListener('click', () => {
    const collapsed = DOM.appLayout.classList.toggle('analysis-collapsed')
    DOM.analysisToggle.setAttribute('aria-expanded', String(!collapsed))
  })

  // Akkordeon-Steuerungs-Sidebar (I8): linke Cluster ein-/ausklappbar.
  document.querySelectorAll('.panel-section.collapsible > .panel-label').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.parentElement
      const collapsed = section.classList.toggle('collapsed')
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
    })
  })
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
function init() {
  initDOM()
  setupTheme()
  DOM.t0Slider.min = T0_MIN; DOM.t0Slider.max = T0_MAX; DOM.t0Slider.step = T0_STEP
  DOM.deltaSlider.step = DELTA_STEP
  setupUI()
  resetSim()
}

init()
