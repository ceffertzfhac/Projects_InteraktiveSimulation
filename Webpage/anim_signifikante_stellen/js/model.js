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

// Angabe „bis zur Stelle p": x auf 10^p gerundet, mit passender Schreibweise
// (6,686… bei p = −2 → „6,69"; 21,0… bei p = 1 → „2 · 10¹", nicht „20").
export function roundAtPlace(x, p) {
  const u = 10 ** p, r = Math.round(x / u) * u
  if (p <= 0 || r === 0) return { text: fmt(r, Math.max(0, -p)), value: r, lo: r - u / 2, hi: r + u / 2 }
  const e = Math.floor(Math.log10(Math.abs(r)))
  return { text: formatSig(r, e - p + 1), value: r, lo: r - u / 2, hi: r + u / 2 }
}

// value = Wert, um den die Angaben gerundet werden (Taschenrechner-Ergebnis);
// je Stelle: Angabe bis dorthin („claim"), ihr Rundungsintervall (die Klammer)
// und das Verhältnis Band / Klammer.
export function placeAnalysis(text, lo, hi, value = (lo + hi) / 2) {
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
    const c = roundAtPlace(value, p), dec = Math.max(0, 1 - p)
    return {
      p, cat: cat(p), name: placeName(p), ratio, ratioText: ratioStr(ratio),
      claim: c.text, cLo: c.lo, cHi: c.hi, cIv: `[${fmt(c.lo, dec)} ; ${fmt(c.hi, dec)})`,
    }
  })
  return { text, R, lo, hi, value, digits, pLast, sci, e, places }
}

// ── Ziffernvergleich (Schulmethode) ──────────────────────────────────────────
// Kleinstes und größtes Ergebnis Ziffer für Ziffer (nach Stellenwert bündig)
// vergleichen: gleiche Ziffern sind sicher, die erste abweichende ist die
// unsichere, alle dahinter sind sinnlos. Strings wie „6,68352875".
// Hinweis: An Übertragsgrenzen (9,97 / 10,02) versagt der Vergleich — die
// Beispiele der Animation sind so gewählt, daß er die Faustregel bestätigt.
function digitsOf(str) {
  const [ip, fp = ''] = String(str).split(',')
  return new Map([...ip].map((ch, i) => [ip.length - 1 - i, ch])
    .concat([...fp].map((ch, i) => [-1 - i, ch])))
}
export function digitCompare(loStr, hiStr) {
  const a = digitsOf(loStr), b = digitsOf(hiStr)
  const top = Math.max(...a.keys(), ...b.keys())
  let pDiff = -Infinity
  for (let p = top; p >= Math.min(...a.keys(), ...b.keys()); p--) {
    if ((a.get(p) ?? '0') !== (b.get(p) ?? '0')) { pDiff = p; break }
  }
  const cat = p => (p > pDiff ? 'sure' : p === pDiff ? 'unc' : 'ghost')
  // fehlende führende Stellen (7,9 gegen 13,2) als implizite „0" — sonst fehlte die
  // abweichende Zehnerziffer in der Zeile
  const row = str => {
    const [ip, fp = ''] = String(str).split(',')
    const pad = Array.from({ length: Math.max(0, top - (ip.length - 1)) }, (_, i) => ({ ch: '0', p: top - i, implicit: true }))
    const cells = pad.concat([...ip].map((ch, i) => ({ ch, p: ip.length - 1 - i })))
    if (fp) cells.push({ ch: ',', comma: true })
    return cells.concat([...fp].map((ch, i) => ({ ch, p: -1 - i })))
      .map(c => ({ ...c, cat: c.comma ? null : cat(c.p) }))
  }
  return { pDiff, lo: row(loStr), hi: row(hiStr) }
}

// Vergleichstafel: Maximum, Taschenrechner-Wert, Minimum — alle bündig nach Stellenwert
// (gemeinsame höchste Stelle, fehlende führende Ziffern als implizite „0"), Kategorie
// jeder Ziffer nach der ersten Abweichung von Minimum und Maximum.
export function compareTriple(loStr, valStr, hiStr) {
  const maps = [loStr, valStr, hiStr].map(digitsOf)
  const top = Math.max(...maps.flatMap(m => [...m.keys()]))
  const { pDiff } = digitCompare(loStr, hiStr)
  const cat = p => (p > pDiff ? 'sure' : p === pDiff ? 'unc' : 'ghost')
  const row = str => {
    const [ip, fp = ''] = String(str).split(',')
    const pad = Array.from({ length: Math.max(0, top - (ip.length - 1)) }, (_, i) => ({ ch: '0', p: top - i, implicit: true }))
    const cells = pad.concat([...ip].map((ch, i) => ({ ch, p: ip.length - 1 - i })))
    if (fp) cells.push({ ch: ',', comma: true })
    return cells.concat([...fp].map((ch, i) => ({ ch, p: -1 - i })))
      .map(c => ({ ...c, cat: c.comma ? null : cat(c.p) }))
  }
  const places = []
  for (let p = top; p >= Math.min(...maps.flatMap(m => [...m.keys()])); p--) places.push(p)
  return { pDiff, top, places, lo: row(loStr), val: row(valStr), hi: row(hiStr) }
}

// HTML für die Folienkarten: zusammenhängende Ziffern gleicher Kategorie als <span>;
// implizite führende Nullen blaß (eigener Span)
export function compareHtml(cells) {
  let html = '', curCat = null
  for (const c of cells) {
    if (c.implicit) {
      if (curCat) { html += '</span>'; curCat = null }
      html += `<span class="cmp-${c.cat} cmp-implicit">${c.ch}</span>`
      continue
    }
    const k = c.comma ? curCat : c.cat
    if (k !== curCat) {
      if (curCat) html += '</span>'
      html += `<span class="cmp-${k}">`
      curCat = k
    }
    html += c.ch
  }
  return html + '</span>'
}

// ── Addition (Kapitel „Addition") ────────────────────────────────────────────
// Summe zweier Messwerte (gleiche Einheit): Grenzen kleinste + kleinste und
// größte + größte; die Unsicherheiten addieren sich absolut. Regel: das Ergebnis
// endet beim Stellenwert des gröbsten Summanden (so viele Nachkommastellen wie
// der Summand mit den wenigsten). Zum Vergleich die — hier falsche — Faustregel
// der Multiplikation (Stellenzahl des ungenauesten Faktors).
export function sumExample(aText, bText) {
  const a = parseMeasured(aText), b = parseMeasured(bText)
  const value = a.value + b.value, lo = a.lo + b.lo, hi = a.hi + b.hi
  const decimals = Math.min(a.decimals, b.decimals)
  return {
    a, b, value, lo, hi, decimals, half: (hi - lo) / 2,
    rounded: fmt(value, decimals),
    sigRule: formatSig(value, Math.min(a.sig, b.sig)),
  }
}
