'use strict'

import { T_MAX, X_MAX, STOP_POSITIONS, STOP_LABELS, GRAPH_OPTIONS,
         GRAPH_W, GRAPH_H, PLOT_W, PLOT_BOTTOM, PLOT_TOP, T_TICK_STEP, X_TICK_STEP,
         ROAD_X, ROAD_HALF_W, STREET_Y0, STREET_LEN, ROAD_TOP, ROAD_BOTTOM,
         BUS_LEN, BUS_WID, CROSS_R } from './constants.js'
import { store, DOM } from './state.js'
import { interpolateAt, phaseInfoAt } from './physics.js'
import { fmt } from '../../shared/js/format.js'
import { setAxisLabel, setGraphTitle } from '../../shared/js/svg-text.js'
import { niceStepLE } from '../../shared/js/ticks.js'

const NS = 'http://www.w3.org/2000/svg'
const el = (tag, attrs) => {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  return e
}

// ── Koordinaten-Transformation (zentral) ───────────────────────────────────────
// Straße: physikalischer Ort x [m] → Bildschirm-y [px] (senkrecht, x = 0 unten).
// Gleicher Maßstab wie die Ordinate des Ort-Zeit-Diagramms (s. constants.js).
export const physToScreen = x => STREET_Y0 - (x / X_MAX) * STREET_LEN

const dataOf = type => (type === 'ort' ? store.x_data : type === 'geschw' ? store.v_data : store.a_data)

// ── Statische Straßenszene (einmalig) ──────────────────────────────────────────
export function drawStreet() {
  const g = DOM.streetGroup
  g.innerHTML = ''
  g.appendChild(el('rect', { x: ROAD_X - ROAD_HALF_W, y: ROAD_TOP, width: 2 * ROAD_HALF_W,
                             height: ROAD_BOTTOM - ROAD_TOP, rx: 4, class: 'road' }))
  g.appendChild(el('line', { x1: ROAD_X, y1: ROAD_TOP, x2: ROAD_X, y2: ROAD_BOTTOM, class: 'road-mid' }))

  // Haltestellen: Pfosten nach links + Schild H1 … H4
  STOP_POSITIONS.forEach((xs, i) => {
    const y = physToScreen(xs)
    g.appendChild(el('line', { x1: ROAD_X - ROAD_HALF_W, y1: y, x2: ROAD_X - ROAD_HALF_W - 20, y2: y, class: 'stop-post' }))
    const lbl = el('text', { x: ROAD_X - ROAD_HALF_W - 26, y: y + 4, 'text-anchor': 'end', class: 'stop-label' })
    lbl.textContent = STOP_LABELS[i]
    g.appendChild(lbl)
  })
  const cap = el('text', { x: ROAD_X, y: ROAD_TOP - 10, 'text-anchor': 'middle', class: 'street-caption' })
  cap.textContent = 'Linie 42'
  g.appendChild(cap)

  // Bus (lokal um den Schwerpunkt (0,0), Länge entlang der Fahrtrichtung nach
  // oben). updateScene setzt (0,0) auf physToScreen(x); das Kreuz markiert den
  // betrachteten Punkt (Massepunkt-Näherung). Mittleres Fenster entfällt, damit
  // das Kreuz frei steht.
  const bus = DOM.bus
  bus.innerHTML = ''
  bus.appendChild(el('rect', { x: -BUS_WID / 2, y: -BUS_LEN / 2, width: BUS_WID, height: BUS_LEN, rx: 5, class: 'bus-body' }))
  for (const i of [-1, 1])
    bus.appendChild(el('rect', { x: -5, y: i * 14 - 4.5, width: 10, height: 9, class: 'bus-window' }))
  bus.appendChild(el('circle', { cx: BUS_WID / 2, cy: -BUS_LEN / 2 + 8, r: 5, class: 'bus-wheel' }))
  bus.appendChild(el('circle', { cx: BUS_WID / 2, cy: BUS_LEN / 2 - 8, r: 5, class: 'bus-wheel' }))
  // Schwerpunkt-Kreuz (diagonal, ✕): gelber Kern auf dunklem Halo — farblich
  // klar vom roten Buslack abgesetzt
  const d = CROSS_R / Math.SQRT2
  for (const cls of ['cm-cross-halo', 'cm-cross']) {
    bus.appendChild(el('line', { x1: -d, y1: -d, x2: d, y2: d, class: cls }))
    bus.appendChild(el('line', { x1: -d, y1: d, x2: d, y2: -d, class: cls }))
  }
}

// ── Werteachse je Diagrammtyp ──────────────────────────────────────────────────
// Ort: fest 0 … 1500 m in 250er-Schritten (deckt sich mit der Straße).
// Geschwindigkeit: 0 … nach oben, niceStepLE (≥4 Teilstriche).
// Beschleunigung: symmetrisch um 0 (≥5 Ticks: ±s, ±2s, 0), Abszisse bei a = 0.
function valueAxis(type, arr) {
  if (type === 'ort') return { axMin: 0, axMax: X_MAX, step: X_TICK_STEP }
  const vMax = Math.max(...arr.map(Math.abs))
  if (type === 'geschw') {
    const step = niceStepLE(vMax, 4)
    return { axMin: 0, axMax: Math.ceil((vMax * 1.05) / step) * step, step }
  }
  const step = niceStepLE(vMax, 2)
  const axMax = Math.ceil((vMax * 1.05) / step) * step
  return { axMin: -axMax, axMax, step }
}

// ── Diagramm (bei Typwechsel/Toggle neu) ───────────────────────────────────────
export function drawGraph() {
  const type = store.graphType
  const opt = GRAPH_OPTIONS[type]
  const arr = dataOf(type)
  const { t_data } = store
  const tg = store.toggles
  const G = DOM.gridGroup
  G.innerHTML = ''
  DOM.overlayGroup.innerHTML = ''
  DOM.curveGroup.innerHTML = ''

  G.appendChild(el('rect', { x: 0, y: -15, width: GRAPH_W + 15, height: GRAPH_H + 15, class: 'graph-bg' }))

  const { axMin, axMax, step } = valueAxis(type, arr)
  const scX = t => (t / T_MAX) * PLOT_W
  const scY = v => PLOT_BOTTOM - ((v - axMin) / (axMax - axMin)) * (PLOT_BOTTOM - PLOT_TOP)
  const y0 = scY(0)

  // Vertikales Gitter + t-Ticks (Labels immer am unteren Plot-Rand)
  for (let tv = 0; tv <= T_MAX + 1e-9; tv += T_TICK_STEP) {
    const xp = scX(tv)
    if (tv > 0) G.appendChild(el('line', { x1: xp, y1: PLOT_TOP - 10, x2: xp, y2: PLOT_BOTTOM, class: 'grid-line' }))
    const lbl = el('text', { x: xp, y: PLOT_BOTTOM + 16, 'text-anchor': 'middle', class: 'tick-label' })
    lbl.textContent = String(tv)
    G.appendChild(lbl)
  }

  // Horizontales Gitter + Wert-Ticks
  const nY = Math.round((axMax - axMin) / step)
  const dec = step >= 1 ? 0 : step >= 0.1 ? 1 : 2
  for (let i = 0; i <= nY; i++) {
    const v = axMin + i * step
    const yp = scY(v)
    if (Math.abs(v) > 1e-9) G.appendChild(el('line', { x1: 0, y1: yp, x2: PLOT_W, y2: yp, class: 'grid-line' }))
    const lbl = el('text', { x: -6, y: yp + 4, 'text-anchor': 'end', class: 'tick-label' })
    lbl.textContent = fmt(Math.abs(v) < 1e-9 ? 0 : v, dec)
    G.appendChild(lbl)
  }

  // Achsen mit Pfeilspitzen; Abszisse bei Wert 0 (Nulldurchgang bei a(t))
  G.appendChild(el('line', { x1: 0, y1: y0, x2: GRAPH_W - 5, y2: y0, class: 'axis-line', 'marker-end': 'url(#arrow-axis)' }))
  G.appendChild(el('line', { x1: 0, y1: PLOT_BOTTOM, x2: 0, y2: 5, class: 'axis-line', 'marker-end': 'url(#arrow-axis)' }))

  const xl = el('text', { x: PLOT_W / 2, y: PLOT_BOTTOM + 34, 'text-anchor': 'middle', class: 'axis-label' })
  setAxisLabel(xl, 't / s'); G.appendChild(xl)
  const yl = el('text', { x: -48, y: (PLOT_TOP + PLOT_BOTTOM) / 2, transform: `rotate(-90 -48 ${(PLOT_TOP + PLOT_BOTTOM) / 2})`,
                          'text-anchor': 'middle', class: 'axis-label' })
  setAxisLabel(yl, opt.axis); G.appendChild(yl)

  // Haltestellen (nur Ort-Zeit): gestrichelte Horizontale + Hx rechts vom Plot
  if (tg.haltestellen && type === 'ort') {
    STOP_POSITIONS.forEach((xs, i) => {
      const yp = scY(xs)
      DOM.overlayGroup.appendChild(el('line', { x1: 0, y1: yp, x2: PLOT_W, y2: yp, class: 'stop-line' }))
      const lbl = el('text', { x: GRAPH_W + 4, y: yp + 4, class: 'stop-line-label' })
      lbl.textContent = STOP_LABELS[i]
      DOM.overlayGroup.appendChild(lbl)
    })
  }

  // Ereignisse: gepunktete Vertikale an jeder Ankunft/Abfahrt
  if (tg.ereignisse) {
    store.phases.forEach(p => {
      const isEvent = p.kind === 'halt' || p.kind === 'anfahren'
      if (!isEvent || p.tStart <= 0) return
      const xp = scX(p.tStart)
      DOM.overlayGroup.appendChild(el('line', { x1: xp, y1: PLOT_TOP - 10, x2: xp, y2: PLOT_BOTTOM, class: 'event-line' }))
    })
  }

  // Kurve: einfarbig (Linie 42) oder je Bewegungsphase eingefärbt
  const runs = []
  if (tg.phasen) {
    let start = 0
    for (let i = 1; i <= t_data.length; i++) {
      if (i === t_data.length || store.phase_idx[i] !== store.phase_idx[start]) {
        runs.push({ from: start, to: i - 1, cls: `curve phase-${store.phases[store.phase_idx[start]].kind}` })
        start = i
      }
    }
  } else {
    runs.push({ from: 0, to: t_data.length - 1, cls: 'curve' })
  }
  for (const r of runs) {
    let pts = ''
    for (let i = r.from; i <= r.to; i++) pts += `${scX(t_data[i]).toFixed(2)},${scY(arr[i]).toFixed(2)} `
    DOM.curveGroup.appendChild(el('polyline', { points: pts, class: r.cls }))
  }
  // Sprungstellen von a(t) bei Einfärbung: senkrechte Verbinder in neutraler Farbe
  if (tg.phasen && type === 'beschl') {
    for (let i = 1; i < store.phases.length; i++) {
      const p = store.phases[i], q = store.phases[i - 1]
      if (p.a !== q.a) DOM.curveGroup.appendChild(el('line', { x1: scX(p.tStart), y1: scY(q.a), x2: scX(p.tStart), y2: scY(p.a), class: 'curve-jump' }))
    }
  }

  setGraphTitle(DOM.graphTitle, opt.title)

  DOM.graphHitRect.setAttribute('x', 0)
  DOM.graphHitRect.setAttribute('y', PLOT_TOP - 10)
  DOM.graphHitRect.setAttribute('width', PLOT_W)
  DOM.graphHitRect.setAttribute('height', PLOT_BOTTOM - PLOT_TOP + 10)
  store.graphScale = { tMax: T_MAX, gw: PLOT_W, scX, scY, arr, y0, unit: opt.unit }

  if (store.hoverActive) updateGraphHover(store.hoverLocalX)
}

// ── Hover-Werte (I13.1) ────────────────────────────────────────────────────────
// Die Kurve ist stets vollständig gezeichnet (Fahrplan steht fest) — der Cursor
// darf daher über die ganze Fahrt 0 … 400 s laufen.
export function updateGraphHover(localX) {
  store.hoverActive = localX !== null
  store.hoverLocalX = localX
  const gs = store.graphScale
  if (localX === null || !gs || !store.t_data.length) { hideGraphHover(); return }
  const t = Math.max(0, Math.min(gs.tMax, (localX / gs.gw) * gs.tMax))
  const val = interpolateAt(gs.arr, t)
  const xPix = gs.scX(t)

  DOM.hoverLine.setAttribute('x1', xPix); DOM.hoverLine.setAttribute('x2', xPix)
  DOM.hoverLine.setAttribute('y1', PLOT_TOP - 10); DOM.hoverLine.setAttribute('y2', PLOT_BOTTOM)
  DOM.hoverLine.setAttribute('visibility', 'visible')
  DOM.hoverPoint.setAttribute('cx', xPix)
  DOM.hoverPoint.setAttribute('cy', gs.scY(val))
  DOM.hoverPoint.setAttribute('visibility', 'visible')
  renderHoverTooltip(t, val, xPix, gs)
}

function hideGraphHover() {
  DOM.hoverLine.setAttribute('visibility', 'hidden')
  DOM.hoverPoint.setAttribute('visibility', 'hidden')
  DOM.hoverTooltip.setAttribute('visibility', 'hidden')
}

function renderHoverTooltip(t, val, xPix, gs) {
  const sym = { ort: 'x', geschw: 'v', beschl: 'a' }[store.graphType]
  const dec = store.graphType === 'beschl' ? 3 : store.graphType === 'geschw' ? 2 : 1
  const textEl = DOM.hoverTooltipText
  textEl.innerHTML = ''
  ;[[ 't', ` = ${fmt(t, 1)} s` ], [ sym, ` = ${fmt(val, dec)} ${gs.unit}` ]].forEach(([s, rest], i) => {
    const line = el('tspan', { x: 8, y: 16 + i * 15 })
    const it = el('tspan', { 'font-style': 'italic' })
    it.textContent = s
    line.appendChild(it)
    line.appendChild(document.createTextNode(rest))
    textEl.appendChild(line)
  })
  const bbox = textEl.getBBox()
  const boxW = bbox.width + 16, boxH = bbox.height + 12
  DOM.hoverTooltipBg.setAttribute('width', boxW)
  DOM.hoverTooltipBg.setAttribute('height', boxH)
  const tx = Math.max(0, Math.min(gs.gw - boxW, xPix + 12))
  DOM.hoverTooltip.setAttribute('transform', `translate(${tx}, ${PLOT_TOP})`)
  DOM.hoverTooltip.setAttribute('visibility', 'visible')
}

// ── Animierte Elemente (jeder Frame): nur interpolieren ────────────────────────
const PHASE_TEXT = { halt: 'Halt', anfahren: 'Anfahren', konstant: 'Gleichförmige Fahrt', bremsen: 'Bremsen' }

export function updateScene(t) {
  const tc = Math.min(Math.max(t, 0), T_MAX)
  const x = interpolateAt(store.x_data, tc)
  const v = interpolateAt(store.v_data, tc)
  const a = interpolateAt(store.a_data, tc)
  const ph = phaseInfoAt(tc)

  // Bus: Schwerpunkt auf physToScreen(x)
  DOM.bus.setAttribute('transform', `translate(${ROAD_X}, ${physToScreen(x).toFixed(2)})`)

  // Diagramm-Marker + Ableselinien
  const gs = store.graphScale
  DOM.dropGroup.innerHTML = ''
  if (gs) {
    const px = gs.scX(tc), py = gs.scY(interpolateAt(gs.arr, tc))
    if (store.toggles.ableselinien) {
      DOM.dropGroup.appendChild(el('line', { x1: px, y1: py, x2: px, y2: gs.y0, class: 'drop-line' }))
      DOM.dropGroup.appendChild(el('line', { x1: px, y1: py, x2: 0, y2: py, class: 'drop-line' }))
      DOM.dropGroup.appendChild(el('circle', { cx: px, cy: gs.y0, r: 3, class: 'drop-mark' }))
      DOM.dropGroup.appendChild(el('circle', { cx: 0, cy: py, r: 3, class: 'drop-mark' }))
    }
    DOM.graphPoint.setAttribute('cx', px)
    DOM.graphPoint.setAttribute('cy', py)
    DOM.graphPoint.setAttribute('visibility', 'visible')
  }

  // Regler + Live-Panel
  DOM.tSlider.value = String(tc)
  DOM.tValue.textContent = `${fmt(tc, 1)} s`
  DOM.timeLabel.innerHTML = `<i>t</i> = ${fmt(tc, 1)} s`
  DOM.liveT.textContent = `${fmt(tc, 1)} s`
  DOM.liveX.textContent = `${fmt(x, 1)} m`
  DOM.liveV.textContent = `${fmt(v, 2)} m/s`
  DOM.liveA.textContent = `${fmt(a, 3)} m/s²`
  DOM.livePhase.textContent = PHASE_TEXT[ph.kind]
  DOM.liveStop.textContent = ph.stop ?? 'unterwegs'
}
