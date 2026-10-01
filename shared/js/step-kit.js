'use strict'
// Bausteine für Schritt-Animationen (→ BACKLOG I19, Blueprint §10):
// Kamera, Achsen-Ticks beim Zoomen, Element-Pools, Folienkarten, Label-Überblendung.
// Alles, was Zustand ändert, schreibt nur Zahlen ins Szene-Objekt (Reversibilitäts-Regel).

import { fmt } from './format.js'

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
export const lerp = (a, b, t) => a + (b - a) * t
export const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

const SVG_NS = 'http://www.w3.org/2000/svg'
export function svgEl(tag, attrs = {}, parent = null) {
  const el = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  if (parent) parent.appendChild(el)
  return el
}

// ── Kamera ───────────────────────────────────────────────────────────────────
// Szene-Schlüssel: vL vR vT vB (Sichtfenster in SVG-Pixeln), camAX camAY (Anker
// in Weltkoordinaten), camUX camUY (Mitte − Anker in Sichtbreiten/-höhen),
// camLW (log10 der Sichtbreite). Gleicher Maßstab in x und y.
// Zoom über log10(Breite) → gleichmäßig empfundene Zoomgeschwindigkeit auch bei
// ×1000; der Anker bleibt beim Zoomen an seiner Bildschirmposition „kleben",
// statt daß die Mitte linear wandert (kein Seitwärts-Wischen beim Hineinzoomen).

export const cameraKeys = ({ view, cx, cy, w }) => ({
  vL: view.vL, vR: view.vR, vT: view.vT, vB: view.vB,
  camAX: cx, camAY: cy, camUX: 0, camUY: 0, camLW: Math.log10(w),
})

const aspect = v => (v.vB - v.vT) / (v.vR - v.vL)

export function viewOf(S) {
  const pw = S.vR - S.vL, ph = S.vB - S.vT
  const w = 10 ** S.camLW, h = w * ph / pw
  const cx = S.camAX + S.camUX * w, cy = S.camAY + S.camUY * h
  const x0 = cx - w / 2, y0 = cy - h / 2
  const kx = pw / w, ky = ph / h
  return {
    x0, x1: x0 + w, y0, y1: y0 + h, kx, ky,
    L: S.vL, R: S.vR, T: S.vT, B: S.vB,
    sx: x => S.vL + (x - x0) * kx,
    sy: y => S.vB - (y - y0) * ky,
  }
}

// Build-Zeit-Planer: kennt den Kamerazustand am Ende jedes bisher gebauten
// Schritts und erzeugt daraus nahtlose Tweens.
// tgt: { cx?, cy?, w?, view? }. Je Achse: Zielmitte angegeben → dorthin; sonst
// mit explizitem anchor.x/anchor.y → der Ankerpunkt bleibt an seiner
// Bildschirmstelle (z. B. Zahlengerade y = 0 bleibt beim Zoomen liegen);
// sonst bleibt die Mitte.
export function createCamera(S, start) {
  let cur = { ...start }
  return {
    get state() { return { ...cur } },
    to(tl, tgt, { duration = 1.1, ease = 'power2.inOut', at, anchor = {} } = {}) {
      const v0 = cur.view, v1 = tgt.view ?? v0
      const w0 = cur.w, w1 = tgt.w ?? w0
      const h0 = w0 * aspect(v0), h1 = w1 * aspect(v1)
      const zoomIn = w1 < w0
      const axis = (c0, cT, a, s0, s1) => {
        if (cT === undefined && a !== undefined) {
          const u = (c0 - a) / s0
          return { a, u0: u, u1: u, c1: a + u * s1 }
        }
        const c1 = cT ?? c0
        const an = a ?? (zoomIn ? c1 : c0)
        return { a: an, u0: (c0 - an) / s0, u1: (c1 - an) / s1, c1 }
      }
      const X = axis(cur.cx, tgt.cx, anchor.x, w0, w1)
      const Y = axis(cur.cy, tgt.cy, anchor.y, h0, h1)
      tl.set(S, { camAX: X.a, camAY: Y.a, camUX: X.u0, camUY: Y.u0 }, at)
      tl.to(S, {
        camUX: X.u1, camUY: Y.u1, camLW: Math.log10(w1),
        vL: v1.vL, vR: v1.vR, vT: v1.vT, vB: v1.vB, duration, ease,
      }, '<')
      cur = { cx: X.c1, cy: Y.c1, w: w1, view: v1 }
    },
  }
}

// ── Achsen-Ticks auf der 1-5-10-Leiter ───────────────────────────────────────
// Jede Stufe teilt die nächstgröbere (… 0,05 · 0,1 · 0,5 · 1 · 5 …), daher
// liegen feinere Ticks immer auf gröberen — beim Zoomen blenden Beschriftungen
// der feineren Stufe weich ein, statt daß die Teilung springt.
// level 2 = beschrifteter Haupt-Tick (Schritt S), 1 = Zwischenstufe F (Tick
// blendet ab 8 px Abstand ein, Beschriftung erst kurz bevor F zur Hauptstufe wird).
const finer = s => {
  const e = Math.floor(Math.log10(s) + 1e-9)
  return Math.round(s / 10 ** e) === 1 ? 5 * 10 ** (e - 1) : 10 ** e
}
export const decimalsOf = step => Math.max(0, -Math.floor(Math.log10(step) + 1e-9))

export function ladderTicks(min, max, k, { label = 110 } = {}) {
  const raw = label / k, b = 10 ** Math.floor(Math.log10(raw))
  const S = raw <= b * 1.000001 ? b : raw <= 5 * b ? 5 * b : 10 * b
  const F = finer(S)
  // Schwellen so, daß Ruhezustände sauber sind (Labels ganz an oder ganz aus)
  // und nur während einer Kamerafahrt überblendet wird.
  const fA = smooth(0.72 * label, 0.92 * label, F * k)
  const fTick = smooth(8, 20, F * k)
  const perS = Math.round(S / F)
  const ticks = []
  for (let i = Math.ceil(min / F - 1e-9); i * F <= max + 1e-12; i++) {
    ticks.push({ v: i * F, level: i % perS === 0 ? 2 : 1 })
  }
  return { ticks, S, F, fA, fTick, decS: decimalsOf(S), decF: decimalsOf(F) }
}

// ── Element-Pool (für pro Frame variable Anzahl Ticks/Labels) ───────────────
export function createPool(parent, make) {
  const items = []
  let used = 0
  return {
    begin() { used = 0 },
    next() {
      if (used === items.length) { const el = make(); parent.appendChild(el); items.push(el) }
      const el = items[used++]
      el.style.display = ''
      return el
    },
    end() { for (let i = used; i < items.length; i++) items[i].style.display = 'none' },
  }
}

const STAGGER = 0.5                                   // Breite der Wachstumsfront (Anteil)
export const backOut = t => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2   // Überschwinger ~6 %

// ── Achse mit Zoom-Ticks ─────────────────────────────────────────────────────
// dir 'x': waagrecht, Ticks/Labels darunter; 'y': senkrecht, Labels links.
// render(V, { at, draw, alpha, ticks, fixed }): at = Bildschirmlage der
// Achsenlinie (y bzw. x), draw = Einzeichnen 0…1, ticks = Deckkraft der
// automatischen Zoom-Teilung, fixed = [{ step, a }] feste Teilungen (überblendbar).
export function createAxis(parent, dir, { labelGap = 28, skipZero = false } = {}) {
  const isX = dir === 'x'
  const g = svgEl('g', { class: `axis axis-${dir}` }, parent)
  const ticksG = svgEl('g', {}, g)
  const labelsG = svgEl('g', {}, g)
  const line = svgEl('line', { class: 'axis-line' }, g)
  const head = svgEl('path', { class: 'axis-head' }, g)
  const tickPool = createPool(ticksG, () => svgEl('line', { class: 'tick' }))
  const labelPool = createPool(labelsG, () => svgEl('text', {
    class: 'tick-label', 'text-anchor': isX ? 'middle' : 'end', 'dominant-baseline': 'middle',
  }))

  return {
    render(V, { at, draw = 1, alpha = 1, ticks = 1, fixed = [] }) {
      g.style.display = alpha <= 0.002 ? 'none' : ''
      if (alpha <= 0.002) return
      g.style.opacity = alpha
      const from = isX ? V.L - 14 : V.B + 14
      const to = isX ? V.R + 22 : V.T - 22
      const end = lerp(from, to, draw)
      if (isX) {
        line.setAttribute('x1', from); line.setAttribute('x2', end)
        line.setAttribute('y1', at); line.setAttribute('y2', at)
        head.setAttribute('d', `M${end - 11} ${at - 5.5}L${end} ${at}L${end - 11} ${at + 5.5}`)
      } else {
        line.setAttribute('y1', from); line.setAttribute('y2', end)
        line.setAttribute('x1', at); line.setAttribute('x2', at)
        head.setAttribute('d', `M${at - 5.5} ${end + 11}L${at} ${end}L${at + 5.5} ${end + 11}`)
      }
      head.style.opacity = smooth(0.82, 1, draw)
      line.style.opacity = draw > 0.001 ? 1 : 0     // sonst runde Linienkappe als Punkt

      // Tick-Kandidaten sammeln: automatische 1-5-10-Leiter (Deckkraft `ticks`)
      // und/oder feste Teilungen `fixed: [{ step, a }]` (z. B. an die
      // Rundungsgenauigkeit gebunden). Gleiche Positionen werden zusammengeführt.
      const k = isX ? V.kx : V.ky
      const lo = isX ? V.x0 : V.y0, hi = isX ? V.x1 : V.y1
      const marks = new Map()
      const add = (v, op, len, la, dec, dy = 0) => {
        const key = v.toFixed(9)
        const m = marks.get(key)
        if (!m) marks.set(key, { v, op, len, la, dec, dy })
        else {
          if (op > m.op) { m.op = op; m.len = Math.max(m.len, len) }
          if (la > m.la) { m.la = la; m.dec = dec; m.dy = dy }
        }
      }
      if (ticks > 0.002) {
        const T = ladderTicks(lo, hi, k)
        for (const t of T.ticks) {
          const two = t.level === 2
          add(t.v, (two ? 1 : T.fTick) * ticks, two ? 10 : lerp(5, 10, T.fA),
            (two ? 1 : T.fA) * ticks, two ? T.decS : T.decF)
        }
      }
      // Feste Teilung mit „Wachsen": grow 0…1 läßt die Striche gestaffelt vom
      // Zentrum (z. B. Messwert) nach außen aus der Achse herauswachsen
      // (leichter Überschwinger), die Beschriftung steigt kurz danach auf.
      for (const f of fixed) {
        const a = f.a ?? 1, grow = f.grow ?? 1
        if (a <= 0.002 || grow <= 0.002 || (hi - lo) / f.step > 400) continue
        const dens = smooth(6, 16, f.step * k), labDens = smooth(48, 78, f.step * k)
        const dec = decimalsOf(f.step)
        const half = (hi - lo) / 2, c = f.center ?? (lo + hi) / 2
        for (let i = Math.ceil(lo / f.step - 1e-9); i * f.step <= hi + 1e-12; i++) {
          const v = i * f.step
          const d = Math.min(1, Math.abs(v - c) / half)
          const t = clamp((grow * (1 + STAGGER) - d) / STAGGER, 0, 1)
          if (t <= 0) continue
          const lt = clamp((t - 0.35) / 0.65, 0, 1)
          add(v, a * dens * Math.min(1, t * 2), 10 * backOut(t), a * labDens * lt, dec, (1 - lt) * 9)
        }
      }

      tickPool.begin(); labelPool.begin()
      for (const t of marks.values()) {
        const p = isX ? V.sx(t.v) : V.sy(t.v)
        if (isX ? (p < V.L - 0.5 || p > V.R + 0.5 || p > end) : (p > V.B + 0.5 || p < V.T - 0.5 || p < end)) continue
        if (t.op < 0.01) continue
        const tk = tickPool.next()
        if (isX) { tk.setAttribute('x1', p); tk.setAttribute('x2', p); tk.setAttribute('y1', at); tk.setAttribute('y2', at + t.len) }
        else { tk.setAttribute('y1', p); tk.setAttribute('y2', p); tk.setAttribute('x1', at); tk.setAttribute('x2', at - t.len) }
        tk.style.opacity = t.op
        if (t.la < 0.01 || (skipZero && Math.abs(t.v) < 1e-12)) continue
        const lb = labelPool.next()
        if (isX) { lb.setAttribute('x', p); lb.setAttribute('y', at + labelGap + t.dy) }
        else { lb.setAttribute('x', at - labelGap + 8 - t.dy); lb.setAttribute('y', p) }
        lb.textContent = fmt(t.v, t.dec)
        lb.style.opacity = t.la
      }
      tickPool.end(); labelPool.end()
    },
  }
}

// ── Folienkarten (HTML-Overlay) ──────────────────────────────────────────────
// Build-Zeit-Deck: merkt sich, welche Karte gerade steht, und überblendet.
export function createCardDeck({ enter = 0.55, exit = 0.25, rise = 14 } = {}) {
  let cur = null
  const out = (tl, el, at) =>
    tl.to(el, { autoAlpha: 0, y: -rise / 2, duration: exit, ease: 'power1.in' }, at)
  return {
    show(tl, el, at) {
      if (el === cur) return
      if (cur) out(tl, cur, at)
      tl.fromTo(el, { autoAlpha: 0, y: rise },
        { autoAlpha: 1, y: 0, duration: enter, ease: 'power3.out', immediateRender: false },
        cur ? '>-0.05' : at)
      cur = el
    },
    hide(tl, at) {
      if (!cur) return
      out(tl, cur, at)
      cur = null
    },
  }
}

// ── Überblendende Text-Slots ─────────────────────────────────────────────────
// Ein Label mit wechselndem Inhalt (3 → 3,0 → 3,00) als zwei Slots, die sich
// kreuzweise überblenden. Inhalt = Index in eine String-Tabelle (Zahl, also
// tween-/reversibel). Szene-Schlüssel: <key><0|1><i|a|o> (Index, Alpha, y-Versatz).
export const slotKeys = key => {
  const o = {}
  for (const n of [0, 1]) Object.assign(o, { [key + n + 'i']: 0, [key + n + 'a']: 0, [key + n + 'o']: 0 })
  return o
}

export function createSlots(S, key) {
  let active = -1
  return {
    show(tl, idx, { at, dur = 0.5 } = {}) {
      const n = active === 0 ? 1 : 0
      tl.set(S, { [key + n + 'i']: idx, [key + n + 'o']: 10 }, at)
      if (active >= 0) {
        tl.to(S, { [key + active + 'a']: 0, [key + active + 'o']: -8,
          duration: dur * 0.6, ease: 'power1.in' }, '<')
      }
      tl.to(S, { [key + n + 'a']: 1, [key + n + 'o']: 0, duration: dur, ease: 'power3.out' },
        active >= 0 ? '<0.12' : '<')
      active = n
    },
    hide(tl, { at, dur = 0.35 } = {}) {
      if (active < 0) return
      tl.to(S, { [key + active + 'a']: 0, duration: dur, ease: 'power1.in' }, at)
      active = -1
    },
  }
}

// Liest einen Slot für das Rendering: [{ i, a, o }, { i, a, o }]
export const readSlots = (S, key) => [0, 1].map(n => ({
  i: Math.round(S[key + n + 'i']), a: S[key + n + 'a'], o: S[key + n + 'o'],
}))
