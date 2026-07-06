'use strict'

// ── Physikalische Konstanten ──────────────────────────────────────────────────
export const G = 9.81          // Erdbeschleunigung (m/s²)

// ── SVG-Geometrie (Bildschirm-Koordinaten, Y-Achse nach unten) ────────────────
export const SVG_W = 900
export const SVG_H = 500
export const SVG_CENTER_X = 450
export const PIXELS_PER_CM = 10
export const FORCE_SCALE_FACTOR = 5   // px pro Newton (Vektorlänge)
export const SIZE_PER_KG = 20         // Kantenlänge des Massen-Rechtecks pro kg
export const CEILING_Y = 40
export const PULLEY_RADIUS = 15
export const TRIANGLE_SIDE_LENGTH = 1.2 * (PULLEY_RADIUS * 2)
export const TRIANGLE_HEIGHT = (TRIANGLE_SIDE_LENGTH * Math.sqrt(3)) / 2
export const PULLEY_Y = CEILING_Y + TRIANGLE_HEIGHT

// ── Slider-Defaults & Bereiche ────────────────────────────────────────────────
// Hinweis: Der v2-Prototyp trug m₃ value="1.1" bei Display "2.1 kg" (Stale-HTML);
// runtime-relevant ist der Sliderwert 1.1 → wird hier als Default übernommen.
export const M1_DEFAULT = 1.9
export const M1_MIN = 1, M1_MAX = 3, M1_STEP = 0.01

export const M3_DEFAULT = 1.1
export const M3_MIN = 1, M3_MAX = 3, M3_STEP = 0.01

export const M2_DEFAULT = 2.0
export const M2_MIN = 1.0, M2_MAX = 4.0, M2_STEP = 0.1

export const PULLEY_DIST_DEFAULT_CM = 40
export const PULLEY_DIST_MIN_CM = 20, PULLEY_DIST_MAX_CM = 60, PULLEY_DIST_STEP_CM = 1

export const ROPE_LEN_DEFAULT_CM = 50
export const ROPE_LEN_STEP_CM = 1
// Dynamische Kopplung (siehe ui.js): ropeLen ∈ [pulleyDist·MIN , pulleyDist·MAX].
// Max großzügig (·3), damit die Seilsegmente sinnvoll weit verlängert werden können
// (m₁/m₃ hängen dann tiefer) — zusammen mit dem Zoom-Out bleibt alles sichtbar.
export const ROPE_LEN_MIN_FACTOR = 0.8
export const ROPE_LEN_MAX_FACTOR = 3.0

// ── Auto-Zoom (viewBox paßt sich an, sobald Inhalt den Rand erreicht) ─────────
export const AUTOZOOM_MARGIN = 16      // Rand-Puffer in SVG-Einheiten
export const AUTOZOOM_DURATION_MS = 220 // Dauer der smooth-Anpassung

// ── Vektor-Klassen (Stroke/Fill via CSS-Tokens, siehe css/styles.css) ─────────
// Schwerkraft  → --c-fg (Okabe-Ito blau)
// Seilkraft    → --c-fn (Okabe-Ito orange)
// Komponenten  → --c-comp-h (vermilion) / --c-comp-v (sky-blue), beide gestrichelt
export const VEC_CLASS = {
  gravity: 'vec-gravity',
  tension: 'vec-tension',
  horizontal: 'vec-comp-h',
  vertical: 'vec-comp-v',
}