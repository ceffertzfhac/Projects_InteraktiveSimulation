'use strict'

// ── Einstieg (ES-Module, kein main.js) ───────────────────────────────────────
// ECHTE Zeitsimulation (anders als M10/M11/Ableitung): requestAnimationFrame-
// Loop treibt store.time voran, solange store.running. Play/Pause/Reset in
// der Topbar, kein CSV (kontinuierliches Feld, kein diskreter Datensatz).

import { store, DOM, initDOM } from './state.js'
import { CANVAS_SIZE, PX_PER_CM, SPEED_DEFAULT, D_MIN, D_MAX, D_STEP, D_DEFAULT,
  LAMBDA_MIN, LAMBDA_MAX, LAMBDA_STEP, LAMBDA_DEFAULT,
  PHASE_MIN, PHASE_MAX, PHASE_STEP, PHASE_DEFAULT,
  SPEED_MIN, SPEED_MAX, SPEED_STEP, DETECTOR_DEFAULT } from './constants.js'
import { clampDetector } from './physics.js'
import {
  initCanvasBuffer, drawField, drawOverlay, drawGraphGrid, drawGraph,
  updateAnalysis, updateUIValues,
} from './render.js'

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

// ── Parameter-Änderung (Regler d/λ/δ₀): neu zeichnen, im Pausen-Fall sofort ──
function onParamChange() {
  store.d = parseFloat(DOM.slDist.value)
  store.lambda = parseFloat(DOM.slLambda.value)
  store.phaseDeg = parseFloat(DOM.slPhase.value)
  updateUIValues()
  drawOverlay()
  updateAnalysis()
  if (!store.running) { drawField(); drawGraph() }
}

// ── Play/Pause/Reset ─────────────────────────────────────────────────────────
function setControlsDisabled(disabled) {
  DOM.slDist.disabled = disabled
  DOM.slLambda.disabled = disabled
  DOM.slPhase.disabled = disabled
}
function play() {
  store.running = true
  DOM.playBtn.disabled = true
  DOM.pauseBtn.disabled = false
  setControlsDisabled(true)
}
function pause() {
  store.running = false
  DOM.playBtn.disabled = false
  DOM.pauseBtn.disabled = true
  setControlsDisabled(false)
}
function resetSim() {
  store.time = 0
  pause()
  drawField()
  drawGraph()
}

// ── rAF-Loop: treibt store.time voran, solange running ──────────────────────
let lastTime = 0
function loop(timestamp) {
  if (!lastTime) lastTime = timestamp
  const dt = (timestamp - lastTime) / 1000
  lastTime = timestamp
  if (store.running) {
    store.time += dt * store.speed
    drawField()
    drawGraph()
  }
  requestAnimationFrame(loop)
}

// ── Detektor-Drag (Maus + Touch, Distanz-Schwellwert wie im Original) ───────
function setupDetectorDrag() {
  let isDragging = false
  const getPos = e => {
    const rect = DOM.visContainer.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const x = (clientX - rect.left) / rect.width * CANVAS_SIZE
    const y = (clientY - rect.top) / rect.height * CANVAS_SIZE
    return {
      x: (x - CANVAS_SIZE / 2) / PX_PER_CM,
      y: (y - CANVAS_SIZE / 2) / PX_PER_CM,
    }
  }
  const applyDetector = p => {
    const maxAbs = (CANVAS_SIZE / 2 - 10) / PX_PER_CM
    store.detector = clampDetector(p.x, p.y, maxAbs)
    drawOverlay()
    updateAnalysis()
    if (!store.running) drawGraph()
  }
  const startDrag = e => {
    const p = getPos(e)
    const dx = p.x - store.detector.x, dy = p.y - store.detector.y
    if (Math.sqrt(dx * dx + dy * dy) < 1.0) isDragging = true
    else applyDetector(p)
  }
  const moveDrag = e => {
    if (!isDragging) return
    e.preventDefault()
    applyDetector(getPos(e))
  }
  DOM.visContainer.addEventListener('mousedown', startDrag)
  DOM.visContainer.addEventListener('mousemove', moveDrag)
  window.addEventListener('mouseup', () => { isDragging = false })
  DOM.visContainer.addEventListener('touchstart', startDrag, { passive: false })
  DOM.visContainer.addEventListener('touchmove', moveDrag, { passive: false })
  window.addEventListener('touchend', () => { isDragging = false })
}

// ── Event-Wiring ──────────────────────────────────────────────────────────────
function setupUI() {
  DOM.slDist.addEventListener('input', onParamChange)
  DOM.slLambda.addEventListener('input', onParamChange)
  DOM.slPhase.addEventListener('input', onParamChange)
  DOM.slSpeed.addEventListener('input', () => { store.speed = parseFloat(DOM.slSpeed.value) / 100 })

  DOM.playBtn.addEventListener('click', play)
  DOM.pauseBtn.addEventListener('click', pause)
  DOM.resetBtn.addEventListener('click', resetSim)

  DOM.radMode.forEach(r => r.addEventListener('change', e => {
    store.mode = e.target.value
    if (!store.running) drawField()
  }))

  DOM.chkNodal.addEventListener('change', e => {
    store.showNodal = e.target.checked
    drawOverlay()
  })

  DOM.chkScreen.addEventListener('change', e => {
    store.showScreen = e.target.checked
    DOM.screenLine.setAttribute('visibility', store.showScreen ? 'visible' : 'hidden')
    DOM.timeGraphPaths.setAttribute('visibility', store.showScreen ? 'hidden' : 'visible')
    DOM.pathIntensity.setAttribute('visibility', store.showScreen ? 'visible' : 'hidden')
    DOM.legendTime.setAttribute('visibility', store.showScreen ? 'hidden' : 'visible')
    DOM.legendIntensity.setAttribute('visibility', store.showScreen ? 'visible' : 'hidden')
    DOM.graphTitle.textContent = store.showScreen ? 'Intensität am Schirm I(x)' : 'Elongation am Punkt P'
    drawGraphGrid()
    if (!store.running) drawGraph()
  })

  setupDetectorDrag()

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

  DOM.slDist.min = D_MIN; DOM.slDist.max = D_MAX; DOM.slDist.step = D_STEP; DOM.slDist.value = D_DEFAULT
  DOM.slLambda.min = LAMBDA_MIN; DOM.slLambda.max = LAMBDA_MAX; DOM.slLambda.step = LAMBDA_STEP; DOM.slLambda.value = LAMBDA_DEFAULT
  DOM.slPhase.min = PHASE_MIN; DOM.slPhase.max = PHASE_MAX; DOM.slPhase.step = PHASE_STEP; DOM.slPhase.value = PHASE_DEFAULT
  DOM.slSpeed.min = SPEED_MIN; DOM.slSpeed.max = SPEED_MAX; DOM.slSpeed.step = SPEED_STEP; DOM.slSpeed.value = SPEED_DEFAULT
  store.detector = { ...DETECTOR_DEFAULT }

  initCanvasBuffer()
  setupUI()
  updateUIValues()
  drawGraphGrid()
  drawOverlay()
  drawField()
  drawGraph()
  updateAnalysis()

  requestAnimationFrame(loop)
}

init()
