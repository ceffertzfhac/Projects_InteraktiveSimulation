'use strict'

// ── Stateless-Berechnung ─────────────────────────────────────────────────────
// Werkzeug ohne Zeitverlauf: statt precompute(t) über die Zeit werden hier die
// Funktionskurve, die automatischen Ordinaten-Grenzen und die Grenzwert-Analyse
// (Sekanten-/Tangentensteigung) zu den aktuellen Parametern berechnet.

import { FUNCS, X_MIN, X_MAX, NUM_POINTS, DELTA_LIMIT } from './constants.js'

// Funktionskurve über den Definitionsbereich abtasten
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

// Automatische Ordinaten-Grenzen aus den Funktionswerten (mit Rand)
export function yRange(ys) {
  let mn = Infinity, mx = -Infinity
  for (const y of ys) {
    if (y < mn) mn = y
    if (y > mx) mx = y
  }
  const range = mx - mn
  const pad = Math.max(0.1 * range, 0.5)
  return { yMin: mn - pad, yMax: mx + pad }
}

// Größte Betragsgrenze für δ, so daß die Stützpunkte im Definitionsbereich
// bleiben; zusätzlich hart auf DELTA_LIMIT gedeckelt. Bewußt MODUS-UNABHÄNGIG:
// die Schranke deckt den Vorwärts-Fall (|δ| ≤ min) und damit erst recht den
// zentrierten (δ/2 ≤ min) ab. So bleibt δ beim Umschalten zentriert↔vorwärts
// unverändert (kein Klemm-Sprung).
export function maxAbsDelta(x0) {
  return Math.min(x0 - X_MIN, X_MAX - x0, DELTA_LIMIT)
}

// Grenzwert-Analyse: Stützpunkte P₁, P₂, Differenzenquotient (Sekantensteigung)
// und analytische Ableitung (Tangentensteigung) an der Stützstelle x₀.
// δ ist in BEIDEN Modi der volle Stützpunkt-Abstand Δx (= x₂ − x₁), der Nenner
// des Differenzenquotienten ist also stets δ. Beim Umschalten bleibt die
// Schrittweite gleich; nur die Aufteilung ändert sich:
//  - zentriert:  x₁ = x₀ − δ/2, x₂ = x₀ + δ/2  (symmetrisch; Zähler zeigt δ/2)
//  - vorwärts:   x₁ = x₀,       x₂ = x₀ + δ     (Vorwärts-Differenzenquotient)
export function analyze(funcKey, x0, delta, centered) {
  const { f, fp } = FUNCS[funcKey]
  const x1 = centered ? x0 - delta / 2 : x0
  const x2 = centered ? x0 + delta / 2 : x0 + delta
  const y0 = f(x0)
  const y1 = f(x1)
  const y2 = f(x2)
  const dx = x2 - x1
  const dy = y2 - y1
  const mSec = Math.abs(dx) < 1e-9 ? NaN : dy / dx
  const mTan = fp(x0)
  return { x0, y0, x1, y1, x2, y2, dx, dy, mSec, mTan }
}
