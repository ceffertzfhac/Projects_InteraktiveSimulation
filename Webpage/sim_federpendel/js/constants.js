'use strict'

// ── Physik ──────────────────────────────────────────────────────────────────
export const G = 9.81                         // Erdbeschleunigung (m/s²)
export const PIXELS_PER_METER = 100           // px pro m in der Animation
export const L0 = 2.2                         // ungedehnte Federlänge (m)
export const TIME_STEP = 1 / 60               // Physik-Zeitschritt (60 Hz)

// ── Vektor-Skalierung ────────────────────────────────────────────────────────
export const PIXELS_PER_VELOCITY_UNIT = 30    // px pro (m/s)
export const PIXELS_PER_ACCELERATION_UNIT = 5 // px pro (m/s²)
// Kanonische Pfeilspitzen-Geometrie (CLAUDE.md): Marker refX=0 + Schaft-Kürzung
// um markerWidth·strokeWidth. Vektor-Marker (arrowhead-pos/-vel/-acc): markerWidth=5,
// stroke-width=2.5 (s. index.html) → Marker-Länge 12.5 px. B22.
export const ARROW_MW = 5, VEC_STROKE = 2.5
export const VEC_MARKER_LEN = ARROW_MW * VEC_STROKE  // 12.5 px

// ── Animationsfläche (SVG-Koordinaten) ───────────────────────────────────────
export const ANIM_W = 450
export const ANIM_H = 480
export const ANCHOR_OFFSET_FROM_EDGE = 10     // Abstand Anker vom Rand (px)
export const ANCHOR_THICKNESS = 30            // Dicke des Ankers (px)
export const ANCHOR_CROSS_DIMENSION = 100     // Breite/Höhe senkrecht zur Schwingung (px)

// ── Masse-Rendering ──────────────────────────────────────────────────────────
export const INITIAL_MASS_SIZE = 60           // max. visuelle Massengröße (px)
export const MIN_MASS_SIZE = 30               // min. visuelle Massengröße (px)
export const MASS_MIN = 0.5, MASS_MAX = 5.0   // Slider-Grenzen Masse (kg)
export const K_MIN = 5, K_MAX = 80            // Slider-Grenzen Federkonstante (N/m)
export const POS0_MIN = -1.5, POS0_MAX = 1.5  // Slider-Grenzen Anfangsauslenkung (m)

// ── Diagramm-Geometrie ───────────────────────────────────────────────────────
export const GRAPH_W = 700
export const GRAPH_H = 410

// ── Stoppuhr (Gruppen-Transform: translate(250,60) scale(0.595)) ─────────────
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
export const graphOptions = {
  'Verlauf': {
    pos_t: 'Auslenkung <i>x</i>(<i>t</i>) / m',
    v_t:   'Geschw. <i>v</i>(<i>t</i>) / (m/s)',
    a_t:   'Beschl. <i>a</i>(<i>t</i>) / (m/s²)',
  },
}

// Kurze Titel je Graph-Typ (TextContent, letztes Symbol kursiv via setGraphTitle)
export const graphTitles = {
  pos_t:      'Auslenkung vs. Zeit x(t)',
  v_t:        'Geschwindigkeit vs. Zeit v(t)',
  a_t:        'Beschleunigung vs. Zeit a(t)',
  ekin:       'Kinetische Energie E_kin(t)',
  epot:       'Potentielle Energie E_pot(t)',
  eges:       'Gesamtenergie E_ges(t)',
  ecomposite: 'Energie (E_kin, E_pot, E_ges)',
}

// Y-Achsenlabel je Typ (für setAxisLabel: „Größe / Einheit")
export const graphAxisLabels = {
  horizontal: {
    pos_t: 'Auslenkung x / m',
    v_t:   'Geschw. v / (m/s)',
    a_t:   'Beschl. a / (m/s²)',
    ekin:       'E_kin / J',
    epot:       'E_pot / J',
    eges:       'E_ges / J',
    ecomposite: 'E / J',
  },
  vertical: {
    pos_t: 'Auslenkung y / m',
    v_t:   'Geschw. v / (m/s)',
    a_t:   'Beschl. a / (m/s²)',
    ekin:       'E_kin / J',
    epot:       'E_pot / J',
    eges:       'E_ges / J',
    ecomposite: 'E / J',
  },
}

export const quantityUnits = { pos_t: 'm', v_t: 'm/s', a_t: 'm/s²' }