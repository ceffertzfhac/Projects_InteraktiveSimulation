'use strict'

// ── Physikalische Konstanten & Simulationsfenster ──────────────────────────────
// (Für dieses Beispiel — gleichförmig beschleunigte 1-D-Bewegung — brauchen wir
//  KEIN g; a und v0 sind Eingabeparameter, siehe state.js.)
export const T_MAX = 6.0        // s   — maximales Zeitfenster der Simulation
export const DT    = 0.02       // s   — Schrittweite von precompute()

// ── Geometrie der Animationsfläche (viewBox 0 0 900 500) ───────────────────────
export const TRACK_Y   = 300    // px  — Höhe der Bahn-Linie
export const TRACK_X0  = 60     // px  — Bildschirm-x bei physikalischem x = 0 m
export const TRACK_LEN_M = 20   // m   — physikalische Länge der Bahn
export const PPM       = 17.5   // px/m — Pixel pro Meter (= 350 px / 20 m)
export const BALL_R    = 9      // px

// Pixel-pro-Einheit für die Vektor-Längen (nur Darstellung, nicht physikalisch)
export const PIXELS_PER_VEL = 10   // px pro (m/s)
export const PIXELS_PER_ACC = 20   // px pro (m/s²)
export const VEC_MARKER_LEN = 12.5 // px = markerWidth(5) · strokeWidth(2.5)

// ── Diagrammfläche ─────────────────────────────────────────────────────────────
export const GRAPH_W = 420      // px
export const GRAPH_H = 410      // px
