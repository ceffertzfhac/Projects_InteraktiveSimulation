'use strict'
// „Welche Stelle ist unsicher?" — gemeinsame Bausteine beider Kapitel.
// Ziffernzeile (Ziffern nach Kategorie gefärbt: gesichert / unsicher / bedeutungslos,
// Zeiger auf die gerade betrachtete Stelle, Geisterziffer „?", Einheit) und die
// Klammer „1 Einheit dieser Stelle" auf einer Zahlengeraden. Daten: model.js
// placeAnalysis(). Alles liest nur Zahlen aus der Szene (Reversibilitäts-Regel).
//
// Szene-Schlüssel (stellenKeys): slA Deckkraft, slI Ergebnis-Index, slP Stelle
// (stetig, für den Zoom), slD Stelle (diskret, für Zeiger/Klammer/Text), slB Klammer,
// slV Zeiger+Urteil, slC bis zu welcher Stelle schon eingefärbt, slG Geisterziffer,
// slS Einheit/Endform.

import { svgEl, clamp } from '../../shared/js/step-kit.js'

export const stellenKeys = () => ({
  slA: 0, slI: 0, slP: 0, slD: 0, slB: 0, slV: 0, slC: 99, slG: 1, slS: 0,
})

const CAT_WORD = { sure: 'gesichert', unc: 'unsicher', ghost: 'bedeutungslos' }
const op = (el, a) => { el.style.opacity = a; el.style.display = a <= 0.002 ? 'none' : '' }

// Urteil zur Stelle: „Zehntel: Intervall 5,0 Zehntel breit → unsicher"
export function verdict(info, p) {
  const pl = info.places.find(q => q.p === p)
  return pl ? `${pl.name}: Intervall ${pl.ratioText} ${pl.name} breit → ${CAT_WORD[pl.cat]}` : ''
}

// Zeichen der Zeile: Ziffern, Komma, Geisterziffer — mit Spalte und Stelle
export function rowLayout(info) {
  const cells = []
  const commaAfter = info.sci ? info.e : 0
  const all = info.digits.concat({ ch: '?', p: info.pLast - 1, ghost: true })
  all.forEach((d, i) => {
    cells.push({ ...d })
    const next = all[i + 1]
    if (next && d.p === commaAfter && next.p < commaAfter && !(info.sci && next.ghost)) {
      cells.push({ ch: ',', comma: true, ghost: next.ghost })
    }
  })
  cells.forEach((c, i) => { c.col = i })
  return cells
}

export function suffixOf(info, unit) {
  if (!info.sci) return `\u00a0${unit}`        // geschütztes Leerzeichen (SVG kürzt führende)
  const sup = '⁰¹²³⁴⁵⁶⁷⁸⁹'
  return `\u00a0· 10${String(info.e).split('').map(c => sup[+c]).join('')} ${unit}`
}

// Ziffernzeile in Monospace. size = Schriftgröße; Zeichenbreite 0,6 em.
export function createDigitRow(parent, { size = 40 } = {}) {
  const g = svgEl('g', { class: 'digit-row' }, parent)
  const box = svgEl('rect', { class: 'dg-pointer', rx: 6 }, g)
  const chars = Array.from({ length: 9 }, () => svgEl('text', { class: 'dg', 'text-anchor': 'middle', 'font-size': size }, g))
  const suffix = svgEl('text', { class: 'dg dg-suffix', 'font-size': size * 0.62 }, g)
  const cw = size * 0.6
  let lastKey = ''
  return {
    // x = linker Rand, y = Grundlinie; colorFrom: Ziffern mit p ≥ colorFrom tragen ihre Farbe
    render(info, layout, { x, y, alpha, pointerP, pointerA, colorFrom, ghostA, suffixA, suffixText }) {
      op(g, alpha)
      if (alpha <= 0.002) return
      const key = `${info.text}|${x}|${y}`
      if (key !== lastKey) {
        lastKey = key
        chars.forEach((t, i) => {
          const c = layout[i]
          t.style.display = c ? '' : 'none'
          if (!c) return
          t.textContent = c.ch
          t.setAttribute('x', x + (c.col + 0.5) * cw); t.setAttribute('y', y)
        })
      }
      layout.forEach((c, i) => {
        const t = chars[i]
        const cat = c.ghost ? 'ghost' : c.comma ? 'comma' : c.p > info.pLast ? 'sure' : 'unc'
        const colored = c.ghost || (!c.comma && c.p >= colorFrom)
        t.setAttribute('class', `dg dg-${colored ? cat : 'plain'}`)
        t.style.opacity = c.ghost ? ghostA : 1
      })
      const last = layout.filter(c => !c.ghost).at(-1)
      suffix.setAttribute('x', x + (last.col + 1) * cw); suffix.setAttribute('y', y)
      suffix.textContent = suffixText
      op(suffix, suffixA)
      const cur = layout.find(c => !c.comma && c.p === pointerP)
      if (cur) {
        box.setAttribute('x', x + cur.col * cw - 3); box.setAttribute('y', y - size * 0.86)
        box.setAttribute('width', cw + 6); box.setAttribute('height', size * 1.08)
      }
      op(box, cur ? pointerA : 0)
    },
  }
}

// Klammer „1 Einheit der Stelle p" um das Ergebnis R auf einer Zahlengeraden V
// (y0..y1 Bildschirm), Beschriftung oberhalb.
export function createUnitBracket(parent) {
  const g = svgEl('g', { class: 'unit-bracket' }, parent)
  const rect = svgEl('rect', { rx: 3 }, g)
  const label = svgEl('text', { 'text-anchor': 'middle' }, g)
  return {
    render(V, { R, p, y0, y1, alpha, text }) {
      op(g, alpha)
      if (alpha <= 0.002) return
      const u = 10 ** p
      const a = clamp(V.sx(R - u / 2), V.L - 6, V.R + 6), b = clamp(V.sx(R + u / 2), V.L - 6, V.R + 6)
      rect.setAttribute('x', a); rect.setAttribute('width', Math.max(0, b - a))
      rect.setAttribute('y', y0); rect.setAttribute('height', y1 - y0)
      // Beschriftung rechts neben der Klammer (oben bleibt Platz für Ergebnis-Marken)
      const right = b + 8 < V.R - 70
      label.setAttribute('text-anchor', right ? 'start' : 'end')
      label.setAttribute('x', right ? b + 8 : a - 8); label.setAttribute('y', (y0 + y1) / 2 + 5)
      label.textContent = text
    },
  }
}

// Build-Zeit: Stellen eines Ergebnisses nacheinander betrachten.
// zoom(tl, p) bewegt die jeweilige Zahlengerade auf die Stelle p (Kapitel-spezifisch).
// full = alle Stellen ab der ersten Ziffer, sonst nur: davor, letzte, danach.
export function scanPlaces(tl, S, info, idx, { full, zoom, hold = 1.1, at }) {
  const ps = info.places.map(q => q.p)
  const list = full ? ps : ps.slice(-3)
  tl.set(S, { slI: idx, slC: 99, slG: 1, slS: 0, slB: 0, slV: 0, slD: list[0] }, at)
  tl.to(S, { slA: 1, duration: 0.4 })
  list.forEach((p, n) => {
    zoom(tl, p, n)
    tl.set(S, { slD: p })
    tl.to(S, { slB: 1, slV: 1, duration: 0.4 })
    tl.set(S, { slC: p })
    tl.to(S, { slV: 1, duration: hold })                 // Standzeit (Urteil lesen)
    if (n < list.length - 1) tl.to(S, { slB: 0, slV: 0, duration: 0.25 })
  })
  // Endform: Geisterziffer weg, Einheit (bzw. Zehnerpotenz) dran, zurück zur letzten Stelle
  tl.to(S, { slV: 0, slB: 0, slG: 0, duration: 0.4 })
  tl.set(S, { slD: info.pLast })
  zoom(tl, info.pLast, list.length)
  tl.to(S, { slS: 1, duration: 0.5 }, '<0.3')
}
