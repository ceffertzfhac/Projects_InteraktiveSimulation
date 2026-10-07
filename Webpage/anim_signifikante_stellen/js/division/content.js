'use strict'
// Kapitel „Division": alle angezeigten Zahlen aus model.js — Messprotokoll
// (Bühne), Stellenanalyse der Ergebnisse und dynamische Zahlen der Folienkarten
// (<span data-dyn="spd.feld">). Die Werte sind fest, daher einmalig befüllt.

import { fmt } from '../../../shared/js/format.js'
import { speedExample, exactStr, placeAnalysis, digitCompare, compareHtml } from '../model.js'
import { READ, ROWS } from './constants.js'
import { compareData, fillSummary, calcHtml } from '../stellen.js'

const stellen = n => `${n} ${n === 1 ? 'Stelle' : 'Stellen'}`
// Taschenrechner-Wert: exakt, wenn er kurz ist (19,83 / 2), sonst gekürzt mit „…"
const raw = x => Math.abs(Math.round(x * 1e4) / 1e4 - x) < 1e-9 ? exactStr(x) : `${fmt(x, 4)}…`
// Intervall eines Messwerts: Grenzen eine Stelle feiner als die Ablesung
const iv = m => `[${fmt(m.lo, m.decimals + 1)} ; ${fmt(m.hi, m.decimals + 1)})`

// Zeilen A, B, Kombination
export const ROW = ROWS.map(([sk, tk]) => {
  const e = speedExample(READ[sk], READ[tk])
  const info = placeAnalysis(e.rounded, e.v.lo, e.v.hi, e.v.value)
  const vDec = Math.max(0, -info.pLast) + 1
  return {
    e, info,
    s: `${e.s.text} m`, t: `${e.t.text} s`, v: `${e.rounded} m/s`,
    sIv: `${iv(e.s)} m`, tIv: `${iv(e.t)} s`,
    vIv: `[${fmt(e.v.lo, vDec)} ; ${fmt(e.v.hi, vDec)}) m/s`,
    raw: raw(e.v.value), lo: fmt(e.v.lo, vDec), hi: fmt(e.v.hi, vDec),
    // Ziffernvergleich v_min / v_max (Folien, wie in der Multiplikation)
    ...(c => ({ loH: compareHtml(c.lo), hiH: compareHtml(c.hi) }))(digitCompare(fmt(e.v.lo, vDec), fmt(e.v.hi, vDec))),
    sLo: fmt(e.s.lo, e.s.decimals + 1), sHi: fmt(e.s.hi, e.s.decimals + 1),
    tLo: fmt(e.t.lo, e.t.decimals + 1), tHi: fmt(e.t.hi, e.t.decimals + 1),
    sigS: stellen(e.s.sig), sigT: stellen(e.t.sig), sig: stellen(e.sig),
  }
})

// Vergleichstafeln v_max · Rechner · v_min (vier Nachkommastellen, bündig)
export const CMP = ROW.map(({ e }) => compareData({
  lo: fmt(e.v.lo, 4), val: fmt(e.v.value, 4), hi: fmt(e.v.hi, 4),
  sym: 'v', mid: 'Rechner', unit: 'm/s', rounded: e.rounded,
}))

// Zusammenfassung: alle drei Rechnungen
export const SUMMARY = ROW.map(({ e }, i) => [
  `${e.s.text} m / ${e.t.text} s`, `${e.s.sig} und ${e.t.sig}`, `${CMP[i].pos}. Stelle`, `${e.rounded} m/s (${stellen(e.sig)})`,
])

// Person A: alle vier Kombinationen der Grenzen (Reihenfolge der Liste = Reihenfolge
// der Treffer), je Farbe P1…P4, Wert und Rang nach Größe (FSS9 o)
const eA = ROW[0].e
export const COMBOS = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([ks, kt], i) => {
  const s = ks ? eA.s.hi : eA.s.lo, t = kt ? eA.t.hi : eA.t.lo
  return { i, ks, kt, v: s / t,
    text: `${fmt(s, eA.s.decimals + 1)} m / ${fmt(t, eA.t.decimals + 1)} s = ${fmt(s / t, 4)}… m/s` }
})
const byV = [...COMBOS].sort((p, q) => p.v - q.v)
COMBOS.forEach(c => { c.rank = byV.indexOf(c) })
const RANK_TAG = ['kleinstes v', 'dazwischen', 'dazwischen', 'größtes v']

export const SPD = {}
ROW.forEach((r, i) => {
  const p = 'abc'[i]
  for (const f of ['raw', 'lo', 'hi', 'loH', 'hiH', 'v', 'sigS', 'sigT', 'sig']) SPD[p + f[0].toUpperCase() + f.slice(1)] = r[f]
})

export function fillSpeedCards(DOM) {
  fillSummary(DOM.cards.v_sum, SUMMARY)
  DOM.cards.v_combo.querySelectorAll('.corner-row').forEach((row, i) => {
    row.querySelector('.c-val').innerHTML = calcHtml(COMBOS[i].text)
    row.querySelector('.c-tag').textContent = RANK_TAG[COMBOS[i].rank]
    row.style.setProperty('--slot', i)
  })
  for (const el of DOM.dyn) {
    const [grp, field] = el.dataset.dyn.split('.')
    // Felder mit Endung „H" sind vorberechnetes HTML aus model.js (Ziffern-Spans)
    if (grp === 'spd') el[field.endsWith('H') ? 'innerHTML' : 'textContent'] = SPD[field]
  }
}
