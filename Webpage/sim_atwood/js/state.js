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
  graphCfg: { mode: '1', type1: 'y', type2: 'v', subject: 'm1' }, // mode '1'/'2' (kanonisch, → BACKLOG I12.8)
  // Precomputed arrays (filled by physics.precompute)
  t_data: [], y1_data: [], y2_data: [],
  v1_data: [], v2_data: [],
  a1_data: [], a2_data: [],
  ydiff_data: [],
  yrel1_data: [], yrel2_data: [],
  axisLimits: {},

  // Hover-Werte (I13.1) + Dual-Sync (I14): graphScale pro Slot ('single'/
  // 'top'/'bottom'); hoverSourceSlot = der Slot, über dem die Maus tatsächlich
  // steht (null = kein Hover); hoverT = daraus abgeleitete Zeit, geteilt mit
  // dem jeweils anderen Slot im Zwei-Diagramm-Modus (beide teilen sich dort
  // stets die Zeitachse).
  graphScale: { single: null, top: null, bottom: null },
  hoverSourceSlot: null,
  hoverT: null,
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
  DOM.graphModeRadios = [...document.querySelectorAll('input[name="diagram_mode"]')];
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
  DOM.analysisToggle = document.getElementById('analysis_toggle');
  DOM.appLayout       = document.querySelector('.app-layout');

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

  // Hover-Werte (I13.1/I14), pro Diagramm-Slot
  DOM.graphHitRect = { single: document.getElementById('graph_hit_rect_single'), top: document.getElementById('graph_hit_rect_top'), bottom: document.getElementById('graph_hit_rect_bottom') };
  DOM.hoverLine = { single: document.getElementById('graph_hover_line_single'), top: document.getElementById('graph_hover_line_top'), bottom: document.getElementById('graph_hover_line_bottom') };
  DOM.hoverPoint = {
    single: [document.getElementById('graph_hover_point_single_a'), document.getElementById('graph_hover_point_single_b')],
    top:    [document.getElementById('graph_hover_point_top_a'),    document.getElementById('graph_hover_point_top_b')],
    bottom: [document.getElementById('graph_hover_point_bottom_a'), document.getElementById('graph_hover_point_bottom_b')],
  };
  DOM.hoverTooltip = { single: document.getElementById('graph_hover_tooltip_single'), top: document.getElementById('graph_hover_tooltip_top'), bottom: document.getElementById('graph_hover_tooltip_bottom') };
  DOM.hoverTooltipBg = { single: document.getElementById('graph_hover_tooltip_bg_single'), top: document.getElementById('graph_hover_tooltip_bg_top'), bottom: document.getElementById('graph_hover_tooltip_bg_bottom') };
  DOM.hoverTooltipText = { single: document.getElementById('graph_hover_tooltip_text_single'), top: document.getElementById('graph_hover_tooltip_text_top'), bottom: document.getElementById('graph_hover_tooltip_text_bottom') };

  // Analysis display
  DOM.liveA1    = document.getElementById('live_a1');
  DOM.liveA2    = document.getElementById('live_a2');
  DOM.liveTens  = document.getElementById('live_tens');
  DOM.liveFg1   = document.getElementById('live_fg1');
  DOM.liveFg2   = document.getElementById('live_fg2');
  DOM.liveFnet1 = document.getElementById('live_fnet1');
  DOM.liveFnet2 = document.getElementById('live_fnet2');
  DOM.liveV1    = document.getElementById('live_v1');
  DOM.liveV2    = document.getElementById('live_v2');
  DOM.liveY1    = document.getElementById('live_y1');
  DOM.liveY2    = document.getElementById('live_y2');
  DOM.liveYdiff = document.getElementById('live_ydiff');
}
