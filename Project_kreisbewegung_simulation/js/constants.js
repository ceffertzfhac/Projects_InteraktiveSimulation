'use strict'

// ── Physik ──────────────────────────────────────────────────────────────────
export const TIME_STEP = 1 / 60               // Physik-Zeitschritt (60 Hz)

// ── Pixel-Skalierung (Animation) ─────────────────────────────────────────────
// Simulationsdarstellung einheitlich ×1,2 (Zentrum ANIM_CX/ANIM_CY bleibt
// fest): ppm für Bahn/Ort, velocity- und acceleration-Scale alle um denselben
// Faktor, sodaß Kreis + alle Vektoren gleichmäßig skaliert werden.
export const DEFAULT_PIXELS_PER_METER = 98.4    // px pro m (82 × 1,2)
export const PIXELS_PER_VELOCITY_UNIT = 24       // px pro (m/s) (20 × 1,2)
export const PIXELS_PER_ACCELERATION_UNIT = 6    // px pro (m/s²) (5 × 1,2)
export const POINT_RADIUS = 8                  // Massenpunkt-Radius (px)

// ── Animationsfläche (SVG-Koordinaten) ───────────────────────────────────────
export const ANIM_W = 450
export const ANIM_H = 480
export const ANIM_CX = ANIM_W / 2
export const ANIM_CY = ANIM_H / 2 + 20

// ── Slider-Grenzen ────────────────────────────────────────────────────────────
export const R_MIN = 0.5, R_MAX = 2.0         // Radius (m)
export const PHI0_MIN = 0, PHI0_MAX = 360      // Anfangswinkel (°)
export const OMEGA_MIN = -180, OMEGA_MAX = 180 // Winkelgeschwindigkeit (°/s)

// ── Diagramm-Geometrie ───────────────────────────────────────────────────────
export const GRAPH_W = 700
export const GRAPH_H = 410
export const GRAPH_H_STACKED = 200             // Höhe je gestapelter Teilgraph
export const GRAPH_STACKED_GAP = 10            // Zwischenraum oben↔unten

// ── Stoppuhr (Gruppen-Transform in setupScene) ────────────────────────────────
export const WATCH_CX = 280, WATCH_CY = 120, WATCH_R = 72
export const SDIAL_CX = 280, SDIAL_CY = 150, SDIAL_R = 16

// ── LCD-Digitaluhr (Easteregg, Skalierung 0.85) ──────────────────────────────
export const DIGITAL_DISPLAY_SCALE = 0.85
export const SEG_THICK = 6 * DIGITAL_DISPLAY_SCALE
export const SEG_LEN = 40 * DIGITAL_DISPLAY_SCALE
export const DIGIT_SPACING = 5 * DIGITAL_DISPLAY_SCALE
export const COLON_WIDTH = 10 * DIGITAL_DISPLAY_SCALE
export const LCD_FRAME_PADDING = 10 * DIGITAL_DISPLAY_SCALE
export const DIGIT_WIDTH = SEG_LEN + 2 * SEG_THICK
export const DIGIT_HEIGHT = 2 * SEG_LEN + 3 * SEG_THICK
export const COLON_DOT_SIZE = SEG_THICK
export const DIGITAL_FRAME_W = 4 * DIGIT_WIDTH + COLON_WIDTH + 3 * DIGIT_SPACING + 2 * LCD_FRAME_PADDING
export const DIGITAL_FRAME_H = DIGIT_HEIGHT + 2 * LCD_FRAME_PADDING
export const DIGITAL_FRAME_X = WATCH_CX - DIGITAL_FRAME_W / 2
export const DIGITAL_FRAME_Y = WATCH_CY - DIGITAL_FRAME_H / 2

// 7-Segment-Map (welche Segmente pro Ziffer leuchten)
export const DIGIT_SEGMENTS_MAP = {
  0: [0, 1, 2, 3, 4, 5], 1: [1, 2], 2: [0, 1, 6, 4, 3], 3: [0, 1, 6, 2, 3],
  4: [5, 6, 1, 2], 5: [0, 5, 6, 2, 3], 6: [0, 5, 4, 3, 2, 6], 7: [0, 1, 2],
  8: [0, 1, 2, 3, 4, 5, 6], 9: [0, 1, 2, 3, 5, 6],
}

// ── Diagramm-Optionen (Nutzerperspektive, HTML-kodiert mit <i> für Symbole) ──
export const singleGraphOptions = {
  'Bahnkurve': {
    yx: 'Bahn <i>y</i>(<i>x</i>)',
    xy: 'Bahn <i>x</i>(<i>y</i>)',
  },
  'Orts-Komponenten': {
    xt: 'x-Koordinate <i>x</i>(<i>t</i>) / m',
    yt: 'y-Koordinate <i>y</i>(<i>t</i>) / m',
  },
  'Geschwindigkeits-Komponenten': {
    vxt: 'Geschw. <i>v</i>ₓ(<i>t</i>) / (m/s)',
    vyt: 'Geschw. <i>v</i>ᵧ(<i>t</i>) / (m/s)',
  },
  'Beschleunigungs-Komponenten': {
    axt: 'Beschl. <i>a</i>ₓ(<i>t</i>) / (m/s²)',
    ayt: 'Beschl. <i>a</i>ᵧ(<i>t</i>) / (m/s²)',
  },
  'Beträge & Winkel': {
    vabs: 'Betrag |<i>v</i>(<i>t</i>)| / (m/s)',
    aabs: 'Betrag |<i>a</i>(<i>t</i>)| / (m/s²)',
    phit: 'Winkel <i>φ</i>(<i>t</i>) / °',
  },
}

export const stackedGraphOptions = {
  'Analyse': {
    pos: 'Ort (<i>x</i>/<i>y</i>)',
    vel: 'Geschwindigkeit (<i>v</i>ₓ/<i>v</i>ᵧ)',
    acc: 'Beschleunigung (<i>a</i>ₓ/<i>a</i>ᵧ)',
  },
}

// Stacked-Modus: je gewählter Größe → (top, bottom) Einzeltypen
export const stackedToTypes = {
  pos: ['xt', 'yt'],
  vel: ['vxt', 'vyt'],
  acc: ['axt', 'ayt'],
}

// Modus-Übersetzung Single↔Stacked (für Dropdown-Umschaltung)
export const singleToStackedMap = {
  xt: 'pos', yt: 'pos',
  vxt: 'vel', vyt: 'vel',
  axt: 'acc', ayt: 'acc',
  yx: 'pos', xy: 'pos',
  vabs: 'vel', aabs: 'acc', phit: 'pos',
}
export const stackedToSingleMap = { pos: 'xt', vel: 'vxt', acc: 'axt' }

// Kurze Titel je Graph-Typ (TextContent, letztes Symbol kursiv via setGraphTitle)
export const graphTitles = {
  yx: 'Bahnkurve y(x)',
  xy: 'Bahnkurve x(y)',
  xt: 'x-Koordinate x(t)',
  yt: 'y-Koordinate y(t)',
  vxt: 'Geschwindigkeit vₓ(t)',
  vyt: 'Geschwindigkeit vᵧ(t)',
  axt: 'Beschleunigung aₓ(t)',
  ayt: 'Beschleunigung aᵧ(t)',
  vabs: 'Betrag |v|(t)',
  aabs: 'Betrag |a|(t)',
  phit: 'Winkel φ(t)',
  pos: 'Ort (x, y)',
  vel: 'Geschwindigkeit (vₓ, vᵧ)',
  acc: 'Beschleunigung (aₓ, aᵧ)',
}

// Y-Achsenlabel je Typ (für setAxisLabel: „Größe / Einheit")
export const graphAxisLabels = {
  yx: 'y / m',
  xy: 'x / m',
  xt: 'x / m',
  yt: 'y / m',
  vxt: 'vₓ / (m/s)',
  vyt: 'vᵧ / (m/s)',
  axt: 'aₓ / (m/s²)',
  ayt: 'aᵧ / (m/s²)',
  vabs: '|v| / (m/s)',
  aabs: '|a| / (m/s²)',
  phit: 'φ / °',
}

// X-Achsenlabel: Zeit für Zeitreihen, Position für Bahnkurven
export const graphXAxisLabels = {
  yx: 'x / m',
  xy: 'y / m',
}

// Welche Typen Zeitreihen (x-Achse = t) vs. Bahnkurven (x-Achse = Position) sind
export const timeSeriesTypes = ['xt', 'yt', 'vxt', 'vyt', 'axt', 'ayt', 'vabs', 'aabs', 'phit']
export const trajectoryTypes = ['yx', 'xy']