'use strict'
// Tabellen für die dynamischen Zahlen in den Folienkarten (<span data-dyn="gruppe.feld">).
// Die Szene wählt per Index (S.lvl, S.cmb) eine Zeile; render.js schreibt sie
// ins DOM. Alle Werte stammen aus model.js — nichts ist hart kodiert.

import { fmt } from '../../shared/js/format.js'
import { parseMeasured, areaExample, exactStr, circleExample, placeAnalysis, placeName } from './model.js'
import { rowLayout, suffixOf } from './stellen.js'
import {
  L_LEVELS, B_FINAL, RETURN_PATH, MIXES, LEVEL_UNITS, RODS_LEVEL, R_TEXTS,
} from './constants.js'

const stellen = n => `${n} ${n === 1 ? 'Stelle' : 'Stellen'}`
const iv = m => `[${fmt(m.lo, m.decimals + 1)} ; ${fmt(m.hi, m.decimals + 1)})`
const len = x => exactStr(x)

export const LEVELS = L_LEVELS.map((text, k) => {
  const m = parseMeasured(text)
  const [r1, r2] = RODS_LEVEL[k].slice(-2)
  return {
    text, unit: LEVEL_UNITS[k], iv: iv(m),
    lo: fmt(m.lo, k + 1), hi: fmt(m.hi, k + 1), width: exactStr(m.width),
    half: exactStr(m.width / 2), place: k ? `${placeName(-k)}stelle` : 'Einerstelle',
    prev: ['', 'Einerstelle', 'Zehntelstelle', 'Hundertstelstelle'][k],
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

const bnd = (m, x) => fmt(x, m.decimals + 1)
export const RANGES = EXAMPLES.map(([kicker, [lt, bt]]) => {
  const ex = areaExample(lt, bt)
  return {
    kicker, l: lt, b: bt, lIv: iv(ex.l), bIv: iv(ex.b),
    lLo: bnd(ex.l, ex.l.lo), lHi: bnd(ex.l, ex.l.hi), bLo: bnd(ex.b, ex.b.lo), bHi: bnd(ex.b, ex.b.hi),
    Alo: ex.loStr, Ahi: ex.hiStr,
    AIv: `[${ex.loStr} ; ${ex.hiStr})`, valueStr: ex.valueStr, rounded: ex.rounded,
    lSig: stellen(ex.l.sig), bSig: stellen(ex.b.sig), sig: stellen(ex.sig),
  }
})

const civ = p => `[${fmt(p.lo, 2)} ; ${fmt(p.hi, 2)})`
export const CIRC = R_TEXTS.map(rt => {
  const c = circleExample(rt)
  return {
    kicker: { '3,0': 'Kreis · zwei signifikante Stellen', '3': 'Kreis · nur eine Stelle' }[rt],
    r: rt, rIv: iv(c.r), sig: stellen(c.sig),
    UIv: civ(c.U), U: c.U.rounded, AIv: civ(c.A), A: c.A.rounded,
    rLo: fmt(c.r.lo, c.r.decimals + 1), rHi: fmt(c.r.hi, c.r.decimals + 1),
    Ulo: fmt(c.U.lo, 2), Uhi: fmt(c.U.hi, 2), Alo: fmt(c.A.lo, 2), Ahi: fmt(c.A.hi, 2),
  }
})

// „Welche Stelle ist unsicher?": Ergebnisse in Schrittreihenfolge —
// 0 … 5 Flächen (wie RANGES), 6/7 Kreis r = 3,0 (U, A), 8/9 Kreis r = 3 (U, A)
const lupe = (text, lo, hi, unit) => {
  const info = placeAnalysis(text, lo, hi)
  return { info, layout: rowLayout(info), suffix: suffixOf(info, unit) }
}
export const LUPE = [
  ...EXAMPLES.map(([, [lt, bt]]) => { const ex = areaExample(lt, bt); return lupe(ex.rounded, ex.A.lo, ex.A.hi, 'm²') }),
  ...R_TEXTS.flatMap(rt => {
    const c = circleExample(rt)
    return [lupe(c.U.rounded, c.U.lo, c.U.hi, 'm'), lupe(c.A.rounded, c.A.lo, c.A.hi, 'm²')]
  }),
]
export const LUPE_CIRCLE = EXAMPLES.length

export const DYN = { lvl: LEVELS, cmb: RANGES, circ: CIRC }
