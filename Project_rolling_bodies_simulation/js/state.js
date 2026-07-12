/**
 * Application state management
 * @module state
 */

import { DEFAULT_DURATION, SUBJECTS } from './constants.js';

// ══════════════════════════════════════════════════════════════════
//  STATE STORE (Mutable properties)
// ══════════════════════════════════════════════════════════════════
export const store = {
  R_m: 0.15,
  v0_m_s: 0.25,
  alpha_rad: 0,
  mu_s: 0.40,
  speedFactor: 1.0,
  kFactor: 0.5,
  vecScale: 1.0,
  ppm: 180,
  rampStartX: 0,
  rampStartY: 0,
  animId: null,
  lastTs: 0,
  simTime: 0,
  simDuration: DEFAULT_DURATION,
  fullData: {},
  activeSubjects: new Set(['sp']),
  compareActive: new Set(),
  compareData: {},
  analysisCache: {},
  coordSystemAlignment: 'plane', // 'plane' or 'ground'
  _visX0: 0,
  _visX1: 700,
  _mjDebounceTimer: null,

  // Hover-Werte (I5): von updateGraph() befüllte Skalierungsparameter,
  // von updateGraphHover() gelesen — siehe render-graph.js.
  graphScale: null,
  hoverActive: false,
  hoverLocalX: null,
};

// ══════════════════════════════════════════════════════════════════
//  DOM CACHE
// ══════════════════════════════════════════════════════════════════
export const DOM = {};

// Initialize DOM cache after DOM is ready
export function initDOMCache() {
  DOM.mainSvg = document.getElementById('main_svg');
  DOM.graphSvg = document.getElementById('graph_svg');
  
  // Groups
  DOM.bgG = document.getElementById('bg_g');
  DOM.coordSystemG = document.getElementById('coord_system_g');
  DOM.obstacleG = document.getElementById('obstacle_g');
  DOM.tracesG = document.getElementById('traces_g');
  DOM.compareObjsG = document.getElementById('compare_objs_g');
  DOM.cylinderG = document.getElementById('cylinder_g');
  DOM.vectorsG = document.getElementById('vectors_g');
  DOM.forcesG = document.getElementById('forces_g');
  DOM.vecLegendG = document.getElementById('vec_legend_g');
  DOM.worldG = document.getElementById('world_g');
  
  // Body elements
  DOM.cylBody = document.getElementById('cyl_body');
  DOM.cylInner = document.getElementById('cyl_inner');
  DOM.spokesG = document.getElementById('spokes_g');
  DOM.ptSp = document.getElementById('pt_sp');
  DOM.ptP1 = document.getElementById('pt_p1');
  DOM.ptP2 = document.getElementById('pt_p2');
  DOM.ptP3 = document.getElementById('pt_p3');
  DOM.ptP4 = document.getElementById('pt_p4');
  
  // Spokes
  DOM.sp1 = document.getElementById('sp1');
  DOM.sp2 = document.getElementById('sp2');
  DOM.sp3 = document.getElementById('sp3');
  DOM.sp4 = document.getElementById('sp4');
  
  // Graph elements
  DOM.graphBgG = DOM.graphSvg.querySelector('.graph-bg-g');
  DOM.graphAxesG = DOM.graphSvg.querySelector('.graph-axes-g');
  DOM.graphSel = document.getElementById('graph_sel');
  DOM.graphLegend = document.getElementById('graph_legend');
  DOM.graphCursor = document.getElementById('graph_cursor');

  // Hover-Werte (I5)
  DOM.graphHitRect = document.getElementById('graph_hit_rect');
  DOM.hoverLine = document.getElementById('graph_hover_line');
  DOM.hoverPoint = {};
  SUBJECTS.forEach(s => { DOM.hoverPoint[s] = document.getElementById(`graph_hover_point_${s}`); });
  DOM.hoverTooltip = document.getElementById('graph_hover_tooltip');
  DOM.hoverTooltipBg = document.getElementById('graph_hover_tooltip_bg');
  DOM.hoverTooltipText = document.getElementById('graph_hover_tooltip_text');
  
  // Time display
  DOM.timeLabel = document.getElementById('time_label');

  // Stopwatch (kanonisches Design, Ref: Atwood v2.2.x)
  DOM.swMarks    = document.getElementById('stopwatch_marks');
  DOM.swMainHand = document.getElementById('stopwatch_main_hand');
  DOM.swSubMarks = document.getElementById('stopwatch_subdial_marks');
  DOM.swSubHand  = document.getElementById('stopwatch_sub_hand');

  // Einklappbare Analyse-Sidebar
  DOM.analysisToggle = document.getElementById('analysis_toggle');
  DOM.appLayout       = document.querySelector('.app-layout');
  
  // Panels
  DOM.analysisArea = document.getElementById('analysis_area');
  DOM.compareList = document.getElementById('compare_list');
  DOM.compareInfo = document.getElementById('compare_info');
  DOM.raceBars = document.getElementById('race_bars');
  
  // Energy bars
  DOM.ebarTrans = document.getElementById('ebar_trans');
  DOM.ebarRot = document.getElementById('ebar_rot');
  DOM.ebarPot = document.getElementById('ebar_pot');
  DOM.ebarTot = document.getElementById('ebar_tot');
  DOM.evalTrans = document.getElementById('eval_trans');
  DOM.evalRot = document.getElementById('eval_rot');
  DOM.evalPot = document.getElementById('eval_pot');
  DOM.evalTot = document.getElementById('eval_tot');
  
  // Form controls
  DOM.radiusSlider = document.getElementById('radius_slider');
  DOM.velSlider = document.getElementById('vel_slider');
  DOM.alphaSlider = document.getElementById('alpha_slider');
  DOM.muSlider = document.getElementById('mu_slider');
  DOM.innerRSlider = document.getElementById('inner_r_slider');
  DOM.modeFlat = document.getElementById('mode_flat');
  DOM.modeInclined = document.getElementById('mode_inclined');
  DOM.alignPlane = document.getElementById('align_plane');
  DOM.alignGround = document.getElementById('align_ground');
  
  // Display values
  DOM.radiusVal = document.getElementById('radius_val');
  DOM.velVal = document.getElementById('vel_val');
  DOM.alphaVal = document.getElementById('alpha_val');
  DOM.muVal = document.getElementById('mu_val');
  DOM.innerRVal = document.getElementById('inner_r_val');
  DOM.kvalDisplay = document.getElementById('kval_display');
  DOM.rollcondBox = document.getElementById('rollcond_box');
  DOM.fmagG = document.getElementById('fmag_g');
  DOM.fmagN = document.getElementById('fmag_n');
  DOM.fmagR = document.getElementById('fmag_r');
  DOM.muRequiredNote = document.getElementById('mu_required_note');
  DOM.kbadgeThickCyl = document.getElementById('kbadge_thickCyl');
  DOM.kbadgeThickSph = document.getElementById('kbadge_thickSph');
  
  // Toggle groups
  DOM.innerRGroup = document.getElementById('inner_r_group');
  DOM.alphaGroup = document.getElementById('alpha_group');
  DOM.rowTracesFg = document.getElementById('row_traces_fg');
  
  // Buttons
  DOM.playBtn = document.getElementById('play_btn');
  DOM.pauseBtn = document.getElementById('pause_btn');
  DOM.resetBtn = document.getElementById('reset_btn');
  DOM.exportAll = document.getElementById('export_all_btn');
  DOM.exportDiagram = document.getElementById('export_diagram_btn');
  DOM.themeToggle = document.getElementById('theme_toggle');
  
  // Toggles
  DOM.togSpTrace = document.getElementById('tog_sp_trace');
  DOM.togTraces = document.getElementById('tog_traces');
  DOM.togTracesFg = document.getElementById('tog_traces_fg');
  DOM.togV = document.getElementById('tog_v');
  DOM.togA = document.getElementById('tog_a');
  DOM.togFg = document.getElementById('tog_fg');
  DOM.togFn = document.getElementById('tog_fn');
  DOM.togFr = document.getElementById('tog_fr');
  DOM.togFollow = document.getElementById('tog_follow');
}
