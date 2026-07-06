'use strict'

// ── Mutierbarer Zustand (einzige Quelle für alle veränderlichen Werte) ───────
export const store = {
  // Parameter (Eingaben)
  m1: 1.9,               // kg (links)
  m3: 1.1,               // kg (rechts)
  m2: 2.0,               // kg (Mitte, via Stepper)
  pulleyDistCm: 40,      // Rollenabstand (cm)
  ropeLenCm: 50,         // Seilsegmentlänge (cm, dynamisch gekoppelt)

  // Visualisierungs-Toggles
  showGravity: true,
  showTension: true,
  showComponents: false,
  showComponentValues: false,
  showGrid: false,

  // Ergebnis des letzten computeEquilibrium-Runs (oder null / Fehlstatus)
  equilibrium: null,     // { ... } | { status: 'no-equilibrium' | 'collision' } | null

  isDarkMode: false,
}

// ── DOM-Cache ────────────────────────────────────────────────────────────────
export const DOM = {}

const q = id => document.getElementById(id)

export function initDOM() {
  // SVG-Elemente
  DOM.mainSvg = q('main_svg')
  DOM.ceiling = q('ceiling')
  DOM.pulleyMountLeft = q('pulley_mount_left')
  DOM.pulleyMountRight = q('pulley_mount_right')
  DOM.pulleyLeft = q('pulley_left')
  DOM.pulleyRight = q('pulley_right')
  DOM.pulleyLeftCenter = q('pulley_left_center')
  DOM.pulleyRightCenter = q('pulley_right_center')
  DOM.rope = q('rope')
  DOM.massLeftGroup = q('mass_left_group')
  DOM.massMiddleGroup = q('mass_middle_group')
  DOM.massRightGroup = q('mass_right_group')
  DOM.massLeftRect = q('mass_left')
  DOM.massMiddleRect = q('mass_middle')
  DOM.massRightRect = q('mass_right')
  DOM.massLeftLabel = q('mass_left_label')
  DOM.massMiddleLabel = q('mass_middle_label')
  DOM.massRightLabel = q('mass_right_label')
  DOM.forceVectorsGroup = q('force_vectors_group')
  DOM.gridGroup = q('grid_group')

  // Slider & Stepper
  DOM.m1Slider = q('m1_slider')
  DOM.m3Slider = q('m3_slider')
  DOM.pulleyDistSlider = q('pulley_dist_slider')
  DOM.ropeLenSlider = q('rope_len_slider')
  DOM.m1Value = q('m1_value')
  DOM.m3Value = q('m3_value')
  DOM.m2Value = q('m2_value')
  DOM.m2PlusBtn = q('m2_plus_btn')
  DOM.m2MinusBtn = q('m2_minus_btn')
  DOM.pulleyDistValue = q('pulley_dist_value')
  DOM.ropeLenValue = q('rope_len_value')

  // Toggles
  DOM.togGravity = q('show_gravity_vectors')
  DOM.togTension = q('show_tension_vectors')
  DOM.togComponents = q('show_component_vectors')
  DOM.togGrid = q('show_grid')
  DOM.togComponentValues = q('show_component_values')

  // Analyse-Panel
  DOM.leftForce = q('left_force')
  DOM.leftAngle = q('left_angle')
  DOM.rightForce = q('right_force')
  DOM.rightAngle = q('right_angle')
  DOM.verticalForcesValue = q('vertical_forces_value')
  DOM.horizontalForcesValue = q('horizontal_forces_value')
  DOM.equilibriumWarning = q('equilibrium_warning')

  // Topbar & Layout
  DOM.resetBtn = q('reset_btn')
  DOM.themeToggle = q('theme_toggle')
  DOM.appLayout = q('app_layout')
  DOM.analysisToggle = q('analysis_toggle')
}