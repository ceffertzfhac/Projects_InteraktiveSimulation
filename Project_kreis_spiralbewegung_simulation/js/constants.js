'use strict'

// ── Physik ──────────────────────────────────────────────────────────────────
export const TIME_STEP = 1 / 60          // Physik-Zeitschritt (60 Hz)
export const SIM_DURATION = 120          // festes Precompute-Horizont (s) — statt
                                          // extend-on-the-fly; Spiral-R→0 bricht früher ab
export const ISO_ANGLE = 30 * Math.PI / 180

// ── Animations-Layout (SVG-Koordinaten, 2D-Koordinatenursprung) ──────────────
export const ANIM_W = 400
export const ANIM_H = 480
export const ANIM_CX = 175               // Bewegungszentrum x (physikal. Ursprung)
export const ANIM_CY = 240               // Bewegungszentrum y
export const DEFAULT_PIXELS_PER_METER = 75
export const COORD_AXIS_LEN = 150        // 2D-Achsenlänge (px, beide Richtungen)

// Vektor-Skalen (px pro Einheit, × zoomFactor zur Laufzeit)
export const VEL_SCALE = 0.40
export const ACC_SCALE = 0.20
export const OMEGA_LEN_FACTOR = 0.02     // ISO: |ω_deg| · Faktor → Länge (m, entlang z)
export const ALPHA_LEN_FACTOR = 0.04     // ISO: |α_deg| · Faktor → Länge (m, entlang z)

// ── Stoppuhr (kanonisches Design, Ref: Atwood v2.2.x / CLAUDE.md) ────────────
// Hauptzifferblatt r=72, 60 Marken, Hauptzeiger 1 U/60 s. (Subdial → Backlog.)
export const WATCH_TX = 84               // Gruppen-Transform (translate)
export const WATCH_TY = -24
export const WATCH_SCALE = 0.595
export const WATCH_CX = 280              // Zifferblatt-Mittelpunkt (vor Transform)
export const WATCH_CY = 120
export const WATCH_R = 72
export const WATCH_HAND_LEN = 60
export const ZOOM_TEXT_X = 250.6
export const ZOOM_TEXT_Y = 108.24

// ── Diagramm-Geometrie ───────────────────────────────────────────────────────
// Graph-Maße liegen in render.js (LAND_*/PORT_*): das Format schaltet je Zell-Form
// (Landscape gestapelt / Portrait nebeneinander) um, daher nicht mehr fest hier.
// Plot-Padding (bg-Rect 10 px past arrowheads via refX=0-Ausnahme)
export const PAD_L = 55, PAD_R = 15, PAD_T = 30, PAD_B = 40

// ── Subjekte & Größen ────────────────────────────────────────────────────────
export const subjects = ['p']            // einzelner Partikel
export const quantities = [
  'x', 'y', 'vx', 'vy', 'ax', 'ay',      // kartesische Komponenten
  'phi', 'omega', 'alpha',               // Winkelgrößen (in Grad gespeichert)
  'ar', 'at', 'vabs', 'aabs',            // Beträge (|a_r|, |a_t|, |v|, |a|)
]

// Einheiten je Größe (Basis; Winkelgrößen in Grad — rad nur für UI/Graph-Anzeige)
export const quantityUnits = {
  x: 'm', y: 'm',
  vx: 'm/s', vy: 'm/s',
  ax: 'm/s²', ay: 'm/s²',
  phi: '°', omega: '°/s', alpha: '°/s²',
  ar: 'm/s²', at: 'm/s²', vabs: 'm/s', aabs: 'm/s²',
}

// Symbole für Achsenbeschriftung (Unicode-Subscripts)
export const quantitySymbols = {
  phi: 'φ', omega: 'ω', alpha: 'α',
  x: 'x', y: 'y', vx: 'vₓ', vy: 'vᵧ', ax: 'aₓ', ay: 'aᵧ',
  ar: '|aᵣ|', at: '|aₜ|', vabs: '|v|', aabs: '|a|',
}

// Diagramm-Optionen (Nutzerperspektive, HTML-kodiert mit <i> für kursive Symbole)
export const graphOptions = {
  'Winkelgrößen': {
    phi: 'Winkel <i>φ</i>(<i>t</i>)',
    omega: 'Winkelgeschw. <i>ω</i>(<i>t</i>)',
    alpha: 'Winkelbeschl. <i>α</i>(<i>t</i>)',
  },
  'Orts-Komponenten': {
    x: 'Ort <i>x</i>(<i>t</i>)',
    y: 'Ort <i>y</i>(<i>t</i>)',
  },
  'Geschwindigkeits-Komponenten': {
    vx: 'Geschw. <i>v</i>ₓ(<i>t</i>)',
    vy: 'Geschw. <i>v</i>ᵧ(<i>t</i>)',
  },
  'Beschleunigungs-Komponenten': {
    ax: 'Beschl. <i>a</i>ₓ(<i>t</i>)',
    ay: 'Beschl. <i>a</i>ᵧ(<i>t</i>)',
  },
  'Beträge': {
    vabs: 'Geschw.-Betrag |<i>v</i>(<i>t</i>)|',
    aabs: 'Beschl.-Betrag |<i>a</i>(<i>t</i>)|',
    ar: '|<i>a</i>ᵣ(<i>t</i>)|',
    at: '|<i>a</i>ₜ(<i>t</i>)|',
  },
}

// Kurze Graph-Titel (TextContent-Variante ohne Einheit — setGraphTitle)
export const graphTitles = {
  phi: 'Winkel φ(t)', omega: 'Winkelgeschw. ω(t)', alpha: 'Winkelbeschl. α(t)',
  x: 'Ort x(t)', y: 'Ort y(t)',
  vx: 'Geschw. vₓ(t)', vy: 'Geschw. vᵧ(t)',
  ax: 'Beschl. aₓ(t)', ay: 'Beschl. aᵧ(t)',
  vabs: 'Geschwindigkeitsbetrag |v(t)|', aabs: 'Beschleunigungsbetrag |a(t)|',
  ar: '|a_r(t)|', at: '|a_t(t)|',
}

// CSV-Header je Größe (Winkelgrößen immer in Grad — Vergleichbarkeit)
export const csvHeader = {
  t: 't / s',
  x: 'x / m', y: 'y / m', vx: 'vx / m/s', vy: 'vy / m/s',
  ax: 'ax / m/s^2', ay: 'ay / m/s^2',
  phi: 'phi / deg', omega: 'omega / deg/s', alpha: 'alpha / deg/s^2',
  ar: '|ar| / m/s^2', at: '|at| / m/s^2', vabs: '|v| / m/s', aabs: '|a| / m/s^2',
}

// Reihenfolge der Voll-CSV (Alle Daten) — wie Quelldatei
export const allCsvQuantities = ['x', 'y', 'vx', 'vy', 'ax', 'ay', 'phi', 'omega', 'alpha', 'ar', 'at', 'vabs', 'aabs']

// ── Szenarien-Presets ────────────────────────────────────────────────────────
export const PRESETS = {
  gleich:         { mode: 'kreis',   R0: 1.5, vr: 0,   omega0: 90,  alpha: 0 },
  start:          { mode: 'kreis',   R0: 1.5, vr: 0,   omega0: 0,   alpha: 20 },
  brems:          { mode: 'kreis',   R0: 1.5, vr: 0,   omega0: 120, alpha: -15 },
  spirale_aussen: { mode: 'spirale', R0: 0.2, vr: 0.3, omega0: 150, alpha: 0 },
}