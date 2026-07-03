export const store = {
  m1: 5.2,
  m2: 4.8,
  y1_start_cm: 100,
  y2_start_cm: 100,
  speedFactor: 1.0,
  animFrameId:   null,
  lastFrameTime: 0,
  simulatedTime: 0,
  t_end: 0,
  showForces:  true,
  showNetForce: true,
  graphCfg: { mode: 'single', type1: 'y', type2: 'v', subject: 'm1' },
  // Precomputed arrays (filled by physics.precompute)
  t_data: [], y1_data: [], y2_data: [],
  v1_data: [], v2_data: [],
  a1_data: [], a2_data: [],
  ydiff_data: [],
  yrel1_data: [], yrel2_data: [],
  axisLimits: {},
};

export const DOM = {};

export function initDOM() {
  DOM.m1Slider  = document.getElementById('m1_slider');
  DOM.m2Slider  = document.getElementById('m2_slider');
  DOM.m1Value   = document.getElementById('m1_value');
  DOM.m2Value   = document.getElementById('m2_value');

  DOM.heightMode  = document.getElementById('height_mode_select');
  DOM.y1Slider    = document.getElementById('y1_slider');
  DOM.y1Value     = document.getElementById('y1_value');
  DOM.y2Slider    = document.getElementById('y2_slider');
  DOM.y2Value     = document.getElementById('y2_value');
  DOM.diffSlider  = document.getElementById('diff_slider');
  DOM.diffValue   = document.getElementById('diff_value');
  DOM.y1Group     = document.getElementById('y1_group');
  DOM.y2Group     = document.getElementById('y2_group');
  DOM.diffGroup   = document.getElementById('diff_group');

  DOM.speedRadios   = [...document.querySelectorAll('input[name="speed"]')];
  DOM.graphModeRadios = [...document.querySelectorAll('input[name="graph_mode"]')];
  DOM.graphSelect1  = document.getElementById('graph_select_1');
  DOM.graphSelect2  = document.getElementById('graph_select_2');
  DOM.subjectSelect = document.getElementById('subject_select');
  DOM.graphSel2Group = document.getElementById('graph_sel2_group');
  DOM.subjectGroup  = document.getElementById('subject_group');

  DOM.togForces = document.getElementById('toggle_forces');
  DOM.togNet    = document.getElementById('toggle_net_force');

  DOM.playBtn    = document.getElementById('play_btn');
  DOM.pauseBtn   = document.getElementById('pause_btn');
  DOM.themeToggle = document.getElementById('theme_toggle');
  DOM.timeLabel   = document.getElementById('time_label');

  DOM.exportDiagram = document.getElementById('export_diagram_btn');
  DOM.exportAll     = document.getElementById('export_all_btn');

  // Simulation SVG elements
  DOM.mass1Group = document.getElementById('mass1_group');
  DOM.mass1Rect  = document.getElementById('mass1_rect');
  DOM.mass1Label = document.getElementById('mass1_label');
  DOM.mass2Group = document.getElementById('mass2_group');
  DOM.mass2Rect  = document.getElementById('mass2_rect');
  DOM.mass2Label = document.getElementById('mass2_label');
  DOM.rope        = document.getElementById('rope');
  DOM.rulerGroup  = document.getElementById('ruler_group');
  DOM.swMarks     = document.getElementById('stopwatch_marks');
  DOM.swHand      = document.getElementById('stopwatch_main_hand');
  DOM.sdMarks     = document.getElementById('stopwatch_subdial_marks');
  DOM.subHand     = document.getElementById('stopwatch_sub_hand');
  DOM.fG1  = document.getElementById('force_g1_vector');
  DOM.fT1  = document.getElementById('force_t1_vector');
  DOM.fG2  = document.getElementById('force_g2_vector');
  DOM.fT2  = document.getElementById('force_t2_vector');
  DOM.fNet1 = document.getElementById('force_net1_vector');
  DOM.fNet2 = document.getElementById('force_net2_vector');

  // Graph SVGs
  DOM.graphSvgSingle = document.getElementById('graph_svg_single');
  DOM.graphSvgTop    = document.getElementById('graph_svg_top');
  DOM.graphSvgBottom = document.getElementById('graph_svg_bottom');

  // Analysis display
  DOM.liveA1    = document.getElementById('live_a1');
  DOM.liveA2    = document.getElementById('live_a2');
  DOM.liveTens  = document.getElementById('live_tens');
  DOM.liveV1    = document.getElementById('live_v1');
  DOM.liveV2    = document.getElementById('live_v2');
  DOM.liveY1    = document.getElementById('live_y1');
  DOM.liveY2    = document.getElementById('live_y2');
  DOM.liveYdiff = document.getElementById('live_ydiff');
}
