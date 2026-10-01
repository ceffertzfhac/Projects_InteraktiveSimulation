// Seed-Test: Signifikante Stellen — Rundungsintervalle und Produkt-Bereiche.
// → BACKLOG I3 / N9. Alle Zahlen der Animation stammen aus model.js.
import { test, expect } from 'vitest'
import {
  sigFigs, parseMeasured, productInterval, exactStr, formatSig, areaExample, circleExample,
} from '../Project_signifikante_stellen_animation/js/model.js'

test('signifikante Stellen', () => {
  expect(sigFigs('3')).toBe(1)
  expect(sigFigs('3,000')).toBe(4)
  expect(sigFigs('2,9')).toBe(2)
  expect(sigFigs('0,05')).toBe(1)
})

test('Rundungsintervall halboffen ±½ Einheit der letzten Stelle', () => {
  const a = parseMeasured('3')
  expect(a.lo).toBeCloseTo(2.5, 12)
  expect(a.hi).toBeCloseTo(3.5, 12)
  const d = parseMeasured('3,000')
  expect(d.decimals).toBe(3)
  expect(d.lo).toBeCloseTo(2.9995, 12)
  expect(d.hi).toBeCloseTo(3.0005, 12)
})

test('Produktbereich 3 · 2 und 3,000 · 2,000', () => {
  const c = productInterval(parseMeasured('3'), parseMeasured('2'))
  expect(c.lo).toBeCloseTo(3.75, 12)
  expect(c.hi).toBeCloseTo(8.75, 12)
  const f = productInterval(parseMeasured('3,000'), parseMeasured('2,000'))
  expect(f.lo).toBeCloseTo(5.99750025, 12)
  expect(f.hi).toBeCloseTo(6.00250025, 12)
})

test('exakte Darstellung ohne Gleitkomma-Rauschen', () => {
  expect(exactStr(2.9995 * 1.9995)).toBe('5,99750025')
  expect(exactStr(3.75)).toBe('3,75')
  expect(exactStr(6)).toBe('6')
})

test('Rundung auf signifikante Stellen', () => {
  expect(formatSig(6, 4)).toBe('6,000')
  expect(formatSig(6, 1)).toBe('6')
  expect(formatSig(8.7, 2)).toBe('8,7')
})

test('Ergebnis: so viele Stellen wie der ungenaueste Faktor — und der Bereich bestätigt es', () => {
  for (const [l, b, expected] of [
    ['3,000', '2,000', '6,000'], ['3', '2,00', '6'], ['3,00', '2,9', '8,7'], ['3,0', '2,00', '6,0'],
  ]) {
    const ex = areaExample(l, b)
    expect(ex.rounded).toBe(expected)
    // gerundeter Wert liegt im Bereich; nur die letzte Stelle ist unsicher:
    const r = parseMeasured(expected)
    expect(r.value).toBeGreaterThanOrEqual(ex.A.lo)
    expect(r.value).toBeLessThan(ex.A.hi)
    expect(ex.A.hi - ex.A.lo).toBeLessThan(10 * r.width)
  }
})

test('Rundung mit Zehnerpotenz, wenn weniger Stellen als Vorkommastellen', () => {
  expect(formatSig(18.85, 1)).toBe('2 · 10¹')
  expect(formatSig(28.27, 1)).toBe('3 · 10¹')
  expect(formatSig(96, 1)).toBe('1 · 10²')
  expect(formatSig(18.85, 2)).toBe('19')
})

test('Kreis: 2 und π exakt — U und A haben so viele Stellen wie r', () => {
  const c = circleExample('3,0')
  expect(c.U.lo).toBeCloseTo(2 * Math.PI * 2.95, 12)
  expect(c.U.hi).toBeCloseTo(2 * Math.PI * 3.05, 12)
  expect(c.U.rounded).toBe('19')
  expect(c.A.rounded).toBe('28')
  expect(c.A.lo).toBeCloseTo(Math.PI * 2.95 ** 2, 12)
  const g = circleExample('3')
  expect(g.U.rounded).toBe('2 · 10¹')
  expect(g.A.rounded).toBe('3 · 10¹')
  expect(g.A.lo).toBeLessThan(30)
  expect(g.A.hi).toBeGreaterThan(30)
})
