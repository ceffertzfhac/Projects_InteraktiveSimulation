'use strict'

import { T_MIN, T_MAX, PAD_L, PAD_R, PAD_T, PAD_B, PLOT_W, PLOT_H, GRAPH_W, GRAPH_H } from './constants.js'
import { store, DOM } from './state.js'
import { fmt } from '../../shared/js/format.js'
import { setAxisLabel, setGraphTitle } from '../../shared/js/svg-text.js'
import { shortenEnd } from '../../shared/js/vectors.js'

const NS = 'http://www.w3.org/2000/svg'

function el(tag, attrs) {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  return e
}

// ── Bahnkurve ist FEST → Bounds/Skalierung einmalig aus dem Maximum von y(t)
// ableitbar (Original: setupScales() bei jedem drawScene() neu berechnet,
// liefert aber wegen fester Kurve stets denselben Wert — hier daher als
// einmalige Konstante behandelt statt pro Aufruf neu zu rechnen).
const X_MIN = 0, Y_MIN = 0
const targetAspect = PLOT_W / PLOT_H

// Physik (x,y) → Bildschirm (Pixel im viewBox). store.yMaxBound/xMaxBound
// werden einmalig in ui.js aus dem Maximum der festen Bahnkurve gesetzt.
export function physToScreen(x, y) {
  const sx = PAD_L + ((x - X_MIN) / (store.xMaxBound - X_MIN)) * PLOT_W
  const sy = (PAD_T + PLOT_H) - ((y - Y_MIN) / (store.yMaxBound - Y_MIN)) * PLOT_H
  return { x: sx, y: sy }
}

// Bounds so wählen, daß das feste Seitenverhältnis PLOT_W/PLOT_H erhalten
// bleibt (1:1 aus dem Original übernommenes Verfahren).
export function computeBounds(pathYMax) {
  const dataXMax = T_MAX + 0.5
  const dataYMax = pathYMax + 0.5
  let xMaxBound, yMaxBound
  if ((dataXMax / dataYMax) > targetAspect) {
    xMaxBound = dataXMax
    yMaxBound = dataXMax / targetAspect
  } else {
    yMaxBound = dataYMax
    xMaxBound = dataYMax * targetAspect
  }
  return { xMaxBound, yMaxBound }
}

// ── Statisches Gitter/Achsen/Titel (einmalig — Bounds ändern sich nie) ──────
export function drawGrid() {
  DOM.gridGroup.innerHTML = ''
  const x0 = physToScreen(0, 0).x, y0 = physToScreen(0, 0).y

  for (let xv = Math.ceil(X_MIN); xv <= Math.floor(store.xMaxBound); xv++) {
    const p = physToScreen(xv, 0)
    DOM.gridGroup.appendChild(el('line', { x1: p.x, y1: physToScreen(0, store.yMaxBound).y, x2: p.x, y2: physToScreen(0, Y_MIN).y, class: 'grid-line' }))
    const t = el('text', { x: p.x, y: y0 + 15, 'text-anchor': 'middle', class: 'tick-label' })
    t.textContent = xv
    DOM.gridGroup.appendChild(t)
  }
  for (let yv = Math.ceil(Y_MIN); yv <= Math.floor(store.yMaxBound); yv++) {
    const p = physToScreen(0, yv)
    DOM.gridGroup.appendChild(el('line', { x1: physToScreen(X_MIN, 0).x, y1: p.y, x2: physToScreen(store.xMaxBound, 0).x, y2: p.y, class: 'grid-line' }))
    const t = el('text', { x: x0 - 10, y: p.y, 'text-anchor': 'end', 'dominant-baseline': 'middle', class: 'tick-label' })
    t.textContent = yv
    DOM.gridGroup.appendChild(t)
  }

  DOM.gridGroup.appendChild(el('line', { x1: physToScreen(X_MIN, 0).x, y1: y0, x2: physToScreen(store.xMaxBound, 0).x, y2: y0, class: 'axis-line', 'marker-end': 'url(#graph-arrowhead)' }))
  DOM.gridGroup.appendChild(el('line', { x1: x0, y1: physToScreen(0, Y_MIN).y, x2: x0, y2: physToScreen(0, store.yMaxBound).y, class: 'axis-line', 'marker-end': 'url(#graph-arrowhead)' }))

  // Achsformat „Symbol / Einheit" (CLAUDE.md-Konvention) statt der
  // deskriptiven Original-Labels „x-Position"/„y-Position" — konsistent mit
  // allen anderen Sims im Repo (z. B. „t / s", nicht „Zeit-Position / s").
  const xLabel = el('text', { x: physToScreen(store.xMaxBound, 0).x, y: y0 + 35, 'text-anchor': 'end', class: 'axis-label' })
  setAxisLabel(xLabel, 'x / m')
  DOM.gridGroup.appendChild(xLabel)
  const yLabel = el('text', { x: x0 + 10, y: physToScreen(0, store.yMaxBound).y - 20, 'text-anchor': 'start', class: 'axis-label' })
  setAxisLabel(yLabel, 'y / m')
  DOM.gridGroup.appendChild(yLabel)

  const title = el('text', { id: 'graph_title', x: PAD_L + PLOT_W / 2, y: PAD_T - 15, 'text-anchor': 'middle', class: 'graph-title-text' })
  setGraphTitle(title, 'Bahndiagramm x-y-Diagramm')
  DOM.gridGroup.appendChild(title)
}

// Kombiniertes Symbol-Label „s⃗" mit tiefgestelltem Index (Original-Unicode-
// Trick: Combining-Arrow U+20D7 auf 's', Index als <tspan baseline-shift>).
function vectorLabelHTML(sub) {
  return `s⃗<tspan baseline-shift="sub" font-size="0.7em">${sub}</tspan>`
}
function deltaLabelHTML(sub) {
  return `Δs⃗<tspan baseline-shift="sub" font-size="0.7em">${sub}</tspan>`
}

// ── Dynamischer Overlay: Punkte A/B, Vektoren, Verschiebung, Abstand, Weg ───
// highlightId: beim Hover über eine Steuerzeile hervorgehobenes Element
// (dickerer Strich) — reiner Render-Parameter, fließt nicht in physics.js/
// store.ab ein (vermeidet den im Original latenten Smell, s. BACKLOG M11).
export function updateVisualization(highlightId = null) {
  DOM.plotArea.innerHTML = ''
  const ab = store.ab
  if (!ab) return
  const t = store.toggles

  const xA = physToScreen(ab.x_A, ab.y_A).x, yA = physToScreen(ab.x_A, ab.y_A).y
  const xB = physToScreen(ab.x_B, ab.y_B).x, yB = physToScreen(ab.x_B, ab.y_B).y
  const x0 = physToScreen(0, 0).x, y0 = physToScreen(0, 0).y

  if (t.pathBg) {
    const { x, y } = store.path
    let d = ''
    for (let i = 0; i < x.length; i++) {
      const p = physToScreen(x[i], y[i])
      d += `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)} `
    }
    DOM.plotArea.appendChild(el('path', { id: 'full_path_visual', d, fill: 'none', class: 'path-bg-line', 'stroke-width': highlightId === 'pathBg' ? 4.5 : 2.5 }))
  }

  // Kanonische Pfeilspitzen-Geometrie (CLAUDE.md: refX=0 + shortenEnd, s.
  // Marker-Defs in index.html) — Original nutzte refX=markerWidth ohne
  // Schaft-Kürzung (bekanntes, halb-falsches Muster, s. CLAUDE.md-Warnung).
  const vecLine = (id, cls, x1, y1, x2, y2, sw, markerId) => {
    const s = shortenEnd(x1, y1, x2, y2, 5 * sw)
    // B23: Vektor kürzer als Pfeilspitze → verborgene Linie (Label bleibt
    // sichtbar, Aufrufer appendChild unverändert nutzbar).
    if (!s) return el('line', { id, x1, y1, x2, y2, class: cls, 'stroke-width': sw, 'marker-end': `url(#${markerId})`, display: 'none' })
    return el('line', { id, x1, y1, x2: s.x2, y2: s.y2, class: cls, 'stroke-width': sw, 'marker-end': `url(#${markerId})` })
  }

  if (t.sA) {
    DOM.plotArea.appendChild(vecLine('vector_sA', 'pos-vector', x0, y0, xA, yA, highlightId === 'sA' ? 4 : 2, 'arrowhead-pos'))
    const label = el('text', { class: 'pos-vector-label vector-label', 'text-anchor': 'middle' })
    label.innerHTML = vectorLabelHTML('A')
    placeSideLabel(label, x0, y0, xA, yA, xB, yB)
    DOM.plotArea.appendChild(label)
  }
  if (t.sB) {
    DOM.plotArea.appendChild(vecLine('vector_sB', 'pos-vector', x0, y0, xB, yB, highlightId === 'sB' ? 4 : 2, 'arrowhead-pos'))
    const label = el('text', { class: 'pos-vector-label vector-label', 'text-anchor': 'middle' })
    label.innerHTML = vectorLabelHTML('B')
    placeSideLabel(label, x0, y0, xB, yB, xA, yA)
    DOM.plotArea.appendChild(label)
  }
  if (t.verschiebung_BA) {
    const line = vecLine('vector_verschiebung_BA', 'dba-vector', xA, yA, xB, yB, highlightId === 'verschiebung_BA' ? 4.5 : 2.5, 'arrowhead-dba')
    line.setAttribute('stroke-dasharray', '5,5')
    DOM.plotArea.appendChild(line)
    const label = el('text', { class: 'dba-vector-label vector-label', 'text-anchor': 'middle' })
    label.innerHTML = deltaLabelHTML('BA')
    placeAlongLabel(label, xA, yA, xB, yB)
    DOM.plotArea.appendChild(label)
  }
  if (t.verschiebung_AB) {
    const line = vecLine('vector_verschiebung_AB', 'dab-vector', xB, yB, xA, yA, highlightId === 'verschiebung_AB' ? 4.5 : 2.5, 'arrowhead-dab')
    line.setAttribute('stroke-dasharray', '5,5')
    DOM.plotArea.appendChild(line)
    const label = el('text', { class: 'dab-vector-label vector-label', 'text-anchor': 'middle' })
    label.innerHTML = deltaLabelHTML('AB')
    placeAlongLabel(label, xB, yB, xA, yA)
    DOM.plotArea.appendChild(label)
  }
  if (t.abstand) drawAbstandDimension(xA, yA, xB, yB, x0, y0)
  if (t.weg) {
    const { x, y } = store.path
    let d = ''
    for (let i = ab.indexA; i <= ab.indexB; i++) {
      const p = physToScreen(x[i], y[i])
      d += `${i === ab.indexA ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)} `
    }
    DOM.plotArea.appendChild(el('path', { id: 'segment_path_visual', d, fill: 'none', class: 'weg-line', 'stroke-width': highlightId === 'weg' ? 5 : 3.5 }))
  }

  DOM.plotArea.appendChild(el('circle', { id: 'point_A', cx: xA, cy: yA, r: 5, class: 'ab-point' }))
  DOM.plotArea.appendChild(el('circle', { id: 'point_B', cx: xB, cy: yB, r: 5, class: 'ab-point' }))

  updateValueDisplays()
}

// Label-Platzierung senkrecht zum Vektor, auf der vom jeweils anderen Punkt
// abgewandten Seite (Kreuzprodukt-Vorzeichen-Check — 1:1 aus dem Original).
function placeSideLabel(label, x0, y0, xP, yP, xOther, yOther) {
  const vx = xP - x0, vy = yP - y0
  const checkX = xOther - x0, checkY = yOther - y0
  const side = vx * checkY - vy * checkX
  const sign = -Math.sign(side) || -1
  const nx = -vy, ny = vx
  const len = Math.hypot(nx, ny) || 1
  label.setAttribute('x', (x0 + xP) / 2 + sign * 20 * nx / len)
  label.setAttribute('y', (y0 + yP) / 2 + sign * 20 * ny / len)
}

// Label entlang der Verschiebungslinie, lesbar ausgerichtet (nie kopfüber).
function placeAlongLabel(label, xFrom, yFrom, xTo, yTo) {
  const dx = xTo - xFrom, dy = yTo - yFrom
  const angle = Math.atan2(dy, dx) * 180 / Math.PI
  const flipped = angle > 90 || angle < -90
  const readableAngle = flipped ? angle + 180 : angle
  const offset = flipped ? 15 : -15
  const mx = (xFrom + xTo) / 2, my = (yFrom + yTo) / 2
  label.setAttribute('x', mx)
  label.setAttribute('y', my)
  label.setAttribute('transform', `rotate(${readableAngle} ${mx} ${my}) translate(0, ${offset})`)
}

// Bemaßungslinie „Abstand" mit Endstrichen, senkrecht versetzt auf die vom
// Ursprung abgewandte Seite (1:1 aus dem Original übernommene Geometrie).
function drawAbstandDimension(xA, yA, xB, yB, x0, y0) {
  const dx = xB - xA, dy = yB - yA, len = Math.hypot(dx, dy)
  const group = el('g', { id: 'dimension_line_abstand', class: 'abstand-dim' })
  if (len > 5) {
    const offset = 25, tickLength = 8
    const originSide = dx * (y0 - yA) - dy * (x0 - xA)
    const sign = Math.sign(originSide) || 1
    const nx = -dy / len, ny = dx / len
    const xAo = xA + offset * nx * sign, yAo = yA + offset * ny * sign
    const xBo = xB + offset * nx * sign, yBo = yB + offset * ny * sign
    group.appendChild(el('line', { x1: xAo, y1: yAo, x2: xBo, y2: yBo }))
    const udx = dx / len, udy = dy / len
    group.appendChild(el('line', { x1: xAo - udy * tickLength / 2, y1: yAo + udx * tickLength / 2, x2: xAo + udy * tickLength / 2, y2: yAo - udx * tickLength / 2 }))
    group.appendChild(el('line', { x1: xBo - udy * tickLength / 2, y1: yBo + udx * tickLength / 2, x2: xBo + udy * tickLength / 2, y2: yBo - udx * tickLength / 2 }))
    group.appendChild(el('line', { x1: xA, y1: yA, x2: xAo, y2: yAo, class: 'abstand-projline' }))
    group.appendChild(el('line', { x1: xB, y1: yB, x2: xBo, y2: yBo, class: 'abstand-projline' }))
    const angle = Math.atan2(dy, dx) * 180 / Math.PI
    const readableAngle = (angle > 90 || angle < -90) ? angle + 180 : angle
    const tx = (xAo + xBo) / 2, ty = (yAo + yBo) / 2
    const label = el('text', { 'text-anchor': 'middle', 'dominant-baseline': 'hanging', transform: `rotate(${readableAngle} ${tx} ${ty}) translate(0, 5)`, class: 'vector-label' })
    label.setAttribute('x', tx); label.setAttribute('y', ty)
    label.innerHTML = `|Δs⃗<tspan baseline-shift="sub" font-size="0.7em">BA</tspan>|`
    group.appendChild(label)
  }
  DOM.plotArea.appendChild(group)
}

// ── Wertanzeigen neben den Toggle-Zeilen (linke Sidebar) ────────────────────
function vectorValueHTML(x, y) {
  return `<div class="vector-display"><div class="vector-components"><span>${fmt(x)}</span><span>${fmt(y)}</span></div></div> m`
}
function updateValueDisplays() {
  const ab = store.ab, t = store.toggles
  DOM.values.sA.innerHTML = t.sA ? vectorValueHTML(ab.x_A, ab.y_A) : ''
  DOM.values.sB.innerHTML = t.sB ? vectorValueHTML(ab.x_B, ab.y_B) : ''
  DOM.values.verschiebung_BA.innerHTML = t.verschiebung_BA ? vectorValueHTML(ab.x_B - ab.x_A, ab.y_B - ab.y_A) : ''
  DOM.values.verschiebung_AB.innerHTML = t.verschiebung_AB ? vectorValueHTML(ab.x_A - ab.x_B, ab.y_A - ab.y_B) : ''
  DOM.values.abstand.textContent = t.abstand ? `${fmt(ab.deltaS_mag)} m` : ''
  DOM.values.weg.textContent = t.weg ? `${fmt(ab.s_AB_length)} m` : ''
}

// ── Rechte Analyse-Sidebar: nur display umschalten (kein typesetPromise) ───
export function updateAnalysisBox(key) {
  const id = DOM.analysisVariants[key] ? key : 'default'
  store.currentVariant = id
  for (const [k, elDiv] of Object.entries(DOM.analysisVariants)) {
    elDiv.style.display = k === id ? '' : 'none'
  }
}
