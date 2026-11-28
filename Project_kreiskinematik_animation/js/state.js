'use strict'
// Zustand. Die Szene ist ein flaches Objekt aus ZAHLEN — GSAP tweent sie, render.js liest sie.
// Keine Strings (Texte = Index in eine Tabelle), damit jeder Schritt exakt rückwärts abspielbar ist.

export const store = { presenter: null, scene: null }   // scene = Szene des aktiven Kapitels

export function createScene() {
  return {}
}

export const DOM = {}
export function initDOM() {
  DOM.svg = document.getElementById('stage_svg')
  DOM.stage3d = document.getElementById('stage_3d')
  DOM.transport = document.getElementById('transport')
  DOM.themeToggle = document.getElementById('theme_toggle')
  DOM.cards = Object.fromEntries([...document.querySelectorAll('[data-card]')].map(c => [c.dataset.card, c]))
}
