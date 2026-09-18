// Vitest tests for physics module of Lineal simulation
import { expect, test, beforeEach } from 'vitest'
import { store } from '../Project_lineal_simulation/js/state.js'
import { recomputeDerived, precompute, activePeriod, interpolateAt } from '../Project_lineal_simulation/js/physics.js'

// Helper to set store parameters quickly
function setParams({a, l, b, phi0deg, m, model = 'linear'}) {
  store.a_cm = a
  store.l_cm = l
  store.b_cm = b
  store.phi0 = phi0deg * Math.PI / 180
  store.m_g = m
  store.model = model
}

beforeEach(() => {
  // reset store to defaults before each test
  setParams({a: 1.9, l: 32.0, b: 3.7, phi0deg: 20, m: 8.5, model: 'linear'})
})

test('recomputeDerived calculates correct s and stability', () => {
  recomputeDerived()
  expect(store.s).toBeCloseTo((store.l_cm * 0.01) / 2 - store.a_cm * 0.01, 6)
  expect(store.stable).toBe(true)
})

test('precompute fills data arrays for linear model', () => {
  recomputeDerived()
  precompute()
  expect(store.t_data.length).toBeGreaterThan(0)
  expect(store.phi_data.length).toBe(store.t_data.length)
  // check first value equals phi0 (linear harmonic start at phi0)
  expect(store.phi_data[0]).toBeCloseTo(store.phi0, 10)
})

test('activePeriod returns linear period when model is linear', () => {
  recomputeDerived()
  precompute()
  const T = activePeriod()
  expect(T).toBeCloseTo(store.T_linear, 6)
})

test('instability (a > l/2) disables animation', () => {
  setParams({a: 20, l: 30, b: 3.7, phi0deg: 20, m: 8.5, model: 'linear'})
  recomputeDerived()
  expect(store.stable).toBe(false)
  precompute()
  // T should be Infinity
  expect(store.T_linear).toBe(Infinity)
})

test('precompute honours store.DT (UI-adjustable timestep)', () => {
  store.DT = 0.05
  recomputeDerived()
  precompute()
  // erste Zeitdifferenz muss ≈ store.DT sein
  const dt = store.t_data[1] - store.t_data[0]
  expect(dt).toBeCloseTo(0.05, 6)
  store.DT = 0.01 // zurücksetzen
})

test('interpolateAt (binary search) matches linear scan on random times', () => {
  setParams({a: 1.9, l: 32.0, b: 3.7, phi0deg: 30, m: 8.5, model: 'linear'})
  recomputeDerived()
  precompute()
  const { t_data, phi_data } = store
  const linearScan = (arr, t) => {
    let i = t_data.findIndex(tv => tv > t)
    if (i === -1) i = t_data.length
    i = Math.max(0, i - 1)
    const t1 = t_data[i], t2 = t_data[i + 1] ?? t1
    const alpha = t2 > t1 ? (t - t1) / (t2 - t1) : 0
    return arr[i] + alpha * ((arr[i + 1] ?? arr[i]) - arr[i])
  }
  for (const t of [0, 0.001, 0.1, 0.5, 1.234, store.t_end / 2, store.t_end - 1e-6, store.t_end, store.t_end + 5]) {
    const tc = Math.min(t, store.t_end)
    expect(interpolateAt(phi_data, tc)).toBeCloseTo(linearScan(phi_data, tc), 10)
  }
})

test('exact model uses RK4 and stays close to energy conservation for small phi0', () => {
  setParams({a: 1.9, l: 32.0, b: 3.7, phi0deg: 5, m: 8.5, model: 'exact'})
  recomputeDerived()
  precompute()
  const totalEnergyStart = store.eges_data[0]
  const energyEnd = store.eges_data[store.eges_data.length - 1]
  // energy deviation should be small (<0.1% of start)
  const diff = Math.abs(energyEnd - totalEnergyStart) / totalEnergyStart
  expect(diff).toBeLessThan(0.001)
})
