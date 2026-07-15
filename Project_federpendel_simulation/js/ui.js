'use strict'

import { store, DOM, initDOM } from './state.js'
import {
  MASS_MIN, MASS_MAX, K_MIN, K_MAX,
  INITIAL_MASS_SIZE, MIN_MASS_SIZE,
  graphOptions,
} from './constants.js'
import {
  recomputeDerived, precompute, extendMotionData, recalculateAxisLimits,
  displacement, velocity, acceleration, totalEnergy,
} from './physics.js'
import {
  setupScene, updateScene, updateGraph, updateKennwerte,
  drawStopwatchMarks, drawSubdialMarks, initDigitalDisplaySegments, fmt,
  updateGraphHover,
} from './render.js'
import { attachGraphHover } from '../../shared/js/hover.js'

// ── Diagramm-Typ-Picker aus graphOptions befüllen (kanonisch, → BACKLOG I12
// Sidebar-Schule; Picker sitzt in der linken Sidebar, nicht am Diagramm).
// Optgroup-Struktur wie Zykloide: eine Gruppe je Map-Schlüssel.
function populateGraphSelect() {
  DOM.graphSelect.innerHTML = ''
  for (const groupLabel in graphOptions) {
    const group = document.createElement('optgroup')
    group.label = groupLabel
    for (const value in graphOptions[groupLabel]) {
      const opt = document.createElement('option')
      opt.value = value
      opt.innerHTML = graphOptions[groupLabel][value]
      group.appendChild(opt)
    }
    DOM.graphSelect.appendChild(group)
  }
  DOM.graphSelect.value = store.graphType
}

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

// ── Masse-/Feder-Skalierung ──────────────────────────────────────────────────
function updateMassRenderSize() {
  const t = (store.m - MASS_MIN) / (MASS_MAX - MASS_MIN)
  store.currentMassRenderSize = MIN_MASS_SIZE + t * (INITIAL_MASS_SIZE - MIN_MASS_SIZE)
  DOM.mass.setAttribute('width', store.currentMassRenderSize)
  DOM.mass.setAttribute('height', store.currentMassRenderSize)
}
function updateSpringStroke() {
  const t = (store.k - K_MIN) / (K_MAX - K_MIN)
  DOM.spring.setAttribute('stroke-width', 2 + t * (4 - 2))
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
  if (!showDigital) {
    DOM.mainHand.setAttribute('x2', 280)
    DOM.mainHand.setAttribute('y2', 120 - 60)
    DOM.subHand.setAttribute('x2', 280)
    DOM.subHand.setAttribute('y2', 150 - 15)
  }
}

// ── Reset ────────────────────────────────────────────────────────────────────
function resetSim(isPlayTrigger = false) {
  stopAnimation()
  if (!isPlayTrigger) { store.visualTime = 0 }
  store.lastFrameTime = 0
  store.isTimingStarted = false
  store.timingOffset = 0

  // Parameter aus UI lesen
  store.m = parseFloat(DOM.massSlider.value)
  store.k = parseFloat(DOM.kSlider.value)
  store.amplitude = parseFloat(DOM.pos0Slider.value)
  store.graphType = DOM.graphSelect.value
  store.isManualTiming = DOM.togManualTiming.checked
  DOM.orientationRadios.forEach(r => { if (r.checked) store.oscillationMode = r.value })
  DOM.speedRadios.forEach(r => { if (r.checked) store.speedFactor = parseFloat(r.value) })

  DOM.massValue.textContent = `${store.m.toFixed(1)} kg`
  DOM.kValue.textContent = `${store.k.toFixed(0)} N/m`
  DOM.pos0Value.textContent = `${store.amplitude.toFixed(2)} m`

  recomputeDerived()
  updateMassRenderSize()
  updateSpringStroke()
  precompute()

  store.centers = setupScene()

  // Anfangsszene bei t = 0 (Vektoren auch im Ruhezustand zeichnen)
  const x0 = displacement(0), v0 = velocity(0), a0 = acceleration(0)
  updateScene(0, x0, v0, a0, store.centers)

  // Diagramm bei t = 0 (im manuellen Modus vor Start: kein Punkt)
  const hasData = store.tData.length > 0
  const showGraph = !store.isManualTiming || store.isTimingStarted
  updateGraph(0, 0, showGraph && hasData)

  updateKennwerte()

  // Manuelle Zeitmessung: Start-Button sichtbar/aktiviert je nach Modus
  if (store.isManualTiming) {
    DOM.startTimingContainer.style.visibility = 'visible'
    DOM.startTimingButton.style.opacity = '0.5'
    DOM.startTimingButton.disabled = true
  } else {
    DOM.startTimingContainer.style.visibility = 'hidden'
  }

  applyStopwatchMode()
}

// ── Animation ────────────────────────────────────────────────────────────────
function animate(currentTime) {
  if (!store.lastFrameTime) store.lastFrameTime = currentTime
  let deltaTime = (currentTime - store.lastFrameTime) / 1000
  if (deltaTime > 0.1) deltaTime = 0.1 // Sprünge nach Tab-Wechsel begrenzen
  store.lastFrameTime = currentTime

  store.visualTime += deltaTime * store.speedFactor

  // B21: isActive = wird gemessen/angezeigt? currentSimTime ist die ANGEZEIGTE
  // Zeit (Stoppuhr/Label/Diagrammachse) = visualTime - timingOffset, startet
  // bei 0 im Moment des Klicks auf "Zeitmessung starten" (timingOffset =
  // visualTime zu diesem Zeitpunkt). Physik-Lookups (interpolateAt) nutzen
  // weiterhin die ABSOLUTE visualTime — sonst Phasensprung im Diagramm, da
  // die Schwingung (Feder) beim Klick nicht bei Auslenkung=Amplitude steht.
  const isActive = !store.isManualTiming || store.isTimingStarted
  const currentSimTime = isActive ? store.visualTime - store.timingOffset : 0

  if (isActive && store.tData.length > 0 && store.visualTime >= store.tData[store.tData.length - 1]) {
    extendMotionData(Math.max(4 * store.T, 10))
    recalculateAxisLimits()
  }

  // Szene aus visualTime (Masse schwingt auch im manuellen Modus vor Start)
  const x = displacement(store.visualTime)
  const v = velocity(store.visualTime)
  const a = acceleration(store.visualTime)
  updateScene(currentSimTime, x, v, a, store.centers)

  // Diagramm: Linien + aktueller Punkt werden in render.js aus den
  // precompute-Arrays + analytischen Funktionen gezeichnet (I7: bis zu
  // 3 Linien für das Energie-Composite).
  updateGraph(isActive ? store.visualTime : 0, store.timingOffset, isActive)

  store.aniFrameId = requestAnimationFrame(animate)
}

function startAnimation() {
  if (store.aniFrameId) return
  // Parameteränderung während Play → Reset mit isPlayTrigger=true (Zeit nicht zurücksetzen)
  if (store.visualTime < 1e-9) resetSim(true)
  if (store.isManualTiming && !store.isTimingStarted) {
    DOM.startTimingButton.style.opacity = '1.0'
    DOM.startTimingButton.disabled = false
  }
  store.lastFrameTime = 0
  store.aniFrameId = requestAnimationFrame(animate)
  DOM.playBtn.disabled = true
  DOM.pauseBtn.disabled = false
  ;[DOM.massSlider, DOM.kSlider, DOM.pos0Slider, ...DOM.orientationRadios, DOM.togManualTiming].forEach(el => el.disabled = true)
}

function stopAnimation() {
  if (store.aniFrameId) cancelAnimationFrame(store.aniFrameId)
  store.aniFrameId = null
  DOM.playBtn.disabled = false
  DOM.pauseBtn.disabled = true
  ;[DOM.massSlider, DOM.kSlider, DOM.pos0Slider, ...DOM.orientationRadios, DOM.togManualTiming].forEach(el => el.disabled = false)
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

function exportDiagramCSV() {
  if (store.tData.length === 0) return
  const sym = store.oscillationMode === 'horizontal' ? 'x' : 'y'
  // Energie-Composite exportiert alle drei Energiespalten (I7).
  if (store.graphType === 'ecomposite') {
    const rows = [['Zeit t (s)', 'E_kin (J)', 'E_pot (J)', 'E_ges (J)']]
    for (let i = 0; i < store.tData.length; i++) {
      rows.push([toCsv(store.tData[i]), toCsv(store.ekData[i], 3), toCsv(store.epData[i], 3), toCsv(store.egesData[i], 3)])
    }
    downloadCSV('federpendel_energie.csv', rows)
    return
  }
  const headers = {
    pos_t: `Zeit t (s);Auslenkung ${sym} (m)`,
    v_t:   `Zeit t (s);Geschwindigkeit v (m/s)`,
    a_t:   `Zeit t (s);Beschleunigung a (m/s²)`,
    ekin:  `Zeit t (s);Kinetische Energie E_kin (J)`,
    epot:  `Zeit t (s);Potentielle Energie E_pot (J)`,
    eges:  `Zeit t (s);Gesamtenergie E_ges (J)`,
  }
  const dataKey = { pos_t: 'xData', v_t: 'vData', a_t: 'aData',
                    ekin: 'ekData', epot: 'epData', eges: 'egesData' }[store.graphType]
  const rows = [headers[store.graphType].split(';')]
  const decimals = store.graphType.startsWith('e') ? 3 : 4
  for (let i = 0; i < store.tData.length; i++) {
    rows.push([toCsv(store.tData[i]), toCsv(store[dataKey][i], decimals)])
  }
  downloadCSV(`federpendel_${store.graphType}.csv`, rows)
}

function exportAllCSV() {
  if (store.tData.length === 0) return
  const sym = store.oscillationMode === 'horizontal' ? 'x' : 'y'
  const rows = [[
    'Zeit t (s)', `Auslenkung ${sym} (m)`, 'Geschwindigkeit v (m/s)', 'Beschleunigung a (m/s²)',
    'E_kin (J)', 'E_pot (J)', 'E_ges (J)',
  ]]
  for (let i = 0; i < store.tData.length; i++) {
    rows.push([
      toCsv(store.tData[i]), toCsv(store.xData[i]), toCsv(store.vData[i]), toCsv(store.aData[i]),
      toCsv(store.ekData[i], 3), toCsv(store.epData[i], 3), toCsv(store.egesData[i], 3),
    ])
  }
  downloadCSV('federpendel_alle_daten.csv', rows)
}

// ── Event-Wiring ─────────────────────────────────────────────────────────────
function setupUI() {
  DOM.massSlider.addEventListener('input', () => { DOM.massValue.textContent = `${parseFloat(DOM.massSlider.value).toFixed(1)} kg`; resetSim(false) })
  DOM.kSlider.addEventListener('input', () => { DOM.kValue.textContent = `${parseFloat(DOM.kSlider.value).toFixed(0)} N/m`; resetSim(false) })
  DOM.pos0Slider.addEventListener('input', () => { DOM.pos0Value.textContent = `${parseFloat(DOM.pos0Slider.value).toFixed(2)} m`; resetSim(false) })
  DOM.orientationRadios.forEach(r => r.addEventListener('change', () => resetSim(false)))
  DOM.speedRadios.forEach(r => r.addEventListener('change', () => { store.speedFactor = parseFloat(r.value) }))
  DOM.graphSelect.addEventListener('change', () => { store.graphType = DOM.graphSelect.value; resetSim(false) })

  DOM.togPosition.addEventListener('change', () => { DOM.positionVector.style.visibility = DOM.togPosition.checked ? 'visible' : 'hidden' })
  DOM.togVelocity.addEventListener('change', () => { DOM.velocityVector.style.visibility = DOM.togVelocity.checked ? 'visible' : 'hidden' })
  DOM.togAcceleration.addEventListener('change', () => { DOM.accelerationVector.style.visibility = DOM.togAcceleration.checked ? 'visible' : 'hidden' })
  DOM.togManualTiming.addEventListener('change', () => resetSim(false))

  DOM.playBtn.addEventListener('click', startAnimation)
  DOM.pauseBtn.addEventListener('click', stopAnimation)
  DOM.resetBtn.addEventListener('click', () => { store.visualTime = 0; resetSim(false) })
  DOM.exportDiagram.addEventListener('click', exportDiagramCSV)
  DOM.exportAll.addEventListener('click', exportAllCSV)

  // Manuelle Zeitmessung (B21): Startpunkt der ANGEZEIGTEN Zeit merken, statt
  // sie auf visualTime zu setzen — sonst würde die Anzeige sofort auf die
  // bereits verstrichene Zeit springen statt bei 0 zu beginnen.
  DOM.startTimingButton.addEventListener('click', () => {
    store.isTimingStarted = true
    store.timingOffset = store.visualTime
    DOM.startTimingContainer.style.visibility = 'hidden'
  })

  // Stoppuhr: Klick schaltet analog ↔ digital
  DOM.stopwatch.addEventListener('click', () => {
    store.isDigitalDisplay = !store.isDigitalDisplay
    applyStopwatchMode()
  })

  // Einklappbare Analyse-Sidebar (Chevron rotates via CSS)
  DOM.analysisToggle?.addEventListener('click', () => {
    const collapsed = DOM.appLayout.classList.toggle('analysis-collapsed')
    DOM.analysisToggle.setAttribute('aria-expanded', String(!collapsed))
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
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
function init() {
  initDOM()
  setupTheme()
  drawStopwatchMarks()
  drawSubdialMarks()
  initDigitalDisplaySegments()
  populateGraphSelect()
  setupUI()
  // Hover-Werte am Diagramm (I13.1)
  attachGraphHover(DOM.graphHitRect, {
    onMove: x => updateGraphHover(x),
    onLeave: () => updateGraphHover(null),
  })
  resetSim(false)
}

init()