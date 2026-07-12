'use strict'

// ── Konfiguration: „Grundbegriffe der Kinematik" ────────────────────────────
// Diagrammatisches Werkzeug ohne Zeit-Animation (kein requestAnimationFrame-
// Loop, kein Play/Pause/Stoppuhr/CSV — analog Project_ableitung_simulation/
// Project_geschwindigkeit_simulation). Feste Bahnkurve (x(t),y(t)); zwei
// Zeit-Regler tA/tB markieren zwei Punkte A/B darauf. Sieben Toggles blenden
// Ortsvektoren/Verschiebung/Abstand/Weglänge ein, Hover über jede
// Steuerzeile zeigt eine von 8 statischen Erklär-Varianten rechts.

export const T_MIN = 0
export const T_MAX = 4.2
export const NUM_POINTS = 2000

export const TA_DEFAULT = 0.8
export const TB_DEFAULT = 3.2
export const T_STEP = 0.01

// ── Diagramm-Geometrie (Landscape) ───────────────────────────────────────────
// Marge/Breite 1:1 aus dem Original übernommen (ANIMATION_WIDTH=600,
// PLOT_MARGINS={top:40,right:40,bottom:40,left:60}, Seitenverhältnis 4:3).
export const PAD_L = 60
export const PAD_R = 40
export const PAD_T = 40
export const PAD_B = 40
export const PLOT_W = 600 - PAD_L - PAD_R
export const PLOT_H = PLOT_W / (4 / 3)
export const GRAPH_W = PLOT_W + PAD_L + PAD_R
export const GRAPH_H = PLOT_H + PAD_T + PAD_B

// Die 8 Erklär-Varianten der rechten Analyse-Sidebar (statisches MathJax,
// JS schaltet nur display um). 'default' = Standardtext ohne Auswahl.
export const ANALYSIS_VARIANTS = [
  'default', 'sA', 'sB', 'verschiebung_BA', 'verschiebung_AB', 'abstand', 'weg', 'pathBg',
]
