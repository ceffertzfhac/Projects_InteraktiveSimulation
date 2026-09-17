'use strict'

// Zentraler Store: ALLE mutablen Werte leben ausschließlich hier (keine
// Modul-Globals irgendwo sonst). physics.js/render.js/ui.js lesen und schreiben
// nur über dieses Objekt.
export const store = {
  // — Eingabeparameter (von den Slidern gesetzt, SI-Einheiten) —
  a_cm: 1.9,        // Lochposition Kante→Loch [cm]
  l_cm: 32.0,       // Lineallänge [cm]
  b_cm: 3.7,        // Linealbreite [cm]
  phi0: 20 * Math.PI / 180,  // Anfangsauslenkung [rad]
  m_g: 8.5,         // Masse [g]
  model: 'linear',  // 'linear' (kleine-Winkel-Näherung) | 'exact' (nichtlinear)
  graphType: 'phi', // 'phi' | 'omega' | 'alpha' | 'energy'
  speedFactor: 1.0, // Abspieltempo

  // — Abgeleitete Größen (recomputeDerived in physics.js) —
  s: 0,             // m — Abstand Achse→Schwerpunkt = l/2 − a
  m: 0,             // kg — Masse (für Energie; kürzt in T)
  I_S: 0,           // kg·m² — Trägheitsmoment um Schwerpunkt
  I_A: 0,           // kg·m² — Trägheitsmoment um die Achse (Steiner)
  omega0: 0,        // rad/s — kleine-Winkel-Kreisfrequenz
  T_linear: 0,      // s — Periodendauer (kleine Winkel)
  T_exact: 0,       // s — Periodendauer (exakt, elliptisch)
  stable: true,     // false → Achse unterhalb Schwerpunkt (keine Schwingung)

  // — precompute()-Ergebnis-Arrays (gefüllt in physics.js) —
  t_data: [], phi_data: [], omega_data: [], alpha_data: [],
  ekin_data: [], epot_data: [], eges_data: [],
  t_end: 0,         // s — Fensterende = N·T (Schwingung periodisch → Loop)

  // — Zeichenskalen des Diagramms (von drawGraph befüllt, von updateScene für den
  //   Wiedergabe-Marker und von updateGraphHover für den Hover-Cursor gelesen —
  //   eine Quelle der Wahrheit, sonst Drift zwischen Zeichnung und Hover,
  //   → BACKLOG I13.1 / Anleitung §4 „Hover-Werte am Zeit-Diagramm") —
  graphScale: null,   // { tMax, gw, scX, scY, series:[{arr,color,unit}] , symmetric }

  // — Hover-Werte (I13.1) —
  hoverActive: false,
  hoverLocalX: null,

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
  // Steuerung — Slider
  DOM.aSlider     = q('a_slider')
  DOM.lSlider     = q('l_slider')
  DOM.bSlider     = q('b_slider')
  DOM.phi0Slider  = q('phi0_slider')
  DOM.mSlider     = q('m_slider')
  DOM.aValue      = q('a_value')
  DOM.lValue      = q('l_value')
  DOM.bValue      = q('b_value')
  DOM.phi0Value   = q('phi0_value')
  DOM.mValue      = q('m_value')
  // Modell-Umschaltung
  DOM.modelRadios = document.querySelectorAll('input[name="model"]')
  // Diagramm & Visualisierung
  DOM.graphSelect = q('graph_select')
  DOM.togGrav     = q('tog_grav')
  DOM.togVel      = q('tog_vel')
  DOM.speedRadios = document.querySelectorAll('input[name="speed"]')
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
  DOM.sceneStatic = q('scene_static')
  DOM.rulerGroup  = q('ruler_group')
  DOM.angleArc    = q('angle_arc')
  DOM.angleLabel  = q('angle_label')
  DOM.gravVector  = q('grav_vector')
  DOM.velVector   = q('vel_vector')
  // SVG-Diagramm
  DOM.gridGroup    = q('grid_group')
  DOM.graphLines   = q('graph_lines')          // <g> mit einer <polyline> je Serie
  DOM.graphMarkers = q('graph_markers')        // <g> mit einem Wiedergabe-Marker je Serie
  DOM.graphTitle   = q('graph_title')
  // Hover-Werte (I13.1, §4): Cursor + Ring-Punkte + Tooltip + Hit-Rect
  DOM.graphHitRect     = q('graph_hit_rect')
  DOM.hoverLine        = q('graph_hover_line')
  DOM.hoverPoints      = q('graph_hover_points')   // <g> mit einem Ring-Punkt je Serie
  DOM.hoverTooltip     = q('graph_hover_tooltip')
  DOM.hoverTooltipBg   = q('graph_hover_tooltip_bg')
  DOM.hoverTooltipText = q('graph_hover_tooltip_text')
  // Live-Panel
  DOM.timeLabel = q('time_label')
  DOM.liveT     = q('live_t')
  DOM.livePhi   = q('live_phi')
  DOM.liveOmega = q('live_omega')
  DOM.liveAlpha = q('live_alpha')
  DOM.liveTperiod = q('live_T')
  DOM.liveS     = q('live_s')
}