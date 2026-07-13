'use strict'

import { TIME_STEP } from './constants.js'
import { store } from './state.js'

// Schwingungsgleichung des ungedämpften Feder-Masse-Pendels:
//   x(t) = A·cos(ω t),  v(t) = −A·ω·sin(ω t),  a(t) = −A·ω²·cos(ω t)
//   ω = √(k/m),  T = 2π/ω

export function recomputeDerived() {
  store.omega = Math.sqrt(store.k / store.m)
  store.T = store.omega > 0 ? (2 * Math.PI) / store.omega : Infinity
}

// Schwingungswerte zur Zeit t (physikalisch, Auslenkung aus Ruhelage)
export function displacement(t) { return store.amplitude * Math.cos(store.omega * t) }
export function velocity(t) { return -store.amplitude * store.omega * Math.sin(store.omega * t) }
export function acceleration(t) { return -store.amplitude * store.omega * store.omega * Math.cos(store.omega * t) }

// Precompute: füllt die Zeitreihen für die gesamte Darstellungsdauer (≥4 T, ≥10 s).
// Wird bei jeder Parameteränderung neu aufgerufen; während der Animation ggf.
// erweitert (extendMotionData), wenn visualTime ans Ende stößt.
export function precompute() {
  store.tData = []
  store.xData = []
  store.vData = []
  store.aData = []
  store.ekData = []
  store.epData = []
  store.egesData = []
  if (Math.abs(store.amplitude) < 1e-9 || store.T === Infinity) {
    recalculateAxisLimits()
    return
  }
  extendMotionData(Math.max(4 * store.T, 10))
  recalculateAxisLimits()
}

export function extendMotionData(duration) {
  const lastT = store.tData.length > 0 ? store.tData[store.tData.length - 1] : 0
  for (let t = lastT + TIME_STEP; t <= lastT + duration + TIME_STEP; t += TIME_STEP) {
    const x = store.amplitude * Math.cos(store.omega * t)
    const v = -store.amplitude * store.omega * Math.sin(store.omega * t)
    store.tData.push(t)
    store.xData.push(x)
    store.vData.push(v)
    store.aData.push(-store.amplitude * store.omega * store.omega * Math.cos(store.omega * t))
    // Energie-Zeitreihen (I7): E_kin = ½mv², E_pot = ½kx², E_ges = E_kin+E_pot
    // (konstant = ½kA² = totalEnergy — starke Invariante, s. I3-Seed-Test).
    const ek = 0.5 * store.m * v * v
    const ep = 0.5 * store.k * x * x
    store.ekData.push(ek)
    store.epData.push(ep)
    store.egesData.push(ek + ep)
  }
}

export function recalculateAxisLimits() {
  const tMax = store.tData.length > 0 ? store.tData[store.tData.length - 1] : 10
  // Schwingungsgrößen: symmetrischer Bereich um 0 (±maxAbs·1.1).
  const osc = {
    pos_t: store.xData,
    v_t: store.vData,
    a_t: store.aData,
  }
  for (const key in osc) {
    const data = osc[key]
    const maxAbs = data.length > 0 ? Math.max(...data.map(d => Math.abs(d))) : 1
    store.axisLimits[key] = {
      min: -maxAbs * 1.1,
      max: maxAbs * 1.1,
      tMax,
      data,
    }
  }
  // Energie (I7): rein ≥0 → Bereich [0, E_max·1.1]. E_max = totalEnergy = ½kA²
  // (E_ges konstant, E_kin/E_pot schwingen 0..E_max). Composite teilt sich diesen
  // Bereich mit den Einzeltypen, sodaß alle drei Linien gemeinsam skalieren.
  const eMax = totalEnergy()
  const eTop = eMax > 0 ? eMax * 1.1 : 1
  for (const key of ['ekin', 'epot', 'eges', 'ecomposite']) {
    store.axisLimits[key] = {
      min: 0,
      max: eTop,
      tMax,
      data: store.egesData,
    }
  }
}

// Interpolation: Index i in tData mit tData[i] ≤ t < tData[i+1]; Werte linear.
export function interpolateAt(t) {
  const { tData } = store
  if (tData.length === 0) return null
  if (t >= tData[tData.length - 1]) {
    const i = tData.length - 1
    return { i, t: tData[i], x: store.xData[i], v: store.vData[i], a: store.aData[i] }
  }
  let i = 0
  while (i < tData.length - 1 && tData[i + 1] <= t) i++
  const t1 = tData[i], t2 = tData[i + 1]
  const alpha = t2 > t1 ? (t - t1) / (t2 - t1) : 0
  return {
    i, t,
    x: store.xData[i] + alpha * (store.xData[i + 1] - store.xData[i]),
    v: store.vData[i] + alpha * (store.vData[i + 1] - store.vData[i]),
    a: store.aData[i] + alpha * (store.aData[i + 1] - store.aData[i]),
  }
}

// Index in tData: erste Stelle mit tData[i] > time (für Plot-Bis-Linie)
export function linePlotIndex(time) {
  const { tData } = store
  let idx = tData.findIndex(t => t > time)
  if (idx === -1 && tData.length > 0) idx = tData.length
  else if (tData.length === 0) idx = 0
  return idx
}


export function frequency() { return store.T > 0 ? 1 / store.T : 0 }
export function totalEnergy() { return 0.5 * store.k * store.amplitude * store.amplitude }
export function kineticEnergy(x, v) { return 0.5 * store.m * v * v }
export function potentialEnergy(x) { return 0.5 * store.k * x * x }