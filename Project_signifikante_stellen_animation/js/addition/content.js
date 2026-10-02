'use strict'
// Kapitel „Addition": alle angezeigten Zahlen aus model.js — Steckbrief-Tabelle,
// Etiketten-Kandidaten, Einheiten-Tafel, Folienzahlen (<span data-dyn="add.feld">).

import { fmt } from '../../../shared/js/format.js'
import { sumExample, exactStr, formatSig, digitCompare, compareHtml } from '../model.js'
import { bandVsBracket } from '../stellen.js'
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

// Etiketten-Kandidaten für die Summe: Taschenrechner, Faustregel der Multiplikation, richtig.
// Urteil im Wortlaut der Lupe (Band = mögliche Gesamtlängen, Klammer = Rundungsintervall).
const width = SUM.hi - SUM.lo
const raw = exactStr(SUM.value)
const cand = (text, tail, ok) => {
  const [, fp = ''] = text.split(','), p = -fp.length
  const value = Number(text.replace(',', '.'))
  return { text: `${text} m`, value, p, ok, verdict: `${text} m: ${bandVsBracket(width / 10 ** p)} → ${tail}` }
}
export const CANDS = [
  cand(raw, 'sinnlos (Scheingenauigkeit)', false),
  cand(SUM.sigRule, 'verschenkt Wissen', false),
  cand(SUM.rounded, 'letzte Ziffer unsicher ✓', true),
]

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
export const CALC_IO = { input: `${a.text} + ${b.text} =`, output: raw }

export function fillAddCards(DOM) {
  for (const el of DOM.dyn) {
    const [grp, field] = el.dataset.dyn.split('.')
    if (grp === 'add') el[field.endsWith('H') ? 'innerHTML' : 'textContent'] = ADD[field]
  }
}
