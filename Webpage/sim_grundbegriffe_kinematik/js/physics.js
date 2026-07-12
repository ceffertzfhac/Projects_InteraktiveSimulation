'use strict'

// ── Stateless-Berechnung ─────────────────────────────────────────────────────
// Die Bahnkurve x(t)/y(t) ist FEST (keine Funktionsvariante wählbar) — daher
// wird sie einmalig berechnet (computePath, unabhängig von tA/tB). Nur die
// von tA/tB abhängigen Größen (Punkte A/B, Abstand, Weglänge) werden bei
// jeder Reglerbewegung neu abgeleitet (deriveAB) — vermeidet das erneute
// Abtasten der 2000 Punkte bei jedem Slider-Tick (im Original unnötig
// wiederholt, hier vermieden — reine Effizienzverbesserung, keine
// Verhaltensänderung).

import { T_MIN, T_MAX, NUM_POINTS } from './constants.js'

function linspace(start, stop, num) {
  const arr = new Array(num)
  const step = (stop - start) / (num - 1)
  for (let i = 0; i < num; i++) arr[i] = start + step * i
  return arr
}

// Feste Bahnkurve (aus dem Original übernommen, unverändert)
function fx(t) { return t }
function fy(t) { return 0.5 * Math.sin(2 * t) + 0.5 * t }

export function computePath() {
  const t = linspace(T_MIN, T_MAX, NUM_POINTS)
  const x = t.map(fx)
  const y = t.map(fy)
  const cumulative_s = new Array(NUM_POINTS)
  cumulative_s[0] = 0
  for (let i = 1; i < NUM_POINTS; i++) {
    const dx = x[i] - x[i - 1]
    const dy = y[i] - y[i - 1]
    cumulative_s[i] = cumulative_s[i - 1] + Math.hypot(dx, dy)
  }
  const yMax = Math.max(...y)
  return { t, x, y, cumulative_s, yMax }
}

// Von tA/tB abhängige Größen: Stützpunkte A/B, Abstand (Luftlinie),
// Weglänge (tatsächlich zurückgelegter Bahnabschnitt).
export function deriveAB(path, tA, tB) {
  const indexA = path.t.findIndex(v => v >= tA)
  const indexB = path.t.findIndex(v => v >= tB)
  const x_A = path.x[indexA], y_A = path.y[indexA]
  const x_B = path.x[indexB], y_B = path.y[indexB]
  return {
    indexA, indexB, x_A, y_A, x_B, y_B,
    deltaS_mag: Math.hypot(x_B - x_A, y_B - y_A),
    s_AB_length: path.cumulative_s[indexB] - path.cumulative_s[indexA],
  }
}
