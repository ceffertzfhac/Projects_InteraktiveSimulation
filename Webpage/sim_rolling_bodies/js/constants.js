/**
 * Physics simulation constants
 * @module constants
 */

// ══════════════════════════════════════════════════════════════════
//  PHYSICS CONSTANTS
// ══════════════════════════════════════════════════════════════════
export const G = 9.81;
export const DT = 1/240;
export const MASS = 1.0;
export const X_STOP = 5.0;
export const DRAW_X = 55.0;

// ══════════════════════════════════════════════════════════════════
//  SIMULATION LIMITS
// ══════════════════════════════════════════════════════════════════
export const MAX_SIM_DURATION = 45.0;
export const MIN_DURATION = 0.5;
export const DEFAULT_DURATION = 10;
export const MIN_ALPHA_RAD = 1e-6;

// ══════════════════════════════════════════════════════════════════
//  VIEWPORT CONFIG
// ══════════════════════════════════════════════════════════════════
export const SVG_W = 700;
export const SVG_H = 320;
export const SVG_PADDING_TOP = 32;
export const SVG_PADDING_BOTTOM = 44;
export const SVG_PADDING_LEFT = 38;
export const SVG_PADDING_RIGHT = 38;
export const SVG_MIN_PPM = 40;
export const SVG_MAX_PPM = 220;
export const VERT_SPAN_BUFFER = 2.2;

// ══════════════════════════════════════════════════════════════════
//  GRAPH CONFIG
// ══════════════════════════════════════════════════════════════════
export const GRAPH_PADDING = { t: 28, r: 20, b: 30, l: 56 };
export const GRAPH_Y_LABEL_OFFSET = 42;
export const GRAPH_X_TICK_COUNT = 8;
export const GRAPH_Y_TICK_COUNT = 6;

// ══════════════════════════════════════════════════════════════════
//  VECTOR SCALING
// ══════════════════════════════════════════════════════════════════
export const VEC_REF_PX = 60;
export const VEC_V_REF_PX = 40;
export const VEC_A_REF = 2.0;
export const VEC_A_MAX_PX = 50;
export const VEC_MIN_LEN = 3;
export const VEC_MAX_V_PX = 120;

// ══════════════════════════════════════════════════════════════════
//  TRACE DECIMATION
// ══════════════════════════════════════════════════════════════════
export const TRACE_EPSILON = 0.5;

// ══════════════════════════════════════════════════════════════════
//  UI TIMINGS
// ══════════════════════════════════════════════════════════════════
export const MJ_DEBOUNCE_MS = 300;
export const EXPORT_FEEDBACK_MS = 2000;
export const INIT_DELAY_MS = 80;

// ══════════════════════════════════════════════════════════════════
//  RAMP GEOMETRY
// ══════════════════════════════════════════════════════════════════

// ── STOPWATCH (kanonisches Design, Ref: Atwood v2.2.x / CLAUDE.md) ────────
export const SW_RADIUS    = 60;   // Hauptzifferblatt r
export const SW_HAND_LEN  = 50;   // Hauptzeiger-Länge
export const SW_SUB_R     = 13;   // Hilfszifferblatt r
export const SW_SUB_CY    = 25;   // Hilfszifferblatt y-Offset (12-Uhr-Reset)

export const RAMP_TICK_INTERVAL = 0.5;
export const RAMP_TICK_MAIN = 1.0;
export const RAMP_GRID_INTERVAL = 0.3;
export const RAMP_ARC_RADIUS = 35;
export const RAMP_START_MARKER_OFFSET = 90;

// ══════════════════════════════════════════════════════════════════
//  BODY TYPES
// ══════════════════════════════════════════════════════════════════
export const SUBJECTS = ['sp', 'p1', 'p2', 'p3', 'p4'];
export const QUANTITIES = ['x', 'y', 'vx', 'vy', 'vabs', 'ax', 'ay', 'aabs'];

export const SUBJ_COLORS = {
  sp: 'var(--c-sp)',
  p1: 'var(--c-p1)',
  p2: 'var(--c-p2)',
  p3: 'var(--c-p3)',
  p4: 'var(--c-p4)'
};

export const SUBJ_LABELS = {
  sp: 'SP (Schwerpunkt)',
  p1: 'P1 (Gelb)',
  p2: 'P2 (Blau)',
  p3: 'P3 (Grün)',
  p4: 'P4 (Rot)'
};

export const ALL_TYPES = [
  { key: 'solid_sphere',    label: 'Vollkugel',        color: '#7eccff' },
  { key: 'solid_cylinder',  label: 'Vollzylinder',     color: '#e8c547' },
  { key: 'thick_sphere',    label: 'Hohlkugel (echt)', color: '#52d68a' },
  { key: 'thick_cylinder',  label: 'Hohlzyl. (echt)',  color: '#f09a40' },
  { key: 'thin_sphere',     label: 'Hohlkugel (dünn)', color: '#b47dff' },
  { key: 'thin_cylinder',   label: 'Hohlzyl. (dünn)',  color: '#f07070' },
];

export const CMP_KEYS = new Set(['x', 'vabs', 'vx', 'vy', 'ax', 'ay', 'aabs', 'omega', 'alpha_w']);

export const GRAPH_OPTIONS = {
  x:      { label: 'Position x / m', unit: 'm' },
  y:      { label: 'Position y / m', unit: 'm' },
  vabs:   { label: 'Geschwindigkeitsbetrag |v| / (m/s)', unit: 'm/s' },
  vx:     { label: 'Geschwindigkeit v_x / (m/s)', unit: 'm/s' },
  vy:     { label: 'Geschwindigkeit v_y / (m/s)', unit: 'm/s' },
  aabs:   { label: 'Beschleunigungsbetrag |a| / (m/s²)', unit: 'm/s²' },
  ax:     { label: 'Beschleunigung a_x / (m/s²)', unit: 'm/s²' },
  ay:     { label: 'Beschleunigung a_y / (m/s²)', unit: 'm/s²' },
  omega:  { label: 'Winkelgeschwindigkeit ω / (rad/s)', unit: 'rad/s', body: true },
  alpha_w:{ label: 'Winkelbeschleunigung α_w / (rad/s²)', unit: 'rad/s²', body: true },
};
