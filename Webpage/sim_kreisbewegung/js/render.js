'use strict'

import {
  ANIM_W, ANIM_CX,
  ANIM_H_STACK, ANIM_CY_STACK, ANIM_H_SPLIT, ANIM_CY_SPLIT,
  DEFAULT_PIXELS_PER_METER, PIXELS_PER_VELOCITY_UNIT, PIXELS_PER_ACCELERATION_UNIT,
  POINT_RADIUS,
  GRAPH_W_STACK, GRAPH_H_STACK, GRAPH_W_SPLIT, GRAPH_H_SPLIT,
  GRAPH_H_STACKED_SPLIT, GRAPH_STACKED_GAP,
  WATCH_CX, WATCH_CY, WATCH_R, SDIAL_CX, SDIAL_CY, SDIAL_R,
  SEG_THICK, SEG_LEN, DIGIT_SPACING, COLON_WIDTH, LCD_FRAME_PADDING,
  DIGIT_WIDTH, DIGIT_HEIGHT, COLON_DOT_SIZE,
  DIGITAL_FRAME_X, DIGITAL_FRAME_Y, DIGITAL_FRAME_W, DIGITAL_FRAME_H,
  DIGIT_SEGMENTS_MAP,
  graphTitles, graphAxisLabels, graphXAxisLabels,
  SHADOW_R_MAX, SHADOW_GAP, SCREEN_THICK, LAMP_DEPTH, BEAM_OVERHANG,
  SHADOW_CENTERS, STOPWATCH_BBOX, STOPWATCH_SHIFT, STRIP_GAP, STRIP_HEAD, STRIP_ROLL, STRIP_LEN, STRIP_SPEED, STRIP_LABEL,
  ROLL_R0, ROLL_R_MAX, PAPER_THICK,
  TIME_STEP,
} from './constants.js'
import { store, DOM } from './state.js'
import { linePlotIndex, frequency, shadowCoord, recorderTime, inIntervals, rollRadius, paperToRoll } from './physics.js'
import { fmt } from '../../shared/js/format.js'
import { shortenEnd } from '../../shared/js/vectors.js'
import { setAxisLabel, setGraphTitle } from '../../shared/js/svg-text.js'
import { tAxisStep, niceStepLE } from '../../shared/js/ticks.js'
import { nearestOnSegment } from '../../shared/js/hover.js'
export { fmt }

// ── Layout-abhängige Geometrie (gestapelt ↔ nebeneinander) ───────────────────
const animH      = () => store.layoutSplit ? ANIM_H_SPLIT      : ANIM_H_STACK
export const animCY = () => store.layoutSplit ? ANIM_CY_SPLIT    : ANIM_CY_STACK
const graphW     = () => store.layoutSplit ? GRAPH_W_SPLIT     : GRAPH_W_STACK
const graphHFull = () => store.layoutSplit ? GRAPH_H_SPLIT     : GRAPH_H_STACK

// Szenenzentrum (Kreismittelpunkt in SVG-Koordinaten): ohne Leinwand das
// layout-abhängige Standardzentrum, mit Leinwand (FK6) aus SHADOW_CENTERS, damit
// Lampe, Leinwand und Stoppuhr nebeneinander Platz finden.
const shadowActive = () => store.shadowSide !== 'off'
const screenVertical = () => store.shadowSide === 'left' || store.shadowSide === 'right'
export function sceneCenter() {
  if (!shadowActive()) return { cx: ANIM_CX, cy: animCY() }
  const key = (store.layoutSplit ? 'split' : 'stack') + (screenVertical() ? 'V' : 'H')
  return SHADOW_CENTERS[key]
}

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

// Zwei-Diagramm-Geometrie (isStacked): die beiden Diagramme liegen ORTHOGONAL zur
// Sim/Diagramm-Aufteilung (kanonische Regel, s. CLAUDE.md) — die Mittellinie (Grid-
// Partition) bleibt unangetastet, nur die Anordnung innerhalb der Diagrammzelle
// ändert sich. Breite je Diagramm = graphW() (layout-abhängig, in drawGraphSlot).
//  • übereinander (layoutSplit=false, breite Zelle): NEBENEINANDER — je Landscape-
//    Format (GRAPH_H_STACK hoch), viewBox-Breite 2·W+Gap, off2 horizontal.
//  • nebeneinander (layoutSplit=true, hohe Zelle): ÜBEREINANDER gestapelt — je
//    Portrait-Slot (GRAPH_H_STACKED_SPLIT hoch), viewBox-Höhe 2·Slot+Gap, off2 vertikal.
function stackedDualGeom() {
  if (!store.layoutSplit) {
    const w = GRAPH_W_STACK, h = GRAPH_H_STACK
    return { vbW: w * 2 + GRAPH_STACKED_GAP, vbH: h, slotH: h, off2: { x: w + GRAPH_STACKED_GAP, y: 0 } }
  }
  const w = GRAPH_W_SPLIT, slotH = GRAPH_H_STACKED_SPLIT
  return { vbW: w, vbH: slotH * 2 + GRAPH_STACKED_GAP, slotH, off2: { x: 0, y: slotH + GRAPH_STACKED_GAP } }
}

const NS = 'http://www.w3.org/2000/svg'

function el(tag, attrs) {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  return e
}

// fmt() via shared/js/format.js (T6)

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


// ── Zoom: passt ppm so an, daß der Kreisradius in die Zeichenfläche paßt ─────
export function updateZoom() {
  const usable = shadowActive() ? SHADOW_R_MAX : Math.min(ANIM_W, animH()) / 2 - 40
  const needed = store.R * DEFAULT_PIXELS_PER_METER
  store.zoomFactor = needed > usable ? usable / needed : 1
  store.currentPixelsPerMeter = DEFAULT_PIXELS_PER_METER * store.zoomFactor
  DOM.zoomTextDisplay.textContent = `Zoom ${store.zoomFactor.toFixed(2)}×`
}

// ── Animations-Koordinatensystem (Achsenpfeile) ──────────────────────────────
export function drawCoordSystem() {
  DOM.animationCoordSystem.innerHTML = ''
  const ppm = store.currentPixelsPerMeter
  const { cx, cy } = sceneCenter()
  const axLen = Math.max(2.0, store.R) * ppm * 1.05
  // FK6: die Achse in Lichtrichtung endet vor Leinwand bzw. Lampe
  const rPx = store.R * ppm
  const axLenX = shadowActive() && screenVertical() ? rPx + 16 : axLen
  const axLenY = shadowActive() && !screenVertical() ? rPx + 16 : axLen
  // x-Achse (Schaft um Marker-Länge kürzen, Spitze via refX am Original-Ende)
  const axEnd = shortenEnd(cx - 10, cy, cx + axLenX, cy, ARROW_LEN_AXIS)
  DOM.animationCoordSystem.appendChild(el('line', {
    x1: cx - 10, y1: cy, x2: axEnd.x2, y2: axEnd.y2,
    stroke: 'var(--text)', 'stroke-width': 1.2, 'marker-end': 'url(#anim-arrowhead)',
  }))
  const xl = el('text', { x: cx + axLenX + 5, y: cy - 6, 'font-size': 13, fill: 'var(--text)',
    'font-style': 'italic' })
  xl.textContent = 'x'
  DOM.animationCoordSystem.appendChild(xl)
  // y-Achse
  const ayEnd = shortenEnd(cx, cy + 10, cx, cy - axLenY, ARROW_LEN_AXIS)
  DOM.animationCoordSystem.appendChild(el('line', {
    x1: cx, y1: cy + 10, x2: ayEnd.x2, y2: ayEnd.y2,
    stroke: 'var(--text)', 'stroke-width': 1.2, 'marker-end': 'url(#anim-arrowhead)',
  }))
  const yl = el('text', { x: cx - 14, y: cy - axLenY - 4, 'font-size': 13, fill: 'var(--text)',
    'font-style': 'italic' })
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
  const { cx, cy } = sceneCenter()
  DOM.disk.setAttribute('cx', cx)
  DOM.disk.setAttribute('cy', cy)
}

// ── Schattenprojektion: Lampe + Leinwand (→ BACKLOG FK6) ─────────────────────
// Geometrie in zwei Koordinaten relativ zum Szenenzentrum:
//   u = Abstand längs der Lichtrichtung (positiv zur Leinwand hin, px)
//   w = SVG-Versatz längs der Leinwand (px; bei senkrechter Leinwand −y·ppm,
//       bei waagerechter +x·ppm)
// Die Lampe steht bei u < 0, die Leinwand bei u > 0. Paralleles Licht: der
// Schatten des Punkts liegt auf der Leinwand bei demselben w wie der Punkt.
function shadowFrame() {
  const { cx, cy } = sceneCenter()
  const side = store.shadowSide
  const n = { left: [-1, 0], right: [1, 0], top: [0, -1], bottom: [0, 1] }[side]
  const vert = screenVertical()
  const r = store.R * store.currentPixelsPerMeter
  const toXY = (u, w) => vert ? [cx + n[0] * u, cy + w] : [cx + w, cy + n[1] * u]
  const rectUW = (u1, u2, w1, w2) => {
    const [xa, ya] = toXY(u1, w1), [xb, yb] = toXY(u2, w2)
    return { x: Math.min(xa, xb), y: Math.min(ya, yb), width: Math.abs(xb - xa), height: Math.abs(yb - ya) }
  }
  const d = r + SHADOW_GAP            // Leinwand-Innenkante bzw. Linse
  const half = r + BEAM_OVERHANG      // halbe Breite von Lichtband/Leinwand/Lampe
  return { cx, cy, side, n, vert, r, d, half, toXY, rectUW }
}

const rectPath = q => `M${q.x.toFixed(2)} ${q.y.toFixed(2)}h${q.width.toFixed(2)}v${q.height.toFixed(2)}h${(-q.width).toFixed(2)}z`
const setRect = (elm, q) => { for (const k in q) elm.setAttribute(k, q[k].toFixed(2)) }

// Sim-ViewBox (FK7/FK8): Grundfläche 0 0 W H (layout-abhängig, enthält Stoppuhr
// und Zoom-Anzeige), bei aktiver Leinwand erweitert um Leinwand, Skala bzw.
// Linienschreiber. Danach symmetrisch um den Kreismittelpunkt gemacht: der Kreis
// steht immer in der Mitte der Sim-Fläche, egal ob Leinwand oder Schreiber an
// sind — der Schreiber verschiebt den Bildschwerpunkt nicht (FK8 e).
// Stoppuhr-Versatz bei aktiver Leinwand (Ecke neben der Lampe, FK8 e)
function stopwatchShift() {
  if (!shadowActive()) return { dx: 0, dy: 0 }
  return STOPWATCH_SHIFT[store.layoutSplit ? 'split' : 'stack'][store.shadowSide] || { dx: 0, dy: 0 }
}

function computeViewBox() {
  let x0 = 0, y0 = 0, x1 = ANIM_W, y1 = animH()
  const { cx, cy } = sceneCenter()
  const sh = stopwatchShift(), B = STOPWATCH_BBOX
  x0 = Math.min(x0, B.x0 + sh.dx - 4); x1 = Math.max(x1, B.x1 + sh.dx + 4)
  y0 = Math.min(y0, B.y0 + sh.dy - 4); y1 = Math.max(y1, B.y1 + sh.dy + 4)
  if (shadowActive()) {
    const F = shadowFrame()
    const far = F.d + SCREEN_THICK + (store.showRecorder
      ? STRIP_GAP + STRIP_LEN + STRIP_ROLL + STRIP_LABEL[F.vert ? 'V' : 'H'] + 6
      : (F.vert ? 44 : 26))
    if (F.side === 'left') x0 = Math.min(x0, cx - far)
    if (F.side === 'right') x1 = Math.max(x1, cx + far)
    if (F.side === 'top') y0 = Math.min(y0, cy - far)
    if (F.side === 'bottom') y1 = Math.max(y1, cy + far)
  }
  const hx = Math.max(cx - x0, x1 - cx), hy = Math.max(cy - y0, y1 - cy)
  x0 = cx - hx; x1 = cx + hx; y0 = cy - hy; y1 = cy + hy
  DOM.mainSvg.setAttribute('viewBox', `${x0} ${y0} ${x1 - x0} ${y1 - y0}`)
  // Zoom-Anzeige oben links; bei Leinwand oben liegt dort der Schreiber → unten
  // links (unten rechts steht das Zeit-Label)
  const zt = DOM.zoomTextDisplay
  zt.setAttribute('x', x0 + 12)
  zt.setAttribute('y', store.shadowSide === 'top' && store.showRecorder ? y1 - 4 : y0 + 20)
}

// Skalenwerte der Leinwand/des Schreibers: 1-2-4-5-Schritte, ±R immer dabei
function scaleTicks() {
  const R = store.R
  const step = niceStepLE(2 * R, 4)
  const dec = (String(+step.toFixed(4)).split('.')[1] || '').length   // 0,25 → 2 Stellen
  const ticks = []
  for (let v = Math.ceil(-R / step - 1e-9) * step; v <= R + 1e-9; v = Math.round((v + step) * 1e9) / 1e9)
    ticks.push({ v, isR: Math.abs(Math.abs(v) - R) < 1e-6 })
  if (!ticks.some(tk => tk.isR && tk.v > 0)) ticks.push({ v: R, isR: true })
  if (!ticks.some(tk => tk.isR && tk.v < 0)) ticks.push({ v: -R, isR: true })
  return { R, step, dec, ticks }
}

// Beschriftung der Skala bei u = uLab (außen) + Achsenbeschriftung; axisTop:
// senkrechte Skala trägt „y / m" über statt unter der Spalte
function drawScaleLabels(F, sc, uLab, axisTop) {
  const { vert, toXY, half } = F
  const ppm = store.currentPixelsPerMeter
  const sign = vert ? -1 : 1                      // Meter → w (senkrecht: SVG-y invertiert)
  const minGap = vert ? 12 : 22                   // Mindestabstand der Beschriftungen (px)
  const rW = sc.ticks.filter(tk => tk.isR).map(tk => tk.v * ppm)
  for (const tk of sc.ticks) {
    // normale Beschriftung entfällt, wenn sie mit einer ±R-Beschriftung kollidiert
    if (!tk.isR && rW.some(rw => Math.abs(Math.abs(rw) - Math.abs(tk.v * ppm)) < minGap
        && Math.sign(rw) === Math.sign(tk.v))) continue
    const [lx, ly] = toXY(uLab, sign * tk.v * ppm)
    const lab = el('text', { class: tk.isR ? 'shadow-tick-label r-label' : 'shadow-tick-label' })
    if (vert) {
      lab.setAttribute('x', lx); lab.setAttribute('y', ly + 3.5)
      lab.setAttribute('text-anchor', F.side === 'right' ? 'start' : 'end')
    } else {
      lab.setAttribute('x', lx); lab.setAttribute('y', F.side === 'top' ? ly - 1 : ly + 8)
      lab.setAttribute('text-anchor', 'middle')
    }
    lab.textContent = Math.abs(tk.v) < 1e-9 ? '0'
      : fmt(tk.v, tk.isR ? Math.max(sc.dec, 1) : sc.dec)   // R-Regler: 0,1-m-Schritte
    DOM.shadowStatic.appendChild(lab)
  }
  const axl = el('text', { class: 'shadow-axis-label' })
  if (vert) {
    const [x, y] = toXY(uLab, axisTop ? -half : half)
    axl.setAttribute('x', x); axl.setAttribute('y', axisTop ? y - 6 : y + 14)
    axl.setAttribute('text-anchor', F.side === 'right' ? 'start' : 'end')
    setAxisLabel(axl, 'y / m')
  } else {
    const [x, y] = toXY(uLab, -half)
    axl.setAttribute('x', x - 6); axl.setAttribute('y', F.side === 'top' ? y - 1 : y + 8)
    axl.setAttribute('text-anchor', 'end')
    setAxisLabel(axl, 'x / m')
  }
  DOM.shadowStatic.appendChild(axl)
}

// Kippschalter in der Szene (FK8 a/b): breite Schiene mit rundem Knopf und
// Ein-Symbol, im freien Teil der Schiene „AN" bzw. „AUS" (wie ein echter
// Schiebeschalter), optional der Gerätename daneben. Liegt längs u von uA bis
// uB in der Zeile w; „an" = Knopf rechts (waagerecht) bzw. oben (senkrecht).
function drawSceneToggle(F, { uA, uB, w, on, role, what, name }) {
  const { rectUW, toXY } = F
  const hw = 11, kr = 8.5                          // halbe Schienenbreite, Knopfradius
  const g = el('g', { class: 'scene-toggle', 'data-role': role, role: 'switch', tabindex: 0,
    'aria-checked': String(on), 'aria-label': `${what} ${on ? 'ausschalten' : 'einschalten'}` })
  const tip = el('title', {}); tip.textContent = `${what}: ${on ? 'an' : 'aus'} (klicken zum Umschalten)`
  g.appendChild(tip)
  g.appendChild(el('rect', { ...rectUW(uA, uB, w - hw, w + hw), rx: hw, class: on ? 'tg-track on' : 'tg-track' }))
  const e1 = toXY(uA + hw, w), e2 = toXY(uB - hw, w)
  const horiz = Math.abs(e1[0] - e2[0]) > Math.abs(e1[1] - e2[1])
  const onEnd = horiz ? (e1[0] > e2[0] ? e1 : e2) : (e1[1] < e2[1] ? e1 : e2)
  const offEnd = onEnd === e1 ? e2 : e1
  const [kx, ky] = on ? onEnd : offEnd, [fx, fy] = on ? offEnd : onEnd
  // Schriftzug im freien Teil der Schiene
  const st = el('text', { x: ((kx + fx) / 2 + fx) / 2, y: ((ky + fy) / 2 + fy) / 2 + 3.3,
    'text-anchor': 'middle', class: on ? 'tg-state on' : 'tg-state' })
  st.textContent = on ? 'AN' : 'AUS'
  g.appendChild(st)
  g.appendChild(el('circle', { cx: kx, cy: ky, r: kr, class: 'tg-knob' }))
  // Ein-Symbol (IEC 60417-5009) im Knopf
  g.appendChild(el('path', { class: on ? 'tg-icon on' : 'tg-icon',
    d: `M${kx - 2.9} ${ky - 3} A4.1 4.1 0 1 0 ${kx + 2.9} ${ky - 3} M${kx} ${ky - 5} V${ky - 0.8}` }))
  if (name) {
    const [lx, ly] = toXY(uB + 5, w)
    const lab = el('text', { class: 'tg-label' })
    if (horiz) {
      lab.setAttribute('x', lx); lab.setAttribute('y', ly + 3.5)
      lab.setAttribute('text-anchor', lx > e2[0] ? 'start' : 'end')
    } else {
      lab.setAttribute('x', lx); lab.setAttribute('y', ly < e2[1] ? ly - 1 : ly + 9)
      lab.setAttribute('text-anchor', 'middle')
    }
    lab.textContent = name
    g.appendChild(lab)
  }
  DOM.shadowStatic.appendChild(g)
}

// Statische Teile (Leinwand, Skala bzw. Linienschreiber, Leuchte mit Schalter),
// bei jedem setupScene neu
export function drawShadowSetup() {
  DOM.shadowStatic.innerHTML = ''
  // B67: display statt visibility — Kinder mit eigenem visibility:visible (Lichtband,
  // Schattensäule, Leinwandschatten) würden ein visibility:hidden der Gruppe überstimmen
  if (!shadowActive()) { DOM.shadowGroup.style.display = 'none'; return }
  DOM.shadowGroup.style.display = ''
  const F = shadowFrame()
  drawScreen(F)
  if (store.showRecorder) drawRecorder(F)
  else drawScreenScale(F)
  drawLamp(F)
}

// Leinwand (Projektionsleinwand, FK7): weißes Tuch zur Lampe hin, dunkle
// Rückwand außen, schwarze Randstreifen an beiden Enden; Schriftzug „Leinwand"
function drawScreen(F) {
  const { d, half, vert, rectUW, toXY } = F
  const outer = d + SCREEN_THICK, border = 7
  DOM.shadowStatic.appendChild(el('rect', { ...rectUW(d, outer, -half, half), class: 'screen-back' }))
  DOM.shadowStatic.appendChild(el('rect', { ...rectUW(d, outer - 2.5, -half + border, half - border),
    class: 'screen-cloth' }))
  for (const sgn of [-1, 1]) {
    DOM.shadowStatic.appendChild(el('rect', { ...rectUW(d - 1, outer, sgn > 0 ? half - border : -half,
      sgn > 0 ? half : -half + border), rx: 1.5, class: 'screen-border' }))
  }
  const wl = vert ? -half + border + 4 : half - border - 4   // senkrecht oben, waagerecht rechts
  const [lx, ly] = toXY(d - 5, wl)
  const lab = el('text', { x: lx, y: ly, class: 'screen-label', 'text-anchor': 'end' })
  if (vert) {
    lab.setAttribute('transform', `rotate(-90 ${lx} ${ly})`)
    lab.setAttribute('dy', F.side === 'right' ? 0 : 7)
  } else lab.setAttribute('dy', F.side === 'top' ? 7 : 0)
  lab.textContent = 'Leinwand'
  DOM.shadowStatic.appendChild(lab)
}

// Ohne Schreiber: Skala direkt auf der Außenseite der Leinwand
function drawScreenScale(F) {
  const { d, toXY, vert } = F
  const ppm = store.currentPixelsPerMeter, outer = d + SCREEN_THICK
  const sc = scaleTicks(), sign = vert ? -1 : 1
  for (const tk of sc.ticks) {
    const w = sign * tk.v * ppm
    const [x1, y1] = toXY(outer, w), [x2, y2] = toXY(outer + (tk.isR ? 8 : 5), w)
    DOM.shadowStatic.appendChild(el('line', { x1, y1, x2, y2, class: tk.isR ? 'shadow-tick r-tick' : 'shadow-tick' }))
  }
  drawScaleLabels(F, sc, outer + 10, false)
}

// Linienschreiber (FK7 d/FK8): Endlospapier mit grünem Raster (Werte in
// 1-2-4-5-Schritten, ±R in Akzentfarbe) und Lochrand, Aufwickelrolle außen,
// Schreibwerk mit Stiftschlitten an der Leinwand, eigener Kippschalter.
// Bewegte Teile (Zeitraster, Lochrand, Rolle, Tintenspur, Schlitten) in updateRecorder.
function drawRecorder(F) {
  const { d, half, vert, rectUW, toXY } = F
  const ppm = store.currentPixelsPerMeter, outer = d + SCREEN_THICK
  const sc = scaleTicks(), sign = vert ? -1 : 1
  const s0 = outer + STRIP_GAP, s1 = s0 + STRIP_LEN, uPen = s0 + STRIP_HEAD
  const add = e => { DOM.shadowStatic.appendChild(e); return e }
  const vLines = (u1, u2, parent, clsFine = true) => {   // Wertelinien von u1 bis u2
    const put = e => parent.appendChild(e)
    if (clsFine) for (let v = Math.ceil(-sc.R / sc.step - 1e-9) * sc.step - sc.step / 2; v <= sc.R; v += sc.step) {
      if (Math.abs(v) > sc.R) continue
      const [x1, y1] = toXY(u1, sign * v * ppm), [x2, y2] = toXY(u2, sign * v * ppm)
      put(el('line', { x1, y1, x2, y2, class: 'strip-grid fine' }))
    }
    for (const tk of sc.ticks) {
      const w = sign * tk.v * ppm
      const [x1, y1] = toXY(u1, w), [x2, y2] = toXY(u2, w)
      put(el('line', { x1, y1, x2, y2,
        class: tk.isR ? 'strip-grid r-grid' : (Math.abs(tk.v) < 1e-9 ? 'strip-grid zero' : 'strip-grid') }))
    }
  }
  // Aufwickelrolle (FK9), Teil 1: Kern-Enden und Wickelkörper (Größe je Frame);
  // die linke Hälfte liegt unter dem auflaufenden Papier
  for (const sgn of [-1, 1]) {
    add(el('rect', { ...rectUW(s1 - 5, s1 + 5, sgn > 0 ? half : -half - 5, sgn > 0 ? half + 5 : -half),
      rx: 1, class: 'roll-core' }))
  }
  DOM.rollBody = add(el('rect', { class: 'strip-roll-body' }))
  // flaches Papier bis zum Auflaufpunkt
  add(el('rect', { ...rectUW(s0, s1, -half, half), class: 'strip-paper' }))
  vLines(s0, s1, DOM.shadowStatic)
  // Wertelinien auf der Rolle, auf die sichtbare Wickelfläche beschnitten
  const clip = el('clipPath', { id: 'roll_clip' })
  DOM.rollClipRect = el('rect', {})
  clip.appendChild(DOM.rollClipRect)
  add(el('defs', {})).appendChild(clip)
  const onRoll = add(el('g', { 'clip-path': 'url(#roll_clip)' }))
  vLines(s1, s1 + ROLL_R_MAX + 1, onRoll)
  // Zeitraster (fein alle 0,5 s, kräftig jede Sekunde) und Lochrand: Pools,
  // groß genug für flaches Papier + Viertelumfang der Rolle
  const extra = ROLL_R_MAX * Math.PI / 2
  DOM.stripTimeLines = add(el('g', {}))
  for (let k = 0; k < Math.ceil((STRIP_LEN + extra) / (STRIP_SPEED / 2)) + 1; k++)
    DOM.stripTimeLines.appendChild(el('line', { visibility: 'hidden' }))
  DOM.stripHoles = add(el('g', {}))
  for (let k = 0; k < 2 * (Math.ceil((STRIP_LEN + extra) / 10) + 1); k++)
    DOM.stripHoles.appendChild(el('ellipse', { class: 'strip-hole', visibility: 'hidden' }))
  drawScaleLabels(F, sc, s1 + STRIP_ROLL + 6, true)
  // Tintenspur (Pfad mit Lücken, wo Lampe oder Schreiber aus waren)
  DOM.stripTrace = add(el('path', { class: 'strip-trace', d: '' }))
  // Rolle, Teil 2: Schattierung des Zylinders (Verlauf, Lage je Frame)
  const grad = el('linearGradient', { id: 'roll_shade', gradientUnits: 'userSpaceOnUse' })
  for (const [o, a] of [[0, 0], [0.5, 0.06], [0.8, 0.22], [1, 0.5]])
    grad.appendChild(el('stop', { offset: o, 'stop-color': '#000', 'stop-opacity': a }))
  DOM.rollGrad = grad
  add(el('defs', {})).appendChild(grad)
  DOM.rollShade = add(el('rect', { fill: 'url(#roll_shade)' }))
  DOM.rollEdge = add(el('line', { class: 'roll-edge' }))

  // Schreibwerk: Gehäuse, Führungsschiene, Schlitten mit Stift
  add(el('rect', { ...rectUW(s0 - 1, uPen - 3, -half - 3, half + 3), rx: 2.5, class: 'recorder-head' }))
  {
    const [x1, y1] = toXY(uPen - 7.5, -half - 1), [x2, y2] = toXY(uPen - 7.5, half + 1)
    add(el('line', { x1, y1, x2, y2, class: 'recorder-rail' }))
  }
  DOM.stripCarriage = add(el('rect', { rx: 1.5, class: 'recorder-carriage' }))
  DOM.stripPen = add(el('circle', { r: 2.2, class: 'strip-pen' }))

  // Zeile neben dem Papier (senkrechte Leinwand unten, waagerechte links):
  // „Linienschreiber" mit Pfeil in Papierlaufrichtung, außen der Kippschalter
  const wl = vert ? half + 15 : -half - 15
  {
    const [ax1, ay1] = toXY(uPen + 4, wl), [ax2, ay2] = toXY(uPen + 30, wl)
    add(el('line', { x1: ax1, y1: ay1, x2: ax2, y2: ay2, class: 'strip-arrow', 'marker-end': 'url(#anim-arrowhead)' }))
    const [tx, ty] = toXY(uPen + 40, wl)
    const lt = el('text', { x: tx, y: ty + 3, class: 'strip-label', 'text-anchor': 'start' })
    if (!vert) {
      lt.setAttribute('transform', `rotate(-90 ${tx} ${ty})`)
      lt.setAttribute('text-anchor', F.side === 'top' ? 'start' : 'end')
    } else if (F.side === 'left') lt.setAttribute('text-anchor', 'end')
    lt.textContent = 'Linienschreiber'
    add(lt)
  }
  drawSceneToggle(F, { uA: s1 - 60, uB: s1 - 6, w: wl, on: store.recorderOn,
    role: 'recorder-switch', what: 'Linienschreiber' })
}

// Leuchte (FK7): Montageschiene mit Schrauben, Fassungen an beiden Enden, Röhre
// dazwischen (an: hell mit Leuchtschein, aus: grau); Kippschalter am freien Ende
function drawLamp(F) {
  const { d, half, vert, rectUW, toXY } = F
  const on = store.lampOn
  const L = LAMP_DEPTH, sock = 10               // Fassungslänge längs der Röhre (px)
  const add = e => { DOM.shadowStatic.appendChild(e); return e }
  add(el('rect', { ...rectUW(-d - L, -d - L + 7, -half, half), rx: 2, class: 'lamp-rail' }))
  for (const sgn of [-1, 1]) {
    const [sx, sy] = toXY(-d - L + 3.5, sgn * (half - sock - 10))
    add(el('circle', { cx: sx, cy: sy, r: 1.6, class: 'lamp-screw' }))
  }
  if (on) add(el('rect', { ...rectUW(-d - 16, -d + 1, -half + sock - 2, half - sock + 2), rx: 8.5, class: 'tube-glow' }))
  add(el('rect', { ...rectUW(-d - 13, -d - 3, -half + sock - 3, half - sock + 3), rx: 5,
    class: on ? 'tube-body' : 'tube-body off' }))
  for (const sgn of [-1, 1]) {
    const w0 = sgn * (half - sock), w1 = sgn * half
    add(el('rect', { ...rectUW(-d - L + 6, -d - 1, Math.min(w0, w1), Math.max(w0, w1)), rx: 2, class: 'lamp-socket' }))
    const [x1, y1] = toXY(-d - 8, w0 + sgn * 3), [x2, y2] = toXY(-d - 8, w1 - sgn * 2)
    add(el('line', { x1, y1, x2, y2, class: 'lamp-socket-slot' }))
  }
  // Kippschalter: senkrechte Leuchte unten, waagerechte links (frei von Stoppuhr)
  drawSceneToggle(F, { uA: -d - L, uB: -d + 32, w: vert ? half + 15 : -half - 15, on,
    role: 'lamp-switch', what: 'Lampe', name: 'Lampe' })
}

// Dynamische Teile: Lichtband, Schattensäule hinter dem Punkt, Schatten auf der
// Leinwand, Linienschreiber
function updateShadow(t, p) {
  if (!shadowActive()) return
  const F = shadowFrame()
  const { n, vert, d, half, rectUW } = F
  const ppm = store.currentPixelsPerMeter
  const outer = d + SCREEN_THICK
  const uP = p.x * ppm * n[0] - p.y * ppm * n[1]  // Lage des Punkts längs des Lichts
  const wOf = coord => (vert ? -coord : coord) * ppm
  const wP = wOf(vert ? p.y : p.x)
  const pr = POINT_RADIUS

  // Lampe aus (FK7): kein Licht, also auch kein Schatten
  const lit = store.lampOn ? 'visible' : 'hidden'
  DOM.lightBeam.style.visibility = lit
  DOM.shadowColumn.style.visibility = lit
  DOM.screenShadow.style.visibility = lit
  if (store.lampOn) {
    // Lichtband durchgehend; die Schattensäule liegt als leicht dunkle Fläche
    // darüber (dunkler als das beleuchtete Band, in beiden Themes)
    DOM.lightBeam.setAttribute('d', rectPath(rectUW(-d, outer, -half, half)))
    setRect(DOM.shadowColumn, rectUW(uP, outer, wP - pr, wP + pr))
    setRect(DOM.screenShadow, rectUW(d, outer - 2.5, wP - pr, wP + pr))
  }
  if (store.showRecorder) updateRecorder(F, t, wOf)
}

// Linienschreiber (FK8): das Papier läuft nur, solange der Schreiber an ist
// (Papierzeit τ = recorderTime); der Stift schreibt nur, wenn Lampe UND
// Schreiber an sind. Neuester Punkt am Stift, ältere weiter außen.
function updateRecorder(F, t, wOf) {
  const { vert, half, d, rectUW, toXY } = F
  const s0 = d + SCREEN_THICK + STRIP_GAP, s1 = s0 + STRIP_LEN, uPen = s0 + STRIP_HEAD
  const tau = recorderTime(t, store.recOffLog)

  // Aufwickelrolle (FK9): Radius aus der aufgewickelten Länge; jede Papierstelle ℓ
  // (flache Koordinate) wird über paperToRoll auf Papier bzw. Rolle abgebildet
  const r = rollRadius(tau * STRIP_SPEED - (s1 - uPen), ROLL_R0, ROLL_R_MAX, PAPER_THICK)
  setRect(DOM.rollBody, rectUW(s1 - r, s1 + r, -half, half))
  setRect(DOM.rollClipRect, rectUW(s1, s1 + r, -half, half))
  setRect(DOM.rollShade, rectUW(s1, s1 + r, -half, half))
  {
    const [gx1, gy1] = toXY(s1, 0), [gx2, gy2] = toXY(s1 + r, 0)
    DOM.rollGrad.setAttribute('x1', gx1); DOM.rollGrad.setAttribute('y1', gy1)
    DOM.rollGrad.setAttribute('x2', gx2); DOM.rollGrad.setAttribute('y2', gy2)
    const [ex1, ey1] = toXY(s1 + r, -half), [ex2, ey2] = toXY(s1 + r, half)
    DOM.rollEdge.setAttribute('x1', ex1); DOM.rollEdge.setAttribute('y1', ey1)
    DOM.rollEdge.setAttribute('x2', ex2); DOM.rollEdge.setAttribute('y2', ey2)
  }
  const map = ell => paperToRoll(ell, s1, r)

  // Zeitraster und Lochrand laufen mit dem Papier (auf der Rolle gestaucht)
  const lines = DOM.stripTimeLines.children
  const kMax = Math.floor(tau / 0.5)
  for (let j = 0; j < lines.length; j++) {
    const k = kMax - j, m = map(uPen + (tau - k * 0.5) * STRIP_SPEED), ln = lines[j]
    if (!m) { ln.style.visibility = 'hidden'; continue }
    const [x1, y1] = toXY(m.u, -half + 7), [x2, y2] = toXY(m.u, half - 7)
    ln.setAttribute('x1', x1); ln.setAttribute('y1', y1); ln.setAttribute('x2', x2); ln.setAttribute('y2', y2)
    ln.setAttribute('class', k % 2 === 0 ? 'strip-time bold' : 'strip-time')
    ln.style.visibility = 'visible'
  }
  const holes = DOM.stripHoles.children, off = (tau * STRIP_SPEED) % 10
  for (let k = 0; k < holes.length / 2; k++) {
    const m = map(s0 + off + k * 10)
    for (const [j, w] of [[0, -half + 3.5], [1, half - 3.5]]) {
      const h = holes[2 * k + j]
      if (!m) { h.style.visibility = 'hidden'; continue }
      const [x, y] = toXY(m.u, w)
      h.setAttribute('cx', x); h.setAttribute('cy', y)
      h.setAttribute(vert ? 'rx' : 'ry', (1.5 * m.c).toFixed(2)); h.setAttribute(vert ? 'ry' : 'rx', 1.5)
      h.style.visibility = 'visible'
    }
  }

  // Schlitten folgt dem Schatten; bei ausgeschalteter Lampe bleibt er dort
  // stehen, wo der Schatten beim Ausschalten war
  const lampLog = store.lampOffLog
  const tPen = store.lampOn || !lampLog.length ? t : Math.min(t, lampLog[lampLog.length - 1][0])
  const wPen = wOf(shadowCoord(store.shadowSide, tPen))
  setRect(DOM.stripCarriage, rectUW(uPen - 12, uPen - 1, wPen - 5, wPen + 5))
  const [penX, penY] = toXY(uPen, wPen)
  DOM.stripPen.setAttribute('cx', penX); DOM.stripPen.setAttribute('cy', penY)

  // Tintenspur
  const writing = ti => ti >= store.recStart - 1e-9 && !inIntervals(ti, lampLog) && !inIntervals(ti, store.recOffLog)
  const arr = vert ? store.yData : store.xData
  const span = (s1 - uPen + r * Math.PI / 2) / STRIP_SPEED   // bis zur Rollenkante
  const iMax = Math.min(store.tData.length - 1, Math.floor(t / TIME_STEP + 1e-6))
  let path = '', down = false
  const pt = (u, w) => { const [x, y] = toXY(u, w); path += `${down ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; down = true }
  if (writing(t)) pt(uPen, wPen)
  for (let i = iMax; i >= 0; i--) {
    const ti = store.tData[i]
    if (ti < tau - span) break                    // τ(tᵢ) ≤ tᵢ → ab hier zu alt
    if (!writing(ti)) { down = false; continue }
    const age = tau - recorderTime(ti, store.recOffLog)
    const m = map(uPen + age * STRIP_SPEED)
    if (!m) break
    pt(m.u, wOf(arr[i]))
  }
  DOM.stripTrace.setAttribute('d', path)
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
  updateZoom()
  computeViewBox()
  drawCoordSystem()
  drawTrajectoryCircle()
  drawShadowSetup()
  // Stoppuhr oben rechts: auf 80 % (scale 0,80), etwa eine halbe Uhrbreite
  // zur Seite und noch ~0,2 Uhrbreite nach rechts + unten geschoben. Analog-
  // Kreis Ø 115 px, Center (405, 83), bbox x 347..463, y 25..141. Rechte
  // Hälfte des analogen Kreises ragt leicht über den viewBox-Rand (gewünschte
  // Eck-Platzierung); LCD-Rahmen des Digital-Easteregg ragt weiter über
  // (analog ist Default).
  const sh = stopwatchShift()
  DOM.stopwatch.setAttribute('transform', `translate(${181 + sh.dx}, ${-13 + sh.dy}) scale(0.8)`)
  return sceneCenter()
}

// ── Vektor-Linie setzen (mit Sichtbarkeit) ───────────────────────────────────
// markerLen = Pfeilspitzen-Länge in px; der Schaft wird am (x2,y2)-Ende um
// markerLen gekürzt, sodaß er an der Dreieck-Basis endet (Spitze via refX am
// Original-Endpunkt). Verhindert das seitliche Ausgucken des Schafts nahe der
// Spitze.
function setVec(lineEl, x1, y1, x2, y2, visible, markerLen = 0) {
  if (!visible) { lineEl.style.visibility = 'hidden'; return }
  const end = shortenEnd(x1, y1, x2, y2, markerLen)
  if (!end) { lineEl.style.visibility = 'hidden'; return } // B23: Vektor kürzer als Spitze
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

  // Schattenprojektion (FK6)
  updateShadow(t, p)

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
// attrs: { slot, titleEl, gridEl, lineEl, pointEl, type, graphHeight, currentTime, currentValue }
function drawGraphSlot(attrs) {
  const { slot, titleEl, gridEl, lineEl, pointEl, type, graphHeight, currentTime, currentValue } = attrs
  const limits = store.axisLimits[type]
  gridEl.innerHTML = ''
  lineEl.setAttribute('points', '')
  pointEl.style.visibility = 'hidden'
  if (!limits) { store.graphScale[slot] = null; hideGraphHover(slot); return }

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

  // Hover-Werte (I13.1): Hit-Rect-Geometrie aus denselben Lokalen wie scX/scY.
  // Bahnkurve (yx/xy) ohne Zeitachse: Nearest-Point-Suche (B57, drawTrajHover)
  // auf der bis traceEnd gezeichneten Spur statt Pixel→Zeit-Umkehrung.
  DOM.graphHitRect[slot].setAttribute('x', plotL)
  DOM.graphHitRect[slot].setAttribute('y', plotT)
  DOM.graphHitRect[slot].setAttribute('width', plotW)
  DOM.graphHitRect[slot].setAttribute('height', plotH)
  store.graphScale[slot] = {
    plotL, plotT, plotW, plotH, xMin, xMax, yMin, yMax, type,
    nowT: Math.min(currentTime, xMax), traj: isTraj,
    traceEnd: store.T === Infinity ? currentTime : Math.min(currentTime, store.T),
  }

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
// Zwei unabhängige Diagramm-Picker (→ BACKLOG I12.9): graphType1 gehört immer
// zum Single-Slot bzw. oberen Slot, graphType2 nur zum unteren Slot im
// Zwei-Diagramm-Modus — frei kombinierbar, keine feste x/y-Paarung mehr.
export function updateGraph(time) {
  // Graph-ViewBox layout- & modus-abhängig. SINGLE: volles Format (gestapelt
  // landscape 700×410, Split portrait 410×700). STACKED (zwei Diagramme): die
  // Diagramme liegen orthogonal zur Sim/Diagramm-Aufteilung — übereinander-Layout
  // → nebeneinander (viewBox-Breite 2·W+Gap), nebeneinander-Layout → übereinander
  // gestapelt (viewBox-Höhe 2·Slot+Gap). Mittellinie (Grid-Partition) unangetastet.
  if (store.isStacked) {
    DOM.graphGroupSingle.style.visibility = 'hidden'
    // Eigene visibility="visible" auf dem Punkt-Element übersteuert eine per
    // Gruppen-style vererbte visibility:hidden (CSS-Vererbung wird von einem
    // explizit gesetzten Wert am Kind blockiert) — sonst bleibt der zuletzt
    // gezeichnete Punkt als "Geisterpunkt" sichtbar, wenn man später
    // zurückwechselt (Bug-Report).
    DOM.graphPoint.style.visibility = 'hidden'
    DOM.graphGroupStackedTop.style.visibility = 'visible'
    DOM.graphGroupStackedBottom.style.visibility = 'visible'
    const dg = stackedDualGeom()
    DOM.graphSvg.setAttribute('viewBox', `0 0 ${dg.vbW} ${dg.vbH}`)
    const topVal = currentInterpValue(store.graphType1, time)
    const botVal = currentInterpValue(store.graphType2, time)
    drawGraphSlot({ slot: 'top', titleEl: DOM.graphTitleTop, gridEl: DOM.gridGroupTop, lineEl: DOM.graphLineTop, pointEl: DOM.graphPointTop, type: store.graphType1, graphHeight: dg.slotH, currentTime: time, currentValue: topVal })
    DOM.graphGroupStackedTop.setAttribute('transform', 'translate(0, 0)')
    drawGraphSlot({ slot: 'bottom', titleEl: DOM.graphTitleBottom, gridEl: DOM.gridGroupBottom, lineEl: DOM.graphLineBottom, pointEl: DOM.graphPointBottom, type: store.graphType2, graphHeight: dg.slotH, currentTime: time, currentValue: botVal })
    DOM.graphGroupStackedBottom.setAttribute('transform', `translate(${dg.off2.x}, ${dg.off2.y})`)
  } else {
    DOM.graphGroupStackedTop.style.visibility = 'hidden'
    DOM.graphGroupStackedBottom.style.visibility = 'hidden'
    // s. o.: Geisterpunkte in den jetzt inaktiven Stacked-Slots verstecken.
    DOM.graphPointTop.style.visibility = 'hidden'
    DOM.graphPointBottom.style.visibility = 'hidden'
    DOM.graphGroupSingle.style.visibility = 'visible'
    DOM.graphGroupSingle.setAttribute('transform', 'translate(0, 0)')
    DOM.graphSvg.setAttribute('viewBox', `0 0 ${graphW()} ${graphHFull()}`)
    const interp = currentInterpValue(store.graphType1, time)
    drawGraphSlot({ slot: 'single', titleEl: DOM.graphTitle, gridEl: DOM.gridGroup, lineEl: DOM.graphLine, pointEl: DOM.graphPoint, type: store.graphType1, graphHeight: graphHFull(), currentTime: time, currentValue: interp })
  }

  // Hover-Werte (I13.1): time_range wächst mit der Wiedergabe — bei offenem
  // Hover jeden Frame mit der frischen Skala neu berechnen (inkl. I14-Sync).
  refreshHover()
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

// ── Hover-Werte (I13.1) + Dual-Sync (I14) ────────────────────────────────────
function hideGraphHover(slot) {
  DOM.hoverLine[slot].setAttribute('visibility', 'hidden')
  DOM.hoverPoint[slot].setAttribute('visibility', 'hidden')
  DOM.hoverTooltip[slot].setAttribute('visibility', 'hidden')
}

function otherSlot(slot) {
  return slot === 'top' ? 'bottom' : slot === 'bottom' ? 'top' : null
}

function drawHoverAtT(slot, t) {
  const gs = store.graphScale[slot]
  if (!gs) { hideGraphHover(slot); return }
  const { plotL, plotT, plotW, plotH, xMin, xMax, yMin, yMax, type } = gs
  const xRng = (xMax - xMin) || 1
  const yRng = (yMax - yMin) || 1
  const scX = v => plotL + ((v - xMin) / xRng) * plotW
  const scY = v => plotT + plotH - ((v - yMin) / yRng) * plotH
  const val = currentInterpValue(type, t)
  if (val === null) { hideGraphHover(slot); return }
  const xPix = scX(t)

  DOM.hoverLine[slot].setAttribute('x1', xPix); DOM.hoverLine[slot].setAttribute('x2', xPix)
  DOM.hoverLine[slot].setAttribute('y1', plotT); DOM.hoverLine[slot].setAttribute('y2', plotT + plotH)
  DOM.hoverLine[slot].setAttribute('visibility', 'visible')

  DOM.hoverPoint[slot].setAttribute('cx', xPix)
  DOM.hoverPoint[slot].setAttribute('cy', scY(val))
  DOM.hoverPoint[slot].setAttribute('visibility', 'visible')

  const unit = (store.axisLimits[type]?.yLabel || '').split(' / ').pop()
  renderHoverTooltip(slot, [
    { sym: 't', text: ` = ${fmt(t, 2)} s` },
    { text: `${fmt(val, 3)} ${unit}` },
  ], xPix, plotL, plotW, plotT)
}

// Hover-Cursor auf der Bahnkurve y(x)/x(y) (B57): Ring auf dem Punkt der
// gezeichneten Spur, der der Maus am nächsten liegt; Tooltip t, x, y. Die Spur
// reicht bis traceEnd = min(t, T) — nach dem ersten Umlauf ist der Kreis
// geschlossen, t ist dann der Zeitpunkt des ersten Durchgangs.
function drawTrajHover(slot, gs) {
  const { tData, xData, yData } = store
  const loc = store.hoverLocal
  if (!loc || tData.length === 0) { hideGraphHover(slot); return }
  const { plotL, plotT, plotW, plotH, xMin, xMax, yMin, yMax, type, traceEnd } = gs
  const scX = v => plotL + ((v - xMin) / ((xMax - xMin) || 1)) * plotW
  const scY = v => plotT + plotH - ((v - yMin) / ((yMax - yMin) || 1)) * plotH
  const pix = i => type === 'yx' ? [scX(xData[i]), scY(yData[i])] : [scX(yData[i]), scY(xData[i])]

  // dieselben Stützpunkte wie die gezeichnete Polyline (s. drawGraphSlot)
  const n = Math.min(linePlotIndex(traceEnd), tData.length)
  if (n === 0) { hideGraphHover(slot); return }
  let bi = 0, ba = 0, bd = Infinity
  if (n === 1) bd = 0
  for (let i = 0; i + 1 < n; i++) {
    const [ax, ay] = pix(i), [bx, by] = pix(i + 1)
    const { a, d2 } = nearestOnSegment(loc.x, loc.y, ax, ay, bx, by)
    if (d2 < bd) { bd = d2; bi = i; ba = a }
  }
  const j = Math.min(bi + 1, n - 1)
  const lerp = arr => arr[bi] + ba * (arr[j] - arr[bi])
  const t = lerp(tData), x = lerp(xData), y = lerp(yData)
  store.hoverT = t
  const cx = type === 'yx' ? scX(x) : scX(y)
  const cy = type === 'yx' ? scY(y) : scY(x)

  DOM.hoverLine[slot].setAttribute('visibility', 'hidden')
  DOM.hoverPoint[slot].setAttribute('cx', cx)
  DOM.hoverPoint[slot].setAttribute('cy', cy)
  DOM.hoverPoint[slot].setAttribute('visibility', 'visible')
  renderHoverTooltip(slot, [
    { sym: 't', text: ` = ${fmt(t, 2)} s` },
    { sym: 'x', text: ` = ${fmt(x, 3)} m` },
    { sym: 'y', text: ` = ${fmt(y, 3)} m` },
  ], cx, plotL, plotW, plotT, { yPix: cy, plotH })
}

// rows: [{ sym?, text }] — sym kursiv (Größe), text aufrecht. Ohne opts steht
// das Tooltip oben im Plot (Zeit-Diagramme); mit opts.yPix neben dem Punkt,
// auf die jeweils freie Seite geklappt (Bahnkurve).
function renderHoverTooltip(slot, rows, xPix, padL, plotW, padT, opts = null) {
  const textEl = DOM.hoverTooltipText[slot]
  textEl.innerHTML = ''
  const lineH = 15
  rows.forEach((row, i) => {
    const tspan = el('tspan', { x: 8, y: 16 + i * lineH })
    if (row.sym) {
      const sym = el('tspan', { 'font-style': 'italic' })
      sym.textContent = row.sym
      tspan.appendChild(sym)
      tspan.appendChild(document.createTextNode(row.text))
    } else {
      tspan.textContent = row.text
    }
    textEl.appendChild(tspan)
  })

  const bbox = textEl.getBBox()
  const boxW = bbox.width + 16, boxH = bbox.height + 12
  DOM.hoverTooltipBg[slot].setAttribute('width', boxW)
  DOM.hoverTooltipBg[slot].setAttribute('height', boxH)
  DOM.hoverTooltipBg[slot].setAttribute('x', 0)
  DOM.hoverTooltipBg[slot].setAttribute('y', 0)

  let tx = xPix + 12, ty = padT + 6
  if (opts) {
    if (tx + boxW > padL + plotW) tx = xPix - 12 - boxW
    ty = opts.yPix + 12
    if (ty + boxH > padT + opts.plotH) ty = opts.yPix - 12 - boxH
    ty = Math.max(padT, ty)
  }
  tx = Math.max(padL, Math.min(padL + plotW - boxW, tx))
  DOM.hoverTooltip[slot].setAttribute('transform', `translate(${tx}, ${ty})`)
  DOM.hoverTooltip[slot].setAttribute('visibility', 'visible')
}

// Zeichnet den Hover-Cursor im hoverSourceSlot neu (wächst mit der laufenden
// Wiedergabe) und im Zwei-Diagramm-Modus zusätzlich im jeweils anderen Slot
// bei derselben Zeit (I14: beide Slots teilen sich dort die Zeitachse).
function refreshHover() {
  const slot = store.hoverSourceSlot
  if (!slot) return
  const gs = store.graphScale[slot]
  if (!gs) {
    hideGraphHover(slot)
    if (store.isStacked) { const o = otherSlot(slot); if (o) hideGraphHover(o) }
    return
  }
  // Bahnkurve: nächster Punkt jeden Frame neu, da die Spur wächst
  if (gs.traj) { drawTrajHover(slot, gs); return }
  const t = Math.max(0, Math.min(store.hoverT, gs.xMax, gs.nowT))
  store.hoverT = t
  drawHoverAtT(slot, t)
  if (store.isStacked) {
    const other = otherSlot(slot)
    if (other) {
      const gsOther = store.graphScale[other]
      if (gsOther) drawHoverAtT(other, Math.max(0, Math.min(t, gsOther.xMax, gsOther.nowT)))
      else hideGraphHover(other)
    }
  }
}

/**
 * Hover-Cursor + Tooltip für die aktuell gehoverte lokale x-Koordinate im
 * angegebenen Diagramm-Slot ('single'/'top'/'bottom'). Liest store.graphScale
 * (von drawGraphSlot() befüllt) statt eigene Skala zu berechnen. Im
 * Zwei-Diagramm-Modus wird zusätzlich der jeweils andere Slot synchronisiert
 * (I14), da beide dort stets dieselbe Zeitachse teilen (Bahnkurven sind im
 * Dual-Modus generell gefiltert, s. drawGraphSlot).
 */
export function updateGraphHover(slot, localX, localY = null) {
  if (localX === null) {
    if (store.hoverSourceSlot === slot) {
      store.hoverSourceSlot = null
      store.hoverT = null
      store.hoverLocal = null
      hideGraphHover('single'); hideGraphHover('top'); hideGraphHover('bottom')
    }
    return
  }
  const gs = store.graphScale[slot]
  if (!gs) { hideGraphHover(slot); return }
  if (gs.traj) {
    store.hoverSourceSlot = slot
    store.hoverLocal = { x: localX, y: localY }
    refreshHover()
    return
  }
  const xClamped = Math.max(gs.plotL, Math.min(gs.plotL + gs.plotW, localX))
  const rawT = ((xClamped - gs.plotL) / gs.plotW) * gs.xMax
  store.hoverSourceSlot = slot
  store.hoverT = Math.max(0, Math.min(rawT, gs.xMax, gs.nowT))
  refreshHover()
}
