'use strict'

// Zentraler Store: ALLE mutablen Werte leben ausschließlich hier (keine
// Modul-Globals irgendwo sonst). physics.js/render.js/ui.js lesen und schreiben
// nur über dieses Objekt.
export const store = {
  // — Eingabeparameter (von den Slidern gesetzt) —
  v0: 2,            // m/s  — Anfangsgeschwindigkeit
  a:  1,            // m/s² — konstante Beschleunigung
  graphType: 'ort', // 'ort' | 'geschw' | 'beschl'
  speedFactor: 1.0, // Abspieltempo

  // — precompute()-Ergebnis-Arrays (gefüllt in physics.js) —
  t_data: [], x_data: [], v_data: [], a_data: [],
  t_end: 0,         // s — Endzeit (Bahnende erreicht oder T_MAX)

  // — Zeichenskalen des Diagramms (von drawGraph gesetzt, von updateScene gelesen) —
  gScale: null,     // { scX, scY, arr }

  // — Animations-Laufzeit —
  aniFrameId: null,
  lastFrameTime: 0,
  simulatedTime: 0,
}

// DOM-Element-Cache — einmalig in initDOM() gefüllt (kein document.* zur Laufzeit
// im Modul-Rumpf → physics.js bleibt DOM-frei und in Node importierbar/testbar).
export const DOM = {}

export function initDOM() {
  const q = id => document.getElementById(id)
  // Steuerung
  DOM.v0Slider     = q('v0_slider')
  DOM.aSlider      = q('a_slider')
  DOM.v0Value      = q('v0_value')
  DOM.aValue       = q('a_value')
  DOM.graphSelect  = q('graph_select')
  DOM.togVel       = q('tog_vel')
  DOM.togAcc       = q('tog_acc')
  DOM.speedRadios  = document.querySelectorAll('input[name="speed"]')
  // Topbar
  DOM.playBtn      = q('play_btn')
  DOM.pauseBtn     = q('pause_btn')
  DOM.resetBtn     = q('reset_btn')
  DOM.themeToggle  = q('theme_toggle')
  DOM.exportDiagram = q('export_diagram_btn')
  DOM.exportAll     = q('export_all_btn')
  // Panel-Klappmechanik
  DOM.appLayout      = document.querySelector('.app-layout')
  DOM.analysisToggle = q('analysis_toggle')
  // SVG-Simulation
  DOM.ball       = q('ball')
  DOM.velVector  = q('vel_vector')
  DOM.accVector  = q('acc_vector')
  DOM.rulerGroup = q('ruler_group')
  // SVG-Diagramm
  DOM.gridGroup  = q('grid_group')
  DOM.graphLine  = q('graph_line')
  DOM.graphPoint = q('graph_point')
  DOM.graphTitle = q('graph_title')
  // Live-Panel
  DOM.timeLabel = q('time_label')
  DOM.liveT = q('live_t')
  DOM.liveX = q('live_x')
  DOM.liveV = q('live_v')
  DOM.liveA = q('live_a')
}
