'use strict'

import { subjects, quantities } from './constants.js'

export const store = {
  // Parameter
  R: 0.5,            // Zylinderradius (m)
  Vc: 0.5,           // Schwerpunktgeschwindigkeit (m/s)
  omega: 1.0,        // Winkelgeschwindigkeit ω = Vc/R (rad/s)
  r_m: 0.45,         // Punktradius r = 0,9·R (m)
  speedFactor: 1.0,

  // Diagramm
  graphType: 'x',

  // Precompute-Zeitreihen (flat: sp_x, sp_y, … p4_aabs, t)
  fullData: {},

  // RAF-Bookkeeping
  aniFrameId: null,
  lastFrameTime: 0,
  simulatedTime: 0,
}

export const DOM = {}

export function initDOM() {
  const q = id => document.getElementById(id)

  // Szene
  DOM.mainSvg = q('main_svg')
  DOM.worldGroup = q('world_group')
  DOM.backgroundGroup = q('background_group')
  DOM.tracesGroup = q('traces_group')
  DOM.cylinderGroup = q('cylinder_group')
  DOM.cylinderBody = q('cylinder_body')
  DOM.points = {
    sp: q('sp_point'), p1: q('p1_point'), p2: q('p2_point'),
    p3: q('p3_point'), p4: q('p4_point'),
  }
  DOM.vectorsGroup = q('vectors_group')

  // Diagramm
  DOM.gridGroup = q('grid_group')
  DOM.graphTitle = q('graph_title')
  DOM.graphLine = {}, DOM.graphPoint = {}
  subjects.forEach(s => {
    DOM.graphLine[s] = q(`graph_line_${s}`)
    DOM.graphPoint[s] = q(`graph_point_${s}`)
  })

  // Regler / Buttons
  DOM.radiusSlider = q('radius_slider')
  DOM.velocitySlider = q('velocity_slider')
  DOM.radiusValue = q('radius_value')
  DOM.velocityValue = q('velocity_value')
  DOM.graphSelect = q('graph_select')
  DOM.speedRadios = document.querySelectorAll('input[name="speed"]')
  DOM.togSpTrace = q('toggle_sp_trace')
  DOM.togTraces = q('toggle_traces')
  DOM.togTraceZOrder = q('toggle_trace_z_order')
  DOM.togV = q('toggle_v_vectors')
  DOM.togA = q('toggle_a_vectors')
  DOM.subjectCheckboxes = {}
  subjects.forEach(s => { DOM.subjectCheckboxes[s] = q(`subject_${s}`) })
  DOM.playBtn = q('play_btn')
  DOM.pauseBtn = q('pause_btn')
  DOM.resetBtn = q('reset_btn')

  // Topbar / Layout
  DOM.themeToggle = q('theme_toggle')
  DOM.analysisToggle = q('analysis_toggle')
  DOM.appLayout = document.querySelector('.app-layout')
  DOM.timeLabel = q('time_label')

  // Live-Analyse
  DOM.analysisGroup = {}
  DOM.liveValue = {}
  subjects.forEach(s => {
    DOM.analysisGroup[s] = q(`analysis_group_${s}`)
    DOM.liveValue[s] = {}
    quantities.forEach(qq => { DOM.liveValue[s][qq] = q(`live_${s}_${qq}`) })
  })

  // Export
  DOM.exportAll = q('export_all_btn')
}