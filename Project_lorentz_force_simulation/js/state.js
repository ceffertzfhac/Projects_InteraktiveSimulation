'use strict'

export const store = {
  // Input settings
  inputMode: 'voltage', // 'voltage' | 'current'
  directionMode: 'technical', // 'technical' | 'physical'
  currentFlowMode: 'parallel', // 'parallel' | 'antiparallel'
  
  // Electrical Parameters
  voltage: 0.590,       // U in V
  targetCurrent: 30.0,  // I in A (when in 'current' mode)
  length: 2.00,        // L in m
  crossSection: 4.00,   // A in mm^2
  
  // Mechanical Parameters
  springK: 8.788,       // D in N/m (per spring)
  distance0: 600.0,    // d0 in mm (standard 0.6m)
  
  // Computed physical values
  resistance: 0,       
  current: 0,          
  forceL: 0,           
  deltaY: 0,           
  distance: 0,         
  
  // UI State
  showBField: true,
  showForces: true,
  showCurrent: true,
  showFlow: false,
  flowTime: 0,
  isDarkMode: false
}

export const DOM = {}
