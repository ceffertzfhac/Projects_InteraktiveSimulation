'use strict'

import { store, DOM } from './state.js'
import { initUI } from './ui.js'
import { initRender, updateScene, updateFlow } from './render.js'
import { computePhysics } from './physics.js'

function initDOM() {
  // Input Modes
  DOM.mode_u = document.getElementById('mode_u')
  DOM.mode_i = document.getElementById('mode_i')
  DOM.dir_tech = document.getElementById('dir_tech')
  DOM.dir_phys = document.getElementById('dir_phys')
  DOM.flow_par = document.getElementById('flow_par')
  DOM.flow_antipar = document.getElementById('flow_antipar')
  
  // Parameter Sliders
  DOM.u_group = document.getElementById('u_group')
  DOM.i_group = document.getElementById('i_group')
  DOM.voltage_slider = document.getElementById('voltage_slider')
  DOM.voltage_val = document.getElementById('voltage_val')
  DOM.current_slider = document.getElementById('current_slider')
  DOM.current_val = document.getElementById('current_val')
  DOM.length_slider = document.getElementById('length_slider')
  DOM.length_val = document.getElementById('length_val')
  DOM.cross_section_slider = document.getElementById('cross_section_slider')
  DOM.cross_section_val = document.getElementById('cross_section_val')
  DOM.spring_k_slider = document.getElementById('spring_k_slider')
  DOM.spring_k_val = document.getElementById('spring_k_val')
  DOM.distance_slider = document.getElementById('distance_slider')
  DOM.distance_val = document.getElementById('distance_val')

  // UI elements
  DOM.tog_bfield = document.getElementById('tog_bfield')
  DOM.tog_forces = document.getElementById('tog_forces')
  DOM.tog_current = document.getElementById('tog_current')
  DOM.tog_flow = document.getElementById('tog_flow')
  DOM.theme_toggle = document.getElementById('theme_toggle')
  DOM.reset_btn = document.getElementById('reset_btn')
  DOM.analysis_toggle = document.getElementById('analysis_toggle')
  DOM.app_layout = document.querySelector('.app-layout')

  // SVG groups
  DOM.main_svg = document.getElementById('main_svg')
  DOM.field_g = document.getElementById('field_g')
  DOM.flow_g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  DOM.main_svg.appendChild(DOM.flow_g)
  DOM.leads_g = document.getElementById('leads_g')
  DOM.lead1_l = document.getElementById('lead1_l')
  DOM.lead1_r = document.getElementById('lead1_r')
  DOM.lead2_l = document.getElementById('lead2_l')
  DOM.lead2_r = document.getElementById('lead2_r')
  DOM.springs_g = document.getElementById('springs_g')
  DOM.cond2_group = document.getElementById('cond2_group')
  DOM.vectors_g = document.getElementById('vectors_g')
  DOM.status_label = document.getElementById('status_label')

  // Gauges
  DOM.v_gauge_fill = document.getElementById('v_gauge_fill')
  DOM.i_gauge_fill = document.getElementById('i_gauge_fill')
  DOM.v_gauge_val = document.getElementById('v_gauge_val')
  DOM.i_gauge_val = document.getElementById('i_gauge_val')
  DOM.v_marker_0 = document.getElementById('v_marker_0')
  DOM.v_marker_1 = document.getElementById('v_marker_1')
  DOM.v_marker_2 = document.getElementById('v_marker_2')
  DOM.i_marker_0 = document.getElementById('i_marker_0')
  DOM.i_marker_1 = document.getElementById('i_marker_1')
  DOM.i_marker_2 = document.getElementById('i_marker_2')

  // Analysis values
  DOM.res_val = document.getElementById('res_val')
  DOM.cur_val = document.getElementById('cur_val')
  DOM.force_val = document.getElementById('force_val')
  DOM.dist_curr_val = document.getElementById('dist_curr_val')
  DOM.delta_y_val = document.getElementById('delta_y_val')
}

function main() {
  initDOM()
  initRender()
  initUI()
  computePhysics()
  updateScene()
  
  // Animation loop
  function tick(timestamp) {
    if (store.showFlow && store.current > 0) {
      store.flowTime += store.current * 0.0001 // Slowed down for visibility
      updateFlow()
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

document.addEventListener('DOMContentLoaded', main)
