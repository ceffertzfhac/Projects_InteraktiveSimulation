'use strict'
// Modell: reine, DOM-freie Funktionen (testbar mit Vitest). Entspricht physics.js
// der interaktiven Sims — alle angezeigten Zahlen kommen von hier.

// „1,50" → { value: 1.5, decimals: 2, lo: 1.495, hi: 1.505 }
export function roundingInterval(text) {
  const s = String(text).trim().replace(',', '.')
  const value = Number(s)
  const dot = s.indexOf('.')
  const decimals = dot < 0 ? 0 : s.length - dot - 1
  const half = 0.5 * 10 ** -decimals
  return { value, decimals, lo: value - half, hi: value + half }
}
