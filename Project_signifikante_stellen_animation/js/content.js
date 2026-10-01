'use strict'
// Tabellen für die dynamischen Zahlen in den Folienkarten (<span data-dyn="gruppe.feld">).
// Die Szene wählt per Index (S.lvl, S.cmb) eine Zeile; render.js schreibt sie
// ins DOM. Alle Werte stammen aus model.js — nichts ist hart kodiert.

import { fmt } from '../../shared/js/format.js'
import { parseMeasured, areaExample, exactStr, circumference } from './model.js'
import { L_LEVELS, B_FINAL, RETURN_PATH, MIXES, LEVEL_UNITS, RODS_LEVEL, R_TEXT } from './constants.js'

const stellen = n => `${n} ${n === 1 ? 'Stelle' : 'Stellen'}`
const iv = m => `[${fmt(m.lo, m.decimals + 1)} ; ${fmt(m.hi, m.decimals + 1)})`
const len = x => exactStr(x)

export const LEVELS = L_LEVELS.map((text, k) => {
  const m = parseMeasured(text)
  const [r1, r2] = RODS_LEVEL[k].slice(-2)
  return {
    text, unit: LEVEL_UNITS[k], iv: iv(m),
    lo: fmt(m.lo, k + 1), hi: fmt(m.hi, k + 1), width: exactStr(m.width),
    rodA: len(r1), rodB: len(r2),
  }
})

const EXAMPLES = [
  ['Flächenbereich', [L_LEVELS[3], B_FINAL]],
  ...RETURN_PATH.map((p, j) => [`Rückweg · ${j + 1} / ${RETURN_PATH.length}`, p]),
  ...MIXES.map((p, j) => [`Beispiel ${j + 1} / ${MIXES.length}`, p]),
]
export const CMB_FIRST_RETURN = 1
export const CMB_FIRST_MIX = 1 + RETURN_PATH.length

export const RANGES = EXAMPLES.map(([kicker, [lt, bt]]) => {
  const ex = areaExample(lt, bt)
  return {
    kicker, l: lt, b: bt, lIv: iv(ex.l), bIv: iv(ex.b),
    AIv: `[${ex.loStr} ; ${ex.hiStr})`, valueStr: ex.valueStr, rounded: ex.rounded,
    lSig: stellen(ex.l.sig), bSig: stellen(ex.b.sig), sig: stellen(ex.sig),
  }
})

const C = circumference(R_TEXT)
export const CIRC = [{
  r: R_TEXT, rIv: iv(C.r), UIv: `[${fmt(C.lo, 3)} ; ${fmt(C.hi, 3)})`,
  value: fmt(C.value, 4), rounded: C.rounded, sig: stellen(C.sig),
}]

export const DYN = { lvl: LEVELS, cmb: RANGES, circ: CIRC }
