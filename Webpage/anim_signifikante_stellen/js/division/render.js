'use strict'
// Rendering Kapitel „Division": liest NUR die Szene und schreibt SVG-Attribute.
// initSpeedStage() baut alle Elemente einmal (eigene Gruppe in der Bühnen-SVG),
// renderSpeed() läuft pro Frame. Straße, Tafeln und Lupe in festen Bildschirm-
// koordinaten; nur die v-Achse nutzt die Kamera (Zoom auf das enge Intervall).

import { svgEl, viewOf, createAxis, clamp, lerp } from '../../../shared/js/step-kit.js'
import { fmt } from '../../../shared/js/format.js'
import {
  S_TRUE, T_TRUE, V_TRUE, K, X0, xOf, ROAD, CAR, TAPES, TAPE_LEN, PANEL, WATCH_A, WATCH_B,
  LOUPE, LOUPE_TAPE, LOUPE_DIAL, TABLE, V_AXIS_Y, BAND_Y,
} from './constants.js'
import { ROW } from './content.js'

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
// Größensymbol kursiv, Rest aufrecht (Repo-Konvention)
const symText = (parent, cls, attrs, sym, rest) => {
  const t = svgEl('text', { class: cls, ...attrs }, parent)
  svgEl('tspan', { class: 'sym' }, t).textContent = sym
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

function buildCar(parent) {
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

  // Zifferblatt: Radius R, gedreht so, daß die 1-s-Marke oben in der Lupenmitte steht
  E.lpDial = svgEl('g', {}, inner)
  const R = LOUPE_DIAL.R, dcx = cx, dcy = cy - LOUPE_DIAL.drop + R
  E.dialC = { dcx, dcy, R }
  svgEl('circle', { class: 'dial-face', cx: dcx, cy: dcy, r: R }, E.lpDial)
  const ang = sec => (sec - LOUPE_DIAL.at) * 6 * DEG
  const pol = (sec, rad) => [dcx + rad * Math.sin(ang(sec)), dcy - rad * Math.cos(ang(sec))]
  const sector = (a, b, r0, r1) => {
    const [p0, p1, p2, p3] = [pol(a, r1), pol(b, r1), pol(b, r0), pol(a, r0)]
    return `M${p0}A${r1} ${r1} 0 0 1 ${p1}L${p2}A${r0} ${r0} 0 0 0 ${p3}Z`
  }
  E.lzD = svgEl('path', { class: 'zone zone-dial', d: sector(0.5, 1.5, R - 44, R) }, E.lpDial)
  for (let s = -3; s <= 5; s++) {
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

  // ── Straße (Draufsicht) mit Start- und Ziellinie ──
  E.road = svgEl('g', {}, E.root)
  const { top, h } = ROAD
  svgEl('rect', { class: 'road', x: -40, y: top, width: 1280, height: h }, E.road)
  ;[top + 5, top + h - 5].forEach(y => svgEl('line', { class: 'road-edge', x1: -40, x2: 1240, y1: y, y2: y }, E.road))
  svgEl('line', { class: 'road-center', x1: -40, x2: 1240, y1: top + h / 2, y2: top + h / 2 }, E.road)
  E.lines = [X0, FINISH].map(x => svgEl('line', { class: 'road-line', x1: x, x2: x, y1: top }, E.road))
  // Fahrbahn-Beschriftung (wie aufgemalt) im unteren Fahrstreifen, innerhalb der Strecke
  E.lineLbl = [[X0 + 10, 'START', 'start'], [FINISH - 10, 'ZIEL', 'end']].map(([x, s, anchor]) =>
    text(E.root, 'line-label', { x, y: top + h - 14, 'text-anchor': anchor }, s))

  // ── Lichtschranken: Sender oben, Empfänger unten, Laserstrahl ──
  E.lb = [X0, FINISH].map(x => {
    const g = svgEl('g', { class: 'barrier' }, E.root)
    const beam = svgEl('line', { class: 'beam', x1: x, x2: x, y1: top - 2, y2: top + h + 2 }, g)
    svgEl('rect', { class: 'barrier-box', x: x - 8, y: top - 16, width: 16, height: 15, rx: 3 }, g)
    svgEl('rect', { class: 'barrier-box', x: x - 6, y: top + h + 1, width: 12, height: 6, rx: 2 }, g)
    const led = svgEl('circle', { class: 'barrier-led', cx: x, cy: top - 9, r: 3 }, g)
    const ring = svgEl('circle', { class: 'barrier-ring', cx: x, cy: top + h / 2 }, g)
    return { g, beam, led, ring, x }
  })

  E.car = buildCar(E.root)

  // ── Maßbänder, Ablesebereich, Hilfslinie Ziel → Bänder ──
  E.tapes = [0, 1].map(i => buildTape(E.root, i))
  E.zoneEdge = [19.5, 20.5].map(s => svgEl('line', { class: 'zone-edge', x1: xOf(s), x2: xOf(s),
    y1: TAPES[0].top - 4, y2: TAPES[0].top + TAPES[0].h + 4 }, E.root))
  E.guide = svgEl('line', { class: 'finish-guide', x1: FINISH, x2: FINISH, y1: top + h }, E.root)

  // ── Tafeln mit Uhren und Lupe ──
  E.panels = [0, 1].map(i => buildPanel(E.root, i))
  buildWatchA(E.panels[0])
  buildWatchB(E.panels[1])
  buildLoupe(E.panels[1])

  // ── Messprotokoll ──
  E.table = svgEl('g', { class: 'proto' }, E.root)
  const [c0, c1, c2, c3] = TABLE.x, y0 = TABLE.y0
  E.tHead = svgEl('g', {}, E.table)
  text(E.tHead, 'proto-head', { x: c0, y: y0 }, 'Messprotokoll')
  symText(E.tHead, 'proto-head', { x: c1, y: y0 }, 's')
  symText(E.tHead, 'proto-head', { x: c2, y: y0 }, 't')
  const vh = symText(E.tHead, 'proto-head', { x: c3, y: y0 }, 'v', ' = ')
  svgEl('tspan', { class: 'sym' }, vh).textContent = 's'
  svgEl('tspan', {}, vh).textContent = ' / '
  svgEl('tspan', { class: 'sym' }, vh).textContent = 't'
  svgEl('line', { class: 'proto-rule', x1: c0, x2: 690, y1: y0 + 10, y2: y0 + 10 }, E.tHead)
  E.rows = ROW.map((r, i) => {
    const y = y0 + TABLE.dy * (i + 1)
    const cls = ['val-a', 'val-b', 'val-c'][i]
    return {
      name: text(E.table, `proto-name ${cls}`, { x: c0, y }, ['Person A', 'Person B', 'Kombiniert'][i]),
      s: text(E.table, 'proto-cell', { x: c1, y }, r.s),
      t: text(E.table, 'proto-cell', { x: c2, y }, r.t),
      v: text(E.table, `proto-cell proto-v ${cls}`, { x: c3, y }, r.v),
    }
  })

  // ── v-Achse mit Bändern der möglichen Geschwindigkeiten ──
  E.vAxis = createAxis(E.root, 'x')
  E.vName = symText(E.root, 'axis-name-sm', { 'text-anchor': 'start' }, 'v', ' / (m/s)')
  E.bands = ROW.map((r, i) => {
    const cls = ['a', 'b', 'c'][i]
    return {
      rect: svgEl('rect', { class: `vband vband-${cls}`, height: 12, rx: 3 }, E.root),
      dot: svgEl('circle', { class: `vdot vdot-${cls}`, r: 4 }, E.root),
      lbl: text(E.root, `vband-label val-${cls}`, { 'text-anchor': 'end' }, ['A', 'B', 'A+B'][i]),
    }
  })
  E.trueLine = svgEl('line', { class: 'v-true' }, E.root)
  E.trueLbl = text(E.root, 'v-true-label', { 'text-anchor': 'middle' }, 'wahrer Wert')
  return E.root
}

function renderBands(S, V) {
  const L = V.L, R = V.R
  ROW.forEach((r, i) => {
    const g = S[`bd${i}`], B = E.bands[i], y = BAND_Y[i]
    const { value, lo, hi } = r.e.v
    const a = clamp(V.sx(value - (value - lo) * g), L, R), b = clamp(V.sx(value + (hi - value) * g), L, R)
    set(B.rect, { x: a, y, width: Math.max(0, b - a) }); op(B.rect, Math.min(1, g * 3))
    const dx = V.sx(value)
    set(B.dot, { cx: dx, cy: y + 6 }); op(B.dot, g > 0.002 && dx >= L && dx <= R ? 1 : 0)
    set(B.lbl, { x: L - 14, y: y + 11 }); op(B.lbl, Math.min(1, g * 3))
  })
  const tx = V.sx(V_TRUE)
  set(E.trueLine, { x1: tx, x2: tx, y1: BAND_Y[0] - 6, y2: V_AXIS_Y })
  set(E.trueLbl, { x: tx, y: BAND_Y[0] - 11 })
  op(E.trueLine, S.vTrue); op(E.trueLbl, S.vTrue)
}

export function renderSpeed(S) {
  E.root.style.opacity = 1 - 0.62 * S.dim
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
  const { dcx, dcy, R } = E.dialC, al = (t - LOUPE_DIAL.at) * 6 * DEG
  set(E.lpHand, { x2: dcx + (R - 6) * Math.sin(al), y2: dcy - (R - 6) * Math.cos(al) })

  // Lupe
  op(E.loupe, S.lpA)
  op(E.lpTape, S.lpT); op(E.conT, S.lpT)
  op(E.lpDial, S.lpD); op(E.conD, S.lpD)
  op(E.lzT, S.lzT); op(E.lzD, S.lzD)

  // Messprotokoll
  op(E.tHead, S.tbA)
  E.rows.forEach((row, i) => {
    op(row.name, i < 2 ? S.tbA : S.row2)
    ;['s', 't', 'v'].forEach(k => op(row[k], S[`c${i}${k}`]))
  })

  // v-Achse
  const V = viewOf(S)
  E.vAxis.render(V, { at: V_AXIS_Y, draw: S.vAx, ticks: S.vTk, alpha: S.vAx > 0.001 ? 1 : 0 })
  set(E.vName, { x: V.R + 30, y: V_AXIS_Y + 6 }); op(E.vName, S.vAx)
  renderBands(S, V)
}
