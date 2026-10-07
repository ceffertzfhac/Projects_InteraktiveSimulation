'use strict'
// Grundlagen-Abschluss „Zeitmessung" (→ BACKLOG FSS9 j): ein Auto fährt von der Start- zur
// Ziellinie, zwei Stoppuhren messen die Fahrzeit — eine mit nur einem Sekundenzeiger
// (Lupe auf das Zifferblatt), eine digitale (Auflösung nur an der Anzeige, PO: FSS12). Je Uhr ein Zahlenstrahl
// mit Rundungsintervall; der feine liegt als schmaler Streifen im groben (Verbindungslinien).
// Werte wie im Kapitel Division (wahr 2,1415 s → 2 s bzw. 2,14 s).
// Bildschirmkoordinaten, keine Kamera. Szene-Schlüssel: timeKeys(); render liest nur Zahlen.

import { svgEl, clamp, lerp } from '../../shared/js/step-kit.js'
import { fmt } from '../../shared/js/format.js'
import { parseMeasured } from './model.js'
import { uncIndex } from './stellen.js'
import { buildCar } from './division/render.js'
import { T_TRUE, READ } from './division/constants.js'

export const T_COARSE = parseMeasured(READ.tB)     // „2"    → [1,5 ; 2,5) s
export const T_FINE = parseMeasured(READ.tA)       // „2,14" → [2,135 ; 2,145) s

// ── Geometrie ────────────────────────────────────────────────────────────────
const ROAD = { x0: 40, x1: 740, top: 66, h: 70, start: 120, finish: 640 }
const CAR_SCALE = 0.72
const DIAL = { cx: 120, cy: 246, r: 50 }
const LOUPE = { cx: 268, cy: 246, r: 62, R: 330, drop: 14 }
const LCD = { cx: 520, cy: 246, w: 196, h: 64 }
// Zahlenstrahlen: t-Bereich → Bildschirm
const LINES = [
  { y: 444, t0: 0, t1: 4, x0: 90, x1: 1090, major: 1, minor: 0.5, dec: 0, m: T_COARSE },
  { y: 592, t0: 2.11, t1: 2.17, x0: 90, x1: 1090, major: 0.01, minor: 0.005, dec: 2, m: T_FINE },
]
const xOn = (L, t) => L.x0 + (t - L.t0) / (L.t1 - L.t0) * (L.x1 - L.x0)
const DEG = Math.PI / 180

export const timeKeys = () => ({
  tmA: 0,                     // ganze Zeitmessungs-Bühne
  tmCar: -0.32,               // Wagenfront: 0 = Startlinie, 1 = Ziellinie
  tmG0: 0, tmG1: 0,           // Leuchtrahmen Sekundenzeiger-Uhr / Digitaluhr
  tmZ: 0,                     // Ablesebereich in der Lupe
  tmL0: 0, tmB0: 0, tmP0: 0,  // Zahlenstrahl grob: Einzeichnen, Intervall, Messpunkt
  tmL1: 0, tmB1: 0, tmP1: 0,  // Zahlenstrahl fein
  tmCon: 0,                   // Verbindung feines Intervall ↔ Streifen im groben
})

const E = {}
const set = (el, a) => { for (const k in a) el.setAttribute(k, a[k]) }
const op = (el, a) => { el.style.opacity = a; el.style.display = a <= 0.002 ? 'none' : '' }
const text = (parent, cls, attrs, content = '') => {
  const t = svgEl('text', { class: cls, ...attrs }, parent)
  t.textContent = content
  return t
}
// „2,14 s": letzte Ziffer als unsicher markiert
function marked(parent, cls, attrs, str) {
  const t = svgEl('text', { class: cls, ...attrs }, parent)
  const i = uncIndex(str)
  t.append(str.slice(0, i))
  svgEl('tspan', { class: 'unc-digit' }, t).textContent = str[i]
  t.append(str.slice(i + 1))
  return t
}

function buildRoad(g) {
  const { x0, x1, top, h, start, finish } = ROAD
  const clip = svgEl('clipPath', { id: 'tm_road_clip' }, E.defs)
  svgEl('rect', { x: x0, y: top - 20, width: x1 - x0, height: h + 40, rx: 10 }, clip)
  const road = svgEl('g', { 'clip-path': 'url(#tm_road_clip)' }, g)
  svgEl('rect', { class: 'road', x: x0, y: top, width: x1 - x0, height: h, rx: 8 }, road)
  ;[top + 5, top + h - 5].forEach(y => svgEl('line', { class: 'road-edge', x1: x0, x2: x1, y1: y, y2: y }, road))
  svgEl('line', { class: 'road-center', x1: x0, x2: x1, y1: top + h / 2, y2: top + h / 2 }, road)
  ;[start, finish].forEach(x => svgEl('line', { class: 'road-line', x1: x, x2: x, y1: top, y2: top + h }, road))
  text(road, 'line-label', { x: start + 8, y: top + h - 12 }, 'START')
  text(road, 'line-label', { x: finish - 8, y: top + h - 12, 'text-anchor': 'end' }, 'ZIEL')
  E.car = svgEl('g', {}, road)
  buildCar(E.car)
}

function buildDial(g) {
  const { cx, cy, r } = DIAL
  E.glow0 = svgEl('circle', { class: 'watch-glow', cx, cy, r: r + 6 }, g)
  svgEl('rect', { class: 'watch-btn', x: cx - 7, y: cy - r - 11, width: 14, height: 10, rx: 2 }, g)
  svgEl('circle', { class: 'dial-face', cx, cy, r }, g)
  for (let i = 0; i < 60; i++) {
    const a = i * 6 * DEG, l = i % 5 ? 4 : 8, s = Math.sin(a), c = -Math.cos(a)
    svgEl('line', { class: i % 5 ? 'dial-tick' : 'dial-tick major',
      x1: cx + (r - 3) * s, y1: cy + (r - 3) * c, x2: cx + (r - 3 - l) * s, y2: cy + (r - 3 - l) * c }, g)
  }
  ;[60, 15, 30, 45].forEach((n, i) => text(g, 'dial-num',
    { x: cx + (r - 19) * Math.sin(i * 90 * DEG), y: cy - (r - 19) * Math.cos(i * 90 * DEG) + 4, 'text-anchor': 'middle' }, String(n)))
  E.hand = svgEl('line', { class: 'dial-hand', x1: cx, y1: cy }, g)
  svgEl('circle', { class: 'dial-hub', cx, cy, r: 4 }, g)
}

// Lupe aufs Zifferblatt: großer Ausschnitt um die abgelesene Sekunde, Zeiger mitlaufend
function buildLoupe(g) {
  const { cx, cy, r, R, drop } = LOUPE, T = T_COARSE
  svgEl('line', { class: 'loupe-con', x1: cx - r, y1: cy, x2: DIAL.cx + 16, y2: DIAL.cy - DIAL.r + 6 }, g)
  const clip = svgEl('clipPath', { id: 'tm_loupe_clip' }, E.defs)
  svgEl('circle', { cx, cy, r }, clip)
  const inner = svgEl('g', { 'clip-path': 'url(#tm_loupe_clip)' }, g)
  svgEl('circle', { class: 'loupe-bg', cx, cy, r }, inner)
  const dcx = cx, dcy = cy - drop + R
  E.lpC = { dcx, dcy }
  svgEl('circle', { class: 'dial-face', cx: dcx, cy: dcy, r: R }, inner)
  const pol = (sec, rad) => {
    const a = (sec - T.value) * 6 * DEG
    return [dcx + rad * Math.sin(a), dcy - rad * Math.cos(a)]
  }
  const [p0, p1, p2, p3] = [pol(T.lo, R), pol(T.hi, R), pol(T.hi, R - 40), pol(T.lo, R - 40)]
  E.zone = svgEl('path', { class: 'zone zone-dial',
    d: `M${p0}A${R} ${R} 0 0 1 ${p1}L${p2}A${R - 40} ${R - 40} 0 0 0 ${p3}Z` }, inner)
  for (let s = T.value - 3; s <= T.value + 3; s++) {
    const [x1, y1] = pol(s, R - 2), [x2, y2] = pol(s, R - 20), [tx, ty] = pol(s, R - 33)
    svgEl('line', { class: 'dial-tick major', x1, y1, x2, y2 }, inner)
    text(inner, 'dial-num loupe-num', { x: tx, y: ty + 5, 'text-anchor': 'middle' }, String((s + 60) % 60 || 60))
  }
  E.lpHand = svgEl('line', { class: 'dial-hand', x1: dcx, y1: dcy }, inner)
  svgEl('circle', { class: 'loupe-frame', cx, cy, r }, g)
  svgEl('line', { class: 'loupe-handle', x1: cx + r * 0.72, y1: cy + r * 0.72, x2: cx + r * 1.0, y2: cy + r * 1.0 }, g)
}

function buildLcd(g) {
  const { cx, cy, w, h } = LCD
  E.glow1 = svgEl('rect', { class: 'watch-glow', x: cx - w / 2 - 5, y: cy - h / 2 - 5, width: w + 10, height: h + 10, rx: 18 }, g)
  ;[-40, 40].forEach(dx => svgEl('rect', { class: 'watch-btn', x: cx + dx - 9, y: cy - h / 2 - 7, width: 18, height: 9, rx: 2 }, g))
  svgEl('rect', { class: 'watch-case', x: cx - w / 2, y: cy - h / 2, width: w, height: h, rx: 14 }, g)
  svgEl('rect', { class: 'lcd', x: cx - w / 2 + 12, y: cy - h / 2 + 10, width: w - 24, height: h - 20, rx: 6 }, g)
  E.lcd = text(g, 'lcd-text', { x: cx + 18, y: cy + 11, 'text-anchor': 'end' })
  text(g, 'lcd-unit', { x: cx + 26, y: cy + 11 }, 's')
}

// Zahlenstrahl mit fester Teilung, Intervall [lo ; hi), Messpunkt mit markierter letzter Ziffer
function buildLine(g, L) {
  const o = { L, g: svgEl('g', { class: 'tm-line' }, g) }
  const { y, x0, x1 } = L
  o.axis = svgEl('line', { class: 'axis-line', x1: x0 - 14, y1: y, y2: y }, o.g)
  o.head = svgEl('path', { class: 'axis-head' }, o.g)
  o.ticks = svgEl('g', {}, o.g)
  const n = Math.round((L.t1 - L.t0) / L.minor)
  for (let i = 0; i <= n; i++) {
    const t = L.t0 + i * L.minor, x = xOn(L, t)
    const major = Math.abs(t / L.major - Math.round(t / L.major)) < 1e-6
    svgEl('line', { class: 'tick', x1: x, x2: x, y1: y - (major ? 0 : 0), y2: y + (major ? 10 : 6) }, o.ticks)
    if (major) text(o.ticks, 'tick-label', { x, y: y + 28, 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, fmt(t, L.dec))
  }
  o.name = text(o.g, 'axis-name', { x: x1 + 40, y: y + 7 })
  svgEl('tspan', { class: 'sym' }, o.name).textContent = 't'
  svgEl('tspan', {}, o.name).textContent = ' / s'
  const { m } = L, a = xOn(L, m.lo), b = xOn(L, m.hi)
  o.band = svgEl('rect', { class: 'band-l', x: a, y: y - 18, width: b - a, height: 36, rx: 4 }, o.g)
  o.ends = [svgEl('circle', { class: 'end-closed', cx: a, cy: y, r: 6 }, o.g),
    svgEl('circle', { class: 'end-open', cx: b, cy: y, r: 6 }, o.g)]
  o.bnd = [text(o.g, 'bound-label', { x: a - 8, y: y - 28, 'text-anchor': 'end' }, fmt(m.lo, m.decimals + 1)),
    text(o.g, 'bound-label', { x: b + 8, y: y - 28 }, fmt(m.hi, m.decimals + 1))]
  const px = xOn(L, m.value)
  o.halo = svgEl('circle', { class: 'halo-l', cx: px, cy: y, r: 18 }, o.g)
  o.dot = svgEl('circle', { class: 'dot-l', cx: px, cy: y, r: 7 }, o.g)
  o.val = marked(o.g, 'value-label val-l tm-val', { x: px, y: y - 30, 'text-anchor': 'middle' }, `${m.text} s`)
  return o
}

export function initTimeStage(root, defs) {
  E.defs = defs
  E.g = svgEl('g', { class: 'time-stage' }, root)
  buildRoad(E.g)
  E.watches = svgEl('g', {}, E.g)
  buildDial(E.watches)
  buildLoupe(E.watches)
  buildLcd(E.watches)
  text(E.watches, 'panel-item tm-cap', { x: (DIAL.cx + LOUPE.cx) / 2, y: DIAL.cy + 92, 'text-anchor': 'middle' },
    'Stoppuhr mit Sekundenzeiger')
  text(E.watches, 'panel-item tm-cap', { x: LCD.cx, y: DIAL.cy + 92, 'text-anchor': 'middle' },
    'Digitale Stoppuhr')
  E.lines = LINES.map(L => buildLine(E.g, L))
  // feines Intervall als Streifen im groben, Verbindungslinien zum feinen Zahlenstrahl
  const [A, B] = LINES, m = T_FINE
  E.con = svgEl('g', { class: 'tm-con' }, E.g)
  svgEl('rect', { class: 'tm-sliver', x: xOn(A, m.lo) - 1, y: A.y - 18, width: xOn(A, m.hi) - xOn(A, m.lo) + 2, height: 36 }, E.con)
  svgEl('path', { class: 'tm-con-fill', d: `M${xOn(A, m.lo) - 1} ${A.y + 18}L${xOn(A, m.hi) + 1} ${A.y + 18}`
    + `L${xOn(B, m.hi)} ${B.y - 18}L${xOn(B, m.lo)} ${B.y - 18}Z` }, E.con)
  ;[m.lo, m.hi].forEach((t, k) => svgEl('line', { class: 'tm-con-line',
    x1: xOn(A, t) + (k ? 1 : -1), y1: A.y + 18, x2: xOn(B, t), y2: B.y - 18 }, E.con))
  return E.g
}

export function renderTime(S) {
  op(E.g, S.tmA)
  if (S.tmA <= 0.002) return
  // Wagen und Uhren: gemessene Zeit aus der Wagenposition (Uhren laufen zwischen den Linien)
  const { start, finish, top, h } = ROAD
  E.car.setAttribute('transform', `translate(${lerp(start, finish, S.tmCar).toFixed(2)} ${top + h / 2}) scale(${CAR_SCALE})`)
  const t = clamp(S.tmCar, 0, 1) * T_TRUE
  E.lcd.textContent = fmt(Math.floor(t * 100 + 1e-6) / 100, 2)
  const { cx, cy, r } = DIAL, a = t * 6 * DEG
  set(E.hand, { x2: cx + (r - 8) * Math.sin(a), y2: cy - (r - 8) * Math.cos(a) })
  const { dcx, dcy } = E.lpC, al = (t - T_COARSE.value) * 6 * DEG, R = LOUPE.R - 6
  set(E.lpHand, { x2: dcx + R * Math.sin(al), y2: dcy - R * Math.cos(al) })
  op(E.glow0, S.tmG0); op(E.glow1, S.tmG1); op(E.zone, S.tmZ)
  // Zahlenstrahlen
  E.lines.forEach((o, i) => {
    const d = S[`tmL${i}`], B = S[`tmB${i}`], P = S[`tmP${i}`], { L } = o
    op(o.g, d > 0.002 ? 1 : 0)
    if (d <= 0.002) return
    const end = lerp(L.x0 - 14, L.x1 + 22, d)
    set(o.axis, { x2: end })
    set(o.head, { d: `M${end - 11} ${L.y - 5.5}L${end} ${L.y}L${end - 11} ${L.y + 5.5}` })
    op(o.head, d > 0.85 ? 1 : 0)
    op(o.ticks, clamp((d - 0.3) / 0.5, 0, 1)); op(o.name, clamp((d - 0.8) / 0.2, 0, 1))
    op(o.band, B); o.ends.forEach(e => op(e, B)); o.bnd.forEach(e => op(e, B))
    op(o.halo, P); op(o.dot, P); op(o.val, P)
  })
  op(E.con, S.tmCon)
}
