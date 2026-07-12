'use strict'

import { subjects, quantities } from './constants.js'

export const store = {
  // Bewegungsparameter
  R0: 1.5, vr: 0, h: 0,
  omega0_rad: 60 * Math.PI / 180, phi0_rad: 0, alpha_rad: 0,
  speedFactor: 1.0,

  // Modus / Ansicht / Einheit / Diagramm / Anordnung
  motionMode: 'kreis', currentView: '2D', angleUnit: 'deg',
  diagramMode: '1', graphType1: 'phi', graphType2: 'omega',
  layoutSplit: false,   // Sim & Diagramm übereinander (false) / nebeneinander (true) — FX6, einheitlich mit Kreisbewegung

  // Vektorzerlegung
  rDecomp: 'none', vDecomp: 'none', aDecomp: 'none', scaleAt: false,

  // Visualisierungs-Toggles
  togPosition: false, togVelocity: false, togAcceleration: false,
  togOmega: false, togAlpha: false, togPhi: false, togTrajectory: false,
  stopwatchVisible: true,

  // Auto-Stopp
  isAutoStopping: false,
  autoStopTargetAngle: 0,
  autoStopDirection: 1,
  lastPhiForStop: 0,
  nStop: 1,

  // Zoom
  currentPixelsPerMeter: 75, zoomFactor: 1.0,

  // Precompute (flat: p_<quantity> + t) und Achsenlimits
  fullData: {}, axisLimits: {}, effectiveDuration: 120,

  // RAF-Bookkeeping
  aniFrameId: null, lastFrameTime: 0, simulatedTime: 0,

  // Hover-Werte (I5): pro Diagramm-Slot (1/2, da Dual-Graph-Modus möglich).
  graphScale: { 1: null, 2: null },
  hoverActive: { 1: false, 2: false },
  hoverLocalX: { 1: null, 2: null },
}

export const DOM = {}

export function initDOM() {
  const q = id => document.getElementById(id)

  // Topbar / Layout
  DOM.themeToggle = q('theme_toggle')
  DOM.playBtn = q('play_btn')
  DOM.pauseBtn = q('pause_btn')
  DOM.resetBtn = q('reset_btn')
  DOM.exportDiagram = q('export_diagram_btn')
  DOM.exportAll = q('export_all_btn')
  DOM.appLayout = document.querySelector('.app-layout')
  DOM.analysisToggle = q('analysis_toggle')
  DOM.timeLabel = q('time_label')

  // Bewegungsparameter
  DOM.radiusSlider = q('radius_slider'); DOM.radiusValue = q('radius_value')
  DOM.radiusLabelKreis = q('radius_label_kreis')
  DOM.radiusLabelSpiral = q('radius_label_spiral')
  DOM.hSlider = q('h_slider'); DOM.hValue = q('h_value')
  DOM.vrSlider = q('vr_slider'); DOM.vrValue = q('vr_value')
  DOM.vrControlWrapper = q('vr_control_wrapper')
  DOM.phi0Slider = q('phi0_slider'); DOM.phi0Value = q('phi0_value')
  DOM.omega0Slider = q('omega0_slider'); DOM.omega0Value = q('omega0_value')
  DOM.alphaSlider = q('alpha_slider'); DOM.alphaValue = q('alpha_value')

  // Modus / Ansicht / Einheit
  DOM.motionModeSelect = q('motion_mode_select')
  DOM.viewSelect = q('view_select')
  DOM.angleUnitSelect = q('angle_unit_select')
  DOM.presetSelect = q('preset_select')

  // Visualisierung
  DOM.togglePosition = q('toggle_position_vector')
  DOM.toggleVelocity = q('toggle_velocity_vector')
  DOM.toggleAcceleration = q('toggle_acceleration_vector')
  DOM.toggleOmega = q('toggle_omega_vector')
  DOM.toggleAlpha = q('toggle_alpha_vector')
  DOM.togglePhi = q('toggle_phi_arc')
  DOM.toggleTrajectory = q('toggle_trajectory')
  DOM.toggleAtScaling = q('toggle_at_scaling')
  DOM.rDecompFieldset = q('r_decomp_fieldset')
  DOM.vDecompFieldset = q('v_decomp_fieldset')
  DOM.aDecompFieldset = q('a_decomp_fieldset')
  DOM.rDecompRadios = document.querySelectorAll('input[name="r_decomp"]')
  DOM.vDecompRadios = document.querySelectorAll('input[name="v_decomp"]')
  DOM.aDecompRadios = document.querySelectorAll('input[name="a_decomp"]')

  // Geschwindigkeit / Auto-Stopp / Diagramm
  DOM.speedRadios = document.querySelectorAll('input[name="speed"]')
  DOM.autoStopCheckbox = q('auto_stop_checkbox')
  DOM.nControlGroup = q('n_control_group')
  DOM.nMinusBtn = q('n_minus_btn'); DOM.nPlusBtn = q('n_plus_btn')
  DOM.nValueDisplay = q('n_value_display')
  DOM.diagramModeRadios = document.querySelectorAll('input[name="diagram_mode"]')
  DOM.diagramModeGroup = q('diagram_mode_group')
  DOM.speedGroup = q('speed_group')
  DOM.dualGraphControl = q('dual_graph_control')
  DOM.graphSelect1 = q('graph_select_1'); DOM.graphSelect2 = q('graph_select_2')
  DOM.layoutToggle = q('layout_toggle')
  DOM.centerArea = q('center_area')

  // Animations-SVG
  DOM.mainSvg = q('main_svg')
  DOM.animationGroup = q('animation_group')
  DOM.isoViewElements = q('iso_view_elements')
  DOM.view2dElements = q('view_2d_elements')
  DOM.coordSystem2d = q('animation_coord_system_2d')
  DOM.disk = q('disk')
  DOM.point = q('point')
  DOM.trajectoryPath = q('trajectory_path')
  DOM.phiArcGroup = q('phi_arc_group')
  DOM.phiArc = q('phi_arc')
  DOM.phiLabel = q('phi_label')
  DOM.positionVector = q('position_vector')
  DOM.velocityVector = q('velocity_vector')
  DOM.accelerationVector = q('acceleration_vector')
  DOM.omegaVector = q('omega_vector')
  DOM.alphaVector = q('alpha_vector')
  DOM.positionVectorX = q('position_vector_x'); DOM.positionVectorY = q('position_vector_y')
  DOM.velocityVectorX = q('velocity_vector_x'); DOM.velocityVectorY = q('velocity_vector_y')
  DOM.velocityVectorR = q('velocity_vector_r'); DOM.velocityVectorT = q('velocity_vector_t')
  DOM.accelerationVectorX = q('acceleration_vector_x'); DOM.accelerationVectorY = q('acceleration_vector_y')
  DOM.accelerationVectorR = q('acceleration_vector_r'); DOM.accelerationVectorT = q('acceleration_vector_t')
  DOM.isoAxisX = q('iso_axis_x'); DOM.isoAxisY = q('iso_axis_y'); DOM.isoAxisZ = q('iso_axis_z')
  DOM.isoLabelX = q('iso_label_x'); DOM.isoLabelY = q('iso_label_y'); DOM.isoLabelZ = q('iso_label_z')
  DOM.isoCirclePath = q('iso_circle_path')
  DOM.stopwatch = q('stopwatch')
  DOM.stopwatchMarks = q('stopwatch_marks')
  DOM.mainHand = q('stopwatch_main_hand')
  DOM.zoomTextDisplay = q('zoom_text_display')

  // Diagramm
  DOM.graphSvg = q('graph_svg')
  DOM.graphGroup1 = q('graph_group_1'); DOM.graphGroup2 = q('graph_group_2')

  // Hover-Werte (I5), pro Diagramm-Slot (1/2)
  DOM.graphHoverGroup = { 1: q('graph_hover_group_1'), 2: q('graph_hover_group_2') }
  DOM.graphHitRect = { 1: q('graph_hit_rect_1'), 2: q('graph_hit_rect_2') }
  DOM.hoverLine = { 1: q('graph_hover_line_1'), 2: q('graph_hover_line_2') }
  DOM.hoverPoint = { 1: q('graph_hover_point_1'), 2: q('graph_hover_point_2') }
  DOM.hoverTooltip = { 1: q('graph_hover_tooltip_1'), 2: q('graph_hover_tooltip_2') }
  DOM.hoverTooltipBg = { 1: q('graph_hover_tooltip_bg_1'), 2: q('graph_hover_tooltip_bg_2') }
  DOM.hoverTooltipText = { 1: q('graph_hover_tooltip_text_1'), 2: q('graph_hover_tooltip_text_2') }

  // Live-Analyse (einzelner Partikel)
  DOM.live = {}
  quantities.forEach(qq => { DOM.live[qq] = q(`live_${qq}`) })

  // Statische MathJax-Varianten (Kreis gleichförmig / Kreis ungleichförmig / Spirale)
  DOM.formulasKreis = q('formulas_kreis')
  DOM.formulasKreisAcc = q('formulas_kreis_acc')
  DOM.formulasSpiral = q('formulas_spiral')
}