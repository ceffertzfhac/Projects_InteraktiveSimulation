'use strict'

import { INFINITE_MASS_THRESHOLD, INFINITE_K_THRESHOLD, GRAPH_OPTIONS } from './constants.js'
import { store, DOM, initDOM } from './state.js'
import { precompute } from './physics.js'
import {
  fmt, drawBackground, updateScene, updateGraph, fitCamera,
  drawStopwatchMarks, drawSubdialMarks, ensureAxisMarker,
} from './render.js'

// ── Diagramm-Typ-Picker aus GRAPH_OPTIONS befüllen (kanonisch, → BACKLOG I12
//    Sidebar-Schule; Picker sitzt in der linken Sidebar, nicht am Diagramm).
function populateGraphSelect() {
  DOM.graphSelect.innerHTML = Object.entries(GRAPH_OPTIONS)
    .map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')
  DOM.graphSelect.value = store.graphType
}

// ── Reset ─────────────────────────────────────────────────────────────────────
function resetSim() {
  stopAnimation()
  store.simulatedTime = 0
  store.lastFrameTime = 0

  store.m1 = parseFloat(DOM.m1Slider.value)
  store.m2 = parseFloat(DOM.m2Slider.value)
  store.v1 = parseFloat(DOM.v1Slider.value)
  store.v2 = parseFloat(DOM.v2Slider.value)
  store.k  = parseFloat(DOM.kSlider.value)
  store.m1Inf = store.m1 >= INFINITE_MASS_THRESHOLD
  store.m2Inf = store.m2 >= INFINITE_MASS_THRESHOLD
  store.kInf  = store.k  >= INFINITE_K_THRESHOLD
  if (store.m1Inf) store.v1 = 0
  if (store.m2Inf) store.v2 = 0

  DOM.m1Value.textContent = store.m1Inf ? '∞ kg' : `${fmt(store.m1, 1)} kg`
  DOM.m2Value.textContent = store.m2Inf ? '∞ kg' : `${fmt(store.m2, 1)} kg`
  DOM.v1Value.textContent = `${fmt(store.v1, 1)} m/s`
  DOM.v2Value.textContent = `${fmt(store.v2, 1)} m/s`
  DOM.kValue.textContent  = store.kInf ? '∞ N/m' : `${fmt(store.k, 0)} N/m`
  DOM.v1Slider.disabled = store.m1Inf
  DOM.v2Slider.disabled = store.m2Inf

  store.showVectors = DOM.togVectors.checked
  store.showCom = DOM.togCom.checked
  store.graphType = DOM.graphSelect.value

  precompute()
  fitCamera()
  drawBackground()
  updateScene(0)
  updateGraph(0)

  DOM.timeLabel.innerHTML = '<i>t</i> = 0,000 s'
}

// ── Animation ────────────────────────────────────────────────────────────────
function animate(ts) {
  if (!store.lastFrameTime) store.lastFrameTime = ts
  store.simulatedTime += (ts - store.lastFrameTime) / 1000 * store.speedFactor
  store.lastFrameTime = ts

  const t = Math.min(store.simulatedTime, store.simDuration)
  updateScene(t)
  updateGraph(t)

  if (store.simulatedTime < store.simDuration) {
    store.animFrameId = requestAnimationFrame(animate)
  } else {
    stopAnimation()
  }
}

function startAnimation() {
  if (store.animFrameId) return
  if (store.simulatedTime === 0) resetSim()
  DOM.playBtn.disabled = true
  DOM.pauseBtn.disabled = false
  store.lastFrameTime = 0
  store.animFrameId = requestAnimationFrame(animate)
  ;[DOM.m1Slider, DOM.m2Slider, DOM.v1Slider, DOM.v2Slider, DOM.kSlider].forEach(e => e.disabled = true)
}

function stopAnimation() {
  if (store.animFrameId) cancelAnimationFrame(store.animFrameId)
  store.animFrameId = null
  DOM.playBtn.disabled = false
  DOM.pauseBtn.disabled = true
  DOM.v1Slider.disabled = store.m1Inf
  DOM.v2Slider.disabled = store.m2Inf
  DOM.m1Slider.disabled = false
  DOM.m2Slider.disabled = false
  DOM.kSlider.disabled = false
}

// ── Theme ──────────────────────────────────────────────────────────────────────
function setupTheme() {
  const saved = localStorage.getItem('fh_theme') || 'light'
  document.body.className = saved
  DOM.themeToggle.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark')
    document.body.classList.toggle('light', !dark)
    localStorage.setItem('fh_theme', dark ? 'dark' : 'light')
  })
}

// ── CSV-Export (sep=; · Semikolon-Trenner · Komma-Dezimal) ───────────────────
function toCsv(v, d = 4) {
  return Number.isFinite(v) ? v.toFixed(d).replace('.', ',') : ''
}
function download(csv, name) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function exportDiagramCSV() {
  const { t_data, graphType } = store
  if (!t_data.length) return
  const cols = {
    v: [['v1', store.v1_data, 'v₁ / (m/s)'], ['v2', store.v2_data, 'v₂ / (m/s)']],
    a: [['a1', store.a1_data, 'a₁ / (m/s²)'], ['a2', store.a2_data, 'a₂ / (m/s²)']],
    p: [['p1', store.p1_data, 'p₁ / (kg·m/s)'], ['p2', store.p2_data, 'p₂ / (kg·m/s)']],
    E: [['ek1', store.ek1_data, 'E_kin,1 / J'], ['ek2', store.ek2_data, 'E_kin,2 / J'], ['es', store.es_data, 'E_Feder / J']],
  }[graphType]
  const header = `sep=;\nt / s;${cols.map(c => c[2]).join(';')}`
  const rows = t_data.map((_, i) => [t_data[i], ...cols.map(c => c[1][i])].map(v => toCsv(v)).join(';'))
  download([header, ...rows].join('\n'), `stoss_diagramm_${graphType}.csv`)
}

function exportAllCSV() {
  const { t_data } = store
  if (!t_data.length) return
  const header = 'sep=;\nt / s;x1 / m;x2 / m;v1 / (m/s);v2 / (m/s);a1 / (m/s²);a2 / (m/s²);p1 / (kg·m/s);p2 / (kg·m/s);E_kin1 / J;E_kin2 / J;E_Feder / J'
  const rows = t_data.map((_, i) => [
    t_data[i], store.x1_data[i], store.x2_data[i], store.v1_data[i], store.v2_data[i],
    store.a1_data[i], store.a2_data[i], store.p1_data[i], store.p2_data[i],
    store.ek1_data[i], store.ek2_data[i], store.es_data[i],
  ].map(v => toCsv(v)).join(';'))
  download([header, ...rows].join('\n'), 'stoss_alle_daten.csv')
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
initDOM()
setupTheme()
drawStopwatchMarks()
drawSubdialMarks()
ensureAxisMarker(DOM.graphSvg)
populateGraphSelect()

DOM.m1Slider.addEventListener('input', resetSim)
DOM.m2Slider.addEventListener('input', resetSim)
DOM.v1Slider.addEventListener('input', resetSim)
DOM.v2Slider.addEventListener('input', resetSim)
DOM.kSlider.addEventListener('input', resetSim)

DOM.togVectors.addEventListener('change', () => { store.showVectors = DOM.togVectors.checked; updateScene(Math.min(store.simulatedTime, store.simDuration)) })
DOM.togCom.addEventListener('change', () => { store.showCom = DOM.togCom.checked; updateScene(Math.min(store.simulatedTime, store.simDuration)) })
DOM.graphSelect.addEventListener('change', () => { store.graphType = DOM.graphSelect.value; updateGraph(Math.min(store.simulatedTime, store.simDuration)) })

DOM.speedRadios.forEach(r => r.addEventListener('change', () => {
  DOM.speedRadios.forEach(rad => { if (rad.checked) store.speedFactor = parseFloat(rad.value) })
  document.querySelectorAll('.speed-pill').forEach(p => p.classList.toggle('active', p.querySelector('input').checked))
}))

DOM.playBtn.addEventListener('click', startAnimation)
DOM.pauseBtn.addEventListener('click', () => { if (store.animFrameId) stopAnimation() })
DOM.resetBtn.addEventListener('click', () => { store.simulatedTime = 0; resetSim() })
DOM.exportDiagram.addEventListener('click', exportDiagramCSV)
DOM.exportAll.addEventListener('click', exportAllCSV)

DOM.analysisToggle?.addEventListener('click', () => {
  const collapsed = DOM.appLayout.classList.toggle('analysis-collapsed')
  DOM.analysisToggle.setAttribute('aria-expanded', String(!collapsed))
})

resetSim()
