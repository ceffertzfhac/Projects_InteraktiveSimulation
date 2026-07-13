// Seed-Test: 3-Massen-Umlenkrollen — Kräftegleichgewicht am mittleren Knoten.
// → BACKLOG I3. computeEquilibrium() löst die Winkel analytisch aus dem
// Kräftedreieck; Invariante: ΣF an m₂ = 0 (Seilzug + Gewicht).
import { test, expect } from 'vitest'
import { G } from '../Project_3massen_umlenkrollen_simulation/js/constants.js'
import { computeEquilibrium } from '../Project_3massen_umlenkrollen_simulation/js/physics.js'

// Defaults aus state.js + ui.js-Aufrufmuster (m1=1.9, m2=2.0, m3=1.2,
// Rollenabstand 40 cm → pulleyLeftX=250/pulleyRightX=650, Seillänge 50 cm → 500 px).
const eq = () => computeEquilibrium(1.9, 2.0, 1.2, 250, 650, 500)

test('Gleichgewicht gefunden (status ok)', () => {
  expect(eq().status).toBe('ok')
})

test('Seilkräfte T1=m1·g, T3=m3·g, Fg2=m2·g', () => {
  const r = eq()
  expect(r.T1).toBeCloseTo(1.9 * G, 10)
  expect(r.T3).toBeCloseTo(1.2 * G, 10)
  expect(r.Fg2).toBeCloseTo(2.0 * G, 10)
})

test('Kräftegleichgewicht an m₂: ΣF = 0 (T1+T3+G2, Bildschirm-Koords Y↓)', () => {
  const r = eq()
  expect(r.T1_vec.x + r.T3_vec.x).toBeCloseTo(0, 8)
  // Seilzug zeigt nach oben (negatives y), Gewicht nach unten (+Fg2) → Summer 0.
  expect(r.T1_vec.y + r.T3_vec.y + r.Fg2).toBeCloseTo(0, 8)
})