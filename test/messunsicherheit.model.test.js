// Seed-Test: Messunsicherheit (Schritt-Animation) — Bestwert, Standardabweichung, u. → BACKLOG N11.
import { test, expect } from 'vitest'
import {
  drawValues, bestwert, stabw, unsicherheit, strichliste, reihen, decimalsFor, fmt, parseSeed,
  MU, SIGMA, N_MAX,
} from '../Project_messunsicherheit_animation/js/model.js'

test('Ziehung ist je Seed reproduzierbar, verschiedene Seeds unterscheiden sich', () => {
  expect(drawValues(7)).toEqual(drawValues(7))
  expect(drawValues(7)).not.toEqual(drawValues(8))
  expect(drawValues(7)).toHaveLength(N_MAX)
})

test('Mittelwert und Standardabweichung (1/(n−1)) einer bekannten Reihe', () => {
  const v = [2, 4, 4, 4, 5, 5, 7, 9]
  expect(bestwert(v)).toBe(5)
  expect(stabw(v)).toBeCloseTo(Math.sqrt(32 / 7), 12)
  expect(unsicherheit(v)).toBeCloseTo(Math.sqrt(32 / 7) / Math.sqrt(8), 12)
})

test('Statistik großer Stichprobe liegt bei μ und σ', () => {
  const v = drawValues(1, 20000)
  expect(bestwert(v)).toBeCloseTo(MU, 1)
  expect(stabw(v)).toBeCloseTo(SIGMA, 1)
})

test('σ bleibt etwa konstant, u sinkt mit 1/√n', () => {
  const v = drawValues(3, 4000)
  const r = reihen(v, 4000)
  expect(r[3999 - 1].u).toBeLessThan(r[40 - 2].u / 5)
  expect(Math.abs(r[3999 - 1].sigma - SIGMA)).toBeLessThan(0.1)
})

test('Strichliste zählt vollständig', () => {
  const v = drawValues(5)
  const s = strichliste(v, 10, 10, 20)
  expect(s.inside + s.outside).toBe(10)
})

test('Rundung: u auf 2 signifikante Stellen, Dezimalkomma', () => {
  expect(decimalsFor(0.27)).toBe(2)
  expect(decimalsFor(0.0271)).toBe(3)
  expect(decimalsFor(1.234)).toBe(1)
  expect(fmt(9.3249, 2)).toBe('9,32')
})

test('Seed aus Hash lesen', () => {
  expect(parseSeed('#k3/5?s=42')).toBe(42)
  expect(parseSeed('#k3/5')).toBeNull()
})
