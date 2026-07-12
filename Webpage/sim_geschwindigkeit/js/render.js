'use strict'

import {
  T_MIN, T_MAX, GRAPH_W, GRAPH_H, PAD_L, PAD_R, PAD_T, PAD_B,
} from './constants.js'
import { store, DOM } from './state.js'
import { fmt } from '../../shared/js/format.js'
import { setAxisLabel } from '../../shared/js/svg-text.js'
import { niceStepLE } from '../../shared/js/ticks.js'

const NS = 'http://www.w3.org/2000/svg'

function el(tag, attrs) {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  return e
}

// SVG-Text mit gemischter Formatierung aus HTML-<i>-Tags (Symbol kursiv, Rest
// aufrecht) — für dynamische Wert-Labels (kein statisches MathJax möglich).
function createStyledSvgText(textEl, text) {
  while (textEl.firstChild) textEl.removeChild(textEl.firstChild)
  const re = /<i>(.*?)<\/i>|([^<]+)/g
  let m
  while ((m = re.exec(text)) !== null) {
    if (m[1]) {
      const t = el('tspan', { 'font-style': 'italic' })
      t.textContent = m[1]
      textEl.appendChild(t)
    } else if (m[2]) {
      textEl.appendChild(document.createTextNode(m[2]))
    }
  }
}

// ── Plot-Geometrie ────────────────────────────────────────────────────────────
const plotW = GRAPH_W - PAD_L - PAD_R
const plotH = GRAPH_H - PAD_T - PAD_B
const plotBottom = PAD_T + plotH

// Zentrale Koordinaten-Transformation Physik (t,x) → Bildschirm (Pixel im viewBox)
export function physToScreen(t, x) {
  const sx = PAD_L + ((t - T_MIN) / (T_MAX - T_MIN)) * plotW
  const sy = PAD_T + plotH - ((x - store.xMin) / ((store.xMax - store.xMin) || 1)) * plotH
  return { x: sx, y: sy }
}

// ── Hintergrund: Achsen, Gitter, Ticks, Ort-Zeit-Kurve ───────────────────────
export function drawGraph() {
  DOM.gridGroup.innerHTML = ''
  // Titel-foreignObject auf das Plot-Gebiet zentrieren (nicht über die ganze SVG)
  DOM.titleFo.setAttribute('x', PAD_L)
  DOM.titleFo.setAttribute('width', plotW)
  DOM.plotClipRect.setAttribute('x', PAD_L)
  DOM.plotClipRect.setAttribute('y', PAD_T)
  DOM.plotClipRect.setAttribute('width', plotW)
  DOM.plotClipRect.setAttribute('height', plotH)

  const x0px = physToScreen(0, 0).y   // Nulllinie (Abszisse liegt am Nulldurchgang)

  // Hintergrund-Rechteck des Plot-Bereichs
  DOM.gridGroup.appendChild(el('rect', { x: PAD_L, y: PAD_T, width: plotW, height: plotH, class: 'graph-bg' }))

  // Ordinaten-Gitter + Ticks (feine 1-2-4-5-Folge, ≥4 Ticks inkl. 0)
  const xRng = (store.xMax - store.xMin) || 1
  const xStep = niceStepLE(xRng, 4)
  const xDec = xStep % 1 === 0 ? 0 : (xStep >= 0.1 ? 1 : 2)
  for (let v = Math.ceil(store.xMin / xStep) * xStep; v <= store.xMax + 1e-9; v = Math.round((v + xStep) * 1e9) / 1e9) {
    const yp = physToScreen(0, v).y
    if (Math.abs(yp - x0px) > 1.5)
      DOM.gridGroup.appendChild(el('line', { x1: PAD_L, y1: yp, x2: PAD_L + plotW, y2: yp, class: 'grid-line' }))
    const t = el('text', { x: PAD_L - 8, y: yp + 4, 'text-anchor': 'end', class: 'tick-label' })
    t.textContent = fmt(v, xDec)
    DOM.gridGroup.appendChild(t)
  }

  // Abszissen-Gitter + Ticks (Zeit)
  const tStep = niceStepLE(T_MAX - T_MIN, 4)
  const tDec = tStep % 1 === 0 ? 0 : 1
  const t0px = physToScreen(T_MIN, 0).x
  for (let v = T_MIN; v <= T_MAX + 1e-9; v = Math.round((v + tStep) * 1e6) / 1e6) {
    const xp = physToScreen(v, 0).x
    if (Math.abs(xp - t0px) > 2)
      DOM.gridGroup.appendChild(el('line', { x1: xp, y1: PAD_T, x2: xp, y2: plotBottom, class: 'grid-line' }))
    const t = el('text', { x: xp, y: plotBottom + 16, 'text-anchor': 'middle', class: 'tick-label' })
    t.textContent = fmt(v, tDec)
    DOM.gridGroup.appendChild(t)
  }

  // Achsen mit Pfeilspitzen: Abszisse am Nulldurchgang, Ordinate volle Höhe links
  DOM.gridGroup.appendChild(el('line', { x1: PAD_L, y1: x0px, x2: PAD_L + plotW, y2: x0px, class: 'axis-line', 'marker-end': 'url(#graph-arrowhead)' }))
  DOM.gridGroup.appendChild(el('line', { x1: PAD_L, y1: plotBottom, x2: PAD_L, y2: PAD_T, class: 'axis-line', 'marker-end': 'url(#graph-arrowhead)' }))

  // Achsenbeschriftungen (Symbol kursiv, Einheit aufrecht — CLAUDE.md-Format)
  const tl = el('text', { x: PAD_L + plotW + 14, y: x0px + 4, 'text-anchor': 'start', class: 'axis-label' })
  setAxisLabel(tl, 't / s')
  DOM.gridGroup.appendChild(tl)
  const xl = el('text', { x: PAD_L - 4, y: PAD_T - 12, 'text-anchor': 'middle', class: 'axis-label' })
  setAxisLabel(xl, 'x / m')
  DOM.gridGroup.appendChild(xl)

  // Ort-Zeit-Kurve
  const { ts, xs } = store.curve
  let pts = ''
  for (let i = 0; i < ts.length; i++) {
    const p = physToScreen(ts[i], xs[i])
    pts += `${p.x.toFixed(2)},${p.y.toFixed(2)} `
  }
  DOM.funcLine.setAttribute('points', pts.trim())
}

// ── Overlay: Stützpunkt, Tangente, Sekante + Steigungsdreieck ────────────────
function hide(...els) { els.forEach(e => { e.style.visibility = 'hidden' }) }
function show(...els) { els.forEach(e => { e.style.visibility = 'visible' }) }

export function updateOverlay() {
  const a = store.analysis
  if (!a) return

  // Stützpunkt P₀ (immer sichtbar)
  const p0 = physToScreen(a.t0, a.x0)
  DOM.point.setAttribute('cx', p0.x)
  DOM.point.setAttribute('cy', p0.y)
  show(DOM.point)

  // Tangente über den gesamten Definitionsbereich (Clip beschneidet vertikal)
  if (store.showTangent) {
    const tA = physToScreen(T_MIN, a.mTan * (T_MIN - a.t0) + a.x0)
    const tB = physToScreen(T_MAX, a.mTan * (T_MAX - a.t0) + a.x0)
    DOM.tangentLine.setAttribute('points', `${tA.x},${tA.y} ${tB.x},${tB.y}`)
    show(DOM.tangentLine)
  } else {
    hide(DOM.tangentLine)
  }

  // Sekante + Steigungsdreieck + Δt-/Δx-Werte (ein gemeinsamer Toggle, wie im
  // Original — dort sind Dreieck und Δ-Werte nie unabhängig voneinander sichtbar)
  const secGeom = [DOM.secantLine, DOM.p1Dot, DOM.p2Dot, DOM.triH, DOM.triV, DOM.dtText, DOM.dxText]
  const secValid = store.showSecant && !Number.isNaN(a.mSec)
  const p1 = physToScreen(a.t1, a.x1)
  const p2 = physToScreen(a.t2, a.x2)
  if (secValid) {
    const sA = physToScreen(T_MIN, a.mSec * (T_MIN - a.t1) + a.x1)
    const sB = physToScreen(T_MAX, a.mSec * (T_MAX - a.t1) + a.x1)
    DOM.secantLine.setAttribute('points', `${sA.x},${sA.y} ${sB.x},${sB.y}`)

    DOM.p1Dot.setAttribute('cx', p1.x); DOM.p1Dot.setAttribute('cy', p1.y)
    DOM.p2Dot.setAttribute('cx', p2.x); DOM.p2Dot.setAttribute('cy', p2.y)

    // Steigungsdreieck: horizontale Kathete (Δt) auf Höhe x₁, vertikale (Δx) bei t₂
    // (Δt kann negativ sein → p1/p2 können links oder rechts liegen; Dreieck folgt
    // stets den tatsächlichen Bildschirmkoordinaten, unabhängig vom Vorzeichen)
    DOM.triH.setAttribute('x1', p1.x); DOM.triH.setAttribute('y1', p1.y)
    DOM.triH.setAttribute('x2', p2.x); DOM.triH.setAttribute('y2', p1.y)
    DOM.triV.setAttribute('x1', p2.x); DOM.triV.setAttribute('y1', p1.y)
    DOM.triV.setAttribute('x2', p2.x); DOM.triV.setAttribute('y2', p2.y)

    const midH = physToScreen((a.t1 + a.t2) / 2, a.x1)
    DOM.dtText.setAttribute('x', midH.x)
    DOM.dtText.setAttribute('y', p1.y + (a.dx >= 0 ? 15 : -8))
    createStyledSvgText(DOM.dtText, `Δ<i>t</i> = ${fmt(a.dt)} s`)

    const dxAtT2 = physToScreen(a.t2, 0).x
    let dxTextX = dxAtT2 + 5, dxAnchor = 'start'
    if (dxAtT2 > PAD_L + plotW * 0.9) { dxTextX = dxAtT2 - 5; dxAnchor = 'end' }
    DOM.dxText.setAttribute('x', dxTextX)
    DOM.dxText.setAttribute('y', physToScreen(0, (a.x1 + a.x2) / 2).y)
    DOM.dxText.setAttribute('text-anchor', dxAnchor)
    DOM.dxText.setAttribute('dominant-baseline', 'middle')
    createStyledSvgText(DOM.dxText, `Δ<i>x</i> = ${fmt(a.dx)} m`)

    show(...secGeom)
  } else {
    hide(...secGeom)
  }

  // Steigungs-Readout oben links im Plot (Tangente/Sekante) — folgt direkt den
  // Haupt-Toggles (kein separater „Werte im Diagramm"-Cluster, wie im Original)
  const rx = PAD_L + 12, ry0 = PAD_T + 18, rlh = 20
  let slot = 0
  if (store.showTangent) {
    DOM.tanSlopeText.setAttribute('x', rx)
    DOM.tanSlopeText.setAttribute('y', ry0 + slot * rlh)
    createStyledSvgText(DOM.tanSlopeText, `Tangente: <i>v</i> = ${fmt(a.mTan, 3)} m/s`)
    show(DOM.tanSlopeText); slot++
  } else {
    hide(DOM.tanSlopeText)
  }
  if (secValid) {
    DOM.secSlopeText.setAttribute('x', rx)
    DOM.secSlopeText.setAttribute('y', ry0 + slot * rlh)
    createStyledSvgText(DOM.secSlopeText, `Sekante: <i>v</i>̄ = ${fmt(a.mSec, 3)} m/s`)
    show(DOM.secSlopeText); slot++
  } else {
    hide(DOM.secSlopeText)
  }
}

// ── Analyse-Panel (rechts) ───────────────────────────────────────────────────
export function updateAnalysis() {
  const a = store.analysis
  if (!a) return
  DOM.anT0.textContent = fmt(a.t0) + ' s'
  DOM.anDeltaT.textContent = fmt(a.dt) + ' s'
  DOM.anDx.textContent = fmt(a.dx) + ' m'
  DOM.anMSec.textContent = Number.isNaN(a.mSec) ? '— (Δt = 0)' : fmt(a.mSec, 3) + ' m/s'
  DOM.anMTan.textContent = fmt(a.mTan, 3) + ' m/s'
  DOM.anDiff.textContent = Number.isNaN(a.mSec) ? '—' : fmt(Math.abs(a.mSec - a.mTan), 3) + ' m/s'
}
