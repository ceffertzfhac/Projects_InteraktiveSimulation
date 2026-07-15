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

  // Vergleichsbahn (eingefrorene Referenz): { x: [...m], y: [...m] } oder null
  frozenTraj: null,

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

  // Hover-Werte (I5): pro Diagramm-Slot ('single'/'top'/'bottom'), da bis zu
  // 3 Graph-Gruppen in derselben #main_svg existieren (Single- vs. Stacked-
  // Modus). Nur bei Zeit-Achsen-Diagrammen aktiv (nicht bei der Bahnkurve
  // y(x)/x(y) im Single-Modus — siehe render.js drawSingleGraph()).
  graphScale: { single: null, top: null, bottom: null },
  hoverActive: { single: false, top: false, bottom: false },
  hoverLocalX: { single: null, top: null, bottom: null },
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
  DOM.frozenTrajLine = q('frozen_trajectory_line')
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
  DOM.togCompare = q('toggle_compare_traj')
  DOM.diagramModeRadios = document.querySelectorAll('input[name="diagram_mode"]')
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

  // Hover-Werte (I5), pro Diagramm-Slot
  DOM.graphHitRect = { single: q('graph_hit_rect'), top: q('graph_hit_rect_top'), bottom: q('graph_hit_rect_bottom') }
  DOM.hoverLine = { single: q('graph_hover_line'), top: q('graph_hover_line_top'), bottom: q('graph_hover_line_bottom') }
  DOM.hoverPoint = { single: q('graph_hover_point'), top: q('graph_hover_point_top'), bottom: q('graph_hover_point_bottom') }
  DOM.hoverTooltip = { single: q('graph_hover_tooltip'), top: q('graph_hover_tooltip_top'), bottom: q('graph_hover_tooltip_bottom') }
  DOM.hoverTooltipBg = { single: q('graph_hover_tooltip_bg'), top: q('graph_hover_tooltip_bg_top'), bottom: q('graph_hover_tooltip_bg_bottom') }
  DOM.hoverTooltipText = { single: q('graph_hover_tooltip_text'), top: q('graph_hover_tooltip_text_top'), bottom: q('graph_hover_tooltip_text_bottom') }

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
  DOM.liveAimpact = q('live_aimpact')

  // Export
  DOM.exportDiagram = q('export_diagram_btn')
  DOM.exportAll = q('export_all_btn')
  DOM.exportSvg = q('export_svg_btn')
  DOM.exportPng = q('export_png_btn')
  DOM.mainSvg = q('main_svg')
}