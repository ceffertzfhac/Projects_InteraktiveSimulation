'use strict'

export const MU0 = 4 * Math.PI * 1e-7
export const RHO_CU = 0.0178 // Ohm * mm^2 / m
export const G = 9.81

// UI & Rendering Constants
// Adjusted SCALE: 1000mm should fit well in 500px SVG => 1mm = 0.3px
export const SCALE = 0.3 
export const Y_COND1 = 430 // Lower conductor
export const Y_CEILING = 20
export const SVG_W = 700
export const SVG_H = 500

export const COLORS = {
  VEL: 'var(--c-vel)',
  ACC: 'var(--c-acc)',
  FORCE_L: 'var(--c-force-l)', 
  FORCE_S: 'var(--c-force-s)', 
  BFIELD: 'var(--c-bfield)',
  CURRENT: 'var(--c-current)',
  CURRENT_PHYS: 'var(--c-current-phys)'
}
