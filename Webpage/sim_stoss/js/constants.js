'use strict'

// Physikalische Konstanten und Geometrie (feste Gleiterlänge — reale
// Luftkissenbahn-Gleiter ändern ihre Länge nicht durch Zusatzgewichte,
// die Masse wird als Zahlenwert am Gleiter angezeigt, nicht als Breite).
export const TIME_STEP = 1 / 200 // s — fein genug, um kurze Stoßzeiten (~0,1–0,7 s) glatt aufzulösen

export const GLIDER_WIDTH_M = 0.6
export const SPRING_REST_LENGTH_M = 0.4
export const CONTACT_DIST_M = GLIDER_WIDTH_M + SPRING_REST_LENGTH_M // Abstand x2−x1 bei Kontaktbeginn

export const X1_START_M = -0.8
export const X2_START_M = 0.8

export const INFINITE_MASS_THRESHOLD = 5.1 // kg — Regler-Maximum (5,5) gilt als „Wand" (unendliche Masse)
export const INFINITE_K_THRESHOLD = 204 // N/m — Regler-Maximum (205) gilt als „starr" (unendliche Federkonstante)

export const MAX_SIM_DURATION = 12 // s — Sicherheitsobergrenze für sehr lange Vor-/Nachlaufzeiten

// ── Szene-Geometrie ───────────────────────────────────────────────────────
export const SVG_W = 700
export const SVG_H = 320
export const TRACK_Y = 190 // SVG-y der Fahrbahnoberkante
export const TRACK_H = 26
export const GLIDER_H = 46
export const DEFAULT_PPM = 90 // px pro m — Basiswert, Auto-Zoom skaliert bei Bedarf herunter
export const MIN_PPM = 25
export const SIDE_MARGIN_PX = 60 // Rand links/rechts, den die Gleiter nie unterschreiten

export const PIXELS_PER_VELOCITY_UNIT = 40 // px pro (m/s)

// Stoppuhr (kanonisch: Hauptzeiger 1 U/60s, Subdial 1 U/s — siehe CLAUDE.md).
// Transform ist statisch in index.html gesetzt (Referenzwert hier dokumentiert).
export const SW_TRANSFORM = 'translate(620, 55) scale(0.6)'
export const SW_RADIUS = 60
export const SW_HAND_LEN = 50

// Diagramm
export const GRAPH_W = 700
export const GRAPH_H = 320

// Diagramm-Typ-Optionen (kanonisch, → BACKLOG I12 Sidebar-Schule). Labels aus
// Nutzerperspektive; Schlüssel stimmen mit graphType/render.js überein.
export const GRAPH_OPTIONS = {
  v: { label: 'Geschwindigkeit v(t)' },
  a: { label: 'Beschleunigung a(t)' },
  p: { label: 'Impuls p(t)' },
  E: { label: 'Energie E(t)' },
}
