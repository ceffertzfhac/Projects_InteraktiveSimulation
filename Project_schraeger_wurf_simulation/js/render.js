'use strict'

import {
  G, BALL_START_X_PX, GROUND_PX, ANIM_W,
  PIXELS_PER_VELOCITY_UNIT, PIXELS_PER_ACCELERATION_UNIT, BALL_RADIUS_BASE_PX,
  DEFAULT_PIXELS_PER_METER, TIME_STEP,
  WATCH_CX, WATCH_CY, WATCH_R, SDIAL_CX, SDIAL_CY, SDIAL_R,
  GRAPH_W, GRAPH_H, GRAPH_H_STACKED,
  SF_HEAD_RADIUS_M, SF_TORSO_HEIGHT_M, SF_LEG_HEIGHT_M, SF_ARM_LENGTH_M, SF_SHOULDER_TO_FEET_M,
  SEG_THICK, SEG_LEN, DIGIT_WIDTH, DIGIT_HEIGHT, DIGIT_SPACING, COLON_WIDTH,
  COLON_DOT_SIZE, LCD_FRAME_PADDING, DIGITAL_FRAME_X, DIGITAL_FRAME_Y,
  DIGITAL_FRAME_WIDTH, DIGITAL_FRAME_HEIGHT, DIGIT_SEGMENTS_MAP,
  singleGraphOptions,
} from './constants.js'
import { store, DOM } from './state.js'
import { scaleX, scaleY, getDisplayY, getDisplayV, getDisplayA,
         flightTime, maxHeight, range, impactAngle, getNiceTickStep, linePlotIndex } from './physics.js'

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

// SVG-Text mit gemischter Formatierung (normal/kursiv) aus HTML-<i>-Tags
function createStyledSvgText(svgEl, text) {
  const regex = /<i>(.*?)<\/i>|([^<>&]+)/g
  let m
  while ((m = regex.exec(text)) !== null) {
    if (m[1]) {
      const t = document.createElementNS(NS, 'tspan')
      t.setAttribute('font-style', 'italic')
      t.textContent = m[1]
      svgEl.appendChild(t)
    } else if (m[2]) {
      svgEl.appendChild(document.createTextNode(m[2]))
    }
  }
}

// ── Lineale ──────────────────────────────────────────────────────────────────
export function drawRuler() {
  DOM.rulerGroup.innerHTML = ''
  const rx = 45, rw = 15
  const ppm = store.currentPixelsPerMeter
  const zoom = store.zoomFactor
  const maxM = Math.ceil(GROUND_PX / ppm)
  DOM.rulerGroup.appendChild(el('rect', {
    x: rx, y: scaleY(maxM), width: rw, height: maxM * ppm,
    class: 'ruler-bg',
  }))
  const majorInt = Math.max(1, Math.round(5 / zoom))
  const minorInt = Math.max(1, Math.round(1 / zoom))
  for (let m = 0; m <= maxM; m += 0.5) {
    if (Math.abs(m % majorInt) > 0.1 && Math.abs(m % minorInt) > 0.1) continue
    const yp = scaleY(m)
    const isMajor = Math.abs(m % majorInt) < 0.1
    const lineLen = (isMajor ? 10 : 5) * zoom
    if (isMajor) {
      const t = el('text', { x: rx - 5, y: yp + 4, 'text-anchor': 'end', class: 'ruler-text' })
      t.textContent = `${Math.round(m)}`
      DOM.rulerGroup.appendChild(t)
    }
    DOM.rulerGroup.appendChild(el('line', {
      x1: rx + rw, y1: yp, x2: rx + rw - lineLen, y2: yp,
      class: 'ruler-tick', 'stroke-width': isMajor ? 2 : 1,
    }))
  }
}

export function drawHorizontalRuler() {
  DOM.horizontalRulerGroup.innerHTML = ''
  const ppm = store.currentPixelsPerMeter
  const zoom = store.zoomFactor
  const majorInt = Math.max(1, Math.round(5 / zoom))
  const minorInt = Math.max(1, Math.round(1 / zoom))
  const maxDist = (ANIM_W - BALL_START_X_PX) / ppm
  for (let m = 0; m <= maxDist; m += 0.5) {
    const xp = scaleX(m)
    if (xp > ANIM_W) break
    const isMajor = Math.abs(m % majorInt) < 0.1
    const isMinor = Math.abs(m % minorInt) < 0.1
    if (isMajor || isMinor) {
      const tickH = (isMajor ? 10 : 5) * zoom
      DOM.horizontalRulerGroup.appendChild(el('line', {
        x1: xp, y1: GROUND_PX, x2: xp, y2: GROUND_PX - tickH,
        class: 'ruler-tick', 'stroke-width': isMajor ? 2 : 1,
      }))
      if (isMajor) {
        const t = el('text', { x: xp, y: GROUND_PX - tickH - 5, 'text-anchor': 'middle', class: 'ruler-text' })
        t.textContent = Math.round(m)
        DOM.horizontalRulerGroup.appendChild(t)
      }
    }
  }
}

// ── Strichmännchen (Arm in α-Richtung zum Ball) ──────────────────────────────
export function drawStickFigure(shoulderX, shoulderY, armTargetX, armTargetY) {
  DOM.stickFigure.innerHTML = ''
  const ppm = store.currentPixelsPerMeter
  const feetY = shoulderY + SF_SHOULDER_TO_FEET_M * ppm
  const baseX = shoulderX
  const crotchY = feetY - SF_LEG_HEIGHT_M * ppm
  const headY = shoulderY - SF_HEAD_RADIUS_M * ppm
  const lp = (x1, y1, x2, y2) => el('line', { x1, y1, x2, y2, class: 'sf-line', 'stroke-width': 2 })
  DOM.stickFigure.appendChild(lp(baseX, crotchY, baseX - SF_HEAD_RADIUS_M * ppm, feetY))
  DOM.stickFigure.appendChild(lp(baseX, crotchY, baseX + SF_HEAD_RADIUS_M * ppm, feetY))
  DOM.stickFigure.appendChild(lp(baseX, crotchY, baseX, shoulderY))
  DOM.stickFigure.appendChild(el('circle', {
    cx: baseX, cy: headY, r: SF_HEAD_RADIUS_M * ppm,
    class: 'sf-head', 'stroke-width': 2,
  }))
  DOM.stickFigure.appendChild(lp(shoulderX, shoulderY, armTargetX, armTargetY))
  return feetY
}

// ── Animations-Koordinatensystem-Overlay ─────────────────────────────────────
export function drawAnimationCoordSystem() {
  DOM.animationCoordSystem.innerHTML = ''
  const zoom = store.zoomFactor
  const axisLen = 60 * zoom
  const ox = BALL_START_X_PX
  const oy = store.yAxisConfig.origin === 'start' ? scaleY(store.h0) : scaleY(0)
  const yDir = store.yAxisConfig.direction === 'up' ? -1 : 1
  const attrs = { class: 'coord-axis', 'stroke-width': 2, 'marker-end': 'url(#arrowhead)', 'stroke-dasharray': '2,2' }
  DOM.animationCoordSystem.appendChild(el('line', { ...attrs, x1: ox, y1: oy, x2: ox + axisLen, y2: oy }))
  const xLab = el('text', { x: ox + axisLen + 5, y: oy + 14, class: 'coord-label' })
  createStyledSvgText(xLab, '<i>x</i> / m')
  DOM.animationCoordSystem.appendChild(xLab)
  DOM.animationCoordSystem.appendChild(el('line', { ...attrs, x1: ox, y1: oy, x2: ox, y2: oy + axisLen * yDir }))
  const yLab = el('text', { x: ox - 40, y: oy + axisLen * yDir - 5 * yDir, class: 'coord-label' })
  createStyledSvgText(yLab, '<i>y</i> / m')
  DOM.animationCoordSystem.appendChild(yLab)
}

// ── Stoppuhr-Skalen ──────────────────────────────────────────────────────────
export function drawStopwatchMarks() {
  DOM.stopwatchMarks.innerHTML = ''
  for (let s = 0; s < 60; s++) {
    const a = (s / 60) * 2 * Math.PI
    const ri = WATCH_R - (s % 5 === 0 ? 12 : 6)
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

// ── LCD-Digitaluhr (Easteregg) ───────────────────────────────────────────────
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
    width: DIGITAL_FRAME_WIDTH, height: DIGITAL_FRAME_HEIGHT,
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
  const colonYT = contentY + DIGIT_HEIGHT * 0.3
  const colonYB = contentY + DIGIT_HEIGHT * 0.7
  DOM.digitalDisplayGroup.appendChild(el('rect', {
    id: 'colon_dot_top', x: colonX - COLON_DOT_SIZE / 2, y: colonYT - COLON_DOT_SIZE / 2,
    width: COLON_DOT_SIZE, height: COLON_DOT_SIZE, class: 'lcd-seg-off',
    rx: COLON_DOT_SIZE / 2, ry: COLON_DOT_SIZE / 2,
  }))
  DOM.digitalDisplayGroup.appendChild(el('rect', {
    id: 'colon_dot_bottom', x: colonX - COLON_DOT_SIZE / 2, y: colonYB - COLON_DOT_SIZE / 2,
    width: COLON_DOT_SIZE, height: COLON_DOT_SIZE, class: 'lcd-seg-off',
    rx: COLON_DOT_SIZE / 2, ry: COLON_DOT_SIZE / 2,
  }))
}

export function updateDigitalDisplay(totalSeconds) {
  const seconds = Math.floor(totalSeconds % 100)
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

// ── Diagramm-Titel ───────────────────────────────────────────────────────────
function stripHtml(s) {
  return s.replace(/<\/?i>/g, '').replace(/ₓ/g, 'x').replace(/ᵧ/g, 'y')
}

function getGraphTitleText(type, isStacked) {
  if (['yx', 'xy'].includes(type)) {
    return type === 'yx' ? 'Bahnkurve y(x)' : 'Bahnkurve x(y)'
  }
  if (isStacked) {
    if (type === 'x-pos') return 'Ort x(t)'
    if (type === 'y-pos') return 'Ort y(t)'
    if (type === 'x-vel') return 'Geschwindigkeit vx(t)'
    if (type === 'y-vel') return 'Geschwindigkeit vy(t)'
    if (type === 'x-acc') return 'Beschleunigung ax(t)'
    if (type === 'y-acc') return 'Beschleunigung ay(t)'
  }
  for (const groupLabel in singleGraphOptions) {
    for (const val in singleGraphOptions[groupLabel]) {
      if (val === type) {
        return stripHtml(singleGraphOptions[groupLabel][val])
          .replace(/\s\/\s\(?m.*$/, '') + ' vs. Zeit'
      }
    }
  }
  return ''
}

// ── Diagramm zeichnen (aus v47 drawSingleGraph) ──────────────────────────────
function drawSingleGraph({ titleEl, gridEl, lineEl, pointEl, type,
                           plotTime, plotValue, useYAxisConfig, currentX, currentY }) {
  const isStacked = store.isStacked
  const graphWidth = GRAPH_W
  const graphHeight = isStacked ? GRAPH_H_STACKED : GRAPH_H
  const padL = 45, padB = 35, padT = 10, padR = 10
  const plotW = graphWidth - padL - padR
  const plotH = graphHeight - padT - padB

  pointEl.style.visibility = 'hidden'
  pointEl.setAttribute('cx', -100)
  gridEl.innerHTML = ''
  gridEl.appendChild(el('rect', {
    x: padL, y: padT, width: plotW, height: plotH,
    class: 'graph-bg',
  }))

  const typeMap = { 'y-pos': 'yt', 'y-vel': 'vyt', 'y-acc': 'ayt', 'x-pos': 'xt', 'x-vel': 'vxt', 'x-acc': 'axt' }
  const effType = typeMap[type] || type
  const isTraj = ['yx', 'xy'].includes(effType)

  let xData, yData, xMax, yMin, yMax, xLabel, yLabel, plotX, plotY

  if (isTraj) {
    const yDisplay = store.ytData.map(getDisplayY)
    if (effType === 'yx') {
      xData = store.xtData; yData = yDisplay
      xMax = store.axisLimits.xt.max
      yMin = store.axisLimits.yt_display.min; yMax = store.axisLimits.yt_display.max
      xLabel = 'Wurfweite <i>x</i> / m'; yLabel = 'Höhe <i>y</i> / m'
      plotX = currentX; plotY = currentY !== null ? getDisplayY(currentY) : null
    } else {
      xData = yDisplay; yData = store.xtData
      xMax = store.axisLimits.yt_display.max
      yMin = store.axisLimits.xt.min; yMax = store.axisLimits.xt.max
      xLabel = 'Höhe <i>y</i> / m'; yLabel = 'Wurfweite <i>x</i> / m'
      plotX = currentY !== null ? getDisplayY(currentY) : null; plotY = currentX
    }
  } else {
    const isYComp = ['yt', 'vyt', 'ayt'].includes(effType)
    const suffix = useYAxisConfig && isYComp ? '_display' : ''
    const limits = store.axisLimits[effType + suffix]
    if (!limits) { lineEl.setAttribute('points', ''); return }
    xData = store.tData; yData = limits.fullData
    xMax = limits.tMax; yMin = limits.min; yMax = limits.max
    xLabel = 'Zeit <i>t</i> / s'; yLabel = limits.yLabelText
    plotX = plotTime; plotY = plotValue
  }

  if (Math.abs(yMin - yMax) < 1e-9) { yMin -= 1; yMax += 1 }
  const yStep = getNiceTickStep(yMax - yMin, isStacked ? 4 : 8)
  yMin = Math.floor(yMin / yStep) * yStep
  yMax = Math.ceil(yMax / yStep) * yStep
  if (Math.abs(yMin - yMax) < 1e-9) { yMin -= yStep; yMax += yStep }

  const scX = v => padL + (v / (xMax || 1)) * plotW
  const scY = v => padT + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH
  const y0 = scY(0)

  const numXTicks = isTraj ? 5 : 10
  for (let i = 0; i <= numXTicks; i++) {
    const xv = (xMax / numXTicks) * i
    const xp = scX(xv)
    gridEl.appendChild(el('line', { x1: xp, y1: padT, x2: xp, y2: padT + plotH, class: 'grid-line' }))
    const t = el('text', { x: xp, y: y0 + 15, 'text-anchor': 'middle', class: 'tick-label' })
    t.textContent = xv.toFixed(1)
    gridEl.appendChild(t)
  }
  for (let v = yMin; v <= yMax + 1e-9; v += yStep) {
    const yp = scY(v)
    gridEl.appendChild(el('line', { x1: padL, y1: yp, x2: padL + plotW, y2: yp, class: 'grid-line' }))
    const t = el('text', { x: padL - 8, y: yp + 4, 'text-anchor': 'end', class: 'tick-label' })
    t.textContent = v.toFixed(yStep % 1 === 0 ? 0 : 1)
    gridEl.appendChild(t)
  }

  gridEl.appendChild(el('line', { x1: padL, y1: y0, x2: padL + plotW, y2: y0, class: 'axis-line', 'stroke-width': 1.5, 'marker-end': 'url(#arrowhead)' }))
  gridEl.appendChild(el('line', { x1: padL, y1: padT + plotH, x2: padL, y2: padT, class: 'axis-line', 'stroke-width': 1.5, 'marker-end': 'url(#arrowhead)' }))

  const xLab = el('text', { x: padL + plotW / 2, y: y0 + 30, 'text-anchor': 'middle', class: 'axis-label' })
  createStyledSvgText(xLab, xLabel)
  gridEl.appendChild(xLab)

  const yLabX = -10, yLabY = padT + plotH / 2
  const yLab = el('text', {
    'text-anchor': 'middle', transform: `rotate(-90, ${yLabX}, ${yLabY})`,
    x: yLabX, y: yLabY, class: 'axis-label',
  })
  let finalLabel = yLabel
  if (isStacked) {
    const labelMap = {
      'x-pos': singleGraphOptions['Horizontale Bewegung'].xt,
      'y-pos': singleGraphOptions['Vertikale Bewegung'].yt,
      'x-vel': singleGraphOptions['Horizontale Bewegung'].vxt,
      'y-vel': singleGraphOptions['Vertikale Bewegung'].vyt,
      'x-acc': singleGraphOptions['Horizontale Bewegung'].axt,
      'y-acc': singleGraphOptions['Vertikale Bewegung'].ayt,
    }
    finalLabel = labelMap[type] || yLabel
  }
  createStyledSvgText(yLab, finalLabel)
  gridEl.appendChild(yLab)

  titleEl.textContent = getGraphTitleText(type, isStacked)

  const idx = linePlotIndex(plotTime)
  let p = ''
  for (let i = 0; i < idx && i < xData.length; i++) {
    p += `${scX(xData[i])},${scY(yData[i])} `
  }
  if (plotX !== null && plotY !== null && idx < xData.length) {
    p += `${scX(plotX)},${scY(plotY)} `
  }
  lineEl.setAttribute('points', p)

  if (plotX !== null && plotY !== null) {
    pointEl.setAttribute('cx', scX(plotX))
    pointEl.setAttribute('cy', scY(plotY))
    pointEl.style.visibility = 'visible'
  }
}

export function updateGraphs(plotTime, plotValue, plotValueTop = null, plotValueBottom = null, currentX = null, currentY = null) {
  const isStacked = store.isStacked
  DOM.graphGroupSingle.style.visibility = isStacked ? 'hidden' : 'visible'
  DOM.graphGroupStackedTop.style.visibility = isStacked ? 'visible' : 'hidden'
  DOM.graphGroupStackedBottom.style.visibility = isStacked ? 'visible' : 'hidden'
  if (isStacked) DOM.graphTitle.textContent = ''

  const sel = store.graphType
  if (isStacked) {
    DOM.graphTitleTop.textContent = getGraphTitleText(`x-${sel}`, true)
    DOM.graphTitleBottom.textContent = getGraphTitleText(`y-${sel}`, true)
    drawSingleGraph({ titleEl: DOM.graphTitleTop, gridEl: DOM.gridGroupTop, lineEl: DOM.graphLineTop, pointEl: DOM.graphPointTop, type: `x-${sel}`, plotTime, plotValue: plotValueTop, useYAxisConfig: false })
    drawSingleGraph({ titleEl: DOM.graphTitleBottom, gridEl: DOM.gridGroupBottom, lineEl: DOM.graphLineBottom, pointEl: DOM.graphPointBottom, type: `y-${sel}`, plotTime, plotValue: plotValueBottom, useYAxisConfig: true })
  } else {
    drawSingleGraph({ titleEl: DOM.graphTitle, gridEl: DOM.gridGroup, lineEl: DOM.graphLine, pointEl: DOM.graphPoint, type: sel, plotTime, plotValue, useYAxisConfig: true, currentX, currentY })
  }
}

// ── Szene aktualisieren (Ball, Bahn, Vektoren, Stoppuhr, Live-Panel) ─────────
export function updateScene(t, x, y, vx, vy) {
  const zoom = store.zoomFactor
  const cx = scaleX(x), cy = scaleY(y)
  DOM.ball.setAttribute('cx', cx)
  DOM.ball.setAttribute('cy', cy)

  // Bahn
  if (DOM.togTrajectory.checked) {
    let pts = ''
    const idx = linePlotIndex(t)
    for (let k = 0; k <= idx && k < store.xtData.length; k++) {
      pts += `${scaleX(store.xtData[k])},${scaleY(store.ytData[k])} `
    }
    pts += `${cx},${cy} `
    DOM.trajectoryLine.setAttribute('points', pts)
    DOM.trajectoryLine.style.visibility = 'visible'
  } else {
    DOM.trajectoryLine.style.visibility = 'hidden'
  }

  // Beschleunigungsvektor (konstant g ↓)
  if (DOM.togAcc.checked) {
    DOM.accVector.setAttribute('visibility', 'visible')
    DOM.accVector.setAttribute('x1', cx); DOM.accVector.setAttribute('y1', cy)
    DOM.accVector.setAttribute('x2', cx); DOM.accVector.setAttribute('y2', cy + G * PIXELS_PER_ACCELERATION_UNIT * zoom)
  } else {
    DOM.accVector.setAttribute('visibility', 'hidden')
  }

  // Geschwindigkeitsvektor (+ optionale Komponenten)
  DOM.velVector.setAttribute('visibility', 'hidden')
  DOM.velVectorX.setAttribute('visibility', 'hidden')
  DOM.velVectorY.setAttribute('visibility', 'hidden')
  if (DOM.togVel.checked) {
    const showComp = DOM.togVelComp.checked
    const endVx = cx + vx * PIXELS_PER_VELOCITY_UNIT * zoom
    const endVy = cy - vy * PIXELS_PER_VELOCITY_UNIT * zoom
    if (showComp) {
      DOM.velVectorX.setAttribute('visibility', 'visible')
      DOM.velVectorX.setAttribute('x1', cx); DOM.velVectorX.setAttribute('y1', cy)
      DOM.velVectorX.setAttribute('x2', endVx); DOM.velVectorX.setAttribute('y2', cy)
      DOM.velVectorY.setAttribute('visibility', 'visible')
      DOM.velVectorY.setAttribute('x1', cx); DOM.velVectorY.setAttribute('y1', cy)
      DOM.velVectorY.setAttribute('x2', cx); DOM.velVectorY.setAttribute('y2', endVy)
    } else {
      DOM.velVector.setAttribute('visibility', 'visible')
      DOM.velVector.setAttribute('x1', cx); DOM.velVector.setAttribute('y1', cy)
      DOM.velVector.setAttribute('x2', endVx); DOM.velVector.setAttribute('y2', endVy)
    }
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
  DOM.liveX.textContent = `${fmt(x)} m`
  DOM.liveY.textContent = `${fmt(getDisplayY(y))} m`
  DOM.liveVx.textContent = `${fmt(vx)} m/s`
  DOM.liveVy.textContent = `${fmt(getDisplayV(vy))} m/s`
  DOM.liveVabs.textContent = `${fmt(Math.sqrt(vx * vx + vy * vy))} m/s`
  DOM.liveAy.textContent = `${fmt(getDisplayA(-G))} m/s²`
}

// ── Kennwerte ────────────────────────────────────────────────────────────────
export function updateKennwerte() {
  const tf = flightTime()
  const vImpact = Math.sqrt(store.v0x * store.v0x + (store.v0y - G * tf) ** 2)
  DOM.liveTfall.textContent = `${fmt(tf)} s`
  DOM.liveXmax.textContent = `${fmt(range())} m`
  DOM.liveYmax.textContent = `${fmt(maxHeight())} m`
  DOM.liveVimpact.textContent = `${fmt(vImpact)} m/s`
  DOM.liveAimpact.textContent = `${fmt(impactAngle(), 1)} °`
}

// ── Physik-Formeln (achsenkonfigurationsabhängig, statisch) ───────────────────
const _PF_IDS = ['pf_up_ground', 'pf_up_start', 'pf_down_ground', 'pf_down_start']

export function updatePhysicsFormulas() {
  const { direction, origin } = store.yAxisConfig
  const active = `pf_${direction}_${origin}`
  _PF_IDS.forEach(id => {
    const e = document.getElementById(id)
    if (e) e.style.display = id === active ? '' : 'none'
  })
}

// ── Zoom-Anzeige ─────────────────────────────────────────────────────────────
export function updateZoomDisplay() {
  DOM.zoomTextDisplay.innerHTML = ''
  DOM.zoomTextDisplay.appendChild(document.createTextNode(`Zoom: ${store.zoomFactor.toFixed(2)}`))
  const t = document.createElementNS(NS, 'tspan')
  t.setAttribute('font-style', 'italic')
  t.textContent = 'x'
  DOM.zoomTextDisplay.appendChild(t)
}

export { BALL_RADIUS_BASE_PX, TIME_STEP, DEFAULT_PIXELS_PER_METER }