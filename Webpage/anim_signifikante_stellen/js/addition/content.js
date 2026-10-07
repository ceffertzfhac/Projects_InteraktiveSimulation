'use strict'
// Kapitel „Addition": alle angezeigten Zahlen aus model.js — Steckbrief-Tabelle,
// Etiketten-Kandidaten, Einheiten-Tafel, Folienzahlen (<span data-dyn="add.feld">).

import { fmt } from '../../../shared/js/format.js'
import { sumExample, parseMeasured, exactStr, formatSig, digitCompare, compareHtml, placeAnalysis, placeName } from '../model.js'
import { compareData, fillSummary } from '../stellen.js'
import { READ } from './constants.js'

export const SUM = sumExample(READ.a, READ.b)
const { a, b } = SUM
const iv = m => `[${fmt(m.lo, m.decimals + 1)} ; ${fmt(m.hi, m.decimals + 1)})`
const half = m => exactStr(m.width / 2)
const pct = m => { const r = 100 * m.width / 2 / m.value; return fmt(Number(r.toPrecision(1)), r < 1 ? -Math.floor(Math.log10(r)) : 0) }

// Steckbrief: Etikett, Intervall, Unsicherheit, signifikante Stellen, Nachkommastellen
export const ROWS = [
  { name: 'Stab A', tag: `${a.text} m`, iv: `${iv(a)} m`, pm: `± ${half(a)} m`, sig: `${a.sig}`, dec: String(a.decimals) },
  { name: 'Werkstück B', tag: `${b.text} m`, iv: `${iv(b)} m`, pm: `± ${half(b)} m`, sig: `${b.sig}`, dec: String(b.decimals) },
  { name: 'A + B', tag: `${SUM.rounded} m`, iv: `[${exactStr(SUM.lo)} ; ${exactStr(SUM.hi)}) m`,
    pm: `± ${exactStr(SUM.half)} m`, sig: '2', dec: String(SUM.decimals) },
]

const raw = exactStr(SUM.value)
// Vergleichstafel L_max · Rechner · L_min (PO 2026-10-02: Ziffernvergleich als Hauptmethode)
export const CMP = compareData({
  lo: exactStr(SUM.lo), val: raw, hi: exactStr(SUM.hi), sym: 'L', mid: 'Rechner', unit: 'm', rounded: SUM.rounded,
})

// Ziffernvergleich L_min / L_max (wie in der Multiplikation)
const cmp = digitCompare(exactStr(SUM.lo), exactStr(SUM.hi))
const ORD = ['ersten', 'zweiten', 'dritten', 'vierten']
const uncOrd = ORD[Math.max(...cmp.hi.filter(c => !c.comma).map(c => c.p)) - cmp.pDiff]

// Einheiten-Tafel: dieselbe Rechnung in km, m, dm, cm und mm — so umgerechnet, daß die signifikanten Stellen erhalten bleiben
// (Anzahl sinnvoller Ziffern bleibt) und mit GLEICHER Zehnerpotenz für beide Summanden
// und das Ergebnis: 0,8 · 10³ mm + 1,877 · 10³ mm = 2,677 · 10³ mm → 2,7 · 10³ mm.
// So stehen in jeder Einheit dieselben Mantissen da — Nachkommastellen direkt vergleichbar.
const SUPS = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }
const pow = e => (e ? ` · 10${[...String(e)].map(c => SUPS[c]).join('')}` : '')
export const UNITS_POW = [['km', -3], ['m', 0], ['dm', 1], ['cm', 2], ['mm', 3]].map(([u, e]) => ({
  u, a: a.text + pow(e), b: b.text + pow(e), raw: raw + pow(e), res: SUM.rounded + pow(e),
}))
const inUnit = f => ({
  a: formatSig(a.value * f, a.sig), b: fmt(b.value * f, Math.max(0, b.decimals - Math.round(Math.log10(f)))),
  raw: exactStr(SUM.value * f), res: formatSig(SUM.value * f, 2),
})
// „800 mm" wäre falsch umgerechnet: mehr signifikante Stellen = vorgetäuschte Genauigkeit
const aFalse = exactStr(a.value * 1000), aFalseM = parseMeasured(aFalse)
export const UNIT = { mm: inUnit(1000), cm: inUnit(100), m: inUnit(1), aMmFalse: aFalse,
  aMmPow: a.text + pow(3), aFalseSig: aFalseM.sig, aFalseHalf: exactStr(aFalseM.width / 2),
  aHalfMm: exactStr(a.width / 2 * 1000) }

// Folienzahlen
export const ADD = {
  aLo: fmt(a.lo, a.decimals + 1), aHi: fmt(a.hi, a.decimals + 1),
  bLo: fmt(b.lo, b.decimals + 1), bHi: fmt(b.hi, b.decimals + 1),
  lo: exactStr(SUM.lo), hi: exactStr(SUM.hi), loH: compareHtml(cmp.lo), hiH: compareHtml(cmp.hi),
  raw, half: exactStr(SUM.half), aHalf: half(a), bHalf: half(b), aPct: pct(a), bPct: pct(b),
  rounded: SUM.rounded, sigRule: SUM.sigRule, uncOrd,
  calcEq: `${a.text} m + ${b.text} m = ${raw} m`,
  a: a.text, b: b.text, aSig: String(a.sig), bSig: String(b.sig), aDec: String(a.decimals), bDec: String(b.decimals),
  aMm: UNIT.aMmPow, bMm: UNIT.mm.b, resMm: UNIT.mm.res,
  aMmFalse: UNIT.aMmFalse, aFalseSig: String(UNIT.aFalseSig), aFalseHalf: UNIT.aFalseHalf, aHalfMm: UNIT.aHalfMm,
}
// Zusammenfassung: dieselbe Summe in m, cm und mm — Stellenwert der letzten Ziffer je
// Summand und beim Ergebnis; zuletzt die (falsche) Faustregel der Multiplikation
// (Ziffernvergleich je Einheit: L_min / L_max in dieser Einheit — die unsichere Stelle
// ist überall dieselbe: Zehntel m = Zehner cm = Hunderter mm)
const lastPlace = str => placeName(placeAnalysis(str, 0, 1, 0.5).pLast)
export const SUMMARY = [['m', 1], ['cm', 100], ['mm', 1000]].map(([u, f]) => {
  const x = UNITS_POW.find(r => r.u === u)
  const D = compareData({ lo: exactStr(SUM.lo * f), val: exactStr(SUM.value * f), hi: exactStr(SUM.hi * f),
    sym: 'L', mid: '', unit: u, rounded: x.res })
  return [`${x.a} ${u} + ${x.b} ${u}`, `${lastPlace(x.a)} und ${lastPlace(x.b)}`,
    `${D.pos}. Stelle (${placeName(D.cmp.pDiff)})`, `${x.res} ${u}`]
}).concat([['Faustregel der Multiplikation', `${a.sig} und ${b.sig} signif. Stellen`, '–', `${SUM.sigRule} m – verschenkt Wissen ✗`]])

export const CALC_IO = { input: `${a.text} + ${b.text} =`, output: raw }

export function fillAddCards(DOM) {
  fillSummary(DOM.cards.a_sum, SUMMARY)
  for (const el of DOM.dyn) {
    const [grp, field] = el.dataset.dyn.split('.')
    if (grp === 'add') el[field.endsWith('H') ? 'innerHTML' : 'textContent'] = ADD[field]
  }
}
