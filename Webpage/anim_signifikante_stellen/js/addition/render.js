'use strict'
// Rendering Kapitel „Addition": liest NUR die Szene und schreibt SVG-Attribute.
// Werkbank (zwei Maßbänder zum Aus-/Einrollen, Werkstücke mit Etiketten, Lupe) und
// Steckbrief in festen Bildschirmkoordinaten; unten eine Zahlengerade mit Kamera
// für die Auswertung, danach die Einheiten-Tafel.

import { svgEl, viewOf, createAxis, clamp } from '../../../shared/js/step-kit.js'
import { fmt } from '../../../shared/js/format.js'
import { createCalculator, createCompareBoard, compareLine, setCompareLine, uncIndex } from '../stellen.js'
import {
  xOf, K, ROD_H, TAPES, LOUPE, TAG_FLY, CALC, TABLE, AXIS_Y, BAND_Y, CMP_BOX, UNITS, B_TRUE, READ,
} from './constants.js'
import { SUM, ROWS, CMP, UNIT, UNITS_POW, CALC_IO } from './content.js'

const E = {}
const set = (el, attrs) => { for (const k in attrs) el.setAttribute(k, attrs[k]) }
const op = (el, a) => { el.style.opacity = a; el.style.display = a <= 0.002 ? 'none' : '' }
const text = (parent, cls, attrs = {}, content) => {
  const t = svgEl('text', { class: cls, ...attrs }, parent)
  if (content !== undefined) t.textContent = content
  return t
}
// Text mit markierter letzter Ziffer (= unsichere Stelle)
function marked(parent, cls, attrs, str) {
  const t = svgEl('text', { class: cls, ...attrs }, parent)
  setMarked(t, str)
  return t
}
function setMarked(t, str) {
  if (t._mk === str) return
  t._mk = str
  t.textContent = ''
  const i = uncIndex(str)
  t.append(str.slice(0, i))
  svgEl('tspan', { class: 'unc-digit' }, t).textContent = str[i]
  t.append(str.slice(i + 1))
}
// Zeile aus Abschnitten [text, Art]: „u" = unsichere Ziffer, „n" = Notiz, „bad"/„ok" = Urteil
const RICH = { u: 'unc-digit', n: 'unit-note', bad: 'unit-bad', ok: 'unit-ok' }
function rich(parent, cls, attrs, segs) {
  const t = svgEl('text', { class: cls, ...attrs }, parent)
  for (const [str, c] of segs) svgEl('tspan', c ? { class: RICH[c] } : {}, t).textContent = str
  return t
}
// Zahl mit markierter unsicherer Ziffer: „2,7 · 10³" → 2,[7] · 10³; „1877" → 187[7]
const num = str => {
  const m = str.match(/^([\d,]*?)(\d)((?: · 10\S+)?)$/)
  return [[m[1], ''], [m[2], 'u'], [m[3], '']]
}
const subLabel = (parent, cls, sym, sub, attrs) => {
  const t = text(parent, cls, attrs)
  svgEl('tspan', { class: 'sym' }, t).textContent = sym
  svgEl('tspan', { dy: 5, 'font-size': '72%' }, t).textContent = sub
  return svgEl('tspan', { dy: -5 }, t)
}

// Maßband zum Ausrollen: Haken bei 0, Band hinter einem Clip-Rect, Gehäuse am
// Bandende (die Spule dreht sich mit). Teilung 0,1 m (beschriftet), fein zusätzlich cm.
function buildTape(root, i, { top, h, len, fine }) {
  const g = svgEl('g', { class: 'tape' }, root)
  const clip = svgEl('clipPath', { id: `add_tape_clip_${i}` }, E.defs)
  const clipRect = svgEl('rect', { x: xOf(0) - 12, y: top - 10, height: h + 20, width: 0 }, clip)
  const band = svgEl('g', { 'clip-path': `url(#add_tape_clip_${i})` }, g)
  svgEl('rect', { class: 'tape-body', x: xOf(0) - 10, y: top, width: len * K + 20, height: h, rx: 4 }, band)
  for (let n = 0; n <= Math.round(len * 100); n++) {
    const x = xOf(n / 100)
    if (n % 10 === 0) {
      svgEl('line', { class: 'tape-mark', x1: x, x2: x, y1: top, y2: top + 14 }, band)
      text(band, 'tape-label add-tape-label', { x, y: top + h - 5, 'text-anchor': 'middle' }, fmt(n / 100, 1))
    } else if (fine) {
      svgEl('line', { class: 'tape-mark tape-mark-fine', x1: x, x2: x, y1: top, y2: top + (n % 5 ? 5 : 8) }, band)
    }
  }
  svgEl('rect', { class: 'tape-hook', x: xOf(0) - 14, y: top - 6, width: 8, height: h + 6, rx: 2 }, g)
  const box = svgEl('g', { class: 'tape-case' }, g)
  svgEl('rect', { class: 'tape-case-body', x: 0, y: -h / 2 - 12, width: 2 * h + 10, height: h + 24, rx: 14 }, box)
  const reel = svgEl('g', {}, box)
  svgEl('circle', { class: 'tape-case-reel', cx: h + 5, cy: 0, r: h / 2 + 4 }, reel)
  svgEl('line', { class: 'tape-case-spoke', x1: h + 5, y1: -h / 2, x2: h + 5, y2: h / 2 }, reel)
  svgEl('line', { class: 'tape-case-spoke', x1: 5 + h / 2, y1: 0, x2: 5 + 1.5 * h, y2: 0 }, reel)
  return { g, clipRect, box, reel, top, h, len }
}
function renderTape(T, alpha, r) {
  op(T.g, alpha)
  if (alpha <= 0.002) return
  const ext = 0.02 + r * (T.len - 0.02), xe = xOf(ext)
  T.clipRect.setAttribute('width', xe - xOf(0) + 12)
  T.box.setAttribute('transform', `translate(${xe} ${T.top + T.h / 2})`)
  T.reel.setAttribute('transform', `rotate(${(ext * 900) % 360} ${T.h + 5} 0)`)
}

// Lupe am Ende von B: Millimeter-Teilung, Ablesebereich, Kante von B
function buildLoupe(root) {
  const { cx, cy, r, k } = LOUPE, T = TAPES[1], b = Number(READ.b.replace(',', '.'))
  E.loupe = svgEl('g', { class: 'loupe' }, root)
  svgEl('line', { class: 'loupe-con', x1: cx, y1: cy - r, x2: xOf(B_TRUE), y2: T.top + T.h }, E.loupe)
  const clip = svgEl('clipPath', { id: 'add_loupe_clip' }, E.defs)
  svgEl('circle', { cx, cy, r }, clip)
  const g = svgEl('g', { 'clip-path': 'url(#add_loupe_clip)' }, E.loupe)
  svgEl('circle', { class: 'loupe-bg', cx, cy, r }, g)
  const lx = s => cx + (s - b) * k
  const top = cy - 4, h = 34
  svgEl('rect', { class: 'wp-b', x: cx - r, y: cy - 30, width: lx(B_TRUE) - (cx - r), height: 24 }, g)
  svgEl('rect', { class: 'tape-body', x: cx - r, y: top, width: 2 * r, height: h }, g)
  E.lzA = svgEl('rect', { class: 'zone', x: lx(b - 0.0005), y: top, width: 0.001 * k, height: h }, g)
  const n0 = Math.round((b - 0.014) * 1000), n1 = Math.round((b + 0.014) * 1000)
  for (let n = n0; n <= n1; n++) {
    const x = lx(n / 1000), l = n % 10 ? (n % 5 ? 8 : 12) : 18
    svgEl('line', { class: 'tape-mark', x1: x, x2: x, y1: top, y2: top + l }, g)
    if (n % 10 === 0) text(g, 'tape-label loupe-label', { x, y: top + h - 3, 'text-anchor': 'middle' }, fmt(n / 1000, 2))
  }
  svgEl('line', { class: 'finish-guide', x1: lx(B_TRUE), x2: lx(B_TRUE), y1: cy - r, y2: top + h }, g)
  svgEl('circle', { class: 'loupe-frame', cx, cy, r }, E.loupe)
}

// Etikett: fliegt schräg heran, federt beim Andrücken kurz ein; daneben „wird beschriftet: 0,8 m"
function buildTag(root, str) {
  const g = svgEl('g', { class: 'tag' }, root)
  svgEl('rect', { x: -42, y: -13, width: 84, height: 26, rx: 4 }, g)
  svgEl('path', { class: 'tag-corner', d: 'M30 -13 L42 -13 L42 -1 Z' }, g)   // abstehende Ecke
  marked(g, 'tag-text', { 'text-anchor': 'middle', y: 6 }, str)
  const cap = rich(root, 'tag-caption', { 'text-anchor': 'start' }, [['wird beschriftet: ', ''], [str, 'v']])
  cap.lastChild.setAttribute('class', 'tag-caption-val')
  return { g, cap }
}
function renderTag(T, a, f, s, c, x, y) {
  op(T.g, a); op(T.cap, c)
  set(T.cap, { x: x - 40, y: y - 26 })
  if (a <= 0.002) return
  const e = 1 - (1 - f) ** 3                                 // Anflug, abbremsend
  const px = x + (1 - e) * TAG_FLY.dx, py = y + (1 - e) * TAG_FLY.dy
  const rot = (1 - e) * TAG_FLY.rot - 2
  const sc = (1.3 - 0.3 * e) * (1 - 0.12 * Math.sin(Math.PI * s))   // Andrücken: kurz einfedern
  T.g.setAttribute('transform', `translate(${px} ${py}) rotate(${rot}) scale(${sc})`)
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

// Einheiten-Tafel: falsch umgerechnet (800 mm), richtig umgerechnet, dann dieselbe Summe in km, m,
// cm und mm — beide Summanden und das Ergebnis in GLEICHER Einheit und GLEICHER Zehnerpotenz.
// Jede Rechenzeile hat drei Teile (Summanden · „= Rechner" · „→ Ergebnis"), die nacheinander
// erscheinen (Szene u{n}, u{n}b, u{n}c).
function buildUnits(root) {
  const { x, y, dy } = UNITS
  const line = (i, parts, label) => {
    const t = svgEl('text', { class: 'unit-line', x, y: y + i * dy }, root)
    // Einheiten-Etikett links, Gleichung ab einer gemeinsamen Spalte
    if (label) svgEl('tspan', { class: RICH.n }, t).textContent = label
    return parts.map((segs, k) => {
      const g = svgEl('tspan', label && !k ? { x: x + 64 } : {}, t)
      for (const [str, c] of segs) svgEl('tspan', c ? { class: RICH[c] } : {}, g).textContent = str
      return g
    }).concat([t])
  }
  E.units = [
    // zuerst die Falle beim Umrechnen (PO 2026-10-07, FSS9 u), dann die Umrechnungen
    line(0, [[[`${UNIT.m.a} m ≠ ${UNIT.aMmFalse} mm`, ''],
      [`   ${SUM.a.sig} signifikante Stelle ≠ ${UNIT.aFalseSig} – andere Genauigkeit ✗`, 'bad']]]),
    line(1, [[[`${UNIT.m.a} m = `, ''], ...num(UNIT.aMmPow), [' mm', ''],
      [`   ${SUM.a.sig} signifikante Stelle – dieselbe Genauigkeit ✓`, 'ok']]]),
    ...UNITS_POW.map((r, i) => line(i + 2, [
      [...num(r.a), [` ${r.u} + `, ''], ...num(r.b), [` ${r.u}`, '']],
      [[` = ${r.raw} ${r.u}`, '']],
      [['  →  ', ''], ...num(r.res), [` ${r.u}`, '']],
    ], `in ${r.u}:`)),
    line(UNITS_POW.length + 2, [[['✓ Gleiche Einheit, gleiche Zehnerpotenz: dieselben Nachkommastellen – überall 2,7', 'ok']]]),
  ]
}
// Teil einer Rechenzeile ein-/ausblenden (tspan: Deckkraft über fill-opacity)
const opT = (el, a) => { el.style.fillOpacity = a; el.style.display = a <= 0.002 ? 'none' : '' }

export function initAddStage(svg) {
  E.defs = svgEl('defs', {}, svg)
  E.root = svgEl('g', { class: 'add-stage' }, svg)
  buildTable(E.root)
  E.tapes = TAPES.map((T, i) => buildTape(E.root, i, T))
  const T0 = TAPES[0]
  E.zone = svgEl('rect', { class: 'zone', x: xOf(SUM.a.lo), y: T0.top, width: SUM.a.width * K, height: T0.h }, E.root)
  E.zoneEdge = [SUM.a.lo, SUM.a.hi].map(s => svgEl('line', { class: 'zone-edge', x1: xOf(s), x2: xOf(s),
    y1: T0.top - 8, y2: T0.top + T0.h + 8 }, E.root))
  // mögliche Lage des A-Endes und des Gesamt-Endes (hinter den Werkstücken)
  E.zAe = svgEl('rect', { class: 'chain-zone-a', x: xOf(SUM.a.lo), width: SUM.a.width * K, rx: 3 }, E.root)
  E.zEnd = svgEl('rect', { class: 'chain-zone', x: xOf(SUM.lo), width: (SUM.hi - SUM.lo) * K, rx: 3 }, E.root)
  E.rodA = svgEl('rect', { class: 'rod-body', height: ROD_H, rx: 3 }, E.root)
  E.rodB = svgEl('rect', { class: 'wp-b', height: ROD_H, rx: 3 }, E.root)
  E.tagA = buildTag(E.root, ROWS[0].tag)
  E.tagB = buildTag(E.root, ROWS[1].tag)
  // beide rechtsbündig an ihrer Grenze, untereinander (rechts liegt die Folienkarte)
  E.lm = [['min', SUM.lo, 'end'], ['max', SUM.hi, 'end']].map(([sub, v, anchor]) => {
    const val = subLabel(E.root, 'chain-label', 'L', sub, { 'text-anchor': anchor })
    val.textContent = ` = ${fmt(v, 4)} m`
    return val.parentNode
  })
  buildLoupe(E.root)
  E.calc = createCalculator(E.root, CALC)

  // Auswertung: Zahlengerade mit Band der Summe, dann Vergleichstafel
  E.axis = createAxis(E.root, 'x')
  E.axName = text(E.root, 'axis-name-sm', { 'text-anchor': 'start' })
  svgEl('tspan', { class: 'sym' }, E.axName).textContent = 'L'
  svgEl('tspan', {}, E.axName).textContent = ' / m'
  E.band = svgEl('rect', { class: 'lupe-band', height: 14, rx: 3 }, E.root)
  E.bandLbl = text(E.root, 'band-label', { 'text-anchor': 'middle' }, 'mögliche Gesamtlängen')
  E.cmpG = svgEl('g', {}, E.root)
  text(E.cmpG, 'frac-title', { x: CMP_BOX.x, y: CMP_BOX.y }, 'Ziffern vergleichen')
  E.cmp = createCompareBoard(E.cmpG, { size: 30 })
  E.cmpVerdict = text(E.cmpG, 'verdict', { x: CMP_BOX.x, y: CMP_BOX.y + 168 })
  buildUnits(E.root)
  return E.root
}

function renderBench(S) {
  renderTape(E.tapes[0], S.tp0A, S.tp0R)
  renderTape(E.tapes[1], S.tp1A, S.tp1R)
  op(E.zone, S.zA); E.zoneEdge.forEach(l => op(l, S.zA))
  const rod = (el, a, x, y, L) => {
    set(el, { x: xOf(x), y, width: Math.max(0, L * K) }); op(el, a)
  }
  rod(E.rodA, S.aA, S.aX, S.aY, S.aL)
  rod(E.rodB, S.bA, S.bX, S.bY, S.bL)
  renderTag(E.tagA, S.tgA, S.tgAf, S.tgAs, S.tgAc, xOf(S.aX + S.aL / 2), S.aY + ROD_H / 2)
  renderTag(E.tagB, S.tgB, S.tgBf, S.tgBs, S.tgBc, xOf(S.bX + S.bL / 2), S.bY + ROD_H / 2)
  set(E.zAe, { y: S.aY - 6, height: ROD_H + 12 }); op(E.zAe, S.zAe)
  set(E.zEnd, { y: S.aY - 6, height: ROD_H + 12 }); op(E.zEnd, S.zEnd)
  set(E.lm[0], { x: xOf(SUM.lo) - 6, y: S.aY + ROD_H + 28 }); op(E.lm[0], S.lmMin)
  set(E.lm[1], { x: xOf(SUM.hi) + 6, y: S.aY + ROD_H + 54 }); op(E.lm[1], S.lmMax)
  op(E.loupe, S.lpA); op(E.lzA, S.lzA)
  E.calc.render({ alpha: S.calcA, input: CALC_IO.input, output: CALC_IO.output, t: S.calcT })
}

function renderEval(S, V) {
  E.axis.render(V, { at: AXIS_Y, draw: S.nAx, ticks: S.nAx, alpha: S.nAx > 0.001 ? 1 : 0 })
  set(E.axName, { x: V.R + 30, y: AXIS_Y + 6 }); op(E.axName, S.nAx)
  const a = clamp(V.sx(SUM.lo), V.L, V.R), b = clamp(V.sx(SUM.lo + (SUM.hi - SUM.lo) * S.bd), V.L, V.R)
  set(E.band, { x: a, y: BAND_Y, width: Math.max(0, b - a) }); op(E.band, S.bd > 0.002 ? S.nAx : 0)
  set(E.bandLbl, { x: (a + b) / 2, y: BAND_Y + 32 }); op(E.bandLbl, S.bd * S.nAx)
  op(E.cmpG, S.dcA)
  if (S.dcA > 0.002) {
    const bottom = E.cmp.render(CMP, { x: CMP_BOX.x + 130, y: CMP_BOX.y + 44, gap: 38, alpha: 1, p: Math.round(S.dcP),
      pointerA: S.dcV, colorFrom: S.dcC, final: S.dcF, round: S.dcR })
    E.cmpVerdict.setAttribute('y', bottom + 34)
    setCompareLine(E.cmpVerdict, S, CMP)
  }
  E.units.forEach((parts, i) => {
    const t = parts.at(-1), n = i + 1
    op(t, S[`u${n}`])
    parts.slice(0, -1).forEach((g, k) => opT(g, k ? S[`u${n}${'bc'[k - 1]}`] ?? 0 : 1))
  })
}

export function renderAdd(S) {
  E.root.style.opacity = 1 - 0.62 * S.dim
  op(E.tHead, S.tbA)
  E.rows.forEach((g, i) => op(g, S[`r${i}`]))
  op(E.hi.S, S.hiS); op(E.hi.N, S.hiN); op(E.hi.U, S.hiU)
  renderBench(S)
  renderEval(S, viewOf(S))
}
