'use strict'

// Dynamische Vektorfarben (Beschleunigung a, Geschwindigkeit v) — Mischung im OKLCH-Raum
// entlang des Farbkreises (kürzester Weg), nicht in RGB (Komplementärfarben ergäben Grau).
//   a: Magenta (rein radial, a_r — Farbe der Vorlesungsfolien) → Karmin (rein tangential, a_t)
//   v: Mandarine (rein tangential, v_t) → Azur (rein radial, v_r; nur bei Spirale ≠ 0)
// Die aktuelle Farbe wird als CSS-Variable --c-a / --c-v an <body> gesetzt; Szene und
// Legende ziehen sie über var() — die Legende zeigt so immer die gerade benutzte Farbe.

const PALETTE = {
  light: { ar: '#ff40ff', at: '#df0760', vt: '#ff9300', vr: '#0092dc' },
  dark:  { ar: '#ff7cff', at: '#ff6d96', vt: '#ffb13d', vr: '#55c4fe' },
}

function hexToOklch(hex) {
  const lin = x => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)
  const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(hex.slice(i, i + 2), 16) / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return { L, C: Math.hypot(a, bb), h: (Math.atan2(bb, a) * 180 / Math.PI + 360) % 360 }
}

function oklchToHex({ L, C, h }) {
  const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  const enc = x => {
    const c = Math.max(0, Math.min(1, x))
    return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055))
  }
  return '#' + rgb.map(x => enc(x).toString(16).padStart(2, '0')).join('')
}

export function mixColors(hex1, hex2, t, direct = false) {
  const c1 = hexToOklch(hex1), c2 = hexToOklch(hex2)
  // kürzester Weg um den Farbkreis; direct = ohne Umweg-Korrektur (Mandarine→Azur läuft über
  // Grün/Cyan statt über Rot/Pink, damit die Mischfarben nie in die Magenta-Familie von a geraten)
  const dh = direct ? c2.h - c1.h : ((c2.h - c1.h + 540) % 360) - 180
  return oklchToHex({
    L: c1.L + (c2.L - c1.L) * t,
    C: c1.C + (c2.C - c1.C) * t,
    h: c1.h + dh * t,
  })
}

// P: { x, y, vx, vy, ax, ay } (Weltkoordinaten). Anteil = Betrag der "anderen" Komponente
// am Gesamtbetrag beider Komponenten (0…1), aus der echten Zerlegung in r̂/t̂.
export function updateDynamicColors(P) {
  const R = Math.hypot(P.x, P.y)
  let sa = 0, sv = 0
  if (R > 1e-9) {
    const ux = P.x / R, uy = P.y / R
    const ar = P.ax * ux + P.ay * uy, at = -P.ax * uy + P.ay * ux
    const vr = P.vx * ux + P.vy * uy, vt = -P.vx * uy + P.vy * ux
    const da = Math.abs(ar) + Math.abs(at), dv = Math.abs(vr) + Math.abs(vt)
    sa = da > 1e-9 ? Math.abs(at) / da : 0
    sv = dv > 1e-9 ? Math.abs(vr) / dv : 0
  }
  const pal = document.body.classList.contains('dark') ? PALETTE.dark : PALETTE.light
  document.body.style.setProperty('--c-a', mixColors(pal.ar, pal.at, sa))
  document.body.style.setProperty('--c-v', mixColors(pal.vt, pal.vr, sv, true))
}
