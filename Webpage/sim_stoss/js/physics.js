'use strict'

import {
  TIME_STEP, CONTACT_DIST_M, X1_START_M, X2_START_M, MAX_SIM_DURATION,
} from './constants.js'
import { store } from './state.js'

// ── Elastische Stoß-Endgeschwindigkeiten (geschlossene Lösung) ──────────────
// Allgemein: v1' = ((m1−m2)v1 + 2m2v2)/(m1+m2), v2' = ((m2−m1)v2 + 2m1v1)/(m1+m2).
// Wand-Sonderfälle (Grenzwert m→∞): die unendliche Masse behält ihre
// Geschwindigkeit (0, da sie als ruhende Wand geführt wird), die andere
// reflektiert exakt (v' = 2·v_Wand − v).
export function elasticFinalVelocities(m1, m2, v1, v2, m1Inf, m2Inf) {
  if (m1Inf) return { v1p: v1, v2p: 2 * v1 - v2 }
  if (m2Inf) return { v2p: v2, v1p: 2 * v2 - v1 }
  return {
    v1p: ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2),
    v2p: ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2),
  }
}


// ── Precompute: gesamter Bewegungsablauf (geschlossene Lösung, drei Phasen) ─
// Phase 1 (freier Flug vor Kontakt): x_i(t) = x_i0 + v_i0·t
// Phase 2 (Kontakt, endliche Feder): Relativkoordinate s = Kontaktabstand −
//   Abstand folgt ungedämpfter SHM: s(dt)=(vrel0/ω)·sin(ωdt), vrel(dt)=vrel0·cos(ωdt)
//   mit ω=√(k/μ), μ = reduzierte Masse. Schwerpunktgeschwindigkeit vcm bleibt
//   konstant (keine äußere Kraft) → v_i(dt) aus vcm + Massenanteil·vrel(dt).
//   Bei k→∞ (starre Feder) schrumpft die Kontaktdauer auf 0 (Sprung in v).
// Phase 3 (freier Flug nach Kontakt): mit den Stoß-Endgeschwindigkeiten, ab
//   der Position am Kontaktende (bei endlichem k inkl. Schwerpunkt-Drift
//   während der Kontaktzeit — s ist am Kontaktende wieder 0, vcm·Δt aber nicht).
// Alle drei Phasen sind analytisch exakt — keine numerische Integration.
export function precompute() {
  const { m1, m2, v1: v1_0, v2: v2_0, k, m1Inf, m2Inf, kInf } = store
  const x1_0 = X1_START_M, x2_0 = X2_START_M

  const approaching = v1_0 > v2_0
  const { v1p, v2p } = elasticFinalVelocities(m1, m2, v1_0, v2_0, m1Inf, m2Inf)

  let tContactStart = Infinity, tContactEnd = Infinity, omega = 0, mu = 0, fMax = 0

  if (approaching) {
    tContactStart = (x2_0 - x1_0 - CONTACT_DIST_M) / (v1_0 - v2_0)
    mu = m1Inf ? m2 : (m2Inf ? m1 : (m1 * m2) / (m1 + m2))
    if (kInf) {
      tContactEnd = tContactStart // instantaner Stoß (starre Feder)
      fMax = Infinity
    } else {
      omega = Math.sqrt(k / mu)
      tContactEnd = tContactStart + Math.PI / omega
      fMax = Math.abs(v1_0 - v2_0) * Math.sqrt(k * mu)
    }
  }

  const collisionDt = approaching ? (tContactEnd - tContactStart) : 0
  store.approaching = approaching
  store.tContactStart = tContactStart
  store.tContactEnd = tContactEnd
  store.collisionDt = collisionDt
  store.fMax = fMax
  store.v1Final = approaching ? v1p : v1_0
  store.v2Final = approaching ? v2p : v2_0

  // Simulationsdauer: genug Vorlauf bis zum Stoß + Nachlauf danach, um beide
  // Phasen klar zu zeigen; Sicherheitsobergrenze gegen sehr lange Leerläufe.
  store.simDuration = approaching
    ? Math.min(Math.max(3 * tContactEnd, tContactStart + 1.5), MAX_SIM_DURATION)
    : 5.0

  // Schwerpunktgeschwindigkeit + Massenanteile (nur für den beide-Massen-
  // endlich-Fall gebraucht; bei einer Wand entfällt das vcm-Konzept).
  const bothFinite = !m1Inf && !m2Inf
  const vcm = bothFinite ? (m1 * v1_0 + m2 * v2_0) / (m1 + m2) : 0
  const frac1 = bothFinite ? m2 / (m1 + m2) : 0 // Anteil von vrel an v1
  const frac2 = bothFinite ? m1 / (m1 + m2) : 0 // Anteil von vrel an v2

  // Position bei Kontaktbeginn (freier Flug bis dahin).
  const x1AtStart = approaching ? x1_0 + v1_0 * tContactStart : NaN
  const x2AtStart = approaching ? x2_0 + v2_0 * tContactStart : NaN
  // Position bei Kontaktende: s(Kontaktende)=0 immer (Feder wieder entspannt),
  // aber der Schwerpunkt ist währenddessen um vcm·Δt weitergewandert (nur im
  // beide-Massen-endlich-Fall — bei einer Wand bewegt sich nichts „im Mittel").
  const comDrift = bothFinite ? vcm * collisionDt : 0
  const x1AtEnd = x1AtStart + comDrift
  const x2AtEnd = x2AtStart + comDrift

  const n = Math.floor(store.simDuration / TIME_STEP) + 2
  const t_data = new Array(n)
  const x1_data = new Array(n), x2_data = new Array(n)
  const v1_data = new Array(n), v2_data = new Array(n)
  const a1_data = new Array(n), a2_data = new Array(n)
  const es_data = new Array(n)

  for (let i = 0; i < n; i++) {
    const t = Math.min(i * TIME_STEP, store.simDuration)
    let x1, x2, v1, v2, a1 = 0, a2 = 0, es = 0

    if (!approaching || t <= tContactStart) {
      // Phase 1: freier Flug vor dem Stoß (oder gar kein Stoß)
      x1 = x1_0 + v1_0 * t
      x2 = x2_0 + v2_0 * t
      v1 = v1_0; v2 = v2_0
    } else if (t >= tContactEnd) {
      // Phase 3: freier Flug nach dem Stoß
      x1 = x1AtEnd + v1p * (t - tContactEnd)
      x2 = x2AtEnd + v2p * (t - tContactEnd)
      v1 = v1p; v2 = v2p
    } else {
      // Phase 2: Kontakt (nur bei endlichem k erreichbar — bei k→∞ ist
      // tContactEnd===tContactStart, dieser Zweig also unerreichbar)
      const dt = t - tContactStart
      const vrel0 = v1_0 - v2_0
      const s = (vrel0 / omega) * Math.sin(omega * dt)
      const vrel = vrel0 * Math.cos(omega * dt)
      const F = k * s

      if (m1Inf) {
        v1 = v1_0; v2 = -vrel
        x1 = x1AtStart; x2 = x2AtStart - s
        a2 = F / m2
      } else if (m2Inf) {
        v2 = v2_0; v1 = vrel
        x2 = x2AtStart; x1 = x1AtStart + s
        a1 = -F / m1
      } else {
        v1 = vcm + frac1 * vrel
        v2 = vcm - frac2 * vrel
        x1 = x1AtStart + vcm * dt + frac1 * s
        x2 = x2AtStart + vcm * dt - frac2 * s
        a1 = -F / m1; a2 = F / m2
      }
      es = 0.5 * k * s * s
    }

    t_data[i] = t
    x1_data[i] = x1; x2_data[i] = x2
    v1_data[i] = v1; v2_data[i] = v2
    a1_data[i] = a1; a2_data[i] = a2
    es_data[i] = es
  }

  store.t_data = t_data
  store.x1_data = x1_data; store.x2_data = x2_data
  store.v1_data = v1_data; store.v2_data = v2_data
  store.a1_data = a1_data; store.a2_data = a2_data
  store.es_data = es_data

  // Abgeleitete Größen: Impuls, kinetische Energie je Gleiter, Gesamtenergie
  const p1_data = new Array(n), p2_data = new Array(n)
  const ek1_data = new Array(n), ek2_data = new Array(n), etot_data = new Array(n)
  for (let i = 0; i < n; i++) {
    const v1 = v1_data[i], v2 = v2_data[i]
    p1_data[i] = m1Inf ? 0 : m1 * v1
    p2_data[i] = m2Inf ? 0 : m2 * v2
    ek1_data[i] = m1Inf ? 0 : 0.5 * m1 * v1 * v1
    ek2_data[i] = m2Inf ? 0 : 0.5 * m2 * v2 * v2
    etot_data[i] = ek1_data[i] + ek2_data[i] + es_data[i]
  }
  store.p1_data = p1_data; store.p2_data = p2_data
  store.ek1_data = ek1_data; store.ek2_data = ek2_data; store.etot_data = etot_data

  computeAxisLimits()
}

// ── Achsen-Limits je Diagrammtyp (0 im Sichtbereich bei vorzeichenbehafteten
//    Größen — Abszisse am Nulldurchgang für v/a/p, E bleibt ≥0) ────────────
function computeAxisLimits() {
  const t_max = store.simDuration
  const pad = (min, max) => {
    const range = max - min
    const p = range < 1e-9 ? Math.max(Math.abs(max || 1) * 0.1, 0.1) : range * 0.1
    return { min: min - p, max: max + p }
  }
  const symZero = (arrs) => {
    let lo = Infinity, hi = -Infinity
    for (const arr of arrs) for (const v of arr) { if (v < lo) lo = v; if (v > hi) hi = v }
    if (lo === Infinity) { lo = -1; hi = 1 }
    const p = pad(lo, hi)
    const m = Math.max(Math.abs(p.min), Math.abs(p.max))
    return { min: -m, max: m, t_max, full: arrs }
  }
  const zeroFloor = (arrs) => {
    let hi = 0
    for (const arr of arrs) for (const v of arr) { if (v > hi) hi = v }
    const p = pad(0, hi)
    return { min: 0, max: p.max, t_max, full: arrs }
  }

  store.axisLimits = {
    v: symZero([store.v1_data, store.v2_data]),
    a: symZero([store.a1_data, store.a2_data]),
    p: symZero([store.p1_data, store.p2_data]),
    E: zeroFloor([store.ek1_data, store.ek2_data, store.es_data]),
  }
}

// ── Linear interpoliert aus precompute-Arrays zur Zeit t ────────────────────
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
