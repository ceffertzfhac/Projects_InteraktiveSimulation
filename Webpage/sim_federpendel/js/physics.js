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
    store.tData.push(t)
    store.xData.push(store.amplitude * Math.cos(store.omega * t))
    store.vData.push(-store.amplitude * store.omega * Math.sin(store.omega * t))
    store.aData.push(-store.amplitude * store.omega * store.omega * Math.cos(store.omega * t))
  }
}

export function recalculateAxisLimits() {
  const tMax = store.tData.length > 0 ? store.tData[store.tData.length - 1] : 10
  const datasets = {
    pos_t: store.xData,
    v_t: store.vData,
    a_t: store.aData,
  }
  for (const key in datasets) {
    const data = datasets[key]
    const maxAbs = data.length > 0 ? Math.max(...data.map(d => Math.abs(d))) : 1
    store.axisLimits[key] = {
      min: -maxAbs * 1.1,
      max: maxAbs * 1.1,
      tMax,
      data,
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