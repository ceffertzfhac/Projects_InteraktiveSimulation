'use strict'

// ── Einstieg (ES-Module, kein main.js, kein requestAnimationFrame-Loop) ──────
// Werkzeug ohne Zeit-Animation: Parameteränderung → berechnen → neu zeichnen.

import { store, DOM, initDOM } from './state.js'
import { T_MIN, T_MAX, T_STEP, TA_DEFAULT, TB_DEFAULT } from './constants.js'
import { computePath, deriveAB } from './physics.js'
import { drawGrid, updateVisualization, updateAnalysisBox, computeBounds } from './render.js'
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

// ── Kern-Update: tA/tB ableiten → neu zeichnen ───────────────────────────────
function recompute() {
  store.ab = deriveAB(store.path, store.tA, store.tB)
  updateVisualization(null)
}

// ── Zeit-Slider: tA darf tB nicht überholen und umgekehrt (1:1 aus dem
// Original — bewußt kein Vertauschen der Rollen, nur ein Nachziehen des
// jeweils anderen Reglers) ───────────────────────────────────────────────────
function handleTASlider() {
  store.tA = parseFloat(DOM.tASlider.value)
  if (store.tA > store.tB) { store.tB = store.tA; DOM.tBSlider.value = store.tB }
  syncTimeLabels()
  recompute()
}
function handleTBSlider() {
  store.tB = parseFloat(DOM.tBSlider.value)
  if (store.tB < store.tA) { store.tA = store.tB; DOM.tASlider.value = store.tA }
  syncTimeLabels()
  recompute()
}
function syncTimeLabels() {
  DOM.tAValue.textContent = fmt(store.tA) + ' s'
  DOM.tBValue.textContent = fmt(store.tB) + ' s'
}

// ── Hover/Checkbox/Klick je Steuerzeile (1:1 aus dem Original) ──────────────
function setupControlRow(key) {
  const toggle = DOM.toggles[key]
  const control = DOM.controls[key]
  const onEnter = () => { updateVisualization(key); updateAnalysisBox(key) }
  const onLeave = () => { updateVisualization(null); updateAnalysisBox('default') }
  toggle.addEventListener('change', () => {
    store.toggles[key] = toggle.checked
    onEnter()
  })
  control.addEventListener('mouseenter', onEnter)
  control.addEventListener('mouseleave', onLeave)
  control.addEventListener('click', e => {
    if (e.target.type !== 'checkbox') {
      toggle.checked = !toggle.checked
      toggle.dispatchEvent(new Event('change'))
    }
  })
}

// ── Reset auf Defaults ────────────────────────────────────────────────────────
function resetSim() {
  store.tA = TA_DEFAULT
  store.tB = TB_DEFAULT
  DOM.tASlider.value = TA_DEFAULT
  DOM.tBSlider.value = TB_DEFAULT
  syncTimeLabels()

  store.toggles = { pathBg: true, sA: false, sB: false, verschiebung_BA: false, verschiebung_AB: false, abstand: false, weg: false }
  for (const [key, checked] of Object.entries(store.toggles)) DOM.toggles[key].checked = checked

  updateAnalysisBox('default')
  recompute()
}

// ── Event-Wiring ──────────────────────────────────────────────────────────────
function setupUI() {
  DOM.tASlider.addEventListener('input', handleTASlider)
  DOM.tBSlider.addEventListener('input', handleTBSlider)
  for (const key of Object.keys(DOM.controls)) setupControlRow(key)
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
  DOM.tASlider.min = T_MIN; DOM.tASlider.max = T_MAX; DOM.tASlider.step = T_STEP
  DOM.tBSlider.min = T_MIN; DOM.tBSlider.max = T_MAX; DOM.tBSlider.step = T_STEP

  // Feste Bahnkurve + Bounds nur EINMAL berechnen (ändert sich nie, s. physics.js)
  store.path = computePath()
  Object.assign(store, computeBounds(store.path.yMax))
  drawGrid()

  setupUI()
  resetSim()
}

init()
