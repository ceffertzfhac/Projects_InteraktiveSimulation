'use strict'
// „Welche Stelle ist unsicher?" — gemeinsame Bausteine aller Kapitel.
// Angabe bis zur betrachteten Stelle (letzte Ziffer gefärbt: sicher / unsicher /
// sinnlos) und die Klammer auf einer Zahlengeraden: das Rundungsintervall der Angabe „bis zu dieser
// Stelle" (± ½ Einheit) — was die Angabe verspricht. Das Band daneben ist, was die
// Messung hergibt. Band passt in die Klammer → sicher; Band einige Klammern breit →
// unsicher (hier aufhören); Band vielfach breiter → sinnlos. Daten: model.js
// placeAnalysis(). Alles liest nur Zahlen aus der Szene (Reversibilitäts-Regel).
//
// Szene-Schlüssel (stellenKeys): slA Deckkraft, slI Ergebnis-Index, slP Stelle
// (stetig, für den Zoom), slD Stelle (diskret, für Angabe/Klammer/Text), slB Klammer,
// slV Urteil, slC bis zu welcher Stelle schon eingefärbt.

import { svgEl, clamp } from '../../shared/js/step-kit.js'
import { placeName, compareTriple } from './model.js'
import { fmt } from '../../shared/js/format.js'

export const stellenKeys = () => ({
  slA: 0, slI: 0, slP: 0, slD: 0, slB: 0, slV: 0, slC: 99,
})

// Index der unsicheren (letzten) Ziffer eines Werts: bei Zehnerpotenz-Schreibweise die
// letzte Ziffer der Mantisse („1 · 10¹ m/s" → die 1, nicht die 0 von 10)
export function uncIndex(str) {
  const k = str.indexOf(' · 10')
  return (k >= 0 ? str.slice(0, k) : str).search(/\d(?=\D*$)/)
}

export const CAT_WORD = { sure: 'sicher', unc: 'unsicher', ghost: 'sinnlos' }
const set = (el, attrs) => { for (const k in attrs) el.setAttribute(k, attrs[k]) }
const op = (el, a) => { el.style.opacity = a; el.style.display = a <= 0.002 ? 'none' : '' }

const placeOf = (info, p) => info.places.find(q => q.p === p)

// Urteil zur Angabe (sie steht darüber): Band gegen Klammer, als ganzzahliger Faktor
// des Breiteren — zu grob / passt / zu fein. „Sicher" sagt das Urteil bewußt nicht:
// „6,69" ist zu grob, und trotzdem ragt das Band über seine Klammer (Rundung!).
const VERDICT_TAIL = {
  sure: 'verschenkt Wissen',
  unc: 'letzte Ziffer unsicher ✓',
  ghost: 'sinnlos (Scheingenauigkeit)',
}
const factor = r => fmt(Number(r.toPrecision(1)), 0)
export function verdict(info, p) {
  const pl = placeOf(info, p)
  if (!pl) return ''
  return `${bandVsBracket(pl.ratio)} → ${VERDICT_TAIL[pl.cat]}`
}
// Verhältnis Band / Klammer als Faktor des Breiteren: „Klammer 10× breiter", „Band ≈ Klammer"
export const bandVsBracket = r => (r >= 0.8 && r <= 1.25 ? 'Band ≈ Klammer'
  : r < 1 ? `Klammer ${factor(1 / r)}× breiter` : `Band ${factor(r)}× breiter`)

// Klammer-Beschriftung: „„6,69" steht für [6,685 ; 6,695)"
export function claimLabel(info, p) {
  const pl = placeOf(info, p)
  return pl ? `„${pl.claim}" steht für ${pl.cIv}` : ''
}
// Klammer-Grenzen der Angabe bis zur Stelle p
export function claimRange(info, p) {
  const pl = placeOf(info, p)
  return pl ? { lo: pl.cLo, hi: pl.cHi } : { lo: info.R - 10 ** p / 2, hi: info.R + 10 ** p / 2 }
}

// Angabe „bis zur Stelle p" als Zeile (Monospace): „6,69 m²" — die letzte Ziffer
// trägt ihre Kategorie-Farbe (sicher / unsicher / sinnlos), sobald colored.
// Ersetzt die Zeile des Endergebnisses mit Zeiger: so passen Zahl, Klammer und
// Urteil immer zusammen (6,686 auf eine Stelle gerundet ist „7", nicht „6").
export function createClaimRow(parent, { size = 34, cls = '' } = {}) {
  const t = svgEl('text', { class: `dg claim-row ${cls}`, 'font-size': size }, parent)
  const head = svgEl('tspan', {}, t), last = svgEl('tspan', {}, t)
  const tail = svgEl('tspan', { class: 'dg-suffix', 'font-size': size * 0.62 }, t)
  let key = ''
  return {
    render(info, p, { x, y, alpha, colored, unit }) {
      op(t, alpha)
      if (alpha <= 0.002) return
      const pl = placeOf(info, p)
      if (!pl) return
      const k = `${pl.claim}|${colored}|${x}|${y}|${unit}`
      if (k === key) return
      key = k
      const [, mant, sci] = pl.claim.match(/^([\d,]+)(.*)$/)
      head.textContent = mant.slice(0, -1)
      last.textContent = mant.slice(-1)
      head.setAttribute('class', 'dg-sure')
      last.setAttribute('class', colored ? `dg-${pl.cat}` : 'dg-sure')
      tail.textContent = `${sci}\u00a0${unit}`
      t.setAttribute('x', x); t.setAttribute('y', y)
    },
  }
}

// Klammer [lo, hi) auf einer Zahlengeraden V (y0..y1 Bildschirm), Beschriftung
// daneben. Ohne lo/hi: 1 Einheit der Stelle p um R (Etiketten der Addition).
export function createUnitBracket(parent) {
  const g = svgEl('g', { class: 'unit-bracket' }, parent)
  const rect = svgEl('rect', { rx: 3 }, g)
  const label = svgEl('text', { 'text-anchor': 'middle' }, g)
  return {
    render(V, { R, p, lo, hi, y0, y1, alpha, text, above = false }) {
      op(g, alpha)
      if (alpha <= 0.002) return
      const u = 10 ** p
      if (lo === undefined) { lo = R - u / 2; hi = R + u / 2 }
      const a = clamp(V.sx(lo), V.L - 6, V.R + 6), b = clamp(V.sx(hi), V.L - 6, V.R + 6)
      rect.setAttribute('x', a); rect.setAttribute('width', Math.max(0, b - a))
      rect.setAttribute('y', y0); rect.setAttribute('height', y1 - y0)
      label.textContent = text
      if (above) {
        // über der Klammer, mittig, aber innerhalb der Zahlengeraden gehalten
        const w = label.getComputedTextLength?.() || 0
        label.setAttribute('text-anchor', 'middle')
        label.setAttribute('x', clamp((a + b) / 2, V.L + w / 2, V.R - w / 2))
        label.setAttribute('y', y0 - 9)
        return
      }
      // Beschriftung rechts neben der Klammer (oben bleibt Platz für Ergebnis-Marken)
      const right = b + 8 < V.R - 70
      label.setAttribute('text-anchor', right ? 'start' : 'end')
      label.setAttribute('x', right ? b + 8 : a - 8); label.setAttribute('y', (y0 + y1) / 2 + 5)
    },
  }
}

// Build-Zeit: Stellen eines Ergebnisses nacheinander betrachten.
// zoom(tl, p) bewegt die jeweilige Zahlengerade auf die Stelle p (Kapitel-spezifisch).
// full = alle Stellen ab der ersten Ziffer, sonst nur: davor, letzte, danach.
export function scanPlaces(tl, S, info, idx, { full, zoom, hold = 1.1, at }) {
  const ps = info.places.map(q => q.p)
  const list = full ? ps : ps.slice(-3)
  tl.set(S, { slI: idx, slC: 99, slB: 0, slV: 0, slD: list[0] }, at)
  tl.to(S, { slA: 1, duration: 0.4 })
  list.forEach((p, n) => {
    zoom(tl, p, n)
    tl.set(S, { slD: p })
    tl.to(S, { slB: 1, slV: 1, duration: 0.4 })
    tl.set(S, { slC: p })
    tl.to(S, { slV: 1, duration: hold })                 // Standzeit (Urteil lesen)
    if (n < list.length - 1) tl.to(S, { slB: 0, slV: 0, duration: 0.25 })
  })
  // Schluß: zurück zur letzten (unsicheren) Stelle — die richtige Angabe mit Klammer und Urteil
  tl.to(S, { slV: 0, slB: 0, duration: 0.4 })
  tl.set(S, { slD: info.pLast })
  zoom(tl, info.pLast, list.length)
  tl.to(S, { slB: 1, slV: 1, duration: 0.5 })
}

// ── Ziffernvergleich-Tafel: kleinstes / größtes Ergebnis (und Taschenrechner-Wert)
// untereinander, bündig nach Stellenwert. Daten: model.js digitCompare(). Ein
// Spaltenzeiger läuft von links nach rechts; Ziffern ab Stelle colorFrom tragen ihre
// Kategorie-Farbe (sicher / unsicher / sinnlos).
export const compareKeys = () => ({ dcA: 0, dcI: 0, dcP: 0, dcV: 0, dcC: 99, dcF: 0 })

// Daten einer Vergleichstafel: Maximum oben, Taschenrechner-Wert in der Mitte, Minimum
// unten (Strings mit Komma). result = Schlußzeile, z. B. „→ A = 6,686 m² (4. Stelle unsicher)".
const ORDINAL = ['1.', '2.', '3.', '4.', '5.', '6.']
export function compareData({ lo, val, hi, sym, mid, unit, rounded }) {
  const t = compareTriple(lo, val, hi)
  const first = t.hi.find(c => !c.comma && c.ch !== '0' && !c.implicit)?.p ?? t.top
  const result = `→ ${sym} = ${rounded} ${unit}: Unsicherheit auf der ${ORDINAL[first - t.pDiff] ?? '?'} Stelle`
  return {
    key: `${lo}|${val}|${hi}`, cmp: { pDiff: t.pDiff }, places: t.places, result, pos: first - t.pDiff + 1,
    rows: [{ sym, sub: 'max', cells: t.hi }, { sym: mid, sub: '', cells: t.val }, { sym, sub: 'min', cells: t.lo }],
  }
}

// Zusammenfassungs-Tabelle einer Folienkarte füllen: je Zeile <tr data-r="rN">, die
// Zeilen blendet das Drehbuch nacheinander ein (Inhalte reiner Text aus dem Modell).
// groups (optional): [{ label, n }] — Klammer mit Beschriftung links neben je n Zeilen
// (erscheint mit der ersten Zeile ihrer Gruppe), dünne Trennlinie zwischen den Gruppen
export function fillSummary(card, rows, groups) {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const head = {}
  let k = 0
  for (const g of groups ?? []) { head[k] = g; k += g.n }
  if (groups) card.querySelector('thead tr').insertAdjacentHTML('afterbegin', '<th class="grp-h"></th>')
  card.querySelector('tbody').innerHTML = rows.map((r, i) => {
    const g = head[i]
    const grp = g ? `<td class="grp" rowspan="${g.n}"><span class="grp-in"><span class="grp-lbl">${esc(g.label)}</span>`
      + '<span class="grp-brace"></span></span></td>' : ''
    return `<tr data-r="r${i}"${g && i ? ' class="grp-first"' : ''}>${grp}${r.map((c, n) => `<td class="sc${n}">${esc(c)}</td>`).join('')}</tr>`
  }).join('')
}
// Zusammenfassung als Vollfolie in zwei Schritten (PO 2026-10-07, FSS9 m):
// 1) Vergleich (Tabelle Zeile für Zeile) + Beobachtung, 2) Begründung + Regel
export const revealComparison = (tl, card, n, reveal) => {
  for (let i = 0; i < n; i++) reveal(tl, card, `r${i}`, i ? '>0.45' : '>0.3')
  reveal(tl, card, 'obs', '>0.9')
}
export const revealReason = (tl, card, reveal) => {
  reveal(tl, card, 'why', '>0.2')
  reveal(tl, card, 'concl', '>1.6')
}

// Build-Zeit: Spaltenzeiger von der höchsten Stelle bis eine hinter die erste
// abweichende; danach alles eingefärbt und die Schlußzeile mit dem Ergebnis.
export function compareScan(tl, S, D, idx, { at, hold = 0.9 } = {}) {
  const { pDiff } = D.cmp
  const list = D.places.filter(p => p >= pDiff - 1)
  tl.set(S, { dcI: idx, dcC: 99, dcV: 0, dcF: 0, dcP: list[0] }, at)
  tl.to(S, { dcA: 1, duration: 0.4 })
  list.forEach((p, n) => {
    if (n) tl.to(S, { dcV: 0, duration: 0.2 })
    tl.set(S, { dcP: p })
    tl.to(S, { dcV: 1, duration: 0.35 })
    tl.set(S, { dcC: p })
    tl.to(S, { dcV: 1, duration: p === pDiff ? 1.6 : hold })
  })
  tl.to(S, { dcV: 0, duration: 0.25 })
  tl.set(S, { dcC: -99, dcP: pDiff, dcF: 1 })          // alles eingefärbt, Ergebnis
  tl.to(S, { dcV: 1, duration: 0.4 })
}
export const compareLine = (S, D) =>
  (S.dcF > 0.5 ? D.result : compareVerdict(D.cmp, Math.round(S.dcP)))

const CMP_WORD = { sure: 'gleich → sicher', unc: 'verschieden → unsicher', ghost: 'dahinter: sinnlos' }
export const compareVerdict = (cmp, p) =>
  `${placeName(p)}: ${CMP_WORD[p > cmp.pDiff ? 'sure' : p === cmp.pDiff ? 'unc' : 'ghost']}`

export function createCompareBoard(parent, { size = 30, rows = 3 } = {}) {
  const g = svgEl('g', { class: 'cmp-board' }, parent)
  const box = svgEl('rect', { class: 'dg-pointer', rx: 6 }, g)
  const R = Array.from({ length: rows }, () => ({
    label: svgEl('text', { class: 'cmp-label', 'text-anchor': 'end' }, g),
    chars: Array.from({ length: 14 }, () => svgEl('text', { class: 'dg', 'text-anchor': 'middle', 'font-size': size }, g)),
  }))
  const cw = size * 0.6
  let lastKey = ''
  return {
    // data = { cmp, rows: [{ sym, sub, cells }] }; x = Spalte der höchsten Stelle
    render(data, { x, y, gap, alpha, p, pointerA, colorFrom }) {
      op(g, alpha)
      if (alpha <= 0.002) return
      const top = Math.max(...data.rows.flatMap(r => r.cells.filter(c => !c.comma).map(c => c.p)))
      const col = q => (top - q) + (q < 0 ? 1 : 0)
      const cx = q => x + (col(q) + 0.5) * cw
      const key = `${data.key}|${x}|${y}`
      R.forEach((row, i) => {
        const d = data.rows[i]
        op(row.label, d ? 1 : 0)
        row.chars.forEach((t, k) => {
          const c = d?.cells[k]
          t.style.display = c ? '' : 'none'
          if (!c) return
          if (key !== lastKey) {
            t.textContent = c.ch
            t.setAttribute('x', c.comma ? x + (top + 1.5) * cw : cx(c.p)); t.setAttribute('y', y + i * gap)
          }
          const on = !c.comma && c.p >= colorFrom
          t.setAttribute('class', `dg dg-${c.comma ? 'plain' : on ? c.cat : 'plain'}${c.implicit ? ' dg-implicit' : ''}`)
        })
        if (d && key !== lastKey) {
          row.label.textContent = ''
          svgEl('tspan', { class: 'sym' }, row.label).textContent = d.sym
          if (d.sub) svgEl('tspan', { dy: 6, 'font-size': '70%' }, row.label).textContent = d.sub
          else row.label.firstChild.setAttribute('class', 'cmp-mid')
          row.label.setAttribute('x', x - 14); row.label.setAttribute('y', y + i * gap)
        }
      })
      lastKey = key
      const n = data.rows.length
      set(box, { x: cx(p) - cw / 2 - 3, y: y - size * 0.86, width: cw + 6, height: (n - 1) * gap + size * 1.08 })
      op(box, pointerA)
    },
  }
}

// ── Taschenrechner mit Tipp-Animation (Multiplikation, Addition) ─────────────
// Die Eingabe „3,120 × 2,143 =" wird Taste für Taste getippt: Szene-Zahl t von 0
// bis 1 (Anteil der gedrückten Tasten). Die gerade gedrückte Taste sinkt ein und
// leuchtet; nach „=" zeigt das Display das Ergebnis. Reversibel: nur eine Zahl.
const CALC_KEYS = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', ',', '=', '+']
export const calcSeq = input => [...input.replace(/\s/g, '')]
export function createCalculator(parent, { x, y, w, h }) {
  const g = svgEl('g', { class: 'calc' }, parent)
  svgEl('rect', { class: 'calc-case', x, y, width: w, height: h, rx: 16 }, g)
  svgEl('rect', { class: 'lcd', x: x + 14, y: y + 16, width: w - 28, height: 74, rx: 6 }, g)
  const inT = svgEl('text', { class: 'calc-in', x: x + w - 22, y: y + 40, 'text-anchor': 'end' }, g)
  const outT = svgEl('text', { class: 'lcd-text calc-out', x: x + w - 22, y: y + 78, 'text-anchor': 'end' }, g)
  const kw = (w - 28 - 3 * 8) / 4, kh = (h - 112 - 3 * 8) / 4
  const keys = CALC_KEYS.map((k, i) => {
    const kx = x + 14 + (i % 4) * (kw + 8), ky = y + 104 + Math.floor(i / 4) * (kh + 8)
    const kg = svgEl('g', {}, g)
    const r = svgEl('rect', { class: `calc-key ${k === '=' ? 'calc-eq' : ''}`, x: kx, y: ky, width: kw, height: kh, rx: 5 }, kg)
    svgEl('text', { class: 'calc-key-t', x: kx + kw / 2, y: ky + kh / 2 + 6, 'text-anchor': 'middle' }, kg).textContent = k
    return { k, kg, r, cx: kx + kw / 2, cy: ky + kh / 2 }
  })
  return {
    render({ alpha, input, output, t }) {
      op(g, alpha)
      if (alpha <= 0.002) return
      // f = getippte Tasten (stetig); Taste k ist gedrückt, solange ihr Anteil in (0 ; 0,6) liegt
      const seq = calcSeq(input), n = seq.length, f = clamp(t, 0, 1) * n
      const k = Math.ceil(f - 1e-9), frac = f - (k - 1)
      const done = f >= n - 0.4                       // „=" gedrückt → Ergebnis
      let typed = '', c = 0
      for (const ch of input) { if (c >= k) break; typed += ch; if (!/\s/.test(ch)) c++ }
      inT.textContent = typed
      outT.textContent = done ? output : (typed.split(/[×+÷−]/).pop().trim() || '0')
      const cur = k > 0 && frac > 0 && frac < 0.6 ? seq[k - 1] : null
      keys.forEach(K => {
        const on = K.k === cur
        K.kg.setAttribute('transform', on ? `translate(${K.cx} ${K.cy}) scale(0.9) translate(${-K.cx} ${-K.cy})` : '')
        K.r.classList.toggle('pressed', on)
      })
    },
  }
}

// Kleines Taschenrechner-Symbol für die Taschenrechner-Zeilen der Folienkarten
// (currentColor → hell/dunkel automatisch); einmal beim Start eingesetzt
export const CALC_ICON = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
  <rect x="4" y="1.8" width="12" height="16.4" rx="2"/><rect x="6.3" y="4.2" width="7.4" height="3.6" rx=".6"/>
  ${[0, 1, 2].flatMap(r => [0, 1, 2].map(c =>
    `<circle cx="${7 + 3 * c}" cy="${10.8 + 2.9 * r}" r=".75" fill="currentColor" stroke="none"/>`)).join('')}</svg>`
// „3,1195 m · 2,1425 m = 6,68352875 m²“ → Rechnung, Ergebnis fett hervorgehoben (Ecken-Test, FSS14)
export const calcHtml = text => {
  const k = text.lastIndexOf(' = ')
  return `${text.slice(0, k)} = <b class="c-res">${text.slice(k + 3)}</b>`
}
export const fillCalcIcons = root => root.querySelectorAll('.calc-ico').forEach(el => { el.innerHTML = CALC_ICON })
