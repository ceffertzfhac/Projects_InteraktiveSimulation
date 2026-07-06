'use strict'

import { DEFAULT_PIXELS_PER_METER } from './constants.js'

// ── Mutierbarer Zustand (einzige Quelle für alle veränderlichen Werte) ───────
export const store = {
  // Parameter
  R: 1.5,                // Radius (m)
  phi0Deg: 0,           // Anfangswinkel (°)
  omegaDeg: 60,         // Winkelgeschwindigkeit (°/s)
  speedFactor: 1.0,
  graphType: 'yx',      // Single-Modus-Typ
  stackedType: 'pos',   // Stacked-Modus-Gruppe
  isStacked: false,
  isDigitalDisplay: false,

  // Abgeleitet
  omega: 0,             // Winkelgeschwindigkeit (rad/s)
  T: Infinity,          // Umlaufperiodendauer (s)

  // Skalierung (zoom)
  currentPixelsPerMeter: DEFAULT_PIXELS_PER_METER,
  zoomFactor: 1,

  // Timing
  visualTime: 0,        // Visualisationszeit (s) — läuft immer
  simulatedTime: 0,     // Sim-/Graphenzeit (s)

  // Animation
  aniFrameId: null,
  lastFrameTime: 0,

  // Visualisierungs-Toggles
  showPositionVector: true,
  showPositionComponents: false,
  showVelocityVector: true,
  showVelocityComponents: false,
  showAccelerationVector: true,
  showAccelerationComponents: false,
  showTrajectory: true,

  // Precompute-Zeitreihen
  tData: [],
  xData: [],
  yData: [],
  vxData: [],
  vyData: [],
  axData: [],
  ayData: [],
  vabsData: [],
  aabsData: [],
  phitData: [],
  axisLimits: {},
}

// ── DOM-Cache ────────────────────────────────────────────────────────────────
export const DOM = {}

const q = id => document.getElementById(id)

export function initDOM() {
  // SVG-Container
  DOM.mainSvg = q('main_svg')
  DOM.centerArea = q('center_area')
  DOM.animationCoordSystem = q('animation_coord_system')
  DOM.disk = q('disk')
  DOM.trajectoryPath = q('trajectory_path')
  DOM.point = q('point')
  DOM.zoomTextDisplay = q('zoom_text_display')

  // Vektoren (Hauptvektoren + Komponenten)
  DOM.positionVector = q('position_vector')
  DOM.positionVectorX = q('position_vector_x')
  DOM.positionVectorY = q('position_vector_y')
  DOM.velocityVector = q('velocity_vector')
  DOM.velocityVectorX = q('velocity_vector_x')
  DOM.velocityVectorY = q('velocity_vector_y')
  DOM.accelerationVector = q('acceleration_vector')
  DOM.accelerationVectorX = q('acceleration_vector_x')
  DOM.accelerationVectorY = q('acceleration_vector_y')

  // Stoppuhr
  DOM.stopwatch = q('stopwatch')
  DOM.stopwatchCircle = q('stopwatch_circle')
  DOM.stopwatchMarks = q('stopwatch_marks')
  DOM.subdial = q('subdial')
  DOM.subdialMarks = q('subdial_marks')
  DOM.mainHand = q('stopwatch_main_hand')
  DOM.subHand = q('stopwatch_sub_hand')
  DOM.digitalDisplayGroup = q('digital_display_group')

  // Graph — Single
  DOM.graphSvg = q('graph_svg')
  DOM.graphGroupSingle = q('graph_group_single')
  DOM.graphTitle = q('graph_title')
  DOM.gridGroup = q('grid_group')
  DOM.graphLine = q('graph_line')
  DOM.graphPoint = q('graph_point')

  // Graph — Stacked Top
  DOM.graphGroupStackedTop = q('graph_group_stacked_top')
  DOM.graphTitleTop = q('graph_title_top')
  DOM.gridGroupTop = q('grid_group_top')
  DOM.graphLineTop = q('graph_line_top')
  DOM.graphPointTop = q('graph_point_top')

  // Graph — Stacked Bottom
  DOM.graphGroupStackedBottom = q('graph_group_stacked_bottom')
  DOM.graphTitleBottom = q('graph_title_bottom')
  DOM.gridGroupBottom = q('grid_group_bottom')
  DOM.graphLineBottom = q('graph_line_bottom')
  DOM.graphPointBottom = q('graph_point_bottom')

  DOM.graphSelect = q('graph_select')

  // Slider & Toggles
  DOM.radiusSlider = q('radius_slider')
  DOM.phi0Slider = q('phi0_slider')
  DOM.omegaSlider = q('omega_slider')
  DOM.radiusValue = q('radius_value')
  DOM.phi0Value = q('phi0_value')
  DOM.omegaValue = q('omega_value')
  DOM.speedRadios = document.querySelectorAll('input[name="speed"]')
  DOM.togPositionVector = q('toggle_position_vector')
  DOM.togPositionComponents = q('toggle_position_components')
  DOM.togVelocityVector = q('toggle_velocity_vector')
  DOM.togVelocityComponents = q('toggle_velocity_components')
  DOM.togAccelerationVector = q('toggle_acceleration_vector')
  DOM.togAccelerationComponents = q('toggle_acceleration_components')
  DOM.togTrajectory = q('toggle_trajectory')
  DOM.togStacked = q('toggle_xy_stacked')

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
  DOM.livePhi = q('live_phi')
  DOM.liveX = q('live_x')
  DOM.liveY = q('live_y')
  DOM.liveVx = q('live_vx')
  DOM.liveVy = q('live_vy')
  DOM.liveVabs = q('live_vabs')
  DOM.liveAx = q('live_ax')
  DOM.liveAy = q('live_ay')
  DOM.liveAabs = q('live_aabs')
  DOM.liveTper = q('live_T')
  DOM.liveOmega = q('live_omega')
  DOM.liveF = q('live_f')
}