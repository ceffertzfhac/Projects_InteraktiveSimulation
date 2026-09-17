'use strict'

import { DEFAULT_FUNC, A_DEFAULT, B_DEFAULT, N_DEFAULT,
         GRAPH_TYPE_1_DEFAULT, GRAPH_TYPE_2_DEFAULT } from './constants.js'

// Zentraler Store: ALLE mutablen Werte leben ausschließlich hier.
export const store = {
  // — Eingabeparameter —
  funcKey: DEFAULT_FUNC,
  a: A_DEFAULT,              // untere Integrationsgrenze
  b: B_DEFAULT,              // obere Integrationsgrenze
  n: N_DEFAULT,              // Streifenzahl der Zerlegung

  // — Visualisierungs-Schalter —
  showUnter:  true,
  showOber:   true,
  showMittel: false,
  showExact:  true,          // exakte Fläche unter der Kurve schattieren
  showValues: true,          // Werte-Overlay (n, Δx, Einschachtelung) am Bild

  // — Diagramm-Steuerung (I12) —
  diagramMode: '2',          // '1' | '2'
  graphType1: GRAPH_TYPE_1_DEFAULT,
  graphType2: GRAPH_TYPE_2_DEFAULT,
  layoutSplit: false,        // false = Sim/Diagramm übereinander, true = nebeneinander
  speedFactor: 1.0,

  // — precompute()-Ergebnisse —
  xs: [], ys: [],            // Funktionskurve
  exact: 0,                  // ∫ₐᵇ f dx (Hauptsatz)
  n_data: [], U_data: [], O_data: [], M_data: [],   // Index = Streifenzahl n

  // — Zeichenskalen (einzige Quelle der Wahrheit für Marker + Hover) —
  mainScale: null,                     // { sx, sy, plotW, plotH, … }
  graphScale: { 1: null, 2: null },    // pro Diagramm-Slot

  // — Hover-Werte (I13.1). KEINE Slot-Synchronisation (I14): die beiden Slots
  //   haben unterschiedliche Abszissen (n bzw. x) — außerhalb des I14-Scopes. —
  hoverSlot: null,
  hoverLocalX: null,

  // — Verfeinerungs-Animation (Stufenindex in N_SEQUENCE statt Zeit) —
  aniFrameId: null,
  lastFrameTime: 0,
  stepIndex: 0,
}

// DOM-Element-Cache — einmalig in initDOM() gefüllt.
export const DOM = {}

export function initDOM() {
  const q = id => document.getElementById(id)
  // Steuerung — Funktion & Grenzen
  DOM.funcSelect = q('func_select')
  DOM.aSlider = q('a_slider');  DOM.aValue = q('a_value')
  DOM.bSlider = q('b_slider');  DOM.bValue = q('b_value')
  // Steuerung — Zerlegung & Verfahren
  DOM.nSlider = q('n_slider');  DOM.nValue = q('n_value')
  DOM.togUnter  = q('tog_unter')
  DOM.togOber   = q('tog_ober')
  DOM.togMittel = q('tog_mittel')
  // Steuerung — Visualisierung
  DOM.togExact  = q('tog_exact')
  DOM.togValues = q('tog_values')
  // Steuerung — Diagramme (I12)
  DOM.diagramModeRadios = document.querySelectorAll('input[name="diagram_mode"]')
  DOM.graphSelect1 = q('graph_select_1')
  DOM.graphSelect2 = q('graph_select_2')
  DOM.dualGraphControl = q('dual_graph_control')
  DOM.speedRadios = document.querySelectorAll('input[name="speed"]')
  // Topbar
  DOM.playBtn = q('play_btn')
  DOM.pauseBtn = q('pause_btn')
  DOM.resetBtn = q('reset_btn')
  DOM.themeToggle = q('theme_toggle')
  DOM.layoutToggle = q('layout_toggle')
  DOM.exportDiagram = q('export_diagram_btn')
  DOM.exportAll = q('export_all_btn')
  // Panel-Klappmechanik
  DOM.appLayout = document.querySelector('.app-layout')
  DOM.centerArea = q('center_area')
  DOM.analysisToggle = q('analysis_toggle')
  // Hauptdarstellung (Kurve + Streifen)
  DOM.mainSvg    = q('main_svg')
  DOM.mainGrid   = q('main_grid')
  DOM.mainExact  = q('main_exact')
  DOM.stripsOver = q('strips_over')
  DOM.stripsUnder= q('strips_under')
  DOM.stripsOutline = q('strips_outline')
  DOM.stripsMid  = q('strips_mid')
  DOM.mainCurve  = q('main_curve')
  DOM.mainMarks  = q('main_marks')
  DOM.mainTitleFo= q('main_title_fo')
  DOM.valueBox   = q('value_box')
  // Diagramm-Slots
  DOM.graphSvg = q('graph_svg')
  DOM.graphGroup = { 1: q('graph_group_1'), 2: q('graph_group_2') }
  DOM.hoverGroup = { 1: q('graph_hover_group_1'), 2: q('graph_hover_group_2') }
  DOM.hoverLine  = { 1: q('graph_hover_line_1'), 2: q('graph_hover_line_2') }
  DOM.hoverPoints= { 1: q('graph_hover_points_1'), 2: q('graph_hover_points_2') }
  DOM.hoverTooltip     = { 1: q('graph_hover_tooltip_1'), 2: q('graph_hover_tooltip_2') }
  DOM.hoverTooltipBg   = { 1: q('graph_hover_tooltip_bg_1'), 2: q('graph_hover_tooltip_bg_2') }
  DOM.hoverTooltipText = { 1: q('graph_hover_tooltip_text_1'), 2: q('graph_hover_tooltip_text_2') }
  DOM.graphHitRect = { 1: q('graph_hit_rect_1'), 2: q('graph_hit_rect_2') }
  // Analyse-Panel
  DOM.anN      = q('an_n')
  DOM.anDx     = q('an_dx')
  DOM.anU      = q('an_u')
  DOM.anO      = q('an_o')
  DOM.anM      = q('an_m')
  DOM.anSpan   = q('an_span')
  DOM.anExact  = q('an_exact')
  DOM.anErrU   = q('an_err_u')
  DOM.anErrO   = q('an_err_o')
  DOM.anErrM   = q('an_err_m')
}
