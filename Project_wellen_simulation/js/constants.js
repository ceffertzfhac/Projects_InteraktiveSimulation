'use strict'

// ── Konfiguration: „Interferenz zweier Punktquellen" ─────────────────────────
// Echte, kontinuierliche Zeitsimulation (Play/Pause/Reset) — anders als
// M10/M11/Ableitung. ARCHITEKTUR-AUSNAHME (s. docs/KNOWN_LIMITATIONS.md):
// kein precompute()/interpolateAt()-Array-Ansatz — das Wellenfeld ist eine
// kontinuierliche, unbeschränkte Funktion von t über ein 400×400(×DPR²)-
// Pixel-Canvas; physics.js bleibt zustandslos, render.js ruft die Formeln
// live pro Frame auf (1:1 wie im Original, nur sauber modularisiert).

export const PX_PER_CM = 40
export const CANVAS_SIZE = 400     // logische Canvas-Größe (px, vor DPR-Skalierung)
export const FREQ = 1.0            // Hz (fest, nicht regelbar — wie im Original)
export const OMEGA = 2 * Math.PI * FREQ
export const MIN_DIST = 0.2        // cm, Cutoff gegen die 1/√r-Singularität bei r=0
export const SCREEN_Y_CM = -4.8    // Position des Schirms (cm, nahe oberer Rand)

// Regler-Defaults
export const D_MIN = 0.5, D_MAX = 8, D_STEP = 0.1, D_DEFAULT = 3.0        // Quellabstand (cm)
export const LAMBDA_MIN = 0.5, LAMBDA_MAX = 4, LAMBDA_STEP = 0.1, LAMBDA_DEFAULT = 1.5  // Wellenlänge (cm)
export const PHASE_MIN = 0, PHASE_MAX = 360, PHASE_STEP = 15, PHASE_DEFAULT = 0         // δ₀ (Grad)
export const SPEED_MIN = 0, SPEED_MAX = 200, SPEED_STEP = 10, SPEED_DEFAULT = 100       // Tempo (%)

export const DETECTOR_DEFAULT = { x: 0, y: -4 } // cm, relativ zur Mitte

// ── Graph-Geometrie (Zeit- oder Schirm/Intensitäts-Diagramm, Umschaltung
// per Checkbox) — dedupliziertes Padding-Objekt (Original: 3× identisch in
// drawGraphGrid/drawTimeGraph/drawScreenGraph dupliziert, hier zentral). ──
export const GRAPH_PAD = { top: 40, right: 20, bottom: 40, left: 50 }
export const GRAPH_SIZE = 400

// Zeit-Graph: Sliding-2s-Fenster, Screen-Graph: x∈[-5,5]cm
export const TIME_WINDOW_S = 2.0
export const TIME_GRAPH_Y_SCALE = 60
export const SCREEN_X_MIN = -5, SCREEN_X_MAX = 5
export const SCREEN_GRAPH_Y_SCALE = 120
