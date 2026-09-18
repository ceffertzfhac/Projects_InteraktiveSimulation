'use strict'

/**
 * @module lineal/physics
 * Physikalisches Pendel: schwingendes Lineal (reines ES-Modul, DOM-frei,
 * in Node/Vitest importierbar). Alle Ein-/Ausgaben laufen über `store`.
 */

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

import { G, DT, PERIODS_SHOWN, T_WINDOW_MIN, T_WINDOW_MAX_CONT, AUTO_STOP_T } from './constants.js'
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
/**
 * Leitet aus den Slider-Eingaben (a, l, b, m, φ₀) die abgeleiteten Größen ab:
 * Schwerpunktabstand s, Trägheitsmomente I_S/I_A, Kreisfrequenz ω₀, Perioden
 * T_linear/T_exact und Stabilitäts-Flag. Schreibt ausschließlich in `store`.
 * @returns {void}
 */
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
/** @returns {number} Periodendauer in s (Infinity bei instabiler Konfiguration) */
export function activePeriod() {
  return store.model === 'linear' ? store.T_linear : store.T_exact
}

// ── precompute(): Zeitreihen für das ganze Fenster —───────────────────────────
// Die Animation rechnet danach KEINE Physik mehr — sie interpoliert nur.
// Die Schwingung ist periodisch: im 'auto'-Modus endet die Wiedergabe am
// Fensterende (8 s, kein Loop); im 'continuous'-Modus läuft sie über das
// Precompute-Fenster hinaus weiter (periodische Extrapolation, s.
// interpolatePeriodic) — kein Auto-Reset (s. ui.js animate).
/**
 * Berechnet die Zeitreihen (t, φ, ω, α, E_kin, E_pot, E_ges) für das ganze
 * Fenster (je Zeitmodus) und füllt die store-Arrays. Schrittweite = DT (fest)
 * (UI-justierbar). Die Animation interpoliert danach ausschließlich.
 * @returns {void}
 */
export function precompute() {
  recomputeDerived()
  store.t_data = []; store.phi_data = []; store.omega_data = []; store.alpha_data = []
  store.ekin_data = []; store.epot_data = []; store.eges_data = []
  store.fgrav_data = []; store.fnorm_data = []; store.fges_data = []; store.fsusp_data = []

  const T = activePeriod()
  const phi0 = store.phi0
  const w0 = store.omega0
  const { I_A, s, m, stable } = store

  // Fenster je Zeitmodus (store.timeMode):
  //  • 'auto'       → AUTO_STOP_T (8 s), danach stoppt die Wiedergabe (kein Loop).
  //  • 'continuous' → ganzzahliges Vielfaches von T, mindestens AUTO_STOP_T
  //                   (mind. T_WINDOW_MIN, max. T_WINDOW_MAX_CONT). Ganzzahliges
  //                   Vielfaches von T, sodaß die Animation über t_end hinaus
  //                   NÄHTLOS periodisch weiterlaufen kann (s.
  //                   interpolatePeriodic) — kein Auto-Reset, kein Loop (s. ui.js).
  let window
  if (store.timeMode === 'auto') {
    window = AUTO_STOP_T
  } else if (Number.isFinite(T) && T > 0) {
    const target = Math.max(PERIODS_SHOWN * T, T_WINDOW_MIN, AUTO_STOP_T)
    window = Math.ceil(target / T - 1e-9) * T
  } else {
    window = T_WINDOW_MIN
  }
  window = Math.min(window, T_WINDOW_MAX_CONT)
  store.t_end = window

  // Alle Zeitreihen aus (φ, ω, α) ableiten. y-Achse zeigt nach unten (Screen),
  // x nach rechts. r̂ = (sin φ, cos φ) Achse→SP, t̂ = (cos φ, −sin φ) tangential.
  let aMax = 0
  const pushState = (phi, om, al) => {
    // Energie (modellkonsistent)
    const ek = 0.5 * I_A * om * om
    const ep = store.model === 'linear'
      ? 0.5 * m * G * s * phi * phi
      : m * G * s * (1 - Math.cos(phi))
    store.ekin_data.push(ek)
    store.epot_data.push(ep)
    store.eges_data.push(ek + ep)
    // Beschleunigung: Zentripetal (nach −r̂) + tangential (entlang t̂)
    const aRad  = s * om * om            // m/s², Betrag, radial zur Achse
    const aTang = s * al                 // m/s², Betrag, tangential
    const ax = -aRad * Math.sin(phi) + aTang * Math.cos(phi)
    const ay = -aRad * Math.cos(phi) - aTang * Math.sin(phi)
    const amag = Math.hypot(ax, ay)
    if (amag > aMax) aMax = amag
    // Kraftbeträge (N): F_G = m g; F_N = m(s ω² + g cos φ) (Längskraft zur Achse);
    // F_ges = m|a|; F_Aufh = |F_G + F_ges| (Reaktion des Lineals auf die Aufhängung)
    store.fgrav_data.push(m * G)
    store.fnorm_data.push(m * (aRad + G * Math.cos(phi)))
    store.fges_data.push(m * amag)
    store.fsusp_data.push(m * Math.hypot(ax, G + ay))
  }

  // Trivialfälle: keine Schwingung (instabil oder φ₀≈0)
  if (!stable || Math.abs(phi0) < 1e-8) {
    const phi = stable ? 0 : phi0   // instabil → ruht am Anfangswinkel; φ₀=0 → 0
    for (let t = 0; t <= window + 1e-9; t += DT) {
      store.t_data.push(t)
      store.phi_data.push(phi)
      store.omega_data.push(0)
      store.alpha_data.push(0)
      pushState(phi, 0, 0)
    }
    store.aMax = aMax
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
      pushState(phi, om, al)
    }
  } else {
    // Exakte nichtlineare Bewegungsgleichung φ̈ = −ω₀²·sin φ via RK4
    let phi = phi0, om = 0
    for (let t = 0; t <= window + 1e-9; t += DT) {
      const al = -w0 * w0 * Math.sin(phi)
      store.t_data.push(t)
      store.phi_data.push(phi)
      store.omega_data.push(om)
      store.alpha_data.push(al)
      pushState(phi, om, al)
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
  store.aMax = aMax
}

// ── interpolateAt(): Wert zu beliebiger Zeit t aus den precompute-Arrays ────────
// Kanonisches Muster — KEINE zweite Interpolation anderswo (auch Hover nicht).
/**
 * Lineare Interpolation eines Zeitreihen-Werts zu beliebiger Zeit t
 * (Binary-Search, O(log n)).
 * @param {number[]} arr Wertearray (z. B. store.phi_data)
 * @param {number} t Zeit in s (wird auf das Fenster geclampt, siehe t_data)
 * @returns {number} interpolierter Wert
 */
export function interpolateAt(arr, t) {
  const { t_data } = store
  if (!t_data.length) return 0
  // Binary search for the interval containing t (O(log n))
  let lo = 0, hi = t_data.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (t_data[mid] <= t) lo = mid + 1
    else hi = mid - 1
  }
  let i = Math.max(0, lo - 1)
  const t1 = t_data[i], t2 = t_data[i + 1] ?? t1
  const alpha = t2 > t1 ? (t - t1) / (t2 - t1) : 0
  return arr[i] + alpha * ((arr[i + 1] ?? arr[i]) - arr[i])
}

// ── interpolatePeriodic(): Wert zu beliebig großer Zeit t (Kontinuierlich-Modus) ──
// Die Schwingung ist periodisch: t → t mod T ist phasenäquivalent. Dadurch kann
// die Wiedergabe über das Precompute-Fenster (t_end = N·T) hinaus nahtlos
// weiterlaufen, OHNE Auto-Reset/Loop (Kontinuierlich-Modus, s. ui.js animate).
// @param {number[]} arr Wertearray (z. B. store.phi_data)
// @param {number} t Zeit in s (beliebig groß)
// @returns {number} interpolierter Wert
export function interpolatePeriodic(arr, t) {
  const T = activePeriod()
  if (!Number.isFinite(T) || T <= 0) return interpolateAt(arr, t)
  const phase = t - Math.floor(t / T) * T   // t mod T, in [0, T)
  return interpolateAt(arr, phase)
}