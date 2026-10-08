'use strict'

import { T_MAX, DT, SEGMENTS, ACCEL_RATIO, STOP_POSITIONS, STOP_LABELS } from './constants.js'
import { store } from './state.js'

// ── Bewegungsphasen ────────────────────────────────────────────────────────────
// Jede Fahrt zerfällt in drei Phasen konstanter Beschleunigung (anfahren,
// gleichförmig, bremsen), jeder Halt ist eine Phase mit v = a = 0. Innerhalb
// einer Phase gilt x(τ) = x₀ + v₀·τ + ½·a·τ² exakt.
//   phase = { kind, tStart, tEnd, x0, v0, a, stop }
//   kind ∈ 'halt' | 'anfahren' | 'konstant' | 'bremsen'
export function buildPhases(segments = SEGMENTS, r = ACCEL_RATIO) {
  const phases = []
  for (const s of segments) {
    if (s.type === 'halt') {
      const idx = STOP_POSITIONS.indexOf(s.xStart)
      phases.push({ kind: 'halt', tStart: s.tStart, tEnd: s.tEnd, x0: s.xStart, v0: 0, a: 0,
                    stop: idx >= 0 ? STOP_LABELS[idx] : null })
      continue
    }
    const dur = s.tEnd - s.tStart
    const dist = s.xEnd - s.xStart
    const tAcc = r * dur
    const vMax = dist / ((1 - r) * dur)
    const a = vMax / tAcc
    const t1 = s.tStart + tAcc, t2 = s.tEnd - tAcc
    const x1 = s.xStart + 0.5 * a * tAcc * tAcc
    const x2 = x1 + vMax * (t2 - t1)
    phases.push({ kind: 'anfahren', tStart: s.tStart, tEnd: t1, x0: s.xStart, v0: 0,    a,      stop: null })
    phases.push({ kind: 'konstant', tStart: t1,       tEnd: t2, x0: x1,       v0: vMax, a: 0,   stop: null })
    phases.push({ kind: 'bremsen',  tStart: t2,       tEnd: s.tEnd, x0: x2,   v0: vMax, a: -a,  stop: null })
  }
  return phases
}

// Kenndaten je Fahrt (für Fahrplantabelle/Tests): Δt, Δx, v_max, |a|
export function tripData(segments = SEGMENTS, r = ACCEL_RATIO) {
  return segments.filter(s => s.type === 'fahrt').map(s => {
    const dur = s.tEnd - s.tStart, dist = s.xEnd - s.xStart
    const vMax = dist / ((1 - r) * dur)
    return { dur, dist, vMax, a: vMax / (r * dur) }
  })
}

function phaseAt(phases, t) {
  const tc = Math.min(Math.max(t, 0), T_MAX)
  // Bei Phasengrenzen gewinnt die spätere Phase (wie interpolateAt).
  for (let i = phases.length - 1; i >= 0; i--) if (tc >= phases[i].tStart) return phases[i]
  return phases[0]
}

// Geschlossene Form an beliebigem t (Referenz für Tests und Zustand/Haltestelle)
export function stateAt(phases, t) {
  const p = phaseAt(phases, t)
  const tau = Math.min(Math.max(t, 0), T_MAX) - p.tStart
  return {
    x: p.x0 + p.v0 * tau + 0.5 * p.a * tau * tau,
    v: p.v0 + p.a * tau,
    a: p.a,
    kind: p.kind,
    stop: p.stop,
  }
}

// ── precompute(): füllt die Ergebnis-Arrays für die GESAMTE Fahrt ───────────────
// Abtastung je Phase inkl. beider Phasengrenzen. An jeder Grenze liegt der
// Zeitpunkt doppelt im Array (links: alte Phase, rechts: neue Phase) — so
// bleiben die Sprünge von a(t) scharf, statt über ein DT verschmiert zu werden.
// x und v sind stetig, die Doppelung ist dort wirkungslos.
export function precompute() {
  store.phases = buildPhases()
  store.t_data = []; store.x_data = []; store.v_data = []; store.a_data = []
  store.phase_idx = []
  store.phases.forEach((p, pi) => {
    const n = Math.max(1, Math.ceil((p.tEnd - p.tStart) / DT - 1e-9))
    for (let i = 0; i <= n; i++) {
      const tau = (i / n) * (p.tEnd - p.tStart)
      store.t_data.push(p.tStart + tau)
      store.x_data.push(p.x0 + p.v0 * tau + 0.5 * p.a * tau * tau)
      store.v_data.push(p.v0 + p.a * tau)
      store.a_data.push(p.a)
      store.phase_idx.push(pi)
    }
  })
  store.t_end = T_MAX
}

// ── interpolateAt(): Wert zu beliebiger Zeit t aus den precompute-Arrays ────────
// Kanonisches Muster; Binärsuche wegen ~1 600 Stützstellen. Liefert den Index
// des letzten Stützpunkts mit t_data[i] ≤ t (bei Doppelungen den rechten).
function lowerIndex(t) {
  const td = store.t_data
  let lo = 0, hi = td.length - 1
  if (t <= td[0]) return 0
  if (t >= td[hi]) return hi
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (td[mid] <= t) lo = mid; else hi = mid
  }
  return lo
}

export function interpolateAt(arr, t) {
  const { t_data } = store
  if (!t_data.length) return 0
  const i = lowerIndex(t)
  const t1 = t_data[i], t2 = t_data[i + 1] ?? t1
  const alpha = t2 > t1 ? (t - t1) / (t2 - t1) : 0
  return arr[i] + alpha * ((arr[i + 1] ?? arr[i]) - arr[i])
}

// Phase (Zustand + Haltestelle) zum Zeitpunkt t — aus denselben Arrays
export function phaseInfoAt(t) {
  if (!store.t_data.length) return { kind: 'halt', stop: null }
  return store.phases[store.phase_idx[lowerIndex(t)]]
}
