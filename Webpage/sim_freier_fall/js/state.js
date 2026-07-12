export const store = {
  h0: 10,
  v0: 0,
  graphType: 'weg',
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
  DOM.gridGroup     = q('grid_group');
  DOM.graphTitle    = q('graph_title');
  DOM.graphLine     = q('graph_line');
  DOM.graphPoint    = q('graph_point');
  DOM.h0Slider      = q('h0_slider');
  DOM.v0Slider      = q('v0_slider');
  DOM.h0Value       = q('h0_value');
  DOM.v0Value       = q('v0_value');
  DOM.speedRadios   = document.querySelectorAll('input[name="speed"]');
  DOM.graphSelect   = q('graph_select');
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
