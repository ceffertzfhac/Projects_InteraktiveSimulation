'use strict'

import { G, BALL_START_X_PX, GROUND_PX, ANIM_W, BALL_RADIUS_BASE_PX,
         DEFAULT_PIXELS_PER_METER, PIXELS_PER_VELOCITY_UNIT, PIXELS_PER_ACCELERATION_UNIT,
         SF_ARM_LENGTH_M, WATCH_CX, WATCH_CY, SDIAL_CX, SDIAL_CY,
         graphOptions,
         GRAPH_SINGLE_TRANSLATE, GRAPH_STACKED_TOP_TRANSLATE,
         GRAPH_STACKED_BOTTOM_TRANSLATE } from './constants.js'
import { store, DOM, initDOM } from './state.js'
import { scaleX, scaleY, getDisplayY, getDisplayV, getDisplayA,
         flightTime, precompute, interpolateAt } from './physics.js'
import { fmt, drawRuler, drawHorizontalRuler, drawStickFigure,
         drawAnimationCoordSystem, drawStopwatchMarks, drawSubdialMarks,
         initDigitalDisplaySegments, updateDigitalDisplay,
         updateGraphs, updateScene, updateKennwerte, updatePhysicsFormulas,
         updateZoomDisplay, drawFrozenTrajectory, updateGraphHover } from './render.js'
import { attachGraphHover } from '../../shared/js/hover.js'
import { exportSVG, exportPNG, computeBBox } from '../../shared/js/export-image.js'

// ── Diagramm-Dropdowns füllen (zwei unabhängige Picker, → BACKLOG I12.9) ─────
// Beide Picker teilen sich dasselbe Optionsset; die Bahnkurve (yx/xy) hat
// keine Zeitachse und ist daher im Zwei-Diagramm-Modus in keinem der beiden
// Picker wählbar (Diagramm 2 filtert sie generell, da nie sinnvoll neben
// einem zweiten Zeit-Diagramm).
function populateGraphSelects() {
  const dual = store.isStacked
  ;[[DOM.graphSelect1, true], [DOM.graphSelect2, false]].forEach(([sel, allowTraj]) => {
    sel.innerHTML = ''
    for (const groupLabel in graphOptions) {
      const group = document.createElement('optgroup')
      group.label = groupLabel
      for (const value in graphOptions[groupLabel]) {
        if ((!allowTraj || dual) && ['yx', 'xy'].includes(value)) continue
        const option = document.createElement('option')
        option.value = value
        option.innerHTML = graphOptions[groupLabel][value]
        group.appendChild(option)
      }
      if (group.children.length) sel.appendChild(group)
    }
  })
  if (!Array.from(DOM.graphSelect1.options).some(o => o.value === store.graphType1)) store.graphType1 = 'yt'
  if (!Array.from(DOM.graphSelect2.options).some(o => o.value === store.graphType2)) store.graphType2 = 'xt'
  DOM.graphSelect1.value = store.graphType1
  DOM.graphSelect2.value = store.graphType2
  DOM.dualGraphControl.style.display = dual ? '' : 'none'
}

// ── Achsenlimits für einen Diagrammtyp (y-Komponenten respektieren yAxisConfig) ─
function limitsFor(type) {
  const isYComp = ['yt', 'vyt', 'ayt'].includes(type)
  return store.axisLimits[type + (isYComp ? '_display' : '')]
}

// Interpolierter Plot-Wert für einen Diagrammtyp zum Zeitpunkt t (Index i in
// tData bereits bekannt, z. B. aus interpolateAt). null bei Bahnkurve (yx/xy,
// keine Zeitachse) oder fehlenden Daten.
function interpValueAt(type, t, i) {
  if (['yx', 'xy'].includes(type)) return null
  const limits = limitsFor(type)
  if (!limits) return null
  const fd = limits.fullData
  const a = t === store.tData[i] ? 0 : (t - store.tData[i]) / (store.tData[i + 1] - store.tData[i])
  return fd[i] + (i + 1 < fd.length ? a * (fd[i + 1] - fd[i]) : 0)
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

// Mehrfach-Modus (Ein-/Zwei-Diagramm) aus dem kanonischen diagram_mode-speed-
// pill (Werte 1|2) lesen (→ I12). Wert '2' = gestapelt (x/y).
function diagramModeIsStacked() {
  const r = Array.from(DOM.diagramModeRadios).find(x => x.checked)
  return r ? r.value === '2' : false
}

// ── Reset (aus v47 resetScene) ───────────────────────────────────────────────
function resetSim(isPlayTrigger = false) {
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
    store.isStacked = diagramModeIsStacked()
    DOM.h0Value.textContent = `${fmt(store.h0, 1)} m`
    DOM.v0Value.textContent = `${fmt(store.v0, 1)} m/s`
    DOM.alphaValue.textContent = `${store.alphaDeg} °`
    populateGraphSelects()
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

  // Y-Achsen-Konfig-Dropdown: relevant, sobald einer der aktiven Diagramm-Typen
  // eine y-Komponente ist (y/v_y/a_y) — dort nutzt der Teilgraph yAxisConfig
  // (render.js drawSingleGraph … useYAxisConfig:true; ui.js _display-Daten).
  const isTraj = ['yx', 'xy'].includes(store.graphType1)
  const activeTypes = store.isStacked ? [store.graphType1, store.graphType2] : [store.graphType1]
  const isYRelevant = !isTraj && activeTypes.some(t => ['yt', 'vyt', 'ayt'].includes(t))
  DOM.yAxisSelect.disabled = !isYRelevant
  // Bahnkurve (yx/xy) ist stets Einzeldiagramm → Zwei-Diagramm-Pill deaktiviert
  // und auf „1 Diagramm" forciert.
  DOM.diagramModeRadios.forEach(r => { r.disabled = isTraj })
  if (isTraj) {
    DOM.diagramModeRadios.forEach(r => { r.checked = (r.value === '1') })
    store.isStacked = false
    updateSpeedPills()
  }

  precompute()
  drawFrozenTrajectory()

  // Initialer Graph-Wert (zwei unabhängige Picker, → BACKLOG I12.9)
  let initVal1, initVal2
  if (store.tData.length > 0) {
    initVal1 = interpValueAt(store.graphType1, 0, 0)
    if (store.isStacked) initVal2 = interpValueAt(store.graphType2, 0, 0)
  }
  updateGraphs(0, initVal1, initVal2, 0, store.h0)
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

  const graphVal1 = interpValueAt(store.graphType1, store.simulatedTime, s.i)
  const graphVal2 = store.isStacked ? interpValueAt(store.graphType2, store.simulatedTime, s.i) : null

  updateScene(s.t, s.x, s.y, s.vx, s.vy)
  updateGraphs(store.simulatedTime, graphVal1, graphVal2, s.x, s.y)

  if (store.simulatedTime >= store.tData[store.tData.length - 1]) {
    stopAnimation()
    return
  }
  store.aniFrameId = requestAnimationFrame(animate)
}

function startAnimation() {
  if (store.aniFrameId) return
  resetSim(true)
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
  const { tData, xtData, ytData, vxtData, vytData, vabsData, axtData, aytData, graphType1, graphType2, isStacked } = store
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
  } else if (['yx', 'xy'].includes(graphType1)) {
    if (graphType1 === 'yx') {
      header = 'sep=;\nWurfweite x / m;Höhe y / m'
      rows = tData.map((_, i) => `${fmt(xtData[i], 4)};${fmt(getDisplayY(ytData[i]), 4)}`)
    } else {
      header = 'sep=;\nHöhe y / m;Wurfweite x / m'
      rows = tData.map((_, i) => `${fmt(getDisplayY(ytData[i]), 4)};${fmt(xtData[i], 4)}`)
    }
    fileName = `bahn_${graphType1}_daten.csv`
  } else if (isStacked) {
    const l1 = limitsFor(graphType1), l2 = limitsFor(graphType2)
    header = `sep=;\nt / s;${stripLabel(l1.yLabelText)};${stripLabel(l2.yLabelText)}`
    rows = tData.map((_, i) => `${fmt(tData[i], 4)};${fmt(l1.fullData[i], 4)};${fmt(l2.fullData[i], 4)}`)
    fileName = `${graphType1}_${graphType2}_gestapelt_daten.csv`
  } else {
    const limits = limitsFor(graphType1)
    header = `sep=;\nt / s;${stripLabel(limits.yLabelText)}`
    rows = tData.map((_, i) => `${fmt(tData[i], 4)};${fmt(limits.fullData[i], 4)}`)
    fileName = `${graphType1}_daten.csv`
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

DOM.h0Slider.addEventListener('input', () => resetSim())
DOM.v0Slider.addEventListener('input', () => resetSim())
DOM.alphaSlider.addEventListener('input', () => resetSim())
DOM.graphSelect1.addEventListener('change', () => {
  store.graphType1 = DOM.graphSelect1.value
  resetSim()
})
DOM.graphSelect2.addEventListener('change', () => {
  store.graphType2 = DOM.graphSelect2.value
  resetSim()
})
DOM.yAxisSelect.addEventListener('change', () => resetSim())
DOM.speedRadios.forEach(r => r.addEventListener('change', () => {
  DOM.speedRadios.forEach(rad => { if (rad.checked) store.speedFactor = parseFloat(rad.value) })
  updateSpeedPills()
}))
DOM.togVel.addEventListener('change', () => {
  DOM.togVelComp.disabled = !DOM.togVel.checked
  if (!DOM.togVel.checked) DOM.togVelComp.checked = false
  resetSim()
})
DOM.togVelComp.addEventListener('change', () => resetSim())
DOM.togAcc.addEventListener('change', () => resetSim())
DOM.togTrajectory.addEventListener('change', () => resetSim())
DOM.diagramModeRadios.forEach(r => r.addEventListener('change', () => {
  store.isStacked = diagramModeIsStacked()
  updateSpeedPills()
  resetSim()
}))
DOM.resetBtn.addEventListener('click', () => resetSim())
DOM.playBtn.addEventListener('click', startAnimation)
DOM.pauseBtn.addEventListener('click', stopAnimation)
DOM.togCompare.addEventListener('change', () => {
  if (DOM.togCompare.checked) {
    // Aktivieren: aktuelle Bahn einfrieren (Toggle ist nur bedienbar, wenn
    // „Bahn anzeigen" aktiv und eine Bahn vorhanden ist).
    if (store.tData.length > 0) {
      store.frozenTraj = { x: [...store.xtData], y: [...store.ytData] }
      resetSim() // Zoom neu fitten (beide Bahnen)
    } else {
      DOM.togCompare.checked = false
    }
  } else {
    // Deaktivieren: gespeicherte Bahn löschen.
    store.frozenTraj = null
    resetSim() // Zoom neu fitten (nur noch aktuelle Bahn)
  }
})
DOM.stopwatch.addEventListener('click', () => {
  store.isDigitalDisplay = !store.isDigitalDisplay
  resetSim()
})
DOM.exportDiagram.addEventListener('click', () => exportCSV(false))
DOM.exportAll.addEventListener('click', () => exportCSV(true))

// Diagramm-Export als Bild (I6). Das Diagramm ist ein <g> *in* #main_svg (kein
// separates #graph_svg) → exportiere main_svg zugeschnitten auf den Diagrammbereich.
// cropViewBox = lokale BBox des aktiven Graph-<g> + dessen Translate (Single: eine
// Gruppe; Stacked: Union aus top+bottom). computeBBox blendet visibility:hidden-
// Hover-Elemente aus, damit der Zuschnitt nicht durch einen cursor-verfälschten
// Tooltip verzerrt wird.
function graphCropViewBox() {
  if (store.isStacked) {
    const t = GRAPH_STACKED_TOP_TRANSLATE, b = GRAPH_STACKED_BOTTOM_TRANSLATE
    const bt = computeBBox(DOM.graphGroupStackedTop)
    const bb = computeBBox(DOM.graphGroupStackedBottom)
    const x = Math.min(bt.x + t.x, bb.x + b.x)
    const y = Math.min(bt.y + t.y, bb.y + b.y)
    const x2 = Math.max(bt.x + bt.width + t.x, bb.x + bb.width + b.x)
    const y2 = Math.max(bt.y + bt.height + t.y, bb.y + bb.height + b.y)
    return { x, y, w: x2 - x, h: y2 - y }
  }
  const s = GRAPH_SINGLE_TRANSLATE
  const bs = computeBBox(DOM.graphGroupSingle)
  return { x: bs.x + s.x, y: bs.y + s.y, w: bs.width, h: bs.height }
}
DOM.exportSvg.addEventListener('click', () =>
  exportSVG(DOM.mainSvg, 'schraeger_wurf_diagramm.svg', { cropViewBox: graphCropViewBox() }))
DOM.exportPng.addEventListener('click', () =>
  exportPNG(DOM.mainSvg, 'schraeger_wurf_diagramm.png', 2, { cropViewBox: graphCropViewBox() }))
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
resetSim()