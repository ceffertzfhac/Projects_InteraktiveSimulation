'use strict'

export const store = {
  // Parameter
  h0: 10,
  v0: 10,
  alphaDeg: 45,
  v0x: 0,
  v0y: 0,
  speedFactor: 1.0,
  yAxisConfig: { direction: 'up', origin: 'ground' },
  graphType: 'yt',
  isStacked: false,
  isDigitalDisplay: false,

  // Skalierung
  currentPixelsPerMeter: 11.86,
  zoomFactor: 1.0,

  // Precompute-Zeitreihen
  tData: [], xtData: [], ytData: [], vxtData: [], vytData: [],
  axtData: [], aytData: [], vabsData: [],
  axisLimits: {},

  // RAF-Bookkeeping
  aniFrameId: null,
  lastFrameTime: 0,
  simulatedTime: 0,
}

export const DOM = {}

export function initDOM() {
  const q = id => document.getElementById(id)
  DOM.building = q('building')
  DOM.stickFigure = q('stick_figure')
  DOM.ball = q('ball')
  DOM.rulerGroup = q('ruler_group')
  DOM.horizontalRulerGroup = q('horizontal_ruler_group')
  DOM.animationCoordSystem = q('animation_coord_system')
  DOM.trajectoryLine = q('trajectory_line')
  DOM.velVector = q('velocity_vector')
  DOM.velVectorX = q('velocity_vector_x')
  DOM.velVectorY = q('velocity_vector_y')
  DOM.accVector = q('acceleration_vector')
  DOM.stopwatch = q('stopwatch')
  DOM.stopwatchCircle = q('stopwatch_circle')
  DOM.mainHand = q('stopwatch_main_hand')
  DOM.subHand = q('stopwatch_sub_hand')
  DOM.stopwatchMarks = q('stopwatch_marks')
  DOM.subdial = q('subdial')
  DOM.subdialMarks = q('subdial_marks')
  DOM.digitalDisplayGroup = q('digital_display_group')
  DOM.zoomTextDisplay = q('zoom_text_display')

  DOM.h0Slider = q('h0_slider')
  DOM.v0Slider = q('v0_slider')
  DOM.alphaSlider = q('alpha_slider')
  DOM.h0Value = q('h0_value')
  DOM.v0Value = q('v0_value')
  DOM.alphaValue = q('alpha_value')
  DOM.speedRadios = document.querySelectorAll('input[name="speed"]')
  DOM.graphSelect = q('graph_select')
  DOM.yAxisSelect = q('y_axis_config')
  DOM.togVel = q('toggle_velocity_vector')
  DOM.togVelComp = q('toggle_velocity_components')
  DOM.togAcc = q('toggle_acceleration_vector')
  DOM.togTrajectory = q('toggle_trajectory')
  DOM.togStacked = q('toggle_xy_stacked')
  DOM.playBtn = q('play_btn')
  DOM.pauseBtn = q('pause_btn')
  DOM.resetBtn = q('reset_btn')

  // Diagramm-Gruppen
  DOM.graphGroupSingle = q('graph_group_single')
  DOM.graphTitle = q('graph_title')
  DOM.gridGroup = q('grid_group')
  DOM.graphLine = q('graph_line')
  DOM.graphPoint = q('graph_point')
  DOM.graphGroupStackedTop = q('graph_group_stacked_top')
  DOM.graphTitleTop = q('graph_title_top')
  DOM.gridGroupTop = q('grid_group_top')
  DOM.graphLineTop = q('graph_line_top')
  DOM.graphPointTop = q('graph_point_top')
  DOM.graphGroupStackedBottom = q('graph_group_stacked_bottom')
  DOM.graphTitleBottom = q('graph_title_bottom')
  DOM.gridGroupBottom = q('grid_group_bottom')
  DOM.graphLineBottom = q('graph_line_bottom')
  DOM.graphPointBottom = q('graph_point_bottom')

  // Topbar / Layout
  DOM.themeToggle = q('theme_toggle')
  DOM.analysisToggle = q('analysis_toggle')
  DOM.appLayout = document.querySelector('.app-layout')
  DOM.timeLabel = q('time_label')

  // Live-Analyse
  DOM.liveT = q('live_t')
  DOM.liveX = q('live_x')
  DOM.liveY = q('live_y')
  DOM.liveVx = q('live_vx')
  DOM.liveVy = q('live_vy')
  DOM.liveVabs = q('live_vabs')
  DOM.liveAy = q('live_ay')

  // Kennwerte
  DOM.liveTfall = q('live_tfall')
  DOM.liveXmax = q('live_xmax')
  DOM.liveYmax = q('live_ymax')
  DOM.liveVimpact = q('live_vimpact')

  // Export
  DOM.exportDiagram = q('export_diagram_btn')
  DOM.exportAll = q('export_all_btn')
}