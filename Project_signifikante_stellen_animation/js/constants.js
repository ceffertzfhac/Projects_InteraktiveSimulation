'use strict'
// Konstanten: Bühnengeometrie, Kamera-Presets, Timing, Inhalte. Keine Logik.

// Bühne: SVG-viewBox 1200×675 (16:9). Sichtfenster der Kamera in SVG-Pixeln.
// Teil M/Z (Messen, Zahlengerade): volle Breite, Folienkarten oben rechts.
export const VIEW_A = { vL: 80, vR: 1120, vT: 120, vB: 600 }
export const AXIS_Y = 372                         // Bildschirmlage der Zahlengeraden
const AXIS_FRAC_A = (VIEW_A.vB - AXIS_Y) / (VIEW_A.vB - VIEW_A.vT)
// Maßband und Stäbe (feste Bildschirmhöhen; x folgt der Kamera)
export const TAPE = { top: 506, h: 40 }
export const ROD = [{ top: 484, h: 16 }, { top: 460, h: 16 }]
export const READING_Y = 614                      // „abgelesen: …" unter dem Maßband

// Teil R (Fläche): Plot links, Folienkarten rechts.
export const VIEW_B = { vL: 110, vR: 700, vT: 82, vB: 592 }
export const OVERVIEW_H = 3.2

const aspect = v => (v.vB - v.vT) / (v.vR - v.vL)
export const ASPECT_B = aspect(VIEW_B)
const ovW = OVERVIEW_H / ASPECT_B
export const CAM_OVERVIEW = { view: VIEW_B, cx: ovW / 2, cy: OVERVIEW_H / 2, w: ovW }
// Kamera für Teil A: y = 0 (Zahlengerade) liegt immer bei AXIS_Y.
export const camA = (cx, w) => ({ view: VIEW_A, cx, w, cy: (0.5 - AXIS_FRAC_A) * w * aspect(VIEW_A) })
export const CAM_START = camA(2.15, 4.7)          // ganzer Stab samt Maßband-Anfang
export const CAM_ROD_END = camA(3, 1.6)           // Ablesen am Stabende
export const levelWidth = k => 2.5 / 10 ** k      // Zahlengerade bei Genauigkeitsstufe k

// Kamera für ein Rechenbeispiel: Ecke (l, b) mittig, Ausschnitt so, daß das
// breitere der beiden Intervalle ~30 % der Sicht füllt; grob → Übersicht.
export function camForExample(l, b) {
  const w = 3.4 * Math.max(l.width, b.width / ASPECT_B)
  return w >= 0.5 * CAM_OVERVIEW.w ? CAM_OVERVIEW : { cx: l.value, cy: b.value, w }
}

// Timing (Sekunden bei Tempo 1×) und Easing
export const T = { draw: 1.2, cam: 1.5, camLong: 2.4, reveal: 0.7, pop: 0.6, grow: 1.1 }
export const EASE = {
  cam: 'power2.inOut', reveal: 'power3.out', pop: 'back.out(2.2)', soft: 'sine.inOut',
}

// ── Inhalte ──────────────────────────────────────────────────────────────────
export const L_LEVELS = ['3', '3,0', '3,00', '3,000']   // Ablesungen bei 1 m … 1 mm Teilung
export const RODS_MEASURE = [2.97, 3.02]                  // Teil M: zwei Stäbe, beide „3,0 m"
export const ROD_COARSE = 2.8                             // 1-m-Band: näher an 3 → „3 m"
export const ROD_SHORT = 2.4                              // 1-m-Band: näher an 2 → „2 m"
export const ROD_FINE_SHORT = 2.93                        // 0,1-m-Band: näher an 2,9 → „2,9 m"
// Teil Z: wahre Längen, deren Pfeile je Stufe auf der Zahlengeraden landen
export const RODS_LEVEL = [[2.97, 3.3, 2.62], [2.97, 3.02], [3.003, 2.996], [3.0004, 2.9997]]
export const B_FINAL = '2,000'
export const RETURN_PATH = [['3,000', '2,00'], ['3,000', '2'], ['3', '2']]   // erst b, dann l
export const MIXES = [['3,00', '2,9'], ['3,0', '2,00']]
// Kreis: gemessener Radius, Bühnenlage (Bildschirm), mögliche wahre Radien
export const R_TEXTS = ['3,0', '3']                         // erst 3,0, dann nur noch eine Stelle
// Kreis-Bühne (Bildschirmkoordinaten): Mittelpunkt, Maßstab; Werte-Protokoll oben links.
export const CIRCLE = { cx: 470, cy: 378, K: 55, logX: 96, logY: 132 }
// mögliche wahre Radien für die Variation (je Stufe 3,0 bzw. 3)
export const R_SAMPLES = [[2.962, 3.041, 2.983], [2.62, 3.4, 2.8]]
// Mögliche wahre Ecken (Anteile der halben Intervallbreiten)
export const CORNER_SAMPLES = [[0.62, -0.4], [-0.55, 0.52], [0.2, 0.78], [-0.72, -0.62]]

// Text-Tabelle für Bühnen-Labels (die Szene speichert nur Indizes).
export const TEXTS = ['3', '3,0', '3,00', '3,000', '2', '2,0', '2,00', '2,000', '2,9',
  '3 m', '3,0 m', '3,00 m', '3,000 m', '2 m', '2,9 m']
export const textIndex = t => {
  const i = TEXTS.indexOf(t)
  if (i < 0) throw new Error(`Text „${t}" fehlt in TEXTS`)
  return i
}

export const LEVEL_UNITS = ['1 m', '0,1 m', '1 cm', '1 mm']

// ── Signifikante Stellen: Ziffernzeile mit Zählmarken (Teil Z, Bildschirm) ──
// Zeichen-Token behalten ihre Identität über die Schreibweisen hinweg (gleiche
// Messung in m, km, cm, mm) — die signifikanten Ziffern D1…D4 gleiten mit.
export const SIG_ROW = { cx: 420, y: 214, size: 54 }
export const SIG_TOKENS = [
  ['D1', '3'], ['D2', '0'], ['D3', '0'], ['D4', '0'], ['C', ','],
  ['Z1', '0'], ['Z2', '0'], ['Z3', '0'],
  ['Um', 'm'], ['Ukm', 'km'], ['Ucm', 'cm'], ['Umm', '· 10³ mm'],
]
// Schreibweisen: Token → Spalte (Monospace); fehlende Token sind ausgeblendet
export const SIG_REPS = [
  { D1: 0, C: 1, D2: 2, D3: 3, D4: 4, Um: 5.4, w: 7 },                                   // 3,000 m
  { Z1: 0, C: 1, Z2: 2, Z3: 3, D1: 4, D2: 5, D3: 6, D4: 7, Ukm: 8.4, w: 11 },          // 0,003000 km
  { D1: 0, D2: 1, D3: 2, C: 3, D4: 4, Ucm: 5.4, w: 8 },                                  // 300,0 cm
  { D1: 0, C: 1, D2: 2, D3: 3, D4: 4, Umm: 5.4, w: 12 },                                 // 3,000 · 10³ mm
]

// ── „Welche Stelle ist unsicher?" (Teil R/K): Tafel rechts unten ─────────────
export const LUPE_BOX = { x: 756, y: 478, w: 408, h: 178 }
