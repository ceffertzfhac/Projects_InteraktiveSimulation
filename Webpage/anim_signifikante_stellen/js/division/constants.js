'use strict'
// Kapitel 2 „Division": Durchschnittsgeschwindigkeit v = s / t eines Autos,
// gemessen von zwei Personen mit unterschiedlich feinen Messmitteln.
// Konstanten: Bühnengeometrie (Bildschirmkoordinaten, Kamera nur für die
// v-Zahlengerade), wahre Werte, Ablesungen. Keine Logik.

// ── Wahre Werte (kennt nur die Animation, nicht die Messenden; nie angezeigt) ──
export const S_TRUE = 19.832          // m  Abstand Start- bis Ziellinie
export const T_TRUE = 2.1715          // s  Fahrzeit zwischen den Linien (PO: 2,17 s)
export const V_TRUE = S_TRUE / T_TRUE // m/s ≈ 9,13 (nur für die Fahrt-Animation)

// ── Ablesungen (Texte → model.js parseMeasured) ──────────────────────────────
export const READ = {
  sA: '20',      // 1-m-Maßband: Ziellinie liegt näher an der 20-m-Marke
  tA: '2,17',    // Lichtschranken + Stoppuhr mit Hundertstelsekunden
  sB: '19,83',   // cm-Maßband
  tB: '2',       // Stoppuhr, nur Sekundenzeiger: näher an 2 s als an 3 s
}
// Zeilen des Protokolls: A, B, Kombination (Strecke von B, Zeit von A)
export const ROWS = [['sA', 'tA'], ['sB', 'tB'], ['sB', 'tA']]

// ── Straße (Draufsicht) ──────────────────────────────────────────────────────
export const K = 45                                   // px pro Meter
export const X0 = 210                                 // Startlinie (s = 0)
export const xOf = s => X0 + s * K
export const ROAD = { top: 340, h: 80 }
export const CAR = { len: 172, w: 58 }                // px (Draufsicht, stilisiert)
export const CAR_PARK = -0.45                         // m  Wagenfront vor dem Start (ganz sichtbar)
export const CAR_ENTRY = -5.5                         // m  Anlauf außerhalb des Bildes
export const CAR_GONE = 30                            // m  Wagen ganz rechts aus dem Bild
export const SLOWMO = 1.5                             // Zeitlupe während der Fahrt
// Maßbänder unter der Straße
export const TAPES = [{ top: 428, h: 20 }, { top: 452, h: 20 }]
export const TAPE_LEN = 21                            // m

// ── Ausrüstungs-Tafeln der beiden Personen ───────────────────────────────────
export const PANEL = [{ x: 30, w: 555 }, { x: 615, w: 555 }].map(p => ({ ...p, y: 494, h: 168 }))
export const WATCH_A = { cx: 462, cy: 583, w: 196, h: 66 }     // digital, 0,01 s
export const WATCH_B = { cx: 935, cy: 585, r: 54 }             // analog, nur Sekundenzeiger
export const LOUPE = { cx: 1094, cy: 583, r: 62 }              // Lupe (Maßband bzw. Zifferblatt)
export const LOUPE_TAPE = { k: 1200, from: 19.76, to: 19.91 }  // px/m in der Lupe (12 px/cm)
export const LOUPE_DIAL = { R: 380, drop: 16 }                 // Zifferblatt-Radius in der Lupe

// ── Messprotokoll (oben links; Folienkarten oben rechts) ─────────────────────
// Je Zelle: Wert (letzte Ziffer = unsicher markiert) und darunter das Intervall.
export const TABLE = { x: [60, 200, 370, 540], y0: 56, dy: 44, sub: 19 }

// ── Ab den Geschwindigkeits-Schritten: Straße weg, unten breite v-Zahlengerade ──
export const FRAC = { y: [262, 342], x0: 160, x1: 430, live: 486 }   // Regler s und t
export const DIGITS = { x: 112, y: 424, size: 38 }                   // Ziffernzeile des Ergebnisses
export const VIEW_V = { vL: 110, vR: 1080, vT: 440, vB: 600 }
export const V_AXIS_Y = 560
export const BAND_Y = [462, 490, 518]                 // Bänder A, B, Kombination (Höhe 14)
export const VERDICT_Y = 630
export const CAM_V_FULL = { view: VIEW_V, cx: 7.5, cy: 0, w: 15 }   // 0 … 15 m/s

export const T = { cam: 1.4, reveal: 0.7 }
export const EASE = { cam: 'power2.inOut', reveal: 'power3.out', pop: 'back.out(2.2)' }
