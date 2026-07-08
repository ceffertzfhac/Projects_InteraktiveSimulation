'use strict'

// ── Konfiguration: „Die Ableitung als Grenzwert" ─────────────────────────────
// Diagrammatisches Werkzeug ohne Zeit-Animation (kein requestAnimationFrame-Loop,
// kein Play/Pause/Stoppuhr/CSV — Sim-Schale analog Project_3massen_umlenkrollen).
// Physikalische Idee: die Sekante (Differenzenquotient) nähert sich mit δ → 0 der
// Tangente (Differentialquotient = Ableitung).

// Definitionsbereich der dargestellten Funktionen
export const X_MIN = 0
export const X_MAX = 25
export const NUM_POINTS = 500          // Abtastpunkte der Funktionskurve

// Stützstelle x₀ (Slider) — Ränder ausgespart, damit die Sekante Platz hat
export const X0_MIN = 1
export const X0_MAX = 24
export const X0_STEP = 0.1
export const X0_DEFAULT = 12.5

// Abstand δ (Slider). Betragsgrenze zusätzlich dynamisch an den Rand gekoppelt,
// damit x₀ ± δ (bzw. x₀ + δ) im Definitionsbereich bleibt.
export const DELTA_LIMIT = 5
export const DELTA_STEP = 0.05
export const DELTA_DEFAULT = 2.5

// Auswählbare Funktionen: analytische Funktion f + analytische Ableitung f'
// (sauberer als der numerische Differenzenquotient des Prototyps). `label` ist
// aus Nutzerperspektive benannt (Dropdown), `titleId` verweist auf die statische
// MathJax-Gleichung im SVG-Titel (JS schaltet nur display).
export const FUNCS = {
  gerade: {
    label: 'Gerade (linear)',
    f:  x => 2 * x - 2,
    fp: _x => 2,
  },
  parabel: {
    label: 'Parabel (quadratisch)',
    f:  x => 0.1 * (x - 12) ** 2 - 2,
    fp: x => 0.2 * (x - 12),
  },
  kubisch: {
    label: 'Kubisch (3. Grades)',
    f:  x => 0.02 * (x - 12.5) ** 3 - 2 * (x - 12.5),
    fp: x => 0.06 * (x - 12.5) ** 2 - 2,
  },
  komplex: {
    label: 'Komplex (Sinus + Parabel)',
    f:  x => -5 * Math.sin(x / 2) + 0.03 * x ** 2,
    fp: x => -2.5 * Math.cos(x / 2) + 0.06 * x,
  },
}
export const DEFAULT_FUNC = 'gerade'

// ── Diagramm-Geometrie (Landscape, füllt die mittlere Spalte, meet-zentriert) ──
export const GRAPH_W = 780
export const GRAPH_H = 580
export const PAD_L = 58   // Platz für y-Ticks + y-Achsenlabel
export const PAD_R = 26
export const PAD_T = 56   // Platz für den Funktions-Titel (MathJax)
export const PAD_B = 48   // Platz für x-Ticks + x-Achsenlabel
