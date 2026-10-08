'use strict'

import { SPEED_DEFAULT } from './constants.js'

// Zentraler Store: ALLE mutablen Werte leben ausschließlich hier.
export const store = {
  // — Eingaben —
  graphType: 'ort',           // 'ort' | 'geschw' | 'beschl'
  speedFactor: SPEED_DEFAULT, // Abspieltempo (Sim-Sekunden pro Echtzeit-Sekunde)
  toggles: {
    haltestellen: false,      // gestrichelte Horizontale an H1…H4 (nur Ort-Zeit)
    ereignisse: false,        // gepunktete Vertikale an Ankunft/Abfahrt
    ableselinien: false,      // Lot vom Kurvenpunkt auf beide Achsen
    phasen: false,            // Kurve nach Bewegungsphase einfärben
  },

  // — precompute()-Ergebnis —
  phases: [],
  t_data: [], x_data: [], v_data: [], a_data: [], phase_idx: [],
  t_end: 0,

  // — Diagrammskala (von drawGraph befüllt; einzige Quelle der Wahrheit für
  //   Wiedergabe-Marker, Ableselinien und Hover) —
  graphScale: null,           // { tMax, gw, scX, scY, arr, y0 }

  // — Hover-Werte (I13.1) —
  hoverActive: false,
  hoverLocalX: null,

  // — Animations-Laufzeit —
  aniFrameId: null,
  lastFrameTime: 0,
  simulatedTime: 0,
}

export const DOM = {}

export function initDOM() {
  const q = id => document.getElementById(id)
  // Steuerung
  DOM.tSlider      = q('t_slider')
  DOM.tValue       = q('t_value')
  DOM.graphSelect  = q('graph_select')
  DOM.toggles = {
    haltestellen: q('tog_haltestellen'),
    ereignisse:   q('tog_ereignisse'),
    ableselinien: q('tog_ableselinien'),
    phasen:       q('tog_phasen'),
  }
  DOM.rowHaltestellen = q('row_haltestellen')
  DOM.speedRadios  = document.querySelectorAll('input[name="speed"]')
  // Topbar
  DOM.playBtn       = q('play_btn')
  DOM.pauseBtn      = q('pause_btn')
  DOM.resetBtn      = q('reset_btn')
  DOM.themeToggle   = q('theme_toggle')
  DOM.exportDiagram = q('export_diagram_btn')
  DOM.exportAll     = q('export_all_btn')
  // Panel-Klappmechanik
  DOM.appLayout      = document.querySelector('.app-layout')
  DOM.analysisToggle = q('analysis_toggle')
  // SVG: Straße
  DOM.streetGroup = q('street_group')
  DOM.bus         = q('bus')
  // SVG: Diagramm
  DOM.gridGroup    = q('grid_group')
  DOM.overlayGroup = q('overlay_group')
  DOM.curveGroup   = q('curve_group')
  DOM.dropGroup    = q('drop_group')
  DOM.graphPoint   = q('graph_point')
  DOM.graphTitle   = q('graph_title')
  DOM.graphHitRect     = q('graph_hit_rect')
  DOM.hoverLine        = q('graph_hover_line')
  DOM.hoverPoint       = q('graph_hover_point')
  DOM.hoverTooltip     = q('graph_hover_tooltip')
  DOM.hoverTooltipBg   = q('graph_hover_tooltip_bg')
  DOM.hoverTooltipText = q('graph_hover_tooltip_text')
  // Live-Panel
  DOM.timeLabel = q('time_label')
  DOM.liveT     = q('live_t')
  DOM.liveX     = q('live_x')
  DOM.liveV     = q('live_v')
  DOM.liveA     = q('live_a')
  DOM.livePhase = q('live_phase')
  DOM.liveStop  = q('live_stop')
}
