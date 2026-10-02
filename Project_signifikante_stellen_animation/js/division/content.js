'use strict'
// Kapitel „Division": alle angezeigten Zahlen aus model.js — Messprotokoll
// (Bühne) und dynamische Zahlen der Folienkarten (<span data-dyn="spd.feld">).
// Die Werte sind fest (keine Umschaltung), daher einmalig befüllt.

import { fmt } from '../../../shared/js/format.js'
import { speedExample, exactStr } from '../model.js'
import { READ, ROWS } from './constants.js'

const stellen = n => `${n} ${n === 1 ? 'Stelle' : 'Stellen'}`
// Taschenrechner-Wert: exakt, wenn er kurz ist (19,83 / 1), sonst gekürzt mit „…"
const raw = x => Math.abs(Math.round(x * 1e4) / 1e4 - x) < 1e-9 ? exactStr(x) : `${fmt(x, 2)}…`

// Zeilen A, B, A+B des Protokolls
export const ROW = ROWS.map(([sk, tk]) => {
  const e = speedExample(READ[sk], READ[tk])
  return {
    e, s: `${e.s.text} m`, t: `${e.t.text} s`, v: `${e.rounded} m/s`,
    raw: raw(e.v.value), lo: fmt(e.v.lo, 2), hi: fmt(e.v.hi, 2),
    sigS: stellen(e.s.sig), sigT: stellen(e.t.sig), sig: stellen(e.sig),
  }
})

export const SPD = {}
ROW.forEach((r, i) => {
  const p = 'abc'[i]
  for (const f of ['raw', 'lo', 'hi', 'v', 'sigS', 'sigT', 'sig']) SPD[p + f[0].toUpperCase() + f.slice(1)] = r[f]
})

export function fillSpeedCards(DOM) {
  for (const el of DOM.dyn) {
    const [grp, field] = el.dataset.dyn.split('.')
    if (grp === 'spd') el.textContent = SPD[field]
  }
}
