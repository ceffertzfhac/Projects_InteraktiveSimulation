'use strict'

import { T_MAX, DT, TRACK_X0, PPM, TRACK_LEN_M } from './constants.js'
import { store } from './state.js'

// ── Koordinaten-Transformation (zentral, nie verstreute Pixel-Rechnung) ────────
// physikalisches x [m] → Bildschirm-x [px]. Für 2-D-Sims: eine physToScreen(x,y).
export const xToScreen = x_m => TRACK_X0 + x_m * PPM

// ── Analytisches Modell ────────────────────────────────────────────────────────
// Gleichförmig beschleunigte Bewegung ab x0 = 0:
//   x(t) = v0·t + ½·a·t²      v(t) = v0 + a·t      a(t) = a = const
export const xOf = t => store.v0 * t + 0.5 * store.a * t * t
export const vOf = t => store.v0 + store.a * t

// ── precompute(): füllt die Ergebnis-Arrays für den GESAMTEN Zeitverlauf ────────
// Die Animation rechnet danach KEINE Physik mehr — sie interpoliert nur (s. u.).
// t_end = wenn die Bahn (0 … TRACK_LEN_M) verlassen wird, sonst T_MAX.
// (Scan-and-break — dieselbe Idee wie die Kollisionszeit im Atwood-precompute.)
export function precompute() {
  store.t_data = []; store.x_data = []; store.v_data = []; store.a_data = []

  let t = 0
  for (; t <= T_MAX + 1e-9; t += DT) {
    const x = xOf(t)
    if (x < 0 || x > TRACK_LEN_M) break   // Bahnende erreicht
    store.t_data.push(t)
    store.x_data.push(x)
    store.v_data.push(vOf(t))
    store.a_data.push(store.a)
  }
  store.t_end = store.t_data.length ? store.t_data[store.t_data.length - 1] : 0
}

// ── interpolateAt(): Wert zu beliebiger Zeit t aus den precompute-Arrays ────────
// Kanonisches Muster (identisch zu Atwood) — KEINE zweite Interpolation anderswo.
export function interpolateAt(arr, t) {
  const { t_data } = store
  if (!t_data.length) return 0
  let i = t_data.findIndex(tv => tv > t)
  if (i === -1) i = t_data.length
  i = Math.max(0, i - 1)
  const t1 = t_data[i], t2 = t_data[i + 1] ?? t1
  const alpha = t2 > t1 ? (t - t1) / (t2 - t1) : 0
  return arr[i] + alpha * ((arr[i + 1] ?? arr[i]) - arr[i])
}
