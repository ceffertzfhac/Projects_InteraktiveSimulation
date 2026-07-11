'use strict'

import { TIME_STEP, SIM_DURATION, quantities } from './constants.js'
import { store } from './state.js'

// Nice-Step (1-2-4-5-Serie): größter Nice-Step ≤ range/minDivs → garantiert
// ≥ minDivs Teilstriche. Die 4er-Stufe schließt die Lücke zwischen 2 und 5
// (CLAUDE.md „Achsen-Ticks"). Für Ordinate mit minDivs=4.
export function niceStepLE(range, minDivs) {
  if (range < 1e-9) return 1
  const target = range / minDivs
  const e = Math.floor(Math.log10(target))
  const p = 10 ** e
  const n = target / p
  let f
  if (n >= 5) f = 5
  else if (n >= 4) f = 4
  else if (n >= 2) f = 2
  else f = 1
  return f * p
}


// ── Precompute: gesamte Bewegung 0…SIM_DURATION (analytisch, geschlossen) ────
// Kreis:  R(t)=R0, ω(t)=ω0, φ(t)=φ0+ω0·t
// Spirale: R(t)=R0+v_r·t, dazu Coriolis-Terme in v/a. Spiral-R→0 bricht ab.
export function precompute() {
  const fd = { t: [] }
  quantities.forEach(qq => { fd[`p_${qq}`] = [] })

  const isSpiral = store.motionMode === 'spirale'
  const { R0, vr, omega0_rad, phi0_rad, alpha_rad } = store

  for (let t = 0; t <= SIM_DURATION + TIME_STEP / 2; t += TIME_STEP) {
    const R_t = isSpiral ? R0 + vr * t : R0
    if (R_t <= 0) break

    const omega_t = omega0_rad + alpha_rad * t
    const phi_t = phi0_rad + omega0_rad * t + 0.5 * alpha_rad * t * t
    const cosPhi = Math.cos(phi_t), sinPhi = Math.sin(phi_t)

    const x = R_t * cosPhi
    const y = R_t * sinPhi
    const vx = vr * cosPhi - R_t * omega_t * sinPhi
    const vy = vr * sinPhi + R_t * omega_t * cosPhi
    // Zentripetal (-R·ω²) + Tangential (-R·α) + Coriolis (-2·v_r·ω)
    const ax = -R_t * omega_t * omega_t * cosPhi - R_t * alpha_rad * sinPhi - 2 * vr * omega_t * sinPhi
    const ay = -R_t * omega_t * omega_t * sinPhi + R_t * alpha_rad * cosPhi + 2 * vr * omega_t * cosPhi

    fd.t.push(t)
    fd.p_x.push(x); fd.p_y.push(y)
    fd.p_vx.push(vx); fd.p_vy.push(vy)
    fd.p_ax.push(ax); fd.p_ay.push(ay)
    fd.p_phi.push(phi_t * 180 / Math.PI)
    fd.p_omega.push(omega_t * 180 / Math.PI)
    fd.p_alpha.push(alpha_rad * 180 / Math.PI)
    fd.p_ar.push(R_t * omega_t * omega_t)
    fd.p_at.push(Math.abs(R_t * alpha_rad))
    fd.p_vabs.push(Math.sqrt(vx * vx + vy * vy))
    fd.p_aabs.push(Math.sqrt(ax * ax + ay * ay))
  }

  store.fullData = fd
  store.effectiveDuration = fd.t.length > 0 ? fd.t[fd.t.length - 1] : 0
  computeAxisLimits()
}

// ── Achsenlimits je Größe — dynamisch an den Datenbereich angepaßt (B9) ──────
// Beträge ≥ 0 (0..max); vorzeichenbehaftete Kartesisches (x/y/vx/vy/ax/ay)
// halten 0 im Sichtbereich (Abszisse am Nulldurchgang); Winkelgrößen
// (φ/ω/α) nutzen die natürliche Spanne — konstante Größen bekommen einen
// sinnvollen kleinen Bereich um den Wert, statt auf 0 aufgebläht zu werden.
export function computeAxisLimits() {
  const fd = store.fullData
  const limits = {}
  const t_max = store.effectiveDuration
  const magnitude = ['ar', 'at', 'vabs', 'aabs']
  const symmetric = ['x', 'y', 'vx', 'vy', 'ax', 'ay']

  quantities.forEach(qq => {
    const key = `p_${qq}`
    if (!fd[key] || fd[key].length === 0) return
    const rawMin = Math.min(...fd[key])
    const rawMax = Math.max(...fd[key])
    const range = rawMax - rawMin
    const pad = range < 1e-9 ? Math.max(Math.abs(rawMax || 0) * 0.1, 1) : range * 0.1
    let min, max
    if (magnitude.includes(qq)) {
      min = 0; max = rawMax + pad                                  // 0..max+pad
    } else if (symmetric.includes(qq)) {
      min = rawMin - pad; max = rawMax + pad
      if (min > 0) min = -pad                                      // 0 im Sichtbereich
      if (max < 0) max = pad
    } else {                                                       // φ/ω/α
      if (rawMin >= 0) { min = Math.max(0, rawMin - pad); max = rawMax + pad }
      else if (rawMax <= 0) { min = rawMin - pad; max = Math.min(0, rawMax + pad) }
      else { min = rawMin - pad; max = rawMax + pad }
    }
    limits[qq] = { min, max, t_max }
  })
  store.axisLimits = limits
}

// ── Interpolation an beliebigen Zeitsample (Atwood-Muster) ───────────────────
export function interpolateAt(t) {
  const tArr = store.fullData.t
  if (!tArr || tArr.length === 0) return null
  if (t >= tArr[tArr.length - 1]) return sampleAt(tArr.length - 1, 0)
  if (t <= tArr[0]) return sampleAt(0, 0)
  let i = 0
  while (i < tArr.length - 1 && tArr[i + 1] <= t) i++
  const a = (t - tArr[i]) / (tArr[i + 1] - tArr[i])
  return sampleAt(i, a)
}

function sampleAt(i, a) {
  const fd = store.fullData
  const has = i + 1 < fd.t.length
  const lerp = key => has ? fd[key][i] + a * (fd[key][i + 1] - fd[key][i]) : fd[key][i]
  const p = {}
  quantities.forEach(qq => { p[qq] = lerp(`p_${qq}`) })
  return { i, t: has ? fd.t[i] + a * (fd.t[i + 1] - fd.t[i]) : fd.t[i], p }
}

// Spiral-Radius zur Laufzeit (für Disk-Radius + Polar-Einheitsvektoren im Render)
export function radiusAt(t) {
  return store.motionMode === 'spirale' ? store.R0 + store.vr * t : store.R0
}

// Index des letzten Samples mit t <= time (für Linien-Plot bis currentTime)
export function linePlotIndex(time) {
  const tArr = store.fullData.t
  if (!tArr || tArr.length === 0) return 0
  let idx = tArr.findIndex(tv => tv > time)
  if (idx === -1) idx = tArr.length
  return idx
}

// ── Auto-Stopp: exakte Stoppzeit (analytische Quadrat-Lösung) ────────────────
// Löst 0.5·α·dt² + ω·dt + (φ_start − target) = 0 nach dt ≥ 0.
export function calculatePreciseStopTime(targetAngle, omegaStart, alpha, phiStart, tStart) {
  const a = 0.5 * alpha
  const b = omegaStart
  const c = phiStart - targetAngle

  if (Math.abs(a) < 1e-9) {
    if (Math.abs(b) < 1e-9) return null
    const dt = -c / b
    return dt >= 0 ? tStart + dt : null
  }
  const disc = b * b - 4 * a * c
  if (disc < 0) return null
  const sqrtD = Math.sqrt(disc)
  const dt1 = (-b + sqrtD) / (2 * a)
  const dt2 = (-b - sqrtD) / (2 * a)
  if (dt1 >= 0 && (dt1 < dt2 || dt2 < 0)) return tStart + dt1
  if (dt2 >= 0) return tStart + dt2
  return null
}