export const store = {
  h0: 10,
  v0: 0,
  // Zwei unabhängige Diagramm-Picker (→ BACKLOG I12.9); graphType2 nur im
  // Zwei-Diagramm-Modus (isStacked) relevant.
  graphType1: 'weg',
  graphType2: 'geschw',
  isStacked: false,
  speedFactor: 1.0,
  yAxisConfig: { direction: 'up', origin: 'ground' },
  t_data: [], y_data: [], v_data: [], a_data: [],
  aniFrameId: null,
  lastFrameTime: 0,
  simulatedTime: 0,
};

export const DOM = {};

export function initDOM() {
  const q = id => document.getElementById(id);
  DOM.building      = q('building');
  DOM.stickFigure   = q('stick_figure');
  DOM.ball          = q('ball');
  DOM.mainHand      = q('sw_main_hand');
  DOM.subHand       = q('sw_sub_hand');
  DOM.mainSvg       = q('main_svg');

  // Diagramm-Gruppen (Single + Stacked Top/Bottom, → BACKLOG I12.9)
  DOM.graphGroupSingle       = q('graph_group_single');
  DOM.gridGroup              = q('grid_group');
  DOM.graphLine              = q('graph_line');
  DOM.graphPoint             = q('graph_point');
  DOM.graphTitle             = q('graph_title');
  DOM.graphGroupStackedTop   = q('graph_group_stacked_top');
  DOM.gridGroupTop           = q('grid_group_top');
  DOM.graphLineTop           = q('graph_line_top');
  DOM.graphPointTop          = q('graph_point_top');
  DOM.graphTitleTop          = q('graph_title_top');
  DOM.graphGroupStackedBottom = q('graph_group_stacked_bottom');
  DOM.gridGroupBottom        = q('grid_group_bottom');
  DOM.graphLineBottom        = q('graph_line_bottom');
  DOM.graphPointBottom       = q('graph_point_bottom');
  DOM.graphTitleBottom       = q('graph_title_bottom');

  DOM.h0Slider      = q('h0_slider');
  DOM.v0Slider      = q('v0_slider');
  DOM.h0Value       = q('h0_value');
  DOM.v0Value       = q('v0_value');
  DOM.speedRadios   = document.querySelectorAll('input[name="speed"]');
  DOM.graphSelect1  = q('graph_select_1');
  DOM.graphSelect2  = q('graph_select_2');
  DOM.diagramModeRadios = document.querySelectorAll('input[name="diagram_mode"]');
  DOM.dualGraphControl  = q('dual_graph_control');
  DOM.yAxisSelect   = q('y_axis_config');
  DOM.playBtn       = q('play_btn');
  DOM.pauseBtn      = q('pause_btn');
  DOM.rulerGroup    = q('ruler_group');
  DOM.swMarks       = q('sw_marks');
  DOM.sdMarks       = q('sd_marks');
  DOM.velVector     = q('vel_vector');
  DOM.accVector     = q('acc_vector');
  DOM.togVel        = q('tog_vel');
  DOM.togAcc        = q('tog_acc');
  DOM.yAxisDisplay  = q('y_axis_display');
  DOM.themeToggle   = q('theme_toggle');
  DOM.analysisToggle = q('analysis_toggle');
  DOM.appLayout     = document.querySelector('.app-layout');
  DOM.timeLabel     = q('time_label');
  DOM.liveT         = q('live_t');
  DOM.liveY         = q('live_y');
  DOM.liveV         = q('live_v');
  DOM.liveA         = q('live_a');
  DOM.liveTfall     = q('live_tfall');
  DOM.liveYmax      = q('live_ymax');
  DOM.liveVimpact   = q('live_vimpact');
  DOM.exportDiagram    = q('export_diagram_btn');
  DOM.exportAll        = q('export_all_btn');
}
