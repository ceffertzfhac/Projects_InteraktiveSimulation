// Seed-Test: Ableitung — Sekanten-/Tangentensteigung, Grenzwertkonvergenz.
// → BACKLOG I3. analyze() liefert mTan = analytische Ableitung fp(x0) exakt;
// mSec → mTan für delta→0. Regression-Test für alle 4 Funktionen.
import { test, expect } from 'vitest'
import { FUNCS } from '../Project_ableitung_simulation/js/constants.js'
import { analyze } from '../Project_ableitung_simulation/js/physics.js'

const KEYS = Object.keys(FUNCS)

test('mTan = analytische Ableitung fp(x0) für alle 4 Funktionen', () => {
  for (const key of KEYS) {
    const { fp } = FUNCS[key]
    for (const x0 of [0, 5, 10, 15, 20]) {
      expect(analyze(key, x0, 0.5, true).mTan).toBeCloseTo(fp(x0), 10)
    }
  }
})

test('Sekantensteigung konvergiert für delta→0 gegen die Tangente', () => {
  // Kubisch: zentrierte Sekante ist NICHT exakt (im Gegensatz zur Parabel) →
  // sichtbare Konvergenz. fp(10) = 0,06·(10−12,5)² − 2 = −1,625.
  const mTan = FUNCS.kubisch.fp(10)
  const big = Math.abs(analyze('kubisch', 10, 1.0, true).mSec - mTan)
  const small = Math.abs(analyze('kubisch', 10, 0.001, true).mSec - mTan)
  expect(small).toBeLessThan(big)
  expect(small).toBeLessThan(1e-3)
})

test('Gerade (linear): Sekante == Tangente exakt für jedes delta', () => {
  for (const d of [1, 0.5, 0.1]) {
    const { mSec, mTan } = analyze('gerade', 10, d, true)
    expect(mSec).toBeCloseTo(mTan, 12)
  }
})