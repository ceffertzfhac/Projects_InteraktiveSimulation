'use strict'

// ── Stateless-Berechnung ─────────────────────────────────────────────────────
// DOM-frei und damit in Node importierbar/testbar (Blueprint §9.3). Der
// „Zeitverlauf" dieser Sim ist die Verfeinerung der Zerlegung: precompute()
// füllt die Näherungsfolgen U(n), O(n), M(n) für ALLE n = 1 … N_MAX, die
// Animation indiziert danach nur noch hinein (keine Physik pro Frame).

import { FUNCS, X_MIN, X_MAX, NUM_POINTS, N_MAX, AB_MIN_WIDTH } from './constants.js'
import { store } from './state.js'

// ── Funktionskurve über den Definitionsbereich abtasten ──────────────────────
export function sampleCurve(funcKey) {
  const f = FUNCS[funcKey].f
  const xs = new Array(NUM_POINTS)
  const ys = new Array(NUM_POINTS)
  const step = (X_MAX - X_MIN) / (NUM_POINTS - 1)
  for (let i = 0; i < NUM_POINTS; i++) {
    const x = X_MIN + i * step
    xs[i] = x
    ys[i] = f(x)
  }
  return { xs, ys }
}

// ── Hauptsatz: exakter Wert des bestimmten Integrals ─────────────────────────
export function exactIntegral(funcKey, a, b) {
  const F = FUNCS[funcKey].F
  return F(b) - F(a)
}

// Integralfunktion F(x) = ∫ₐˣ f(t) dt (Stammfunktion, auf F(a) = 0 normiert)
export function integralFunction(funcKey, a, x) {
  const F = FUNCS[funcKey].F
  return F(x) - F(a)
}

// ── Infimum / Supremum auf einem Teilintervall — EXAKT ───────────────────────
// Kandidaten sind die beiden Ränder plus alle kritischen Stellen (f' = 0), die
// im Intervall liegen. Für stetige, stückweise monotone Funktionen ist das
// vollständig — kein Abtastfehler wie bei einer Stichproben-Suche.
export function infSup(funcKey, xl, xr) {
  const { f, crit } = FUNCS[funcKey]
  let lo = Math.min(f(xl), f(xr))
  let hi = Math.max(f(xl), f(xr))
  for (const c of crit) {
    if (c > xl && c < xr) {
      const v = f(c)
      if (v < lo) lo = v
      if (v > hi) hi = v
    }
  }
  return { lo, hi }
}

// ── Streifen der Zerlegung (für die Zeichnung) ───────────────────────────────
// Je Teilintervall: Ränder, Infimum (Untersumme), Supremum (Obersumme),
// Mittelpunkt und dessen Funktionswert (Mittelpunktsregel).
export function strips(funcKey, a, b, n) {
  const f = FUNCS[funcKey].f
  const dx = (b - a) / n
  const out = new Array(n)
  for (let i = 0; i < n; i++) {
    const xl = a + i * dx
    const xr = i === n - 1 ? b : a + (i + 1) * dx   // letzter Rand exakt auf b
    const { lo, hi } = infSup(funcKey, xl, xr)
    const xm = (xl + xr) / 2
    out[i] = { xl, xr, lo, hi, xm, fm: f(xm) }
  }
  return out
}

// ── Riemann-Summen zu einer Zerlegung in n Streifen ──────────────────────────
// U(n) = Σ inf f · Δx   ≤   ∫ₐᵇ f dx   ≤   Σ sup f · Δx = O(n)
// M(n) = Σ f(Mitte) · Δx  (liegt stets zwischen U und O, konvergiert schneller)
export function sums(funcKey, a, b, n) {
  const f = FUNCS[funcKey].f
  const dx = (b - a) / n
  let U = 0, O = 0, M = 0
  for (let i = 0; i < n; i++) {
    const xl = a + i * dx
    const xr = i === n - 1 ? b : a + (i + 1) * dx
    const { lo, hi } = infSup(funcKey, xl, xr)
    const w = xr - xl
    U += lo * w
    O += hi * w
    M += f((xl + xr) / 2) * w
  }
  return { U, O, M, dx }
}

// ── Kumulierte Flächenbilanz entlang der Zerlegung ───────────────────────────
// Liefert an jedem Zerlegungspunkt x_k die bis dahin aufsummierte Unter- bzw.
// Obersumme. Das sind gerade die Treppen-Näherungen der Integralfunktion F(x)
// — im F(x)-Diagramm schachteln sie die exakte Kurve ein (Hauptsatz sichtbar).
export function cumulative(funcKey, a, b, n) {
  const st = strips(funcKey, a, b, n)
  const xs = [a], cumU = [0], cumO = [0], cumM = [0]
  let u = 0, o = 0, m = 0
  for (const s of st) {
    const w = s.xr - s.xl
    u += s.lo * w; o += s.hi * w; m += s.fm * w
    xs.push(s.xr); cumU.push(u); cumO.push(o); cumM.push(m)
  }
  return { xs, cumU, cumO, cumM }
}

// ── precompute(): Näherungsfolgen für ALLE Zerlegungen n = 1 … N_MAX ─────────
// Danach rechnet die Verfeinerungs-Animation keine Summen mehr — sie liest nur
// noch U_data[n] / O_data[n] / M_data[n] (Index = Streifenzahl, Index 0 leer).
export function precompute() {
  const { funcKey, a, b } = store
  const { xs, ys } = sampleCurve(funcKey)
  store.xs = xs
  store.ys = ys
  store.exact = exactIntegral(funcKey, a, b)

  store.n_data = [NaN]
  store.U_data = [NaN]
  store.O_data = [NaN]
  store.M_data = [NaN]
  for (let n = 1; n <= N_MAX; n++) {
    const { U, O, M } = sums(funcKey, a, b, n)
    store.n_data.push(n)
    store.U_data.push(U)
    store.O_data.push(O)
    store.M_data.push(M)
  }
}

// ── Grenzen-Guard: b − a ≥ AB_MIN_WIDTH, beide im Definitionsbereich ─────────
// Der zuletzt bewegte Regler („moved") behält seinen Wert, der andere weicht aus.
export function clampLimits(a, b, moved) {
  a = Math.min(Math.max(a, X_MIN), X_MAX)
  b = Math.min(Math.max(b, X_MIN), X_MAX)
  if (b - a >= AB_MIN_WIDTH) return { a, b }
  if (moved === 'a') {
    b = a + AB_MIN_WIDTH
    if (b > X_MAX) { b = X_MAX; a = X_MAX - AB_MIN_WIDTH }
  } else {
    a = b - AB_MIN_WIDTH
    if (a < X_MIN) { a = X_MIN; b = X_MIN + AB_MIN_WIDTH }
  }
  return { a, b }
}

// ── interpolateAt(): Wert einer Folge an beliebiger Abszisse ─────────────────
// Kanonisches Muster (vgl. Scaffold/Atwood) — die einzige Interpolation der Sim.
// `xsArr` muß monoton wachsen; genutzt für den Hover-Cursor beider Diagramme.
export function interpolateAt(xsArr, ysArr, x) {
  if (!xsArr.length) return NaN
  if (x <= xsArr[0]) return ysArr[0]
  const last = xsArr.length - 1
  if (x >= xsArr[last]) return ysArr[last]
  let i = xsArr.findIndex(v => v > x)
  i = Math.max(0, i - 1)
  const x1 = xsArr[i], x2 = xsArr[i + 1]
  const alpha = x2 > x1 ? (x - x1) / (x2 - x1) : 0
  return ysArr[i] + alpha * (ysArr[i + 1] - ysArr[i])
}
