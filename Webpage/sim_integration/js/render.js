'use strict'

import { X_MIN, X_MAX, FUNCS, N_LABEL_LIMIT, N_MIDDOT_LIMIT, N_VIEW_MIN,
         MAIN_LAND_W, MAIN_LAND_H, MAIN_PORT_W, MAIN_PORT_H,
         MAIN_PAD_L, MAIN_PAD_R, MAIN_PAD_T, MAIN_PAD_B,
         GRAPH_LAND_W, GRAPH_LAND_H, GRAPH_PORT_W, GRAPH_PORT_H,
         GRAPH_PORT_SLOT_DUAL, DUAL_GAP, PAD_L, PAD_R, PAD_T, PAD_B } from './constants.js'
import { store, DOM } from './state.js'
import { strips, cumulative, integralFunction, interpolateAt } from './physics.js'
import { fmt } from '../../shared/js/format.js'
import { setAxisLabel, setGraphTitle } from '../../shared/js/svg-text.js'
import { tAxisStep, niceStepLE } from '../../shared/js/ticks.js'

const NS = 'http://www.w3.org/2000/svg'
const el = (tag, attrs) => {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  return e
}
const txt = (attrs, content) => { const e = el('text', attrs); e.textContent = content; return e }
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const decFor = s => (s >= 1 ? 0 : s >= 0.1 ? 1 : s >= 0.01 ? 2 : 3)
const otherSlot = s => (s === 1 ? 2 : 1)

// ── Zellform → Orientierung ──────────────────────────────────────────────────
// Aus der TATSÄCHLICHEN Zellform abgeleitet (nicht nur aus store.layoutSplit),
// damit der @media-Fallback auf schmalen Viewports automatisch mitzieht.
function isLandscape(svgEl) {
  const r = svgEl.getBoundingClientRect()
  if (!r.width || !r.height) return !store.layoutSplit
  return r.width >= r.height
}

function mainGeom() {
  return isLandscape(DOM.mainSvg)
    ? { w: MAIN_LAND_W, h: MAIN_LAND_H }
    : { w: MAIN_PORT_W, h: MAIN_PORT_H }
}

// Zwei-Diagramm-Anordnung ORTHOGONAL zur Sim/Diagramm-Aufteilung (CLAUDE.md):
// breite Zelle → Slots nebeneinander, hohe Zelle → Slots übereinander.
function graphGeom() {
  const dual = store.diagramMode === '2'
  const landscape = isLandscape(DOM.graphSvg)
  if (!dual) {
    const w = landscape ? GRAPH_LAND_W : GRAPH_PORT_W
    const h = landscape ? GRAPH_LAND_H : GRAPH_PORT_H
    return { w, h, cellW: w, cellH: h, dual: false, off2: { x: 0, y: 0 } }
  }
  if (landscape) {
    const cw = GRAPH_LAND_W, ch = GRAPH_LAND_H
    return { w: cw * 2 + DUAL_GAP, h: ch, cellW: cw, cellH: ch, dual: true,
             off2: { x: cw + DUAL_GAP, y: 0 } }
  }
  const cw = GRAPH_PORT_W, ch = GRAPH_PORT_SLOT_DUAL
  return { w: cw, h: ch * 2 + DUAL_GAP, cellW: cw, cellH: ch, dual: true,
           off2: { x: 0, y: ch + DUAL_GAP } }
}

// ── Gemeinsames Achsenkreuz (Hauptbild + beide Diagramm-Slots) ───────────────
// Zeichnet Hintergrund, Gitter, Ticks, Achsen und Achsenbeschriftung und liefert
// die Skalenfunktionen zurück — EINE Quelle der Wahrheit für Zeichnung, Marker
// und Hover. Abszisse am Nulldurchgang, falls der Wertebereich 0 einschließt.
function drawFrame(group, c) {
  const { plotW, plotH, padL, padT, xMin, xMax, yMin, yMax } = c
  const sx = x => padL + ((x - xMin) / (xMax - xMin)) * plotW
  const sy = y => padT + plotH - ((y - yMin) / (yMax - yMin)) * plotH

  // Hintergrund reicht ~10 px über die Pfeilspitzen hinaus (CLAUDE.md).
  group.appendChild(el('rect', { x: padL - 1, y: padT - 26,
    width: plotW + 30, height: plotH + 30, class: 'graph-bg' }))

  const bottom = padT + plotH
  const axisY = (yMin < 0 && yMax > 0) ? sy(0) : bottom

  // Vertikale Gitterlinien + Abszissen-Ticks (Labels stets am unteren Plotrand)
  const xStep = c.xStep, xDec = c.xDec ?? decFor(xStep)
  const xFirst = Math.ceil((xMin - 1e-9) / xStep) * xStep
  for (let v = xFirst; v <= xMax + 1e-9; v += xStep) {
    const xp = sx(v)
    if (Math.abs(xp - padL) > 1.5)
      group.appendChild(el('line', { x1: xp, y1: padT, x2: xp, y2: bottom, class: 'grid-line' }))
    group.appendChild(txt({ x: xp, y: bottom + 17, 'text-anchor': 'middle', class: 'tick-label' },
      fmt(v, xDec)))
  }

  // Horizontale Gitterlinien + Ordinaten-Ticks
  const yStep = c.yStep, yDec = c.yDec ?? decFor(yStep)
  const yFirst = Math.ceil((yMin - 1e-9) / yStep) * yStep
  for (let v = yFirst; v <= yMax + 1e-9; v += yStep) {
    const yp = sy(v)
    if (Math.abs(yp - bottom) > 1.5)
      group.appendChild(el('line', { x1: padL, y1: yp, x2: padL + plotW, y2: yp, class: 'grid-line' }))
    group.appendChild(txt({ x: padL - 8, y: yp + 4, 'text-anchor': 'end', class: 'tick-label' },
      fmt(v, yDec)))
  }

  // Achsen mit Pfeilspitzen (refX=0, ohne Schaftkürzung — Graph-Achsen-Ausnahme)
  const mk = `url(#${c.markerId})`
  group.appendChild(el('line', { x1: padL, y1: axisY, x2: padL + plotW + 8, y2: axisY,
    class: 'axis-line', 'marker-end': mk }))
  group.appendChild(el('line', { x1: padL, y1: bottom, x2: padL, y2: padT - 8,
    class: 'axis-line', 'marker-end': mk }))

  // Achsenbeschriftung (Symbol kursiv — shared setAxisLabel). `labelAtTip` setzt
  // den Achsenbuchstaben an die Pfeilspitze statt mittig — im Hauptbild nötig,
  // weil unter der Abszisse bereits Tick-Labels und die a/b-Marken stehen.
  if (c.labelAtTip) {
    const xl = el('text', { x: padL + plotW + 20, y: axisY + 5, 'text-anchor': 'start', class: 'axis-label' })
    setAxisLabel(xl, c.xLabel); group.appendChild(xl)
    const yl = el('text', { x: padL - 10, y: padT - 14, 'text-anchor': 'end', class: 'axis-label' })
    setAxisLabel(yl, c.yLabel); group.appendChild(yl)
  } else {
    const xl = el('text', { x: padL + plotW / 2, y: bottom + 40, 'text-anchor': 'middle', class: 'axis-label' })
    setAxisLabel(xl, c.xLabel); group.appendChild(xl)
    const ycx = padL - 44, ycy = padT + plotH / 2
    const yl = el('text', { x: ycx, y: ycy, transform: `rotate(-90 ${ycx} ${ycy})`,
      'text-anchor': 'middle', class: 'axis-label' })
    setAxisLabel(yl, c.yLabel); group.appendChild(yl)
  }

  return { sx, sy, axisY, bottom }
}

const polyPoints = (xsArr, ysArr, sx, sy, from = 0, to = -1) => {
  const end = to < 0 ? xsArr.length : to
  let p = ''
  for (let i = from; i < end; i++) p += `${sx(xsArr[i]).toFixed(2)},${sy(ysArr[i]).toFixed(2)} `
  return p.trim()
}

// ── Hauptdarstellung: statischer Teil (Achsen, Kurve, Grenzen, exakte Fläche) ─
// Hängt nur von Funktion und Grenzen a, b ab — nicht von n. Wird bei jedem
// resetSim() einmal gezeichnet, nicht bei jeder Verfeinerungsstufe.
export function drawBackground() {
  const { xs, ys, funcKey, a, b } = store
  const g = mainGeom()
  DOM.mainSvg.setAttribute('viewBox', `0 0 ${g.w} ${g.h}`)
  const plotW = g.w - MAIN_PAD_L - MAIN_PAD_R
  const plotH = g.h - MAIN_PAD_T - MAIN_PAD_B

  // Ordinate: 0 stets enthalten (die Streifen stehen auf der Abszisse auf),
  // oben 15 % Luft für die Obersummen-Rechtecke.
  const yMax = Math.max(...ys) * 1.15
  const yMin = 0

  DOM.mainGrid.innerHTML = ''
  const { sx, sy } = drawFrame(DOM.mainGrid, {
    plotW, plotH, padL: MAIN_PAD_L, padT: MAIN_PAD_T,
    xMin: X_MIN, xMax: X_MAX, yMin, yMax,
    xStep: tAxisStep(X_MAX - X_MIN), yStep: niceStepLE(yMax - yMin, 4),
    xLabel: 'x', yLabel: 'y', markerId: 'main-arrowhead', labelAtTip: true,
  })
  store.mainScale = { sx, sy, plotW, plotH, yMin, yMax, w: g.w, h: g.h }

  // Exakte Fläche unter der Kurve zwischen a und b (schattiert)
  DOM.mainExact.innerHTML = ''
  if (store.showExact) {
    let d = `M ${sx(a).toFixed(2)},${sy(0).toFixed(2)} `
    const f = FUNCS[funcKey].f
    const steps = 240
    for (let i = 0; i <= steps; i++) {
      const x = a + (i / steps) * (b - a)
      d += `L ${sx(x).toFixed(2)},${sy(f(x)).toFixed(2)} `
    }
    d += `L ${sx(b).toFixed(2)},${sy(0).toFixed(2)} Z`
    DOM.mainExact.appendChild(el('path', { d, class: 'exact-area' }))
  }

  // Kurve: ganzer Definitionsbereich gedimmt, das Integrationsintervall kräftig
  DOM.mainCurve.innerHTML = ''
  DOM.mainCurve.appendChild(el('polyline',
    { points: polyPoints(xs, ys, sx, sy), class: 'func-line-dim' }))
  const iFrom = xs.findIndex(x => x >= a)
  const iTo = xs.findIndex(x => x > b)
  DOM.mainCurve.appendChild(el('polyline', {
    points: polyPoints(xs, ys, sx, sy, Math.max(0, iFrom), iTo < 0 ? xs.length : iTo),
    class: 'func-line',
  }))

  // Integrationsgrenzen a und b
  const f = FUNCS[funcKey].f
  for (const [x, lab] of [[a, 'a'], [b, 'b']]) {
    DOM.mainCurve.appendChild(el('line',
      { x1: sx(x), y1: sy(0), x2: sx(x), y2: sy(f(x)), class: 'limit-line' }))
    const t = el('text', { x: sx(x), y: sy(0) + 34, 'text-anchor': 'middle', class: 'limit-label' })
    t.setAttribute('font-style', 'italic')
    t.textContent = lab
    DOM.mainCurve.appendChild(t)
  }

  // Funktionstitel: statisches MathJax im foreignObject, über dem Plotbereich
  DOM.mainTitleFo.setAttribute('x', 8)
  DOM.mainTitleFo.setAttribute('width', g.w - 16)
  for (const key of Object.keys(FUNCS)) {
    const node = document.getElementById(`title_${key}`)
    if (node) node.style.display = key === funcKey ? '' : 'none'
  }
}

// ── Hauptdarstellung: Streifen der Zerlegung (ändert sich mit n) ─────────────
// Zeichenreihenfolge ist didaktisch: erst die Obersummen-Rechtecke (ragen über
// die Kurve), darüber die Untersummen-Rechtecke (bleiben darunter). Was von der
// Obersummenfarbe übrig bleibt, ist genau die Einschachtelungs-Differenz O − U.
function drawStrips() {
  const S = store.mainScale
  if (!S) return
  const { funcKey, a, b, n } = store
  const st = strips(funcKey, a, b, n)
  const y0 = S.sy(0)
  const both = store.showOber && store.showUnter

  for (const g of [DOM.stripsOver, DOM.stripsUnder, DOM.stripsOutline, DOM.stripsMid]) g.innerHTML = ''

  const box = (x, w, yA, yB, cls) => el('rect', {
    x, y: Math.min(yA, yB), width: w, height: Math.abs(yB - yA), class: cls,
  })

  for (const s of st) {
    const xL = S.sx(s.xl)
    const w = Math.max(S.sx(s.xr) - xL, 0.4)
    const yLo = S.sy(s.lo), yHi = S.sy(s.hi)

    // Sind BEIDE Summen sichtbar, wird die Obersumme nur im Band zwischen
    // Infimum und Supremum gefüllt (= genau die Differenz O(n) − U(n)) und das
    // volle Rechteck bis zur Achse zusätzlich als Kontur gezogen. Sonst lägen
    // zwei halbtransparente Füllungen übereinander und die Untersummenfarbe
    // würde durch die darunterliegende Obersummenfüllung verfälscht.
    if (store.showOber) {
      DOM.stripsOver.appendChild(box(xL, w, yHi, both ? yLo : y0, 'strip-over'))
      if (both) DOM.stripsOutline.appendChild(box(xL, w, yHi, y0, 'strip-over-outline'))
    }
    if (store.showUnter) DOM.stripsUnder.appendChild(box(xL, w, yLo, y0, 'strip-under'))
    if (store.showMittel) DOM.stripsMid.appendChild(box(xL, w, S.sy(s.fm), y0, 'strip-mid'))
  }

  // Marker: Mittelpunkte auf der Kurve + Δx-Maßstrich am ersten Streifen
  DOM.mainMarks.innerHTML = ''
  if (store.showMittel && n <= N_MIDDOT_LIMIT)
    for (const s of st)
      DOM.mainMarks.appendChild(el('circle', { cx: S.sx(s.xm), cy: S.sy(s.fm), r: 2.6, class: 'mid-dot' }))

  if (n <= N_LABEL_LIMIT) {
    const s0 = st[0]
    const yb = y0 - 11
    const xl = S.sx(s0.xl), xr = S.sx(s0.xr), xm = (xl + xr) / 2
    DOM.mainMarks.appendChild(el('line', { x1: xl, y1: yb, x2: xr, y2: yb, class: 'dx-bar' }))
    for (const x of [xl, xr])
      DOM.mainMarks.appendChild(el('line', { x1: x, y1: yb - 4, x2: x, y2: yb + 4, class: 'dx-bar' }))
    DOM.mainMarks.appendChild(el('rect',
      { x: xm - 13, y: yb - 25, width: 26, height: 15, class: 'dx-label-bg' }))
    const lbl = el('text', { x: xm, y: yb - 14, 'text-anchor': 'middle', class: 'dx-label' })
    const sym = el('tspan', { 'font-style': 'italic' }); sym.textContent = 'Δx'
    lbl.appendChild(sym)
    DOM.mainMarks.appendChild(lbl)
  }
}

// ── Diagramm-Slots ───────────────────────────────────────────────────────────
export function drawGraphs() {
  const g = graphGeom()
  DOM.graphSvg.setAttribute('viewBox', `0 0 ${g.w} ${g.h}`)
  drawGraphSlot(1, store.graphType1, g, { x: 0, y: 0 })
  drawGraphSlot(2, store.graphType2, g, g.off2)
  // Hover-Cursor EINMALIG am Ende, nach beiden Slots (sonst zeichnete der
  // zweite Slot mit der Skala des Vorframes — Gotcha aus Anleitung §4).
  refreshHover()
}

function hideSlot(slot) {
  DOM.graphGroup[slot].innerHTML = ''
  DOM.graphGroup[slot].setAttribute('visibility', 'hidden')
  DOM.hoverGroup[slot].setAttribute('visibility', 'hidden')
  DOM.graphHitRect[slot].setAttribute('width', 0)
  DOM.graphHitRect[slot].setAttribute('height', 0)
  store.graphScale[slot] = null
  hideHover(slot)
}

function drawGraphSlot(slot, type, geom, off) {
  if (slot === 2 && !geom.dual) { hideSlot(slot); return }
  const group = DOM.graphGroup[slot]
  group.innerHTML = ''
  group.setAttribute('visibility', 'visible')
  group.setAttribute('transform', `translate(${off.x},${off.y})`)
  DOM.hoverGroup[slot].setAttribute('visibility', 'visible')
  DOM.hoverGroup[slot].setAttribute('transform', `translate(${off.x},${off.y})`)

  const plotW = geom.cellW - PAD_L - PAD_R
  const plotH = geom.cellH - PAD_T - PAD_B
  const built = type === 'integralfunktion'
    ? buildIntegralSlot(group, plotW, plotH)
    : buildKonvergenzSlot(group, plotW, plotH)

  // Titel als LETZTES Datenkind (z-Order-Konvention) — Hover-Overlay und
  // Hit-Rect liegen als Geschwister-Gruppen danach.
  // Titel klar ÜBER dem weißen Hintergrundrechteck (dessen Oberkante liegt bei
  // PAD_T − 26): Grundlinie PAD_T − 31 → Unterlänge endet ~5 px darüber.
  const title = el('text', { x: PAD_L + plotW / 2, y: PAD_T - 31,
    'text-anchor': 'middle', class: 'graph-title-text' })
  setGraphTitle(title, built.title)
  group.appendChild(title)

  // Hit-Rect aus denselben Lokalen wie die Skalen (nie hartkodiert)
  DOM.graphHitRect[slot].setAttribute('x', PAD_L)
  DOM.graphHitRect[slot].setAttribute('y', PAD_T)
  DOM.graphHitRect[slot].setAttribute('width', plotW)
  DOM.graphHitRect[slot].setAttribute('height', plotH)
  store.graphScale[slot] = { ...built, plotW, plotH, padL: PAD_L, padT: PAD_T }
}

// Konvergenz der Näherungen: U(n) steigt, O(n) fällt, beide → exakter Wert.
function buildKonvergenzSlot(group, plotW, plotH) {
  const { U_data, O_data, M_data, exact, n } = store
  const nView = Math.max(n, N_VIEW_MIN)

  const active = []
  // cls trägt den stroke (Linien/Punkte), tcls nur den fill (Tooltip-Text) —
  // ein Textelement darf NIE die stroke-tragende Klasse erben (Faux-Bold-Bug).
  if (store.showUnter)  active.push({ arr: U_data, cls: 'series-under', tcls: 'txt-under', sym: 'U' })
  if (store.showOber)   active.push({ arr: O_data, cls: 'series-over',  tcls: 'txt-over',  sym: 'O' })
  if (store.showMittel) active.push({ arr: M_data, cls: 'series-mid',   tcls: 'txt-mid',   sym: 'M' })

  let lo = exact, hi = exact
  for (const s of active)
    for (let k = 1; k <= nView; k++) { lo = Math.min(lo, s.arr[k]); hi = Math.max(hi, s.arr[k]) }
  const span = hi - lo || Math.max(Math.abs(exact) * 0.1, 1)
  const yMin = lo - span * 0.12
  const yMax = hi + span * 0.12

  const xStep = Math.max(1, Math.round(tAxisStep(nView)))
  const { sx, sy } = drawFrame(group, {
    plotW, plotH, padL: PAD_L, padT: PAD_T,
    xMin: 0, xMax: nView, yMin, yMax,
    xStep, xDec: 0, yStep: niceStepLE(yMax - yMin, 4),
    xLabel: 'n', yLabel: 'S(n)', markerId: 'graph-arrowhead',
  })

  // Grenzwert-Linie: der exakte Integralwert
  group.appendChild(el('line',
    { x1: sx(0), y1: sy(exact), x2: sx(nView), y2: sy(exact), class: 'exact-line' }))
  group.appendChild(txt({ x: sx(nView) - 4, y: sy(exact) - 7, 'text-anchor': 'end',
    class: 'exact-line-label' }, `exakt = ${fmt(exact, 4)}`))

  // Näherungsfolgen bis zur aktuellen Stufe
  for (const s of active) {
    let p = ''
    for (let k = 1; k <= nView; k++) p += `${sx(k).toFixed(2)},${sy(s.arr[k]).toFixed(2)} `
    group.appendChild(el('polyline', { points: p.trim(), class: `series-line ${s.cls}` }))
    group.appendChild(el('circle', { cx: sx(n), cy: sy(s.arr[n]), r: 4.5, class: `series-dot ${s.cls}` }))
  }

  const hoverAt = xv => {
    const k = clamp(Math.round(xv), 1, nView)
    const rows = [{ sym: 'n', rest: ` = ${k}` }]
    const pts = []
    for (const s of active) {
      rows.push({ sym: s.sym, rest: ` = ${fmt(s.arr[k], 4)}`, cls: s.tcls })
      pts.push({ y: sy(s.arr[k]), cls: s.cls })
    }
    rows.push({ sym: null, text: `∫ = ${fmt(exact, 4)}` })
    return { xv: k, rows, pts }
  }
  return { sx, sy, xMin: 0, xMax: nView, title: 'Konvergenz der Näherungen S(n)', hoverAt }
}

// Integralfunktion F(x) = ∫ₐˣ f dt — die kumulierten Teilsummen schachteln sie ein.
function buildIntegralSlot(group, plotW, plotH) {
  const { funcKey, a, b, n, exact } = store
  const cum = cumulative(funcKey, a, b, n)

  const NS_PTS = 240
  const fx = new Array(NS_PTS + 1), fy = new Array(NS_PTS + 1)
  for (let i = 0; i <= NS_PTS; i++) {
    const x = a + (i / NS_PTS) * (b - a)
    fx[i] = x
    fy[i] = integralFunction(funcKey, a, x)
  }

  let lo = 0, hi = 0
  for (const v of fy) { lo = Math.min(lo, v); hi = Math.max(hi, v) }
  if (store.showUnter) for (const v of cum.cumU) { lo = Math.min(lo, v); hi = Math.max(hi, v) }
  if (store.showOber)  for (const v of cum.cumO) { lo = Math.min(lo, v); hi = Math.max(hi, v) }
  const span = hi - lo || 1
  const yMin = Math.min(0, lo) - span * 0.08
  const yMax = hi + span * 0.12

  const { sx, sy } = drawFrame(group, {
    plotW, plotH, padL: PAD_L, padT: PAD_T,
    xMin: a, xMax: b, yMin, yMax,
    xStep: tAxisStep(b - a), yStep: niceStepLE(yMax - yMin, 4),
    xLabel: 'x', yLabel: 'F(x)', markerId: 'graph-arrowhead',
  })

  if (store.showUnter)
    group.appendChild(el('polyline',
      { points: polyPoints(cum.xs, cum.cumU, sx, sy), class: 'series-line series-under cum-line' }))
  if (store.showOber)
    group.appendChild(el('polyline',
      { points: polyPoints(cum.xs, cum.cumO, sx, sy), class: 'series-line series-over cum-line' }))
  if (store.showMittel)
    group.appendChild(el('polyline',
      { points: polyPoints(cum.xs, cum.cumM, sx, sy), class: 'series-line series-mid cum-line' }))
  group.appendChild(el('polyline',
    { points: polyPoints(fx, fy, sx, sy), class: 'series-line series-exact' }))
  group.appendChild(el('circle', { cx: sx(b), cy: sy(exact), r: 4.5, class: 'series-dot series-exact' }))

  const hoverAt = xv => {
    const x = clamp(xv, a, b)
    const rows = [{ sym: 'x', rest: ` = ${fmt(x, 3)}` }]
    const pts = []
    const Fv = integralFunction(funcKey, a, x)
    if (store.showUnter) {
      const v = interpolateAt(cum.xs, cum.cumU, x)
      rows.push({ sym: 'U', rest: ` = ${fmt(v, 4)}`, cls: 'txt-under' })
      pts.push({ y: sy(v), cls: 'series-under' })
    }
    rows.push({ sym: 'F', rest: `(x) = ${fmt(Fv, 4)}`, cls: 'txt-exact' })
    pts.push({ y: sy(Fv), cls: 'series-exact' })
    if (store.showOber) {
      const v = interpolateAt(cum.xs, cum.cumO, x)
      rows.push({ sym: 'O', rest: ` = ${fmt(v, 4)}`, cls: 'txt-over' })
      pts.push({ y: sy(v), cls: 'series-over' })
    }
    return { xv: x, rows, pts }
  }
  return { sx, sy, xMin: a, xMax: b, title: 'Integralfunktion F(x)', hoverAt }
}

// ── Hover-Werte (I13.1) ──────────────────────────────────────────────────────
// Pro Slot unabhängig: die beiden Diagramme haben UNTERSCHIEDLICHE Abszissen
// (Streifenzahl n bzw. Ortskoordinate x) — der synchronisierte Dual-Hover (I14)
// gilt ausdrücklich nur bei gemeinsamer Abszisse und greift hier nicht.
export function updateGraphHover(slot, localX) {
  if (localX === null) {
    if (store.hoverSlot === slot) {
      store.hoverSlot = null; store.hoverLocalX = null
      hideHover(1); hideHover(2)
    }
    return
  }
  store.hoverSlot = slot
  store.hoverLocalX = localX
  refreshHover()
}

function refreshHover() {
  const slot = store.hoverSlot
  if (!slot) return
  const gs = store.graphScale[slot]
  if (!gs) { hideHover(1); hideHover(2); return }
  hideHover(otherSlot(slot))
  const rel = clamp(store.hoverLocalX - gs.padL, 0, gs.plotW)
  const xv = gs.xMin + (rel / gs.plotW) * (gs.xMax - gs.xMin)
  drawHoverAt(slot, gs, gs.hoverAt(xv))
}

function drawHoverAt(slot, gs, h) {
  const xp = gs.sx(h.xv)
  DOM.hoverLine[slot].setAttribute('x1', xp)
  DOM.hoverLine[slot].setAttribute('x2', xp)
  DOM.hoverLine[slot].setAttribute('y1', gs.padT)
  DOM.hoverLine[slot].setAttribute('y2', gs.padT + gs.plotH)
  DOM.hoverLine[slot].setAttribute('visibility', 'visible')

  const pg = DOM.hoverPoints[slot]
  pg.innerHTML = ''
  for (const p of h.pts)
    pg.appendChild(el('circle', { cx: xp, cy: p.y, r: 6, class: `graph-hover-point ${p.cls}` }))
  pg.setAttribute('visibility', 'visible')

  renderTooltip(slot, gs, h.rows, xp)
}

function hideHover(slot) {
  DOM.hoverLine[slot].setAttribute('visibility', 'hidden')
  DOM.hoverPoints[slot].setAttribute('visibility', 'hidden')
  DOM.hoverTooltip[slot].setAttribute('visibility', 'hidden')
}

function renderTooltip(slot, gs, rows, xp) {
  const textEl = DOM.hoverTooltipText[slot]
  textEl.innerHTML = ''
  const lineH = 15
  rows.forEach((row, i) => {
    const line = el('tspan', { x: 8, y: 16 + i * lineH })
    if (row.cls) line.setAttribute('class', row.cls)
    if (row.sym) {
      const s = el('tspan', { 'font-style': 'italic' })
      s.textContent = row.sym
      line.appendChild(s)
      line.appendChild(document.createTextNode(row.rest))
    } else {
      line.textContent = row.text
    }
    textEl.appendChild(line)
  })
  const bbox = textEl.getBBox()
  const boxW = bbox.width + 16, boxH = bbox.height + 12
  DOM.hoverTooltipBg[slot].setAttribute('width', boxW)
  DOM.hoverTooltipBg[slot].setAttribute('height', boxH)
  const tx = clamp(xp + 12, gs.padL, gs.padL + gs.plotW - boxW)
  DOM.hoverTooltip[slot].setAttribute('transform', `translate(${tx}, ${gs.padT + 8})`)
  DOM.hoverTooltip[slot].setAttribute('visibility', 'visible')
}

// ── Werte-Overlay + Analyse-Panel ────────────────────────────────────────────
function updateReadouts() {
  const { n, a, b, exact, U_data, O_data, M_data } = store
  const U = U_data[n], O = O_data[n], M = M_data[n]
  const dx = (b - a) / n

  DOM.valueBox.style.display = store.showValues ? '' : 'none'
  if (store.showValues) {
    const parts = [`<i>n</i> = ${n}`, `<i>Δx</i> = ${fmt(dx, 4)}`]
    const chain = []
    if (store.showUnter) chain.push(`<span class="v-under"><i>U</i> = ${fmt(U, 4)}</span>`)
    chain.push(`<span class="v-exact">∫ = ${fmt(exact, 4)}</span>`)
    if (store.showOber) chain.push(`<span class="v-over"><i>O</i> = ${fmt(O, 4)}</span>`)
    const chainStr = store.showUnter && store.showOber ? chain.join(' &le; ') : chain.join(' · ')
    const mid = store.showMittel ? `<div><span class="v-mid"><i>M</i> = ${fmt(M, 4)}</span></div>` : ''
    DOM.valueBox.innerHTML = `<div>${parts.join(' &nbsp;·&nbsp; ')}</div><div>${chainStr}</div>${mid}`
  }

  DOM.anN.textContent = String(n)
  DOM.anDx.textContent = fmt(dx, 4)
  DOM.anU.textContent = fmt(U, 5)
  DOM.anO.textContent = fmt(O, 5)
  DOM.anM.textContent = store.showMittel ? fmt(M, 5) : '—'
  DOM.anSpan.textContent = fmt(O - U, 5)
  DOM.anExact.textContent = fmt(exact, 5)
  DOM.anErrU.textContent = fmt(Math.abs(U - exact), 5)
  DOM.anErrO.textContent = fmt(Math.abs(O - exact), 5)
  DOM.anErrM.textContent = store.showMittel ? fmt(Math.abs(M - exact), 5) : '—'
}

// ── updateScene(n): alles, was sich mit der Verfeinerungsstufe ändert ────────
// Rechnet keine Näherungsfolgen — die stehen aus precompute() bereit; nur die
// Streifen-Geometrie zur aktuellen Stufe wird aufgebaut.
export function updateScene() {
  drawStrips()
  drawGraphs()
  updateReadouts()
}
