// Seed-Test: Elastischer Stoß — Impuls- + Energieerhaltung, Sonderfälle.
// → BACKLOG I3. elasticFinalVelocities() ist rein (geschlossene Formel).
import { test, expect } from 'vitest'
import { elasticFinalVelocities } from '../Project_stoss_simulation/js/physics.js'

const conserved = (m1, m2, v1, v2) => {
  const { v1p, v2p } = elasticFinalVelocities(m1, m2, v1, v2, false, false)
  return {
    v1p, v2p,
    p: m1 * v1 + m2 * v2 - (m1 * v1p + m2 * v2p),
    e: 0.5 * m1 * v1 ** 2 + 0.5 * m2 * v2 ** 2 - (0.5 * m1 * v1p ** 2 + 0.5 * m2 * v2p ** 2),
  }
}

test('Impuls + Energie erhalten über mehrere Massen-/Geschwindigkeitskombinationen', () => {
  for (const [m1, m2, v1, v2] of [[1, 1, 1, 0], [2, 1, 3, -1], [1, 2, 0, -2], [5, 3, 2, 1]]) {
    const r = conserved(m1, m2, v1, v2)
    expect(r.p).toBeCloseTo(0, 10)
    expect(r.e).toBeCloseTo(0, 10)
  }
})

test('Gleiche Massen: Geschwindigkeiten tauschen', () => {
  const { v1p, v2p } = elasticFinalVelocities(1, 1, 1, 0, false, false)
  expect(v1p).toBeCloseTo(0, 12)
  expect(v2p).toBeCloseTo(1, 12)
})

test('Wand-Sonderfall (m2→∞): v1′ = −v1', () => {
  const { v1p, v2p } = elasticFinalVelocities(1, 1e9, 1, 0, false, true)
  expect(v1p).toBeCloseTo(-1, 12)
  expect(v2p).toBeCloseTo(0, 12)
})