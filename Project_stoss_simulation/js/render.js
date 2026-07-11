'use strict'

import {
  SVG_W, SVG_H, TRACK_Y, TRACK_H, GLIDER_H, GLIDER_WIDTH_M, SPRING_REST_LENGTH_M,
  DEFAULT_PPM, MIN_PPM, SIDE_MARGIN_PX, PIXELS_PER_VELOCITY_UNIT,
  SW_HAND_LEN, GRAPH_W, GRAPH_H, X1_START_M, X2_START_M,
} from './constants.js'
import { store, DOM } from './state.js'
import { interpolateAt } from './physics.js'
import { fmt } from '../../shared/js/format.js'
import { shortenEnd } from '../../shared/js/vectors.js'
import { setAxisLabel, setGraphTitle } from '../../shared/js/svg-text.js'
import { tAxisStep, niceStepLE } from '../../shared/js/ticks.js'
export { fmt }

const NS = 'http://www.w3.org/2000/svg'

function el(tag, attrs) {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  return e
}
function textEl(text, x, y, anchor, cls) {
  const t = el('text', { x, y, 'text-anchor': anchor, class: cls })
  t.textContent = text
  return t
}

// ── Koordinatentransformation (zentral, siehe CLAUDE.md) ────────────────────
export function physToScreen(x_m, y_m = 0) {
  return {
    x: SVG_W / 2 + (x_m - store.panOffsetM) * store.ppm,
    y: TRACK_Y - y_m * store.ppm,
  }
}

// ── Auto-Zoom/Pan: einmalig aus den precompute-Arrays berechnet, damit beide
//    Gleiter über die gesamte Simulationsdauer im Sichtbereich bleiben ─────
// Der Kamera-Mittelpunkt ist FEST auf den Start-Mittelpunkt (X1_START_M+
// X2_START_M)/2 verankert — nur der Zoom (ppm) paßt sich der tatsächlich
// gebrauchten Spannweite an. Würde stattdessen (minX+maxX)/2 über den
// gesamten Verlauf verwendet (asymmetrischer Nachlauf, z. B. weil eine
// leichte Masse nach dem Stoß weiter zurückspringt als die schwere Masse
// vorankommt), verschiebt sich der Mittelpunkt mit jedem Regler, der die
// Stoßdauer beeinflußt (v. a. die Federkonstante k) — sichtbar als „Laufen"
// der ruhenden Gleiter im Fenster, obwohl noch gar nicht abgespielt wird.
export function fitCamera() {
  const halfW = GLIDER_WIDTH_M / 2
  const center = (X1_START_M + X2_START_M) / 2
  let maxReach = 0
  for (const arr of [store.x1_data, store.x2_data]) {
    for (const x of arr) {
      const reach = Math.abs(x - center) + halfW
      if (reach > maxReach) maxReach = reach
    }
  }
  const rangeM = Math.max(2 * maxReach, 1.0)
  const availablePx = SVG_W - 2 * SIDE_MARGIN_PX
  store.ppm = Math.min(DEFAULT_PPM, Math.max(MIN_PPM, availablePx / rangeM))
  store.panOffsetM = center
}

// ── Statische Szene: Fahrbahn + Ständer ──────────────────────────────────────
export function drawBackground() {
  DOM.trackGroup.innerHTML = ''
  const p0 = physToScreen(-100), p1 = physToScreen(100) // weit über den sichtbaren Bereich hinaus
  DOM.trackGroup.appendChild(el('rect', {
    x: 0, y: TRACK_Y, width: SVG_W, height: TRACK_H, class: 'track-bed',
  }))
  DOM.trackGroup.appendChild(el('line', {
    x1: 0, y1: TRACK_Y, x2: SVG_W, y2: TRACK_Y, class: 'track-edge',
  }))
  DOM.trackGroup.appendChild(el('line', {
    x1: 0, y1: TRACK_Y + TRACK_H, x2: SVG_W, y2: TRACK_Y + TRACK_H, class: 'track-edge',
  }))

  // Meter-Markierungen auf der Bahn
  const vL = store.panOffsetM - (SVG_W / 2) / store.ppm
  const vR = store.panOffsetM + (SVG_W / 2) / store.ppm
  const start = Math.ceil(vL * 2) / 2
  for (let g = start; g <= vR; g += 0.5) {
    const gFix = Math.round(g * 10) / 10
    const { x } = physToScreen(gFix)
    if (x < -5 || x > SVG_W + 5) continue
    DOM.trackGroup.appendChild(el('line', {
      x1: x, y1: TRACK_Y + TRACK_H - 8, x2: x, y2: TRACK_Y + TRACK_H, class: 'track-tick',
    }))
    if (Math.abs(gFix % 1) < 0.01) {
      DOM.trackGroup.appendChild(textEl(`${fmt(gFix, 0)} m`, x, TRACK_Y + TRACK_H + 14, 'middle', 'track-tick-label'))
    }
  }

  // Standfüße an beiden Enden der Bahn
  DOM.trackGroup.appendChild(el('rect', { x: 20, y: TRACK_Y + TRACK_H, width: 14, height: 30, class: 'track-foot' }))
  DOM.trackGroup.appendChild(el('rect', { x: SVG_W - 34, y: TRACK_Y + TRACK_H, width: 14, height: 30, class: 'track-foot' }))
}

function drawZigzagSpring(x1, x2, y, amplitude) {
  const coils = 6
  const w = x2 - x1
  if (w <= 1) return `M ${x1} ${y} L ${x2} ${y}`
  const seg = w / (coils * 2)
  let d = `M ${x1} ${y}`
  for (let i = 0; i < coils * 2; i++) {
    const x = x1 + (i + 1) * seg
    const y2 = y + (i % 2 === 0 ? -amplitude : amplitude)
    d += ` L ${x} ${y2}`
  }
  d += ` L ${x2} ${y}`
  return d
}

// ── Szene aktualisieren (Gleiter, Feder, Vektoren, Schwerpunkt, Stoppuhr) ───
export function updateScene(t) {
  const { m1, m2, m1Inf, m2Inf, kInf, showVectors, showCom } = store
  const v1 = interpolateAt(store.v1_data, t)
  const v2 = interpolateAt(store.v2_data, t)
  const x1 = interpolateAt(store.x1_data, t)
  const x2 = interpolateAt(store.x2_data, t)

  const p1 = physToScreen(x1)
  const p2 = physToScreen(x2)
  const halfWpx = (GLIDER_WIDTH_M / 2) * store.ppm
  const gliderTop = TRACK_Y - GLIDER_H

  DOM.glider1Group.setAttribute('transform', `translate(${p1.x - halfWpx}, ${gliderTop})`)
  DOM.glider1Rect.setAttribute('width', String(2 * halfWpx))
  DOM.glider1Rect.setAttribute('height', String(GLIDER_H))
  DOM.glider1Rect.setAttribute('class', `glider glider-1${m1Inf ? ' glider-inf' : ''}`)
  DOM.glider1Label.setAttribute('x', String(halfWpx))
  DOM.glider1Label.setAttribute('y', String(GLIDER_H / 2 + 4))
  DOM.glider1Label.textContent = m1Inf ? '∞' : `${fmt(m1, 1)} kg`

  DOM.glider2Group.setAttribute('transform', `translate(${p2.x - halfWpx}, ${gliderTop})`)
  DOM.glider2Rect.setAttribute('width', String(2 * halfWpx))
  DOM.glider2Rect.setAttribute('height', String(GLIDER_H))
  DOM.glider2Rect.setAttribute('class', `glider glider-2${m2Inf ? ' glider-inf' : ''}`)
  DOM.glider2Label.setAttribute('x', String(halfWpx))
  DOM.glider2Label.setAttribute('y', String(GLIDER_H / 2 + 4))
  DOM.glider2Label.textContent = m2Inf ? '∞' : `${fmt(m2, 1)} kg`

  // Federstummel / Prellbock — je EIN unabhängiges Element pro Gleiter mit
  // fester Ruhelänge (SPRING_REST_LENGTH_M/2), nicht eine einzelne Feder, die
  // über die gesamte Lücke zwischen den Gleitern spannt (das würde eine
  // permanente Kopplung suggerieren — physikalisch falsch: die Gleiter sind
  // zwei unabhängige freie Körper, die nur beim Kontakt kurz wechselwirken).
  // Nur wenn die Lücke kleiner als die volle Ruhelänge ist, stauchen sich
  // beide Stummel symmetrisch (Armlänge = halbe Restlücke).
  const springY = gliderTop + GLIDER_H / 2
  const s1x = p1.x + halfWpx, s2x = p2.x - halfWpx
  const gapPx = Math.max(0, s2x - s1x)
  const halfRestPx = (SPRING_REST_LENGTH_M / 2) * store.ppm
  const armPx = gapPx < 2 * halfRestPx ? gapPx / 2 : halfRestPx

  if (kInf) {
    // Starre Prellböcke: keine Kontaktphase (Δt=0), also auch keine sichtbare
    // Stauchung — feste Ruhelänge bis zum instantanen Stoß.
    DOM.springPath.setAttribute('visibility', 'hidden')
    DOM.bumperLeft.setAttribute('visibility', 'visible')
    DOM.bumperRight.setAttribute('visibility', 'visible')
    DOM.bumperLeft.setAttribute('x', String(s1x))
    DOM.bumperLeft.setAttribute('y', String(springY - 6))
    DOM.bumperLeft.setAttribute('width', String(halfRestPx))
    DOM.bumperLeft.setAttribute('height', 12)
    DOM.bumperRight.setAttribute('x', String(s2x - halfRestPx))
    DOM.bumperRight.setAttribute('y', String(springY - 6))
    DOM.bumperRight.setAttribute('width', String(halfRestPx))
    DOM.bumperRight.setAttribute('height', 12)
  } else {
    DOM.bumperLeft.setAttribute('visibility', 'hidden')
    DOM.bumperRight.setAttribute('visibility', 'hidden')
    DOM.springPath.setAttribute('visibility', 'visible')
    const d1 = drawZigzagSpring(s1x, s1x + armPx, springY, 8)
    const d2 = drawZigzagSpring(s2x - armPx, s2x, springY, 8)
    DOM.springPath.setAttribute('d', `${d1} ${d2}`)
  }

  // Geschwindigkeitsvektoren
  const vis = showVectors ? 'visible' : 'hidden'
  const vecY = gliderTop - 22
  const drawVec = (lineEl, px, v, mInf) => {
    if (mInf || Math.abs(v) < 0.02) { lineEl.setAttribute('visibility', 'hidden'); return }
    lineEl.setAttribute('visibility', vis)
    const len = v * PIXELS_PER_VELOCITY_UNIT
    const end = shortenEnd(px, vecY, px + len, vecY, 5 * 2.5)
    lineEl.setAttribute('x1', px); lineEl.setAttribute('y1', vecY)
    lineEl.setAttribute('x2', end.x2); lineEl.setAttribute('y2', end.y2)
  }
  drawVec(DOM.vVector1, p1.x, v1, m1Inf)
  drawVec(DOM.vVector2, p2.x, v2, m2Inf)

  // Schwerpunkt (nur sinnvoll, wenn beide Massen endlich sind)
  if (showCom && !m1Inf && !m2Inf) {
    const xCom = (m1 * x1 + m2 * x2) / (m1 + m2)
    const pc = physToScreen(xCom)
    DOM.comMarker.setAttribute('transform', `translate(${pc.x}, ${TRACK_Y + TRACK_H + 6})`)
    DOM.comMarker.setAttribute('visibility', 'visible')
  } else {
    DOM.comMarker.setAttribute('visibility', 'hidden')
  }

  // Stoppuhr (kanonisch: Hauptzeiger 1 U/60s, Subdial 1 U/s)
  const ma = (t % 60) / 60 * 2 * Math.PI - Math.PI / 2
  DOM.swHand.setAttribute('x2', String(SW_HAND_LEN * Math.cos(ma)))
  DOM.swHand.setAttribute('y2', String(SW_HAND_LEN * Math.sin(ma)))
  const sa = (t % 1) * 2 * Math.PI - Math.PI / 2
  DOM.subHand.setAttribute('x2', String(13 * Math.cos(sa)))
  DOM.subHand.setAttribute('y2', String(25 + 13 * Math.sin(sa)))

  // Zeit-Label
  DOM.timeLabel.innerHTML = `<i>t</i> = ${fmt(t, 3)} s`

  // Live-Analyse
  const a1 = interpolateAt(store.a1_data, t)
  const a2 = interpolateAt(store.a2_data, t)
  DOM.liveT.textContent = `${fmt(t, 3)} s`
  DOM.liveV1.textContent = `${fmt(v1, 3)} m/s`
  DOM.liveV2.textContent = `${fmt(v2, 3)} m/s`
  DOM.liveA1.textContent = `${fmt(a1, 2)} m/s²`
  DOM.liveA2.textContent = `${fmt(a2, 2)} m/s²`
  DOM.liveDt.textContent = store.approaching ? `${fmt(store.collisionDt * 1000, 0)} ms` : '—'
  DOM.liveFmax.textContent = store.approaching
    ? (store.fMax === Infinity ? '∞' : `${fmt(store.fMax, 1)} N`)
    : '—'
  const collided = store.approaching && t >= store.tContactEnd
  DOM.liveV1p.textContent = collided ? `${fmt(store.v1Final, 3)} m/s` : '—'
  DOM.liveV2p.textContent = collided ? `${fmt(store.v2Final, 3)} m/s` : '—'

  updateBars(t)
}

// ── Energie-/Impuls-Balken (relative Breite, wie andere Sims mit Vergleich) ─
function updateBars(t) {
  const { m1Inf, m2Inf } = store
  const ek1 = interpolateAt(store.ek1_data, t)
  const ek2 = interpolateAt(store.ek2_data, t)
  const es = interpolateAt(store.es_data, t)
  const eTot = ek1 + ek2 + es
  const denom = eTot > 1e-6 ? eTot : 1
  DOM.barE1.style.width = `${(ek1 / denom) * 100}%`
  DOM.barE2.style.width = `${(ek2 / denom) * 100}%`
  DOM.barEs.style.width = `${(es / denom) * 100}%`

  const p1 = interpolateAt(store.p1_data, t)
  const p2 = interpolateAt(store.p2_data, t)
  const initP1 = m1Inf ? 0 : store.m1 * Math.abs(store.v1)
  const initP2 = m2Inf ? 0 : store.m2 * Math.abs(store.v2)
  const scale = Math.max(1.0, (initP1 + initP2) * 1.2)
  const setP = (elObj, P) => {
    const pct = Math.min(50, (Math.abs(P) / scale) * 50)
    elObj.style.width = `${pct}%`
    elObj.style.left = P >= 0 ? '50%' : 'auto'
    elObj.style.right = P < 0 ? '50%' : 'auto'
  }
  setP(DOM.barP1, p1)
  setP(DOM.barP2, p2)
  DOM.momNote.style.display = (m1Inf || m2Inf) ? 'block' : 'none'
}

export function drawStopwatchMarks() {
  DOM.swMarks.innerHTML = ''
  for (let s = 0; s < 60; s++) {
    const a = (s / 60) * 2 * Math.PI
    const ri = 60 - (s % 5 === 0 ? 8 : 5)
    DOM.swMarks.appendChild(el('line', {
      x1: ri * Math.sin(a), y1: -ri * Math.cos(a),
      x2: 60 * Math.sin(a), y2: -60 * Math.cos(a),
      class: 'sw-mark', 'stroke-width': s % 5 === 0 ? 2 : 1,
    }))
  }
}
export function drawSubdialMarks() {
  DOM.sdMarks.innerHTML = ''
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * 2 * Math.PI
    DOM.sdMarks.appendChild(el('line', {
      x1: 10 * Math.sin(a), y1: 25 - 10 * Math.cos(a),
      x2: 13 * Math.sin(a), y2: 25 - 13 * Math.cos(a),
      'stroke-width': 1, class: 'sw-mark',
    }))
  }
}

// ── Diagramm ─────────────────────────────────────────────────────────────────
const GRAPH_CFG = {
  v: { unit: 'm/s', title: 'Geschwindigkeit v(t)', ylabel: 'v / (m/s)' },
  a: { unit: 'm/s²', title: 'Beschleunigung a(t)', ylabel: 'a / (m/s²)' },
  p: { unit: 'kg·m/s', title: 'Impuls p(t)', ylabel: 'p / (kg·m/s)' },
  E: { unit: 'J', title: 'Energie E(t)', ylabel: 'E / J' },
}

export function updateGraph(t) {
  const type = store.graphType
  const cfg = GRAPH_CFG[type]
  const lim = store.axisLimits[type]
  if (!lim) return

  const P = { top: 30, right: 25, bottom: 40, left: 60 }
  const PLOT_W = GRAPH_W - P.left - P.right
  const PLOT_H = GRAPH_H - P.top - P.bottom
  const t_max = lim.t_max

  DOM.gridGroup.innerHTML = ''
  DOM.gridGroup.appendChild(el('rect', { x: P.left, y: P.top - 15, width: PLOT_W + 15, height: PLOT_H + 15, class: 'graph-bg' }))

  const scaleT = tt => P.left + (Math.min(tt, t_max) / t_max) * PLOT_W
  const scaleY = v => P.top + PLOT_H - ((v - lim.min) / (lim.max - lim.min)) * PLOT_H

  // Abszisse am Nulldurchgang (v/a/p symmetrisch um 0) oder am unteren Rand (E ≥ 0)
  const yZero = (lim.min <= 0 && lim.max >= 0) ? scaleY(0) : P.top + PLOT_H

  // Y-Ticks
  const yStep = niceStepLE(lim.max - lim.min, 4)
  let yv = Math.ceil(lim.min / yStep) * yStep
  while (yv <= lim.max + yStep * 0.01) {
    const py = scaleY(yv)
    DOM.gridGroup.appendChild(el('line', { x1: P.left, y1: py, x2: P.left + PLOT_W, y2: py, class: 'grid-line' }))
    DOM.gridGroup.appendChild(textEl(fmt(yv, Math.abs(yv) < 1 && yStep < 1 ? 2 : 1), P.left - 6, py + 3.5, 'end', 'tick-label'))
    yv = Math.round((yv + yStep) * 1e6) / 1e6
  }

  // X-Ticks
  const tStep = tAxisStep(t_max, 4)
  let tv = 0
  while (tv <= t_max + tStep * 0.01) {
    const px = scaleT(tv)
    DOM.gridGroup.appendChild(el('line', { x1: px, y1: P.top, x2: px, y2: P.top + PLOT_H, class: 'grid-line' }))
    DOM.gridGroup.appendChild(textEl(fmt(tv, tStep < 1 ? 2 : 1), px, P.top + PLOT_H + 16, 'middle', 'tick-label'))
    tv = Math.round((tv + tStep) * 1e6) / 1e6
  }

  // Achsen
  DOM.gridGroup.appendChild(el('line', { x1: P.left, y1: P.top + PLOT_H, x2: P.left, y2: P.top, class: 'axis-line', 'stroke-width': 1.5, 'marker-end': 'url(#arr-axis-g)' }))
  DOM.gridGroup.appendChild(el('line', { x1: P.left, y1: yZero, x2: P.left + PLOT_W, y2: yZero, class: 'axis-line', 'stroke-width': 1.5, 'marker-end': 'url(#arr-axis-g)' }))

  const yAxisLabel = el('text', { x: 0, y: 0, class: 'axis-label', transform: `translate(${P.left - 42}, ${P.top + PLOT_H / 2}) rotate(-90)`, 'text-anchor': 'middle' })
  setAxisLabel(yAxisLabel, cfg.ylabel)
  DOM.gridGroup.appendChild(yAxisLabel)
  const xAxisLabel = el('text', { x: P.left + PLOT_W / 2, y: GRAPH_H - 6, class: 'axis-label', 'text-anchor': 'middle' })
  setAxisLabel(xAxisLabel, 't / s')
  DOM.gridGroup.appendChild(xAxisLabel)

  // Datenlinien bis zur aktuellen Zeit
  const plotIdx = (() => { const i = store.t_data.findIndex(tt => tt > t); return i === -1 ? store.t_data.length : i })()
  const buildPoints = (data) => {
    const pts = []
    for (let i = 0; i < plotIdx; i++) pts.push(`${scaleT(store.t_data[i])},${scaleY(data[i])}`)
    if (plotIdx > 0) {
      const cv = interpolateAt(data, t)
      pts.push(`${scaleT(Math.min(t, t_max))},${scaleY(cv)}`)
    }
    return pts.join(' ')
  }

  const key1 = type === 'v' ? 'v1_data' : type === 'a' ? 'a1_data' : type === 'p' ? 'p1_data' : 'ek1_data'
  const key2 = type === 'v' ? 'v2_data' : type === 'a' ? 'a2_data' : type === 'p' ? 'p2_data' : 'ek2_data'
  DOM.lineV1.setAttribute('points', buildPoints(store[key1]))
  DOM.lineV2.setAttribute('points', buildPoints(store[key2]))
  DOM.lineV1.style.display = 'block'
  DOM.lineV2.style.display = 'block'

  if (type === 'E') {
    DOM.lineEs.setAttribute('points', buildPoints(store.es_data))
    DOM.lineEs.style.display = 'block'
  } else {
    DOM.lineEs.style.display = 'none'
  }

  if (plotIdx > 0) {
    const cv1 = interpolateAt(store[key1], t), cv2 = interpolateAt(store[key2], t)
    DOM.dotV1.setAttribute('cx', scaleT(Math.min(t, t_max))); DOM.dotV1.setAttribute('cy', scaleY(cv1))
    DOM.dotV2.setAttribute('cx', scaleT(Math.min(t, t_max))); DOM.dotV2.setAttribute('cy', scaleY(cv2))
    DOM.dotV1.setAttribute('visibility', 'visible')
    DOM.dotV2.setAttribute('visibility', 'visible')
    if (type === 'E') {
      const cvEs = interpolateAt(store.es_data, t)
      DOM.dotEs.setAttribute('cx', scaleT(Math.min(t, t_max))); DOM.dotEs.setAttribute('cy', scaleY(cvEs))
      DOM.dotEs.setAttribute('visibility', 'visible')
    } else {
      DOM.dotEs.setAttribute('visibility', 'hidden')
    }
  } else {
    DOM.dotV1.setAttribute('visibility', 'hidden')
    DOM.dotV2.setAttribute('visibility', 'hidden')
    DOM.dotEs.setAttribute('visibility', 'hidden')
  }

  // Titel — letztes SVG-Kind, über den Datenlinien
  setGraphTitle(DOM.graphTitle, cfg.title)
  DOM.graphTitle.setAttribute('x', String(GRAPH_W / 2))
  DOM.graphTitle.setAttribute('y', '14')
}

// Fügt dem Graph-SVG den Achsenpfeil-Marker hinzu (einmalig).
export function ensureAxisMarker(svgEl) {
  if (svgEl.querySelector('#arr-axis-g')) return
  let defs = svgEl.querySelector('defs')
  if (!defs) { defs = document.createElementNS(NS, 'defs'); svgEl.insertBefore(defs, svgEl.firstChild) }
  const marker = el('marker', { id: 'arr-axis-g', markerWidth: 6, markerHeight: 4, refX: 0, refY: 2, orient: 'auto', markerUnits: 'strokeWidth' })
  const poly = el('polygon', { points: '0 0, 6 2, 0 4', class: 'arr-axis-poly' })
  marker.appendChild(poly)
  defs.appendChild(marker)
}
