'use strict'
// Kapitel 4 „Addition": zwei Werkstücke, verschieden genau gemessen und etikettiert,
// werden hintereinandergelegt. Botschaft: beim Addieren zählt der Stellenwert der
// letzten Ziffer (Nachkommastellen), nicht die Anzahl signifikanter Stellen.
// Konstanten: Bühnengeometrie (Bildschirm; Kamera nur für die Zahlengerade unten).

// ── Messwerte (Etiketten) und wahre Längen (nie angezeigt) ───────────────────
export const READ = { a: '0,4', b: '1,253' }    // A: Maßband 0,1 m · B: Maßband 1 mm
export const A_TRUE = 0.4237
export const B_TRUE = 1.2531
export const A_SAMPLES = [0.362, 0.446, 0.381, 0.433]   // mögliche wahre Längen von A

// ── Werkbank: Maßstab und Lagen (Bildschirm) ─────────────────────────────────
export const K = 360                                  // px pro Meter
export const X0 = 110                                 // Nullpunkt des Maßbands
export const xOf = s => X0 + s * K
export const LANE = { up: 300, low: 398 }             // obere Ablage, Messlage (Oberkante)
export const ROD_H = 30
export const TAPE = { top: 436, h: 40, len: 1.9 }
export const LOUPE = { cx: xOf(1.253), cy: 548, r: 56, k: 4000 }   // 4 px pro mm

// ── Protokoll („Steckbrief") oben links ──────────────────────────────────────
export const TABLE = { x: [60, 205, 300, 462, 590, 676], y0: 64, dy: 34 }

// ── Auswertung unten: Zahlengerade mit Kamera ────────────────────────────────
export const VIEW_N = { vL: 110, vR: 1080, vT: 520, vB: 640 }
export const AXIS_Y = 612
export const BAND_Y = 566
export const DIGITS = { x: 112, y: 556, size: 34 }
export const CAND_Y = 520                             // Liste der geprüften Etiketten
export const VERDICT_Y = 662
export const CAM_N = { view: VIEW_N, cx: 1.65, cy: 0, w: 0.4 }

export const T = { cam: 1.3, reveal: 0.7 }
export const EASE = { cam: 'power2.inOut', reveal: 'power3.out', pop: 'back.out(2.2)' }
