'use strict'
// Kapitel 2 „Division": Durchschnittsgeschwindigkeit v = s / t eines Autos,
// gemessen von zwei Personen mit unterschiedlich feinen Messmitteln.
// Konstanten: Bühnengeometrie (Bildschirmkoordinaten, keine Kamera außer für
// die v-Achse), wahre Werte, Ablesungen. Keine Logik.

// ── Wahre Werte (kennt nur die Animation, nicht die Messenden) ──────────────
export const S_TRUE = 19.832          // m  Abstand Start- bis Ziellinie
export const T_TRUE = 1.4215          // s  Fahrzeit zwischen den Linien
export const V_TRUE = S_TRUE / T_TRUE // m/s (≈ 50 km/h)

// ── Ablesungen (Texte → model.js parseMeasured) ──────────────────────────────
export const READ = {
  sA: '20',      // 1-m-Maßband: Ziellinie liegt näher an der 20-m-Marke
  tA: '1,42',    // Lichtschranken + Stoppuhr mit Hundertstelsekunden
  sB: '19,83',   // cm-Maßband
  tB: '1',       // Stoppuhr, nur Sekundenzeiger: näher an 1 s als an 2 s
}
// Kombination: Strecke von B, Zeit von A
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
export const SLOWMO = 2                               // Zeitlupe während der Fahrt
// Maßbänder unter der Straße
export const TAPES = [{ top: 428, h: 20 }, { top: 452, h: 20 }]
export const TAPE_LEN = 21                            // m

// ── Ausrüstungs-Tafeln der beiden Personen ───────────────────────────────────
export const PANEL = [{ x: 30, w: 555 }, { x: 615, w: 555 }].map(p => ({ ...p, y: 494, h: 168 }))
export const WATCH_A = { cx: 462, cy: 583, w: 196, h: 66 }     // digital, 0,01 s
export const WATCH_B = { cx: 935, cy: 585, r: 54 }             // analog, nur Sekundenzeiger
export const LOUPE = { cx: 1094, cy: 583, r: 62 }              // Lupe (Maßband bzw. Zifferblatt)
export const LOUPE_TAPE = { k: 1200, from: 19.76, to: 19.91 }  // px/m in der Lupe (12 px/cm)
export const LOUPE_DIAL = { R: 380, drop: 16, at: 1 }          // Zifferblatt-Radius, Lupe zentriert auf 1 s

// ── Messprotokoll und v-Achse (oben links; Folienkarten oben rechts) ─────────
export const TABLE = { x: [60, 210, 360, 500], y0: 60, dy: 32 }
export const VIEW_V = { vL: 140, vR: 620, vT: 170, vB: 260 }
export const V_AXIS_Y = 252
export const BAND_Y = [186, 202, 218]                 // Bänder A, B, A+B über der Achse
export const CAM_V_FULL = { view: VIEW_V, cx: 22.5, cy: 0, w: 45 }   // 0 … 45 m/s
export const CAM_V_ZOOM = { cx: 14.05, w: 2.2 }                      // ≈ 13 … 15 m/s

export const T = { cam: 1.6, reveal: 0.7 }
export const EASE = { cam: 'power2.inOut', reveal: 'power3.out', pop: 'back.out(2.2)' }
