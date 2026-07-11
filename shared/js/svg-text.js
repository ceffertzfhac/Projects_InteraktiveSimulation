'use strict'

const SVGNS = 'http://www.w3.org/2000/svg'

/**
 * Achsenbeschriftung „Größe / Einheit" (T9): Symbol kursiv, Einheit aufrecht.
 * Fehlt der ` / `-Trenner (reines Symbol ohne Einheit, z. B. „φ"), wird der
 * gesamte Text kursiv gesetzt (kanonisch nach Ableitung-Sim — deckt sich mit
 * der Typografieregel „Variable Symbole immer kursiv", CLAUDE.md).
 */
export function setAxisLabel(textEl, text) {
  while (textEl.firstChild) textEl.removeChild(textEl.firstChild)
  const sep = text.indexOf(' / ')
  if (sep === -1) {
    const sym = document.createElementNS(SVGNS, 'tspan')
    sym.setAttribute('font-style', 'italic')
    sym.textContent = text
    textEl.appendChild(sym)
    return
  }
  const qty = document.createElementNS(SVGNS, 'tspan')
  qty.setAttribute('font-style', 'italic')
  qty.textContent = text.slice(0, sep)
  textEl.appendChild(qty)
  const unit = document.createElementNS(SVGNS, 'tspan')
  unit.textContent = text.slice(sep)
  textEl.appendChild(unit)
}

/**
 * Diagrammtitel „Wort Symbol(t)" (T9): führender Text aufrecht, das letzte
 * Wort (Formelausdruck) kursiv. Trennung am letzten Leerzeichen.
 */
export function setGraphTitle(textEl, text) {
  while (textEl.firstChild) textEl.removeChild(textEl.firstChild)
  const sep = text.lastIndexOf(' ')
  if (sep === -1) { textEl.textContent = text; return }
  const word = document.createElementNS(SVGNS, 'tspan')
  word.textContent = text.slice(0, sep + 1)
  textEl.appendChild(word)
  const sym = document.createElementNS(SVGNS, 'tspan')
  sym.setAttribute('font-style', 'italic')
  sym.textContent = text.slice(sep + 1)
  textEl.appendChild(sym)
}
