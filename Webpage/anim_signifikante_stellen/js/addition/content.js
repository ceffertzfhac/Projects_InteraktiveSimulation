'use strict'
// Kapitel „Addition": alle angezeigten Zahlen aus model.js — Steckbrief-Tabelle,
// Etiketten-Kandidaten, Stellenanalyse, Folienzahlen (<span data-dyn="add.feld">).

import { fmt } from '../../../shared/js/format.js'
import { sumExample, placeAnalysis, exactStr } from '../model.js'
import { READ } from './constants.js'

export const SUM = sumExample(READ.a, READ.b)
const { a, b } = SUM
const iv = m => `[${fmt(m.lo, m.decimals + 1)} ; ${fmt(m.hi, m.decimals + 1)})`
const half = m => exactStr(m.width / 2)
const stellen = n => `${n}`

// Steckbrief: Etikett, Intervall, Unsicherheit, signifikante Stellen, Nachkommastellen
export const ROWS = [
  { name: 'Stab A', tag: `${a.text} m`, iv: `${iv(a)} m`, pm: `± ${half(a)} m`, sig: stellen(a.sig), dec: String(a.decimals) },
  { name: 'Werkstück B', tag: `${b.text} m`, iv: `${iv(b)} m`, pm: `± ${half(b)} m`, sig: stellen(b.sig), dec: String(b.decimals) },
  { name: 'A + B', tag: `${SUM.rounded} m`, iv: `[${exactStr(SUM.lo)} ; ${exactStr(SUM.hi)}) m`,
    pm: `± ${exactStr(SUM.half)} m`, sig: '2', dec: String(SUM.decimals) },
]

// Etiketten-Kandidaten für die Summe: Taschenrechner, Faustregel der Multiplikation, richtig
const cand = (text, verdictText, ok) => {
  const info = placeAnalysis(text, SUM.lo, SUM.hi)
  return { text: `${text} m`, value: info.R, p: info.pLast, verdict: verdictText, ok }
}
const width = SUM.hi - SUM.lo
// Faktor auf eine Stelle gerundet (101 → rund 100)
const one = r => Number(r.toPrecision(1))
const ratio = c => one(width / 10 ** placeAnalysis(c, SUM.lo, SUM.hi).pLast)
const raw = exactStr(SUM.value)
export const CANDS = [
  cand(raw, `${raw} m: Das Intervall ist rund ${ratio(raw)}-mal breiter als die Klammer → Scheingenauigkeit`, false),
  cand(SUM.sigRule, `${SUM.sigRule} m: Die Klammer ist rund ${one(1 / (width / 10 ** placeAnalysis(SUM.sigRule, SUM.lo, SUM.hi).pLast))}-mal breiter als das Intervall → verschenkt Wissen`, false),
  cand(SUM.rounded, `${SUM.rounded} m: Klammer und Intervall sind etwa gleich breit → passt`, true),
]

// Stellenanalyse der richtigen Summe
const info = placeAnalysis(SUM.rounded, SUM.lo, SUM.hi, SUM.value)
export const LUPE = { info }

// Folienzahlen
export const ADD = {
  aLo: fmt(a.lo, a.decimals + 1), aHi: fmt(a.hi, a.decimals + 1),
  bLo: fmt(b.lo, b.decimals + 1), bHi: fmt(b.hi, b.decimals + 1),
  lo: exactStr(SUM.lo), hi: exactStr(SUM.hi), raw, half: exactStr(SUM.half),
  aHalf: half(a), bHalf: half(b), rounded: SUM.rounded, sigRule: SUM.sigRule,
}

export function fillAddCards(DOM) {
  for (const el of DOM.dyn) {
    const [grp, field] = el.dataset.dyn.split('.')
    if (grp === 'add') el.textContent = ADD[field]
  }
}
