'use strict'
// Rendering: liest NUR die Szene und schreibt SVG-Attribute bzw. die
// dynamischen Zahlen der Folienkarten. Keine Logik, keine Zeit.
// initStage() baut alle Elemente einmal, renderScene() läuft pro Frame.

import {
  svgEl, viewOf, createAxis, createPool, readSlots, clamp, lerp, smooth, backOut,
} from '../../shared/js/step-kit.js'
import { fmt } from '../../shared/js/format.js'
import { TEXTS, TAPE, ROD, READING_Y } from './constants.js'
import { DYN } from './content.js'
import { HITS } from './state.js'

const E = {}
const FAR = 4000                // Koordinaten weit außerhalb der Sicht kappen (SVG-Präzision)
const LEVELS = [0, 1, 2, 3]

const text = (parent, cls, attrs = {}) => svgEl('text', { class: cls, ...attrs }, parent)
const set = (el, attrs) => { for (const k in attrs) el.setAttribute(k, attrs[k]) }
const op = (el, a) => { el.style.opacity = a; el.style.display = a <= 0.002 ? 'none' : '' }

// <text>: kursives Symbol + aufrechter Rest (Repo-Konvention Größen kursiv)
function symbolLabel(parent, cls, sym, attrs) {
  const t = text(parent, cls, attrs)
  svgEl('tspan', { class: 'sym' }, t).textContent = sym
  const val = svgEl('tspan', {}, t)
  return { t, val }
}
// „A_min": kursives A, tiefgestelltes aufrechtes „min" (dy statt baseline-shift → Firefox)
function subLabel(parent, cls, sym, sub, attrs) {
  const t = text(parent, cls, attrs)
  svgEl('tspan', { class: 'sym' }, t).textContent = sym
  svgEl('tspan', { dy: 7, 'font-size': '72%' }, t).textContent = sub
  return t
}
function gradient(defs, id, stops, vertical = true) {
  const g = svgEl('linearGradient', { id, x1: 0, y1: 0, x2: vertical ? 0 : 1, y2: vertical ? 1 : 0 }, defs)
  stops.forEach(([o, cls]) => svgEl('stop', { offset: o, class: cls }, g))
}

export function initStage(svg, DOM) {
  E.DOM = DOM
  const defs = svgEl('defs', {}, svg)
  gradient(defs, 'grad_l', [[0, 'gl-edge'], [0.5, 'gl-mid'], [1, 'gl-edge']])
  gradient(defs, 'grad_rod', [[0, 'rod-hi'], [0.35, 'rod-mid'], [1, 'rod-lo']])
  gradient(defs, 'grad_tape', [[0, 'tape-hi'], [1, 'tape-lo']])
  const clip = svgEl('clipPath', { id: 'plot_clip' }, defs)
  E.clipRect = svgEl('rect', {}, clip)

  E.root = svgEl('g', {}, svg)

  // ── Maßband und Stangen ──
  E.tape = svgEl('g', { class: 'tape' }, E.root)
  E.tapeBody = svgEl('rect', { class: 'tape-body', rx: 4 }, E.tape)
  E.tapeHook = svgEl('rect', { class: 'tape-hook', rx: 2 }, E.tape)
  E.tapeMarks = createPool(svgEl('g', {}, E.tape), () => svgEl('line', { class: 'tape-mark' }))
  E.tapeLabels = createPool(svgEl('g', {}, E.tape), () => svgEl('text', { class: 'tape-label', 'text-anchor': 'middle' }))
  E.rods = ROD.map(() => {
    const g = svgEl('g', { class: 'rod' }, E.root)
    return { g, body: svgEl('rect', { class: 'rod-body', rx: 3 }, g), cap: svgEl('rect', { class: 'rod-cap', rx: 1.5 }, g) }
  })
  E.rdCaret = svgEl('path', { class: 'reading-caret' }, E.root)
  E.rd = [0, 1].map(() => {
    const t = text(E.root, 'reading', { 'text-anchor': 'middle' })
    svgEl('tspan', { class: 'reading-pre' }, t).textContent = 'abgelesen: '
    return { t, val: svgEl('tspan', {}, t) }
  })

  // ── Pfeil „wahre Länge" (unter der Achse, damit Tick-Labels darüber liegen) ──
  E.arrow = svgEl('g', { class: 'true-arrow' }, E.root)
  E.arLine = svgEl('line', {}, E.arrow)
  E.arHead = svgEl('path', {}, E.arrow)
  E.ping = svgEl('circle', { class: 'ping' }, E.root)

  // ── Plot (geclippt): Bänder, Rechteck, Flächenbereich ──
  const plot = svgEl('g', { 'clip-path': 'url(#plot_clip)' }, E.root)
  E.bStrip = svgEl('rect', { class: 'strip-b' }, plot)
  E.lStrip = svgEl('rect', { class: 'strip-l' }, plot)
  E.lEdge = [0, 1].map(() => svgEl('line', { class: 'strip-edge-l' }, plot))
  E.bEdge = [0, 1].map(() => svgEl('line', { class: 'strip-edge-b' }, plot))
  E.ghost = svgEl('rect', { class: 'band-ghost', rx: 4 }, plot)
  E.lBand = svgEl('rect', { class: 'band-l', rx: 4 }, plot)
  E.rectFill = svgEl('rect', { class: 'area-fill' }, plot)
  E.region = svgEl('path', { class: 'area-region', 'fill-rule': 'evenodd' }, plot)
  E.minRect = svgEl('rect', { class: 'area-bound' }, plot)
  E.maxRect = svgEl('rect', { class: 'area-bound' }, plot)
  E.rectStroke = svgEl('rect', { class: 'area-stroke' }, plot)
  E.aSym = text(plot, 'area-sym', { 'text-anchor': 'middle', 'dominant-baseline': 'middle' })
  E.aSym.textContent = 'A'
  E.dl = [0, 1].map(() => symbolLabel(plot, 'dim-label dim-l', 'l', { 'text-anchor': 'middle' }))
  E.db = [0, 1].map(() => symbolLabel(plot, 'dim-label dim-b', 'b', { 'text-anchor': 'start' }))

  E.xAxis = createAxis(E.root, 'x')
  E.yAxis = createAxis(E.root, 'y', { skipZero: true })
  E.nameL = text(E.root, 'axis-name', { 'text-anchor': 'start' })
  E.nameL.textContent = 'l'
  E.nameB = text(E.root, 'axis-name', { 'text-anchor': 'middle' })
  E.nameB.textContent = 'b'

  E.tagMin = subLabel(E.root, 'area-tag', 'A', 'min', { 'text-anchor': 'end' })
  E.tagMax = subLabel(E.root, 'area-tag', 'A', 'max', { 'text-anchor': 'start' })

  E.endLo = svgEl('circle', { class: 'end-closed', r: 6.5 }, E.root)
  E.endHi = svgEl('circle', { class: 'end-open', r: 6.5 }, E.root)
  E.bndLo = text(E.root, 'bound-label', { 'text-anchor': 'end' })
  E.bndHi = text(E.root, 'bound-label', { 'text-anchor': 'start' })
  E.hits = Array.from({ length: HITS }, () => svgEl('circle', { class: 'hit', r: 5.5 }, E.root))
  E.pHalo = svgEl('circle', { class: 'halo-l' }, E.root)
  E.pDot = svgEl('circle', { class: 'dot-l' }, E.root)
  E.pl = [0, 1].map(() => text(E.root, 'value-label val-l', { 'text-anchor': 'middle' }))
  E.qHalo = svgEl('circle', { class: 'halo-b' }, E.root)
  E.qDot = svgEl('circle', { class: 'dot-b' }, E.root)
  E.ql = [0, 1].map(() => text(E.root, 'value-label val-b', { 'text-anchor': 'start' }))
  E.ro = text(E.root, 'readout', { 'text-anchor': 'start' })
  svgEl('tspan', { class: 'sym' }, E.ro).textContent = 'l'
  svgEl('tspan', {}, E.ro).textContent = ' · '
  svgEl('tspan', { class: 'sym' }, E.ro).textContent = 'b'
  E.roVal = svgEl('tspan', {}, E.ro)
}

function rectWorld(el, V, x0, y0, x1, y1) {
  const a = clamp(V.sx(Math.min(x0, x1)), V.L - FAR, V.R + FAR)
  const b = clamp(V.sx(Math.max(x0, x1)), V.L - FAR, V.R + FAR)
  const c = clamp(V.sy(Math.max(y0, y1)), V.T - FAR, V.B + FAR)
  const d = clamp(V.sy(Math.min(y0, y1)), V.T - FAR, V.B + FAR)
  set(el, { x: a, y: c, width: Math.max(0, b - a), height: Math.max(0, d - c) })
}

// Maßband-Teilung: je Stufe k Striche im Abstand 10^-k, wachsen gestaffelt
// vom Stangenende aus; gröbere Striche sind länger. Beschriftung, sobald Platz ist.
function renderTape(S, V, top) {
  const marks = new Map()
  const half = (V.x1 - V.x0) / 2
  for (const k of LEVELS) {
    const g = S['tg' + k]
    const step = 10 ** -k
    if (g <= 0.002 || (V.x1 - V.x0) / step > 500) continue
    const px = step * V.kx
    const dens = smooth(4, 10, px), labD = smooth(38, 56, px)
    for (let i = Math.max(0, Math.ceil(V.x0 / step - 1e-9)); i * step <= V.x1 + 1e-12; i++) {
      const v = i * step
      const t = clamp((g * 1.5 - Math.min(1, Math.abs(v - S.rod0) / half)) / 0.5, 0, 1)
      if (t <= 0) continue
      const len = (22 - 4 * k) * backOut(t), mo = dens * Math.min(1, 2 * t)
      const la = labD * clamp((t - 0.4) / 0.6, 0, 1)
      const key = v.toFixed(9)
      const m = marks.get(key)
      if (!m) marks.set(key, { v, len, mo, la, dec: k })
      else {
        m.len = Math.max(m.len, len); m.mo = Math.max(m.mo, mo)
        if (la > m.la + 1e-6 || (la >= m.la - 1e-6 && k > m.dec)) { m.la = la; m.dec = k }
      }
    }
  }
  E.tapeMarks.begin(); E.tapeLabels.begin()
  for (const m of marks.values()) {
    const x = V.sx(m.v)
    if (x < V.L - 30 || x > V.R + 30 || m.mo < 0.01) continue
    const ln = E.tapeMarks.next()
    set(ln, { x1: x, x2: x, y1: top, y2: top + m.len }); ln.style.opacity = m.mo
    if (m.la < 0.01) continue
    const lb = E.tapeLabels.next()
    set(lb, { x, y: top + TAPE.h - 7 }); lb.textContent = fmt(m.v, m.dec); lb.style.opacity = m.la
  }
  E.tapeMarks.end(); E.tapeLabels.end()
}

let dynKey = '', dynAlpha = -1

export function renderScene(S) {
  const V = viewOf(S)
  E.root.style.opacity = 1 - 0.62 * S.dim
  set(E.clipRect, { x: V.L - 1, y: V.T - 1, width: V.R - V.L + 2, height: V.B - V.T + 2 })
  const axY = clamp(V.sy(0), V.T, V.B)
  const axX = clamp(V.sx(0), V.L, V.R)

  // ── Maßband ──
  const top = TAPE.top + S.tapeY
  op(E.tape, S.tapeA)
  if (S.tapeA > 0.002) {
    const x0 = clamp(V.sx(0), V.L - 80, V.R + 80)
    set(E.tapeBody, { x: x0 - 10, y: top, width: Math.max(0, V.R + 80 - x0), height: TAPE.h })
    set(E.tapeHook, { x: x0 - 14, y: top - 6, width: 8, height: TAPE.h + 6 })
    renderTape(S, V, top)
  }
  // ── Stangen ──
  ;[0, 1].forEach(i => {
    const R = E.rods[i], len = S[`rod${i}`], sh = S[`rod${i}S`]
    op(R.g, S[`rod${i}A`])
    const a = clamp(V.sx(sh), V.L - FAR, V.R + FAR), b = clamp(V.sx(sh + len), V.L - FAR, V.R + FAR)
    set(R.body, { x: a, y: ROD[i].top + S.tapeY, width: Math.max(0, b - a), height: ROD[i].h })
    set(R.cap, { x: b - 3, y: ROD[i].top + S.tapeY - 2, width: 3, height: ROD[i].h + 4 })
  })
  // ── Ablesung ──
  const rx = V.sx(S.rdX)
  set(E.rdCaret, { d: `M${rx - 7} ${top + TAPE.h + 14}L${rx} ${top + TAPE.h + 5}L${rx + 7} ${top + TAPE.h + 14}Z` })
  op(E.rdCaret, S.rdA)
  readSlots(S, 'rd').forEach((s, n) => {
    set(E.rd[n].t, { x: rx, y: READING_Y + S.tapeY + s.o }); E.rd[n].val.textContent = TEXTS[s.i]
    op(E.rd[n].t, s.a * S.rdA)
  })

  // ── Pfeil „wahre Länge" ──
  const ax = V.sx(S.rod0), y0 = ROD[0].top + S.tapeY - 3, y1 = axY + 4
  const tip = lerp(y0, y1, S.arD)
  op(E.arrow, S.arA * smooth(0, 0.06, S.arD))
  set(E.arLine, { x1: ax, x2: ax, y1: y0, y2: Math.min(y0, tip + 9) })
  set(E.arHead, { d: `M${ax - 7} ${tip + 13}L${ax} ${tip}L${ax + 7} ${tip + 13}Z` })
  set(E.ping, { cx: ax, cy: axY, r: 6 + 20 * S.ping }); op(E.ping, S.arA * (1 - S.ping) * 0.9)

  // ── Achsen ──
  E.xAxis.render(V, {
    at: axY, draw: S.axisDraw, ticks: S.xTicks,
    fixed: LEVELS.map(k => ({ step: 0.5 * 10 ** -k, grow: S['ag' + k], center: 3 })),
  })
  E.yAxis.render(V, { at: axX, draw: S.yDraw, alpha: S.yAlpha, ticks: S.yAlpha })
  set(E.nameL, { x: V.R + 30, y: axY + 7 }); op(E.nameL, S.names)
  set(E.nameB, { x: axX, y: V.T - 34 }); op(E.nameB, S.names)

  // ── Intervall l: kompaktes Band auf der Zahlengeraden ↔ Streifen im 2D-Teil ──
  const x0 = V.sx(S.lLo), x1 = V.sx(S.lHi)
  const lw = Math.max(1.5, x1 - x0), lm = (x0 + x1) / 2
  const bt = lerp(axY - 20, V.T, S.lSpan), bb = lerp(axY + 20, axY, S.lSpan)
  set(E.lBand, { x: lm - lw / 2, y: axY - 20, width: lw, height: 40 })
  op(E.lBand, S.lA * (1 - S.lSpan))
  set(E.lStrip, { x: lm - lw / 2, y: bt, width: lw, height: Math.max(0, bb - bt) })
  op(E.lStrip, S.lA * S.lSpan * S.stripA)
  const edgeA = S.lA * S.lSpan * Math.min(1, (lw - 4) / 20)
  E.lEdge.forEach((ln, i) => {
    const x = i ? x1 : x0
    set(ln, { x1: x, x2: x, y1: bt, y2: bb }); op(ln, Math.max(0, edgeA))
  })
  const g0 = clamp(V.sx(S.gLo), V.L - FAR, V.R + FAR), g1 = clamp(V.sx(S.gHi), V.L - FAR, V.R + FAR)
  set(E.ghost, { x: g0, y: axY - 20, width: Math.max(0, g1 - g0), height: 40 })
  op(E.ghost, S.gA * (1 - S.lSpan))
  const endA = S.lA * S.lEndA * (1 - S.lSpan)
  set(E.endLo, { cx: x0, cy: axY }); op(E.endLo, endA)
  set(E.endHi, { cx: x1, cy: axY }); op(E.endHi, endA)
  const dec = Math.round(S.lBndD)
  set(E.bndLo, { x: x0 - 9, y: axY - 30 }); E.bndLo.textContent = fmt(S.lLo, dec); op(E.bndLo, S.lBndA)
  set(E.bndHi, { x: x1 + 9, y: axY - 30 }); E.bndHi.textContent = fmt(S.lHi, dec); op(E.bndHi, S.lBndA)

  // ── Treffer (wahre Werte) — auf der Achse bzw. an der Rechteckecke ──
  E.hits.forEach((c, i) => {
    set(c, { cx: V.sx(S[`h${i}x`]), cy: V.sy(S[`h${i}y`]) }); op(c, S[`h${i}a`])
  })

  // ── Messpunkte mit Wertelabel ──
  const px = V.sx(3)
  set(E.pHalo, { cx: px, cy: axY, r: 22 * S.pS }); op(E.pHalo, S.pA)
  set(E.pDot, { cx: px, cy: axY, r: 8 * S.pS }); op(E.pDot, S.pA)
  readSlots(S, 'pl').forEach((s, n) => {
    set(E.pl[n], { x: px, y: axY - 52 + s.o }); E.pl[n].textContent = TEXTS[s.i]; op(E.pl[n], s.a)
  })
  const qy = V.sy(2)
  set(E.qHalo, { cx: axX, cy: qy, r: 22 * S.qS }); op(E.qHalo, S.qA)
  set(E.qDot, { cx: axX, cy: qy, r: 8 * S.qS }); op(E.qDot, S.qA)
  readSlots(S, 'ql').forEach((s, n) => {
    set(E.ql[n], { x: axX + 24, y: qy - 16 + s.o }); E.ql[n].textContent = TEXTS[s.i]; op(E.ql[n], s.a)
  })

  // ── Intervall b als waagrechter Streifen ──
  const yb0 = V.sy(S.bHi), yb1 = V.sy(S.bLo)
  const bh = Math.max(1.5, yb1 - yb0), bm = (yb0 + yb1) / 2
  set(E.bStrip, { x: axX, y: bm - bh / 2, width: Math.max(0, V.R - axX), height: bh })
  op(E.bStrip, S.bA * S.stripA)
  const bEdgeA = S.bA * Math.min(1, (bh - 4) / 20)
  E.bEdge.forEach((ln, i) => {
    const y = i ? yb1 : yb0
    set(ln, { x1: axX, x2: V.R, y1: y, y2: y }); op(ln, Math.max(0, bEdgeA))
  })

  // ── Rechteck, Flächenbereich ──
  rectWorld(E.rectFill, V, 0, 0, S.rW, S.rH); op(E.rectFill, S.rA)
  rectWorld(E.rectStroke, V, 0, 0, S.rW, S.rH); op(E.rectStroke, S.rA)
  rectWorld(E.minRect, V, 0, 0, S.lLo, S.bLo); op(E.minRect, S.uA)
  rectWorld(E.maxRect, V, 0, 0, S.lHi, S.bHi); op(E.maxRect, S.uA)
  const cx = v => clamp(V.sx(v), V.L - FAR, V.R + FAR), cy = v => clamp(V.sy(v), V.T - FAR, V.B + FAR)
  const [ox, oy, ix, iy, mx, my] = [cx(0), cy(0), cx(S.lLo), cy(S.bLo), cx(S.lHi), cy(S.bHi)]
  E.region.setAttribute('d', `M${ox} ${oy}H${mx}V${my}H${ox}ZM${ox} ${oy}H${ix}V${iy}H${ox}Z`)
  op(E.region, S.uA)
  set(E.tagMin, { x: ix - 10, y: iy + 28 }); op(E.tagMin, S.uTagA)
  set(E.tagMax, { x: mx + 10, y: my - 12 }); op(E.tagMax, S.uTagA)
  set(E.aSym, { x: V.sx(S.rW / 2), y: V.sy(S.rH / 2) }); op(E.aSym, S.aSym)
  readSlots(S, 'dl').forEach((s, n) => {
    set(E.dl[n].t, { x: V.sx(S.rW / 2), y: V.sy(0) - 22 + s.o })
    E.dl[n].val.textContent = ' = ' + TEXTS[s.i] + ' m'; op(E.dl[n].t, s.a)
  })
  readSlots(S, 'db').forEach((s, n) => {
    set(E.db[n].t, { x: V.sx(0) + 18, y: V.sy(S.rH / 2) + 8 + s.o })
    E.db[n].val.textContent = ' = ' + TEXTS[s.i] + ' m'; op(E.db[n].t, s.a)
  })
  // Live-Produkt an der wandernden Ecke („Taschenrechner")
  set(E.ro, { x: Math.min(cx(S.rW) + 14, V.R - 150), y: Math.max(cy(S.rH) - 16, V.T + 20) })
  E.roVal.textContent = ' = ' + fmt(S.rW * S.rH, Math.round(S.roD)) + ' m²'
  op(E.ro, S.roA)

  // ── Dynamische Zahlen in den Folienkarten ──
  const key = `${Math.round(S.lvl)}|${Math.round(S.cmb)}`
  if (key !== dynKey) {
    dynKey = key
    for (const el of E.DOM.dyn) {
      const [grp, field] = el.dataset.dyn.split('.')
      el.textContent = DYN[grp][Math.round(S[grp])][field]
    }
  }
  if (S.dynA !== dynAlpha) {
    dynAlpha = S.dynA
    for (const el of E.DOM.dyn) el.style.opacity = S.dynA
  }
}
