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
// (6 → „6,000" bei n = 4; 8,7 → „8,7" bei n = 2). Für |x| ≥ 1 ausgelegt.
export function formatSig(x, n) {
  const decimals = Math.max(0, n - 1 - Math.floor(Math.log10(Math.abs(x))))
  return fmt(x, decimals)
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
