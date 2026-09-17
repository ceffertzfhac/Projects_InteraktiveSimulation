'use strict'

// ── ES-Modul-Einstiegspunkt (kein main.js — vgl. Freier Fall / Atwood) ────────
import { store, DOM, initDOM } from './state.js'
import { precompute, clampLimits, sums, cumulative, integralFunction } from './physics.js'
import { drawBackground, updateScene, updateGraphHover } from './render.js'
import { FUNCS, GRAPH_OPTIONS, N_SEQUENCE, STEP_DWELL, N_MIN, N_MAX, N_DEFAULT,
         A_MIN, A_MAX, B_MIN, B_MAX, AB_STEP, A_DEFAULT, B_DEFAULT } from './constants.js'
import { fmt } from '../../shared/js/format.js'
import { attachGraphHover } from '../../shared/js/hover.js'

// ── Verfeinerungs-Animation ──────────────────────────────────────────────────
// „Zeit" ist hier die Stufe der Zerlegungsfolge: Play läuft N_SEQUENCE von n = 1
// bis n = 200 hoch und macht den Grenzübergang n → ∞ als Prozess erlebbar.
function stopAnimation() {
  if (store.aniFrameId) cancelAnimationFrame(store.aniFrameId)
  store.aniFrameId = null
  store.lastFrameTime = 0
  DOM.playBtn.disabled = false
  DOM.pauseBtn.disabled = true
}

function setN(n) {
  if (n === store.n) return
  store.n = n
  DOM.nSlider.value = String(n)
  DOM.nValue.textContent = String(n)
  updateScene()
}

function syncStepIndex(n) {
  let idx = 0
  for (let i = 0; i < N_SEQUENCE.length; i++) if (N_SEQUENCE[i] <= n) idx = i
  store.stepIndex = idx
}

function animate(ts) {
  if (!store.lastFrameTime) store.lastFrameTime = ts
  store.stepIndex += ((ts - store.lastFrameTime) / 1000) * store.speedFactor / STEP_DWELL
  store.lastFrameTime = ts
  const last = N_SEQUENCE.length - 1
  if (store.stepIndex >= last) {
    store.stepIndex = last
    setN(N_SEQUENCE[last])
    stopAnimation()
    return
  }
  setN(N_SEQUENCE[Math.floor(store.stepIndex)])
  store.aniFrameId = requestAnimationFrame(animate)
}

function startAnimation() {
  if (store.aniFrameId) return
  if (store.stepIndex >= N_SEQUENCE.length - 1) {   // am Ende → von vorn
    store.stepIndex = 0
    setN(N_SEQUENCE[0])
  }
  DOM.playBtn.disabled = true
  DOM.pauseBtn.disabled = false
  store.lastFrameTime = 0
  store.aniFrameId = requestAnimationFrame(animate)
}

// ── Steuerung einlesen ───────────────────────────────────────────────────────
function applyLimits(moved) {
  const { a, b } = clampLimits(parseFloat(DOM.aSlider.value), parseFloat(DOM.bSlider.value), moved)
  DOM.aSlider.value = a.toFixed(1)
  DOM.bSlider.value = b.toFixed(1)
}

function readControls() {
  store.funcKey = DOM.funcSelect.value
  store.a = parseFloat(DOM.aSlider.value)
  store.b = parseFloat(DOM.bSlider.value)
  store.n = parseInt(DOM.nSlider.value, 10)
  store.showUnter  = DOM.togUnter.checked
  store.showOber   = DOM.togOber.checked
  store.showMittel = DOM.togMittel.checked
  store.showExact  = DOM.togExact.checked
  store.showValues = DOM.togValues.checked
  store.graphType1 = DOM.graphSelect1.value
  store.graphType2 = DOM.graphSelect2.value
  DOM.diagramModeRadios.forEach(r => { if (r.checked) store.diagramMode = r.value })
  DOM.speedRadios.forEach(r => { if (r.checked) store.speedFactor = parseFloat(r.value) })

  DOM.aValue.textContent = fmt(store.a, 1)
  DOM.bValue.textContent = fmt(store.b, 1)
  DOM.nValue.textContent = String(store.n)
  DOM.dualGraphControl.style.display = store.diagramMode === '2' ? '' : 'none'
  syncStepIndex(store.n)

  // Statische MathJax-Varianten (Funktion + Stammfunktion) umschalten
  for (const key of Object.keys(FUNCS)) {
    const node = document.getElementById(`pf_${key}`)
    if (node) node.style.display = key === store.funcKey ? '' : 'none'
  }
}

// ── Reset = Steuerung einlesen → precompute → neu zeichnen ───────────────────
function resetSim() {
  stopAnimation()
  readControls()
  precompute()
  drawBackground()
  updateScene()
}

// n allein ändert weder Kurve noch Grenzen → kein precompute/drawBackground nötig.
function applyN() {
  stopAnimation()
  store.n = parseInt(DOM.nSlider.value, 10)
  DOM.nValue.textContent = String(store.n)
  syncStepIndex(store.n)
  updateScene()
}

// ── Layout: Sim/Diagramm übereinander ↔ nebeneinander ────────────────────────
function applyLayout() {
  DOM.centerArea.classList.toggle('layout-split', store.layoutSplit)
  DOM.layoutToggle.textContent = store.layoutSplit ? '⊟ Übereinander' : '▦ Nebeneinander'
  // Zellform hat sich geändert → Formate neu berechnen (Portrait/Landscape)
  requestAnimationFrame(() => { drawBackground(); updateScene() })
}

// ── Theme (localStorage-Key einheitlich 'fh_theme') ──────────────────────────
function setupTheme() {
  document.body.className = localStorage.getItem('fh_theme') || 'light'
  DOM.themeToggle.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark')
    document.body.classList.toggle('light', !dark)
    localStorage.setItem('fh_theme', dark ? 'dark' : 'light')
  })
}

// ── CSV-Export (Semikolon-Trenner, Komma-Dezimal) ────────────────────────────
function download(name, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// „Diagramm (CSV)" exportiert den Datensatz des ERSTEN Diagramm-Slots.
function exportDiagram() {
  const { funcKey, a, b, n, exact, U_data, O_data, M_data } = store
  if (store.graphType1 === 'integralfunktion') {
    const cum = cumulative(funcKey, a, b, n)
    const head = 'sep=;\nx;F(x);U kumuliert;O kumuliert;M kumuliert'
    const rows = cum.xs.map((x, i) =>
      [x, integralFunction(funcKey, a, x), cum.cumU[i], cum.cumO[i], cum.cumM[i]]
        .map(v => fmt(v, 6)).join(';'))
    download('integration_integralfunktion.csv', [head, ...rows].join('\n'))
    return
  }
  const head = 'sep=;\nn;U(n);O(n);M(n);exakt'
  const rows = []
  for (let k = 1; k <= Math.max(n, 1); k++)
    rows.push([k, U_data[k], O_data[k], M_data[k], exact].map((v, i) => i === 0 ? String(v) : fmt(v, 6)).join(';'))
  download('integration_konvergenz.csv', [head, ...rows].join('\n'))
}

// „Alle Daten (CSV)" — die vollständige Näherungsfolge n = 1 … N_MAX.
function exportAll() {
  const { a, b, exact, U_data, O_data, M_data } = store
  const head = 'sep=;\nn;Delta x;U(n);O(n);M(n);exakt;|U-I|;|O-I|;|M-I|'
  const rows = []
  for (let k = 1; k <= N_MAX; k++) {
    const dx = (b - a) / k
    rows.push([k, dx, U_data[k], O_data[k], M_data[k], exact,
               Math.abs(U_data[k] - exact), Math.abs(O_data[k] - exact), Math.abs(M_data[k] - exact)]
      .map((v, i) => i === 0 ? String(v) : fmt(v, 6)).join(';'))
  }
  download('integration_alle_daten.csv', [head, ...rows].join('\n'))
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
initDOM()
setupTheme()

// Auswahl-Felder dynamisch aus den Konstanten-Maps (I12)
for (const [key, f] of Object.entries(FUNCS)) {
  const o = document.createElement('option')
  o.value = key; o.textContent = f.label
  DOM.funcSelect.appendChild(o)
}
DOM.funcSelect.value = store.funcKey
for (const sel of [DOM.graphSelect1, DOM.graphSelect2]) {
  for (const [key, label] of Object.entries(GRAPH_OPTIONS)) {
    const o = document.createElement('option')
    o.value = key; o.textContent = label
    sel.appendChild(o)
  }
}
DOM.graphSelect1.value = store.graphType1
DOM.graphSelect2.value = store.graphType2

DOM.aSlider.min = A_MIN; DOM.aSlider.max = A_MAX; DOM.aSlider.step = AB_STEP; DOM.aSlider.value = A_DEFAULT
DOM.bSlider.min = B_MIN; DOM.bSlider.max = B_MAX; DOM.bSlider.step = AB_STEP; DOM.bSlider.value = B_DEFAULT
DOM.nSlider.min = N_MIN; DOM.nSlider.max = N_MAX; DOM.nSlider.step = 1; DOM.nSlider.value = N_DEFAULT

DOM.aSlider.addEventListener('input', () => { applyLimits('a'); resetSim() })
DOM.bSlider.addEventListener('input', () => { applyLimits('b'); resetSim() })
DOM.nSlider.addEventListener('input', applyN)
DOM.funcSelect.addEventListener('change', resetSim)
;[DOM.togUnter, DOM.togOber, DOM.togMittel, DOM.togExact, DOM.togValues,
  DOM.graphSelect1, DOM.graphSelect2].forEach(c => c.addEventListener('change', resetSim))
DOM.diagramModeRadios.forEach(r => r.addEventListener('change', () => {
  document.querySelectorAll('#diagram_mode_group .speed-pill')
    .forEach(p => p.classList.toggle('active', p.querySelector('input').checked))
  resetSim()
}))
DOM.speedRadios.forEach(r => r.addEventListener('change', () => {
  DOM.speedRadios.forEach(rad => { if (rad.checked) store.speedFactor = parseFloat(rad.value) })
  document.querySelectorAll('#speed_group .speed-pill')
    .forEach(p => p.classList.toggle('active', p.querySelector('input').checked))
}))

DOM.playBtn.addEventListener('click', startAnimation)
DOM.pauseBtn.addEventListener('click', () => { if (store.aniFrameId) stopAnimation() })
DOM.resetBtn.addEventListener('click', () => {
  DOM.nSlider.value = String(N_DEFAULT)
  resetSim()
})
DOM.exportDiagram.addEventListener('click', exportDiagram)
DOM.exportAll.addEventListener('click', exportAll)

store.layoutSplit = localStorage.getItem('int_layout') === 'split'
DOM.layoutToggle.addEventListener('click', () => {
  store.layoutSplit = !store.layoutSplit
  localStorage.setItem('int_layout', store.layoutSplit ? 'split' : 'stacked')
  applyLayout()
})

// Hover-Werte je Diagramm-Slot (I13.1) — beide Slots unabhängig, s. render.js
;[1, 2].forEach(slot => attachGraphHover(DOM.graphHitRect[slot], {
  onMove: x => updateGraphHover(slot, x),
  onLeave: () => updateGraphHover(slot, null),
}))

// Rechte Analyse-Sidebar ein-/ausklappen (Default eingeklappt via HTML-Klasse)
DOM.analysisToggle.addEventListener('click', () => {
  const collapsed = DOM.appLayout.classList.toggle('analysis-collapsed')
  DOM.analysisToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
})

// Linke Steuerungs-Sidebar: Akkordeon-Cluster (I8)
document.querySelectorAll('.panel-section.collapsible > .panel-label').forEach(btn => {
  btn.addEventListener('click', () => {
    const collapsed = btn.parentElement.classList.toggle('collapsed')
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
  })
})

// Fenster-Resize: Zellform kann Portrait↔Landscape kippen (@media-Fallback)
let resizeTimer = null
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => { drawBackground(); updateScene() }, 160)
})

document.querySelectorAll('.speed-pill').forEach(p =>
  p.classList.toggle('active', p.querySelector('input').checked))

applyLayout()
resetSim()

// MathJax rendert alle statischen Formeln beim Seitenstart selbst — kein
// Laufzeit-typesetPromise (Formeln stehen als statisches HTML in index.html).
