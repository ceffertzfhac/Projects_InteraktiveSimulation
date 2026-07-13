// Seed-Test: Atwood-Maschine — Invarianten der analytischen Lösung.
// → BACKLOG I3. precompute() nutzt geschlossene Form (a=const, s=½at², v=at)
// → Energie/Impuls analytisch exakt, keine numerische Drift.
import { test, expect } from 'vitest'
import { G, CM_PER_M } from '../Project_atwood_simulation/js/constants.js'
import { getAccel, precompute } from '../Project_atwood_simulation/js/physics.js'
import { store } from '../Project_atwood_simulation/js/state.js'

test('getAccel: a = (m1−m2)·g/(m1+m2); m1==m2 → a=0', () => {
  const { a, T } = getAccel(5, 3)
  expect(a).toBeCloseTo((5 - 3) * G / (5 + 3), 10)
  expect(T).toBeGreaterThan(0)
  expect(getAccel(3, 3).a).toBe(0)
})

test('precompute: a1 konstant, v1 linear in t, Seillänge y1+y2 erhalten', () => {
  store.m1 = 5.2; store.m2 = 4.8; store.y1_start_cm = 100; store.y2_start_cm = 100
  precompute()
  const { a } = getAccel(store.m1, store.m2)
  const n = store.t_data.length
  expect(n).toBeGreaterThan(10)
  for (const av of store.a1_data) expect(av).toBeCloseTo(-a, 9) // Höhen-KoSyst: a1 = −a
  for (let i = 0; i < n; i++) expect(store.v1_data[i]).toBeCloseTo(-a * store.t_data[i], 6)
  const sum0 = store.y1_data[0] + store.y2_data[0]
  for (let i = 0; i < n; i++) expect(store.y1_data[i] + store.y2_data[i]).toBeCloseTo(sum0, 9)
})

test('precompute: Energieerhaltung ½m·v² + m·g·h = konstant', () => {
  store.m1 = 5.2; store.m2 = 4.8; store.y1_start_cm = 100; store.y2_start_cm = 100
  precompute()
  const E = i => 0.5 * store.m1 * store.v1_data[i] ** 2 + 0.5 * store.m2 * store.v2_data[i] ** 2
    + store.m1 * G * (store.y1_data[i] / CM_PER_M) + store.m2 * G * (store.y2_data[i] / CM_PER_M)
  const E0 = E(0)
  for (let i = 0; i < store.t_data.length; i++) expect(E(i)).toBeCloseTo(E0, 6)
})