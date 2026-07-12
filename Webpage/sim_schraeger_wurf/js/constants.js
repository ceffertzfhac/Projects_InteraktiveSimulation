'use strict'

// ── Physik ──────────────────────────────────────────────────────────────────
export const G = 9.8 // Erdbeschleunigung (m/s²) — wie v47-Prototyp
export const TIME_STEP = 1 / 60 // Physik-Zeitschritt (60 Hz)

// ── Pixel-Skalierung ─────────────────────────────────────────────────────────
// So kalibriert, dass der Standardwurf (h0=10, v0=10, α=45°) Zoom 1,00× entspricht.
export const DEFAULT_PIXELS_PER_METER = 11.86
export const PIXELS_PER_VELOCITY_UNIT = 4
export const PIXELS_PER_ACCELERATION_UNIT = 5
export const BALL_RADIUS_BASE_PX = 5

// ── Animations-Layout (SVG-Koordinaten) ──────────────────────────────────────
export const GROUND_PX = 440
export const BALL_START_X_PX = 136
export const ANIM_W = 350
export const ANIM_H = 480

// ── Diagramm-Geometrie ───────────────────────────────────────────────────────
export const GRAPH_W = 480
export const GRAPH_H = 410
export const GRAPH_H_STACKED = 210
export const GRAPH_SINGLE_TRANSLATE = { x: 400, y: 40 }
export const GRAPH_STACKED_TOP_TRANSLATE = { x: 400, y: 20 }
export const GRAPH_STACKED_BOTTOM_TRANSLATE = { x: 400, y: 255 }

// ── Stoppuhr (Analog, aus v47) ───────────────────────────────────────────────
export const WATCH_CX = 280
export const WATCH_CY = 120
export const WATCH_R = 72
export const SDIAL_CX = 280
export const SDIAL_CY = 150
export const SDIAL_R = 16
export const STOPWATCH_TRANSFORM = 'translate(84, -24) scale(0.595)'

// ── Strichmännchen-Proportionen (in Metern) ──────────────────────────────────
export const SF_HEAD_RADIUS_M = 0.15
export const SF_TORSO_HEIGHT_M = 0.7
export const SF_LEG_HEIGHT_M = 0.9
export const SF_ARM_LENGTH_M = 0.8
export const SF_SHOULDER_TO_FEET_M = SF_TORSO_HEIGHT_M + SF_LEG_HEIGHT_M

// ── LCD-Digitaluhr (Easteregg, aus v47) ──────────────────────────────────────
export const DIGITAL_DISPLAY_SCALE_FACTOR = 0.85
export const SEG_THICK_BASE = 6
export const SEG_LEN_BASE = 40
export const DIGIT_SPACING_BASE = 5
export const COLON_WIDTH_BASE = 10
export const COLON_DOT_SIZE_BASE = SEG_THICK_BASE * 1.5
export const LCD_FRAME_PADDING_BASE = 10
export const WIDENING_FACTOR = 1.0

export const SEG_THICK = SEG_THICK_BASE * DIGITAL_DISPLAY_SCALE_FACTOR
export const SEG_LEN = SEG_LEN_BASE * DIGITAL_DISPLAY_SCALE_FACTOR
export const COLON_DOT_SIZE = COLON_DOT_SIZE_BASE * DIGITAL_DISPLAY_SCALE_FACTOR
export const LCD_FRAME_PADDING = LCD_FRAME_PADDING_BASE * DIGITAL_DISPLAY_SCALE_FACTOR
export const DIGIT_WIDTH = SEG_LEN + 2 * SEG_THICK
export const DIGIT_HEIGHT = 2 * SEG_LEN + 3 * SEG_THICK
const _INITIAL_CONTENT_W = (4 * DIGIT_WIDTH) + (COLON_WIDTH_BASE * DIGITAL_DISPLAY_SCALE_FACTOR)
  + (3 * DIGIT_SPACING_BASE * DIGITAL_DISPLAY_SCALE_FACTOR)
const _ADDED = _INITIAL_CONTENT_W * WIDENING_FACTOR - _INITIAL_CONTENT_W
export const DIGIT_SPACING = (DIGIT_SPACING_BASE * DIGITAL_DISPLAY_SCALE_FACTOR) + (_ADDED / 4)
export const COLON_WIDTH = (COLON_WIDTH_BASE * DIGITAL_DISPLAY_SCALE_FACTOR) + (_ADDED / 4)
export const DIGITAL_FRAME_WIDTH = _INITIAL_CONTENT_W * WIDENING_FACTOR + (2 * LCD_FRAME_PADDING)
export const DIGITAL_FRAME_HEIGHT = DIGIT_HEIGHT + (2 * LCD_FRAME_PADDING)
export const DIGITAL_FRAME_X = WATCH_CX - (DIGITAL_FRAME_WIDTH / 2)
export const DIGITAL_FRAME_Y = WATCH_CY - (DIGITAL_FRAME_HEIGHT / 2)

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
  'Vertikale Bewegung': {
    yt: 'Höhe <i>y</i>(<i>t</i>) / m',
    vyt: 'Geschw. <i>v</i>ᵧ(<i>t</i>) / (m/s)',
    ayt: 'Beschl. <i>a</i>ᵧ(<i>t</i>) / (m/s²)',
  },
  'Horizontale Bewegung': {
    xt: 'Wurfweite <i>x</i>(<i>t</i>) / m',
    vxt: 'Geschw. <i>v</i>ₓ(<i>t</i>) / (m/s)',
    axt: 'Beschl. <i>a</i>ₓ(<i>t</i>) / (m/s²)',
  },
  'Beträge': {
    vabs: 'Betrag der Geschw. |<i>v</i>(<i>t</i>)| / (m/s)',
  },
}

export const stackedGraphOptions = {
  'Analyse': {
    pos: 'Ort (<i>x</i>/<i>y</i>)',
    vel: 'Geschwindigkeit (<i>v</i>ₓ/<i>v</i>ᵧ)',
    acc: 'Beschleunigung (<i>a</i>ₓ/<i>a</i>ᵧ)',
  },
}

// Modus-Übersetzung zwischen Single- und Stacked-Ansicht
export const singleToStackedMap = {
  yt: 'pos', xt: 'pos', vyt: 'vel', vxt: 'vel', vabs: 'vel',
  ayt: 'acc', axt: 'acc', yx: 'pos', xy: 'pos',
}
export const stackedToSingleMap = { pos: 'yt', vel: 'vyt', acc: 'ayt' }