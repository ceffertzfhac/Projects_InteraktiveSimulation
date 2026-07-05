'use strict'

// ── Mutierbarer Zustand (einzige Quelle für alle veränderlichen Werte) ───────
export const store = {
  // Parameter
  m: 2.0,                // Masse (kg)
  k: 40,                 // Federkonstante (N/m)
  amplitude: 0.8,        // Anfangsauslenkung (m)
  oscillationMode: 'horizontal', // 'horizontal' | 'vertical'
  graphType: 'pos_t',    // 'pos_t' | 'v_t' | 'a_t'
  speedFactor: 1.0,

  // Abgeleitet
  omega: 0,              // Kreisfrequenz (rad/s)
  T: Infinity,           // Periodendauer (s)

  // Timing
  visualTime: 0,         // Visualisationszeit (s) — läuft immer
  simulatedTime: 0,      // Sim-/Graphenzeit (s) — nur wenn nicht manuell oder nach Start
  isManualTiming: false,
  isTimingStarted: false,
  isDigitalDisplay: false,

  // Animation
  aniFrameId: null,
  lastFrameTime: 0,
  currentMassRenderSize: 60,
  centers: null,         // { animCenterX, animCenterY, springAttachX, springAttachY }

  // Precompute-Zeitreihen
  tData: [],
  xData: [],
  vData: [],
  aData: [],
  axisLimits: {},
}

// ── DOM-Cache ────────────────────────────────────────────────────────────────
export const DOM = {}

const q = id => document.getElementById(id)

export function initDOM() {
  // Anker & Referenzlinien
  DOM.anchorObject = q('anchor_object')
  DOM.surface = q('surface')
  DOM.equilibriumLine = q('equilibrium_line')
  DOM.equilibriumLabel = q('equilibrium_label')
  DOM.unstretchedLine = q('unstretched_length_line')
  DOM.unstretchedLabel = q('unstretched_length_label')
  DOM.minPosLine = q('min_pos_line')
  DOM.maxPosLine = q('max_pos_line')
  DOM.minPosLabel = q('min_pos_label')
  DOM.maxPosLabel = q('max_pos_label')
  DOM.spring = q('spring')
  DOM.mass = q('mass')
  DOM.positionVector = q('position_vector')
  DOM.velocityVector = q('velocity_vector')
  DOM.accelerationVector = q('acceleration_vector')
  DOM.xAxisArrow = q('x_axis_arrow')
  DOM.xAxisLabelText = q('x_axis_label_text')
  DOM.yAxisArrow = q('y_axis_arrow')
  DOM.yAxisLabelText = q('y_axis_label_text')

  // Stoppuhr
  DOM.stopwatch = q('stopwatch')
  DOM.stopwatchCircle = q('stopwatch_circle')
  DOM.stopwatchMarks = q('stopwatch_marks')
  DOM.subdial = q('subdial')
  DOM.subdialMarks = q('subdial_marks')
  DOM.mainHand = q('stopwatch_main_hand')
  DOM.subHand = q('stopwatch_sub_hand')
  DOM.digitalDisplayGroup = q('digital_display_group')

  // Manuelle Zeitmessung
  DOM.startTimingContainer = q('start_timing_container')
  DOM.startTimingButton = q('start_timing_button')

  // Graph
  DOM.gridGroup = q('grid_group')
  DOM.graphTitle = q('graph_title')
  DOM.graphLine = q('graph_line')
  DOM.graphPoint = q('graph_point')
  DOM.graphSelect = q('graph_select')

  // Slider & Toggles
  DOM.massSlider = q('mass_slider')
  DOM.kSlider = q('k_slider')
  DOM.pos0Slider = q('pos0_slider')
  DOM.massValue = q('mass_value')
  DOM.kValue = q('k_value')
  DOM.pos0Value = q('pos0_value')
  DOM.pos0Label = q('pos0_label')
  DOM.orientationRadios = document.querySelectorAll('input[name="orientation"]')
  DOM.speedRadios = document.querySelectorAll('input[name="speed"]')
  DOM.togPosition = q('toggle_position_vector')
  DOM.togVelocity = q('toggle_velocity_vector')
  DOM.togAcceleration = q('toggle_acceleration_vector')
  DOM.togManualTiming = q('toggle_manual_timing')

  // Topbar
  DOM.playBtn = q('play_btn')
  DOM.pauseBtn = q('pause_btn')
  DOM.resetBtn = q('reset_btn')
  DOM.exportDiagram = q('export_diagram_btn')
  DOM.exportAll = q('export_all_btn')
  DOM.themeToggle = q('theme_toggle')

  // Layout
  DOM.appLayout = q('app_layout')
  DOM.analysisToggle = q('analysis_toggle')
  DOM.timeLabel = q('time_label')

  // Live-Panel
  DOM.liveT = q('live_t')
  DOM.liveX = q('live_x')
  DOM.liveV = q('live_v')
  DOM.liveA = q('live_a')
  DOM.liveTper = q('live_T')
  DOM.liveOmega = q('live_omega')
  DOM.liveF = q('live_f')
  DOM.liveEkin = q('live_ekin')
  DOM.liveEpot = q('live_epot')
  DOM.liveEtot = q('live_etot')
}