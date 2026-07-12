'use strict'

/**
 * Einheitliche Zahlen-Formatierung für alle Simulationen (techn. Schuld T6).
 *
 * Deutsche Konvention: Komma als Dezimalzeichen, **kein** Tausender-
 * trennzeichen. Nicht-endliche Werte (NaN / ±Infinity) → '—' statt eines
 * 'NaN'-Strings in der UI (robuster Guard — alle Sims profitieren, auch
 * solche, die bisher keinen Guard hatten).
 *
 * Dies ist die kanonische „Projekt 2"-Variante (toFixed + '.' → ','). Die
 * frühere Lorentz-Variante (`toLocaleString('de-DE')`) erzeugte zusätzlich
 * einen Tausenderpunkt; der fällt zugunsten der einheitlichen toFixed-
 * Variante weg (s. CHANGELOG der jeweiligen Sim).
 *
 * @param {number} value    Zu formatierender Wert.
 * @param {number} decimals Nachkommastellen (Default 2).
 * @returns {string} Formatierte Zeichenkette mit Komma-Dezimaltrennzeichen.
 */
export function fmt(value, decimals = 2) {
  if (!Number.isFinite(value)) return '—'
  return value.toFixed(decimals).replace('.', ',')
}