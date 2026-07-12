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

// Feder-Darstellung (draw3DSpring in render.js) — visuelle Helix-Parameter.
// Zentral hier, damit sie nicht als Magic Numbers im Render-Code stehen.
export const SPRING = {
  COILS: 14,                     // Windungen
  RADIUS: 7,                     // Helix-Radius (px)
  WIRE_WIDTH: 2.6,                // Drahtbreite (px)
  HOOK_H: 15,                     // Hook-Länge oben/unten (px)
  MIN_ACTIVE_H: 5,                // darunter: Fallback als gerade Linie
  HELIX_STEPS: 12,                // Sample-Schritte je Bogen
  // Strichbreiten-Multiplatoren / -Addenden (relativ zu WIRE_WIDTH)
  BACK_WIDTH_FACTOR: 0.8,          // Hintergrund-Bogen
  FRONT_OUTLINE_EXTRA: 1.0,        // Front-Kontur zusätzlich zur Drahtbreite
  FRONT_HIGHLIGHT_FACTOR: 0.3,     // Front-Highlight
  HIGHLIGHT_OPACITY: 0.5,
  // Farben (keine Vektor-/Theme-Farben — Feder-Material)
  COLOR_BACK: '#333',
  COLOR_FRONT_OUTLINE: '#111',
  COLOR_HIGHLIGHT: '#fff',
  COLOR_HOOK: '#555',
  COLOR_FALLBACK: '#666',
  HOOK_STROKE_WIDTH: 2,
  FALLBACK_STROKE_WIDTH: 2,
}
