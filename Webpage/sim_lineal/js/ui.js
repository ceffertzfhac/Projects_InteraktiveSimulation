'use strict'

/**
 * @module lineal/ui
 * ES-Modul-Einstiegspunkt (kein main.js — vgl. Freier Fall / Atwood):
 * Event-Bindung, Animations-Loop, Theme, CSV-Export. index.html lädt dieses
 * Modul via <script type="module" src="js/ui.js">.
 */

// ── ES-Modul-Einstiegspunkt (kein main.js — vgl. Freier Fall / Atwood) ─────────
// index.html lädt dieses Modul via <script type="module" src="js/ui.js">.
import { store, DOM, initDOM } from './state.js'
import { precompute } from './physics.js'
import { AUTO_STOP_T } from './constants.js'
import { drawBackground, drawGraph, updateScene, updateGraphHover } from './render.js'
import { fmt } from '../../shared/js/format.js'
import { attachGraphHover } from '../../shared/js/hover.js'

const DEG = Math.PI / 180

// ── Animations-Loop (periodisch → nahtloses Loop am Fensterende = N·T) ────────
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

  // Auto‑Stopp‑Modus: nach 8 s anhalten
  if (store.timeMode === 'auto' && store.simulatedTime >= AUTO_STOP_T) {
    store.simulatedTime = AUTO_STOP_T
    updateScene(store.simulatedTime)
    stopAnimation()
    return
  }

  // Kontinuierlich-Modus: kein Auto-Reset / kein Loop — die Wiedergabe läuft
  // einfach weiter (updateScene nutzt interpolatePeriodic über t_end hinaus).
  updateScene(store.simulatedTime)
  store.aniFrameId = requestAnimationFrame(animate)
}

function startAnimation() {
  if (store.aniFrameId) return
  // Auto‑Stopp‑Modus: nach dem Anhalten bei 8 s von vorn neu abspielen
  if (store.timeMode === 'auto' && store.simulatedTime >= AUTO_STOP_T - 1e-6) {
    store.simulatedTime = 0
    updateScene(0)
  }
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

  store.a_cm   = parseFloat(DOM.aSlider.value)
  store.l_cm   = parseFloat(DOM.lSlider.value)
  store.b_cm   = parseFloat(DOM.bSlider.value)
  store.phi0   = parseFloat(DOM.phi0Slider.value) * DEG
  store.m_g    = parseFloat(DOM.mSlider.value)
  store.graphType = DOM.graphSelect.value
  DOM.modelRadios.forEach(r => { if (r.checked) store.model = r.value })
  DOM.speedRadios.forEach(r => { if (r.checked) store.speedFactor = parseFloat(r.value) })
  // Zeitmodus aus Radiobuttons
  DOM.timeModeRadios.forEach(r => { if (r.checked) store.timeMode = r.value })
  store.vecScale = parseFloat(DOM.vecScaleSlider.value)
  DOM.vecScaleValue.textContent = `${fmt(store.vecScale, 1)}×`

  DOM.aValue.textContent    = `${fmt(store.a_cm, 1)} cm`
  DOM.lValue.textContent    = `${fmt(store.l_cm, 1)} cm`
  DOM.bValue.textContent    = `${fmt(store.b_cm, 1)} cm`
  DOM.phi0Value.textContent = `${fmt(parseFloat(DOM.phi0Slider.value), 0)} °`
  DOM.mValue.textContent    = `${fmt(store.m_g, 1)} g`

  // ARIA-Attribute der Slider mit dem aktuellen Wert synchron halten
  const syncAria = s => { if (s) s.setAttribute('aria-valuenow', s.value) }
  ;[DOM.aSlider, DOM.lSlider, DOM.bSlider, DOM.phi0Slider, DOM.mSlider, DOM.vecScaleSlider].forEach(syncAria)

  // Warnung: lineares Modell bei großer Anfangsauslenkung (Näherungsgültigkeit)
  const warn = document.getElementById('phi0_warn')
  if (warn) {
    const phi0deg = Math.abs(DOM.phi0Slider.valueAsNumber)
    warn.style.display = (store.model === 'linear' && phi0deg > 20) ? 'block' : 'none'
  }

  precompute()
  drawBackground()
  drawGraph()
  updateScene(0)
  // Instabilitäts‑Overlay: anzeigen, wenn die Achse unterhalb des Schwerpunkts liegt
  const overlay = document.getElementById('instability_overlay')
  if (store.stable) {
    overlay.style.display = 'none'
    overlay.style.visibility = 'hidden'
    DOM.playBtn.disabled = false
  } else {
    overlay.style.display = 'flex'
    overlay.style.visibility = 'visible'
    DOM.playBtn.disabled = true
  }
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
  const { t_data, phi_data, omega_data, alpha_data, ekin_data, epot_data, eges_data, graphType } = store
  if (!t_data.length) return
  const cols = {
    phi:    [['φ / rad', phi_data]],
    omega:  [['ω / (rad/s)', omega_data]],
    alpha:  [['α / (rad/s²)', alpha_data]],
    energy: [['E_kin / J', ekin_data], ['E_pot / J', epot_data], ['E_ges / J', eges_data]],
  }
  let header, rows
  if (all) {
    header = `sep=;\nt / s;φ / rad;ω / (rad/s);α / (rad/s²);E_kin / J;E_pot / J;E_ges / J`
    rows = t_data.map((_, i) =>
      [t_data[i], phi_data[i], omega_data[i], alpha_data[i], ekin_data[i], epot_data[i], eges_data[i]]
        .map(x => fmt(x, 6)).join(';'))
  } else {
    const series = cols[graphType]
    header = `sep=;\nt / s;${series.map(s => s[0]).join(';')}`
    rows = t_data.map((_, i) => `${fmt(t_data[i], 6)};${series.map(s => fmt(s[1][i], 6)).join(';')}`)
  }
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `lineal_${all ? 'alle' : 'diagramm'}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

//Aktiv-Klasse für Pill-Gruppen (Modell + Abspielgeschwindigkeit)
function syncPills(name) {
  document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
    r.closest('.speed-pill').classList.toggle('active', r.checked)
  })
}

// ── Bootstrap ──────────────────────────────────────────────────────────────────
initDOM()
setupTheme()

;[DOM.aSlider, DOM.lSlider, DOM.bSlider, DOM.phi0Slider, DOM.mSlider].forEach(s => s.addEventListener('input', resetSim))
;[DOM.graphSelect, DOM.togGrav, DOM.togVel].forEach(s => s.addEventListener('change', resetSim))
// Vektor-Visibility + Skalierung: keine Neu-Integration nötig — nur Szene neu zeichnen
;[DOM.togNorm, DOM.togRes, DOM.togAcc, DOM.togSusp].forEach(s => s.addEventListener('change', () => updateScene(store.simulatedTime)))
// Referenzkurve: Toggle speichert beim Aktivieren den Snapshot (in drawGraph) und
// zeichnet das Diagramm neu. Beim Deaktivieren wird der Snapshot verworfen (die
// Kurve verschwindet dann erst, nicht schon bei jeder Parameteränderung).
DOM.togPrev.addEventListener('change', () => {
  store.prevShown = DOM.togPrev.checked
  if (!store.prevShown) store.prevGraph = null
  drawGraph()
  updateScene(store.simulatedTime)
})
DOM.vecScaleSlider.addEventListener('input', () => {
  store.vecScale = parseFloat(DOM.vecScaleSlider.value)
  DOM.vecScaleValue.textContent = `${fmt(store.vecScale, 1)}×`
  DOM.vecScaleSlider.setAttribute('aria-valuenow', DOM.vecScaleSlider.value)
  updateScene(store.simulatedTime)
})
DOM.modelRadios.forEach(r => r.addEventListener('change', () => { syncPills('model'); resetSim() }))
DOM.speedRadios.forEach(r => r.addEventListener('change', () => {
  syncPills('speed')
  if (r.checked) store.speedFactor = parseFloat(r.value)
}))
// Zeitmodus: Fensterlänge + Wiedergabe-Ende hängen vom Modus ab → Re-Precompute
DOM.timeModeRadios.forEach(r => r.addEventListener('change', () => {
  syncPills('timeMode')
  resetSim()
}))

DOM.playBtn.addEventListener('click', startAnimation)
DOM.pauseBtn.addEventListener('click', () => { if (store.aniFrameId) stopAnimation() })
DOM.resetBtn.addEventListener('click', () => { store.simulatedTime = 0; resetSim() })
DOM.exportDiagram.addEventListener('click', () => exportCSV(false))
DOM.exportAll.addEventListener('click', () => exportCSV(true))

// Hover-Werte am Diagramm (I13.1, §4)
attachGraphHover(DOM.graphHitRect, {
  onMove: x => updateGraphHover(x),
  onLeave: () => updateGraphHover(null),
})

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

resetSim()

// MathJax rendert alle statischen Formeln beim Seitenstart selbst — kein
// Laufzeit-typesetPromise nötig (Formeln stehen als statisches HTML in index.html).