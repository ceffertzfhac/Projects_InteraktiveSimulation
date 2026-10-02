// Seed-Test: Signifikante Stellen — Rundungsintervalle und Produkt-Bereiche.
// → BACKLOG I3 / N9. Alle Zahlen der Animation stammen aus model.js.
import { test, expect } from 'vitest'
import {
  sigFigs, parseMeasured, productInterval, exactStr, formatSig, areaExample, circleExample,
  quotientInterval, speedExample, placeAnalysis, sumExample, roundAtPlace, digitCompare, compareHtml,
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
  expect(formatSig(9.915, 1)).toBe('1 · 10¹')     // gerundet 10 → Zehnerpotenz
  expect(formatSig(9.996, 3)).toBe('10,0')
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

test('Division v = s / t: Bereich = s_min/t_max … s_max/t_min, Stellen wie die ungenaueste Größe', () => {
  const q = quotientInterval(parseMeasured('20'), parseMeasured('2,17'))
  expect(q.lo).toBeCloseTo(19.5 / 2.175, 12)
  expect(q.hi).toBeCloseTo(20.5 / 2.165, 12)
  // Person A: 1-m-Maßband (2 Stellen), Lichtschranken 0,01 s (3 Stellen)
  expect(speedExample('20', '2,17').rounded).toBe('9,2')
  // Person B: cm-Maßband (4 Stellen), Sekundenzeiger (1 Stelle)
  const b = speedExample('19,83', '2')
  expect(b.sig).toBe(1)
  expect(b.rounded).toBe('1 · 10¹')
  expect(b.v.lo).toBeCloseTo(19.825 / 2.5, 12)
  expect(b.v.hi).toBeCloseTo(19.835 / 1.5, 12)
  // Kombination: cm-Maßband + Lichtschranken → 3 Stellen, gerundeter Wert im Bereich
  const c = speedExample('19,83', '2,17')
  expect(c.rounded).toBe('9,14')
  expect(9.14).toBeGreaterThanOrEqual(c.v.lo)
  expect(9.14).toBeLessThan(c.v.hi)
})

test('Stellenanalyse: Intervall in Einheiten jeder Stelle, Kategorie nach Faustregel', () => {
  const a = placeAnalysis('9,2', 19.5 / 2.175, 20.5 / 2.165)
  expect(a.places.map(p => p.cat)).toEqual(['sure', 'unc', 'ghost'])
  expect(a.places.map(p => p.name)).toEqual(['Einer', 'Zehntel', 'Hundertstel'])
  expect(a.places[1].ratio).toBeCloseTo(10 * a.places[0].ratio, 12)
  const b = placeAnalysis('1 · 10¹', 7.93, 13.22)
  expect(b.R).toBe(10)
  expect(b.places.map(p => p.p)).toEqual([1, 0])
  expect(placeAnalysis('6,000', 5.9975, 6.0025).places.map(p => p.ratioText)).toEqual(
    ['0,005', '0,05', '0,5', '5,0', '50'])
})

test('Beispielwerte der Animation (v0.8.0): keine runden Zahlen, Faustregel greift', () => {
  // Stufe für Stufe gröber: 6,686 → 6,68 → 6,6 → 6
  expect(['3,120·2,143', '3,120·2,14', '3,1·2,143', '3·2'].map(x => areaExample(...x.split('·')).rounded))
    .toEqual(['6,686', '6,68', '6,6', '6'])
  const c = circleExample('3,3')
  expect([c.U.rounded, c.A.rounded]).toEqual(['21', '34'])
})

test('Addition: Nachkommastellen statt signifikanter Stellen', () => {
  const s = sumExample('0,4', '1,253')
  expect(s.lo).toBeCloseTo(0.35 + 1.2525, 12)
  expect(s.hi).toBeCloseTo(0.45 + 1.2535, 12)
  expect(s.half).toBeCloseTo(0.05 + 0.0005, 12)      // Unsicherheiten addieren sich absolut
  expect(s.rounded).toBe('1,7')                      // eine Nachkommastelle wie 0,4
  expect(s.sigRule).toBe('2')                        // Faustregel der Multiplikation: falsch
  // „1,7" beschreibt das Intervall: Breite ≈ eine Einheit der letzten Stelle
  expect((s.hi - s.lo) / 0.1).toBeCloseTo(1.01, 12)
})

test('Ziffernvergleich: erste abweichende Ziffer von A_min/A_max ist die unsichere', () => {
  const pd = (l, b) => { const e = areaExample(l, b); return digitCompare(e.loStr, e.hiStr).pDiff }
  expect(pd('3,120', '2,143')).toBe(-3)            // 6,6835… / 6,6887… → 4. Stelle
  expect(pd('3,120', '2,14')).toBe(-2)             // 6,660… / 6,683… → 3. Stelle
  expect(pd('3', '2')).toBe(0)                     // 3,75 / 8,75 → 1. Stelle
  expect(digitCompare('20,42', '21,05').pDiff).toBe(0)    // Kreis-U bei r = 3,3
  // bestätigt in allen Beispielen der Animation die Faustregel
  for (const [l, b] of [['3,120', '2,143'], ['3,120', '2,14'], ['3', '2']]) {
    expect(pd(l, b)).toBe(placeAnalysis(areaExample(l, b).rounded, 0, 1).pLast)
  }
  expect(compareHtml(digitCompare('3,75', '8,75').hi))
    .toBe('<span class="cmp-unc">8,</span><span class="cmp-ghost">75</span>')
})

test('Angabe bis zur Stelle p: Rundung und Rundungsintervall (Klammer)', () => {
  expect(roundAtPlace(6.68616, 0).text).toBe('7')   // nicht „6"
  expect(roundAtPlace(6.68616, -2).text).toBe('6,69')
  const c = roundAtPlace(2 * Math.PI * 3.3, 1)
  expect(c.text).toBe('2 · 10¹')
  expect(c.lo).toBeCloseTo(15, 12)
  expect(c.hi).toBeCloseTo(25, 12)
  const e = areaExample('3,120', '2,143')
  const pl = placeAnalysis(e.rounded, e.A.lo, e.A.hi, e.A.value).places
  expect(pl.map(q => q.claim)).toEqual(['7', '6,7', '6,69', '6,686', '6,6862'])
  expect(pl.map(q => q.cat)).toEqual(['sure', 'sure', 'sure', 'unc', 'ghost'])
  expect(pl[3].ratio).toBeGreaterThan(1)           // Band breiter als die Klammer …
  expect(pl[3].ratio).toBeLessThan(10)             // … aber nur einige Klammern
  expect(pl[4].ratio).toBeGreaterThan(10)          // danach: sinnlos
})
