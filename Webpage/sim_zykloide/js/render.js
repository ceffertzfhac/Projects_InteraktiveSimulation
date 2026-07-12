'use strict'

import {
  TIME_STEP, SIM_DURATION, DIAGRAM_WINDOW_S, POINT_RADIUS_FACTOR,
  PIXELS_PER_METER, GROUND_PX, START_OFFSET_PX, ANIM_W,
  V_VECTOR_SCALE, A_VECTOR_SCALE,
  GRAPH_W, GRAPH_H,
  subjects, quantities, quantityUnits, graphOptions, graphTitles, subjectLabels,
  subjectColorVar,
} from './constants.js'
import { store, DOM } from './state.js'
import { physToScreenX, physToScreenY, getNiceTickStep,
         interpolateAt, linePlotIndex } from './physics.js'
import { fmt } from '../../shared/js/format.js'
import { tAxisStep } from '../../shared/js/ticks.js'
export { fmt }

const NS = 'http://www.w3.org/2000/svg'

function el(tag, attrs) {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  return e
}

// fmt() via shared/js/format.js (T6)

// SVG-Text mit gemischter Formatierung (kursiv) aus HTML-<i>-Tags
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

// Label-String einer Größe aus den gruppierten Optionen
function graphOptionLabel(q) {
  for (const g in graphOptions) if (graphOptions[g][q]) return graphOptions[g][q]
  return ''
}

const traceClass = { sp: 'trace-sp', p1: 'trace-p1', p2: 'trace-p2', p3: 'trace-p3', p4: 'trace-p4' }

// ── Hintergrund (Kästchen + Streckenlineal) ──────────────────────────────────
export function drawBackground() {
  DOM.backgroundGroup.innerHTML = ''
  const totalWidth = (store.Vc * SIM_DURATION * PIXELS_PER_METER) + ANIM_W

  for (let x = 0; x < totalWidth; x += 50) {
    DOM.backgroundGroup.appendChild(el('line', {
      x1: x, y1: 0, x2: x, y2: GROUND_PX, class: 'bg-grid',
    }))
  }
  for (let dist_m = 0; dist_m * PIXELS_PER_METER < totalWidth; dist_m += 2) {
    const x_px = START_OFFSET_PX + dist_m * PIXELS_PER_METER
    DOM.backgroundGroup.appendChild(el('line', {
      x1: x_px, y1: GROUND_PX, x2: x_px, y2: GROUND_PX + 10,
      class: 'ruler-tick', 'stroke-width': 1.5,
    }))
    const t = el('text', { x: x_px, y: GROUND_PX + 25, 'text-anchor': 'middle', class: 'ruler-text' })
    t.textContent = `${dist_m} m`
    DOM.backgroundGroup.appendChild(t)
  }
}

// ── Spuren (Bahnkurven) ──────────────────────────────────────────────────────
function drawTraces(time) {
  DOM.tracesGroup.innerHTML = ''
  const numPoints = Math.floor(time / TIME_STEP)
  const drawTrace = s => {
    let path = ''
    for (let i = 0; i <= numPoints; i++) {
      const x_m = store.fullData[`${s}_x`][i]
      const y_m = store.fullData[`${s}_y`][i]
      path += (i === 0 ? 'M' : 'L') + `${physToScreenX(x_m)},${physToScreenY(y_m)}`
    }
    DOM.tracesGroup.appendChild(el('path', {
      d: path, fill: 'none', class: traceClass[s], 'stroke-width': 1.5, opacity: 0.5,
    }))
  }
  if (DOM.togSpTrace.checked) drawTrace('sp')
  if (DOM.togTraces.checked) ['p1', 'p2', 'p3', 'p4'].forEach(drawTrace)
}

// ── Geschw.- / Beschl.-Vektoren ──────────────────────────────────────────────
function drawVectors(interp) {
  const showV = DOM.togV.checked
  const showA = DOM.togA.checked
  DOM.vectorsGroup.innerHTML = ''
  if (!showV && !showA) return
  for (const s of subjects) {
    const x_px = physToScreenX(interp[s].x)
    const y_px = physToScreenY(interp[s].y)
    if (showV) {
      DOM.vectorsGroup.appendChild(el('line', {
        x1: x_px, y1: y_px,
        x2: x_px + interp[s].vx * V_VECTOR_SCALE,
        y2: y_px - interp[s].vy * V_VECTOR_SCALE,
        class: 'vec-vel', 'stroke-width': 2, 'marker-end': 'url(#arrow-vel)',
      }))
    }
    if (showA) {
      DOM.vectorsGroup.appendChild(el('line', {
        x1: x_px, y1: y_px,
        x2: x_px + interp[s].ax * A_VECTOR_SCALE,
        y2: y_px - interp[s].ay * A_VECTOR_SCALE,
        class: 'vec-acc', 'stroke-width': 2, 'marker-end': 'url(#arrow-acc)',
      }))
    }
  }
}

// ── Z-Reihenfolge der Spuren (vor/hinter dem Zylinder) ───────────────────────
export function updateTraceZOrder() {
  if (DOM.togTraceZOrder.checked) DOM.worldGroup.appendChild(DOM.tracesGroup)
  else DOM.worldGroup.insertBefore(DOM.tracesGroup, DOM.cylinderGroup)
}

// ── Live-Analyse-Panel ───────────────────────────────────────────────────────
function updateAnalysisPanel(interp) {
  subjects.forEach(s => {
    const checked = DOM.subjectCheckboxes[s].checked
    DOM.analysisGroup[s].style.display = checked ? '' : 'none'
    if (!checked) return
    quantities.forEach(qq => {
      const unit = quantityUnits[qq]
      DOM.liveValue[s][qq].textContent = `${fmt(interp[s][qq])} ${unit}`
    })
  })
}

// ── Diagramm zeichnen (aus v2.8 updateGraph, Multi-Subjekt) ──────────────────
function drawGraph(time) {
  const grid = DOM.gridGroup
  const title = DOM.graphTitle

  subjects.forEach(s => {
    DOM.graphLine[s].setAttribute('points', '')
    DOM.graphPoint[s].style.visibility = 'hidden'
  })
  grid.innerHTML = ''

  const padL = 55, padR = 15, padT = 30, padB = 40
  const plotW = GRAPH_W - padL - padR
  const plotH = GRAPH_H - padT - padB

  // Hover-Werte (I5): Hit-Rect-Geometrie aus denselben Lokalen synchronisieren,
  // die auch scaleT/scaleY bestimmen — keine Drift zwischen Klickfläche und
  // tatsächlicher Plot-Fläche möglich.
  DOM.graphHitRect.setAttribute('x', padL)
  DOM.graphHitRect.setAttribute('y', padT)
  DOM.graphHitRect.setAttribute('width', plotW)
  DOM.graphHitRect.setAttribute('height', plotH)

  const active = subjects.filter(s => DOM.subjectCheckboxes[s].checked)
  // Legende im Graph-Toolbar (aktive Subjekte)
  DOM.graphLegend.innerHTML = active.map(s =>
    `<div class="graph-leg-item"><div class="graph-leg-dot" style="background:var(--c-${s})"></div>${subjectLabels[s]}</div>`
  ).join('')
  if (active.length === 0) {
    title.textContent = ''; DOM.graphLegend.innerHTML = ''
    store.graphScale = null
    hideGraphHover()
    return
  }

  const quantity = store.graphType
  const t_max_display = Math.max(DIAGRAM_WINDOW_S, time)
  const time_range = t_max_display // t_min = 0

  let endIndex = store.fullData.t.findIndex(tv => tv > t_max_display)
  if (endIndex === -1) endIndex = store.fullData.t.length

  let val_min = Infinity, val_max = -Infinity
  active.forEach(s => {
    const dw = store.fullData[`${s}_${quantity}`].slice(0, endIndex)
    val_min = Math.min(val_min, ...dw)
    val_max = Math.max(val_max, ...dw)
  })
  val_min = Math.min(0, val_min)
  val_max = Math.max(0, val_max)
  const range = val_max - val_min
  if (range < 1e-9) { val_min -= 0.5; val_max += 0.5 }
  else { const p = range * 0.1; val_min -= p; val_max += p }

  // Hover-Werte (I5): einzige Quelle der Wahrheit für updateGraphHover(), das
  // unabhängig vom RAF-Loop per pointermove ausgelöst wird und dieselbe
  // Skala braucht wie die gerade gezeichneten Kurven — nie separat berechnen.
  store.graphScale = { padL, padT, plotW, plotH, time_range, val_min, val_max, quantity, active }

  // Hintergrund
  grid.appendChild(el('rect', { x: padL, y: padT, width: plotW, height: plotH, class: 'graph-bg' }))

  const scaleT = tv => padL + ((tv) / (time_range || 1)) * plotW
  const scaleY = v => padT + plotH - ((v - val_min) / ((val_max - val_min) || 1)) * plotH
  const xAxisY = padT + plotH

  // Achsen
  grid.appendChild(el('line', {
    x1: padL, y1: xAxisY, x2: padL + plotW, y2: xAxisY,
    class: 'axis-line', 'stroke-width': 1.5, 'marker-end': 'url(#arrowhead)',
  }))
  grid.appendChild(el('line', {
    x1: padL, y1: xAxisY, x2: padL, y2: padT,
    class: 'axis-line', 'stroke-width': 1.5, 'marker-end': 'url(#arrowhead)',
  }))

  // Y-Ticks
  const yStep = getNiceTickStep(val_max - val_min, 8)
  for (let v = Math.ceil(val_min / yStep) * yStep; v <= val_max + 1e-9; v += yStep) {
    const yp = scaleY(v)
    grid.appendChild(el('line', { x1: padL, y1: yp, x2: padL + plotW, y2: yp, class: 'grid-line' }))
    const t = el('text', { x: padL - 8, y: yp + 4, 'text-anchor': 'end', class: 'tick-label' })
    t.textContent = fmt(v, yStep % 1 === 0 ? 0 : 1)
    grid.appendChild(t)
  }

  // t-Ticks (≥3 neben Ursprung via tAxisStep)
  const tStep = tAxisStep(time_range)
  for (let tg = Math.ceil(0 / tStep) * tStep; tg <= t_max_display + 1e-9; tg += tStep) {
    const xp = scaleT(tg)
    grid.appendChild(el('line', { x1: xp, y1: padT, x2: xp, y2: xAxisY, class: 'grid-line' }))
    const t = el('text', { x: xp, y: xAxisY + 15, 'text-anchor': 'middle', class: 'tick-label' })
    t.textContent = fmt(tg, tStep < 1 ? 1 : 0)
    grid.appendChild(t)
  }

  // Achsenbeschriftungen
  const yLabel = el('text', {
    transform: `rotate(-90, ${padL - 40}, ${padT + plotH / 2})`,
    x: padL - 40, y: padT + plotH / 2, 'text-anchor': 'middle', class: 'axis-label',
  })
  createStyledSvgText(yLabel, graphOptionLabel(quantity))
  grid.appendChild(yLabel)

  const tLabel = el('text', { x: padL + plotW / 2, y: xAxisY + 30, 'text-anchor': 'middle', class: 'axis-label' })
  createStyledSvgText(tLabel, 'Zeit <i>t</i> / s')
  grid.appendChild(tLabel)

  // Titel
  title.textContent = graphTitles[quantity]

  // Datenlinien +当前er Punkt
  const plotIndex = linePlotIndex(time)
  active.forEach(s => {
    const data = store.fullData[`${s}_${quantity}`]
    const tArr = store.fullData.t
    const pts = []
    for (let i = 0; i < plotIndex && i < data.length; i++) {
      pts.push(`${scaleT(tArr[i])},${scaleY(data[i])}`)
    }
    let curVal = null
    if (time <= SIM_DURATION && plotIndex > 0) {
      const i = Math.max(0, plotIndex - 1)
      const t1 = tArr[i], t2 = tArr[i + 1] || t1
      const a = t2 > t1 ? (time - t1) / (t2 - t1) : 0
      curVal = data[i] + a * ((data[i + 1] || data[i]) - data[i])
      pts.push(`${scaleT(time)},${scaleY(curVal)}`)
    }
    DOM.graphLine[s].setAttribute('points', pts.join(' '))
    if (curVal !== null) {
      DOM.graphPoint[s].setAttribute('cx', scaleT(time))
      DOM.graphPoint[s].setAttribute('cy', scaleY(curVal))
      DOM.graphPoint[s].style.visibility = 'visible'
    }
  })

  // Hover-Werte (I5): time_range wächst mit der Wiedergabe (Scroll-Fenster) —
  // bei offenem Hover jeden Frame mit der frischen Skala neu berechnen, sonst
  // liefe der Tooltip aus dem Ruder. Die RAF-Schleife selbst bleibt hover-
  // unwissend (kein Aufruf hier hinein, nur diese Rückkopplung von dort).
  if (store.hoverActive) updateGraphHover(store.hoverLocalX)
}

function hideGraphHover() {
  DOM.hoverLine.setAttribute('visibility', 'hidden')
  subjects.forEach(s => DOM.hoverPoint[s].setAttribute('visibility', 'hidden'))
  DOM.hoverTooltip.setAttribute('visibility', 'hidden')
}

/**
 * Hover-Cursor + Tooltip für die aktuell gehoverte lokale x-Koordinate
 * (SVG-Koordinaten des #graph_svg-viewBox, von attachGraphHover() geliefert).
 * Liest store.graphScale (von drawGraph() befüllt) statt eigene Skala zu
 * berechnen — einzige Quelle der Wahrheit, siehe drawGraph()-Kommentar.
 */
export function updateGraphHover(localX) {
  store.hoverActive = localX !== null
  store.hoverLocalX = localX
  const gs = store.graphScale
  if (localX === null || !gs || gs.active.length === 0) { hideGraphHover(); return }

  const { padL, padT, plotW, plotH, time_range, val_min, val_max, quantity, active } = gs
  const xClamped = Math.max(padL, Math.min(padL + plotW, localX))
  const rawT = ((xClamped - padL) / plotW) * time_range
  // Cursor nur auf dem bereits gezeichneten Kurvenabschnitt (KNOWN_LIMITATIONS → I5).
  const t = Math.max(0, Math.min(rawT, time_range, store.simulatedTime))

  const interp = interpolateAt(t)
  if (!interp) { hideGraphHover(); return }

  const scaleT = tv => padL + (tv / (time_range || 1)) * plotW
  const scaleY = v => padT + plotH - ((v - val_min) / ((val_max - val_min) || 1)) * plotH
  const xPix = scaleT(t)

  DOM.hoverLine.setAttribute('x1', xPix); DOM.hoverLine.setAttribute('x2', xPix)
  DOM.hoverLine.setAttribute('y1', padT); DOM.hoverLine.setAttribute('y2', padT + plotH)
  DOM.hoverLine.setAttribute('visibility', 'visible')

  subjects.forEach(s => {
    if (!active.includes(s)) { DOM.hoverPoint[s].setAttribute('visibility', 'hidden'); return }
    const v = interp[s][quantity]
    DOM.hoverPoint[s].setAttribute('cx', xPix)
    DOM.hoverPoint[s].setAttribute('cy', scaleY(v))
    DOM.hoverPoint[s].setAttribute('visibility', 'visible')
  })

  renderHoverTooltip(active, interp, quantity, t, xPix, padL, plotW, padT)
}

function renderHoverTooltip(active, interp, quantity, t, xPix, padL, plotW, padT) {
  const textEl = DOM.hoverTooltipText
  textEl.innerHTML = ''
  const lineH = 15
  const rows = [{ label: null, text: `t = ${fmt(t, 2)} s`, color: null, italic: true }]
  active.forEach(s => rows.push({
    label: subjectLabels[s], text: `${fmt(interp[s][quantity], 2)} ${quantityUnits[quantity]}`,
    color: `var(${subjectColorVar[s]})`,
  }))
  rows.forEach((row, i) => {
    const tspan = document.createElementNS(NS, 'tspan')
    tspan.setAttribute('x', 8)
    tspan.setAttribute('y', 16 + i * lineH)
    if (row.color) tspan.style.fill = row.color
    if (row.italic) {
      const sym = document.createElementNS(NS, 'tspan')
      sym.setAttribute('font-style', 'italic')
      sym.textContent = 't'
      tspan.appendChild(sym)
      tspan.appendChild(document.createTextNode(row.text.slice(1)))
    } else {
      tspan.textContent = `${row.label}: ${row.text}`
    }
    textEl.appendChild(tspan)
  })

  const bbox = textEl.getBBox()
  const boxW = bbox.width + 16, boxH = bbox.height + 12
  DOM.hoverTooltipBg.setAttribute('width', boxW)
  DOM.hoverTooltipBg.setAttribute('height', boxH)
  DOM.hoverTooltipBg.setAttribute('x', 0)
  DOM.hoverTooltipBg.setAttribute('y', 0)

  let tx = xPix + 12
  tx = Math.max(padL, Math.min(padL + plotW - boxW, tx))
  DOM.hoverTooltip.setAttribute('transform', `translate(${tx}, ${padT + 6})`)
  DOM.hoverTooltip.setAttribute('visibility', 'visible')
}

// ── Szene aktualisieren (Kamera, Zylinder, Punkte, Spuren, Vektoren) ─────────
export function updateScene(time) {
  const interp = interpolateAt(time)
  if (!interp) return

  const R_px = store.R * PIXELS_PER_METER
  const sp_x_px = physToScreenX(interp.sp.x)
  const sp_y_px = physToScreenY(store.R)

  // Kamera-Follow: ab trigger_x_px wird die Welt nach links verschoben
  const trigger_x_px = ANIM_W - R_px - 10
  let camera_shift = 0
  if (sp_x_px > trigger_x_px) camera_shift = sp_x_px - trigger_x_px
  DOM.worldGroup.setAttribute('transform', `translate(${-camera_shift}, 0)`)

  DOM.cylinderGroup.setAttribute('transform', `translate(${sp_x_px}, ${sp_y_px})`)
  DOM.cylinderBody.setAttribute('r', R_px)

  // Punkte auf dem inneren Kreis (relativ zum Zentrum)
  const angle = -store.omega * time
  const r_px = R_px * POINT_RADIUS_FACTOR
  DOM.points.p1.setAttribute('cx', r_px * Math.cos(angle))
  DOM.points.p1.setAttribute('cy', -r_px * Math.sin(angle))
  DOM.points.p2.setAttribute('cx', r_px * Math.cos(Math.PI / 2 + angle))
  DOM.points.p2.setAttribute('cy', -r_px * Math.sin(Math.PI / 2 + angle))
  DOM.points.p3.setAttribute('cx', r_px * Math.cos(Math.PI + angle))
  DOM.points.p3.setAttribute('cy', -r_px * Math.sin(Math.PI + angle))
  DOM.points.p4.setAttribute('cx', r_px * Math.cos(3 * Math.PI / 2 + angle))
  DOM.points.p4.setAttribute('cy', -r_px * Math.sin(3 * Math.PI / 2 + angle))

  drawTraces(time)
  drawVectors(interp)
  updateAnalysisPanel(interp)
  drawGraph(time)

  DOM.timeLabel.innerHTML = `<i>t</i> = ${fmt(time)} s`
}

export { TIME_STEP }