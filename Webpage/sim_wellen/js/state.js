'use strict'

import { D_DEFAULT, LAMBDA_DEFAULT, PHASE_DEFAULT, DETECTOR_DEFAULT } from './constants.js'

// ── Mutierbarer Zustand (einzige Quelle für alle veränderlichen Werte) ───────
export const store = {
  d: D_DEFAULT,           // cm, Quellabstand
  lambda: LAMBDA_DEFAULT, // cm, Wellenlänge
  phaseDeg: PHASE_DEFAULT,// Grad, Phasenoffset S₂
  time: 0,                // s, seit Play kontinuierlich (kein precompute — s. KNOWN_LIMITATIONS)
  running: false,
  speed: 1.0,             // Tempo-Multiplikator (Slider 0–200% → 0–2.0)
  mode: 'wave',            // 'wave' | 'intensity'
  detector: { ...DETECTOR_DEFAULT }, // cm, relativ zur Mitte
  showNodal: false,
  showScreen: false,

  isDarkMode: false,
}

// ── DOM-Cache ────────────────────────────────────────────────────────────────
export const DOM = {}

const q = id => document.getElementById(id)

export function initDOM() {
  DOM.canvas = q('wave_canvas')
  DOM.ctx = DOM.canvas.getContext('2d', { alpha: false })
  DOM.visContainer = q('vis_container')
  DOM.overlaySvg = q('overlay_svg')
  DOM.geoLayer = q('geometry_layer')
  DOM.screenLine = q('screen_line')
  DOM.src1 = q('source1'); DOM.src2 = q('source2')
  DOM.lblS1 = q('lbl_s1'); DOM.lblS2 = q('lbl_s2')
  DOM.detectorGrp = q('detector_group')

  // Steuerung (linke Sidebar)
  DOM.slDist = q('sl_dist'); DOM.valDist = q('val_dist')
  DOM.slLambda = q('sl_lambda'); DOM.valLambda = q('val_lambda')
  DOM.slPhase = q('sl_phase'); DOM.valPhase = q('val_phase')
  DOM.slSpeed = q('sl_speed')
  DOM.radMode = Array.from(document.querySelectorAll('input[name="mode"]'))
  DOM.chkNodal = q('chk_nodal')
  DOM.chkScreen = q('chk_screen')

  DOM.playBtn = q('play_btn')
  DOM.pauseBtn = q('pause_btn')
  DOM.resetBtn = q('reset_btn')

  // Graph
  DOM.graphSvg = q('graph_svg')
  DOM.graphGrid = q('graph_grid')
  DOM.graphTitle = q('graph_title')
  DOM.timeGraphPaths = q('time_graph_paths')
  DOM.pathU1 = q('path_u1'); DOM.pathU2 = q('path_u2'); DOM.pathSum = q('path_sum')
  DOM.pathIntensity = q('path_intensity')
  DOM.legendTime = q('legend_time')
  DOM.legendIntensity = q('legend_intensity')

  // Rechte Analyse-Sidebar
  DOM.outR1 = q('out_r1'); DOM.outR2 = q('out_r2')
  DOM.outDs = q('out_ds'); DOM.outRatio = q('out_ratio')
  DOM.outDphi = q('out_dphi')
  DOM.outType = q('out_type'); DOM.outAmp = q('out_amp')

  // Topbar & Layout
  DOM.themeToggle = q('theme_toggle')
  DOM.appLayout = q('app_layout')
  DOM.analysisToggle = q('analysis_toggle')
}
