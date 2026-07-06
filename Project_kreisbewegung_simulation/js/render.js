'use strict'

import {
  ANIM_W, ANIM_CX,
  ANIM_H_STACK, ANIM_CY_STACK, ANIM_H_SPLIT, ANIM_CY_SPLIT,
  DEFAULT_PIXELS_PER_METER, PIXELS_PER_VELOCITY_UNIT, PIXELS_PER_ACCELERATION_UNIT,
  POINT_RADIUS,
  GRAPH_W_STACK, GRAPH_H_STACK, GRAPH_W_SPLIT, GRAPH_H_SPLIT,
  GRAPH_H_STACKED_STACK, GRAPH_H_STACKED_SPLIT, GRAPH_STACKED_GAP,
  WATCH_CX, WATCH_CY, WATCH_R, SDIAL_CX, SDIAL_CY, SDIAL_R,
  SEG_THICK, SEG_LEN, DIGIT_SPACING, COLON_WIDTH, LCD_FRAME_PADDING,
  DIGIT_WIDTH, DIGIT_HEIGHT, COLON_DOT_SIZE,
  DIGITAL_FRAME_X, DIGITAL_FRAME_Y, DIGITAL_FRAME_W, DIGITAL_FRAME_H,
  DIGIT_SEGMENTS_MAP,
  graphTitles, graphAxisLabels, graphXAxisLabels,
} from './constants.js'
import { store, DOM } from './state.js'
import { getNiceTick, linePlotIndex, frequency } from './physics.js'

// ── Layout-abhängige Geometrie (gestapelt ↔ nebeneinander) ───────────────────
const animH      = () => store.layoutSplit ? ANIM_H_SPLIT      : ANIM_H_STACK
export const animCY = () => store.layoutSplit ? ANIM_CY_SPLIT    : ANIM_CY_STACK
const graphW     = () => store.layoutSplit ? GRAPH_W_SPLIT     : GRAPH_W_STACK
const graphHFull = () => store.layoutSplit ? GRAPH_H_SPLIT     : GRAPH_H_STACK

// ── Pfeilspitzen-Marker-Längen (px) ──────────────────────────────────────────
// Alle Animations-Marker: markerWidth=5, markerUnits=strokeWidth (Default) →
// Marker-Länge in px = 5 · strokeWidth. Kanonische Geometrie (eine konsistente
// Kombination, KEINE Doppelkompensation):
//   • Marker refX=0  → die Dreieck-BASIS sitzt am Linien-Endpunkt, die Spitze
//     läuft eine Marker-Länge in Richtung des Vektors nach vorn.
//   • Schaft am (x2,y2)-Ende um genau diese Marker-Länge kürzen → das gekürzte
//     Linien-Ende ist der Zielpunkt MINUS Marker-Länge; die Spitze landet dann
//     exakt AUF dem Zielpunkt (nicht zu lang, nicht zu kurz).
// Der Schaft endet an der Dreieck-Basis, das deckend gefüllte Dreieck überdeckt
// die letzte Marker-Länge vollständig — nichts guckt seitlich aus der Spitze.
// (Polygon-Fill via styles.css `#arrowhead-* polygon { fill: … }`.)
// FALSCH wäre refX=markerWidth ZUSAMMEN mit Schaft-Kürzung: dann sitzt die
// Spitze am gekürzten Ende → um eine Marker-Länge zu kurz (Bug bis v1.0.7).
const ARROW_LEN_MAIN = 5 * 2.5  // Hauptvektoren (Ort/Geschw./Beschl.), sw=2,5 → 12,5 px
const ARROW_LEN_COMP = 5 * 2    // Komponenten-Vektoren, sw=2 → 10 px
const ARROW_LEN_AXIS = 5 * 1.2   // Koordinatenachsen, sw=1,2 → 6 px

// Endpunkt (x2,y2) um `by` px in Richtung (x2−x1, y2−y1) zurückziehen. Liefert
// das gekürzte (x2,y2); bei by≤0 oder zu kurzem Vektor unverändert.
function shortenEnd(x1, y1, x2, y2, by) {
  if (!(by > 0)) return { x2, y2 }
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len <= by) return { x2, y2 }
  return { x2: x2 - (dx / len) * by, y2: y2 - (dy / len) * by }
}
const graphSlotH = () => store.layoutSplit ? GRAPH_H_STACKED_SPLIT : GRAPH_H_STACKED_STACK

const NS = 'http://www.w3.org/2000/svg'

function el(tag, attrs) {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  return e
}

export function fmt(n, d = 2) {
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(d).replace('.', ',')
}

// SVG-Text mit gemischter Formatierung aus HTML-<i>-Tags (Symbol kursiv)
function createStyledSvgText(svgEl, text) {
  while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild)
  const regex = /<i>(.*?)<\/i>|([^<>&]+)/g
  let m
  while ((m = regex.exec(text)) !== null) {
    if (m[1]) {
      const t = el('tspan', { 'font-style': 'italic' })
      t.textContent = m[1]
      svgEl.appendChild(t)
    } else if (m[2]) {
      svgEl.appendChild(document.createTextNode(m[2]))
    }
  }
}

function setGraphTitle(textEl, text) {
  while (textEl.firstChild) textEl.removeChild(textEl.firstChild)
  const sep = text.lastIndexOf(' ')
  if (sep === -1) { textEl.textContent = text; return }
  const main = el('tspan', {})
  main.textContent = text.slice(0, sep + 1)
  textEl.appendChild(main)
  const sym = el('tspan', { 'font-style': 'italic' })
  sym.textContent = text.slice(sep + 1)
  textEl.appendChild(sym)
}

function setAxisLabel(textEl, text) {
  while (textEl.firstChild) textEl.removeChild(textEl.firstChild)
  const sep = text.indexOf(' / ')
  if (sep === -1) { textEl.textContent = text; return }
  const qty = el('tspan', { 'font-style': 'italic' })
  qty.textContent = text.slice(0, sep)
  textEl.appendChild(qty)
  const unit = el('tspan', {})
  unit.textContent = text.slice(sep)
  textEl.appendChild(unit)
}

// Größter Nice-Step (1-2-5), der noch ≥ minDivs Teilstriche liefert (Zeitachse)
function tAxisStep(range, minDivs = 3) {
  let step = getNiceTick(range, 6)
  if (Math.floor(range / step) < minDivs) {
    const ms = range / minDivs
    const m = Math.pow(10, Math.floor(Math.log10(ms)))
    step = [5, 2, 1].map(f => f * m).find(s => s <= ms + 1e-9) ?? m
  }
  return step
}

// Größter Nice-Step aus feiner 1-2-4-5-Folge, der ≤ range/minDivs ist → garantiert
// ≥ minDivs Teilstriche. Die 4er-Stufe schließt die Lücke zwischen 2 und 5, so
// daß Achsen mit Nulldurchgang saubere 5–9 beschriftete Ticks inkl. 0 bekommen.
function niceStepLE(range, minDivs) {
  const ms = range / minDivs
  const m = Math.pow(10, Math.floor(Math.log10(ms)))
  return [5, 4, 2, 1].map(f => f * m).find(s => s <= ms + 1e-9) ?? m
}

// ── Zoom: passt ppm so an, daß der Kreisradius in die Zeichenfläche paßt ─────
export function updateZoom() {
  const usable = Math.min(ANIM_W, animH()) / 2 - 40
  const needed = store.R * DEFAULT_PIXELS_PER_METER
  store.zoomFactor = needed > usable ? usable / needed : 1
  store.currentPixelsPerMeter = DEFAULT_PIXELS_PER_METER * store.zoomFactor
  DOM.zoomTextDisplay.textContent = `Zoom ${store.zoomFactor.toFixed(2)}×`
}

// ── Animations-Koordinatensystem (Achsenpfeile) ──────────────────────────────
export function drawCoordSystem() {
  DOM.animationCoordSystem.innerHTML = ''
  const ppm = store.currentPixelsPerMeter
  const cy = animCY()
  const axLen = Math.max(2.0, store.R) * ppm * 1.05
  // x-Achse (Schaft um Marker-Länge kürzen, Spitze via refX am Original-Ende)
  const axEnd = shortenEnd(ANIM_CX - 10, cy, ANIM_CX + axLen, cy, ARROW_LEN_AXIS)
  DOM.animationCoordSystem.appendChild(el('line', {
    x1: ANIM_CX - 10, y1: cy, x2: axEnd.x2, y2: axEnd.y2,
    stroke: 'var(--text)', 'stroke-width': 1.2, 'marker-end': 'url(#anim-arrowhead)',
  }))
  const xl = el('text', { x: ANIM_CX + axLen + 8, y: cy + 4, 'font-size': 13, fill: 'var(--text)' })
  xl.textContent = 'x'
  DOM.animationCoordSystem.appendChild(xl)
  // y-Achse
  const ayEnd = shortenEnd(ANIM_CX, cy + 10, ANIM_CX, cy - axLen, ARROW_LEN_AXIS)
  DOM.animationCoordSystem.appendChild(el('line', {
    x1: ANIM_CX, y1: cy + 10, x2: ayEnd.x2, y2: ayEnd.y2,
    stroke: 'var(--text)', 'stroke-width': 1.2, 'marker-end': 'url(#anim-arrowhead)',
  }))
  const yl = el('text', { x: ANIM_CX - 14, y: cy - axLen - 4, 'font-size': 13, fill: 'var(--text)' })
  yl.textContent = 'y'
  DOM.animationCoordSystem.appendChild(yl)
}

// ── Bahnkurve (progressive Spur, gestrichelt) ────────────────────────────────
// trajectory_path ist ein <path>; sein `d` wird in updateScene aus den getasten
// Positionen (0 .. min(t, T)) aufgebaut — die Bahnkurve entsteht erst während
// des 1. Umlaufs und ist danach der vollständige Kreis (nicht schon bei t=0).
export function drawTrajectoryCircle() {
  const r = store.R * store.currentPixelsPerMeter
  DOM.disk.setAttribute('r', r)
  DOM.disk.setAttribute('cx', ANIM_CX)
  DOM.disk.setAttribute('cy', animCY())
}

// ── Stoppuhr-Skalen ──────────────────────────────────────────────────────────
export function drawStopwatchMarks() {
  DOM.stopwatchMarks.innerHTML = ''
  for (let s = 0; s < 60; s++) {
    const a = (s / 60) * 2 * Math.PI
    const ri = WATCH_R - (s % 5 === 0 ? 8 : 5)
    DOM.stopwatchMarks.appendChild(el('line', {
      x1: WATCH_CX + ri * Math.sin(a), y1: WATCH_CY - ri * Math.cos(a),
      x2: WATCH_CX + WATCH_R * Math.sin(a), y2: WATCH_CY - WATCH_R * Math.cos(a),
      class: 'sw-mark', 'stroke-width': s % 5 === 0 ? 2 : 1,
    }))
  }
}

export function drawSubdialMarks() {
  DOM.subdialMarks.innerHTML = ''
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * 2 * Math.PI
    DOM.subdialMarks.appendChild(el('line', {
      x1: SDIAL_CX + (SDIAL_R - 3) * Math.sin(a), y1: SDIAL_CY - (SDIAL_R - 3) * Math.cos(a),
      x2: SDIAL_CX + SDIAL_R * Math.sin(a), y2: SDIAL_CY - SDIAL_R * Math.cos(a),
      class: 'sw-mark', 'stroke-width': 1,
    }))
  }
}

function segmentRectDefs() {
  return [
    { x: SEG_THICK, y: 0, width: SEG_LEN, height: SEG_THICK },
    { x: SEG_LEN + SEG_THICK, y: SEG_THICK, width: SEG_THICK, height: SEG_LEN },
    { x: SEG_LEN + SEG_THICK, y: SEG_LEN + 2 * SEG_THICK, width: SEG_THICK, height: SEG_LEN },
    { x: SEG_THICK, y: 2 * SEG_LEN + 2 * SEG_THICK, width: SEG_LEN, height: SEG_THICK },
    { x: 0, y: SEG_LEN + 2 * SEG_THICK, width: SEG_THICK, height: SEG_LEN },
    { x: 0, y: SEG_THICK, width: SEG_THICK, height: SEG_LEN },
    { x: SEG_THICK, y: SEG_LEN + SEG_THICK, width: SEG_LEN, height: SEG_THICK },
  ]
}

export function initDigitalDisplaySegments() {
  DOM.digitalDisplayGroup.innerHTML = ''
  DOM.digitalDisplayGroup.appendChild(el('rect', {
    id: 'digital_display_frame', x: DIGITAL_FRAME_X, y: DIGITAL_FRAME_Y,
    width: DIGITAL_FRAME_W, height: DIGITAL_FRAME_H,
    class: 'lcd-frame', 'stroke-width': 2, rx: 8, ry: 8,
  }))
  const contentY = DIGITAL_FRAME_Y + LCD_FRAME_PADDING
  const defs = segmentRectDefs()
  const x0 = DIGITAL_FRAME_X + LCD_FRAME_PADDING
  const x1 = x0 + DIGIT_WIDTH + DIGIT_SPACING
  const xColon = x1 + DIGIT_WIDTH + DIGIT_SPACING
  const x2 = xColon + COLON_WIDTH + DIGIT_SPACING
  const x3 = x2 + DIGIT_WIDTH + DIGIT_SPACING
  const xs = [x0, x1, x2, x3]
  for (let i = 0; i < 4; i++) {
    defs.forEach((d, si) => {
      DOM.digitalDisplayGroup.appendChild(el('rect', {
        id: `digit_seg_${i}_${si}`, x: xs[i] + d.x, y: contentY + d.y,
        width: d.width, height: d.height, class: 'lcd-seg-off', rx: 1, ry: 1,
      }))
    })
  }
  const colonX = xColon + COLON_WIDTH / 2
  DOM.digitalDisplayGroup.appendChild(el('rect', {
    id: 'colon_dot_top', x: colonX - COLON_DOT_SIZE / 2, y: contentY + DIGIT_HEIGHT * 0.3 - COLON_DOT_SIZE / 2,
    width: COLON_DOT_SIZE, height: COLON_DOT_SIZE, class: 'lcd-seg-off', rx: COLON_DOT_SIZE / 2,
  }))
  DOM.digitalDisplayGroup.appendChild(el('rect', {
    id: 'colon_dot_bottom', x: colonX - COLON_DOT_SIZE / 2, y: contentY + DIGIT_HEIGHT * 0.7 - COLON_DOT_SIZE / 2,
    width: COLON_DOT_SIZE, height: COLON_DOT_SIZE, class: 'lcd-seg-off', rx: COLON_DOT_SIZE / 2,
  }))
}

export function updateDigitalDisplay(totalSeconds) {
  const seconds = Math.floor(totalSeconds % 60)
  const hundredths = Math.round(totalSeconds * 100) % 100
  const digits = [Math.floor(seconds / 10), seconds % 10, Math.floor(hundredths / 10), hundredths % 10]
  for (let i = 0; i < 4; i++) {
    const active = DIGIT_SEGMENTS_MAP[digits[i]]
    for (let si = 0; si < 7; si++) {
      const segEl = document.getElementById(`digit_seg_${i}_${si}`)
      if (segEl) segEl.setAttribute('class', active.includes(si) ? 'lcd-seg-on' : 'lcd-seg-off')
    }
  }
  document.getElementById('colon_dot_top')?.setAttribute('class', 'lcd-seg-on')
  document.getElementById('colon_dot_bottom')?.setAttribute('class', 'lcd-seg-on')
}

// ── Szene aufbauen (statische Elemente) ──────────────────────────────────────
export function setupScene() {
  // Sim-ViewBox layout-abhängig (gestapelt 450×480, Split 450×720 portrait)
  DOM.mainSvg.setAttribute('viewBox', `0 0 ${ANIM_W} ${animH()}`)
  updateZoom()
  drawCoordSystem()
  drawTrajectoryCircle()
  // Stoppuhr oben rechts: auf 80 % (scale 0,80), etwa eine halbe Uhrbreite
  // zur Seite und noch ~0,2 Uhrbreite nach rechts + unten geschoben. Analog-
  // Kreis Ø 115 px, Center (405, 83), bbox x 347..463, y 25..141. Rechte
  // Hälfte des analogen Kreises ragt leicht über den viewBox-Rand (gewünschte
  // Eck-Platzierung); LCD-Rahmen des Digital-Easteregg ragt weiter über
  // (analog ist Default).
  DOM.stopwatch.setAttribute('transform', 'translate(181, -13) scale(0.8)')
  return { cx: ANIM_CX, cy: animCY() }
}

// ── Vektor-Linie setzen (mit Sichtbarkeit) ───────────────────────────────────
// markerLen = Pfeilspitzen-Länge in px; der Schaft wird am (x2,y2)-Ende um
// markerLen gekürzt, sodaß er an der Dreieck-Basis endet (Spitze via refX am
// Original-Endpunkt). Verhindert das seitliche Ausgucken des Schafts nahe der
// Spitze.
function setVec(lineEl, x1, y1, x2, y2, visible, markerLen = 0) {
  if (!visible) { lineEl.style.visibility = 'hidden'; return }
  const end = shortenEnd(x1, y1, x2, y2, markerLen)
  lineEl.setAttribute('x1', x1); lineEl.setAttribute('y1', y1)
  lineEl.setAttribute('x2', end.x2); lineEl.setAttribute('y2', end.y2)
  lineEl.style.visibility = 'visible'
}

// ── Szene aktualisieren (Punkt, Vektoren, Stoppuhr, Live-Panel) ───────────────
export function updateScene(t, p, v, a, centers) {
  const ppm = store.currentPixelsPerMeter
  const { cx, cy } = centers
  const px = cx + p.x * ppm, py = cy - p.y * ppm // SVG-y invertiert

  // Massenpunkt
  DOM.point.setAttribute('cx', px); DOM.point.setAttribute('cy', py)

  // Ortsvektor (Mittelpunkt → Punkt) + Komponenten
  const showR = store.showPositionVector
  setVec(DOM.positionVector, cx, cy, px, py, showR, ARROW_LEN_MAIN)
  // Komponenten als Vektoraddition-Stil: x-Komp vom Zentrum, y-Komp am Ende der x-Komp
  const showRc = store.showPositionComponents && showR
  setVec(DOM.positionVectorX, cx, cy, px, cy, showRc, ARROW_LEN_COMP)
  setVec(DOM.positionVectorY, px, cy, px, py, showRc, ARROW_LEN_COMP)

  // Geschwindigkeitsvektor (vom Punkt aus, skaliert) + Komponenten
  const vScale = PIXELS_PER_VELOCITY_UNIT * store.zoomFactor
  const vxe = px + v.x * vScale, vye = py - v.y * vScale
  setVec(DOM.velocityVector, px, py, vxe, vye, store.showVelocityVector, ARROW_LEN_MAIN)
  const showVc = store.showVelocityComponents && store.showVelocityVector
  setVec(DOM.velocityVectorX, px, py, vxe, py, showVc, ARROW_LEN_COMP)
  setVec(DOM.velocityVectorY, vxe, py, vxe, vye, showVc, ARROW_LEN_COMP)

  // Beschleunigungsvektor (vom Punkt aus, skaliert) + Komponenten
  const aScale = PIXELS_PER_ACCELERATION_UNIT * store.zoomFactor
  const axe = px + a.x * aScale, aye = py - a.y * aScale
  setVec(DOM.accelerationVector, px, py, axe, aye, store.showAccelerationVector, ARROW_LEN_MAIN)
  const showAc = store.showAccelerationComponents && store.showAccelerationVector
  setVec(DOM.accelerationVectorX, px, py, axe, py, showAc, ARROW_LEN_COMP)
  setVec(DOM.accelerationVectorY, axe, py, axe, aye, showAc, ARROW_LEN_COMP)

  // Bahnkurve: erst während des 1. Umlaufs gezeichnet (progressive Spur bis
  // min(t, T)), danach vollständiger Kreis — nicht schon bei t=0 sichtbar.
  if (!store.showTrajectory) {
    DOM.trajectoryPath.style.visibility = 'hidden'
    DOM.trajectoryPath.setAttribute('d', '')
    DOM.disk.style.visibility = 'hidden'
  } else {
    const traceEnd = store.T === Infinity ? t : Math.min(t, store.T)
    const { tData, xData, yData } = store
    let d = ''
    for (let i = 0; i < tData.length && tData[i] <= traceEnd + 1e-9; i++) {
      const sx = cx + xData[i] * ppm
      const sy = cy - yData[i] * ppm
      d += (d ? ' L' : 'M') + sx.toFixed(2) + ' ' + sy.toFixed(2)
    }
    DOM.trajectoryPath.setAttribute('d', d)
    DOM.trajectoryPath.style.visibility = d ? 'visible' : 'hidden'
    DOM.disk.style.visibility = 'visible'
  }

  // Stoppuhr
  if (store.isDigitalDisplay) {
    updateDigitalDisplay(t)
  } else {
    const mainA = (t % 60 / 60) * 2 * Math.PI
    const subA = (t % 1) * 2 * Math.PI
    DOM.mainHand.setAttribute('x2', WATCH_CX + 60 * Math.sin(mainA))
    DOM.mainHand.setAttribute('y2', WATCH_CY - 60 * Math.cos(mainA))
    DOM.subHand.setAttribute('x2', SDIAL_CX + 15 * Math.sin(subA))
    DOM.subHand.setAttribute('y2', SDIAL_CY - 15 * Math.cos(subA))
  }

  // Live-Panel
  DOM.timeLabel.innerHTML = `<i>t</i> = ${fmt(t)} s`
  DOM.liveT.textContent = `${fmt(t)} s`
  DOM.livePhi.textContent = `${fmt(p.phi ?? 0, 1)} °`
  DOM.liveX.textContent = `${fmt(p.x)} m`
  DOM.liveY.textContent = `${fmt(p.y)} m`
  DOM.liveVx.textContent = `${fmt(v.x)} m/s`
  DOM.liveVy.textContent = `${fmt(v.y)} m/s`
  DOM.liveVabs.textContent = `${fmt(v.abs ?? Math.hypot(v.x, v.y))} m/s`
  DOM.liveAx.textContent = `${fmt(a.x)} m/s²`
  DOM.liveAy.textContent = `${fmt(a.y)} m/s²`
  DOM.liveAabs.textContent = `${fmt(a.abs ?? Math.hypot(a.x, a.y))} m/s²`
}

// ── Kennwerte (T, ω, f) ──────────────────────────────────────────────────────
export function updateKennwerte() {
  DOM.liveTper.textContent = store.T === Infinity ? '∞ s' : `${fmt(store.T, 2)} s`
  DOM.liveOmega.textContent = `${fmt(store.omega, 2)} rad/s`
  DOM.liveF.textContent = store.T === Infinity || store.T === 0 ? '— Hz' : `${fmt(frequency(), 3)} Hz`
}

// ── Ein Graph-Slot zeichnen (parameterisiert für Single + beide Stacked) ─────
// attrs: { titleEl, gridEl, lineEl, pointEl, type, graphHeight, currentTime, currentValue }
function drawGraphSlot(attrs) {
  const { titleEl, gridEl, lineEl, pointEl, type, graphHeight, currentTime, currentValue } = attrs
  const limits = store.axisLimits[type]
  gridEl.innerHTML = ''
  lineEl.setAttribute('points', '')
  pointEl.style.visibility = 'hidden'
  if (!limits) return

  const gW = graphW()
  const gH = graphHeight
  const padL = 60, padR = 18, padT = 28, padB = 38
  const fullW = gW - padL - padR
  const fullH = gH - padT - padB

  // Sonderfall Bahnkurve (yx/xy): gleich skalierte x/y-Achsen, sodaß der Kreis
  // rund erscheint. Dafür wird ein zentrierter quadratischer Plot-Bereich
  // (Seite = min(volle Breite, volle Höhe)) verwendet; da x- und y-Wertebereich
  // beide 2·Rpad umfassen, sind px/Einheit für beide Achsen identisch.
  // Zeitreihen behalten das unabhängig skalierte Landscape-Format.
  const isTraj = !limits.xIsTime
  const sq = Math.min(fullW, fullH)
  const plotL = isTraj ? padL + (fullW - sq) / 2 : padL
  const plotT = isTraj ? padT + (fullH - sq) / 2 : padT
  const plotW = isTraj ? sq : fullW
  const plotH = isTraj ? sq : fullH
  const plotBottom = plotT + plotH

  const xMin = limits.xMin, xMax = limits.xMax
  const yMin = limits.yMin, yMax = limits.yMax
  const xRng = (xMax - xMin) || 1
  const yRng = (yMax - yMin) || 1
  const scX = v => plotL + ((v - xMin) / xRng) * plotW
  const scY = v => plotT + plotH - ((v - yMin) / yRng) * plotH
  const x0 = scX(0), y0 = scY(0)

  // Abszisse am Nulldurchgang plazieren, wenn 0 im Wertebereich liegt
  const zeroInY = yMin < 0 && yMax > 0
  const hAxisY = zeroInY ? y0 : (yMax <= 0 ? plotT : plotBottom)
  // Ordinate am Nulldurchgang, wenn 0 im Definitionsbereich liegt; sonst links
  // (alle x ≥ 0, z. B. Zeit ab 0) bzw. rechts (alle x ≤ 0).
  const zeroInX = xMin < 0 && xMax > 0
  const vAxisX = zeroInX ? x0 : (xMin >= 0 ? plotL : plotL + plotW)

  // Hintergrund-Rect (Plot-Bereich)
  gridEl.appendChild(el('rect', { x: plotL, y: plotT, width: plotW, height: plotH, class: 'graph-bg' }))

  // Achsen mit Pfeilspitzen: Abszisse (horizontal) am Nulldurchgang bzw. Rand,
  // Ordinate (vertikal) am Nulldurchgang bzw. links/rechts.
  gridEl.appendChild(el('line', { x1: plotL, y1: hAxisY, x2: plotL + plotW, y2: hAxisY, class: 'axis-line', 'stroke-width': 1.5, 'marker-end': 'url(#graph-arrowhead)' }))
  gridEl.appendChild(el('line', { x1: vAxisX, y1: plotBottom, x2: vAxisX, y2: plotT, class: 'axis-line', 'stroke-width': 1.5, 'marker-end': 'url(#graph-arrowhead)' }))

  // Y-Ticks: feine 1-2-4-5-Folge, ≥4 beschriftete Ticks inkl. 0
  const yStep = niceStepLE(yRng, 4)
  const yDec = yStep % 1 === 0 ? 0 : (yStep >= 0.1 ? 1 : 2)
  for (let vv = Math.ceil(yMin / yStep) * yStep; vv <= yMax + 1e-9; vv = Math.round((vv + yStep) * 1e9) / 1e9) {
    const yp = scY(vv)
    if (Math.abs(yp - y0) > 1.5)
      gridEl.appendChild(el('line', { x1: plotL, y1: yp, x2: plotL + plotW, y2: yp, class: 'grid-line' }))
    const tv = el('text', { x: plotL - 8, y: yp + 4, 'text-anchor': 'end', class: 'tick-label' })
    tv.textContent = fmt(vv, yDec)
    gridEl.appendChild(tv)
  }

  // X-Ticks: Zeitachse → tAxisStep (≥3 neben Ursprung), Position → niceStepLE (≥4)
  const xStep = limits.xIsTime ? tAxisStep(xMax) : niceStepLE(xRng, 4)
  const xDec = xStep >= 1 ? (xStep >= 10 ? 0 : 1) : (xStep >= 0.1 ? 2 : 3)
  for (let xc = Math.ceil(xMin / xStep) * xStep; xc <= xMax + xStep * 0.01; xc = Math.round((xc + xStep) * 1e6) / 1e6) {
    const xp = scX(Math.min(xc, xMax))
    if (Math.abs(xp - x0) > 2)
      gridEl.appendChild(el('line', { x1: xp, y1: plotT, x2: xp, y2: plotBottom, class: 'grid-line' }))
    const tv = el('text', { x: xp, y: plotBottom + 16, 'text-anchor': 'middle', class: 'tick-label' })
    tv.textContent = fmt(xc, xDec)
    gridEl.appendChild(tv)
  }

  // Achsenbeschriftungen
  const tlY = el('text', { x: plotL - 42, y: plotT + plotH / 2, transform: `rotate(-90 ${plotL - 42} ${plotT + plotH / 2})`, 'text-anchor': 'middle', class: 'axis-label' })
  setAxisLabel(tlY, limits.yLabel)
  gridEl.appendChild(tlY)
  const tlX = el('text', { x: plotL + plotW / 2, y: plotBottom + 32, 'text-anchor': 'middle', class: 'axis-label' })
  setAxisLabel(tlX, limits.xLabel)
  gridEl.appendChild(tlX)

  // Titel — platziert relativ zum Plot-Bereich (zentriert über dem Plot, 10 px
  // über dessen Oberkante). Bei zentriertem quadratischem Bahnkurven-Plot im
  // Portrait-Layout (Split) wäre viewBox-Zentrierung (gW/2, y=18) falsch: der
  // Plot sitzt tiefer und ist horizontal versetzt, sodaß der Titel sonst weit
  // über dem Plot schwebt. Plot-relativ paßt für alle Layouts/Modi.
  titleEl.setAttribute('x', plotL + plotW / 2)
  titleEl.setAttribute('y', plotT - 10)
  setGraphTitle(titleEl, graphTitles[type] ?? type)

  // Daten-Polyline
  const xArr = limits.xArr, yArr = limits.yArr
  let pts = ''
  if (limits.xIsTime) {
    // Zeitreihe: nur bis aktueller Zeitpunkt
    const idx = linePlotIndex(currentTime)
    const n = Math.min(idx, xArr.length)
    for (let i = 0; i < n; i++) pts += `${scX(xArr[i])},${scY(yArr[i])} `
    if (currentValue !== null && currentValue !== undefined && n <= xArr.length) {
      pts += `${scX(currentTime)},${scY(currentValue)} `
    }
  } else {
    // Bahnkurve: progressive Spur bis min(t, T) — erst während des 1. Umlaufs
    // gezeichnet, danach vollständiger Kreis (nicht schon bei t=0). Plot-Region
    // bleibt stabil (Achsen fest bei ±Rpad), nur die Polyline wächst.
    const traceEnd = store.T === Infinity ? currentTime : Math.min(currentTime, store.T)
    const idx = linePlotIndex(traceEnd)
    const n = Math.min(idx, xArr.length)
    for (let i = 0; i < n; i++) pts += `${scX(xArr[i])},${scY(yArr[i])} `
  }
  lineEl.setAttribute('points', pts)

  // Aktueller Punkt
  if (currentValue !== null && currentValue !== undefined) {
    let cxPlot, cyPlot
    if (limits.xIsTime) { cxPlot = scX(currentTime); cyPlot = scY(currentValue) }
    else {
      // Bahnkurve: Punkt an aktueller Position
      const interp = currentInterpForTrajectory(type)
      if (interp) { cxPlot = scX(interp.x); cyPlot = scY(interp.y) }
    }
    if (cxPlot !== undefined) {
      pointEl.setAttribute('cx', cxPlot)
      pointEl.setAttribute('cy', cyPlot)
      pointEl.style.visibility = 'visible'
    }
  }
}

// Hilfsfunktion: für Bahnkurven den aktuellen (x,y)-Plotpunkt aus der Sim-Zeit
function currentInterpForTrajectory(type) {
  const { tData } = store
  if (tData.length === 0) return null
  let i = 0
  const t = store.simulatedTime
  if (t >= tData[tData.length - 1]) i = tData.length - 1
  else while (i < tData.length - 1 && tData[i + 1] <= t) i++
  const x = store.xData[i], y = store.yData[i]
  return type === 'yx' ? { x, y } : { x: y, y: x }
}

// ── Diagramm aktualisieren (Single oder Stacked) ─────────────────────────────
export function updateGraph(time) {
  const interp = currentInterpValue(store.graphType, time)
  // Graph-ViewBox layout-abhängig (gestapelt landscape 700×410, Split
  // portrait 410×700); gilt für Single und Stacked (2·Slot+Gap = Gesamt-Höhe).
  DOM.graphSvg.setAttribute('viewBox', `0 0 ${graphW()} ${graphHFull()}`)

  if (store.isStacked) {
    DOM.graphGroupSingle.style.visibility = 'hidden'
    DOM.graphGroupStackedTop.style.visibility = 'visible'
    DOM.graphGroupStackedBottom.style.visibility = 'visible'
    const [topType, bottomType] = stackedTypes(store.stackedType)
    const topVal = currentInterpValue(topType, time)
    const botVal = currentInterpValue(bottomType, time)
    const slotH = graphSlotH()
    drawGraphSlot({ titleEl: DOM.graphTitleTop, gridEl: DOM.gridGroupTop, lineEl: DOM.graphLineTop, pointEl: DOM.graphPointTop, type: topType, graphHeight: slotH, currentTime: time, currentValue: topVal })
    DOM.graphGroupStackedTop.setAttribute('transform', 'translate(0, 0)')
    drawGraphSlot({ titleEl: DOM.graphTitleBottom, gridEl: DOM.gridGroupBottom, lineEl: DOM.graphLineBottom, pointEl: DOM.graphPointBottom, type: bottomType, graphHeight: slotH, currentTime: time, currentValue: botVal })
    DOM.graphGroupStackedBottom.setAttribute('transform', `translate(0, ${slotH + GRAPH_STACKED_GAP})`)
  } else {
    DOM.graphGroupStackedTop.style.visibility = 'hidden'
    DOM.graphGroupStackedBottom.style.visibility = 'hidden'
    DOM.graphGroupSingle.style.visibility = 'visible'
    DOM.graphGroupSingle.setAttribute('transform', 'translate(0, 0)')
    drawGraphSlot({ titleEl: DOM.graphTitle, gridEl: DOM.gridGroup, lineEl: DOM.graphLine, pointEl: DOM.graphPoint, type: store.graphType, graphHeight: graphHFull(), currentTime: time, currentValue: interp })
  }
}

// Wert je Typ aus precompute-Daten (interpoliert) für den Graphenpunkt
function currentInterpValue(type, time) {
  const { tData } = store
  if (tData.length === 0) return null
  let i = 0
  if (time >= tData[tData.length - 1]) i = tData.length - 1
  else while (i < tData.length - 1 && tData[i + 1] <= time) i++
  const map = {
    xt: store.xData, yt: store.yData,
    vxt: store.vxData, vyt: store.vyData,
    axt: store.axData, ayt: store.ayData,
    vabs: store.vabsData, aabs: store.aabsData, phit: store.phitData,
  }
  if (type in map) return map[type][i]
  // Bahnkurven: Wert = y-Position (für Punkt-Markierung)
  if (type === 'yx') return store.yData[i]
  if (type === 'xy') return store.xData[i]
  return null
}

// Stacked-Gruppe → (top, bottom) Einzeltypen
function stackedTypes(stackedType) {
  const map = { pos: ['xt', 'yt'], vel: ['vxt', 'vyt'], acc: ['axt', 'ayt'] }
  return map[stackedType] ?? ['xt', 'yt']
}