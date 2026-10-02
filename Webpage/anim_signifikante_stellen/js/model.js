'use strict'
// Modell: Rundungsintervalle und signifikante Stellen — reine, DOM-freie
// Funktionen (Vitest: test/signifikante_stellen.model.test.js). Jede auf der
// Bühne oder in einer Folie angezeigte Zahl wird hier berechnet.
//
// Konvention: Ein Messwert wie „3,00" steht für das halboffene Rundungs-
// intervall [3,00 − ½·10⁻², 3,00 + ½·10⁻²) = [2,995 ; 3,005).

import { fmt } from '../../shared/js/format.js'

// Signifikante Stellen einer Dezimalangabe: alle Ziffern ab der ersten von
// Null verschiedenen („3,000" → 4, „0,05" → 1, „2,9" → 2).
export function sigFigs(text) {
  return String(text).replace(/[^0-9]/g, '').replace(/^0+/, '').length
}

// „3,00" → { text, value 3, decimals 2, lo 2.995, hi 3.005, width 0.01, sig 3 }
export function parseMeasured(text) {
  const s = String(text).trim().replace(',', '.')
  const value = Number(s)
  const dot = s.indexOf('.')
  const decimals = dot < 0 ? 0 : s.length - dot - 1
  const width = 10 ** -decimals
  return { text, value, decimals, width, lo: value - width / 2, hi: value + width / 2, sig: sigFigs(text) }
}

// Produkt zweier positiver Messwerte: kleinstes/größtes mögliches Produkt.
export function productInterval(a, b) {
  return { value: a.value * b.value, lo: a.lo * b.lo, hi: a.hi * b.hi }
}

// Exakte Dezimaldarstellung ohne Gleitkomma-Rauschen und ohne Endnullen
// (2,9995·1,9995 → „5,99750025" — so wie es der Taschenrechner zeigt).
export function exactStr(x) {
  return fmt(x, 10).replace(/0+$/, '').replace(/,$/, '')
}

// Auf n signifikante Stellen gerundet, mit passender Stellenzahl
// (6 → „6,000" bei n = 4; 8,7 → „8,7" bei n = 2). Hat die Zahl mehr Vorkomma-
// stellen als n, wird in Zehnerpotenz-Schreibweise gerundet (18,85 bei n = 1 →
// „2 · 10¹"), sonst täuschte „19" eine zweite gesicherte Stelle vor.
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
export function formatSig(x, n) {
  // erst runden, dann die Größenordnung bestimmen (9,9 auf 1 Stelle → 10 → „1 · 10¹")
  const r = Number(x.toPrecision(n))
  const e = Math.floor(Math.log10(Math.abs(r)))
  if (e + 1 > n) {
    const exp = String(e).split('').map(c => SUP[+c]).join('')
    return `${fmt(r / 10 ** e, n - 1)} · 10${exp}`
  }
  return fmt(r, Math.max(0, n - 1 - e))
}

// Komplettes Rechenbeispiel l · b für Folien und Bühne.
export function areaExample(lText, bText) {
  const l = parseMeasured(lText), b = parseMeasured(bText)
  const A = productInterval(l, b)
  const sig = Math.min(l.sig, b.sig)
  return {
    l, b, A, sig,
    valueStr: exactStr(A.value), loStr: exactStr(A.lo), hiStr: exactStr(A.hi),
    rounded: formatSig(A.value, sig),
  }
}

// Kreis mit gemessenem Radius: Umfang U = 2·π·r und Fläche A = π·r².
// 2, π und der Exponent 2 sind exakt (unendlich viele Stellen), nur r begrenzt
// die Genauigkeit → U und A erhalten die Stellenzahl von r.
export function circleExample(rText) {
  const r = parseMeasured(rText)
  const U = x => 2 * Math.PI * x, A = x => Math.PI * x * x
  const part = f => ({
    value: f(r.value), lo: f(r.lo), hi: f(r.hi), rounded: formatSig(f(r.value), r.sig),
  })
  return { r, sig: r.sig, U: part(U), A: part(A) }
}

// Quotient zweier positiver Messwerte: kleinster Wert = kleinster Zähler durch
// größten Nenner, größter Wert = größter Zähler durch kleinsten Nenner.
export function quotientInterval(a, b) {
  return { value: a.value / b.value, lo: a.lo / b.hi, hi: a.hi / b.lo }
}

// Durchschnittsgeschwindigkeit v = s / t aus zwei Messwerten (Kapitel „Division").
export function speedExample(sText, tText) {
  const s = parseMeasured(sText), t = parseMeasured(tText)
  const v = quotientInterval(s, t)
  const sig = Math.min(s.sig, t.sig)
  return { s, t, v, sig, rounded: formatSig(v.value, sig) }
}

// ── Stellenanalyse eines gerundeten Ergebnisses ──────────────────────────────
// Welche Ziffer ist gesichert, welche unsicher, welche bedeutungslos? Nach der
// Faustregel ist die letzte hingeschriebene Ziffer unsicher, alle davor gesichert,
// jede weitere wäre bedeutungslos. Das Intervall [lo, hi) zeigt es: gemessen in
// Einheiten der jeweiligen Stelle ist es davor nur ein Bruchteil einer Einheit
// breit, in der letzten Stelle etwa eine oder mehrere, danach ein Vielfaches.
const PLACE_NAMES = { 3: 'Tausender', 2: 'Hunderter', 1: 'Zehner', 0: 'Einer', '-1': 'Zehntel',
  '-2': 'Hundertstel', '-3': 'Tausendstel', '-4': 'Zehntausendstel', '-5': 'Hunderttausendstel' }
export const placeName = p => PLACE_NAMES[p] ?? `10^${p}`

// Verhältnis kompakt: 0,5 · 5,0 · 50
export function ratioStr(r) {
  if (r >= 10) return String(Math.round(r))
  if (r >= 1) return fmt(r, 1)
  const q = Number(r.toPrecision(1))
  return fmt(q, -Math.floor(Math.log10(q)))
}

export function placeAnalysis(text, lo, hi) {
  const m = String(text).match(/^(\d+(?:,\d+)?)(?: · 10([⁰¹²³⁴⁵⁶⁷⁸⁹]+))?$/)
  if (!m) throw new Error(`Ergebnis „${text}" nicht lesbar`)
  const mant = m[1], sci = !!m[2]
  const e = sci ? Number([...m[2]].map(c => SUP.indexOf(c)).join('')) : 0
  const [ip, fp = ''] = mant.split(',')
  const digits = [...ip].map((ch, i) => ({ ch, p: e + ip.length - 1 - i }))
    .concat([...fp].map((ch, i) => ({ ch, p: e - 1 - i })))
  const pLast = digits.at(-1).p
  const R = Number(mant.replace(',', '.')) * 10 ** e
  const cat = p => (p > pLast ? 'sure' : p === pLast ? 'unc' : 'ghost')
  const places = digits.map(d => d.p).concat(pLast - 1).map(p => {
    const ratio = (hi - lo) / 10 ** p
    return { p, cat: cat(p), name: placeName(p), ratio, ratioText: ratioStr(ratio) }
  })
  return { text, R, lo, hi, digits, pLast, sci, e, places }
}
