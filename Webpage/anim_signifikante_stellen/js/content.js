'use strict'
// Tabellen für die dynamischen Zahlen in den Folienkarten (<span data-dyn="gruppe.feld">).
// Die Szene wählt per Index (S.lvl, S.cmb) eine Zeile; render.js schreibt sie
// ins DOM. Alle Werte stammen aus model.js — nichts ist hart kodiert.

import { fmt } from '../../shared/js/format.js'
import {
  parseMeasured, areaExample, exactStr, circleExample, placeAnalysis, placeName, digitCompare, compareHtml,
} from './model.js'
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
  ...RETURN_PATH.map((p, j) => [`${['b gröber', 'beide grob'][j]} gemessen · ${j + 1} / ${RETURN_PATH.length}`, p]),
  ...MIXES.map((p, j) => [`Beispiel ${j + 1} / ${MIXES.length}`, p]),
]
export const CMB_FIRST_RETURN = 1
export const CMB_FIRST_MIX = 1 + RETURN_PATH.length

// „Die Unsicherheit liegt auf der vierten Stelle": Position der ersten abweichenden
// Ziffer, gezählt ab der ersten von Null verschiedenen Ziffer
const ORD = ['ersten', 'zweiten', 'dritten', 'vierten', 'fünften', 'sechsten']
const ordOf = cmp => {
  const first = cmp.hi.find(c => !c.comma && c.ch !== '0').p
  return ORD[first - cmp.pDiff]
}
const bnd = (m, x) => fmt(x, m.decimals + 1)
export const RANGES = EXAMPLES.map(([kicker, [lt, bt]]) => {
  const ex = areaExample(lt, bt)
  const cmp = digitCompare(ex.loStr, ex.hiStr)
  const dec = (ex.valueStr.split(',')[1] ?? '').length
  return {
    kicker, l: lt, b: bt, lIv: iv(ex.l), bIv: iv(ex.b),
    AloH: compareHtml(cmp.lo), AhiH: compareHtml(cmp.hi), uncOrd: ordOf(cmp),
    calcDec: `${dec} ${dec === 1 ? 'Nachkommastelle' : 'Nachkommastellen'}`,
    calcIn: `${lt} × ${bt} =`, calcOut: ex.valueStr,
    lLo: bnd(ex.l, ex.l.lo), lHi: bnd(ex.l, ex.l.hi), bLo: bnd(ex.b, ex.b.lo), bHi: bnd(ex.b, ex.b.hi),
    Alo: ex.loStr, Ahi: ex.hiStr,
    AIv: `[${ex.loStr} ; ${ex.hiStr})`, valueStr: ex.valueStr, rounded: ex.rounded,
    lSig: stellen(ex.l.sig), bSig: stellen(ex.b.sig), sig: stellen(ex.sig),
  }
})

const cmpH = (lo, hi) => { const c = digitCompare(lo, hi); return [compareHtml(c.lo), compareHtml(c.hi), ordOf(c)] }
const civ = p => `[${fmt(p.lo, 2)} ; ${fmt(p.hi, 2)})`
export const CIRC = R_TEXTS.map(rt => {
  const c = circleExample(rt)
  return {
    kicker: { '3,3': 'Kreis · zwei signifikante Stellen', '3': 'Kreis · nur eine Stelle' }[rt],
    r: rt, rIv: iv(c.r), sig: stellen(c.sig),
    UIv: civ(c.U), U: c.U.rounded, AIv: civ(c.A), A: c.A.rounded,
    rLo: fmt(c.r.lo, c.r.decimals + 1), rHi: fmt(c.r.hi, c.r.decimals + 1),
    UloH: cmpH(fmt(c.U.lo, 2), fmt(c.U.hi, 2))[0], UhiH: cmpH(fmt(c.U.lo, 2), fmt(c.U.hi, 2))[1],
    AloH: cmpH(fmt(c.A.lo, 2), fmt(c.A.hi, 2))[0], AhiH: cmpH(fmt(c.A.lo, 2), fmt(c.A.hi, 2))[1],
    UOrd: cmpH(fmt(c.U.lo, 2), fmt(c.U.hi, 2))[2], AOrd: cmpH(fmt(c.A.lo, 2), fmt(c.A.hi, 2))[2],
  }
})

// „Welche Stelle ist unsicher?": Ergebnisse in Schrittreihenfolge —
// 0 … 5 Flächen (wie RANGES), 6/7 Kreis r = 3,0 (U, A), 8/9 Kreis r = 3 (U, A)
const lupe = (text, lo, hi, value, unit) => {
  return { info: placeAnalysis(text, lo, hi, value), unit }
}
export const LUPE = [
  ...EXAMPLES.map(([, [lt, bt]]) => { const ex = areaExample(lt, bt); return lupe(ex.rounded, ex.A.lo, ex.A.hi, ex.A.value, 'm²') }),
  ...R_TEXTS.flatMap(rt => {
    const c = circleExample(rt)
    return [lupe(c.U.rounded, c.U.lo, c.U.hi, c.U.value, 'm'), lupe(c.A.rounded, c.A.lo, c.A.hi, c.A.value, 'm²')]
  }),
]
export const LUPE_CIRCLE = EXAMPLES.length

// Ziffernvergleich-Tafel (erstes Rechteck): A_max, A_min und der Taschenrechner-Wert
export const COMPARE = EXAMPLES.slice(0, 1).map(([, [lt, bt]]) => {
  const ex = areaExample(lt, bt), cmp = digitCompare(ex.loStr, ex.hiStr)
  const calc = digitCompare(ex.valueStr, ex.valueStr).lo
    .map(c => ({ ...c, cat: c.comma ? null : c.p > cmp.pDiff ? 'sure' : c.p === cmp.pDiff ? 'unc' : 'ghost' }))
  const places = [...new Set(cmp.hi.filter(c => !c.comma).map(c => c.p))]
  return {
    key: `${lt}|${bt}`, cmp, places, rounded: ex.rounded,
    rows: [{ sym: 'A', sub: 'max', cells: cmp.hi }, { sym: 'A', sub: 'min', cells: cmp.lo },
      { sym: 'l · b', sub: '', cells: calc }],
  }
})

export const DYN = { lvl: LEVELS, cmb: RANGES, circ: CIRC }
