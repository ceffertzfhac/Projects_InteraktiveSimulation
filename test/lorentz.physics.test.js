// Seed-Test: Lorentz-Kraft — Gleichgewichtsbedingung + Wurzel-Stabilität + Guards.
// → BACKLOG I3. computePhysics() löst die Gleichgewichtsquadratgleichung analytisch;
// Invariante: F_L = 2·D·Δy (Lorentz-Zug = Feder-Rückstellkraft zweier Federn).
import { test, expect } from 'vitest'
import { MU0, RHO_CU } from '../Project_lorentz_force_simulation/js/constants.js'
import { store } from '../Project_lorentz_force_simulation/js/state.js'
import { computePhysics, calculateMinSpringK } from '../Project_lorentz_force_simulation/js/physics.js'

const setParallel = () => {
  store.currentFlowMode = 'parallel'
  store.length = 2.0; store.crossSection = 4.0
  store.springK = 8.788; store.distance0 = 600
}

test('Widerstand R = ρ·L/A, Strom I = U/R (voltage mode)', () => {
  store.inputMode = 'voltage'; store.voltage = 0.590; setParallel()
  computePhysics()
  expect(store.resistance).toBeCloseTo(RHO_CU * 2.0 / 4.0, 10)
  expect(store.current).toBeCloseTo(0.590 / (RHO_CU * 2.0 / 4.0), 10)
})

test('Gleichgewicht (parallel): F_L = 2·D·Δy (Kräftebilanz beider Federn)', () => {
  store.inputMode = 'current'; store.targetCurrent = 30; setParallel()
  computePhysics()
  expect(store.current).toBeGreaterThan(0)
  expect(store.forceL).toBeCloseTo(2 * store.springK * (store.deltaY / 1000), 6)
})

test('Stabile Wurzel d₊ = (d0+√disc)/2 ausgewählt (nicht instabil d₋)', () => {
  store.inputMode = 'current'; store.targetCurrent = 30; setParallel()
  computePhysics()
  const d0_m = store.distance0 / 1000
  const C = (MU0 * store.current ** 2 * store.length) / (Math.PI * store.springK)
  const disc = d0_m ** 2 - C
  expect(disc).toBeGreaterThan(0)
  expect(store.distance / 1000).toBeCloseTo((d0_m + Math.sqrt(disc)) / 2, 10)
})

test('current ≤ 0 Guard: keine Kraft, keine Auslenkung', () => {
  store.inputMode = 'current'; store.targetCurrent = 0; setParallel()
  computePhysics()
  expect(store.forceL).toBe(0)
  expect(store.deltaY).toBe(0)
})

test('calculateMinSpringK ≥ 2.0 (Floor-Guard)', () => {
  expect(calculateMinSpringK(1, 2, 600)).toBeGreaterThanOrEqual(2.0)
})