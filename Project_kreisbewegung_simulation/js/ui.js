'use strict'

import { store, DOM, initDOM } from './state.js'
import {
  singleGraphOptions, stackedGraphOptions,
  singleToStackedMap, stackedToSingleMap,
  ANIM_CX, ANIM_CY,
} from './constants.js'
import {
  recomputeDerived, precompute, extendMotionData, recalculateAxisLimits,
  position, velocity, acceleration, angleDeg, interpolateAt,
} from './physics.js'
import {
  setupScene, updateScene, updateGraph, updateKennwerte,
  drawStopwatchMarks, drawSubdialMarks, initDigitalDisplaySegments,
  fmt,
} from './render.js'

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

// ── Dropdown-Optionen aufbauen ────────────────────────────────────────────────
function updateDropdownOptions() {
  const options = store.isStacked ? stackedGraphOptions : singleGraphOptions
  const sel = store.isStacked ? store.stackedType : store.graphType
  DOM.graphSelect.innerHTML = ''
  for (const group in options) {
    const og = document.createElement('optgroup')
    og.label = group
    for (const val in options[group]) {
      const o = document.createElement('option')
      o.value = val
      o.innerHTML = options[group][val]
      og.appendChild(o)
    }
    DOM.graphSelect.appendChild(og)
  }
  DOM.graphSelect.value = sel
}

// ── Stacked-Toggle-Verfügbarkeit: bei Bahnkurven deaktiviert ─────────────────
function updateStackedAvailability() {
  const isTraj = ['yx', 'xy'].includes(store.graphType)
  if (isTraj && store.isStacked) {
    store.isStacked = false
    DOM.togStacked.checked = false
  }
  DOM.togStacked.disabled = isTraj
}

// ── Live-Objekte für updateScene bauen ───────────────────────────────────────
function liveObjects(t) {
  const p = position(t), v = velocity(t), a = acceleration(t)
  return {
    p: { x: p.x, y: p.y, phi: angleDeg(t), abs: Math.hypot(p.x, p.y) },
    v: { x: v.x, y: v.y, abs: Math.abs(store.R * store.omega) },
    a: { x: a.x, y: a.y, abs: Math.abs(store.R * store.omega * store.omega) },
  }
}

// ── Stoppuhr-Anzeige (analog vs. digital) ────────────────────────────────────
function applyStopwatchMode() {
  const showDigital = store.isDigitalDisplay
  DOM.stopwatchCircle.style.visibility = showDigital ? 'hidden' : 'visible'
  DOM.mainHand.style.visibility = showDigital ? 'hidden' : 'visible'
  DOM.subHand.style.visibility = showDigital ? 'hidden' : 'visible'
  DOM.stopwatchMarks.style.visibility = showDigital ? 'hidden' : 'visible'
  DOM.subdial.style.visibility = showDigital ? 'hidden' : 'visible'
  DOM.digitalDisplayGroup.style.visibility = showDigital ? 'visible' : 'hidden'
}

// ── Reset ────────────────────────────────────────────────────────────────────
function resetSim(isPlayTrigger = false) {
  stopAnimation()
  if (!isPlayTrigger) { store.visualTime = 0; store.simulatedTime = 0 }
  store.lastFrameTime = 0

  // Parameter aus UI lesen
  store.R = parseFloat(DOM.radiusSlider.value)
  store.phi0Deg = parseFloat(DOM.phi0Slider.value)
  store.omegaDeg = parseFloat(DOM.omegaSlider.value)
  store.isStacked = DOM.togStacked.checked
  store.showPositionVector = DOM.togPositionVector.checked
  store.showPositionComponents = DOM.togPositionComponents.checked
  store.showVelocityVector = DOM.togVelocityVector.checked
  store.showVelocityComponents = DOM.togVelocityComponents.checked
  store.showAccelerationVector = DOM.togAccelerationVector.checked
  store.showAccelerationComponents = DOM.togAccelerationComponents.checked
  store.showTrajectory = DOM.togTrajectory.checked
  DOM.speedRadios.forEach(r => { if (r.checked) store.speedFactor = parseFloat(r.value) })

  // Stacked-Zustand aus Dropdown, falls beides konsistent (Dropdown ist
  // dynamisch — erst aufbauen, dann aktuellen Wert zurücklesen, sonst
  // überschreibt der leere Init-Wert die Store-Vorgabe).
  recomputeDerived()
  updateStackedAvailability()
  updateDropdownOptions()
  if (store.isStacked) store.stackedType = DOM.graphSelect.value
  else store.graphType = DOM.graphSelect.value

  DOM.radiusValue.textContent = `${store.R.toFixed(1)} m`
  DOM.phi0Value.textContent = `${store.phi0Deg.toFixed(0)} °`
  DOM.omegaValue.textContent = `${store.omegaDeg.toFixed(0)} °/s`

  precompute()

  setupScene()

  // Anfangsszene bei t = 0 (Vektoren auch im Ruhezustand zeichnen)
  const { p, v, a } = liveObjects(0)
  updateScene(0, p, v, a, { cx: ANIM_CX, cy: ANIM_CY })

  updateGraph(0)
  updateKennwerte()
  applyStopwatchMode()
}

// ── Animation ────────────────────────────────────────────────────────────────
function animate(currentTime) {
  if (!store.lastFrameTime) store.lastFrameTime = currentTime
  let deltaTime = (currentTime - store.lastFrameTime) / 1000
  if (deltaTime > 0.1) deltaTime = 0.1
  store.lastFrameTime = currentTime

  store.visualTime += deltaTime * store.speedFactor
  store.simulatedTime += deltaTime * store.speedFactor

  if (store.tData.length > 0 && store.simulatedTime >= store.tData[store.tData.length - 1]) {
    const duration = store.T === Infinity ? 10 : Math.max(4 * store.T, 10)
    extendMotionData(duration)
    recalculateAxisLimits()
  }

  const { p, v, a } = liveObjects(store.visualTime)
  updateScene(store.simulatedTime, p, v, a, { cx: ANIM_CX, cy: ANIM_CY })
  updateGraph(store.simulatedTime)

  store.aniFrameId = requestAnimationFrame(animate)
}

function startAnimation() {
  if (store.aniFrameId) return
  if (store.visualTime < 1e-9) resetSim(true)
  store.lastFrameTime = 0
  store.aniFrameId = requestAnimationFrame(animate)
  DOM.playBtn.disabled = true
  DOM.pauseBtn.disabled = false
  ;[DOM.radiusSlider, DOM.phi0Slider, DOM.omegaSlider].forEach(el => el.disabled = true)
}

function stopAnimation() {
  if (store.aniFrameId) cancelAnimationFrame(store.aniFrameId)
  store.aniFrameId = null
  DOM.playBtn.disabled = false
  DOM.pauseBtn.disabled = true
  ;[DOM.radiusSlider, DOM.phi0Slider, DOM.omegaSlider].forEach(el => el.disabled = false)
}

// ── CSV-Export (sep=; · Semikolon-Trenner · Komma-Dezimal) ───────────────────
function toCsv(v, d = 4) {
  return Number.isFinite(v) ? v.toFixed(d).replace('.', ',') : ''
}

function downloadCSV(filename, rows) {
  const csv = 'sep=;\n' + rows.map(r => r.join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Label ohne HTML-<i>-Tags und mit Unicode-Subscripts zu ASCII für CSV-Header
function stripLabel(s) {
  return s.replace(/<i>|<\/i>/g, '').replace(/ᵧ/g, 'y').replace(/ₓ/g, 'x')
}

function exportAllCSV() {
  if (store.tData.length === 0) return
  const rows = [[
    'Zeit t (s)', 'x (m)', 'y (m)',
    'vx (m/s)', 'vy (m/s)', '|v| (m/s)',
    'ax (m/s²)', 'ay (m/s²)', '|a| (m/s²)',
    'phi (°)',
  ]]
  for (let i = 0; i < store.tData.length; i++) {
    rows.push([
      toCsv(store.tData[i]), toCsv(store.xData[i]), toCsv(store.yData[i]),
      toCsv(store.vxData[i]), toCsv(store.vyData[i]), toCsv(store.vabsData[i]),
      toCsv(store.axData[i]), toCsv(store.ayData[i]), toCsv(store.aabsData[i]),
      toCsv(store.phitData[i], 2),
    ])
  }
  downloadCSV('kreisbewegung_alle_daten.csv', rows)
}

function exportDiagramCSV() {
  if (store.tData.length === 0) return
  if (store.isStacked) {
    const [topType, bottomType] = stackedTypes(store.stackedType)
    const topL = store.axisLimits[topType], botL = store.axisLimits[bottomType]
    const rows = [[`Zeit t (s)`, stripLabel(topL.yLabel), stripLabel(botL.yLabel)]]
    for (let i = 0; i < store.tData.length; i++) {
      rows.push([toCsv(store.tData[i]), toCsv(topL.yArr[i]), toCsv(botL.yArr[i])])
    }
    downloadCSV(`kreisbewegung_gestapelt_${store.stackedType}.csv`, rows)
    return
  }
  const type = store.graphType
  const limits = store.axisLimits[type]
  if (!limits) return
  if (limits.xIsTime) {
    const rows = [['Zeit t (s)', stripLabel(limits.yLabel)]]
    for (let i = 0; i < store.tData.length; i++) {
      rows.push([toCsv(store.tData[i]), toCsv(limits.yArr[i])])
    }
    downloadCSV(`kreisbewegung_${type}.csv`, rows)
  } else {
    // Bahnkurve: x;y (oder y;x)
    const rows = [[stripLabel(limits.xLabel), stripLabel(limits.yLabel)]]
    for (let i = 0; i < limits.xArr.length; i++) {
      rows.push([toCsv(limits.xArr[i]), toCsv(limits.yArr[i])])
    }
    downloadCSV(`kreisbewegung_bahn_${type}.csv`, rows)
  }
}

function stackedTypes(stackedType) {
  const map = { pos: ['xt', 'yt'], vel: ['vxt', 'vyt'], acc: ['axt', 'ayt'] }
  return map[stackedType] ?? ['xt', 'yt']
}

// ── Event-Wiring ─────────────────────────────────────────────────────────────
function setupUI() {
  DOM.radiusSlider.addEventListener('input', () => {
    DOM.radiusValue.textContent = `${parseFloat(DOM.radiusSlider.value).toFixed(1)} m`
    resetSim(false)
  })
  DOM.phi0Slider.addEventListener('input', () => {
    DOM.phi0Value.textContent = `${parseFloat(DOM.phi0Slider.value).toFixed(0)} °`
    resetSim(false)
  })
  DOM.omegaSlider.addEventListener('input', () => {
    DOM.omegaValue.textContent = `${parseFloat(DOM.omegaSlider.value).toFixed(0)} °/s`
    resetSim(false)
  })
  DOM.speedRadios.forEach(r => r.addEventListener('change', () => { store.speedFactor = parseFloat(r.value) }))

  DOM.graphSelect.addEventListener('change', () => {
    const val = DOM.graphSelect.value
    if (store.isStacked) store.stackedType = val
    else store.graphType = val
    resetSim(false)
  })

  DOM.togStacked.addEventListener('change', () => {
    const nowStacked = DOM.togStacked.checked
    if (nowStacked) {
      store.isStacked = true
      store.stackedType = singleToStackedMap[store.graphType] ?? 'pos'
    } else {
      store.isStacked = false
      store.graphType = stackedToSingleMap[store.stackedType] ?? 'yx'
    }
    resetSim(false)
  })

  const visToggles = [
    [DOM.togPositionVector, 'showPositionVector'],
    [DOM.togPositionComponents, 'showPositionComponents'],
    [DOM.togVelocityVector, 'showVelocityVector'],
    [DOM.togVelocityComponents, 'showVelocityComponents'],
    [DOM.togAccelerationVector, 'showAccelerationVector'],
    [DOM.togAccelerationComponents, 'showAccelerationComponents'],
    [DOM.togTrajectory, 'showTrajectory'],
  ]
  visToggles.forEach(([togEl, key]) => {
    togEl.addEventListener('change', () => { store[key] = togEl.checked; resetSim(false) })
  })

  DOM.playBtn.addEventListener('click', startAnimation)
  DOM.pauseBtn.addEventListener('click', stopAnimation)
  DOM.resetBtn.addEventListener('click', () => { store.visualTime = 0; store.simulatedTime = 0; resetSim(false) })
  DOM.exportDiagram.addEventListener('click', exportDiagramCSV)
  DOM.exportAll.addEventListener('click', exportAllCSV)

  // Stoppuhr: Klick schaltet analog ↔ digital
  DOM.stopwatch.addEventListener('click', () => {
    store.isDigitalDisplay = !store.isDigitalDisplay
    applyStopwatchMode()
  })

  // Einklappbare Analyse-Sidebar
  DOM.analysisToggle?.addEventListener('click', () => {
    const collapsed = DOM.appLayout.classList.toggle('analysis-collapsed')
    DOM.analysisToggle.setAttribute('aria-expanded', String(!collapsed))
  })
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
function init() {
  initDOM()
  setupTheme()
  drawStopwatchMarks()
  drawSubdialMarks()
  initDigitalDisplaySegments()
  setupUI()
  resetSim(false)
}

init()