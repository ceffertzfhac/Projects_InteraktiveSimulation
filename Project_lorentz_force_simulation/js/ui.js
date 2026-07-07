'use strict'

import { store, DOM } from './state.js'
import { computePhysics, calculateMinSpringK } from './physics.js'
import { RHO_CU } from './constants.js'
import { updateScene } from './render.js'

/**
 * Handles parameter changes.
 */
function onParamChange() {
  store.inputMode = DOM.mode_u.checked ? 'voltage' : 'current'
  store.directionMode = DOM.dir_tech.checked ? 'technical' : 'physical'
  store.currentFlowMode = DOM.flow_par.checked ? 'parallel' : 'antiparallel'
  
  store.voltage = parseFloat(DOM.voltage_slider.value)
  store.targetCurrent = parseFloat(DOM.current_slider.value)
  store.length = parseFloat(DOM.length_slider.value)
  store.crossSection = parseFloat(DOM.cross_section_slider.value)
  store.distance0 = parseFloat(DOM.distance_slider.value)

  // 1. Dynamic Spring Limit
  // Only matters if flow is parallel (attracting)
  if (store.currentFlowMode === 'parallel') {
    // We need to estimate current for U mode to set limit
    const estimatedI = (store.inputMode === 'voltage') ? 
                       (store.voltage / (RHO_CU * store.length / store.crossSection)) :
                       store.targetCurrent
    
    const minD = calculateMinSpringK(estimatedI, store.length, store.distance0)
    
    // Update Slider UI
    DOM.spring_k_slider.min = minD.toFixed(2)
    // If current D is too low, force it up
    if (parseFloat(DOM.spring_k_slider.value) < minD) {
      DOM.spring_k_slider.value = minD.toFixed(2)
    }
    // Also ensure max is at least above min
    if (parseFloat(DOM.spring_k_slider.max) < minD + 5) {
      DOM.spring_k_slider.max = (minD + 20).toFixed(0)
    }
  } else {
    // Reset to defaults for repulsive mode
    DOM.spring_k_slider.min = "2.00"
    DOM.spring_k_slider.max = "25.00"
  }

  store.springK = parseFloat(DOM.spring_k_slider.value)
  
  // Visibility of input groups
  DOM.u_group.style.display = store.inputMode === 'voltage' ? 'block' : 'none'
  DOM.i_group.style.display = store.inputMode === 'current' ? 'block' : 'none'
  
  // Update labels
  DOM.voltage_val.textContent = store.voltage.toLocaleString('de-DE', { minimumFractionDigits: 3 }) + ' V'
  DOM.current_val.textContent = store.targetCurrent.toLocaleString('de-DE') + ' A'
  DOM.length_val.textContent = store.length.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' m'
  DOM.cross_section_val.textContent = store.crossSection.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' mm²'
  DOM.spring_k_val.textContent = store.springK.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' N/m'
  DOM.distance_val.textContent = store.distance0.toLocaleString('de-DE', { minimumFractionDigits: 0 }) + ' mm'
  
  computePhysics()
  updateScene()
}

/**
 * Handles visibility toggles.
 */
function onToggleChange() {
  store.showForces = DOM.tog_forces.checked
  store.showFlow = DOM.tog_flow.checked
  store.showCurrent = DOM.tog_current.checked
  updateScene()
}

/**
 * Event listeners.
 */
export function initUI() {
  // Theme aus lokalem Speicher laden (einheitlicher Key fh_theme, siehe CLAUDE.md)
  document.body.className = localStorage.getItem('fh_theme') === 'dark' ? 'dark' : 'light'
  store.isDarkMode = document.body.classList.contains('dark')

  // Input Sliders
  ;[DOM.voltage_slider, DOM.current_slider, DOM.length_slider, DOM.cross_section_slider, DOM.spring_k_slider, DOM.distance_slider].forEach(el => {
    el.addEventListener('input', onParamChange)
  });

  // Radio Buttons
  ;[DOM.mode_u, DOM.mode_i, DOM.dir_tech, DOM.dir_phys, DOM.flow_par, DOM.flow_antipar].forEach(el => {
    el.addEventListener('change', onParamChange)
  });

  // Toggles
  ;[DOM.tog_forces, DOM.tog_flow, DOM.tog_current].forEach(el => {
    el.addEventListener('change', onToggleChange)
  });
  
  DOM.theme_toggle.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark')
    document.body.classList.toggle('light', !dark)
    store.isDarkMode = dark
    localStorage.setItem('fh_theme', dark ? 'dark' : 'light')
  })

  // Einklappbare Analyse-Sidebar
  DOM.analysis_toggle.addEventListener('click', () => {
    const collapsed = DOM.app_layout.classList.toggle('analysis-collapsed')
    DOM.analysis_toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
  })
  
  DOM.reset_btn.addEventListener('click', () => {
    DOM.mode_u.checked = true
    DOM.dir_tech.checked = true
    DOM.flow_par.checked = true
    DOM.tog_flow.checked = false
    DOM.voltage_slider.value = 0.59
    DOM.current_slider.value = 30
    DOM.length_slider.value = 2.0
    DOM.cross_section_slider.value = 4.0
    DOM.spring_k_slider.value = 8.79
    DOM.distance_slider.value = 600
    onParamChange()
  })
}
