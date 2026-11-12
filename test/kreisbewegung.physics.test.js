// Vitest: Kreisbewegung — Schattenprojektion (→ BACKLOG FK6)
import { expect, test, beforeEach } from 'vitest'
import { store } from '../Project_kreisbewegung_simulation/js/state.js'
import { recomputeDerived, position, shadowCoord }
  from '../Project_kreisbewegung_simulation/js/physics.js'

beforeEach(() => {
  store.R = 1.5; store.phi0Deg = 30; store.omegaDeg = 60
  recomputeDerived()
})

test('Leinwand links/rechts zeigt y(t), oben/unten x(t)', () => {
  for (const t of [0, 0.37, 1.9, 4.2]) {
    const p = position(t)
    expect(shadowCoord('left', t)).toBeCloseTo(p.y, 12)
    expect(shadowCoord('right', t)).toBeCloseTo(p.y, 12)
    expect(shadowCoord('top', t)).toBeCloseTo(p.x, 12)
    expect(shadowCoord('bottom', t)).toBeCloseTo(p.x, 12)
  }
})

test('Schatten ist harmonisch: Amplitude R, Periode T, s\'\' = −ω²·s', () => {
  const { R, T, omega } = store
  let max = -Infinity, min = Infinity
  for (let i = 0; i <= 2000; i++) {
    const s = shadowCoord('left', (i / 2000) * T)
    max = Math.max(max, s); min = Math.min(min, s)
  }
  expect(max).toBeCloseTo(R, 4)
  expect(min).toBeCloseTo(-R, 4)
  expect(shadowCoord('top', 0.8 + T)).toBeCloseTo(shadowCoord('top', 0.8), 10)
  const h = 1e-3, t = 1.1
  const acc = (shadowCoord('top', t + h) - 2 * shadowCoord('top', t) + shadowCoord('top', t - h)) / (h * h)
  expect(acc).toBeCloseTo(-omega * omega * shadowCoord('top', t), 4)
})

// Linienschreiber (→ BACKLOG FK8): Papierzeit und Aus-Intervalle
import { recorderTime, inIntervals } from '../Project_kreisbewegung_simulation/js/physics.js'

test('Papier steht, solange der Schreiber aus ist', () => {
  const log = [[1, 2.5], [4, null]]
  expect(recorderTime(0.5, log)).toBeCloseTo(0.5, 12)
  expect(recorderTime(2, log)).toBeCloseTo(1, 12)       // seit 1 s aus
  expect(recorderTime(3, log)).toBeCloseTo(1.5, 12)     // 1,5 s Pause abgezogen
  expect(recorderTime(6, log)).toBeCloseTo(2.5, 12)     // seit 4 s wieder aus
  expect(recorderTime(3, [])).toBe(3)
})

test('inIntervals erkennt Aus-Zeiten (Beginn inklusive, Ende exklusive)', () => {
  const log = [[1, 2], [3, null]]
  expect(inIntervals(0.9, log)).toBe(false)
  expect(inIntervals(1, log)).toBe(true)
  expect(inIntervals(2, log)).toBe(false)
  expect(inIntervals(99, log)).toBe(true)
})
