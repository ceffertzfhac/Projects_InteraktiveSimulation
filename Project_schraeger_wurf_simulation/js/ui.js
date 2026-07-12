'use strict'

import { G, BALL_START_X_PX, GROUND_PX, ANIM_W, BALL_RADIUS_BASE_PX,
         DEFAULT_PIXELS_PER_METER, PIXELS_PER_VELOCITY_UNIT, PIXELS_PER_ACCELERATION_UNIT,
         SF_ARM_LENGTH_M, WATCH_CX, WATCH_CY, SDIAL_CX, SDIAL_CY,
         singleGraphOptions, stackedGraphOptions,
         singleToStackedMap, stackedToSingleMap } from './constants.js'
import { store, DOM, initDOM } from './state.js'
import { scaleX, scaleY, getDisplayY, getDisplayV, getDisplayA,
         flightTime, precompute, interpolateAt } from './physics.js'
import { fmt, drawRuler, drawHorizontalRuler, drawStickFigure,
         drawAnimationCoordSystem, drawStopwatchMarks, drawSubdialMarks,
         initDigitalDisplaySegments, updateDigitalDisplay,
         updateGraphs, updateScene, updateKennwerte, updatePhysicsFormulas,
         updateZoomDisplay, drawFrozenTrajectory, updateGraphHover } from './render.js'
import { attachGraphHover } from '../../shared/js/hover.js'

// ── Dropdown-Optionen (Single/Stacked) ───────────────────────────────────────
function updateDropdownOptions(isModeChange) {
  const isStacked = store.isStacked
  const options = isStacked ? stackedGraphOptions : singleGraphOptions
  let sel = store.graphType
  const isTraj = ['yx', 'xy'].includes(sel)

  if (isModeChange && isTraj) {
    sel = 'yt'
  } else if (isModeChange) {
    sel = isStacked ? (singleToStackedMap[sel] || 'pos') : (stackedToSingleMap[sel] || sel || 'yt')
  }

  DOM.graphSelect.innerHTML = ''
  for (const groupLabel in options) {
    const group = document.createElement('optgroup')
    group.label = groupLabel
    for (const value in options[groupLabel]) {
      if (isStacked && (value === 'yx' || value === 'xy')) continue
      const option = document.createElement('option')
      option.value = value
      option.innerHTML = options[groupLabel][value]
      group.appendChild(option)
    }
    DOM.graphSelect.appendChild(group)
  }
  if (!sel || !Array.from(DOM.graphSelect.options).some(o => o.value === sel)) {
    sel = isStacked ? 'pos' : 'yt'
  }
  DOM.graphSelect.value = sel
  store.graphType = sel
}

// ── Animation stoppen ────────────────────────────────────────────────────────
function stopAnimation() {
  if (store.aniFrameId) cancelAnimationFrame(store.aniFrameId)
  store.aniFrameId = null
  DOM.playBtn.disabled = false
  DOM.pauseBtn.disabled = true
  DOM.h0Slider.disabled = false
  DOM.v0Slider.disabled = false
  DOM.alphaSlider.disabled = false
}

// ── Reset (aus v47 resetScene) ───────────────────────────────────────────────
function resetSim(isModeChange = false, isPlayTrigger = false) {
  stopAnimation()
  store.simulatedTime = 0

  ;[DOM.graphPoint, DOM.graphPointTop, DOM.graphPointBottom].forEach(p => {
    p.style.visibility = 'hidden'; p.setAttribute('cx', -100)
  })
  DOM.trajectoryLine.setAttribute('points', '')
  DOM.trajectoryLine.style.visibility = DOM.togTrajectory.checked ? 'visible' : 'hidden'
  updateCompareToggleState()

  if (!isPlayTrigger) {
    store.h0 = parseFloat(DOM.h0Slider.value)
    store.v0 = parseFloat(DOM.v0Slider.value)
    store.alphaDeg = parseFloat(DOM.alphaSlider.value)
    const [dir, ori] = DOM.yAxisSelect.value.split('_')
    store.yAxisConfig = { direction: dir, origin: ori }
    store.isStacked = DOM.togStacked.checked
    DOM.h0Value.textContent = `${fmt(store.h0, 1)} m`
    DOM.v0Value.textContent = `${fmt(store.v0, 1)} m/s`
    DOM.alphaValue.textContent = `${store.alphaDeg} °`
    updateDropdownOptions(isModeChange)
  }

  const alphaRad = store.alphaDeg * Math.PI / 180
  store.v0x = store.v0 * Math.cos(alphaRad)
  store.v0y = store.v0 * Math.sin(alphaRad)

  // Zoom: so dass Wurf (und ggf. gespeicherte Vergleichsbahn) ins Animationsfeld passt
  const tg = flightTime()
  let xMax = store.v0x * tg
  let yMax = store.h0 + (store.v0y > 0 ? store.v0y * store.v0y / (2 * G) : 0)
  if (store.frozenTraj) {
    xMax = Math.max(xMax, Math.max(...store.frozenTraj.x))
    yMax = Math.max(yMax, Math.max(...store.frozenTraj.y))
  }
  const sx = xMax > 0 ? (ANIM_W - BALL_START_X_PX) / (xMax * 1.1) : Infinity
  const sy = yMax > 0 ? GROUND_PX / (yMax * 1.1) : Infinity
  store.currentPixelsPerMeter = Math.min(Math.min(sx, sy), DEFAULT_PIXELS_PER_METER * 2.0)
  store.zoomFactor = store.currentPixelsPerMeter / DEFAULT_PIXELS_PER_METER

  updateZoomDisplay()
  DOM.ball.setAttribute('r', BALL_RADIUS_BASE_PX * store.zoomFactor)

  // Strichmännchen + Gebäude
  const ballCx = BALL_START_X_PX, ballCy = scaleY(store.h0)
  const armLenPx = SF_ARM_LENGTH_M * store.currentPixelsPerMeter
  const shoulderX = ballCx - armLenPx * Math.cos(alphaRad)
  const shoulderY = ballCy + armLenPx * Math.sin(alphaRad)
  const feetY = drawStickFigure(shoulderX, shoulderY, ballCx, ballCy)
  DOM.building.setAttribute('y', feetY)
  DOM.building.setAttribute('height', Math.max(0, GROUND_PX - feetY))

  drawRuler()
  drawHorizontalRuler()
  drawStopwatchMarks()
  drawSubdialMarks()
  drawAnimationCoordSystem()
  DOM.ball.setAttribute('cx', BALL_START_X_PX)
  DOM.ball.setAttribute('cy', scaleY(store.h0))

  // Vektoren bei t=0 sichtbar
  DOM.togVelComp.disabled = !DOM.togVel.checked
  if (!DOM.togVel.checked) DOM.togVelComp.checked = false
  const cx0 = BALL_START_X_PX, cy0 = scaleY(store.h0)
  if (DOM.togAcc.checked) {
    DOM.accVector.setAttribute('visibility', 'visible')
    DOM.accVector.setAttribute('x1', cx0); DOM.accVector.setAttribute('y1', cy0)
    DOM.accVector.setAttribute('x2', cx0); DOM.accVector.setAttribute('y2', cy0 + G * PIXELS_PER_ACCELERATION_UNIT * store.zoomFactor)
  } else {
    DOM.accVector.setAttribute('visibility', 'hidden')
  }
  DOM.velVector.setAttribute('visibility', 'hidden')
  DOM.velVectorX.setAttribute('visibility', 'hidden')
  DOM.velVectorY.setAttribute('visibility', 'hidden')
  if (DOM.togVel.checked) {
    const showComp = DOM.togVelComp.checked
    const endVx = cx0 + store.v0x * PIXELS_PER_VELOCITY_UNIT * store.zoomFactor
    const endVy = cy0 - store.v0y * PIXELS_PER_VELOCITY_UNIT * store.zoomFactor
    if (showComp) {
      DOM.velVectorX.setAttribute('visibility', 'visible')
      DOM.velVectorX.setAttribute('x1', cx0); DOM.velVectorX.setAttribute('y1', cy0)
      DOM.velVectorX.setAttribute('x2', endVx); DOM.velVectorX.setAttribute('y2', cy0)
      DOM.velVectorY.setAttribute('visibility', 'visible')
      DOM.velVectorY.setAttribute('x1', cx0); DOM.velVectorY.setAttribute('y1', cy0)
      DOM.velVectorY.setAttribute('x2', cx0); DOM.velVectorY.setAttribute('y2', endVy)
    } else {
      DOM.velVector.setAttribute('visibility', 'visible')
      DOM.velVector.setAttribute('x1', cx0); DOM.velVector.setAttribute('y1', cy0)
      DOM.velVector.setAttribute('x2', endVx); DOM.velVector.setAttribute('y2', endVy)
    }
  }

  // Stoppuhr-Modus (Analog vs. LCD)
  if (store.isDigitalDisplay) {
    DOM.stopwatchCircle.style.visibility = 'hidden'
    DOM.mainHand.style.visibility = 'hidden'
    DOM.subHand.style.visibility = 'hidden'
    DOM.stopwatchMarks.style.visibility = 'hidden'
    DOM.subdial.style.visibility = 'hidden'
    DOM.digitalDisplayGroup.style.visibility = 'visible'
    updateDigitalDisplay(0)
  } else {
    DOM.stopwatchCircle.style.visibility = 'visible'
    DOM.mainHand.style.visibility = 'visible'
    DOM.subHand.style.visibility = 'visible'
    DOM.stopwatchMarks.style.visibility = 'visible'
    DOM.subdial.style.visibility = 'visible'
    DOM.digitalDisplayGroup.style.visibility = 'hidden'
    DOM.mainHand.setAttribute('x2', WATCH_CX); DOM.mainHand.setAttribute('y2', WATCH_CY - 60)
    DOM.subHand.setAttribute('x2', SDIAL_CX); DOM.subHand.setAttribute('y2', SDIAL_CY - 15)
  }

  // Y-Achsen-Konfig-Dropdown: bei y-Zeitdiagramm (Einzelfeld) UND im gestapelten
  // Modus — dort nutzt der untere y-Komponenten-Teilgraph (y/v_y/a_y) yAxisConfig
  // (render.js drawSingleGraph … useYAxisConfig:true; ui.js _display-Daten).
  const isTraj = ['yx', 'xy'].includes(store.graphType)
  const isYRelevant = !isTraj && (store.isStacked || ['yt', 'vyt', 'ayt'].includes(store.graphType))
  DOM.yAxisSelect.disabled = !isYRelevant
  DOM.togStacked.disabled = isTraj
  if (isTraj) DOM.togStacked.checked = false

  precompute()
  drawFrozenTrajectory()

  // Initialer Graph-Wert
  let initVal, initValTop, initValBottom
  const sel = store.graphType
  if (store.tData.length > 0) {
    if (store.isStacked) {
      const topMap = { pos: 'xt', vel: 'vxt', acc: 'axt' }
      const bottomMap = { pos: 'yt', vel: 'vyt', acc: 'ayt' }
      initValTop = store.axisLimits[topMap[sel]].fullData[0]
      initValBottom = store.axisLimits[bottomMap[sel] + '_display'].fullData[0]
    } else if (!isTraj) {
      const isYComp = ['yt', 'vyt', 'ayt'].includes(sel)
      const suffix = isYComp ? '_display' : ''
      initVal = store.axisLimits[sel + suffix].fullData[0]
    }
  }
  updateGraphs(0, initVal, initValTop, initValBottom, 0, store.h0)
  updateKennwerte()
  updatePhysicsFormulas()

  DOM.timeLabel.innerHTML = '<i>t</i> = 0,00 s'
  DOM.liveT.textContent = '0,00 s'
  DOM.liveX.textContent = `${fmt(0)} m`
  DOM.liveY.textContent = `${fmt(getDisplayY(store.h0))} m`
  DOM.liveVx.textContent = `${fmt(store.v0x)} m/s`
  DOM.liveVy.textContent = `${fmt(getDisplayV(store.v0y))} m/s`
  DOM.liveVabs.textContent = `${fmt(store.v0)} m/s`
  DOM.liveAy.textContent = `${fmt(getDisplayA(-G))} m/s²`
}

// ── Animationsschleife (precompute + interpolateAt) ──────────────────────────
function animate(ts) {
  if (!store.lastFrameTime) store.lastFrameTime = ts
  const dt = (ts - store.lastFrameTime) / 1000
  store.simulatedTime += dt * store.speedFactor
  store.lastFrameTime = ts

  if (store.tData.length === 0) { stopAnimation(); return }

  const s = interpolateAt(store.simulatedTime)
  if (!s) { stopAnimation(); return }

  let graphVal, graphValTop, graphValBottom
  const sel = store.graphType
  if (store.isStacked) {
    const topMap = { pos: 'xt', vel: 'vxt', acc: 'axt' }
    const bottomMap = { pos: 'yt', vel: 'vyt', acc: 'ayt' }
    const topData = store.axisLimits[topMap[sel]].fullData
    const bottomData = store.axisLimits[bottomMap[sel] + '_display'].fullData
    const a = s.t === store.tData[s.i] ? 0 : (store.simulatedTime - store.tData[s.i]) / (store.tData[s.i + 1] - store.tData[s.i])
    graphValTop = topData[s.i] + (s.i + 1 < topData.length ? a * (topData[s.i + 1] - topData[s.i]) : 0)
    graphValBottom = bottomData[s.i] + (s.i + 1 < bottomData.length ? a * (bottomData[s.i + 1] - bottomData[s.i]) : 0)
  } else if (!['yx', 'xy'].includes(sel)) {
    const isYComp = ['yt', 'vyt', 'ayt'].includes(sel)
    const suffix = isYComp ? '_display' : ''
    const limits = store.axisLimits[sel + suffix]
    if (limits) {
      const a = s.t === store.tData[s.i] ? 0 : (store.simulatedTime - store.tData[s.i]) / (store.tData[s.i + 1] - store.tData[s.i])
      graphVal = limits.fullData[s.i] + (s.i + 1 < limits.fullData.length ? a * (limits.fullData[s.i + 1] - limits.fullData[s.i]) : 0)
    }
  }

  updateScene(s.t, s.x, s.y, s.vx, s.vy)
  updateGraphs(store.simulatedTime, graphVal, graphValTop, graphValBottom, s.x, s.y)

  if (store.simulatedTime >= store.tData[store.tData.length - 1]) {
    stopAnimation()
    return
  }
  store.aniFrameId = requestAnimationFrame(animate)
}

function startAnimation() {
  if (store.aniFrameId) return
  resetSim(false, true)
  if (DOM.togTrajectory.checked && store.tData.length > 0) {
    DOM.trajectoryLine.setAttribute('points', `${scaleX(store.xtData[0])},${scaleY(store.ytData[0])} `)
    DOM.trajectoryLine.style.visibility = 'visible'
  }
  DOM.playBtn.disabled = true
  DOM.pauseBtn.disabled = false
  DOM.h0Slider.disabled = true
  DOM.v0Slider.disabled = true
  DOM.alphaSlider.disabled = true
  store.lastFrameTime = 0
  store.simulatedTime = 0
  DOM.speedRadios.forEach(r => { if (r.checked) store.speedFactor = parseFloat(r.value) })
  store.aniFrameId = requestAnimationFrame(animate)
}

// ── CSV-Export (sep=;, Komma-Dezimal) ────────────────────────────────────────
function stripLabel(s) {
  return s.replace(/<\/?i>/g, '').replace(/ₓ/g, 'x').replace(/ᵧ/g, 'y')
}

function exportCSV(all) {
  const { tData, xtData, ytData, vxtData, vytData, vabsData, axtData, aytData, graphType, isStacked } = store
  if (!tData.length) return

  const row = arr => arr.map(v => fmt(v, 4)).join(';')
  let header, rows, fileName

  if (all) {
    const cols = [
      ['t / s', tData], ['x / m', xtData], ['y / m', ytData.map(getDisplayY)],
      ['vx / (m/s)', vxtData], ['vy / (m/s)', vytData.map(getDisplayV)],
      ['|v| / (m/s)', vabsData], ['ax / (m/s²)', axtData], ['ay / (m/s²)', aytData.map(getDisplayA)],
    ]
    header = `sep=;\n${cols.map(c => c[0]).join(';')}`
    rows = tData.map((_, i) => row(cols.map(c => c[1][i])))
    fileName = 'schräger_wurf_alle_daten.csv'
  } else if (['yx', 'xy'].includes(graphType)) {
    if (graphType === 'yx') {
      header = 'sep=;\nWurfweite x / m;Höhe y / m'
      rows = tData.map((_, i) => `${fmt(xtData[i], 4)};${fmt(getDisplayY(ytData[i]), 4)}`)
    } else {
      header = 'sep=;\nHöhe y / m;Wurfweite x / m'
      rows = tData.map((_, i) => `${fmt(getDisplayY(ytData[i]), 4)};${fmt(xtData[i], 4)}`)
    }
    fileName = `bahn_${graphType}_daten.csv`
  } else if (isStacked) {
    const topMap = { pos: 'xt', vel: 'vxt', acc: 'axt' }
    const bottomMap = { pos: 'yt', vel: 'vyt', acc: 'ayt' }
    const topL = store.axisLimits[topMap[graphType]]
    const bottomL = store.axisLimits[bottomMap[graphType] + '_display']
    header = `sep=;\nt / s;${stripLabel(topL.yLabelText)};${stripLabel(bottomL.yLabelText)}`
    rows = tData.map((_, i) => `${fmt(tData[i], 4)};${fmt(topL.fullData[i], 4)};${fmt(bottomL.fullData[i], 4)}`)
    fileName = `${graphType}_gestapelt_daten.csv`
  } else {
    const isYComp = ['yt', 'vyt', 'ayt'].includes(graphType)
    const suffix = isYComp ? '_display' : ''
    const limits = store.axisLimits[graphType + suffix]
    header = `sep=;\nt / s;${stripLabel(limits.yLabelText)}`
    rows = tData.map((_, i) => `${fmt(tData[i], 4)};${fmt(limits.fullData[i], 4)}`)
    fileName = `${graphType}_daten.csv`
  }

  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = fileName
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

// ── Theme ────────────────────────────────────────────────────────────────────
function setupTheme() {
  const saved = localStorage.getItem('fh_theme') || 'light'
  document.body.className = saved
  DOM.themeToggle.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark')
    document.body.classList.toggle('light', !dark)
    localStorage.setItem('fh_theme', dark ? 'dark' : 'light')
    drawRuler(); drawHorizontalRuler(); drawStopwatchMarks(); drawSubdialMarks()
  })
}

// Vergleichsbahn-Toggle nur bedienbar, wenn „Bahn anzeigen" aktiv ist
// (ausgegraut sonst). Wird Bahn ausgeschaltet, wird eine aktive
// Vergleichsbahn zwangsdeaktiviert (und gelöscht).
function updateCompareToggleState() {
  const bahnOn = DOM.togTrajectory.checked
  DOM.togCompare.disabled = !bahnOn
  if (!bahnOn && DOM.togCompare.checked) {
    DOM.togCompare.checked = false
    store.frozenTraj = null
  }
}

function updateSpeedPills() {
  document.querySelectorAll('.speed-pill').forEach(pill => {
    pill.classList.toggle('active', pill.querySelector('input').checked)
  })
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
initDOM()
setupTheme()
initDigitalDisplaySegments()

DOM.h0Slider.addEventListener('input', () => resetSim(false))
DOM.v0Slider.addEventListener('input', () => resetSim(false))
DOM.alphaSlider.addEventListener('input', () => resetSim(false))
DOM.graphSelect.addEventListener('change', () => {
  store.graphType = DOM.graphSelect.value
  resetSim(false)
})
DOM.yAxisSelect.addEventListener('change', () => resetSim(false))
DOM.speedRadios.forEach(r => r.addEventListener('change', () => {
  DOM.speedRadios.forEach(rad => { if (rad.checked) store.speedFactor = parseFloat(rad.value) })
  updateSpeedPills()
}))
DOM.togVel.addEventListener('change', () => {
  DOM.togVelComp.disabled = !DOM.togVel.checked
  if (!DOM.togVel.checked) DOM.togVelComp.checked = false
  resetSim(false)
})
DOM.togVelComp.addEventListener('change', () => resetSim(false))
DOM.togAcc.addEventListener('change', () => resetSim(false))
DOM.togTrajectory.addEventListener('change', () => resetSim(false))
DOM.togStacked.addEventListener('change', () => { store.isStacked = DOM.togStacked.checked; resetSim(true) })
DOM.resetBtn.addEventListener('click', () => resetSim(false))
DOM.playBtn.addEventListener('click', startAnimation)
DOM.pauseBtn.addEventListener('click', stopAnimation)
DOM.togCompare.addEventListener('change', () => {
  if (DOM.togCompare.checked) {
    // Aktivieren: aktuelle Bahn einfrieren (Toggle ist nur bedienbar, wenn
    // „Bahn anzeigen" aktiv und eine Bahn vorhanden ist).
    if (store.tData.length > 0) {
      store.frozenTraj = { x: [...store.xtData], y: [...store.ytData] }
      resetSim(false) // Zoom neu fitten (beide Bahnen)
    } else {
      DOM.togCompare.checked = false
    }
  } else {
    // Deaktivieren: gespeicherte Bahn löschen.
    store.frozenTraj = null
    resetSim(false) // Zoom neu fitten (nur noch aktuelle Bahn)
  }
})
DOM.stopwatch.addEventListener('click', () => {
  store.isDigitalDisplay = !store.isDigitalDisplay
  resetSim(false)
})
DOM.exportDiagram.addEventListener('click', () => exportCSV(false))
DOM.exportAll.addEventListener('click', () => exportCSV(true))
DOM.analysisToggle.addEventListener('click', () => {
  const collapsed = DOM.appLayout.classList.toggle('analysis-collapsed')
  DOM.analysisToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
})

// Akkordeon-Steuerungs-Sidebar (I8): linke Cluster ein-/ausklappbar.
// .panel-label ist <button> → Enter/Space triggert click nativ.
document.querySelectorAll('.panel-section.collapsible > .panel-label').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.parentElement
    const collapsed = section.classList.toggle('collapsed')
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
  })
})

// Hover-Werte am Diagramm (I5) — je ein Hit-Rect pro Diagramm-Slot, da bis
// zu 3 Graph-Gruppen (single/top/bottom) in derselben #main_svg existieren.
;['single', 'top', 'bottom'].forEach(slot => {
  attachGraphHover(DOM.graphHitRect[slot], {
    onMove: x => updateGraphHover(slot, x),
    onLeave: () => updateGraphHover(slot, null),
  })
})

updateSpeedPills()
resetSim(false)