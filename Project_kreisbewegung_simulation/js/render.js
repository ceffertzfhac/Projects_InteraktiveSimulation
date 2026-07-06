'use strict'

import {
  ANIM_W, ANIM_H, ANIM_CX, ANIM_CY,
  DEFAULT_PIXELS_PER_METER, PIXELS_PER_VELOCITY_UNIT, PIXELS_PER_ACCELERATION_UNIT,
  POINT_RADIUS,
  GRAPH_W, GRAPH_H, GRAPH_H_STACKED, GRAPH_STACKED_GAP,
  WATCH_CX, WATCH_CY, WATCH_R, SDIAL_CX, SDIAL_CY, SDIAL_R,
  SEG_THICK, SEG_LEN, DIGIT_SPACING, COLON_WIDTH, LCD_FRAME_PADDING,
  DIGIT_WIDTH, DIGIT_HEIGHT, COLON_DOT_SIZE,
  DIGITAL_FRAME_X, DIGITAL_FRAME_Y, DIGITAL_FRAME_W, DIGITAL_FRAME_H,
  DIGIT_SEGMENTS_MAP,
  graphTitles, graphAxisLabels, graphXAxisLabels,
} from './constants.js'
import { store, DOM } from './state.js'
import { getNiceTick, linePlotIndex, frequency } from './physics.js'

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
  const usable = Math.min(ANIM_W, ANIM_H) / 2 - 40
  const needed = store.R * DEFAULT_PIXELS_PER_METER
  store.zoomFactor = needed > usable ? usable / needed : 1
  store.currentPixelsPerMeter = DEFAULT_PIXELS_PER_METER * store.zoomFactor
  DOM.zoomTextDisplay.textContent = `Zoom ${store.zoomFactor.toFixed(2)}×`
}

// ── Animations-Koordinatensystem (Achsenpfeile) ──────────────────────────────
export function drawCoordSystem() {
  DOM.animationCoordSystem.innerHTML = ''
  const ppm = store.currentPixelsPerMeter
  const axLen = Math.max(2.0, store.R) * ppm * 1.05
  // x-Achse
  DOM.animationCoordSystem.appendChild(el('line', {
    x1: ANIM_CX - 10, y1: ANIM_CY, x2: ANIM_CX + axLen, y2: ANIM_CY,
    stroke: 'var(--text)', 'stroke-width': 1.2, 'marker-end': 'url(#anim-arrowhead)',
  }))
  const xl = el('text', { x: ANIM_CX + axLen + 8, y: ANIM_CY + 4, 'font-size': 13, fill: 'var(--text)' })
  xl.textContent = 'x'
  DOM.animationCoordSystem.appendChild(xl)
  // y-Achse
  DOM.animationCoordSystem.appendChild(el('line', {
    x1: ANIM_CX, y1: ANIM_CY + 10, x2: ANIM_CX, y2: ANIM_CY - axLen,
    stroke: 'var(--text)', 'stroke-width': 1.2, 'marker-end': 'url(#anim-arrowhead)',
  }))
  const yl = el('text', { x: ANIM_CX - 14, y: ANIM_CY - axLen - 4, 'font-size': 13, fill: 'var(--text)' })
  yl.textContent = 'y'
  DOM.animationCoordSystem.appendChild(yl)
}

// ── Bahnkurve (gestrichelter Kreis) ───────────────────────────────────────────
export function drawTrajectoryCircle() {
  const r = store.R * store.currentPixelsPerMeter
  DOM.disk.setAttribute('r', r)
  DOM.trajectoryPath.setAttribute('r', r)
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
  updateZoom()
  drawCoordSystem()
  drawTrajectoryCircle()
  // Stoppuhr oben rechts: zur Seite in die Ecke und deutlich vergrößert
  // (scale 0,50 → 1,50). Analog-Kreis (r=72) wird zu r=108 (Ø 216 px) und
  // bleibt innerhalb des viewBox (x 222..438, y 2..218); der LCD-Rahmen des
  // Digital-Easteregg ist breiter und ragt bei scale 1,50 leicht über den
  // rechten Rand — analog ist Default, daher Ecke-Platzierung prioritär.
  DOM.stopwatch.setAttribute('transform', 'translate(-90, -70) scale(1.5)')
  return { cx: ANIM_CX, cy: ANIM_CY }
}

// ── Vektor-Linie setzen (mit Sichtbarkeit) ───────────────────────────────────
function setVec(lineEl, x1, y1, x2, y2, visible) {
  if (!visible) { lineEl.style.visibility = 'hidden'; return }
  lineEl.setAttribute('x1', x1); lineEl.setAttribute('y1', y1)
  lineEl.setAttribute('x2', x2); lineEl.setAttribute('y2', y2)
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
  setVec(DOM.positionVector, cx, cy, px, py, showR)
  // Komponenten als Vektoraddition-Stil: x-Komp vom Zentrum, y-Komp am Ende der x-Komp
  const showRc = store.showPositionComponents && showR
  setVec(DOM.positionVectorX, cx, cy, px, cy, showRc)
  setVec(DOM.positionVectorY, px, cy, px, py, showRc)

  // Geschwindigkeitsvektor (vom Punkt aus, skaliert) + Komponenten
  const vScale = PIXELS_PER_VELOCITY_UNIT * store.zoomFactor
  const vxe = px + v.x * vScale, vye = py - v.y * vScale
  setVec(DOM.velocityVector, px, py, vxe, vye, store.showVelocityVector)
  const showVc = store.showVelocityComponents && store.showVelocityVector
  setVec(DOM.velocityVectorX, px, py, vxe, py, showVc)
  setVec(DOM.velocityVectorY, vxe, py, vxe, vye, showVc)

  // Beschleunigungsvektor (vom Punkt aus, skaliert) + Komponenten
  const aScale = PIXELS_PER_ACCELERATION_UNIT * store.zoomFactor
  const axe = px + a.x * aScale, aye = py - a.y * aScale
  setVec(DOM.accelerationVector, px, py, axe, aye, store.showAccelerationVector)
  const showAc = store.showAccelerationComponents && store.showAccelerationVector
  setVec(DOM.accelerationVectorX, px, py, axe, py, showAc)
  setVec(DOM.accelerationVectorY, axe, py, axe, aye, showAc)

  // Bahnkurve sichtbar?
  DOM.trajectoryPath.style.visibility = store.showTrajectory ? 'visible' : 'hidden'
  DOM.disk.style.visibility = store.showTrajectory ? 'visible' : 'hidden'

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

  const gW = GRAPH_W
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

  // Titel (zentriert)
  titleEl.setAttribute('x', gW / 2)
  titleEl.setAttribute('y', 18)
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
    // Bahnkurve: vollständige Kurve
    for (let i = 0; i < xArr.length; i++) pts += `${scX(xArr[i])},${scY(yArr[i])} `
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

  if (store.isStacked) {
    DOM.graphGroupSingle.style.visibility = 'hidden'
    DOM.graphGroupStackedTop.style.visibility = 'visible'
    DOM.graphGroupStackedBottom.style.visibility = 'visible'
    const [topType, bottomType] = stackedTypes(store.stackedType)
    const topVal = currentInterpValue(topType, time)
    const botVal = currentInterpValue(bottomType, time)
    drawGraphSlot({ titleEl: DOM.graphTitleTop, gridEl: DOM.gridGroupTop, lineEl: DOM.graphLineTop, pointEl: DOM.graphPointTop, type: topType, graphHeight: GRAPH_H_STACKED, currentTime: time, currentValue: topVal })
    DOM.graphGroupStackedTop.setAttribute('transform', 'translate(0, 0)')
    drawGraphSlot({ titleEl: DOM.graphTitleBottom, gridEl: DOM.gridGroupBottom, lineEl: DOM.graphLineBottom, pointEl: DOM.graphPointBottom, type: bottomType, graphHeight: GRAPH_H_STACKED, currentTime: time, currentValue: botVal })
    DOM.graphGroupStackedBottom.setAttribute('transform', `translate(0, ${GRAPH_H_STACKED + GRAPH_STACKED_GAP})`)
  } else {
    DOM.graphGroupStackedTop.style.visibility = 'hidden'
    DOM.graphGroupStackedBottom.style.visibility = 'hidden'
    DOM.graphGroupSingle.style.visibility = 'visible'
    DOM.graphGroupSingle.setAttribute('transform', 'translate(0, 0)')
    drawGraphSlot({ titleEl: DOM.graphTitle, gridEl: DOM.gridGroup, lineEl: DOM.graphLine, pointEl: DOM.graphPoint, type: store.graphType, graphHeight: GRAPH_H, currentTime: time, currentValue: interp })
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