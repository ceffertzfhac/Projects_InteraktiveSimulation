'use strict'

// ── ES-Modul-Einstiegspunkt (kein main.js) ─────────────────────────────────────
import { store, DOM, initDOM } from './state.js'
import { T_MAX, GRAPH_OPTIONS } from './constants.js'
import { precompute } from './physics.js'
import { drawStreet, drawGraph, updateScene, updateGraphHover } from './render.js'
import { fmt } from '../../shared/js/format.js'
import { attachGraphHover } from '../../shared/js/hover.js'

// ── Animations-Loop ────────────────────────────────────────────────────────────
function stopAnimation() {
  if (store.aniFrameId) cancelAnimationFrame(store.aniFrameId)
  store.aniFrameId = null
  DOM.playBtn.disabled = false
  DOM.pauseBtn.disabled = true
}

function animate(ts) {
  if (!store.lastFrameTime) store.lastFrameTime = ts
  store.simulatedTime += (ts - store.lastFrameTime) / 1000 * store.speedFactor
  store.lastFrameTime = ts

  if (store.simulatedTime >= store.t_end) {
    store.simulatedTime = store.t_end
    updateScene(store.t_end)
    stopAnimation()
    return
  }
  updateScene(store.simulatedTime)
  store.aniFrameId = requestAnimationFrame(animate)
}

function startAnimation() {
  if (store.aniFrameId) return
  if (store.simulatedTime >= store.t_end) store.simulatedTime = 0   // am Ende → von vorn
  DOM.playBtn.disabled = true
  DOM.pauseBtn.disabled = false
  store.lastFrameTime = 0
  store.aniFrameId = requestAnimationFrame(animate)
}

// ── Reset: Fahrt auf t = 0 ─────────────────────────────────────────────────────
// Der Fahrplan ist fest (keine Physik-Parameter) — precompute() läuft einmal beim
// Start; Reset setzt nur die Zeit zurück.
function resetSim() {
  stopAnimation()
  store.simulatedTime = 0
  store.lastFrameTime = 0
  updateScene(0)
}

// Anzeige-Optionen/Diagrammtyp: neu zeichnen, Zeitpunkt beibehalten
function redraw() {
  store.graphType = DOM.graphSelect.value
  for (const [k, box] of Object.entries(DOM.toggles)) store.toggles[k] = box.checked
  const ortOnly = store.graphType === 'ort'
  DOM.rowHaltestellen.classList.toggle('disabled', !ortOnly)
  DOM.toggles.haltestellen.disabled = !ortOnly
  drawGraph()
  updateScene(store.simulatedTime)
}

// ── Theme (localStorage-Key einheitlich 'fh_theme') ────────────────────────────
function setupTheme() {
  document.body.className = localStorage.getItem('fh_theme') || 'light'
  DOM.themeToggle.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark')
    document.body.classList.toggle('light', !dark)
    localStorage.setItem('fh_theme', dark ? 'dark' : 'light')
  })
}

// ── CSV-Export (Semikolon-Trenner, Komma-Dezimal) ──────────────────────────────
// Doppelte Zeitpunkte an Phasengrenzen (a-Sprung) bleiben im Export erhalten.
const PHASE_CSV = { halt: 'Halt', anfahren: 'Anfahren', konstant: 'gleichförmig', bremsen: 'Bremsen' }

function exportCSV(all) {
  const { t_data, x_data, v_data, a_data, phase_idx, phases, graphType } = store
  if (!t_data.length) return
  let header, rows
  if (all) {
    header = 'sep=;\nt / s;x / m;v / (m/s);a / (m/s²);Phase;Haltestelle'
    rows = t_data.map((_, i) => {
      const p = phases[phase_idx[i]]
      return [fmt(t_data[i], 2), fmt(x_data[i], 3), fmt(v_data[i], 4), fmt(a_data[i], 4),
              PHASE_CSV[p.kind], p.stop ?? ''].join(';')
    })
  } else {
    const arr = { ort: x_data, geschw: v_data, beschl: a_data }[graphType]
    header = `sep=;\nt / s;${GRAPH_OPTIONS[graphType].axis}`
    rows = t_data.map((_, i) => `${fmt(t_data[i], 2)};${fmt(arr[i], 4)}`)
  }
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `busfahrt_${all ? 'alle' : graphType}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Bootstrap ──────────────────────────────────────────────────────────────────
initDOM()
setupTheme()

DOM.tSlider.max = String(T_MAX)
DOM.tSlider.addEventListener('input', () => {
  stopAnimation()
  store.simulatedTime = parseFloat(DOM.tSlider.value)
  updateScene(store.simulatedTime)
})
DOM.graphSelect.addEventListener('change', redraw)
Object.values(DOM.toggles).forEach(box => box.addEventListener('change', redraw))

const syncSpeed = () => {
  DOM.speedRadios.forEach(r => { if (r.checked) store.speedFactor = parseFloat(r.value) })
  document.querySelectorAll('.speed-pill').forEach(p => p.classList.toggle('active', p.querySelector('input').checked))
}
DOM.speedRadios.forEach(r => r.addEventListener('change', syncSpeed))
syncSpeed()

DOM.playBtn.addEventListener('click', startAnimation)
DOM.pauseBtn.addEventListener('click', () => { if (store.aniFrameId) stopAnimation() })
DOM.resetBtn.addEventListener('click', resetSim)
DOM.exportDiagram.addEventListener('click', () => exportCSV(false))
DOM.exportAll.addEventListener('click', () => exportCSV(true))

attachGraphHover(DOM.graphHitRect, {
  onMove: x => updateGraphHover(x),
  onLeave: () => updateGraphHover(null),
})

DOM.analysisToggle.addEventListener('click', () => {
  const collapsed = DOM.appLayout.classList.toggle('analysis-collapsed')
  DOM.analysisToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
})

document.querySelectorAll('.panel-section.collapsible > .panel-label').forEach(btn => {
  btn.addEventListener('click', () => {
    const collapsed = btn.parentElement.classList.toggle('collapsed')
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
  })
})

precompute()
drawStreet()
redraw()
resetSim()
