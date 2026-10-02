'use strict'
// Rendering Kapitel „Addition": liest NUR die Szene und schreibt SVG-Attribute.
// Werkbank (Maßband, Werkstücke mit Etiketten, Lupe) und Steckbrief in festen
// Bildschirmkoordinaten; unten eine Zahlengerade mit Kamera für die Auswertung.

import { svgEl, viewOf, createAxis, clamp } from '../../../shared/js/step-kit.js'
import { fmt } from '../../../shared/js/format.js'
import { placeName } from '../model.js'
import { createDigitRow, createUnitBracket, verdict } from '../stellen.js'
import {
  xOf, K, LANE, ROD_H, TAPE, LOUPE, TABLE, AXIS_Y, BAND_Y, DIGITS, CAND_Y, VERDICT_Y, B_TRUE,
} from './constants.js'
import { SUM, ROWS, CANDS, LUPE } from './content.js'

const E = {}
const set = (el, attrs) => { for (const k in attrs) el.setAttribute(k, attrs[k]) }
const op = (el, a) => { el.style.opacity = a; el.style.display = a <= 0.002 ? 'none' : '' }
const text = (parent, cls, attrs = {}, content) => {
  const t = svgEl('text', { class: cls, ...attrs }, parent)
  if (content !== undefined) t.textContent = content
  return t
}
// Text mit markierter letzter Ziffer (= unsichere Stelle)
// at: Index der unsicheren Ziffer (Standard: letzte Ziffer; bei „4 · 10² mm" die 4)
function marked(parent, cls, attrs, str, at) {
  const t = svgEl('text', { class: cls, ...attrs }, parent)
  setMarked(t, str, at)
  return t
}
function setMarked(t, str, at) {
  if (t._mk === str) return
  t._mk = str
  t.textContent = ''
  const i = at ?? str.search(/\d(?=\D*$)/)
  t.append(str.slice(0, i))
  svgEl('tspan', { class: 'unc-digit' }, t).textContent = str[i]
  t.append(str.slice(i + 1))
}
const subLabel = (parent, cls, sym, sub, attrs) => {
  const t = text(parent, cls, attrs)
  svgEl('tspan', { class: 'sym' }, t).textContent = sym
  svgEl('tspan', { dy: 5, 'font-size': '72%' }, t).textContent = sub
  return svgEl('tspan', { dy: -5 }, t)
}

function buildTape(root) {
  E.tape = svgEl('g', { class: 'tape' }, root)
  const { top, h, len } = TAPE
  svgEl('rect', { class: 'tape-body', x: xOf(0) - 10, y: top, width: len * K + 20, height: h, rx: 4 }, E.tape)
  svgEl('rect', { class: 'tape-hook', x: xOf(0) - 14, y: top - 6, width: 8, height: h + 6, rx: 2 }, E.tape)
  E.zone = svgEl('rect', { class: 'zone', x: xOf(0.35), y: top, width: 0.1 * K, height: h }, E.tape)
  E.zoneEdge = [0.35, 0.45].map(s => svgEl('line', { class: 'zone-edge', x1: xOf(s), x2: xOf(s), y1: top - 8, y2: top + h + 8 }, E.tape))
  E.dm = svgEl('g', {}, E.tape)
  E.cm = svgEl('g', {}, E.tape)
  for (let n = 0; n <= Math.round(len * 100); n++) {
    const x = xOf(n / 100)
    if (n % 10 === 0) {
      svgEl('line', { class: 'tape-mark', x1: x, x2: x, y1: top, y2: top + 16 }, E.dm)
      text(E.dm, 'tape-label', { x, y: top + h - 6, 'text-anchor': 'middle' }, fmt(n / 100, 1))
    } else {
      svgEl('line', { class: 'tape-mark', x1: x, x2: x, y1: top, y2: top + (n % 5 ? 6 : 10) }, E.cm)
    }
  }
}

// Lupe am Ende von B: Millimeter-Teilung, Ablesebereich, Kante von B
function buildLoupe(root) {
  const { cx, cy, r, k } = LOUPE
  E.loupe = svgEl('g', { class: 'loupe' }, root)
  svgEl('line', { class: 'loupe-con', x1: cx, y1: cy - r, x2: xOf(B_TRUE), y2: TAPE.top + TAPE.h }, E.loupe)
  const clip = svgEl('clipPath', { id: 'add_loupe_clip' }, E.defs)
  svgEl('circle', { cx, cy, r }, clip)
  const g = svgEl('g', { 'clip-path': 'url(#add_loupe_clip)' }, E.loupe)
  svgEl('circle', { class: 'loupe-bg', cx, cy, r }, g)
  const lx = s => cx + (s - 1.253) * k
  const top = cy - 4, h = 34
  svgEl('rect', { class: 'wp-b', x: cx - r, y: cy - 30, width: lx(B_TRUE) - (cx - r), height: 24 }, g)
  svgEl('rect', { class: 'tape-body', x: cx - r, y: top, width: 2 * r, height: h }, g)
  E.lzA = svgEl('rect', { class: 'zone', x: lx(1.2525), y: top, width: 0.001 * k, height: h }, g)
  for (let n = 1240; n <= 1266; n++) {
    const x = lx(n / 1000), l = n % 10 ? (n % 5 ? 8 : 12) : 18
    svgEl('line', { class: 'tape-mark', x1: x, x2: x, y1: top, y2: top + l }, g)
    if (n % 10 === 0) text(g, 'tape-label loupe-label', { x, y: top + h - 3, 'text-anchor': 'middle' }, fmt(n / 1000, 2))
  }
  svgEl('line', { class: 'finish-guide', x1: lx(B_TRUE), x2: lx(B_TRUE), y1: cy - r, y2: top + h }, g)
  svgEl('circle', { class: 'loupe-frame', cx, cy, r }, E.loupe)
}

function buildTag(root) {
  const g = svgEl('g', { class: 'tag' }, root)
  svgEl('rect', { x: -40, y: -12, width: 80, height: 24, rx: 4 }, g)
  const t = text(g, 'tag-text', { 'text-anchor': 'middle', y: 6 })
  return { g, t }
}

function buildTable(root) {
  E.table = svgEl('g', { class: 'proto' }, root)
  const x = TABLE.x, y0 = TABLE.y0
  E.tHead = svgEl('g', {}, E.table)
  E.hi = {}
  for (const [k, col] of [['S', 4], ['N', 5], ['U', 3]]) {
    E.hi[k] = svgEl('rect', { class: 'col-hi', x: x[col] - 8, y: y0 - 38, width: col === 3 ? 124 : 82,
      height: TABLE.dy * 3 + 52, rx: 8 }, E.table)
  }
  ;[['Steckbrief', 0], ['Etikett', 1], ['Intervall', 2], ['Unsicherheit', 3], ['signif.|Stellen', 4], ['Nach-|komma', 5]]
    .forEach(([h, c]) => h.split('|').forEach((line, n, a) =>
      text(E.tHead, c ? 'proto-colhead' : 'proto-head', { x: x[c], y: y0 - (a.length - 1 - n) * 15 }, line)))
  svgEl('line', { class: 'proto-rule', x1: x[0], x2: 730, y1: y0 + 9, y2: y0 + 9 }, E.tHead)
  E.rows = ROWS.map((r, i) => {
    const g = svgEl('g', {}, E.table), y = y0 + TABLE.dy * (i + 1)
    text(g, `proto-name ${['val-a', 'val-b', 'val-c'][i]}`, { x: x[0], y }, r.name)
    marked(g, 'proto-cell', { x: x[1], y }, r.tag)
    text(g, 'proto-small', { x: x[2], y }, r.iv)
    text(g, 'proto-small', { x: x[3], y }, r.pm)
    text(g, 'proto-cell', { x: x[4] + 20, y }, r.sig)
    text(g, 'proto-cell', { x: x[5] + 20, y }, r.dec)
    return g
  })
}

export function initAddStage(svg) {
  E.defs = svgEl('defs', {}, svg)
  E.root = svgEl('g', { class: 'add-stage' }, svg)
  buildTable(E.root)
  buildTape(E.root)
  // Bereiche der Kette (hinter den Werkstücken)
  E.zAe = svgEl('rect', { class: 'chain-zone-a', x: xOf(0.35), width: 0.1 * K, rx: 3 }, E.root)
  E.zEnd = svgEl('rect', { class: 'chain-zone', x: xOf(SUM.lo), width: (SUM.hi - SUM.lo) * K, rx: 3 }, E.root)
  E.rodA = svgEl('rect', { class: 'rod-body', height: ROD_H, rx: 3 }, E.root)
  E.rodB = svgEl('rect', { class: 'wp-b', height: ROD_H, rx: 3 }, E.root)
  E.tagA = buildTag(E.root)
  E.tagB = buildTag(E.root)
  E.lm = [['min', SUM.lo, 'end'], ['max', SUM.hi, 'start']].map(([sub, v, anchor]) => {
    const val = subLabel(E.root, 'chain-label', 'L', sub, { 'text-anchor': anchor })
    val.textContent = ` = ${fmt(v, 4)} m`
    return val.parentNode
  })
  buildLoupe(E.root)

  // Auswertung: Zahlengerade, Band der Summe, Klammern, Ziffern, Urteil
  E.axis = createAxis(E.root, 'x')
  E.axName = text(E.root, 'axis-name-sm', { 'text-anchor': 'start' })
  svgEl('tspan', { class: 'sym' }, E.axName).textContent = 'L'
  svgEl('tspan', {}, E.axName).textContent = ' / m'
  E.band = svgEl('rect', { class: 'lupe-band', height: 14, rx: 3 }, E.root)
  E.bandLbl = text(E.root, 'band-label', { 'text-anchor': 'middle' }, 'mögliche Gesamtlängen')
  E.bracket = createUnitBracket(E.root)
  E.cBracket = createUnitBracket(E.root)
  E.digits = createDigitRow(E.root, { size: DIGITS.size })
  E.cand = text(E.root, 'cand-big', { x: DIGITS.x, y: DIGITS.y })
  E.cands = CANDS.map((c, i) => text(E.root, `cand-small ${c.ok ? 'ok' : 'bad'}`,
    { x: DIGITS.x + 130 * i, y: CAND_Y }, `${c.text} ${c.ok ? '✓' : '✗'}`))
  E.verdict = text(E.root, 'verdict', { x: 112, y: VERDICT_Y })
  // Rechnung in mm
  E.units = [
    ['0,4 m = 4 · 10² mm', '   (nicht „400 mm" – das täuschte mm-Genauigkeit vor)', 8],
    ['1,253 m = 1253 mm', ''],
    ['Summe: 1653 mm → 1,7 · 10³ mm = 1,7 m', ''],
  ].map(([main, note, at], i) => {
    const t = marked(E.root, 'unit-line', { x: 112, y: 548 + 38 * i }, main, at)
    if (note) svgEl('tspan', { class: 'unit-note' }, t).textContent = note
    return t
  })
  return E.root
}

function renderBench(S) {
  op(E.tape, S.tpA)
  op(E.dm, S.tdA); op(E.cm, S.tdB)
  op(E.zone, S.zA); E.zoneEdge.forEach(l => op(l, S.zA))
  const rod = (el, a, x, y, L) => {
    set(el, { x: xOf(x), y, width: Math.max(0, L * K) }); op(el, a)
  }
  rod(E.rodA, S.aA, S.aX, S.aY, S.aL)
  rod(E.rodB, S.bA, S.bX, S.bY, S.bL)
  const tag = (T, a, s, x, L, y, str) => {
    op(T.g, a)
    if (a <= 0.002) return
    const sc = 1.7 - 0.7 * s, rot = (1 - s) * -8 - 2
    T.g.setAttribute('transform', `translate(${xOf(x + L / 2)} ${y + ROD_H / 2}) rotate(${rot}) scale(${sc})`)
    setMarked(T.t, str)
  }
  tag(E.tagA, S.tgA, S.tgAs, S.aX, S.aL, S.aY, ROWS[0].tag)
  tag(E.tagB, S.tgB, S.tgBs, S.bX, S.bL, S.bY, ROWS[1].tag)
  set(E.zAe, { y: LANE.low - 6, height: ROD_H + 12 }); op(E.zAe, S.zAe)
  set(E.zEnd, { y: LANE.low - 6, height: TAPE.top + TAPE.h - LANE.low + 6 }); op(E.zEnd, S.zEnd)
  set(E.lm[0], { x: xOf(SUM.lo) - 6, y: TAPE.top + TAPE.h + 20 }); op(E.lm[0], S.lmMin)
  set(E.lm[1], { x: xOf(SUM.hi) + 6, y: TAPE.top + TAPE.h + 20 }); op(E.lm[1], S.lmMax)
  op(E.loupe, S.lpA); op(E.lzA, S.lzA)
}

function renderEval(S, V) {
  E.axis.render(V, { at: AXIS_Y, draw: S.nAx, ticks: S.nAx, alpha: S.nAx > 0.001 ? 1 : 0 })
  set(E.axName, { x: V.R + 30, y: AXIS_Y + 6 }); op(E.axName, S.nAx)
  const a = clamp(V.sx(SUM.lo), V.L, V.R), b = clamp(V.sx(SUM.lo + (SUM.hi - SUM.lo) * S.bd), V.L, V.R)
  set(E.band, { x: a, y: BAND_Y, width: Math.max(0, b - a) }); op(E.band, S.bd > 0.002 ? S.nAx : 0)
  set(E.bandLbl, { x: (a + b) / 2, y: BAND_Y + 32 }); op(E.bandLbl, S.bd * S.nAx * (1 - S.slA) * (1 - S.cdA))

  // Etiketten-Kandidaten: groß der aktuelle, klein die Liste mit ✓/✗
  const c = CANDS[Math.round(S.cdI)]
  setMarked(E.cand, c.text); op(E.cand, S.cdA)
  E.cBracket.render(V, { R: c.value, p: c.p, y0: BAND_Y - 8, y1: BAND_Y + 22, alpha: S.cbA,
    text: `Etikett ${c.text}` })
  E.cands.forEach((t, i) => op(t, S[`cl${i}`]))

  // Stellenanalyse der Summe
  const p = Math.round(S.slD)
  E.digits.render(LUPE.info, LUPE.layout, {
    x: DIGITS.x, y: DIGITS.y, alpha: S.slA, pointerP: p, pointerA: S.slV,
    colorFrom: S.slC, ghostA: S.slG, suffixA: S.slS, suffixText: LUPE.suffix,
  })
  E.bracket.render(V, { R: LUPE.info.R, p, y0: BAND_Y - 8, y1: BAND_Y + 22, alpha: S.slB,
    text: `1 ${placeName(p)}` })
  E.verdict.textContent = S.cdV > S.slV ? c.verdict : verdict(LUPE.info, p)
  op(E.verdict, Math.max(S.cdV, S.slV))

  E.units.forEach((t, i) => op(t, S[`u${i + 1}`]))
}

export function renderAdd(S) {
  E.root.style.opacity = 1 - 0.62 * S.dim
  op(E.tHead, S.tbA)
  E.rows.forEach((g, i) => op(g, S[`r${i}`]))
  op(E.hi.S, S.hiS); op(E.hi.N, S.hiN); op(E.hi.U, S.hiU)
  renderBench(S)
  renderEval(S, viewOf(S))
}
