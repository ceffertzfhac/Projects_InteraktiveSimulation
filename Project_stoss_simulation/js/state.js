'use strict'

// Einziger mutierbarer Zustand (kanonisch: alles in store, keine Modul-Globals).
export const store = {
  // Parameter (Rohwerte aus den Reglern)
  m1: 0.5,
  m2: 0.5,
  v1: 0.8,
  v2: -0.4,
  k: 50,
  speedFactor: 1.0,

  // Abgeleitet (in resetSim aus den Rohwerten gesetzt)
  m1Inf: false,
  m2Inf: false,
  kInf: false,

  // Visualisierung
  showVectors: true,
  showCom: true,
  graphType: 'v', // 'v' | 'a' | 'p' | 'E'

  // Animation
  animFrameId: null,
  lastFrameTime: 0,
  simulatedTime: 0,
  simDuration: 0,

  // Stoß-Kennwerte (aus physics.precompute)
  approaching: false,
  tContactStart: Infinity,
  tContactEnd: Infinity,
  collisionDt: 0,
  fMax: 0,
  v1Final: 0,
  v2Final: 0,

  // Precompute-Arrays (gefüllt von physics.precompute)
  t_data: [], x1_data: [], x2_data: [],
  v1_data: [], v2_data: [], a1_data: [], a2_data: [],
  p1_data: [], p2_data: [],
  ek1_data: [], ek2_data: [], es_data: [], etot_data: [],
  axisLimits: {},

  // Auto-Zoom/Pan (einmalig in resetSim aus den Precompute-Arrays berechnet)
  ppm: 90,
  panOffsetM: 0, // Weltkoordinate, die auf die SVG-Mitte abgebildet wird
}

export const DOM = {}

export function initDOM() {
  // Massen & Geschwindigkeiten
  DOM.m1Slider = document.getElementById('m1_slider')
  DOM.m2Slider = document.getElementById('m2_slider')
  DOM.v1Slider = document.getElementById('v1_slider')
  DOM.v2Slider = document.getElementById('v2_slider')
  DOM.kSlider  = document.getElementById('k_slider')
  DOM.m1Value  = document.getElementById('m1_value')
  DOM.m2Value  = document.getElementById('m2_value')
  DOM.v1Value  = document.getElementById('v1_value')
  DOM.v2Value  = document.getElementById('v2_value')
  DOM.kValue   = document.getElementById('k_value')

  // Visualisierung
  DOM.togVectors = document.getElementById('toggle_vectors')
  DOM.togCom     = document.getElementById('toggle_com')

  // Diagramm
  DOM.graphSelect = document.getElementById('graph_select')

  // Topbar
  DOM.playBtn  = document.getElementById('play_btn')
  DOM.pauseBtn = document.getElementById('pause_btn')
  DOM.resetBtn = document.getElementById('reset_btn')
  DOM.themeToggle = document.getElementById('theme_toggle')
  DOM.timeLabel   = document.getElementById('time_label')
  DOM.exportDiagram = document.getElementById('export_diagram_btn')
  DOM.exportAll     = document.getElementById('export_all_btn')
  DOM.speedRadios = document.querySelectorAll('input[name="speed"]')

  // Sim-SVG
  DOM.mainSvg     = document.getElementById('main_svg')
  DOM.trackGroup  = document.getElementById('track_group')
  DOM.springPath  = document.getElementById('spring_path')
  DOM.bumperLeft  = document.getElementById('bumper_left')
  DOM.bumperRight = document.getElementById('bumper_right')
  DOM.glider1Group = document.getElementById('glider1_group')
  DOM.glider1Rect  = document.getElementById('glider1_rect')
  DOM.glider1Label = document.getElementById('glider1_label')
  DOM.glider2Group = document.getElementById('glider2_group')
  DOM.glider2Rect  = document.getElementById('glider2_rect')
  DOM.glider2Label = document.getElementById('glider2_label')
  DOM.vVector1 = document.getElementById('v_vector1')
  DOM.vVector2 = document.getElementById('v_vector2')
  DOM.comMarker = document.getElementById('com_marker')
  DOM.swHand    = document.getElementById('stopwatch_main_hand')
  DOM.subHand   = document.getElementById('stopwatch_sub_hand')
  DOM.swMarks   = document.getElementById('stopwatch_marks')
  DOM.sdMarks   = document.getElementById('stopwatch_subdial_marks')

  // Graph-SVG
  DOM.graphSvg   = document.getElementById('graph_svg')
  DOM.gridGroup  = document.querySelector('.graph_grid')
  DOM.graphTitle = document.getElementById('graph_title')
  DOM.lineV1 = document.getElementById('line_v1')
  DOM.lineV2 = document.getElementById('line_v2')
  DOM.lineEs = document.getElementById('line_es')
  DOM.dotV1  = document.getElementById('dot_v1')
  DOM.dotV2  = document.getElementById('dot_v2')
  DOM.dotEs  = document.getElementById('dot_es')

  // Energie-/Impuls-Balken
  DOM.barE1 = document.getElementById('bar_e1')
  DOM.barE2 = document.getElementById('bar_e2')
  DOM.barEs = document.getElementById('bar_es')
  DOM.barP1 = document.getElementById('bar_p1')
  DOM.barP2 = document.getElementById('bar_p2')
  DOM.momNote = document.getElementById('momentum_note')

  // Live-Analyse
  DOM.liveT  = document.getElementById('live_t')
  DOM.liveV1 = document.getElementById('live_v1')
  DOM.liveV2 = document.getElementById('live_v2')
  DOM.liveA1 = document.getElementById('live_a1')
  DOM.liveA2 = document.getElementById('live_a2')
  DOM.liveDt   = document.getElementById('live_dt')
  DOM.liveFmax = document.getElementById('live_fmax')
  DOM.liveV1p  = document.getElementById('live_v1_prime')
  DOM.liveV2p  = document.getElementById('live_v2_prime')

  // Layout
  DOM.appLayout = document.querySelector('.app-layout')
  DOM.analysisToggle = document.getElementById('analysis_toggle')
}
