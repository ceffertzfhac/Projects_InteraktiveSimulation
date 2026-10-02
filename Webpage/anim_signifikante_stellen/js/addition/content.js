'use strict'
// Kapitel „Addition": alle angezeigten Zahlen aus model.js — Steckbrief-Tabelle,
// Etiketten-Kandidaten, Einheiten-Tafel, Folienzahlen (<span data-dyn="add.feld">).

import { fmt } from '../../../shared/js/format.js'
import { sumExample, exactStr, formatSig, digitCompare, compareHtml, placeAnalysis, placeName } from '../model.js'
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

// Einheiten-Tafel: dieselbe Rechnung in mm, cm und m — ehrlich umgerechnet
// (Anzahl sinnvoller Ziffern bleibt; 0,8 m = 8 · 10² mm, nicht 800 mm)
const inUnit = f => ({
  a: formatSig(a.value * f, a.sig), b: fmt(b.value * f, Math.max(0, b.decimals - Math.round(Math.log10(f)))),
  raw: exactStr(SUM.value * f), res: formatSig(SUM.value * f, 2),
})
export const UNIT = { mm: inUnit(1000), cm: inUnit(100), m: inUnit(1), aMmFalse: exactStr(a.value * 1000) }

// Folienzahlen
export const ADD = {
  aLo: fmt(a.lo, a.decimals + 1), aHi: fmt(a.hi, a.decimals + 1),
  bLo: fmt(b.lo, b.decimals + 1), bHi: fmt(b.hi, b.decimals + 1),
  lo: exactStr(SUM.lo), hi: exactStr(SUM.hi), loH: compareHtml(cmp.lo), hiH: compareHtml(cmp.hi),
  raw, half: exactStr(SUM.half), aHalf: half(a), bHalf: half(b), aPct: pct(a), bPct: pct(b),
  rounded: SUM.rounded, sigRule: SUM.sigRule, uncOrd,
  a: a.text, b: b.text, aSig: String(a.sig), bSig: String(b.sig), aDec: String(a.decimals), bDec: String(b.decimals),
  aMm: UNIT.mm.a, bMm: UNIT.mm.b, resMm: UNIT.mm.res,
}
// Zusammenfassung: dieselbe Summe in m, cm und mm — Stellenwert der letzten Ziffer je
// Summand und beim Ergebnis; zuletzt die (falsche) Faustregel der Multiplikation
// (Ziffernvergleich je Einheit: L_min / L_max in dieser Einheit — die unsichere Stelle
// ist überall dieselbe: Zehntel m = Zehner cm = Hunderter mm)
const lastPlace = str => placeName(placeAnalysis(str, 0, 1, 0.5).pLast)
export const SUMMARY = [['m', UNIT.m, 1], ['cm', UNIT.cm, 100], ['mm', UNIT.mm, 1000]].map(([u, x, f]) => {
  const D = compareData({ lo: exactStr(SUM.lo * f), val: x.raw, hi: exactStr(SUM.hi * f), sym: 'L', mid: '', unit: u, rounded: x.res })
  return [`${x.a} ${u} + ${x.b} ${u}`, `${lastPlace(x.a)} und ${lastPlace(x.b)}`,
    `${D.pos}. Stelle (${placeName(D.cmp.pDiff)})`, `${x.res} ${u}`]
}).concat([['Faustregel der Multiplikation', `signif. Stellen: ${a.sig} und ${b.sig}`, '–', `${SUM.sigRule} m – verschenkt Wissen ✗`]])

export const CALC_IO = { input: `${a.text} + ${b.text} =`, output: raw }

export function fillAddCards(DOM) {
  fillSummary(DOM.cards.a_sum, SUMMARY)
  for (const el of DOM.dyn) {
    const [grp, field] = el.dataset.dyn.split('.')
    if (grp === 'add') el[field.endsWith('H') ? 'innerHTML' : 'textContent'] = ADD[field]
  }
}
