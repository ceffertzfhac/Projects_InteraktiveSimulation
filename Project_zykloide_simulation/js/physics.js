'use strict'

import {
  TIME_STEP, SIM_DURATION, POINT_RADIUS_FACTOR,
  PIXELS_PER_METER, GROUND_PX, START_OFFSET_PX,
  subjects, quantities, initialAngles,
} from './constants.js'
import { store } from './state.js'

// ── Koordinatentransformation (zentral, siehe CLAUDE.md) ─────────────────────
export const physToScreenX = x_m => START_OFFSET_PX + x_m * PIXELS_PER_METER
export const physToScreenY = y_m => GROUND_PX - y_m * PIXELS_PER_METER

// ── Nice-Tick (1-2-5-Serie) ──────────────────────────────────────────────────
export function getNiceTickStep(range, ticks = 8) {
  if (range < 1e-9) return 1
  const m = range / ticks
  const e = Math.floor(Math.log10(m))
  const p = 10 ** e
  let n = m / p
  if (n <= 1) n = 1
  else if (n <= 2) n = 2
  else if (n <= 5) n = 5
  else n = 10
  return n * p
}

// t-Achsen-Schritt: größter Nice-Schritt ≤ t_max/3 → garantiert ≥3 Teilstriche
export const tAxisStep = tMax => getNiceTickStep(tMax, 3)

// ── Precompute: gesamte Rollbewegung 0…60 s (aus v2.8 precomputeMotionData) ──
export function precompute() {
  const fd = { t: [] }
  subjects.forEach(s => quantities.forEach(qq => { fd[`${s}_${qq}`] = [] }))

  const r_m = store.R * POINT_RADIUS_FACTOR
  const omega = store.Vc / store.R
  store.r_m = r_m
  store.omega = omega

  for (let t = 0; t <= SIM_DURATION + TIME_STEP / 2; t += TIME_STEP) {
    fd.t.push(t)

    // Schwerpunkt: geradlinig gleichförmig, konstante Höhe y = R
    fd.sp_x.push(store.Vc * t)
    fd.sp_y.push(store.R)
    fd.sp_vx.push(store.Vc)
    fd.sp_vy.push(0)
    fd.sp_vabs.push(store.Vc)
    fd.sp_ax.push(0)
    fd.sp_ay.push(0)
    fd.sp_aabs.push(0)

    // Punkte p1–p4: Trochoiden auf dem inneren Kreis r
    for (const p in initialAngles) {
      const theta0 = initialAngles[p]
      const angle = theta0 - omega * t

      const x = store.Vc * t + r_m * Math.cos(angle)
      const y = store.R + r_m * Math.sin(angle)
      fd[`${p}_x`].push(x)
      fd[`${p}_y`].push(y)

      const vx = store.Vc + r_m * omega * Math.sin(angle)
      const vy = -r_m * omega * Math.cos(angle)
      fd[`${p}_vx`].push(vx)
      fd[`${p}_vy`].push(vy)
      fd[`${p}_vabs`].push(Math.hypot(vx, vy))

      const ax = -r_m * omega * omega * Math.cos(angle)
      const ay = -r_m * omega * omega * Math.sin(angle)
      fd[`${p}_ax`].push(ax)
      fd[`${p}_ay`].push(ay)
      fd[`${p}_aabs`].push(Math.hypot(ax, ay))
    }
  }

  store.fullData = fd
}

// ── Interpolation an beliebigen Zeitsample (Atwood-Muster) ───────────────────
export function interpolateAt(t) {
  const { t: tArr } = store.fullData
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
  const out = { i, t: has ? fd.t[i] + a * (fd.t[i + 1] - fd.t[i]) : fd.t[i] }
  subjects.forEach(s => {
    out[s] = {}
    quantities.forEach(qq => { out[s][qq] = lerp(`${s}_${qq}`) })
  })
  return out
}

// Index des letzten Samples mit t <= time (für Linien-Plot bis currentTime)
export function linePlotIndex(time) {
  const tArr = store.fullData.t
  if (!tArr || tArr.length === 0) return 0
  let idx = tArr.findIndex(tv => tv > time)
  if (idx === -1) idx = tArr.length
  return idx
}