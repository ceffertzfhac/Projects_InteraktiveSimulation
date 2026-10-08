// Seed-Test: Busfahrt (Linie 42) — Fahrplan + Trapez-Profil. → BACKLOG N10.
// Invarianten: Haltestellen exakt erreicht, x(t) monoton und stetig,
// v = 0 an Halten, Werte wie in der Skript-Figur (Abb. 1.2).
import { test, expect } from 'vitest'
import { store } from '../Project_busfahrt_simulation/js/state.js'
import { precompute, interpolateAt, stateAt, tripData, phaseInfoAt } from '../Project_busfahrt_simulation/js/physics.js'
import { SEGMENTS, T_MAX } from '../Project_busfahrt_simulation/js/constants.js'

precompute()

test('Fahrplan lückenlos über 0 … 400 s', () => {
  expect(SEGMENTS[0].tStart).toBe(0)
  expect(SEGMENTS.at(-1).tEnd).toBe(T_MAX)
  for (let i = 1; i < SEGMENTS.length; i++) expect(SEGMENTS[i].tStart).toBe(SEGMENTS[i - 1].tEnd)
})

test('Haltestellen werden exakt erreicht, v = 0 am Halt', () => {
  for (const s of SEGMENTS.filter(s => s.type === 'fahrt')) {
    const end = stateAt(store.phases, s.tEnd)
    expect(end.x).toBeCloseTo(s.xEnd, 9)
    expect(end.v).toBeCloseTo(0, 9)
  }
})

test('x(t) monoton steigend, precompute deckt sich mit geschlossener Form', () => {
  for (let i = 1; i < store.t_data.length; i++) {
    expect(store.t_data[i]).toBeGreaterThanOrEqual(store.t_data[i - 1])
    expect(store.x_data[i]).toBeGreaterThanOrEqual(store.x_data[i - 1] - 1e-9)
  }
  for (let t = 0; t <= T_MAX; t += 7.3) {
    expect(interpolateAt(store.x_data, t)).toBeCloseTo(stateAt(store.phases, t).x, 1)
  }
})

test('Werte wie in der Skript-Figur: x(75 s) = 250 m, Fahrplantabelle', () => {
  expect(interpolateAt(store.x_data, 75)).toBeCloseTo(250, 6)
  const trips = tripData()
  expect(trips.map(d => +d.vMax.toFixed(2))).toEqual([7.94, 8.4, 7.52])
  expect(trips.map(d => +d.a.toFixed(3))).toEqual([0.294, 0.33, 0.264])
})

test('a(t) springt scharf an Phasengrenzen (keine Verschmierung)', () => {
  // Anfahren H1 → H2 beginnt bei t = 30 s
  expect(interpolateAt(store.a_data, 29.999)).toBe(0)
  expect(interpolateAt(store.a_data, 30)).toBeCloseTo(tripData()[0].a, 9)
  expect(phaseInfoAt(10).stop).toBe('H1')
  expect(phaseInfoAt(75).kind).toBe('konstant')
})
