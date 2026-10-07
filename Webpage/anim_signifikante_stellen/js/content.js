'use strict'
// Tabellen für die dynamischen Zahlen in den Folienkarten (<span data-dyn="gruppe.feld">).
// Die Szene wählt per Index (S.lvl, S.cmb) eine Zeile; render.js schreibt sie
// ins DOM. Alle Werte stammen aus model.js — nichts ist hart kodiert.

import { fmt } from '../../shared/js/format.js'
import {
  parseMeasured, areaExample, exactStr, circleExample, placeAnalysis, placeName, digitCompare, compareHtml,
} from './model.js'
import { compareData } from './stellen.js'
import {
  L_LEVELS, B_FINAL, RETURN_PATH, MIXES, LEVEL_UNITS, RODS_LEVEL, R_TEXTS, LEVEL_SIDE,
} from './constants.js'

const stellen = n => `${n} ${n === 1 ? 'Stelle' : 'Stellen'}`
const iv = m => `[${fmt(m.lo, m.decimals + 1)} ; ${fmt(m.hi, m.decimals + 1)})`
const len = x => exactStr(x)

// Index 0…3 = Stufen 3 / 3,1 / 3,12 / 3,120, Index 4 = Zwischenstufe 3,13 (FSS10).
// head: Zusatz der Überschrift — beim Zoom „zehnmal genauer", bei der Seitwärtsfahrt nicht.
const level = (text, k, rods, head) => {
  const m = parseMeasured(text)
  const [r1, r2] = rods.slice(-2)
  return {
    text, head, unit: LEVEL_UNITS[k], iv: iv(m),
    lo: fmt(m.lo, k + 1), hi: fmt(m.hi, k + 1), width: exactStr(m.width),
    half: exactStr(m.width / 2), place: k ? `${placeName(-k)}stelle` : 'Einerstelle',
    prev: ['', 'Einerstelle', 'Zehntelstelle', 'Hundertstelstelle'][k],
    rodA: len(r1), rodB: len(r2),
  }
}
export const LEVELS = L_LEVELS.map((text, k) => level(text, k, RODS_LEVEL[k], ' – zehnmal genauer'))
  .concat([level(LEVEL_SIDE.text, LEVEL_SIDE.k, LEVEL_SIDE.rods, ' – zehnmal genauer')])
LEVELS[2].head = ' – gleiche Teilung, unsere Stäbe'
export const LEVEL_SIDE_IDX = 4

const EXAMPLES = [
  ['Flächenbereich', [L_LEVELS[3], B_FINAL]],
  ...RETURN_PATH.map((p, j) => [`${['b gröber', 'beide grob', 'beide grob'][j]} gemessen · ${j + 1} / ${RETURN_PATH.length}`, p]),
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
    calcEq: `${lt} m · ${bt} m = ${ex.valueStr} m²`,          // Taschenrechner-Zeile der Folien
    lLo: bnd(ex.l, ex.l.lo), lHi: bnd(ex.l, ex.l.hi), bLo: bnd(ex.b, ex.b.lo), bHi: bnd(ex.b, ex.b.hi),
    Alo: ex.loStr, Ahi: ex.hiStr,
    AIv: `[${ex.loStr} ; ${ex.hiStr})`, valueStr: ex.valueStr, rounded: ex.rounded,
    lSig: stellen(ex.l.sig), bSig: stellen(ex.b.sig), sig: stellen(ex.sig),
  }
})

const cmpH = (lo, hi) => { const c = digitCompare(lo, hi); return [compareHtml(c.lo), compareHtml(c.hi), ordOf(c)] }
const civ = p => `[${fmt(p.lo, 2)} ; ${fmt(p.hi, 2)})`
const calc4 = x => `${fmt(x, 4)}…`                            // Taschenrechner, gekürzt
export const CIRC = R_TEXTS.map(rt => {
  const c = circleExample(rt)
  return {
    kicker: { '3,3': 'Kreis · zwei signifikante Stellen', '3': 'Kreis · nur eine Stelle' }[rt],
    r: rt, rIv: iv(c.r), sig: stellen(c.sig),
    UIv: civ(c.U), U: c.U.rounded, AIv: civ(c.A), A: c.A.rounded,
    UCalc: `2π · ${rt} m = ${calc4(c.U.value)} m`, ACalc: `π · (${rt} m)² = ${calc4(c.A.value)} m²`,
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

// Vergleichstafeln (Maximum · Rechner · Minimum) in Schrittreihenfolge, gleiche
// Indizes wie LUPE: Rechtecke, dann je Kreis U und A
export const COMPARE = [
  ...EXAMPLES.map(([, [lt, bt]]) => {
    const ex = areaExample(lt, bt)
    return compareData({ lo: ex.loStr, val: ex.valueStr, hi: ex.hiStr, sym: 'A', mid: 'Rechner', unit: 'm²', rounded: ex.rounded })
  }),
  ...R_TEXTS.flatMap(rt => {
    const c = circleExample(rt), f = x => fmt(x, 2)
    return [
      compareData({ lo: f(c.U.lo), val: f(c.U.value), hi: f(c.U.hi), sym: 'U', mid: 'Rechner', unit: 'm', rounded: c.U.rounded }),
      compareData({ lo: f(c.A.lo), val: f(c.A.value), hi: f(c.A.hi), sym: 'A', mid: 'Rechner', unit: 'm²', rounded: c.A.rounded }),
    ]
  }),
]

// Zusammenfassung: alle Ergebnisse des Kapitels (Rechnung · Stellen der Messwerte ·
// Ziffernvergleich · Ergebnis)
const STELLE = n => `${n}. Stelle`
export const SUMMARY = [
  ...EXAMPLES.map(([, [lt, bt]], i) => {
    const ex = areaExample(lt, bt)
    return [`${lt} m · ${bt} m`, `${ex.l.sig} und ${ex.b.sig}`, STELLE(COMPARE[i].pos), `${ex.rounded} m² (${stellen(ex.sig)})`]
  }),
  ...R_TEXTS.flatMap((rt, j) => {
    const c = circleExample(rt), k = EXAMPLES.length + 2 * j
    return [
      [`U = 2π · ${rt} m`, `${c.r.sig} (2, π exakt)`, STELLE(COMPARE[k].pos), `${c.U.rounded} m (${stellen(c.sig)})`],
      [`A = π · (${rt} m)²`, `${c.r.sig} (π, ² exakt)`, STELLE(COMPARE[k + 1].pos), `${c.A.rounded} m² (${stellen(c.sig)})`],
    ]
  }),
]

// Gruppen der Zusammenfassung: erst die Rechteckflächen, dann der Kreis (PO 2026-10-07, FSS16)
export const SUMMARY_GROUPS = [{ label: 'Rechteck', n: EXAMPLES.length }, { label: 'Kreis', n: 2 * R_TEXTS.length }]

// Ecken-Test (Multiplikation, „Grenzen der Fläche"): alle vier Ecken des Kreuzungsfelds
// in natürlicher Reihenfolge, je Farbe (Kategorialfarbe P1…P4), Produkt und Rang nach Größe
const exC = areaExample(L_LEVELS[3], B_FINAL)
const lb = m => [m.lo, m.hi]
export const CORNERS = [['min', 'min'], ['min', 'max'], ['max', 'min'], ['max', 'max']].map(([ls, bs], i) => {
  const l = lb(exC.l)[ls === 'max' ? 1 : 0], b = lb(exC.b)[bs === 'max' ? 1 : 0]
  return { i, ls, bs, l, b, A: l * b,
    text: `${bnd(exC.l, l)} m · ${bnd(exC.b, b)} m = ${exactStr(l * b)} m²` }
})
const byA = [...CORNERS].sort((p, q) => p.A - q.A)
CORNERS.forEach(c => { c.rank = byA.indexOf(c) })

export const DYN = { lvl: LEVELS, cmb: RANGES, circ: CIRC }
