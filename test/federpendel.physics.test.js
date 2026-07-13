// Seed-Test: Federpendel — Schwingungs-Invarianten + I7-Energieerhaltung.
// → BACKLOG I3. E_ges = ½kA² konstant (starke Invariante, analytische SHM-Lösung).
import { test, expect } from 'vitest'
import { store } from '../Project_federpendel_simulation/js/state.js'
import {
  recomputeDerived, precompute, displacement, velocity, acceleration, totalEnergy,
} from '../Project_federpendel_simulation/js/physics.js'

test('recomputeDerived: ω = √(k/m), T = 2π/ω', () => {
  store.k = 40; store.m = 2; store.amplitude = 0.8
  recomputeDerived()
  expect(store.omega).toBeCloseTo(Math.sqrt(40 / 2), 12)
  expect(store.T).toBeCloseTo((2 * Math.PI) / store.omega, 12)
})

test('Anfangsbedingungen: x(0)=A, v(0)=0, a(0)=−A·ω²', () => {
  recomputeDerived()
  expect(displacement(0)).toBeCloseTo(store.amplitude, 12)
  expect(velocity(0)).toBeCloseTo(0, 12)
  expect(acceleration(0)).toBeCloseTo(-store.amplitude * store.omega ** 2, 10)
})

test('precompute: E_ges konstant = ½kA² über gesamten Verlauf (I7-Invariante)', () => {
  recomputeDerived(); precompute()
  const Etot = totalEnergy()
  expect(store.egesData.length).toBeGreaterThan(100)
  for (const eg of store.egesData) expect(eg).toBeCloseTo(Etot, 9)
  for (let i = 0; i < store.egesData.length; i++) {
    expect(store.ekData[i] + store.epData[i]).toBeCloseTo(store.egesData[i], 12)
  }
})

test('Periodizität: x(T) ≈ x(0) (analytisch)', () => {
  recomputeDerived()
  expect(displacement(store.T)).toBeCloseTo(displacement(0), 10)
})