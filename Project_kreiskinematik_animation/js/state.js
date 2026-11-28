'use strict'
// Zustand. Die Szene ist ein flaches Objekt aus ZAHLEN — GSAP tweent sie, render.js liest sie.
// Keine Strings (Texte = Index in eine Tabelle), damit jeder Schritt exakt rückwärts abspielbar ist.

import { CAM_FRONT, VECTORS } from './constants.js'

export const store = { presenter: null, scene: null, stage3d: null }   // scene = Szene des aktiven Kapitels

// Je Vektor: A (Deckkraft Pfeil), G (Wachstum 0 … 1), Lab (Beschriftung an der Spitze), Leg (Legende)
const vecKeys = k => ({ [k + 'A']: 0, [k + 'G']: 0, [k + 'Lab']: 0, [k + 'Leg']: 0 })

export function createScene() {
  return {
    ...CAM_FRONT,
    axDraw: 0, axLab: 0,          // Koordinatenachsen einzeichnen, Achsennamen
    plA: 0,                       // Ebenenstück P3
    ...Object.keys(VECTORS).reduce((o, k) => ({ ...o, ...vecKeys(k) }), {}),
    nMix: 0,                      // Farbe des Normalenvektors: 0 = Grau (n), 1 = Mint (ω)
    rU: -0.9, rV: 0.6,            // Spitze des Ortsvektors in Ebenenkoordinaten (P3)
    ptA: 0,                       // Punkt an der Spitze des Ortsvektors
  }
}

export const DOM = {}
export function initDOM() {
  DOM.svg = document.getElementById('stage_svg')
  DOM.stage3d = document.getElementById('stage_3d')
  DOM.transport = document.getElementById('transport')
  DOM.themeToggle = document.getElementById('theme_toggle')
  DOM.viewReset = document.getElementById('view_reset')
  DOM.cards = Object.fromEntries([...document.querySelectorAll('[data-card]')].map(c => [c.dataset.card, c]))
  DOM.labels = Object.fromEntries([...document.querySelectorAll('[data-lab]')].map(c => [c.dataset.lab, c]))
  DOM.legend = Object.fromEntries([...document.querySelectorAll('[data-leg]')].map(c => [c.dataset.leg, c]))
}
