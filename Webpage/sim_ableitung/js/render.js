'use strict'

import {
  X_MIN, X_MAX, GRAPH_W, GRAPH_H, PAD_L, PAD_R, PAD_T, PAD_B,
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

// Zentrale Koordinaten-Transformation Physik → Bildschirm (Pixel im viewBox)
export function physToScreen(x, y) {
  const sx = PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW
  const sy = PAD_T + plotH - ((y - store.yMin) / ((store.yMax - store.yMin) || 1)) * plotH
  return { x: sx, y: sy }
}

// ── Hintergrund: Achsen, Gitter, Ticks, Funktionskurve ───────────────────────
export function drawGraph() {
  DOM.gridGroup.innerHTML = ''
  // Titel-foreignObject auf das Plot-Gebiet zentrieren (nicht über die ganze SVG)
  DOM.titleFo.setAttribute('x', PAD_L)
  DOM.titleFo.setAttribute('width', plotW)
  DOM.plotClipRect.setAttribute('x', PAD_L)
  DOM.plotClipRect.setAttribute('y', PAD_T)
  DOM.plotClipRect.setAttribute('width', plotW)
  DOM.plotClipRect.setAttribute('height', plotH)

  const y0px = physToScreen(0, 0).y   // Nulllinie (Abszisse liegt am Nulldurchgang)

  // Hintergrund-Rechteck des Plot-Bereichs
  DOM.gridGroup.appendChild(el('rect', { x: PAD_L, y: PAD_T, width: plotW, height: plotH, class: 'graph-bg' }))

  // y-Gitter + Ticks (feine 1-2-4-5-Folge, ≥4 Ticks inkl. 0)
  const yRng = (store.yMax - store.yMin) || 1
  const yStep = niceStepLE(yRng, 4)
  const yDec = yStep % 1 === 0 ? 0 : (yStep >= 0.1 ? 1 : 2)
  for (let v = Math.ceil(store.yMin / yStep) * yStep; v <= store.yMax + 1e-9; v = Math.round((v + yStep) * 1e9) / 1e9) {
    const yp = physToScreen(0, v).y
    if (Math.abs(yp - y0px) > 1.5)
      DOM.gridGroup.appendChild(el('line', { x1: PAD_L, y1: yp, x2: PAD_L + plotW, y2: yp, class: 'grid-line' }))
    const t = el('text', { x: PAD_L - 8, y: yp + 4, 'text-anchor': 'end', class: 'tick-label' })
    t.textContent = fmt(v, yDec)
    DOM.gridGroup.appendChild(t)
  }

  // x-Gitter + Ticks
  const xStep = niceStepLE(X_MAX - X_MIN, 4)
  const xDec = xStep % 1 === 0 ? 0 : 1
  const x0px = physToScreen(X_MIN, 0).x
  for (let v = X_MIN; v <= X_MAX + 1e-9; v = Math.round((v + xStep) * 1e6) / 1e6) {
    const xp = physToScreen(v, 0).x
    if (Math.abs(xp - x0px) > 2)
      DOM.gridGroup.appendChild(el('line', { x1: xp, y1: PAD_T, x2: xp, y2: plotBottom, class: 'grid-line' }))
    const t = el('text', { x: xp, y: plotBottom + 16, 'text-anchor': 'middle', class: 'tick-label' })
    t.textContent = fmt(v, xDec)
    DOM.gridGroup.appendChild(t)
  }

  // Achsen mit Pfeilspitzen: Abszisse am Nulldurchgang, Ordinate volle Höhe links
  DOM.gridGroup.appendChild(el('line', { x1: PAD_L, y1: y0px, x2: PAD_L + plotW, y2: y0px, class: 'axis-line', 'marker-end': 'url(#graph-arrowhead)' }))
  DOM.gridGroup.appendChild(el('line', { x1: PAD_L, y1: plotBottom, x2: PAD_L, y2: PAD_T, class: 'axis-line', 'marker-end': 'url(#graph-arrowhead)' }))

  // Achsenbeschriftungen (Symbole kursiv, unit-los)
  const xl = el('text', { x: PAD_L + plotW + 14, y: y0px + 4, 'text-anchor': 'start', class: 'axis-label' })
  setAxisLabel(xl, 'x')
  DOM.gridGroup.appendChild(xl)
  const yl = el('text', { x: PAD_L - 4, y: PAD_T - 12, 'text-anchor': 'middle', class: 'axis-label' })
  setAxisLabel(yl, 'y')
  DOM.gridGroup.appendChild(yl)

  // Funktionskurve
  const { xs, ys } = store.curve
  let pts = ''
  for (let i = 0; i < xs.length; i++) {
    const p = physToScreen(xs[i], ys[i])
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
  const p0 = physToScreen(a.x0, a.y0)
  DOM.point.setAttribute('cx', p0.x)
  DOM.point.setAttribute('cy', p0.y)
  show(DOM.point)

  // Tangente über den gesamten Definitionsbereich (Clip beschneidet vertikal)
  if (store.showTangent) {
    const tA = physToScreen(X_MIN, a.mTan * (X_MIN - a.x0) + a.y0)
    const tB = physToScreen(X_MAX, a.mTan * (X_MAX - a.x0) + a.y0)
    DOM.tangentLine.setAttribute('points', `${tA.x},${tA.y} ${tB.x},${tB.y}`)
    show(DOM.tangentLine)
  } else {
    hide(DOM.tangentLine)
  }

  // Sekante + Steigungsdreieck (Geometrie)
  const secGeom = [DOM.secantLine, DOM.p1Dot, DOM.p2Dot, DOM.triH, DOM.triV]
  const secValid = store.showSecant && !Number.isNaN(a.mSec)
  const p1 = physToScreen(a.x1, a.y1)
  const p2 = physToScreen(a.x2, a.y2)
  if (secValid) {
    const sA = physToScreen(X_MIN, a.mSec * (X_MIN - a.x1) + a.y1)
    const sB = physToScreen(X_MAX, a.mSec * (X_MAX - a.x1) + a.y1)
    DOM.secantLine.setAttribute('points', `${sA.x},${sA.y} ${sB.x},${sB.y}`)

    DOM.p1Dot.setAttribute('cx', p1.x); DOM.p1Dot.setAttribute('cy', p1.y)
    DOM.p2Dot.setAttribute('cx', p2.x); DOM.p2Dot.setAttribute('cy', p2.y)

    // Steigungsdreieck: horizontale Kathete (Δx) auf Höhe y₁, vertikale (Δy) bei x₂
    DOM.triH.setAttribute('x1', p1.x); DOM.triH.setAttribute('y1', p1.y)
    DOM.triH.setAttribute('x2', p2.x); DOM.triH.setAttribute('y2', p1.y)
    DOM.triV.setAttribute('x1', p2.x); DOM.triV.setAttribute('y1', p1.y)
    DOM.triV.setAttribute('x2', p2.x); DOM.triV.setAttribute('y2', p2.y)

    show(...secGeom)
  } else {
    hide(...secGeom)
  }

  // Δx-/Δy-Werte am Dreieck — eigener Toggle, nur sinnvoll bei sichtbarem Dreieck
  if (secValid && store.showDeltaValues) {
    const midH = physToScreen((a.x1 + a.x2) / 2, a.y1)
    DOM.dxText.setAttribute('x', midH.x)
    DOM.dxText.setAttribute('y', p1.y + (a.dy >= 0 ? 15 : -8))
    createStyledSvgText(DOM.dxText, `Δ<i>x</i> = ${fmt(a.dx)}`)
    const midV = physToScreen(a.x2, (a.y1 + a.y2) / 2)
    DOM.dyText.setAttribute('x', p2.x + (a.dx >= 0 ? 6 : -6))
    DOM.dyText.setAttribute('y', midV.y)
    DOM.dyText.setAttribute('text-anchor', a.dx >= 0 ? 'start' : 'end')
    createStyledSvgText(DOM.dyText, `Δ<i>y</i> = ${fmt(a.dy)}`)
    show(DOM.dxText, DOM.dyText)
  } else {
    hide(DOM.dxText, DOM.dyText)
  }

  // Steigungs-Readout oben links im Plot (Tangente/Sekante), unabhängig toggelbar
  const rx = PAD_L + 12, ry0 = PAD_T + 18, rlh = 20
  let slot = 0
  if (store.showTangentSlope) {
    DOM.tanSlopeText.setAttribute('x', rx)
    DOM.tanSlopeText.setAttribute('y', ry0 + slot * rlh)
    createStyledSvgText(DOM.tanSlopeText, `Tangente: <i>m</i> = ${fmt(a.mTan, 3)}`)
    show(DOM.tanSlopeText); slot++
  } else {
    hide(DOM.tanSlopeText)
  }
  if (store.showSecantSlope && !Number.isNaN(a.mSec)) {
    DOM.secSlopeText.setAttribute('x', rx)
    DOM.secSlopeText.setAttribute('y', ry0 + slot * rlh)
    createStyledSvgText(DOM.secSlopeText, `Sekante: <i>m</i>${sub('s')} = ${fmt(a.mSec, 3)}`)
    show(DOM.secSlopeText); slot++
  } else {
    hide(DOM.secSlopeText)
  }
}

// Kleiner tiefgestellter Index (Unicode-Fallback: 's' → 'ₛ')
function sub(ch) { return ch === 's' ? 'ₛ' : ch }

// ── Analyse-Panel (rechts) ───────────────────────────────────────────────────
export function updateAnalysis() {
  const a = store.analysis
  if (!a) return
  DOM.anX0.textContent = fmt(a.x0)
  DOM.anDx.textContent = fmt(a.dx)
  DOM.anDy.textContent = fmt(a.dy)
  DOM.anMSec.textContent = Number.isNaN(a.mSec) ? '— (Δx = 0)' : fmt(a.mSec, 3)
  DOM.anMTan.textContent = fmt(a.mTan, 3)
  DOM.anDiff.textContent = Number.isNaN(a.mSec) ? '—' : fmt(Math.abs(a.mSec - a.mTan), 3)
}
