'use strict'

/**
 * @module lineal/render
 * SVG-Rendering: Szene (Lineal, Vektoren, Winkelbogen) und Diagramm (Achsen,
 * Gitter, Kurven, Hover). Zeichnet nur — Physik kommt aus `physics.js`
 * (precompute-Arrays), Interpolation über interpolateAt().
 */

import { G, ACC_REF_LEN, PPM, PIVOT_X, PIVOT_Y, RULER_RX, HOLE_R,
         PIXELS_PER_VEL, GRAV_VEC_LEN, VEC_MARKER_LEN,
         GRAPH_W, GRAPH_H, GRAPH_OPTIONS, GRAPH_TITLES, ENERGY_COLORS, ENERGY_LABELS,
         FORCE_COLORS, FORCE_LABELS, SERIES_SYM } from './constants.js'
import { store, DOM } from './state.js'
import { interpolateAt, interpolatePeriodic, activePeriod } from './physics.js'
import { fmt } from '../../shared/js/format.js'
import { setAxisLabel, setGraphTitle } from '../../shared/js/svg-text.js'
import { tAxisStep, niceStepLE } from '../../shared/js/ticks.js'
import { shortenEnd } from '../../shared/js/vectors.js'

const NS = 'http://www.w3.org/2000/svg'
const el = (tag, attrs) => {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  return e
}
const DEG = 180 / Math.PI
const PX_PER_CM = PPM / 100     // px pro cm (PPM ist px pro Meter)
const ARC_R = 36                // px — Radius des Winkelbogens am Drehpunkt

// Rohwert (rad / J / N) → Plot-Wert (° / rad/s / rad/s² / µJ / mN). Eine
// Quelle der Wahrheit: drawGraph, updateScene und updateGraphHover wenden
// dieselbe Transformation an.
const TO_PLOT = {
  phi:   v => v * DEG,
  omega: v => v,
  alpha: v => v,
  ekin:  v => v * 1e6,
  epot:  v => v * 1e6,
  eges:  v => v * 1e6,
  fgrav: v => v * 1e3,
  fnorm: v => v * 1e3,
  fges:  v => v * 1e3,
  fsusp: v => v * 1e3,
}
const RAW_ARR = {
  phi: () => store.phi_data, omega: () => store.omega_data, alpha: () => store.alpha_data,
  ekin: () => store.ekin_data, epot: () => store.epot_data, eges: () => store.eges_data,
  fgrav: () => store.fgrav_data, fnorm: () => store.fnorm_data,
  fges: () => store.fges_data, fsusp: () => store.fsusp_data,
}

// Wert zur ABSOLUTEN Zeit t: im Kontinuierlich-Modus periodisch fortgesetzt
// (über t_end hinaus), sonst am Fensterende geklemmt.
const sampleAt = (arr, t) =>
  store.timeMode === 'continuous' ? interpolatePeriodic(arr, t) : interpolateAt(arr, t)

// Formelzeichen als tspans anhängen: Symbol kursiv, Index tiefgestellt und
// aufrecht, optional Betragsstriche (FB-8-Typografie; ersetzt „F_G"-Klartext, B44).
function appendSym(parent, key) {
  const d = SERIES_SYM[key]
  if (d.abs) parent.appendChild(document.createTextNode('|'))
  const sym = el('tspan', { 'font-style': 'italic' })
  sym.textContent = d.s
  parent.appendChild(sym)
  if (d.sub) {
    const sub = el('tspan', { 'baseline-shift': 'sub', 'font-size': '75%' })
    sub.textContent = d.sub
    parent.appendChild(sub)
  }
  if (d.abs) {
    // Nach dem Index die Grundlinie zurücksetzen (baseline-shift wirkt nur im tspan)
    parent.appendChild(document.createTextNode('|'))
  }
}

// Stride-Downsampling: bei kleinem Δt (bis 20 000 Punkte) mehr als ein Punkt pro
// Bildschirm-Pixel ist optisch redundant. Die Endpunkte bleiben immer erhalten.
const _dsCache = { maxPts: 0, stride: 1, keep: null }
function downsampleIndices(n, maxPts) {
  if (_dsCache.maxPts === maxPts && _dsCache.keep && _dsCache.keep.length === n) return _dsCache.keep
  const stride = n > maxPts ? Math.ceil(n / maxPts) : 1
  const keep = []
  for (let i = 0; i < n; i += stride) keep.push(i)
  if (keep[keep.length - 1] !== n - 1) keep.push(n - 1)
  _dsCache.maxPts = maxPts; _dsCache.stride = stride; _dsCache.keep = keep
  return keep
}

// ── Statische Szene + Lineal (je Reset neu, da l/b/a veränderbar) ──────────────
export function drawBackground() {
  const lPx = store.l_cm * PX_PER_CM
  const bPx = store.b_cm * PX_PER_CM
  const aPx = store.a_cm * PX_PER_CM
  const sPx = store.s * PPM
  const bottomPx = (store.l_cm / 100 - store.a_cm / 100) * PPM   // Linealunterkante unter Pivot

  // Statischer Hintergrund: Ruhelage (strichliert), Halterung, Achse
  DOM.sceneStatic.innerHTML = ''
  DOM.sceneStatic.appendChild(el('line', {
    x1: PIVOT_X, y1: PIVOT_Y, x2: PIVOT_X, y2: PIVOT_Y + bottomPx,
    class: 'rest-line',
  }))
  // Decken-Halterung
  DOM.sceneStatic.appendChild(el('rect', {
    x: PIVOT_X - 34, y: PIVOT_Y - 16, width: 68, height: 10, class: 'pivot-mount',
  }))
  for (let i = -3; i <= 3; i++) {
    DOM.sceneStatic.appendChild(el('line', {
      x1: PIVOT_X + i * 10, y1: PIVOT_Y - 16, x2: PIVOT_X + i * 10 + 8, y2: PIVOT_Y - 24,
      class: 'pivot-hatch',
    }))
  }
  // Achse (Loch)
  DOM.sceneStatic.appendChild(el('circle', { cx: PIVOT_X, cy: PIVOT_Y, r: HOLE_R, class: 'pivot-dot' }))

  // Lineal (lokale Koordinaten: Ursprung am Drehpunkt, Längsachse = +y)
  DOM.rulerGroup.innerHTML = ''
  DOM.rulerGroup.appendChild(el('rect', {
    x: -bPx / 2, y: -aPx, width: bPx, height: lPx, rx: RULER_RX, class: 'ruler-body',
  }))
  // cm-Teilstriche entlang des Lineals
  const nTicks = Math.round(store.l_cm)
  for (let cm = 0; cm <= nTicks; cm++) {
    const y = -aPx + cm * PX_PER_CM
    if (y < -aPx - 0.5 || y > -aPx + lPx + 0.5) continue
    const major = cm % 5 === 0
    DOM.rulerGroup.appendChild(el('line', {
      x1: -bPx / 2, y1: y, x2: -bPx / 2 + (major ? 9 : 5), y2: y,
      class: 'ruler-tick', 'stroke-width': major ? 1.4 : 0.8,
    }))
  }
  // Loch im Lineal (Ring am Drehpunkt)
  DOM.rulerGroup.appendChild(el('circle', { cx: 0, cy: 0, r: HOLE_R, class: 'ruler-hole' }))
  // Massenschwerpunkt
  DOM.rulerGroup.appendChild(el('circle', { cx: 0, cy: sPx, r: 4.5, class: 'cm-dot' }))
}

// ── Diagramm: Achsen, Gitter, VOLLE Kurven (einmal je Reset) ───────────────────
export function drawGraph() {
  const opt = GRAPH_OPTIONS[store.graphType]
  const multi = opt.keys.length > 1
  // Farblegende je Diagrammtyp (Energie: ENERGY_*, Kräfte: FORCE_*, sonst Accent)
  const COLOR_MAP = store.graphType === 'forces' ? FORCE_COLORS
    : store.graphType === 'energy' ? ENERGY_COLORS : null
  const LABEL_MAP = store.graphType === 'forces' ? FORCE_LABELS
    : store.graphType === 'energy' ? ENERGY_LABELS : null
  const series = opt.keys.map(k => ({
    key: k,
    arr: RAW_ARR[k](),
    color: multi ? COLOR_MAP[k] : '--accent',
    toPlot: TO_PLOT[k],
    label: multi ? LABEL_MAP[k] : '',
  }))

  // Referenzkurve: persistenter Snapshot (store.prevGraph).
  //  • Beim ersten Aktivieren des Toggles wird die aktuelle Kurve als Referenz
  //    gespeichert (einmalig).
  //  • Bei jeder Folge-Zeichnung (z. B. nach einer Parameteränderung → resetSim)
  //    bleibt derselbe Snapshot bestehen und wird nur mit der AKTUELLEN Skala
  //    (scX/scY, erweiterte Achsen) neu gezeichnet → sie skaliert mit, verschwindet
  //    aber NIE, solange der Toggle aktiv ist. Parameter-Änderungen löschen sie also
  //    nicht; sie werden lediglich mit der neuen Achsenskalierung überlagert.
  //  • Ein Diagrammtyp-Wechsel löscht den Snapshot ebenfalls NICHT — er wird dann
  //    einfach nicht gezeichnet (andere Einheiten/Kurven), und beim Zurückwechseln
  //    taucht er wieder auf. Nur das Deaktivieren des Toggles (ui.js) wirft ihn weg.
  let prev = null
  if (store.prevShown) {
    if (store.prevGraph && store.prevGraph.graphType === store.graphType) {
      prev = store.prevGraph
    } else if (!store.prevGraph) {
      store.prevGraph = {
        graphType: store.graphType,
        tMax: store.t_end,
        t: store.t_data.slice(),
        series: series.map(s => ({ key: s.key, arr: s.arr.slice(), toPlot: s.toPlot, color: s.color })),
      }
      prev = store.prevGraph
    }
  }
  const axisSeries = prev
    ? series.concat(prev.series.map(p => ({ key: p.key, arr: p.arr, toPlot: p.toPlot })))
    : series

  DOM.gridGroup.innerHTML = ''
  DOM.gridGroup.appendChild(el('rect',
    { x: 0, y: -15, width: GRAPH_W + 15, height: GRAPH_H + 15, class: 'graph-bg' }))

  // Zeitfenster: aktueller Precompute-Horizont, ggf. erweitert um die Referenzkurve.
  // Kontinuierlich-Modus: das Diagramm blättert seitenweise — Seite k zeigt die
  // absolute Zeit [k·t_end, (k+1)·t_end]; tOff ist der Versatz der Seite.
  const tMax = Math.max(prev ? prev.tMax : 0, store.t_end, 0.5)
  const tOff = store.timeMode === 'continuous' ? store.graphPage * store.t_end : 0
  const gw = GRAPH_W - 20
  const scX = t => (t / tMax) * gw

  // Ordinaten-Bereich über AKTUELLE + REFERENZ-Serien (ein Nice-Step für Bereich
  // UND Ticks — keine Divergenz; die Referenz wird damit nie abgeschnitten)
  const plotTop = 10, plotBottom = GRAPH_H - 10
  const plotH = plotBottom - plotTop
  let axMin, axMax, vStep
  if (opt.symmetric) {
    let maxAbs = 1
    for (const s of axisSeries) for (const v of s.arr) maxAbs = Math.max(maxAbs, Math.abs(s.toPlot(v)))
    maxAbs *= 1.1
    vStep = niceStepLE(2 * maxAbs, 4)
    const nSteps = Math.max(2, Math.ceil(maxAbs / vStep))
    axMin = -nSteps * vStep
    axMax = nSteps * vStep
  } else {
    let maxVal = 1
    for (const s of axisSeries) for (const v of s.arr) maxVal = Math.max(maxVal, s.toPlot(v))
    // Mehrserien-Diagramme: zusätzlicher Kopfraum für die Legende oben rechts
    maxVal *= COLOR_MAP ? 1.35 : 1.1
    vStep = niceStepLE(maxVal, 4)
    axMax = Math.ceil(maxVal / vStep) * vStep
    axMin = 0
  }
  const axRng = axMax - axMin || 1
  const scY = v => plotBottom - ((v - axMin) / axRng) * plotH
  const x0 = scX(0), y0 = scY(0)

  // Vertikale Gitterlinien + Zeit-Ticks (≥4 Ticks inkl. 0; Labels am unteren Rand)
  const tStep = tAxisStep(tMax)
  const tDec = tStep >= 1 ? 1 : tStep >= 0.1 ? 2 : 3
  // Ticks in ABSOLUTER Zeit (Seitenversatz tOff): erster Tick = erstes Vielfaches
  // von tStep ≥ tOff, Position relativ zum Seitenanfang.
  const tFirst = Math.ceil(tOff / tStep - 1e-9) * tStep
  // Folgeseiten: Seitenanfang zusätzlich beschriften (liegt i. d. R. nicht auf
  // einem runden Tick), sofern er dem ersten Tick nicht zu nahe kommt.
  if (tOff > 0 && tFirst - tOff > 0.4 * tStep) {
    const tv = el('text', { x: scX(0), y: plotBottom + 16, 'text-anchor': 'middle', class: 'tick-label' })
    tv.textContent = fmt(tOff, tDec)
    DOM.gridGroup.appendChild(tv)
  }
  for (let ta = tFirst; ta <= tOff + tMax + tStep * 0.01; ta = Math.round((ta + tStep) * 1e6) / 1e6) {
    const xp = scX(Math.min(ta - tOff, tMax))
    if (Math.abs(xp - x0) > 2)
      DOM.gridGroup.appendChild(el('line', { x1: xp, y1: plotTop, x2: xp, y2: plotBottom, class: 'grid-line' }))
    const tv = el('text', { x: xp, y: plotBottom + 16, 'text-anchor': 'middle', class: 'tick-label' })
    tv.textContent = fmt(ta, tDec)
    DOM.gridGroup.appendChild(tv)
  }

  // Horizontale Gitterlinien + Wert-Ticks (mit demselben vStep wie der Bereich)
  const vDec = vStep % 1 === 0 ? 0 : vStep >= 1 ? 1 : vStep >= 0.1 ? 2 : 3
  const nV = Math.round((axMax - axMin) / vStep)
  for (let i = 0; i <= nV; i++) {
    const v = axMin + i * vStep, yp = scY(v)
    if (Math.abs(yp - y0) > 2 || Math.abs(v) > 1e-6)
      DOM.gridGroup.appendChild(el('line', { x1: x0, y1: yp, x2: GRAPH_W, y2: yp, class: 'grid-line' }))
    const tv = el('text', { x: x0 - 6, y: yp + 4, 'text-anchor': 'end', class: 'tick-label' })
    tv.textContent = fmt(v, vDec)
    DOM.gridGroup.appendChild(tv)
  }

  // Achsenlinien mit Pfeilspitzen (Zeitachse an y0 = Wert 0)
  DOM.gridGroup.appendChild(el('line', { x1: x0, y1: y0, x2: GRAPH_W - 5, y2: y0, class: 'axis-line', 'stroke-width': 2, 'marker-end': 'url(#arrow-axis)' }))
  DOM.gridGroup.appendChild(el('line', { x1: x0, y1: plotBottom, x2: x0, y2: plotTop, class: 'axis-line', 'stroke-width': 2, 'marker-end': 'url(#arrow-axis)' }))

  // Achsenbeschriftung (Größe kursiv, Einheit aufrecht)
  const xl = el('text', { x: gw / 2, y: plotBottom + 34, 'text-anchor': 'middle', class: 'axis-label' })
  setAxisLabel(xl, 't / s'); DOM.gridGroup.appendChild(xl)
  const yl = el('text', { x: x0 - 44, y: GRAPH_H / 2, transform: `rotate(-90 ${x0 - 44} ${GRAPH_H / 2})`, 'text-anchor': 'middle', class: 'axis-label' })
  setAxisLabel(yl, opt.yLabel); DOM.gridGroup.appendChild(yl)

  // Datenkurven (eine Polyline je Serie; stride-gedownsamplet — s. downsampleIndices).
  // Progressive Wiedergabe (analog z. B. Schräger Wurf / Kreisbewegung): die Punkte
  // werden hier nur erzeugt, updateScene() füllt die Polyline bis zur aktuellen Zeit.
  DOM.graphLines.innerHTML = ''
  const tN = store.t_data.length
  const keep = downsampleIndices(tN, gw)
  for (const s of series) {
    DOM.graphLines.appendChild(el('polyline', {
      fill: 'none', 'stroke-width': 2, points: '',
      class: 'graph-line', style: `stroke: var(${s.color})`,
    }))
  }

  // Referenzkurve (persistent): mit der AKTUELLEN Skala (scX/scY) gezeichnet,
  // gestrichelt in Neutralton — dadurch skaliert sie mit dem neuen Diagramm,
  // verschwindet aber nie, solange der Toggle aktiv ist.
  DOM.graphPrevLines.innerHTML = ''
  if (prev) {
    const pKeep = downsampleIndices(prev.t.length, gw)
    for (const p of prev.series) {
      let pts = ''
      for (const idx of pKeep) pts += `${scX(prev.t[idx])},${scY(p.toPlot(p.arr[idx]))} `
      DOM.graphPrevLines.appendChild(el('polyline', {
        fill: 'none', 'stroke-width': 1.6, points: pts,
        class: 'graph-prev-line',
      }))
    }
  }

  // Wiedergabe-Marker (eine Circle je Serie)
  DOM.graphMarkers.innerHTML = ''
  for (const s of series) {
    DOM.graphMarkers.appendChild(el('circle', {
      r: 5, class: 'graph-marker', style: `fill: var(${s.color})`,
      cx: scX(0), cy: scY(s.toPlot(sampleAt(s.arr, tOff))),
    }))
  }

  // Titel (letztes Daten-Kind vor Hover-Overlay + Hit-Rect)
  setGraphTitle(DOM.graphTitle, GRAPH_TITLES[store.graphType])
  // Legende für Mehrserien-Diagramme (Energie / Kraftbeträge), oben rechts im
  // Plot. Breite wird gemessen (getComputedTextLength), damit auch das längste
  // Label innerhalb der Plotfläche bleibt; Hintergrund hält sie über den Kurven
  // lesbar (B44).
  if (COLOR_MAP) {
    const legendGroup = el('g', { id: 'series_legend' })
    DOM.gridGroup.appendChild(legendGroup)
    const bg = el('rect', { x: -6, y: -5, rx: 4, class: 'graph-legend-bg' })
    legendGroup.appendChild(bg)
    let maxW = 0
    series.forEach((s, i) => {
      const y = i * 18
      legendGroup.appendChild(el('rect', { x: 0, y, width: 12, height: 12, rx: 2, fill: `var(${s.color})` }))
      const txt = el('text', { x: 18, y: y + 10, 'text-anchor': 'start', class: 'graph-legend-text' })
      txt.appendChild(document.createTextNode(`${s.label} `))
      appendSym(txt, s.key)
      legendGroup.appendChild(txt)
      maxW = Math.max(maxW, txt.getComputedTextLength())
    })
    const boxW = 18 + maxW + 12, boxH = series.length * 18 + 4
    bg.setAttribute('width', boxW)
    bg.setAttribute('height', boxH)
    legendGroup.setAttribute('transform', `translate(${gw - boxW + 6} ${plotTop + 6})`)
  }

  // Hover-Ring-Punkte (eine je Serie)
  DOM.hoverPoints.innerHTML = ''
  for (const s of series) {
    DOM.hoverPoints.appendChild(el('circle', {
      r: 6, class: 'graph-hover-point', style: `stroke: var(${s.color})`,
      visibility: 'hidden',
    }))
  }

  // Hit-Rect (pointer-aktiv, fill:none) — Geometrie aus denselben Lokalen wie scX/scY
  DOM.graphHitRect.setAttribute('x', 0)
  DOM.graphHitRect.setAttribute('y', plotTop)
  DOM.graphHitRect.setAttribute('width', gw)
  DOM.graphHitRect.setAttribute('height', plotH)
  store.graphScale = { tMax, tOff, gw, scX, scY, series, symmetric: opt.symmetric, keep }

  if (store.hoverActive) updateGraphHover(store.hoverLocalX)
}

// ── Hover-Werte (I13.1, §4): Cursor + mehrreihiger Tooltip je Serie ───────────
export function updateGraphHover(localX) {
  store.hoverActive = localX !== null
  store.hoverLocalX = localX
  const gs = store.graphScale
  if (localX === null || !gs || !store.t_data.length) { hideGraphHover(); return }
  const xClamped = Math.max(0, Math.min(gs.gw, localX))
  const rawT = (xClamped / gs.gw) * gs.tMax
  // Lokale Seitenzeit, geklammert auf den bereits gezeichneten Kurvenabschnitt
  const t = Math.max(0, Math.min(rawT, gs.tMax, store.simulatedTime - gs.tOff))
  drawHoverAtT(gs, t)
}

function drawHoverAtT(gs, t) {
  const xPix = gs.scX(t)
  DOM.hoverLine.setAttribute('x1', xPix); DOM.hoverLine.setAttribute('x2', xPix)
  DOM.hoverLine.setAttribute('y1', 10); DOM.hoverLine.setAttribute('y2', GRAPH_H - 10)
  DOM.hoverLine.setAttribute('visibility', 'visible')

  gs.series.forEach((s, i) => {
    const v = s.toPlot(sampleAt(s.arr, gs.tOff + t))
    const ring = DOM.hoverPoints.children[i]
    ring.setAttribute('cx', xPix)
    ring.setAttribute('cy', gs.scY(v))
    ring.setAttribute('visibility', 'visible')
  })
  renderHoverTooltip(gs, t, xPix)
}

function hideGraphHover() {
  DOM.hoverLine.setAttribute('visibility', 'hidden')
  for (const c of DOM.hoverPoints.children) c.setAttribute('visibility', 'hidden')
  DOM.hoverTooltip.setAttribute('visibility', 'hidden')
}

// Tooltip-Zeilen: „t = … s" plus je Serie „Symbol = Wert Einheit" (SERIES_SYM).
function renderHoverTooltip(gs, t, xPix) {
  const opt = GRAPH_OPTIONS[store.graphType]
  const textEl = DOM.hoverTooltipText
  textEl.innerHTML = ''
  const lineH = 15
  // Jede Zeile ist ein eigenes <text>-Kind-tspan-Paket: ein Zeilen-tspan mit
  // fester x/y trägt die Symbol-tspans (Index per baseline-shift) + Wert.
  const rows = [{ key: null, rest: ` = ${fmt(gs.tOff + t, 2)} s` }]
  for (const s of gs.series) {
    const v = s.toPlot(sampleAt(s.arr, gs.tOff + t))
    rows.push({ key: s.key, rest: ` = ${fmt(v, 3)} ${opt.unit}` })
  }
  rows.forEach((row, i) => {
    const tsp = el('tspan', { x: 8, y: 16 + i * lineH })
    if (row.key) appendSym(tsp, row.key)
    else {
      const sym = el('tspan', { 'font-style': 'italic' })
      sym.textContent = 't'
      tsp.appendChild(sym)
    }
    tsp.appendChild(document.createTextNode(row.rest))
    textEl.appendChild(tsp)
  })
  const bbox = textEl.getBBox()
  const boxW = bbox.width + 16, boxH = bbox.height + 12
  DOM.hoverTooltipBg.setAttribute('width', boxW)
  DOM.hoverTooltipBg.setAttribute('height', boxH)
  DOM.hoverTooltipBg.setAttribute('x', 0)
  DOM.hoverTooltipBg.setAttribute('y', 0)
  const tx = Math.max(0, Math.min(gs.gw - boxW, xPix + 12))
  DOM.hoverTooltip.setAttribute('transform', `translate(${tx}, 10)`)
  DOM.hoverTooltip.setAttribute('visibility', 'visible')
  DOM.hoverTooltip.setAttribute('role', 'tooltip')
  DOM.hoverTooltip.setAttribute('aria-live', 'polite')
}

// ── shortenEnd + null-Guard (kanonische Pfeilspitzen-Geometrie, B23) ───────────
function drawVec(lineEl, x1, y1, x2, y2, on) {
  if (!on) { lineEl.style.visibility = 'hidden'; return }
  const end = shortenEnd(x1, y1, x2, y2, VEC_MARKER_LEN)
  if (!end) { lineEl.style.visibility = 'hidden'; return }
  lineEl.setAttribute('x1', x1); lineEl.setAttribute('y1', y1)
  lineEl.setAttribute('x2', end.x2); lineEl.setAttribute('y2', end.y2)
  lineEl.style.visibility = 'visible'
}

// ── Animierte Elemente (jeder Frame): NUR indizieren/interpolieren, nie rechnen ─
export function updateScene(t) {
  // Auto-Stopp: am Fensterende geklemmt. Kontinuierlich: echte Zeit, Werte
  // periodisch fortgesetzt (sampleAt → interpolatePeriodic) — kein Einfrieren
  // am Precompute-Fensterende.
  const cont = store.timeMode === 'continuous'
  const tc = cont ? Math.max(0, t) : Math.min(t, store.t_end)
  const phi = sampleAt(store.phi_data, tc)
  const om = sampleAt(store.omega_data, tc)
  const al = sampleAt(store.alpha_data, tc)
  const phiDeg = phi * DEG

  // Lineal um den Drehpunkt drehen (positiv φ → schwingt nach rechts;
  // SVG rotate(+)=uhrzeigersinn, daher −φ, sodaß +φ optisch gegen den UZS liegt)
  DOM.rulerGroup.setAttribute('transform',
    `translate(${PIVOT_X} ${PIVOT_Y}) rotate(${-phiDeg})`)

  // Schwerpunkt in Weltkoordinaten
  const sPx = store.s * PPM
  const cmx = PIVOT_X + sPx * Math.sin(phi)
  const cmy = PIVOT_Y + sPx * Math.cos(phi)

  // ── Vektoren (alle × store.vecScale) ────────────────────────────────────────
  // Kraftskala: |F_G| = m·g ↔ GRAV_VEC_LEN px (vecScale = 1); Längskraft F_N
  // auf m·g bezogen. a und F_ges = m·a sind auf die Fenster-Maximalbeschleunigung
  // store.aMax bezogen (|a| = aMax ↔ ACC_REF_LEN px): die Pendel-Beschleunigung
  // ist klein (≈ 0,2 g), bei g-Bezug wäre der Vektor kürzer als die Pfeilspitze.
  // Bildkoordinaten: y nach unten. r̂ = (sin φ, cos φ) (Achse→SP), t̂ = (cos φ, −sin φ).
  const vs = store.vecScale
  const ref = GRAV_VEC_LEN * vs               // px für |F| = m·g
  const aRef = store.aMax > 1e-9 ? store.aMax : 1e-9
  const kA = ACC_REF_LEN * vs / aRef          // px pro (m/s²)
  const aRad  = om * om * store.s             // Zentripetal-Betrag (m/s²), nach −r̂
  const aTang = al * store.s                  // Tangentialbetrag (m/s²), entlang t̂
  // Beschleunigungsvervektor: a = aRad·(−r̂) + aTang·t̂
  const ax = -aRad * Math.sin(phi) + aTang * Math.cos(phi)
  const ay = -aRad * Math.cos(phi) - aTang * Math.sin(phi)

  // Schwerkraft am Schwerpunkt (immer senkrecht nach unten)
  drawVec(DOM.gravVector, cmx, cmy, cmx, cmy + ref, DOM.togGrav.checked && store.stable)

  // Bahngeschwindigkeit des Schwerpunkts (tangential, v = ω·s·t̂)
  const v = om * store.s                      // m/s
  if (DOM.togVel.checked && store.stable) {
    drawVec(DOM.velVector, cmx, cmy,
      cmx + v * Math.cos(phi) * PIXELS_PER_VEL * vs, cmy - v * Math.sin(phi) * PIXELS_PER_VEL * vs, true)
  } else {
    drawVec(DOM.velVector, 0, 0, 0, 0, false)
  }

  // Längskraft am Schwerpunkt (Achsenkraft auf das Lineal): F_N = m·(s·ω² + g·cos φ)
  // in Richtung der Achse (−r̂); zeigt nach oben, wenn das Lineal an der Achse „zieht".
  if (DOM.togNorm.checked && store.stable) {
    const fnRef = (aRad / G + Math.cos(phi))   // Betrag relativ zu m·g
    drawVec(DOM.normVector, cmx, cmy,
      cmx - fnRef * ref * Math.sin(phi), cmy - fnRef * ref * Math.cos(phi), true)
  } else {
    drawVec(DOM.normVector, 0, 0, 0, 0, false)
  }

  // Resultierende Kraft am Schwerpunkt: F_ges = m·a
  if (DOM.togGes.checked && store.stable) {
    drawVec(DOM.gesVector, cmx, cmy, cmx + ax * kA, cmy + ay * kA, true)
  } else {
    drawVec(DOM.gesVector, 0, 0, 0, 0, false)
  }

  // Beschleunigungsvervektor am Schwerpunkt (richtungsgleich zu F_ges)
  if (DOM.togAcc.checked && store.stable) {
    drawVec(DOM.accVector, cmx, cmy, cmx + ax * kA, cmy + ay * kA, true)
  } else {
    drawVec(DOM.accVector, 0, 0, 0, 0, false)
  }

  // Kraft auf die Aufhängung am Drehpunkt (Newton 3, Reaktion der Achsenkraft):
  // F_Aufh = −(m·a − m·g) = m·(−a_x, g − a_y); wirkt also in das Bild nach unten.
  if (DOM.togSusp.checked && store.stable) {
    drawVec(DOM.suspVector, PIVOT_X, PIVOT_Y,
      PIVOT_X + (-ax / G) * ref, PIVOT_Y + ((G - ay) / G) * ref, true)
  } else {
    drawVec(DOM.suspVector, 0, 0, 0, 0, false)
  }

  // Winkelbogen φ am Drehpunkt (Ruhelage → aktuelle Auslenkung)
  if (store.stable && Math.abs(phi) > 0.01) {
    const ex = PIVOT_X + ARC_R * Math.sin(phi)
    const ey = PIVOT_Y + ARC_R * Math.cos(phi)
    const sweep = phi >= 0 ? 0 : 1
    DOM.angleArc.setAttribute('d',
      `M ${PIVOT_X} ${PIVOT_Y + ARC_R} A ${ARC_R} ${ARC_R} 0 0 ${sweep} ${ex} ${ey}`)
    DOM.angleArc.style.visibility = 'visible'
    const ml = phi / 2
    DOM.angleLabel.setAttribute('x', PIVOT_X + (ARC_R + 14) * Math.sin(ml))
    DOM.angleLabel.setAttribute('y', PIVOT_Y + (ARC_R + 14) * Math.cos(ml) + 4)
    DOM.angleLabel.setAttribute('text-anchor', 'middle')
    DOM.angleLabel.textContent = `${fmt(phiDeg, 0)}°`
    DOM.angleLabel.style.visibility = 'visible'
  } else {
    DOM.angleArc.style.visibility = 'hidden'
    DOM.angleLabel.style.visibility = 'hidden'
  }

  // Diagramm: Kurven progressiv bis zur aktuellen Zeit aufbauen (analog andere
  // Sims) — Wiedergabe-Marker markiert das aktuelle Kurvenende.
  // Kontinuierlich: ist die aktuelle Diagrammseite voll, auf die nächste Seite
  // blättern (drawGraph zeichnet Achsen mit dem neuen Zeitversatz neu).
  if (cont && store.t_end > 0) {
    const page = Math.floor(tc / store.t_end)
    if (page !== store.graphPage) { store.graphPage = page; drawGraph() }
  }
  if (store.graphScale) {
    const gs = store.graphScale
    const tLoc = tc - gs.tOff            // Zeit relativ zum Seitenanfang
    gs.series.forEach((s, i) => {
      let pts = ''
      for (const idx of gs.keep) {
        const tl = store.t_data[idx]
        if (tl > tLoc) break
        // Seite 0: Rohwert direkt; Folgeseiten: periodisch fortgesetzt
        const raw = gs.tOff ? sampleAt(s.arr, gs.tOff + tl) : s.arr[idx]
        pts += `${gs.scX(tl)},${gs.scY(s.toPlot(raw))} `
      }
      const v = s.toPlot(sampleAt(s.arr, tc))
      pts += `${gs.scX(tLoc)},${gs.scY(v)} `
      DOM.graphLines.children[i].setAttribute('points', pts)
      const m = DOM.graphMarkers.children[i]
      m.setAttribute('cx', gs.scX(tLoc))
      m.setAttribute('cy', gs.scY(v))
    })
  }

  // Live-Panel
  DOM.timeLabel.innerHTML = `<i>t</i> = ${fmt(tc)} s`
  DOM.liveT.textContent = `${fmt(tc)} s`
  DOM.livePhi.textContent = `${fmt(phiDeg, 1)} °`
  DOM.liveOmega.textContent = `${fmt(om, 2)} rad/s`
  DOM.liveAlpha.textContent = `${fmt(al, 2)} rad/s²`
  const T = activePeriod()
  DOM.liveTperiod.textContent = Number.isFinite(T) ? `${fmt(T, 3)} s` : '— instabil'
  DOM.liveS.textContent = `${fmt(store.s * 100, 2)} cm`
}