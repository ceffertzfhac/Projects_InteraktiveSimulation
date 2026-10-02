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
  const e = Math.floor(Math.log10(Math.abs(x)))
  if (e + 1 > n) {
    let m = x / 10 ** e, ee = e
    if (Math.abs(Number(m.toFixed(n - 1))) >= 10) { m /= 10; ee += 1 }
    const exp = String(ee).split('').map(c => SUP[+c]).join('')
    return `${fmt(m, n - 1)} · 10${exp}`
  }
  return fmt(x, Math.max(0, n - 1 - e))
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
