// Seed-Test: Integration als Grenzwert — Einschachtelung, Konvergenz, Hauptsatz.
// → BACKLOG I3. Prüft die drei tragenden Invarianten der Sim:
//   (1) F ist Stammfunktion von f (Hauptsatz-Grundlage),
//   (2) U(n) ≤ ∫ ≤ O(n) für jede Zerlegung (echte Riemann-Unter-/Obersumme),
//   (3) O(n) − U(n) → 0 mit Ordnung 1/n.
import { test, expect } from 'vitest'
import { FUNCS, X_MIN, X_MAX } from '../Project_integration_simulation/js/constants.js'
import { sums, exactIntegral, infSup, clampLimits } from '../Project_integration_simulation/js/physics.js'

const KEYS = Object.keys(FUNCS)
const A = 1, B = 8

test('F ist Stammfunktion von f (zentraler Differenzenquotient)', () => {
  for (const key of KEYS) {
    const { f, F } = FUNCS[key]
    for (const x of [0.3, 2.5, 5, 7.7, 9.8]) {
      const h = 1e-6
      expect((F(x + h) - F(x - h)) / (2 * h)).toBeCloseTo(f(x), 5)
    }
  }
})

test('alle Funktionen sind auf dem Definitionsbereich positiv', () => {
  // Bewußte Scope-Entscheidung: „Fläche unter der Kurve" gilt wörtlich,
  // keine Vorzeichenfläche (→ docs/KNOWN_LIMITATIONS.md).
  for (const key of KEYS) {
    const { f } = FUNCS[key]
    for (let i = 0; i <= 1000; i++) {
      expect(f(X_MIN + (i / 1000) * (X_MAX - X_MIN))).toBeGreaterThan(0)
    }
  }
})

test('infSup findet Extrema im Inneren, nicht nur an den Rändern', () => {
  // Parabel hat ihr Minimum bei x = 5 — ein reiner Randvergleich läge daneben.
  const { lo, hi } = infSup('parabel', 4, 7)
  expect(lo).toBeCloseTo(FUNCS.parabel.f(5), 12)
  expect(hi).toBeCloseTo(FUNCS.parabel.f(7), 12)
})

test('Einschachtelung U(n) ≤ ∫ ≤ O(n), M(n) dazwischen', () => {
  for (const key of KEYS) {
    const I = exactIntegral(key, A, B)
    for (const n of [1, 2, 3, 5, 8, 17, 64, 200]) {
      const { U, O, M } = sums(key, A, B, n)
      expect(U).toBeLessThanOrEqual(I + 1e-9)
      expect(O).toBeGreaterThanOrEqual(I - 1e-9)
      expect(M).toBeGreaterThanOrEqual(U - 1e-9)
      expect(M).toBeLessThanOrEqual(O + 1e-9)
    }
  }
})

test('Einschachtelungsband halbiert sich bei Verdopplung von n (Ordnung 1/n)', () => {
  for (const key of KEYS) {
    let prev = Infinity
    for (const n of [8, 16, 32, 64, 128]) {
      const { U, O } = sums(key, A, B, n)
      const span = O - U
      expect(span).toBeLessThan(prev)
      if (prev !== Infinity) expect(span).toBeLessThan(prev * 0.75)
      prev = span
    }
    // Relativer Restfehler bei n = 128 unter 3 % — absolute Schranken wären
    // funktionsabhängig (das Band skaliert mit (sup f − inf f)·Δx).
    expect(prev / Math.abs(exactIntegral(key, A, B))).toBeLessThan(0.03)
  }
})

test('Mittelpunktsregel ist für lineare Funktionen exakt', () => {
  const I = exactIntegral('gerade', A, B)
  for (const n of [1, 3, 7, 40]) {
    expect(sums('gerade', A, B, n).M).toBeCloseTo(I, 12)
  }
})

test('clampLimits hält b − a ≥ 0,5 innerhalb des Definitionsbereichs', () => {
  expect(clampLimits(2, 6, 'a')).toEqual({ a: 2, b: 6 })          // unverändert
  expect(clampLimits(5, 5.2, 'b').a).toBeCloseTo(4.7, 10)          // a weicht aus
  const atEdge = clampLimits(9.9, 8, 'a')                          // am rechten Rand
  expect(atEdge.b).toBeCloseTo(X_MAX, 10)
  expect(atEdge.a).toBeCloseTo(X_MAX - 0.5, 10)
})
