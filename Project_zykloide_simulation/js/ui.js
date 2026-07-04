'use strict'

import {
  SIM_DURATION,
  subjects, quantities, quantityUnits, graphOptions,
} from './constants.js'
import { store, DOM, initDOM } from './state.js'
import { precompute } from './physics.js'
import { fmt, drawBackground, updateTraceZOrder, updateScene } from './render.js'

// ── Diagramm-Dropdown füllen ─────────────────────────────────────────────────
function setupGraphSelect() {
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

// ── Animation stoppen ────────────────────────────────────────────────────────
function stopAnimation() {
  if (store.aniFrameId) cancelAnimationFrame(store.aniFrameId)
  store.aniFrameId = null
  DOM.playBtn.disabled = false
  DOM.pauseBtn.disabled = true
  DOM.radiusSlider.disabled = false
  DOM.velocitySlider.disabled = false
}

// ── Reset (aus v2.8 resetScene) ──────────────────────────────────────────────
function resetSim() {
  stopAnimation()
  store.simulatedTime = 0

  store.R = parseFloat(DOM.radiusSlider.value) / 100
  store.Vc = parseFloat(DOM.velocitySlider.value) / 100
  store.graphType = DOM.graphSelect.value
  DOM.speedRadios.forEach(r => { if (r.checked) store.speedFactor = parseFloat(r.value) })

  DOM.radiusValue.textContent = `${fmt(store.R * 100, 0)} cm`
  DOM.velocityValue.textContent = `${fmt(store.Vc * 100, 0)} cm/s`

  precompute()
  drawBackground()
  updateTraceZOrder()
  updateScene(0)

  DOM.playBtn.disabled = false
  DOM.pauseBtn.disabled = true
  DOM.radiusSlider.disabled = false
  DOM.velocitySlider.disabled = false
}

// ── Animationsschleife (precompute + interpolateAt) ──────────────────────────
function animate(ts) {
  if (!store.lastFrameTime) store.lastFrameTime = ts
  const dt = (ts - store.lastFrameTime) / 1000
  store.simulatedTime += dt * store.speedFactor
  store.lastFrameTime = ts

  if (store.simulatedTime >= SIM_DURATION) {
    store.simulatedTime = SIM_DURATION
    updateScene(store.simulatedTime)
    stopAnimation()
    return
  }
  updateScene(store.simulatedTime)
  store.aniFrameId = requestAnimationFrame(animate)
}

function startAnimation() {
  if (store.aniFrameId) return
  if (store.simulatedTime >= SIM_DURATION - 1e-6) {
    store.simulatedTime = 0
  }
  DOM.playBtn.disabled = true
  DOM.pauseBtn.disabled = false
  DOM.radiusSlider.disabled = true
  DOM.velocitySlider.disabled = true
  store.lastFrameTime = 0
  store.aniFrameId = requestAnimationFrame(animate)
}

// ── CSV-Export (5 Subjekte × 8 Größen, ; Trenner, Komma-Dezimal) ─────────────
function exportCSV() {
  const fd = store.fullData
  if (!fd.t || !fd.t.length) return

  const headerCols = ['Zeit / s']
  subjects.forEach(s => quantities.forEach(q => {
    headerCols.push(`${s}_${q} / ${quantityUnits[q]}`)
  }))
  const header = `sep=;\n${headerCols.join(';')}`
  const rows = fd.t.map((_, i) => {
    const r = [fmt(fd.t[i], 4)]
    subjects.forEach(s => quantities.forEach(q => {
      r.push(fmt(fd[`${s}_${q}`][i], 4))
    }))
    return r.join(';')
  })

  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'kinematik_rollender_zylinder.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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
  })
}

function updateSpeedPills() {
  document.querySelectorAll('.speed-pill').forEach(pill => {
    pill.classList.toggle('active', pill.querySelector('input').checked)
  })
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
initDOM()
setupTheme()
setupGraphSelect()

DOM.radiusSlider.addEventListener('input', resetSim)
DOM.velocitySlider.addEventListener('input', resetSim)
DOM.graphSelect.addEventListener('change', () => {
  store.graphType = DOM.graphSelect.value
  updateScene(store.simulatedTime)
})
DOM.speedRadios.forEach(r => r.addEventListener('change', () => {
  DOM.speedRadios.forEach(rad => { if (rad.checked) store.speedFactor = parseFloat(rad.value) })
  updateSpeedPills()
}))

// Display-Only-Toggles (kein Reset, nur Szene neu zeichnen)
[DOM.togSpTrace, DOM.togTraces, DOM.togV, DOM.togA].forEach(t => {
  t.addEventListener('change', () => updateScene(store.simulatedTime))
})
DOM.togTraceZOrder.addEventListener('change', () => {
  updateTraceZOrder()
  updateScene(store.simulatedTime)
})

// Subjekt-Checkboxen → Graph + Analyse aktualisieren
subjects.forEach(s => {
  DOM.subjectCheckboxes[s].addEventListener('change', () => updateScene(store.simulatedTime))
})

DOM.playBtn.addEventListener('click', startAnimation)
DOM.pauseBtn.addEventListener('click', stopAnimation)
DOM.resetBtn.addEventListener('click', resetSim)
DOM.exportAll.addEventListener('click', exportCSV)
DOM.analysisToggle.addEventListener('click', () => {
  const collapsed = DOM.appLayout.classList.toggle('analysis-collapsed')
  DOM.analysisToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
})

updateSpeedPills()
resetSim()