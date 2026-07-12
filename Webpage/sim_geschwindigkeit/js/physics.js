'use strict'

// ── Stateless-Berechnung ─────────────────────────────────────────────────────
// Werkzeug ohne Zeitverlauf: statt precompute(t) über die Zeit werden hier die
// Ort-Zeit-Kurve, die automatischen Ordinaten-Grenzen und die Geschwindigkeits-
// Analyse (Sekanten-/Tangentensteigung) zu den aktuellen Parametern berechnet.

import { FUNCS, T_MIN, T_MAX, NUM_POINTS, DELTA_LIMIT } from './constants.js'

// Ort-Zeit-Kurve über den Definitionsbereich abtasten
export function sampleCurve(funcKey) {
  const f = FUNCS[funcKey].f
  const ts = new Array(NUM_POINTS)
  const xs = new Array(NUM_POINTS)
  const step = (T_MAX - T_MIN) / (NUM_POINTS - 1)
  for (let i = 0; i < NUM_POINTS; i++) {
    const t = T_MIN + i * step
    ts[i] = t
    xs[i] = f(t)
  }
  return { ts, xs }
}

// Automatische Ordinaten-Grenzen aus den Ortswerten (mit Rand)
export function xRange(xs) {
  let mn = Infinity, mx = -Infinity
  for (const x of xs) {
    if (x < mn) mn = x
    if (x > mx) mx = x
  }
  const range = mx - mn
  const pad = Math.max(0.1 * range, 0.5)
  return { xMin: mn - pad, xMax: mx + pad }
}

// Δt-Regler-Grenzen: je Richtung UNABHÄNGIG ermittelt (Bugfix ggü. Original,
// das eine einzige, vom aktuellen Δt-Vorzeichen abhängige Grenze symmetrisch
// auf beide Seiten anwandte — dadurch konnte im Vorwärts-Modus nahe dem
// linken Rand ein Δt außerhalb des Definitionsbereichs erlaubt sein). Im
// zentrierten Modus ist die Grenze ohnehin symmetrisch (t₀±Δt/2 muß beidseitig
// im Bereich bleiben).
export function deltaBounds(t0, centered) {
  if (centered) {
    const m = Math.min(t0 - T_MIN, T_MAX - t0, DELTA_LIMIT)
    return { min: -m, max: m }
  }
  const maxPos = Math.min(T_MAX - t0, DELTA_LIMIT)   // Δt>0: t0+Δt ≤ T_MAX
  const maxNeg = Math.min(t0 - T_MIN, DELTA_LIMIT)    // Δt<0: t0+Δt ≥ T_MIN
  return { min: -maxNeg, max: maxPos }
}

// Geschwindigkeits-Analyse: Stützpunkte P₁, P₂, Differenzenquotient
// (Sekantensteigung = Durchschnittsgeschwindigkeit v̄) und analytische
// Ableitung (Tangentensteigung = Momentangeschwindigkeit v) an t₀.
// Δt ist in BEIDEN Modi direkt t₂−t₁ (vorzeichenbehaftet):
//  - zentriert:  t₁ = t₀ − Δt/2, t₂ = t₀ + Δt/2  (Vorzeichen tauscht nur p1/p2)
//  - vorwärts:   t₁ = t₀,        t₂ = t₀ + Δt     (Vorzeichen: vorwärts/rückwärts)
// Δt=0 ist ein gültiger, bedeutungsvoller Zustand (nur Tangente sinnvoll) —
// mSec wird dann NaN (Guard), render.js blendet die Sekante dafür automatisch aus.
export function analyze(funcKey, t0, delta, centered) {
  const { f, fp } = FUNCS[funcKey]
  const t1 = centered ? t0 - delta / 2 : t0
  const t2 = centered ? t0 + delta / 2 : t0 + delta
  const x0 = f(t0)
  const x1 = f(t1)
  const x2 = f(t2)
  const dt = t2 - t1
  const dx = x2 - x1
  const mSec = Math.abs(dt) < 1e-9 ? NaN : dx / dt
  const mTan = fp(t0)
  return { t0, x0, t1, x1, t2, x2, dt, dx, mSec, mTan }
}
