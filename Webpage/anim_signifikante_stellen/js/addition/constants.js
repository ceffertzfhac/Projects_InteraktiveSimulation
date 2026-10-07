'use strict'
// Kapitel 4 „Addition": zwei Werkstücke, mit zwei verschieden feinen Maßbändern
// gemessen und beschriftet, werden hintereinandergelegt. Botschaft: beim Addieren
// zählt der Stellenwert der letzten Ziffer (Nachkommastellen in derselben Einheit),
// nicht die Anzahl signifikanter Stellen.
// Konstanten: Bühnengeometrie (Bildschirm; Kamera nur für die Zahlengerade unten).

// ── Messwerte (Etiketten) und wahre Längen (nie angezeigt) ───────────────────
export const READ = { a: '0,8', b: '1,877' }    // A: Maßband 0,1 m · B: Maßband 1 mm (PO 2026-10-02)
export const A_TRUE = 0.8237
export const B_TRUE = 1.8771
export const A_SAMPLES = [0.762, 0.846, 0.781, 0.833]   // mögliche wahre Längen von A

// ── Werkbank: Maßstab und Lagen (Bildschirm) ─────────────────────────────────
// K so, daß beide Werkstücke hintereinander (bis 2,73 m) links der Folienkarten Platz hat
export const K = 230                                  // px pro Meter
export const X0 = 96                                  // Nullpunkt (Anfang der Werkstücke)
export const xOf = s => X0 + s * K
export const LANE = { up: 232, low: 334 }             // Oberkante Stab A bzw. Werkstück B
export const ROD_H = 30
// Maßbänder unter den Werkstücken: A mit 0,1-m-Teilung, B mit mm-Teilung (sichtbar: cm)
export const TAPES = [
  { top: LANE.up + 38, h: 32, len: 1.05, fine: false },
  { top: LANE.low + 38, h: 32, len: 2.05, fine: true },
]
export const LOUPE = { cx: xOf(1.877) + 40, cy: 500, r: 58, k: 4000 }   // 4 px pro mm
// Etiketten: Start des Anflugs (relativ zur Zielposition) und Beschriftungs-Text
export const TAG_FLY = { dx: 150, dy: -120, rot: -28 }
// Taschenrechner (Schritt „Hintereinanderlegen")
export const CALC = { x: 930, y: 360, w: 200, h: 250 }   // unter der Folienkarte

// ── Protokoll („Steckbrief") oben links ──────────────────────────────────────
export const TABLE = { x: [60, 205, 300, 462, 590, 676], y0: 64, dy: 34 }

// ── Auswertung unten: Zahlengerade mit Kamera ────────────────────────────────
export const VIEW_N = { vL: 110, vR: 1080, vT: 520, vB: 640 }
export const AXIS_Y = 612
export const BAND_Y = 566
export const CMP_BOX = { x: 96, y: 404 }              // Vergleichstafel L_max · Rechner · L_min
export const CAM_N = { view: VIEW_N, cx: 2.68, cy: 0, w: 0.4 }
// Einheiten-Tafel („Gleiche Einheit"): fünf Zeilen
export const UNITS = { x: 96, y: 336, dy: 42 }

export const T = { cam: 1.3, reveal: 0.7 }
export const EASE = { cam: 'power2.inOut', reveal: 'power3.out', pop: 'back.out(2.2)' }
