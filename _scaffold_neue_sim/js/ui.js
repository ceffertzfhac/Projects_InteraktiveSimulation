'use strict'

// ── ES-Modul-Einstiegspunkt (kein main.js — vgl. Freier Fall / Atwood) ─────────
// index.html lädt dieses Modul via <script type="module" src="js/ui.js">.
import { store, DOM, initDOM } from './state.js'
import { precompute } from './physics.js'
import { drawBackground, drawGraph, updateScene } from './render.js'
import { fmt } from '../../shared/js/format.js'

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
    updateScene(store.t_end)
    stopAnimation()
    return
  }
  updateScene(store.simulatedTime)
  store.aniFrameId = requestAnimationFrame(animate)
}

function startAnimation() {
  if (store.aniFrameId) return
  if (store.simulatedTime >= store.t_end) resetSim()   // am Ende → von vorn
  DOM.playBtn.disabled = true
  DOM.pauseBtn.disabled = false
  store.lastFrameTime = 0
  store.aniFrameId = requestAnimationFrame(animate)
}

// ── Reset = Parameter einlesen → precompute → neu zeichnen ─────────────────────
// Jede Parameteränderung ruft resetSim() (Live-Update).
function resetSim() {
  stopAnimation()
  store.simulatedTime = 0
  store.lastFrameTime = 0
  store.v0 = parseFloat(DOM.v0Slider.value)
  store.a  = parseFloat(DOM.aSlider.value)
  store.graphType = DOM.graphSelect.value
  DOM.speedRadios.forEach(r => { if (r.checked) store.speedFactor = parseFloat(r.value) })

  DOM.v0Value.textContent = `${fmt(store.v0, 1)} m/s`
  DOM.aValue.textContent  = `${fmt(store.a, 1)} m/s²`

  precompute()
  drawBackground()
  drawGraph()
  updateScene(0)   // Vektoren + Marker schon bei t=0 sichtbar
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
function exportCSV(all) {
  const { t_data, x_data, v_data, a_data, graphType } = store
  if (!t_data.length) return
  let header, rows
  if (all) {
    header = `sep=;\nt / s;x / m;v / (m/s);a / (m/s²)`
    rows = t_data.map((_, i) => [t_data[i], x_data[i], v_data[i], a_data[i]].map(x => fmt(x, 4)).join(';'))
  } else {
    const col = { ort: ['x / m', x_data], geschw: ['v / (m/s)', v_data], beschl: ['a / (m/s²)', a_data] }[graphType]
    header = `sep=;\nt / s;${col[0]}`
    rows = t_data.map((_, i) => `${fmt(t_data[i], 4)};${fmt(col[1][i], 4)}`)
  }
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `scaffold_${all ? 'alle' : 'diagramm'}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Bootstrap ──────────────────────────────────────────────────────────────────
initDOM()
setupTheme()

;[DOM.v0Slider, DOM.aSlider].forEach(s => s.addEventListener('input', resetSim))
;[DOM.graphSelect, DOM.togVel, DOM.togAcc].forEach(s => s.addEventListener('change', resetSim))
DOM.speedRadios.forEach(r => r.addEventListener('change', () => {
  DOM.speedRadios.forEach(rad => { if (rad.checked) store.speedFactor = parseFloat(rad.value) })
  document.querySelectorAll('.speed-pill').forEach(p => p.classList.toggle('active', p.querySelector('input').checked))
}))

DOM.playBtn.addEventListener('click', startAnimation)
DOM.pauseBtn.addEventListener('click', () => { if (store.aniFrameId) stopAnimation() })
DOM.resetBtn.addEventListener('click', () => { store.simulatedTime = 0; resetSim() })
DOM.exportDiagram.addEventListener('click', () => exportCSV(false))
DOM.exportAll.addEventListener('click', () => exportCSV(true))

// Rechte Analyse-Sidebar ein-/ausklappen (Default eingeklappt via HTML-Klasse)
DOM.analysisToggle.addEventListener('click', () => {
  const collapsed = DOM.appLayout.classList.toggle('analysis-collapsed')
  DOM.analysisToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
})

// Linke Steuerungs-Sidebar: Akkordeon-Cluster (I8) — .panel-label ist <button>
document.querySelectorAll('.panel-section.collapsible > .panel-label').forEach(btn => {
  btn.addEventListener('click', () => {
    const collapsed = btn.parentElement.classList.toggle('collapsed')
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
  })
})

resetSim()

// MathJax rendert alle statischen Formeln beim Seitenstart selbst — kein
// Laufzeit-typesetPromise nötig (Formeln stehen als statisches HTML in index.html).
