'use strict'

// ── Physikalisches Pendel: schwingendes Lineal ─────────────────────────────────
// Lineal (Länge l, Breite b, Dicke d) schwingt reibungsfrei um eine Achse durch
// ein Loch im Abstand a vom oberen Rand. Drehpunkt liegt oberhalb des
// Schwerpunkts (s = l/2 − a > 0) → stabile Schwingung.
//
//   Trägheitsmoment um Schwerpunkt:   I_S = (1/12)·m·(l² + b²)
//   Steiner / Parallelauschen-Achse:  I_A = I_S + m·s²
//   Kleine-Winkel-Kreisfrequenz:      ω₀² = g·s / (I_A/m) = g·s / ((1/12)(l²+b²)+s²)
//                                     (die Masse kürzt heraus → T unabhängig von m)
//   Harmonisch:    φ̈ = −ω₀²·φ          →  T = 2π/ω₀
//   Exakt:         φ̈ = −ω₀²·sin φ      →  T = (4/ω₀)·K(sin(φ₀/2))  (K: elliptisch)
//
// Energie (modellkonsistent, jeweils echte Invariante der Bewegung):
//   linear:  E_pot = ½·m·g·s·φ²        E_ges = ½·m·g·s·φ₀²
//   exakt:   E_pot =  m·g·s·(1−cos φ)  E_ges =  m·g·s·(1−cos φ₀)
//   E_kin = ½·I_A·ω²  (gemeinsam)

import { G, DT, PERIODS_SHOWN, T_WINDOW_MIN, T_WINDOW_MAX } from './constants.js'
import { store } from './state.js'

const CM = 1e-2   // cm → m
const Gk = 1e-3   // g → kg

// ── Vollständiges elliptisches Integral 1. Art K(k) via AGM ────────────────────
// K(k) = π/(2·AGM(1, k')),  k' = √(1−k²). Konvergiert quadratisch (~6 Iterationen).
function ellipticK(k) {
  const kp = Math.sqrt(Math.max(0, 1 - k * k))
  let a = 1, b = kp
  for (let i = 0; i < 12; i++) {
    const an = 0.5 * (a + b)
    b = Math.sqrt(a * b)
    a = an
    if (Math.abs(a - b) < 1e-14) break
  }
  return Math.PI / (2 * a)
}

// ── Abgeleitete Größen aus den Slider-Eingaben —──────────────────────────────
export function recomputeDerived() {
  const l = store.l_cm * CM
  const b = store.b_cm * CM
  const a = store.a_cm * CM
  const m = store.m_g * Gk

  store.m = m                               // Masse in kg (für Energie)
  store.s = l / 2 - a                       // Abstand Achse → Schwerpunkt
  store.stable = store.s > 1e-4             // Achse oberhalb SP ⇒ stabile Schwingung
  store.I_S = (1 / 12) * m * (l * l + b * b)
  store.I_A = store.I_S + m * store.s * store.s

  if (store.stable) {
    const denom = (1 / 12) * (l * l + b * b) + store.s * store.s   // = I_A/m
    store.omega0 = Math.sqrt((G * store.s) / denom)
    store.T_linear = (2 * Math.PI) / store.omega0
    const k = Math.sin(store.phi0 / 2)
    store.T_exact = (4 / store.omega0) * ellipticK(k)
  } else {
    store.omega0 = 0
    store.T_linear = Infinity
    store.T_exact = Infinity
  }
}

// Aktive Periodendauer je nach gewähltem Modell
export function activePeriod() {
  return store.model === 'linear' ? store.T_linear : store.T_exact
}

// ── precompute(): Zeitreihen für das ganze Fenster (N·T) —─────────────────────
// Die Animation rechnet danach KEINE Physik mehr — sie interpoliert nur.
// Schwingung ist periodisch ⇒ das Fenster ist ein ganzzahliges Vielfaches von T
// und die Wiedergabe wird nahtlos geloopt (s. ui.js).
export function precompute() {
  recomputeDerived()
  store.t_data = []; store.phi_data = []; store.omega_data = []; store.alpha_data = []
  store.ekin_data = []; store.epot_data = []; store.eges_data = []

  const T = activePeriod()
  const phi0 = store.phi0
  const w0 = store.omega0
  const { I_A, s, m, stable } = store

  // Fenster
  let window
  if (Number.isFinite(T) && T > 0) {
    window = PERIODS_SHOWN * T
  } else {
    window = T_WINDOW_MIN
  }
  window = Math.max(T_WINDOW_MIN, Math.min(T_WINDOW_MAX, window))
  store.t_end = window

  const pushEnergies = (phi, om) => {
    const ek = 0.5 * I_A * om * om
    let ep
    if (store.model === 'linear') {
      ep = 0.5 * m * G * s * phi * phi
    } else {
      ep = m * G * s * (1 - Math.cos(phi))
    }
    store.ekin_data.push(ek)
    store.epot_data.push(ep)
    store.eges_data.push(ek + ep)
  }

  // Trivialfälle: keine Schwingung (instabil oder φ₀≈0)
  if (!stable || Math.abs(phi0) < 1e-8) {
    const phi = stable ? 0 : phi0   // instabil → ruht am Anfangswinkel; φ₀=0 → 0
    for (let t = 0; t <= window + 1e-9; t += DT) {
      store.t_data.push(t)
      store.phi_data.push(phi)
      store.omega_data.push(0)
      store.alpha_data.push(0)
      pushEnergies(phi, 0)
    }
    return
  }

  if (store.model === 'linear') {
    // Geschlossene Lösung der harmonischen Schwingung (Start aus Ruhe bei φ₀)
    for (let t = 0; t <= window + 1e-9; t += DT) {
      const phi = phi0 * Math.cos(w0 * t)
      const om = -phi0 * w0 * Math.sin(w0 * t)
      const al = -w0 * w0 * phi
      store.t_data.push(t)
      store.phi_data.push(phi)
      store.omega_data.push(om)
      store.alpha_data.push(al)
      pushEnergies(phi, om)
    }
  } else {
    // Exakte nichtlineare Bewegungsgleichung φ̈ = −ω₀²·sin φ via RK4
    let phi = phi0, om = 0
    for (let t = 0; t <= window + 1e-9; t += DT) {
      store.t_data.push(t)
      store.phi_data.push(phi)
      store.omega_data.push(om)
      store.alpha_data.push(-w0 * w0 * Math.sin(phi))
      pushEnergies(phi, om)
      // RK4-Schritt auf [phi, om]
      const f = (p, o) => [o, -w0 * w0 * Math.sin(p)]
      const k1 = f(phi, om)
      const k2 = f(phi + 0.5 * DT * k1[0], om + 0.5 * DT * k1[1])
      const k3 = f(phi + 0.5 * DT * k2[0], om + 0.5 * DT * k2[1])
      const k4 = f(phi + DT * k3[0], om + DT * k3[1])
      phi += (DT / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])
      om += (DT / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])
    }
  }
}

// ── interpolateAt(): Wert zu beliebiger Zeit t aus den precompute-Arrays ────────
// Kanonisches Muster — KEINE zweite Interpolation anderswo (auch Hover nicht).
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