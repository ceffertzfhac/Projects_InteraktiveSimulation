'use strict';

// Einziger mutierbarer Zustand (kanonisch: alles in store, keine Modul-Globals).
export const store = {
  // Parameter
  m1: 5.2,
  m2: 4.8,
  y1_start_cm: 100,   // Abstand von Blende (Slider zeigt Höhe vom Boden = 350 − dies)
  y2_start_cm: 100,
  frictionForce: 0,    // |F_R| in N (skalar, vereinfachtes Coulomb-Modell)
  epZeroMode: 'separate', // 'separate' | 'y1' | 'y2' | 'boden' | 'decke'
  // Rolle (massiv): Masse, Form, Innenradius-Verhältnis r/R (nur Hohlzylinder)
  pulleyMass: 0,         // M_p in kg, 0–1 (0 = masselos, klassische Atwood-Maschine)
  pulleyShape: 'voll',   // 'voll' = Vollzylinder, 'hohl' = Hohlzylinder
  pulleyInnerRatio: 0.5, // η = r/R, 0.1–0.9 (Außenradius R fix)
  speedFactor: 1.0,
  layoutSplit: true,   // true = Nebeneinander, false = Übereinander
  diagramMode: 'bars', // 'bars' = Energie-Balken (Default), '1'/'2' = Achsendiagramme
  graphType1: 'ecomposite',
  graphType2: 'wr',
  subject1: 'system',  // Subjekt für Diagramm 1: 'system' | 'm1' | 'm2'
  subject2: 'system',  // Subjekt für Diagramm 2 (nur Modus „Zwei Diagramme")

  // Visualisierung
  showForces: true,
  showNetForce: true,
  showFrictionArrow: true,
  showZeroLines: true,

  // Animation
  animFrameId:   null,
  lastFrameTime: 0,
  simulatedTime: 0,
  t_end: 0,

  // Precompute-Arrays (gefüllt von physics.precompute)
  t_data: [], y1_data: [], y2_data: [],
  v1_data: [], v2_data: [],
  a1_data: [], a2_data: [],
  ydiff_data: [], yrel1_data: [], yrel2_data: [],
  ek1_data: [], ek2_data: [],
  ep1_data: [], ep2_data: [],
  eges1_data: [], eges2_data: [],
  ek_sum_data: [], ep_sum_data: [], etot_data: [],
  wr_data: [],
  ek_rot_data: [],  // Rotationsenergie der Rolle = ½(I/R²)v²
  axisLimits: {},
  energyBarMax: 1,   // Skalenmaximum Energie-Balken (precompute)
};

export const DOM = {};

export function initDOM() {
  // Massen
  DOM.m1Slider  = document.getElementById('m1_slider');
  DOM.m2Slider  = document.getElementById('m2_slider');
  DOM.m1Value   = document.getElementById('m1_value');
  DOM.m2Value   = document.getElementById('m2_value');

  // Startpositionen
  DOM.heightMode = document.getElementById('height_mode_select');
  DOM.y1Slider   = document.getElementById('y1_slider');
  DOM.y1Value    = document.getElementById('y1_value');
  DOM.y2Slider   = document.getElementById('y2_slider');
  DOM.y2Value    = document.getElementById('y2_value');
  DOM.diffSlider = document.getElementById('diff_slider');
  DOM.diffValue  = document.getElementById('diff_value');
  DOM.y1Group    = document.getElementById('y1_group');
  DOM.y2Group    = document.getElementById('y2_group');
  DOM.diffGroup  = document.getElementById('diff_group');

  // Reibung & Energie-Referenz
  DOM.frictionSlider = document.getElementById('friction_slider');
  DOM.frictionValue  = document.getElementById('friction_value');
  DOM.epZeroSelect   = document.getElementById('ep_zero_select');

  // Rolle (massiv)
  DOM.pulleyMassSlider  = document.getElementById('pulley_mass_slider');
  DOM.pulleyMassValue   = document.getElementById('pulley_mass_value');
  DOM.pulleyShapeSelect = document.getElementById('pulley_shape_select');
  DOM.pulleyInnerSlider = document.getElementById('pulley_inner_slider');
  DOM.pulleyInnerValue  = document.getElementById('pulley_inner_value');
  DOM.pulleyInnerGroup  = document.getElementById('pulley_inner_group');

  // Layout
  DOM.layoutToggle = document.getElementById('layout_toggle');

  // Diagramm-Steuerung
  DOM.graphModeRadios = [...document.querySelectorAll('input[name="diagram_mode"]')];
  DOM.graphSelect1  = document.getElementById('graph_select_1');
  DOM.graphSelect2  = document.getElementById('graph_select_2');
  DOM.subjectSelect1 = document.getElementById('subject_select_1');
  DOM.subjectSelect2 = document.getElementById('subject_select_2');
  DOM.graphSel2Group = document.getElementById('graph_sel2_group');
  DOM.lineOptionsGroup = document.getElementById('line_options_group');
  DOM.energyBarsView = document.getElementById('energy_bars_view');

  // Visualisierung
  DOM.togForces       = document.getElementById('toggle_forces');
  DOM.togNet          = document.getElementById('toggle_net_force');
  DOM.togFrictionArrow = document.getElementById('toggle_friction_arrow');
  DOM.togZeroLines    = document.getElementById('toggle_zero_lines');

  // Topbar
  DOM.playBtn    = document.getElementById('play_btn');
  DOM.pauseBtn   = document.getElementById('pause_btn');
  DOM.resetBtn   = document.getElementById('reset_btn');
  DOM.themeToggle = document.getElementById('theme_toggle');
  DOM.timeLabel   = document.getElementById('time_label');
  DOM.analysisToggle = document.getElementById('analysis_toggle');
  DOM.appLayout       = document.querySelector('.app-layout');
  DOM.exportDiagram = document.getElementById('export_diagram_btn');
  DOM.exportAll     = document.getElementById('export_all_btn');

  // Sim-SVG
  DOM.mainSvg      = document.getElementById('main_svg');
  DOM.mass1Group   = document.getElementById('mass1_group');
  DOM.mass1Rect    = document.getElementById('mass1_rect');
  DOM.mass1Label   = document.getElementById('mass1_label');
  DOM.mass2Group   = document.getElementById('mass2_group');
  DOM.mass2Rect    = document.getElementById('mass2_rect');
  DOM.mass2Label   = document.getElementById('mass2_label');
  DOM.rope         = document.getElementById('rope');
  DOM.rulerGroup   = document.getElementById('ruler_group');
  DOM.swMarks      = document.getElementById('stopwatch_marks');
  DOM.swHand       = document.getElementById('stopwatch_main_hand');
  DOM.sdMarks      = document.getElementById('stopwatch_subdial_marks');
  DOM.subHand      = document.getElementById('stopwatch_sub_hand');
  DOM.fG1  = document.getElementById('force_g1_vector');
  DOM.fT1  = document.getElementById('force_t1_vector');
  DOM.fG2  = document.getElementById('force_g2_vector');
  DOM.fT2  = document.getElementById('force_t2_vector');
  DOM.fNet1 = document.getElementById('force_net1_vector');
  DOM.fNet2 = document.getElementById('force_net2_vector');
  DOM.frictionArrow = document.getElementById('friction_arrow');
  DOM.frictionLabel = document.getElementById('friction_label');
  DOM.zeroLinesGroup = document.getElementById('zero_lines_group');
  DOM.pulleyInner    = document.getElementById('pulley_inner');
  DOM.pulleyRotor    = document.getElementById('pulley_rotor');

  // Graph-SVG (ein SVG, zwei verschobene Gruppen — I9)
  DOM.graphSvg     = document.getElementById('graph_svg');
  DOM.graphGroup1  = document.getElementById('graph_group_1');
  DOM.graphGroup2  = document.getElementById('graph_group_2');

  // Live-Analyse
  DOM.liveA1    = document.getElementById('live_a1');
  DOM.liveA2    = document.getElementById('live_a2');
  DOM.liveT1    = document.getElementById('live_t1');
  DOM.liveT2    = document.getElementById('live_t2');
  DOM.liveFr    = document.getElementById('live_fr');
  DOM.liveV1    = document.getElementById('live_v1');
  DOM.liveV2    = document.getElementById('live_v2');
  DOM.liveY1    = document.getElementById('live_y1');
  DOM.liveY2    = document.getElementById('live_y2');
  DOM.liveYdiff = document.getElementById('live_ydiff');
  DOM.liveEkin   = document.getElementById('live_ekin');
  DOM.liveEpot   = document.getElementById('live_epot');
  DOM.liveEtot   = document.getElementById('live_etot');
  DOM.liveWr     = document.getElementById('live_wr');
  DOM.liveErot   = document.getElementById('live_erot');
  DOM.balance1   = document.getElementById('balance1');
  DOM.balance2   = document.getElementById('balance2');
}