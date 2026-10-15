'use strict'
// Modell: reine, DOM-freie Funktionen (testbar mit Vitest). Alle angezeigten Zahlen
// der Animation kommen von hier. Beispiel: Messung der Fallbeschleunigung g.

export const G_TRUE = 9.81        // „wahrer Wert“ (in der Realität unbekannt)
export const MU = 9.13            // Erwartungswert des Messaufbaus (systematische Abweichung)
export const SIGMA = 0.74         // Streuung der Einzelmessungen (Messaufbau)
export const N_MAX = 40           // so viele Werte werden je Durchlauf erzeugt

// Seed-RNG (mulberry32), gleichverteilt in [0, 1)
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// n normalverteilte Messwerte (Box-Muller), reproduzierbar je Seed
export function drawValues(seed, n = N_MAX, mu = MU, sigma = SIGMA) {
  const r = rng(seed)
  const out = []
  while (out.length < n) {
    const u1 = 1 - r()
    const u2 = r()
    const m = Math.sqrt(-2 * Math.log(u1))
    out.push(mu + sigma * m * Math.cos(2 * Math.PI * u2))
    if (out.length < n) out.push(mu + sigma * m * Math.sin(2 * Math.PI * u2))
  }
  return out
}

// Bestwert = arithmetischer Mittelwert der ersten n Werte
export function bestwert(values, n = values.length) {
  let s = 0
  for (let i = 0; i < n; i++) s += values[i]
  return s / n
}

// Standardabweichung der Einzelwerte, 1/(n−1) (Praktikumsformel)
export function stabw(values, n = values.length) {
  const m = bestwert(values, n)
  let q = 0
  for (let i = 0; i < n; i++) q += (values[i] - m) ** 2
  return Math.sqrt(q / (n - 1))
}

// Messunsicherheit (Typ A) = Standardabweichung des Bestwerts
export function unsicherheit(values, n = values.length) {
  return stabw(values, n) / Math.sqrt(n)
}

// Innerhalb von [ḡ − σ, ḡ + σ]? (Grenzen aus den ersten n0 Werten)
export function innerhalb(x, mean, sigma) {
  return Math.abs(x - mean) <= sigma
}

// Strichliste: wie viele der Werte [from, to) liegen im Intervall der ersten n0 Werte?
export function strichliste(values, n0, from, to) {
  const m = bestwert(values, n0)
  const s = stabw(values, n0)
  let inside = 0
  for (let i = from; i < to; i++) if (innerhalb(values[i], m, s)) inside++
  return { inside, outside: to - from - inside, mean: m, sigma: s }
}

// Reihen für die Diagramme, n = 2 … nMax
export function reihen(values, nMax = values.length) {
  const out = []
  for (let n = 2; n <= nMax; n++) {
    out.push({ n, mean: bestwert(values, n), sigma: stabw(values, n), u: unsicherheit(values, n) })
  }
  return out
}

// Rundung auf signifikante Stellen (Bezug „Signifikante Stellen“): u auf 2 Stellen,
// Bestwert und σ auf dieselbe Nachkommastelle.
export function decimalsFor(u, sig = 2) {
  if (!(u > 0)) return 2
  return Math.max(0, sig - 1 - Math.floor(Math.log10(u)))
}

// Zahl mit Dezimalkomma
export function fmt(x, decimals) {
  return x.toFixed(decimals).replace('.', ',')
}

// Seed aus URL-Hash-Teil „…?s=123“ bzw. Zufall
export function parseSeed(text) {
  const m = /(?:^|[?&])s=(\d+)/.exec(String(text || ''))
  return m ? Number(m[1]) >>> 0 : null
}

// Zeile im Punktdiagramm (greedy, in Reihenfolge der Messung): niedrigste Zeile, in der
// kein früherer Punkt näher als dist liegt. dists = [für die ersten k, für die übrigen].
export function stackRows(values, dists, k = 10) {
  const rows = []
  const placed = []            // je Zeile: Werte
  values.forEach((v, i) => {
    const d = i < k ? dists[0] : dists[1]
    let r = 0
    while (placed[r] && placed[r].some(x => Math.abs(x - v) < d)) r++
    ;(placed[r] ??= []).push(v)
    rows.push(r)
  })
  return rows
}

// Alle Kennzahlen eines Durchlaufs (Bühne und Karten lesen nur daraus)
export function analyse(values) {
  const at = n => ({ n, mean: bestwert(values, n), sigma: stabw(values, n), u: unsicherheit(values, n) })
  return {
    values,
    n10: at(10), n20: at(20), n30: at(30), n40: at(40),
    tally: strichliste(values, 10, 10, 20),
    series: reihen(values, values.length),
  }
}
