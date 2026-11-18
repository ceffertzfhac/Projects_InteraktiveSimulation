'use strict'

import {
  SIM_DURATION, ANIM_CX, ANIM_CY, DEFAULT_PIXELS_PER_METER,
  graphOptions, csvHeader, allCsvQuantities, PRESETS,
} from './constants.js'
import { store, DOM, initDOM } from './state.js'
import { precompute, calculatePreciseStopTime } from './physics.js'
import { fmt, bFaktor, drawBackground, updateScene, updateGraphHover } from './render.js'
import { attachGraphHover } from '../../shared/js/hover.js'
import { exportSVG, exportPNG } from '../../shared/js/export-image.js'

const RAD = Math.PI / 180

// ── Diagramm-Dropdowns füllen ────────────────────────────────────────────────
function setupGraphSelects() {
  ;[DOM.graphSelect1, DOM.graphSelect2].forEach(select => {
    select.innerHTML = ''
    for (const groupLabel in graphOptions) {
      const group = document.createElement('optgroup')
      group.label = groupLabel
      for (const value in graphOptions[groupLabel]) {
        const opt = document.createElement('option')
        opt.value = value
        opt.innerHTML = graphOptions[groupLabel][value]
        group.appendChild(opt)
      }
      select.appendChild(group)
    }
  })
  DOM.graphSelect1.value = store.graphType1
  DOM.graphSelect2.value = store.graphType2
}

// ── Animation stoppen ────────────────────────────────────────────────────────
function enableControls(enable) {
  const els = [
    DOM.radiusSlider, DOM.omega0Slider, DOM.phi0Slider, DOM.alphaSlider,
    DOM.viewSelect, DOM.angleUnitSelect, DOM.motionModeSelect,
    DOM.vrSlider, DOM.hSlider,
    ...DOM.diagramModeRadios, ...DOM.speedRadios,
    ...DOM.rDecompRadios, ...DOM.vDecompRadios, ...DOM.aDecompRadios,
  ]
  els.forEach(e => { e.disabled = !enable })
  // Modus-/Ansichts-abhängige Disabled-States wiederherstellen
  const isISO = store.currentView === 'ISO'
  const isKreis = store.motionMode !== 'spirale'   // „kreis“ und „scheibe“
  DOM.hSlider.disabled = enable && !isISO
  DOM.vrSlider.disabled = enable && isKreis
  if (enable && isISO) {
    ;[...DOM.rDecompRadios, ...DOM.vDecompRadios, ...DOM.aDecompRadios].forEach(r => r.disabled = true)
  }
}

function stopAnimation() {
  if (store.aniFrameId) cancelAnimationFrame(store.aniFrameId)
  store.aniFrameId = null
  store.isAutoStopping = false
  DOM.playBtn.disabled = false
  DOM.pauseBtn.disabled = true
  enableControls(true)
}

// FX5: Auto-Stopp-Ziel (n·90°) jenseits des Precompute-Horizonts (120s bzw.
// effectiveDuration bei Spiral-Kollaps) wird sonst still verfehlt — die
// regulären Sim-Ende-Guards stoppen zuerst, ohne daß der Nutzer erfährt,
// daß n·90° nie erreicht wurde.
function showAutoStopWarning() { DOM.autoStopWarning.style.display = '' }
function hideAutoStopWarning() { DOM.autoStopWarning.style.display = 'none' }

// ── Layout-Umschalter (Sim & Diagramm übereinander / nebeneinander — FX6) ────
// Einheitlich mit Kreisbewegung: Topbar-Button #layout_toggle, Klasse
// .layout-split an #center_area, Button-Text swap. Wechsel ist reiner Redraw,
// die Sim-Zeit wird nicht zurückgesetzt.
// Bei Fensterbreite ≤ 1100 px erzwingt das CSS das gestapelte Layout → Button
// ausgrauen, Hover-Hinweis (Native-Tooltip auch am disabled-Button).
const _LAYOUT_TITLE = 'Layout: Simulation & Diagramm übereinander / nebeneinander'
const _NARROW_MQ = window.matchMedia('(max-width: 1100px)')
function updateLayoutAvailability() {
  if (!DOM.layoutToggle) return
  DOM.layoutToggle.disabled = _NARROW_MQ.matches
  DOM.layoutToggle.title = _NARROW_MQ.matches
    ? 'Nebeneinander ist erst ab ca. 1100 px Fensterbreite möglich – bitte Fenster vergrößern.'
    : _LAYOUT_TITLE
}
_NARROW_MQ.addEventListener('change', updateLayoutAvailability)

function applyLayout() {
  updateLayoutAvailability()
  DOM.centerArea.classList.toggle('layout-split', store.layoutSplit)
  DOM.layoutToggle.textContent = store.layoutSplit ? 'Übereinander' : 'Nebeneinander'
}

// ── Pill-Active-State (kanonisch vgl. Atwood .radio-pill) ────────────────────
// Die shared .speed-pill blendet das Radio aus (opacity:0) → die gewählte Pille
// braucht die .active-Klasse, damit sie als ausgewählt highlightet. Gilt für die
// Abspielgeschwindigkeit und den Diagrammmodus (Ein/Zwei), einheitlich.
function syncPills(groupEl) {
  if (!groupEl) return
  groupEl.querySelectorAll('.speed-pill').forEach(p => {
    p.classList.toggle('active', p.querySelector('input').checked)
  })
}

// ── Reset (aus resetScene) ───────────────────────────────────────────────────
function resetSim(isPlayTrigger = false) {
  stopAnimation()
  hideAutoStopWarning()

  if (!isPlayTrigger) {
    store.simulatedTime = 0
    store.lastFrameTime = 0
    store.isAutoStopping = false
  }

  // Wechsel in den Modus „Rotierende Scheibe“: Standardansicht = 2D, alle Vektoren aus
  // (FX11, PO 2026-11-18); das Analyse-Panel bleibt, wie der Nutzer es hatte.
  // Nur beim Wechsel, danach bleibt alles dem Nutzer überlassen.
  if (!isPlayTrigger && DOM.motionModeSelect.value === 'scheibe' && store.lastMode !== 'scheibe') {
    DOM.viewSelect.value = '2D'
    ;[DOM.togglePosition, DOM.toggleVelocity, DOM.toggleAcceleration].forEach(t => { t.checked = false })
    ;['r_decomp', 'v_decomp', 'a_decomp'].forEach(n => {
      document.querySelector(`input[name="${n}"][value="none"]`).checked = true
    })
  }
  store.lastMode = DOM.motionModeSelect.value

  // B63: Die Scheibe (Punkt B, Vergleichstabelle) gibt es nur in 2D → ISO im Modus sperren,
  // mit sichtbarem Hinweis in der Auswahl statt stummem Verlust.
  const scheibe = DOM.motionModeSelect.value === 'scheibe'
  const isoOpt = DOM.viewSelect.querySelector('option[value="ISO"]')
  isoOpt.disabled = scheibe
  isoOpt.textContent = scheibe ? '3D (ISO-Ansicht) – nicht bei Rotierender Scheibe' : '3D (ISO-Ansicht)'
  if (scheibe && DOM.viewSelect.value === 'ISO') DOM.viewSelect.value = '2D'

  // Controls → Store
  store.currentView = DOM.viewSelect.value
  store.angleUnit = DOM.angleUnitSelect.value
  store.motionMode = DOM.motionModeSelect.value
  store.diagramMode = document.querySelector('input[name="diagram_mode"]:checked').value
  const decompVal = name => {
    const r = document.querySelector(`input[name="${name}"]:checked`)
    return r ? r.value : 'none'
  }
  store.rDecomp = decompVal('r_decomp')
  store.vDecomp = decompVal('v_decomp')
  store.aDecomp = decompVal('a_decomp')

  store.R0 = parseFloat(DOM.radiusSlider.value)
  store.vr = parseFloat(DOM.vrSlider.value)
  store.h = parseFloat(DOM.hSlider.value)
  const omega0Deg = parseFloat(DOM.omega0Slider.value)
  const phi0Deg = parseFloat(DOM.phi0Slider.value)
  const alphaDeg = parseFloat(DOM.alphaSlider.value)
  DOM.speedRadios.forEach(r => { if (r.checked) store.speedFactor = parseFloat(r.value) })
  store.graphType1 = DOM.graphSelect1.value
  store.graphType2 = DOM.graphSelect2.value
  // FX13: Punktauswahl je Diagramm nur im Scheibenmodus
  ;[1, 2].forEach(i => {
    store.graphPoints[i] = DOM.graphPoints[i].value
    DOM.graphPointsControl[i].style.display = DOM.motionModeSelect.value === 'scheibe' ? '' : 'none'
  })

  store.togPosition = DOM.togglePosition.checked
  store.togVelocity = DOM.toggleVelocity.checked
  store.togAcceleration = DOM.toggleAcceleration.checked
  store.togOmega = DOM.toggleOmega.checked
  store.togAlpha = DOM.toggleAlpha.checked
  store.togPhi = DOM.togglePhi.checked
  store.togTrajectory = DOM.toggleTrajectory.checked
  store.togRadius = DOM.toggleRadius.checked
  store.scaleAt = DOM.toggleAtScaling.checked

  const isISO = store.currentView === 'ISO'
  const isKreis = store.motionMode !== 'spirale'   // „kreis“ und „scheibe“ haben konstanten Radius

  // ISO: Zerlegungen deaktivieren; Kreis: v_r aus; 2D: h aus
  if (isISO) {
    store.rDecomp = 'none'; document.querySelector('input[name="r_decomp"][value="none"]').checked = true
    store.vDecomp = 'none'; document.querySelector('input[name="v_decomp"][value="none"]').checked = true
    store.aDecomp = 'none'; document.querySelector('input[name="a_decomp"][value="none"]').checked = true
    ;[...DOM.rDecompRadios, ...DOM.vDecompRadios, ...DOM.aDecompRadios].forEach(r => r.disabled = true)
  } else {
    ;[...DOM.rDecompRadios, ...DOM.vDecompRadios, ...DOM.aDecompRadios].forEach(r => r.disabled = false)
  }
  DOM.hSlider.disabled = !isISO
  DOM.vrControlWrapper.style.display = isKreis ? 'none' : ''
  DOM.vrSlider.disabled = isKreis
  if (isKreis) { DOM.vrSlider.value = 0; store.vr = 0 }
  if (!isISO) { DOM.hSlider.value = 0; store.h = 0 }

  // Statisches MathJax: Radius-Label + Formelbox umschalten
  // Kreis gleichförmig (α=0) · Kreis ungleichförmig (α≠0) · Spirale (B11)
  // Achtung: alphaDeg (frisch gelesen) nehmen, nicht store.alpha_rad — letzterer
  // wird erst weiter unten gesetzt, sonst hinkt die Umschaltung einen Wert hinterher.
  const alphaNonZero = Math.abs(alphaDeg) > 1e-6
  DOM.radiusLabelKreis.style.display = isKreis ? '' : 'none'
  DOM.radiusLabelSpiral.style.display = isKreis ? 'none' : ''
  DOM.formulasKreis.style.display = (isKreis && !alphaNonZero) ? '' : 'none'
  DOM.formulasKreisAcc.style.display = (isKreis && alphaNonZero) ? '' : 'none'
  DOM.formulasSpiral.style.display = isKreis ? 'none' : ''

  // Wert-Labels (deg/rad)
  DOM.radiusValue.textContent = `${fmt(store.R0, 1)} m`
  DOM.vrValue.textContent = `${fmt(store.vr, 2)} m/s`
  DOM.hValue.textContent = `${fmt(store.h, 1)} m`
  const angDisp = deg => store.angleUnit === 'rad' ? (deg * RAD).toFixed(2) : deg
  const angUnit = (u) => store.angleUnit === 'rad' ? u.replace('°', 'rad') : u
  DOM.phi0Value.textContent = `${angDisp(phi0Deg)} ${angUnit('°')}`
  DOM.omega0Value.textContent = `${angDisp(omega0Deg)} ${angUnit('°/s')}`
  DOM.alphaValue.textContent = `${angDisp(alphaDeg)} ${angUnit('°/s²')}`

  store.omega0_rad = omega0Deg * RAD
  store.phi0_rad = phi0Deg * RAD
  store.alpha_rad = alphaDeg * RAD

  // Auto-Stopp: bei ruhender Bewegung deaktivieren
  const stationary = Math.abs(store.omega0_rad) < 1e-6 && Math.abs(store.alpha_rad) < 1e-6
  DOM.autoStopCheckbox.disabled = stationary
  if (stationary) {
    DOM.autoStopCheckbox.checked = false
    DOM.nControlGroup.style.display = 'none'
  }

  // Dual-Graph-Sichtbarkeit + Anordnung (übereinander / nebeneinander — FX6, einheitlich mit Kreisbewegung)
  DOM.dualGraphControl.style.display = (store.diagramMode === '2') ? '' : 'none'
  DOM.graphGroup2.style.visibility = (store.diagramMode === '2') ? 'visible' : 'hidden'
  syncPills(DOM.diagramModeGroup)
  syncPills(DOM.speedGroup)
  applyLayout()

  // Zoom
  store.currentPixelsPerMeter = Math.min(DEFAULT_PIXELS_PER_METER, (Math.min(ANIM_CX, ANIM_CY) * 0.9) / store.R0)
  store.zoomFactor = store.currentPixelsPerMeter / DEFAULT_PIXELS_PER_METER
  DOM.zoomTextDisplay.innerHTML = `Zoom: ${store.zoomFactor.toFixed(2)}<i>x</i>`

  // ω/α-Vektoren nur in ISO
  DOM.toggleOmega.disabled = !isISO
  DOM.toggleAlpha.disabled = !isISO
  if (!isISO) { DOM.toggleOmega.checked = false; DOM.toggleAlpha.checked = false; store.togOmega = false; store.togAlpha = false }

  // Zerlegungs-Fieldsets nur wenn Elternvektor an
  DOM.rDecompFieldset.style.display = DOM.togglePosition.checked ? '' : 'none'
  DOM.vDecompFieldset.style.display = DOM.toggleVelocity.checked ? '' : 'none'
  DOM.aDecompFieldset.style.display = DOM.toggleAcceleration.checked ? '' : 'none'
  DOM.toggleAtScaling.disabled = (store.aDecomp !== 'polar')
  if (store.aDecomp !== 'polar') { DOM.toggleAtScaling.checked = false; store.scaleAt = false }

  DOM.stopwatch.style.visibility = store.stopwatchVisible ? 'visible' : 'hidden'

  if (!isPlayTrigger) {
    precompute()
    drawBackground()
  }

  updateScene(store.simulatedTime)
}

// ── Animationsschleife ───────────────────────────────────────────────────────
function animate(ts) {
  if (!store.lastFrameTime) store.lastFrameTime = ts
  const dt = (ts - store.lastFrameTime) / 1000
  const timeBeforeFrame = store.simulatedTime
  store.simulatedTime += dt * store.speedFactor
  store.lastFrameTime = ts

  // Auto-Stopp: Überquerung des Zielwinkels → exakt stoppen
  if (store.isAutoStopping) {
    const curPhi = store.phi0_rad + store.omega0_rad * store.simulatedTime + 0.5 * store.alpha_rad * store.simulatedTime ** 2
    const crossed = (store.autoStopDirection > 0 && curPhi >= store.autoStopTargetAngle && store.lastPhiForStop < store.autoStopTargetAngle) ||
                    (store.autoStopDirection < 0 && curPhi <= store.autoStopTargetAngle && store.lastPhiForStop > store.autoStopTargetAngle)
    if (crossed) {
      const omegaAtStart = store.omega0_rad + store.alpha_rad * timeBeforeFrame
      const tStop = calculatePreciseStopTime(store.autoStopTargetAngle, omegaAtStart, store.alpha_rad, store.lastPhiForStop, timeBeforeFrame)
      if (tStop !== null && tStop >= timeBeforeFrame) {
        store.simulatedTime = tStop
        updateScene(store.simulatedTime)
        stopAnimation()
        return
      }
    }
  }

  // Spiral-R→0 / Sim-Ende
  if (store.simulatedTime >= store.effectiveDuration) {
    store.simulatedTime = store.effectiveDuration
    updateScene(store.simulatedTime)
    if (store.isAutoStopping) showAutoStopWarning()
    stopAnimation()
    return
  }
  if (store.simulatedTime >= SIM_DURATION) {
    store.simulatedTime = SIM_DURATION
    updateScene(store.simulatedTime)
    if (store.isAutoStopping) showAutoStopWarning()
    stopAnimation()
    return
  }

  updateScene(store.simulatedTime)
  store.lastPhiForStop = store.phi0_rad + store.omega0_rad * store.simulatedTime + 0.5 * store.alpha_rad * store.simulatedTime ** 2
  store.aniFrameId = requestAnimationFrame(animate)
}

function startAnimation() {
  if (store.aniFrameId) return
  if (store.simulatedTime < 1e-6) resetSim(true)
  hideAutoStopWarning()

  if (DOM.autoStopCheckbox.checked) {
    store.isAutoStopping = true
    const startPhi = store.phi0_rad + store.omega0_rad * store.simulatedTime + 0.5 * store.alpha_rad * store.simulatedTime ** 2
    const omegaNow = store.omega0_rad + store.alpha_rad * store.simulatedTime
    store.lastPhiForStop = startPhi
    store.autoStopDirection = Math.sign(omegaNow) || Math.sign(store.alpha_rad) || 1
    store.autoStopTargetAngle = startPhi + store.autoStopDirection * store.nStop * (Math.PI / 2)
  } else {
    store.isAutoStopping = false
  }

  DOM.playBtn.disabled = true
  DOM.pauseBtn.disabled = false
  enableControls(false)
  store.lastFrameTime = 0
  store.aniFrameId = requestAnimationFrame(animate)
}

// ── CSV-Export ───────────────────────────────────────────────────────────────
function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// FX13: Im Scheibenmodus Spalten je Punkt — „(A)“ = Rand, „(B)“ = Mitte (B = Faktor × A)
function csvColumns(qq, sel = 'ab') {
  const fd = store.fullData, a = fd[`p_${qq}`]
  if (store.motionMode !== 'scheibe') return [[csvHeader[qq], a]]
  if (sel === 'ab' && bFaktor(qq) === 1) return [[csvHeader[qq], a]]   // φ/ω/α: für A und B gleich
  const cols = []
  if (sel !== 'b') cols.push([`${csvHeader[qq]} (A)`, a])
  if (sel !== 'a') { const f = bFaktor(qq); cols.push([`${csvHeader[qq]} (B)`, a.map(v => v * f)]) }
  return cols
}

function exportDiagramCSV() {
  const fd = store.fullData
  if (!fd.t || !fd.t.length) { alert('Es gibt keine Daten zum Exportieren. Bitte starten Sie zuerst die Simulation.'); return }
  const cols = [...csvColumns(store.graphType1, store.graphPoints[1]),
    ...(store.diagramMode === '2' ? csvColumns(store.graphType2, store.graphPoints[2]) : [])]
  const headers = ['t / s', ...cols.map(c => c[0])]
  const arrays = [fd.t, ...cols.map(c => c[1])]
  const rows = [`sep=;\n${headers.join(';')}`]
  for (let i = 0; i < fd.t.length; i++) {
    rows.push(arrays.map(arr => arr[i] !== undefined ? fmt(arr[i], 4) : '').join(';'))
  }
  downloadCSV(rows.join('\n'), 'diagramm_daten.csv')
}

function exportAllCSV() {
  const fd = store.fullData
  if (!fd.t || !fd.t.length) { alert('Es gibt keine Daten zum Exportieren. Bitte starten Sie zuerst die Simulation.'); return }
  const cols = allCsvQuantities.flatMap(q => csvColumns(q))
  const headers = ['t / s', ...cols.map(c => c[0])]
  const rows = [`sep=;\n${headers.join(';')}`]
  for (let i = 0; i < fd.t.length; i++) {
    rows.push([fmt(fd.t[i], 4), ...cols.map(c => fmt(c[1][i], 4))].join(';'))
  }
  downloadCSV(rows.join('\n'), 'alle_simulationsdaten.csv')
}

// ── Preset laden ─────────────────────────────────────────────────────────────
function loadPreset(preset) {
  const p = PRESETS[preset]
  if (!p) return
  // Kreisbahn-Presets (gleich/start/brems) gelten auch im Modus „Rotierende Scheibe“
  if (!(p.mode === 'kreis' && DOM.motionModeSelect.value === 'scheibe')) DOM.motionModeSelect.value = p.mode
  DOM.radiusSlider.value = p.R0
  DOM.vrSlider.value = p.vr
  DOM.omega0Slider.value = p.omega0
  DOM.alphaSlider.value = p.alpha
  DOM.presetSelect.value = 'none'
  store.simulatedTime = 0
  store.nStop = 1
  DOM.nValueDisplay.textContent = store.nStop
  resetSim(false)
}

// ── Theme ────────────────────────────────────────────────────────────────────
function setupTheme() {
  const saved = localStorage.getItem('fh_theme') || 'light'
  document.body.className = saved
  DOM.themeToggle.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark')
    document.body.classList.toggle('light', !dark)
    localStorage.setItem('fh_theme', dark ? 'dark' : 'light')
    drawBackground()
    updateScene(store.simulatedTime)
  })
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
initDOM()
setupTheme()
setupGraphSelects()
// Layout-Vorzug aus localStorage wiederherstellen (default: übereinander)
store.layoutSplit = localStorage.getItem('ks_layout') === 'split'
applyLayout()

// Voll-Reset-Controls
;[
  ...DOM.rDecompRadios, ...DOM.vDecompRadios, ...DOM.aDecompRadios,
  DOM.angleUnitSelect, DOM.viewSelect, DOM.motionModeSelect, ...DOM.speedRadios,
  DOM.radiusSlider, DOM.omega0Slider, DOM.phi0Slider, DOM.alphaSlider, DOM.vrSlider, DOM.hSlider,
].forEach(el => el.addEventListener('change', () => resetSim(false)))

// Diagramm-Modus (nur Redraw, kein Precompute)
DOM.diagramModeRadios.forEach(r => r.addEventListener('change', () => {
  store.diagramMode = document.querySelector('input[name="diagram_mode"]:checked').value
  const dual = store.diagramMode === '2'
  DOM.dualGraphControl.style.display = dual ? '' : 'none'
  DOM.graphGroup2.style.visibility = dual ? 'visible' : 'hidden'
  syncPills(DOM.diagramModeGroup)
  updateScene(store.simulatedTime)
}))
DOM.graphSelect1.addEventListener('change', () => { store.graphType1 = DOM.graphSelect1.value; updateScene(store.simulatedTime) })
DOM.graphSelect2.addEventListener('change', () => { store.graphType2 = DOM.graphSelect2.value; updateScene(store.simulatedTime) })
;[1, 2].forEach(i => DOM.graphPoints[i].addEventListener('change', () => {
  store.graphPoints[i] = DOM.graphPoints[i].value
  updateScene(store.simulatedTime)
}))

// Anordnung Sim/Diagramm (nur Redraw, kein Reset — FX6, einheitlich mit Kreisbewegung)
DOM.layoutToggle?.addEventListener('click', () => {
  store.layoutSplit = !store.layoutSplit
  localStorage.setItem('ks_layout', store.layoutSplit ? 'split' : 'stacked')
  applyLayout()
  updateScene(store.simulatedTime)
})

// Redraw-Only-Toggles
;[DOM.toggleOmega, DOM.toggleAlpha, DOM.togglePhi, DOM.toggleRadius, DOM.toggleTrajectory, DOM.toggleAtScaling].forEach(cb =>
  cb.addEventListener('change', () => { resetSim(true) }))

// Vektor-Toggles: Fieldset ein/aus + decomp zurücksetzen
function wireVectorToggle(toggle, fieldset, radioName) {
  toggle.addEventListener('change', () => {
    fieldset.style.display = toggle.checked ? '' : 'none'
    if (!toggle.checked) {
      const none = document.querySelector(`input[name="${radioName}"][value="none"]`)
      if (none) none.checked = true
    }
    resetSim(true)
  })
}
wireVectorToggle(DOM.togglePosition, DOM.rDecompFieldset, 'r_decomp')
wireVectorToggle(DOM.toggleVelocity, DOM.vDecompFieldset, 'v_decomp')
wireVectorToggle(DOM.toggleAcceleration, DOM.aDecompFieldset, 'a_decomp')

// Zeichenreihenfolge: zuletzt eingeschaltete Vektoren — und zuletzt gewählte Zerlegungen —
// liegen zuoberst. Ein Vektor wandert samt seinen Komponenten (x/y bzw. r/t) vor den
// Massenpunkt, der immer ganz oben bleibt. Die Komponenten-Linien werden dabei aus der
// Hilfsgruppe `vector_components_group` in dieselbe Ebene wie die Hauptvektoren gehoben.
function bringToFront(base) {
  ;[base, `${base}_x`, `${base}_y`, `${base}_r`, `${base}_t`].forEach(id => {
    const el = document.getElementById(id)
    if (el) DOM.point.parentNode.insertBefore(el, DOM.point)
  })
}
;[[DOM.togglePosition, 'position_vector', 'r_decomp'],
  [DOM.toggleVelocity, 'velocity_vector', 'v_decomp'],
  [DOM.toggleAcceleration, 'acceleration_vector', 'a_decomp'],
  [DOM.toggleOmega, 'omega_vector'], [DOM.toggleAlpha, 'alpha_vector']].forEach(([toggle, base, radioName]) => {
  toggle.addEventListener('change', () => { if (toggle.checked) bringToFront(base) })
  if (radioName) {
    document.querySelectorAll(`input[name="${radioName}"]`).forEach(r =>
      r.addEventListener('change', () => { if (r.checked && r.value !== 'none') bringToFront(base) }))
  }
})

// Stoppuhr-Sichtbarkeit
DOM.stopwatch.addEventListener('click', () => {
  store.stopwatchVisible = !store.stopwatchVisible
  DOM.stopwatch.style.visibility = store.stopwatchVisible ? 'visible' : 'hidden'
})

// Auto-Stopp + n-Stepper
DOM.autoStopCheckbox.addEventListener('change', () => {
  DOM.nControlGroup.style.display = DOM.autoStopCheckbox.checked ? 'flex' : 'none'
})
DOM.nPlusBtn.addEventListener('click', () => { store.nStop++; DOM.nValueDisplay.textContent = store.nStop })
DOM.nMinusBtn.addEventListener('click', () => { if (store.nStop > 1) { store.nStop--; DOM.nValueDisplay.textContent = store.nStop } })

DOM.presetSelect.addEventListener('change', e => loadPreset(e.target.value))

DOM.playBtn.addEventListener('click', startAnimation)
DOM.pauseBtn.addEventListener('click', stopAnimation)
DOM.resetBtn.addEventListener('click', () => {
  store.simulatedTime = 0
  store.nStop = 1
  DOM.nValueDisplay.textContent = store.nStop
  // B64: Reset = Standardwerte des AKTUELLEN Modus — Kreisbahn und Scheibe „Gleichförmig“,
  // Spiralbahn „Spirale (außen)“; der Modus selbst bleibt.
  loadPreset(DOM.motionModeSelect.value === 'spirale' ? 'spirale_aussen' : 'gleich')
})
DOM.exportDiagram.addEventListener('click', exportDiagramCSV)
DOM.exportAll.addEventListener('click', exportAllCSV)
DOM.exportSvg.addEventListener('click', () => exportSVG(DOM.graphSvg, 'kreis_spiralbewegung_diagramm.svg'))
DOM.exportPng.addEventListener('click', () => exportPNG(DOM.graphSvg, 'kreis_spiralbewegung_diagramm.png'))

DOM.analysisToggle.addEventListener('click', () => {
  const collapsed = DOM.appLayout.classList.toggle('analysis-collapsed')
  DOM.analysisToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
  // Sidebar-Umschaltung ändert die Zell-Form → Graph-Format live nachrechnen
  updateScene(store.simulatedTime)
})

// Akkordeon-Steuerungs-Sidebar (Prototyp): linke Cluster ein-/ausklappbar.
// .panel-label ist <button> → Enter/Space triggert click nativ.
document.querySelectorAll('.panel-section.collapsible > .panel-label').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.parentElement
    const collapsed = section.classList.toggle('collapsed')
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
  })
})

// Fenster-Resize: Graph-Format (Portrait/Landscape) paßt sich der Zell-Form live
// an — rAF-gedrosselt, sodaß Achsenskalierung/Ticks nachziehen (B9/B10).
let resizeRaf = null
window.addEventListener('resize', () => {
  if (resizeRaf) cancelAnimationFrame(resizeRaf)
  resizeRaf = requestAnimationFrame(() => updateScene(store.simulatedTime))
})

// Hover-Werte am Diagramm (I5) — je ein Hit-Rect pro Diagramm-Slot (1/2),
// da der Dual-Graph-Modus (I9) zwei unabhängige Diagramme zeigen kann.
;[1, 2].forEach(idx => {
  attachGraphHover(DOM.graphHitRect[idx], {
    onMove: x => updateGraphHover(idx, x),
    onLeave: () => updateGraphHover(idx, null),
  })
})

resetSim(false)