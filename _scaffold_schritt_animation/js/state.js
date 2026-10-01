'use strict'
// Zustand. Die Szene ist ein flaches Objekt aus ZAHLEN — GSAP tweent sie,
// render.js liest sie. Keine Strings (Texte = Index in eine Tabelle), damit
// jeder Schritt exakt rückwärts abspielbar ist.

import { cameraKeys, slotKeys } from '../../shared/js/step-kit.js'
import { VIEW, AXIS_FRAC, START_WIDTH, VALUE_TEXTS } from './constants.js'
import { roundingInterval } from './model.js'

export const store = { presenter: null, scene: null }   // scene = Szene des aktiven Kapitels

// Startkamera: Messwert in der Mitte, Achse (y = 0) bei AXIS_FRAC der Höhe.
export const START = { view: VIEW, cx: roundingInterval(VALUE_TEXTS[0]).value, w: START_WIDTH }
START.cy = (0.5 - AXIS_FRAC) * START_WIDTH * (VIEW.vB - VIEW.vT) / (VIEW.vR - VIEW.vL)

export function createScene() {
  const v = roundingInterval(VALUE_TEXTS[0]).value
  return {
    ...cameraKeys(START),
    axisDraw: 0, ticks: 0,       // Achse einzeichnen, Teilung einblenden
    pA: 0, pS: 0.3,              // Messpunkt: Deckkraft, Skalierung
    lo: v, hi: v, bandA: 0,      // Intervallband
    ...slotKeys('lab'),          // überblendendes Wertelabel
  }
}

export const DOM = {}
export function initDOM() {
  DOM.svg = document.getElementById('stage_svg')
  DOM.transport = document.getElementById('transport')
  DOM.themeToggle = document.getElementById('theme_toggle')
  DOM.cards = {
    intro: document.getElementById('card_intro'),
    band: document.getElementById('card_band'),
    zoom: document.getElementById('card_zoom'),
  }
}
