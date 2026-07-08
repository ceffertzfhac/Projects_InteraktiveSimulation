'use strict'

// ── Einstieg (ES-Module, kein main.js, kein requestAnimationFrame-Loop) ──────
// Werkzeug ohne Zeit-Animation: Parameteränderung → berechnen → neu zeichnen.

import { store, DOM, initDOM } from './state.js'
import {
  FUNCS, DEFAULT_FUNC, DELTA_STEP,
  X0_MIN, X0_MAX, X0_STEP, X0_DEFAULT, DELTA_DEFAULT,
} from './constants.js'
import { sampleCurve, yRange, analyze, maxAbsDelta } from './physics.js'
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

// ── δ-Slider dynamisch an den Rand koppeln, Wert klemmen, 0 vermeiden ────────
function applyDeltaBounds() {
  const x0 = parseFloat(DOM.x0Slider.value)
  const m = Math.max(DELTA_STEP, maxAbsDelta(x0))
  DOM.deltaSlider.min = -m
  DOM.deltaSlider.max = m
  let v = parseFloat(DOM.deltaSlider.value)
  if (v > m) v = m
  else if (v < -m) v = -m
  // δ = 0 macht den Differenzenquotienten undefiniert → auf einen Schritt heben
  if (Math.abs(v) < DELTA_STEP / 2) v = DELTA_STEP
  DOM.deltaSlider.value = v
}

// ── Parameter aus UI lesen ────────────────────────────────────────────────────
function readInputs() {
  store.funcKey = DOM.funcSelect.value
  store.x0 = parseFloat(DOM.x0Slider.value)
  store.centered = DOM.togCentered.checked
  applyDeltaBounds()   // vor dem Lesen von δ (schreibt den Slider ggf. zurück)
  store.delta = parseFloat(DOM.deltaSlider.value)
  store.showTangent = DOM.togTangent.checked
  store.showSecant = DOM.togSecant.checked
  store.showDeltaValues = DOM.togDeltaValues.checked
  store.showSecantSlope = DOM.togSecantSlope.checked
  store.showTangentSlope = DOM.togTangentSlope.checked
}

// ── Slider-Anzeigewerte ───────────────────────────────────────────────────────
function syncLabels() {
  DOM.x0Value.textContent = fmt(store.x0)
  DOM.deltaValue.textContent = fmt(store.delta)
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
  Object.assign(store, yRange(store.curve.ys))
  store.analysis = analyze(store.funcKey, store.x0, store.delta, store.centered)
  syncLabels()
  syncFormulaVariants()
  drawGraph()
  updateOverlay()
  updateAnalysis()
}

// ── Reset auf Defaults ────────────────────────────────────────────────────────
function resetSim() {
  DOM.funcSelect.value = DEFAULT_FUNC
  DOM.x0Slider.value = X0_DEFAULT
  DOM.deltaSlider.value = DELTA_DEFAULT
  DOM.togTangent.checked = true
  DOM.togSecant.checked = true
  DOM.togCentered.checked = true
  DOM.togDeltaValues.checked = true
  DOM.togSecantSlope.checked = true
  DOM.togTangentSlope.checked = true
  update()
}

// ── Event-Wiring ──────────────────────────────────────────────────────────────
function setupUI() {
  DOM.funcSelect.addEventListener('change', update)
  DOM.x0Slider.addEventListener('input', update)
  DOM.deltaSlider.addEventListener('input', update)
  ;[DOM.togTangent, DOM.togSecant, DOM.togCentered,
    DOM.togDeltaValues, DOM.togSecantSlope, DOM.togTangentSlope]
    .forEach(t => t.addEventListener('change', update))
  DOM.resetBtn.addEventListener('click', resetSim)

  // Einklappbare Analyse-Sidebar (Default eingeklappt via HTML-Klasse)
  DOM.analysisToggle?.addEventListener('click', () => {
    const collapsed = DOM.appLayout.classList.toggle('analysis-collapsed')
    DOM.analysisToggle.setAttribute('aria-expanded', String(!collapsed))
  })
}

// ── Funktionsauswahl-Dropdown befüllen ───────────────────────────────────────
function fillFuncSelect() {
  for (const [k, v] of Object.entries(FUNCS)) {
    const opt = document.createElement('option')
    opt.value = k
    opt.textContent = v.label
    DOM.funcSelect.appendChild(opt)
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
function init() {
  initDOM()
  setupTheme()
  fillFuncSelect()
  DOM.x0Slider.min = X0_MIN; DOM.x0Slider.max = X0_MAX; DOM.x0Slider.step = X0_STEP
  DOM.deltaSlider.step = DELTA_STEP
  setupUI()
  resetSim()
}

init()
