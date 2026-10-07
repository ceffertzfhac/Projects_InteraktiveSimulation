'use strict'
// Rendering Kapitel „Division": liest NUR die Szene und schreibt SVG-Attribute.
// initSpeedStage() baut alle Elemente einmal (eigene Gruppe in der Bühnen-SVG),
// renderSpeed() läuft pro Frame. Straße, Tafeln und Lupe in festen Bildschirm-
// koordinaten; nur die v-Achse nutzt die Kamera (Zoom auf das enge Intervall).

import { svgEl, viewOf, createAxis, clamp, lerp } from '../../../shared/js/step-kit.js'
import { fmt } from '../../../shared/js/format.js'
import {
  S_TRUE, T_TRUE, V_TRUE, K, X0, xOf, ROAD, CAR, TAPES, TAPE_LEN, PANEL, WATCH_A, WATCH_B,
  LOUPE, LOUPE_TAPE, LOUPE_DIAL, TABLE, V_AXIS_Y, BAND_Y, FRAC, DIGITS, VERDICT_Y, READ,
} from './constants.js'
import { ROW, CMP } from './content.js'
import { parseMeasured } from '../model.js'
import {
  createClaimRow, createUnitBracket, verdict, claimLabel, claimRange, createCompareBoard, compareLine, setCompareLine,
  uncIndex,
} from '../stellen.js'

const E = {}
const DEG = Math.PI / 180
const FINISH = xOf(S_TRUE)

const set = (el, attrs) => { for (const k in attrs) el.setAttribute(k, attrs[k]) }
const op = (el, a) => { el.style.opacity = a; el.style.display = a <= 0.002 ? 'none' : '' }
const text = (parent, cls, attrs, content = '') => {
  const t = svgEl('text', { class: cls, ...attrs }, parent)
  t.textContent = content
  return t
}
// Größensymbol kursiv, Rest aufrecht (Repo-Konvention); ein führendes „Δ" bleibt aufrecht
const symSpans = (t, sym) => {
  if (sym[0] === 'Δ') svgEl('tspan', {}, t).textContent = 'Δ'
  svgEl('tspan', { class: 'sym' }, t).textContent = sym.replace(/^Δ/, '')
}
const symText = (parent, cls, attrs, sym, rest) => {
  const t = svgEl('text', { class: cls, ...attrs }, parent)
  symSpans(t, sym)
  if (rest) svgEl('tspan', {}, t).textContent = rest
  return t
}

// Gemessene Zeit folgt aus der Wagenposition (Uhren laufen zwischen den Lichtschranken)
const elapsed = carX => clamp(carX / V_TRUE, 0, T_TRUE)

function person(parent, cx, cy, cls) {
  const g = svgEl('g', { class: `person ${cls}` }, parent)
  svgEl('circle', { cx, cy: cy - 15, r: 11 }, g)
  svgEl('path', { d: `M${cx - 19} ${cy + 20}Q${cx - 19} ${cy} ${cx} ${cy}Q${cx + 19} ${cy} ${cx + 19} ${cy + 20}Z` }, g)
  return g
}

export function buildCar(parent) {        // auch Grundlagen-Zeitmessung (zeit.js)
  const g = svgEl('g', { class: 'car' }, parent)
  const L = CAR.len, W = CAR.w, h = W / 2
  ;[-L + 22, -40].forEach(x => [-h - 3, h - 3].forEach(y =>
    svgEl('rect', { class: 'car-wheel', x, y, width: 22, height: 6, rx: 2 }, g)))
  svgEl('rect', { class: 'car-body', x: -L, y: -h, width: L, height: W, rx: 15 }, g)
  svgEl('path', { class: 'car-glass', d: `M-58 ${-h + 7}L-40 ${-h + 10}L-40 ${h - 10}L-58 ${h - 7}Z` }, g)
  svgEl('rect', { class: 'car-roof', x: -122, y: -h + 6, width: 64, height: W - 12, rx: 6 }, g)
  svgEl('path', { class: 'car-glass', d: `M-140 ${-h + 9}L-122 ${-h + 6}L-122 ${h - 6}L-140 ${h - 9}Z` }, g)
  ;[-h + 9, h - 9].forEach(y => svgEl('ellipse', { class: 'car-light', cx: -4, cy: y, rx: 3, ry: 6 }, g))
  ;[-h - 4, h + 4].forEach(y => svgEl('ellipse', { class: 'car-mirror', cx: -64, cy: y, rx: 5, ry: 3 }, g))
  return g
}

function buildTape(parent, i) {
  const { top, h } = TAPES[i]
  const g = svgEl('g', { class: 'tape' }, parent)
  const clip = svgEl('clipPath', { id: `spd_tape_clip${i}` }, E.defs)
  const clipRect = svgEl('rect', { x: X0 - 12, y: top - 4, height: h + 8, width: 0 }, clip)
  const inner = svgEl('g', { 'clip-path': `url(#spd_tape_clip${i})` }, g)
  svgEl('rect', { class: 'tape-body', x: X0 - 8, y: top, width: TAPE_LEN * K + 16, height: h, rx: 3 }, inner)
  if (i === 0) E.zone = svgEl('rect', { class: 'zone', y: top, height: h }, inner)
  // A: Marken je Meter · B: 10-cm-Striche, 50-cm-Striche, Meter mit Zahl (cm nur in der Lupe sichtbar)
  const step = i === 0 ? 1 : 0.1
  for (let n = 0; n * step <= TAPE_LEN + 1e-9; n++) {
    const s = n * step, x = xOf(s)
    const major = Math.abs(s - Math.round(s)) < 1e-9
    const len = major ? 8 : Math.abs(s * 2 - Math.round(s * 2)) < 1e-9 ? 6 : 3.5
    svgEl('line', { class: 'tape-mark', x1: x, x2: x, y1: top, y2: top + len }, inner)
    if (major) text(inner, 'tape-label spd-tape-label', { x, y: top + h - 2.5, 'text-anchor': 'middle' }, String(Math.round(s)))
  }
  const badge = svgEl('g', { class: `badge badge-${i ? 'b' : 'a'}` }, g)
  svgEl('circle', { cx: X0 - 26, cy: top + h / 2, r: 10 }, badge)
  text(badge, 'badge-text', { x: X0 - 26, y: top + h / 2 + 4.5, 'text-anchor': 'middle' }, i ? 'B' : 'A')
  return { g, clipRect }
}

function buildPanel(parent, i) {
  const P = PANEL[i]
  const g = svgEl('g', { class: 'panel' }, parent)
  svgEl('rect', { class: 'panel-bg', x: P.x, y: P.y, width: P.w, height: P.h, rx: 14 }, g)
  const px = P.x + 48
  person(g, px, P.y + 56, i ? 'p-b' : 'p-a')
  text(g, `panel-name ${i ? 'name-b' : 'name-a'}`, { x: px, y: P.y + 108, 'text-anchor': 'middle' },
    i ? 'Person B' : 'Person A')
  const lines = i
    ? ['Maßband: cm-Teilung', 'Stoppuhr mit nur', 'einem Sekundenzeiger']
    : ['Maßband: 1-m-Teilung', '2 Lichtschranken', 'Stoppuhr: 0,01 s']
  lines.forEach((l, n) => text(g, 'panel-item', { x: P.x + 102, y: P.y + 52 + n * 30 }, l))
  return g
}

function buildWatchA(parent) {
  const { cx, cy, w, h } = WATCH_A
  const g = svgEl('g', { class: 'watch-a' }, parent)
  E.glowA = svgEl('rect', { class: 'watch-glow', x: cx - w / 2 - 5, y: cy - h / 2 - 5, width: w + 10, height: h + 10, rx: 18 }, g)
  ;[-40, 40].forEach(dx => svgEl('rect', { class: 'watch-btn', x: cx + dx - 9, y: cy - h / 2 - 7, width: 18, height: 9, rx: 2 }, g))
  svgEl('rect', { class: 'watch-case', x: cx - w / 2, y: cy - h / 2, width: w, height: h, rx: 14 }, g)
  svgEl('rect', { class: 'lcd', x: cx - w / 2 + 12, y: cy - h / 2 + 10, width: w - 24, height: h - 20, rx: 6 }, g)
  E.lcd = text(g, 'lcd-text', { x: cx + 18, y: cy + 11, 'text-anchor': 'end' })
  text(g, 'lcd-unit', { x: cx + 26, y: cy + 11 }, 's')
}

function buildWatchB(parent) {
  const { cx, cy, r } = WATCH_B
  const g = svgEl('g', { class: 'watch-b' }, parent)
  E.glowB = svgEl('circle', { class: 'watch-glow', cx, cy, r: r + 6 }, g)
  svgEl('rect', { class: 'watch-btn', x: cx - 7, y: cy - r - 12, width: 14, height: 10, rx: 2 }, g)
  svgEl('circle', { class: 'dial-face', cx, cy, r }, g)
  for (let i = 0; i < 60; i++) {
    const a = i * 6 * DEG, l = i % 5 ? 4 : 9
    const sx = Math.sin(a), cy_ = -Math.cos(a)
    svgEl('line', { class: i % 5 ? 'dial-tick' : 'dial-tick major',
      x1: cx + (r - 3) * sx, y1: cy + (r - 3) * cy_, x2: cx + (r - 3 - l) * sx, y2: cy + (r - 3 - l) * cy_ }, g)
  }
  ;[60, 15, 30, 45].forEach((n, i) => {
    const a = i * 90 * DEG
    text(g, 'dial-num', { x: cx + (r - 21) * Math.sin(a), y: cy - (r - 21) * Math.cos(a) + 4, 'text-anchor': 'middle' }, String(n))
  })
  E.handB = svgEl('line', { class: 'dial-hand', x1: cx, y1: cy }, g)
  svgEl('circle', { class: 'dial-hub', cx, cy, r: 4 }, g)
}

// Ablesung von B (Sekundenzeiger): Lupe zentriert auf diese Marke, Ablesebereich ±½ s
const TB = parseMeasured(READ.tB)

// Lupe: vergrößerter Ausschnitt — erst Maßband B an der Ziellinie, dann das Zifferblatt
function buildLoupe(parent) {
  const { cx, cy, r } = LOUPE
  E.loupe = svgEl('g', { class: 'loupe' }, parent)
  E.conT = svgEl('line', { class: 'loupe-con', x1: cx, y1: cy - r, x2: FINISH, y2: TAPES[1].top + TAPES[1].h + 1 }, E.loupe)
  E.conD = svgEl('line', { class: 'loupe-con', x1: cx - r, y1: cy, x2: WATCH_B.cx + 14, y2: WATCH_B.cy - WATCH_B.r + 4 }, E.loupe)
  svgEl('line', { class: 'loupe-handle', x1: cx + r * 0.72, y1: cy + r * 0.72, x2: cx + r * 1.02, y2: cy + r * 1.02 }, E.loupe)
  const clip = svgEl('clipPath', { id: 'spd_loupe_clip' }, E.defs)
  svgEl('circle', { cx, cy, r }, clip)
  const inner = svgEl('g', { 'clip-path': 'url(#spd_loupe_clip)' }, E.loupe)
  svgEl('circle', { class: 'loupe-bg', cx, cy, r }, inner)

  // Maßband: 12 px pro cm, Ziellinie in der Mitte
  E.lpTape = svgEl('g', {}, inner)
  const lx = s => cx + (s - S_TRUE) * LOUPE_TAPE.k
  const top = cy - 12, h = 34
  svgEl('rect', { class: 'tape-body', x: cx - r, y: top, width: 2 * r, height: h }, E.lpTape)
  E.lzT = svgEl('rect', { class: 'zone', x: lx(19.825), y: top, width: 0.01 * LOUPE_TAPE.k, height: h }, E.lpTape)
  for (let n = Math.round(LOUPE_TAPE.from * 100); n <= LOUPE_TAPE.to * 100; n++) {
    const x = lx(n / 100), l = n % 5 ? 9 : 16
    svgEl('line', { class: 'tape-mark', x1: x, x2: x, y1: top, y2: top + l }, E.lpTape)
    if (n % 5 === 0) text(E.lpTape, 'tape-label loupe-label', { x, y: top + h - 4, 'text-anchor': 'middle' }, fmt(n / 100, 2))
  }
  svgEl('line', { class: 'finish-guide', x1: cx, x2: cx, y1: cy - r, y2: top + h }, E.lpTape)
  text(E.lpTape, 'loupe-cap', { x: cx - 6, y: cy - 30, 'text-anchor': 'end' }, 'Ziel')

  // Zifferblatt: Radius R, gedreht so, daß die abgelesene Marke oben in der Lupenmitte steht
  E.lpDial = svgEl('g', {}, inner)
  const R = LOUPE_DIAL.R, dcx = cx, dcy = cy - LOUPE_DIAL.drop + R
  E.dialC = { dcx, dcy, R }
  svgEl('circle', { class: 'dial-face', cx: dcx, cy: dcy, r: R }, E.lpDial)
  const ang = sec => (sec - TB.value) * 6 * DEG
  const pol = (sec, rad) => [dcx + rad * Math.sin(ang(sec)), dcy - rad * Math.cos(ang(sec))]
  const sector = (a, b, r0, r1) => {
    const [p0, p1, p2, p3] = [pol(a, r1), pol(b, r1), pol(b, r0), pol(a, r0)]
    return `M${p0}A${r1} ${r1} 0 0 1 ${p1}L${p2}A${r0} ${r0} 0 0 0 ${p3}Z`
  }
  E.lzD = svgEl('path', { class: 'zone zone-dial', d: sector(TB.lo, TB.hi, R - 44, R) }, E.lpDial)
  for (let s = TB.value - 4; s <= TB.value + 4; s++) {
    const [x1, y1] = pol(s, R - 2), [x2, y2] = pol(s, R - 22)
    svgEl('line', { class: 'dial-tick major', x1, y1, x2, y2 }, E.lpDial)
    const [tx, ty] = pol(s, R - 36)
    text(E.lpDial, 'dial-num loupe-num', { x: tx, y: ty + 5, 'text-anchor': 'middle' }, String((s + 60) % 60 || 60))
  }
  E.lpHand = svgEl('line', { class: 'dial-hand', x1: dcx, y1: dcy }, E.lpDial)
  svgEl('circle', { class: 'loupe-frame', cx, cy, r }, E.loupe)
}

export function initSpeedStage(svg) {
  E.defs = svgEl('defs', {}, svg)
  E.root = svgEl('g', { class: 'speed-stage' }, svg)
  E.lower = svgEl('g', {}, E.root)          // Straße, Bänder, Tafeln — weicht später der v-Geraden

  // ── Straße (Draufsicht) mit Start- und Ziellinie ──
  E.road = svgEl('g', {}, E.lower)
  const { top, h } = ROAD
  svgEl('rect', { class: 'road', x: -40, y: top, width: 1280, height: h }, E.road)
  ;[top + 5, top + h - 5].forEach(y => svgEl('line', { class: 'road-edge', x1: -40, x2: 1240, y1: y, y2: y }, E.road))
  svgEl('line', { class: 'road-center', x1: -40, x2: 1240, y1: top + h / 2, y2: top + h / 2 }, E.road)
  E.lines = [X0, FINISH].map(x => svgEl('line', { class: 'road-line', x1: x, x2: x, y1: top }, E.road))
  // Fahrbahn-Beschriftung (wie aufgemalt) im unteren Fahrstreifen, innerhalb der Strecke
  E.lineLbl = [[X0 + 10, 'START', 'start'], [FINISH - 10, 'ZIEL', 'end']].map(([x, s, anchor]) =>
    text(E.lower, 'line-label', { x, y: top + h - 14, 'text-anchor': anchor }, s))

  // ── Lichtschranken: Sender oben, Empfänger unten, Laserstrahl ──
  E.lb = [X0, FINISH].map(x => {
    const g = svgEl('g', { class: 'barrier' }, E.lower)
    const beam = svgEl('line', { class: 'beam', x1: x, x2: x, y1: top - 2, y2: top + h + 2 }, g)
    svgEl('rect', { class: 'barrier-box', x: x - 8, y: top - 16, width: 16, height: 15, rx: 3 }, g)
    svgEl('rect', { class: 'barrier-box', x: x - 6, y: top + h + 1, width: 12, height: 6, rx: 2 }, g)
    const led = svgEl('circle', { class: 'barrier-led', cx: x, cy: top - 9, r: 3 }, g)
    const ring = svgEl('circle', { class: 'barrier-ring', cx: x, cy: top + h / 2 }, g)
    return { g, beam, led, ring, x }
  })

  E.car = buildCar(E.lower)

  // ── Maßbänder, Ablesebereich, Hilfslinie Ziel → Bänder ──
  E.tapes = [0, 1].map(i => buildTape(E.lower, i))
  E.zoneEdge = [19.5, 20.5].map(s => svgEl('line', { class: 'zone-edge', x1: xOf(s), x2: xOf(s),
    y1: TAPES[0].top - 4, y2: TAPES[0].top + TAPES[0].h + 4 }, E.lower))
  E.guide = svgEl('line', { class: 'finish-guide', x1: FINISH, x2: FINISH, y1: top + h }, E.lower)

  // ── Tafeln mit Uhren und Lupe ──
  E.panels = [0, 1].map(i => buildPanel(E.lower, i))
  buildWatchA(E.panels[0])
  buildWatchB(E.panels[1])
  buildLoupe(E.panels[1])

  buildTable()
  buildFraction()

  // ── v-Zahlengerade: Bänder der möglichen v, Ecken-Treffer, Live-Marke, Ergebnis ──
  E.vAxis = createAxis(E.root, 'x')
  E.vName = symText(E.root, 'axis-name-sm', { 'text-anchor': 'start' }, 'v', ' / (m/s)')
  E.bracket = createUnitBracket(E.root)
  E.bands = ROW.map((r, i) => {
    const cls = ['a', 'b', 'c'][i]
    return {
      rect: svgEl('rect', { class: `vband vband-${cls}`, height: 14, rx: 3 }, E.root),
      lbl: text(E.root, `vband-label val-${cls}`, { 'text-anchor': 'end' }, ['A', 'B', 'A+B'][i]),
      mark: svgEl('path', { class: `vmark vdot-${cls}` }, E.root),
      mlbl: text(E.root, `vmark-label val-${cls}`, { 'text-anchor': 'start' }, r.v),
    }
  })
  E.live = svgEl('line', { class: 'v-live' }, E.root)
  E.hits = [0, 1, 2, 3].map(() => svgEl('circle', { class: 'v-hit', r: 5 }, E.root))
  E.digits = createClaimRow(E.root, { size: DIGITS.size })
  E.digitCap = text(E.root, 'digit-cap', { x: DIGITS.x, y: DIGITS.y - DIGITS.size - 6 })
  E.verdict = text(E.root, 'verdict', { x: 110, y: VERDICT_Y })
  // Vergleichstafel (an der Stelle der Regler): v_max · Rechner · v_min
  E.cmpG = svgEl('g', {}, E.root)
  E.cmpTitle = text(E.cmpG, 'frac-title', { x: 60, y: FRAC.y[0] - 32 })
  E.cmp = createCompareBoard(E.cmpG, { size: 30 })
  E.cmpVerdict = text(E.cmpG, 'verdict', { x: 60, y: FRAC.y[1] + 72 })
  return E.root
}

// Text mit markierter letzter Ziffer (= unsichere Stelle): „19,8<3> m"
function markedText(parent, cls, attrs, str) {
  const t = svgEl('text', { class: cls, ...attrs }, parent)
  const i = uncIndex(str)
  t.append(str.slice(0, i))
  svgEl('tspan', { class: 'unc-digit' }, t).textContent = str[i]
  t.append(str.slice(i + 1))
  return t
}

function buildTable() {
  E.table = svgEl('g', { class: 'proto' }, E.root)
  const [c0, c1, c2, c3] = TABLE.x, y0 = TABLE.y0
  E.tHead = svgEl('g', {}, E.table)
  text(E.tHead, 'proto-head', { x: c0, y: y0 }, 'Messprotokoll')
  symText(E.tHead, 'proto-head', { x: c1, y: y0 }, 'Δs')
  symText(E.tHead, 'proto-head', { x: c2, y: y0 }, 'Δt')
  const vh = symText(E.tHead, 'proto-head', { x: c3, y: y0 }, 'v', ' = Δ')
  svgEl('tspan', { class: 'sym' }, vh).textContent = 's'
  svgEl('tspan', {}, vh).textContent = ' / Δ'
  svgEl('tspan', { class: 'sym' }, vh).textContent = 't'
  svgEl('line', { class: 'proto-rule', x1: c0, x2: TABLE.x1, y1: y0 + 10, y2: y0 + 10 }, E.tHead)
  // Legende (abgesetzt, mittig über der Tabelle, PO 2026-10-07): markierte Ziffer =
  // unsicher, darunter das Intervall der wahren Werte — erklärt die Tabelle, nicht v
  const lgW = 285, lgX = (c0 + TABLE.x1) / 2 - lgW / 2
  const lgG = svgEl('g', { class: 'proto-legend-box' }, E.tHead)
  svgEl('rect', { x: lgX, y: y0 - 44, width: lgW, height: 26, rx: 6 }, lgG)
  const lg = text(lgG, 'proto-legend', { x: lgX + lgW / 2, y: y0 - 26, 'text-anchor': 'middle' })
  svgEl('tspan', { class: 'proto-legend-head' }, lg).textContent = 'Legende: '
  svgEl('tspan', { class: 'unc-digit' }, lg).textContent = '3'
  lg.append(' unsichere Ziffer · [ … ) Intervall')
  E.rows = ROW.map((r, i) => {
    const y = y0 + TABLE.dy * (i + 1), ys = y + TABLE.sub
    const cls = ['val-a', 'val-b', 'val-c'][i]
    const cell = (x, val, iv, extra = '') => {
      const g = svgEl('g', {}, E.table)
      markedText(g, `proto-cell ${extra}`, { x, y }, val)
      text(g, 'proto-iv', { x, y: ys }, iv)
      return g
    }
    return {
      name: text(E.table, `proto-name ${cls}`, { x: c0, y }, ['Person A', 'Person B', 'Kombiniert'][i]),
      s: cell(c1, r.s, r.sIv), t: cell(c2, r.t, r.tIv), v: cell(c3, r.v, r.vIv, `proto-v ${cls}`),
    }
  })
}

// Regler für s und t: Knopf wandert im Intervall; Live-Wert v = s / t daneben
function buildFraction() {
  E.frac = svgEl('g', { class: 'frac' }, E.root)
  E.frTitle = text(E.frac, 'frac-title', { x: 60, y: FRAC.y[0] - 32 })
  E.frBars = ['Δs', 'Δt'].map((sym, k) => {
    const y = FRAC.y[k]
    symText(E.frac, 'frac-sym', { x: 60, y: y + 7 }, sym)
    svgEl('line', { class: 'frac-bar', x1: FRAC.x0, x2: FRAC.x1, y1: y, y2: y }, E.frac)
    ;[FRAC.x0, FRAC.x1].forEach(x => svgEl('line', { class: 'frac-cap', x1: x, x2: x, y1: y - 9, y2: y + 9 }, E.frac))
    const lo = svgEl('text', { class: 'frac-end', x: FRAC.x0, y: y + 28, 'text-anchor': 'middle' }, E.frac)
    const hi = svgEl('text', { class: 'frac-end', x: FRAC.x1, y: y + 28, 'text-anchor': 'middle' }, E.frac)
    const loT = subLabel(lo, sym, 'min'), hiT = subLabel(hi, sym, 'max')
    const knob = svgEl('circle', { class: 'frac-knob', cy: y, r: 9 }, E.frac)
    const val = svgEl('text', { class: 'frac-val', y: y - 15, 'text-anchor': 'middle' }, E.frac)
    return { y, loT, hiT, knob, val }
  })
  E.frLive = symText(E.frac, 'frac-live', { x: FRAC.live, y: (FRAC.y[0] + FRAC.y[1]) / 2 + 10 }, 'v', ' = ')
  E.frLiveVal = svgEl('tspan', {}, E.frLive)
  // Welche Kombination steht gerade an den Reglern? (nur an den vier Ecken)
  E.frCap = text(E.frac, 'frac-cap-text', { x: 60, y: FRAC.y[1] + 62 })   // links unter den Reglern
}
const near = (k, v) => Math.abs(k - v) < 0.015
function comboText(ks, kt) {
  if (near(ks, 0) && near(kt, 1)) return 'kleinstes Δs, größtes Δt → kleinstmögliches v'
  if (near(ks, 1) && near(kt, 0)) return 'größtes Δs, kleinstes Δt → größtmögliches v'
  if ((near(ks, 0) && near(kt, 0)) || (near(ks, 1) && near(kt, 1))) return 'beide klein / beide groß → v liegt dazwischen'
  return ''
}
// „s_min = 19,5 m" in ein <text>: Symbol kursiv, Index tiefgestellt, Wert in tspan
function subLabel(t, sym, sub) {
  symSpans(t, sym)
  svgEl('tspan', { dy: 5, 'font-size': '72%' }, t).textContent = sub
  return svgEl('tspan', { dy: -5 }, t)
}

function renderLower(S) {
  op(E.lower, S.lowA)
  if (S.lowA <= 0.002) return
  const { top, h } = ROAD
  op(E.road, S.roadA)
  E.lines.forEach(l => set(l, { y2: top + h * S.lineD }))
  E.lineLbl.forEach(t => op(t, S.roadA * S.lineD))

  // Wagen und Lichtschranken
  const front = xOf(S.carX), rear = front - CAR.len
  E.car.setAttribute('transform', `translate(${front.toFixed(2)} ${top + h / 2})`)
  op(E.car, S.carA)
  E.lb.forEach(B => {
    op(B.g, S.lbA)
    const blocked = front >= B.x && rear <= B.x
    B.beam.style.opacity = blocked ? 0.18 : 1
    const f = Math.exp(-(((front - B.x) / 40) ** 2))          // Auslöse-Blitz beim Durchfahren
    set(B.ring, { r: 8 + 26 * (1 - f) }); op(B.ring, S.lbA * f * (front >= B.x - 4 ? 1 : 0))
    B.led.classList.toggle('on', blocked)
  })

  // Maßbänder
  E.tapes.forEach((T, i) => {
    op(T.g, S[`tpA${i}`])
    T.clipRect.setAttribute('width', (TAPE_LEN * K + 24) * S[`tpD${i}`])
  })
  const zw = K * S.zW
  set(E.zone, { x: xOf(20) - zw / 2, width: Math.max(0, zw) }); op(E.zone, S.zA)
  E.zoneEdge.forEach(l => op(l, S.zA * S.zW))
  set(E.guide, { y2: lerp(top + h, TAPES[1].top + TAPES[1].h + 2, S.guideD) })
  op(E.guide, S.guideD > 0.01 ? 1 : 0)

  // Tafeln und Uhren (Zeit aus der Wagenposition)
  E.panels.forEach((p, i) => {
    op(p, S[`pnA${i}`]); p.setAttribute('transform', `translate(0 ${S[`pnY${i}`]})`)
  })
  const t = elapsed(S.carX)
  E.lcd.textContent = fmt(Math.floor(t * 100 + 1e-6) / 100, 2)
  op(E.glowA, S.wGlowA); op(E.glowB, S.wGlowB)
  const a = t * 6 * DEG, { cx, cy, r } = WATCH_B
  set(E.handB, { x2: cx + (r - 8) * Math.sin(a), y2: cy - (r - 8) * Math.cos(a) })
  const { dcx, dcy, R } = E.dialC, al = (t - TB.value) * 6 * DEG
  set(E.lpHand, { x2: dcx + (R - 6) * Math.sin(al), y2: dcy - (R - 6) * Math.cos(al) })

  // Lupe
  op(E.loupe, S.lpA)
  op(E.lpTape, S.lpT); op(E.conT, S.lpT)
  op(E.lpDial, S.lpD); op(E.conD, S.lpD)
  op(E.lzT, S.lzT); op(E.lzD, S.lzD)
}

// Live-Werte der Regler (Zeile frI)
const liveST = S => {
  const e = ROW[Math.round(S.frI)].e
  return [lerp(e.s.lo, e.s.hi, S.ks), lerp(e.t.lo, e.t.hi, S.kt)]
}

function renderFraction(S, V) {
  op(E.frac, S.frA)
  const i = Math.round(S.frI), r = ROW[i]
  if (S.frA > 0.002) {
    E.frTitle.textContent = `${['Person A', 'Person B', 'Kombiniert'][i]}: kleinstmögliches und größtmögliches v`
    const [s, t] = liveST(S)
    ;[[S.ks, s, r.sLo, r.sHi, 'm', r.e.s.decimals + 1], [S.kt, t, r.tLo, r.tHi, 's', r.e.t.decimals + 1]]
      .forEach(([k, v, lo, hi, unit, dec], n) => {
        const B = E.frBars[n], x = lerp(FRAC.x0, FRAC.x1, k)
        set(B.knob, { cx: x }); set(B.val, { x })
        B.val.textContent = `${fmt(v, dec)} ${unit}`
        B.loT.textContent = ` = ${lo}`; B.hiT.textContent = ` = ${hi}`
      })
    E.frLiveVal.textContent = `${fmt(s / t, 3)} m/s`
    E.frCap.textContent = comboText(S.ks, S.kt)
  }
  // Live-Marke auf der Zahlengeraden
  const [s, t] = liveST(S), x = V.sx(s / t)
  set(E.live, { x1: x, x2: x, y1: BAND_Y[i] - 8, y2: V_AXIS_Y })
  op(E.live, x >= V.L && x <= V.R ? S.vlA : 0)
  E.hits.forEach((c, n) => {
    const hx = V.sx(S[`ch${n}x`])
    set(c, { cx: hx, cy: BAND_Y[i] + 7, class: `v-hit hc${Math.round(S[`ch${n}c`])}` })
    op(c, hx >= V.L && hx <= V.R ? S[`ch${n}a`] : 0)
  })
}

function renderBands(S, V) {
  const L = V.L, R = V.R
  ROW.forEach((r, i) => {
    const g = S[`bd${i}`], B = E.bands[i], y = BAND_Y[i]
    const { lo, hi } = r.e.v
    // wächst von v_min nach v_max (die beiden Grenzen kommen aus dem Ecken-Test)
    const a = clamp(V.sx(lo), L, R), b = clamp(V.sx(lo + (hi - lo) * g), L, R)
    set(B.rect, { x: a, y, width: Math.max(0, b - a) }); op(B.rect, g > 0.002 ? 1 : 0)
    set(B.lbl, { x: L - 14, y: y + 12 }); op(B.lbl, Math.min(1, g * 3))
    // Ergebnis-Marke (gerundeter Wert) — kein „wahrer Wert"
    const mx = V.sx(r.info.R), on = mx >= L && mx <= R ? S[`rm${i}`] : 0
    set(B.mark, { d: `M${mx} ${y - 3}l6 10l-6 10l-6 -10Z` }); op(B.mark, on)
    set(B.mlbl, { x: mx + 11, y: y + 12 }); op(B.mlbl, i === Math.round(S.frI) ? on : 0)
  })
}

// „Welche Stelle ist unsicher?": Angabe bis zur Stelle, ihre Klammer, Urteil
function renderStellen(S, V) {
  const i = Math.round(S.slI), r = ROW[i], p = Math.round(S.slD)
  E.digits.render(r.info, p, { x: DIGITS.x, y: DIGITS.y, alpha: S.slA, colored: p >= S.slC, unit: 'm/s' })
  E.digitCap.textContent = `${['Person A', 'Person B', 'Kombiniert'][i]}: welche Stelle ist unsicher?`
  op(E.digitCap, S.slA)
  E.bracket.render(V, { ...claimRange(r.info, p), y0: BAND_Y[i] - 8, y1: BAND_Y[i] + 22, alpha: S.slB,
    text: claimLabel(r.info, p), above: true })
  E.verdict.textContent = verdict(r.info, p)
  op(E.verdict, S.slV)
}

export function renderSpeed(S) {
  E.root.style.opacity = 1 - 0.62 * S.dim
  renderLower(S)

  // Messprotokoll
  op(E.tHead, S.tbA)
  E.rows.forEach((row, i) => {
    op(row.name, i < 2 ? S.tbA : S.row2)
    ;['s', 't', 'v'].forEach(k => op(row[k], S[`c${i}${k}`]))
  })

  // v-Zahlengerade
  const V = viewOf(S)
  E.vAxis.render(V, { at: V_AXIS_Y, draw: S.vAx, ticks: S.vTk, alpha: S.vAx > 0.001 ? 1 : 0 })
  set(E.vName, { x: V.R + 30, y: V_AXIS_Y + 6 }); op(E.vName, S.vAx)
  renderBands(S, V)
  renderFraction(S, V)
  renderStellen(S, V)
  op(E.cmpG, S.dcA)
  if (S.dcA > 0.002) {
    const i = Math.round(S.dcI), D = CMP[i]
    E.cmpTitle.textContent = `${['Person A', 'Person B', 'Kombiniert'][i]}: Ziffern vergleichen`
    const bottom = E.cmp.render(D, { x: 240, y: FRAC.y[0] + 6, gap: 38, alpha: 1, p: Math.round(S.dcP),
      pointerA: S.dcV, colorFrom: S.dcC, final: S.dcF, round: S.dcR })
    E.cmpVerdict.setAttribute('y', bottom + 34)
    setCompareLine(E.cmpVerdict, S, D)
  }
}
