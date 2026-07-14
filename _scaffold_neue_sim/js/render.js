'use strict'

import { TRACK_Y, TRACK_X0, PPM, TRACK_LEN_M, BALL_R,
         PIXELS_PER_VEL, PIXELS_PER_ACC, VEC_MARKER_LEN,
         GRAPH_W, GRAPH_H } from './constants.js'
import { store, DOM } from './state.js'
import { xToScreen, interpolateAt } from './physics.js'
import { fmt } from '../../shared/js/format.js'
import { setAxisLabel, setGraphTitle } from '../../shared/js/svg-text.js'
import { getNiceTick, tAxisStep } from '../../shared/js/ticks.js'
import { shortenEnd } from '../../shared/js/vectors.js'

const NS = 'http://www.w3.org/2000/svg'
const el = (tag, attrs) => {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  return e
}

// ── Statischer Hintergrund: Bahn-Lineal (einmal je Reset) ──────────────────────
export function drawBackground() {
  DOM.rulerGroup.innerHTML = ''
  for (let m = 0; m <= TRACK_LEN_M; m += 1) {
    const xp = xToScreen(m)
    const major = m % 5 === 0
    DOM.rulerGroup.appendChild(el('line', {
      x1: xp, y1: TRACK_Y + 6, x2: xp, y2: TRACK_Y + 6 + (major ? 9 : 5),
      class: 'ruler-tick', 'stroke-width': major ? 1.5 : 1,
    }))
    if (major) {
      const t = el('text', { x: xp, y: TRACK_Y + 30, 'text-anchor': 'middle', class: 'ruler-text' })
      t.textContent = String(m)
      DOM.rulerGroup.appendChild(t)
    }
  }
}

// ── Statisches Diagramm: Achsen, Gitter, VOLLE Kurve (einmal je Reset) ──────────
// precompute hat die Daten schon berechnet — hier wird die ganze Kurve gezeichnet
// und die Skalen in store.gScale abgelegt, damit updateScene nur den Marker bewegt.
export function drawGraph() {
  const { graphType, t_data, x_data, v_data, a_data, t_end } = store
  DOM.gridGroup.innerHTML = ''
  DOM.gridGroup.appendChild(el('rect',
    { x: 0, y: -15, width: GRAPH_W + 15, height: GRAPH_H + 15, class: 'graph-bg' }))

  const arr = graphType === 'ort' ? x_data : graphType === 'geschw' ? v_data : a_data
  const yLabel = graphType === 'ort' ? 'x / m' : graphType === 'geschw' ? 'v / (m/s)' : 'a / (m/s²)'
  const title  = graphType === 'ort' ? 'Ort-Zeit x(t)'
               : graphType === 'geschw' ? 'Geschwindigkeit-Zeit v(t)'
               : 'Beschleunigung-Zeit a(t)'

  const tMax = Math.max(t_end, 0.5)
  const gw   = GRAPH_W - 20
  const scX  = t => (t / tMax) * gw

  // Werteachse: Datenspanne + 10 % Luft, 0 stets enthalten
  let vMin = arr.length ? Math.min(...arr) : 0
  let vMax = arr.length ? Math.max(...arr) : 1
  const rng = vMax - vMin
  if (rng < 0.01) { vMin -= 1; vMax += 1 } else { vMin -= rng * 0.1; vMax += rng * 0.1 }
  if (vMin > 0) vMin = 0
  if (vMax < 0) vMax = 0

  const step = getNiceTick(vMax - vMin)
  let axMin  = Math.floor(vMin / step) * step
  let axMax  = Math.ceil(vMax / step) * step
  if (axMin === axMax) { axMin -= step; axMax += step }
  const axRng = axMax - axMin || 1
  const scY   = v => GRAPH_H - 10 - ((v - axMin) / axRng) * (GRAPH_H - 30)
  const x0 = scX(0), y0 = scY(0)

  // Vertikale Gitterlinien + Zeit-Ticks (≥4 Ticks inkl. 0 via tAxisStep)
  const tStep = tAxisStep(tMax)
  const tDec  = tStep >= 1 ? 1 : tStep >= 0.1 ? 2 : 3
  for (let tc = 0; tc <= tMax + tStep * 0.01; tc = Math.round((tc + tStep) * 1e6) / 1e6) {
    const xp = scX(Math.min(tc, tMax))
    if (Math.abs(xp - x0) > 2)
      DOM.gridGroup.appendChild(el('line', { x1: xp, y1: 5, x2: xp, y2: GRAPH_H - 5, class: 'grid-line' }))
    const tv = el('text', { x: xp, y: y0 + 16, 'text-anchor': 'middle', class: 'tick-label' })
    tv.textContent = fmt(tc, tDec)
    DOM.gridGroup.appendChild(tv)
  }

  // Horizontale Gitterlinien + Wert-Ticks
  const nY = Math.round((axMax - axMin) / step) + 1
  const yDec = step % 1 === 0 ? 0 : step >= 0.1 ? 1 : 2
  for (let i = 0; i < nY; i++) {
    const v = axMin + i * step, yp = scY(v)
    if (Math.abs(yp - y0) > 2 || Math.abs(v) > 1e-3)
      DOM.gridGroup.appendChild(el('line', { x1: 0, y1: yp, x2: GRAPH_W, y2: yp, class: 'grid-line' }))
    const tv = el('text', { x: x0 - 5, y: yp + 4, 'text-anchor': 'end', class: 'tick-label' })
    tv.textContent = fmt(v, yDec)
    DOM.gridGroup.appendChild(tv)
  }

  // Achsenlinien mit Pfeilspitzen
  DOM.gridGroup.appendChild(el('line', { x1: x0, y1: y0, x2: GRAPH_W - 5, y2: y0, class: 'axis-line', 'stroke-width': 2, 'marker-end': 'url(#arrow-axis)' }))
  DOM.gridGroup.appendChild(el('line', { x1: x0, y1: GRAPH_H - 5, x2: x0, y2: 5, class: 'axis-line', 'stroke-width': 2, 'marker-end': 'url(#arrow-axis)' }))

  // Achsenbeschriftung (Größe kursiv, Einheit aufrecht — shared setAxisLabel)
  const xl = el('text', { x: GRAPH_W / 2, y: y0 + 34, 'text-anchor': 'middle', class: 'axis-label' })
  setAxisLabel(xl, 't / s'); DOM.gridGroup.appendChild(xl)
  const yl = el('text', { x: x0 - 42, y: GRAPH_H / 2, transform: `rotate(-90 ${x0 - 42} ${GRAPH_H / 2})`, 'text-anchor': 'middle', class: 'axis-label' })
  setAxisLabel(yl, yLabel); DOM.gridGroup.appendChild(yl)

  // Volle Datenkurve
  let pts = ''
  for (let i = 0; i < t_data.length; i++) pts += `${scX(t_data[i])},${scY(arr[i])} `
  DOM.graphLine.setAttribute('points', pts)

  // Titel als LETZTES SVG-Kind, klar über dem weißen Rechteck (y=-22, group-relativ)
  setGraphTitle(DOM.graphTitle, title)

  store.gScale = { scX, scY, arr }
}

// ── shortenEnd + null-Guard (kanonische Pfeilspitzen-Geometrie, B23) ───────────
function drawVec(lineEl, x1, y1, x2, y2, on) {
  if (!on) { lineEl.style.visibility = 'hidden'; return }
  const end = shortenEnd(x1, y1, x2, y2, VEC_MARKER_LEN)
  if (!end) { lineEl.style.visibility = 'hidden'; return }   // Vektor kürzer als Spitze → verbergen
  lineEl.setAttribute('x1', x1); lineEl.setAttribute('y1', y1)
  lineEl.setAttribute('x2', end.x2); lineEl.setAttribute('y2', end.y2)
  lineEl.style.visibility = 'visible'
}

// ── Animierte Elemente (jeder Frame): NUR indizieren/interpolieren, nie rechnen ─
export function updateScene(t) {
  const tc = Math.min(t, store.t_end)
  const x = interpolateAt(store.x_data, tc)
  const v = interpolateAt(store.v_data, tc)
  const a = store.a
  const bx = xToScreen(x)

  DOM.ball.setAttribute('cx', bx)
  DOM.ball.setAttribute('cy', TRACK_Y)

  drawVec(DOM.velVector, bx, TRACK_Y,      bx + v * PIXELS_PER_VEL, TRACK_Y,      DOM.togVel.checked)
  drawVec(DOM.accVector, bx, TRACK_Y + 24, bx + a * PIXELS_PER_ACC, TRACK_Y + 24, DOM.togAcc.checked)

  // Diagramm-Marker auf der bereits gezeichneten Kurve
  if (store.gScale) {
    const val = interpolateAt(store.gScale.arr, tc)
    DOM.graphPoint.setAttribute('cx', store.gScale.scX(tc))
    DOM.graphPoint.setAttribute('cy', store.gScale.scY(val))
    DOM.graphPoint.setAttribute('visibility', 'visible')
  }

  // Live-Panel (Symbole kursiv via <i>, s. index.html; Werte mit shared fmt)
  DOM.timeLabel.innerHTML = `<i>t</i> = ${fmt(tc)} s`
  DOM.liveT.textContent = `${fmt(tc)} s`
  DOM.liveX.textContent = `${fmt(x)} m`
  DOM.liveV.textContent = `${fmt(v)} m/s`
  DOM.liveA.textContent = `${fmt(a)} m/s²`
}
