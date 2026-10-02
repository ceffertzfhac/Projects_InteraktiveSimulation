'use strict'
// Einstiegspunkt (ES-Modul, kein main.js): DOM-Cache, Theme, Bühne, Presenter.
// Der Presenter (shared/js/step-engine.js) baut Transportleiste, Kapitel-Tabs und
// Tastatursteuerung und erzeugt pro Kapitel eine frische Szene + Engine.

import { createStepEngine, createPresenter } from '../../shared/js/step-engine.js'
import { store, DOM, initDOM, createScene } from './state.js'
import { initStage, renderScene } from './render.js'
import { buildSteps } from './steps.js'
import { createSpeedScene } from './division/scene.js'
import { initSpeedStage, renderSpeed } from './division/render.js'
import { buildSpeedSteps } from './division/steps.js'
import { fillSpeedCards } from './division/content.js'

function setupTheme() {
  document.body.classList.add(localStorage.getItem('fh_theme') || 'light')
  document.body.classList.toggle('light', !document.body.classList.contains('dark'))
  DOM.themeToggle.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark')
    document.body.classList.toggle('light', !dark)
    localStorage.setItem('fh_theme', dark ? 'dark' : 'light')
  })
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
initDOM()
setupTheme()
// Jedes Kapitel zeichnet in eine eigene Gruppe; sichtbar ist nur die des aktiven.
const groups = { multiplikation: initStage(DOM.svg, DOM), division: initSpeedStage(DOM.svg) }
fillSpeedCards(DOM)

store.presenter = createPresenter({
  root: DOM.transport,
  onChapter: id => {
    for (const [k, g] of Object.entries(groups)) g.style.display = k === id ? '' : 'none'
  },
  chapters: [
    {
      id: 'multiplikation', title: 'Multiplikation',
      create: (onChange, onTick) => {
        const S = store.scene = createScene()
        return createStepEngine({ steps: buildSteps(S, DOM), scene: S, render: renderScene, onChange, onTick })
      },
    },
    {
      id: 'division', title: 'Division',
      create: (onChange, onTick) => {
        const S = store.scene = createSpeedScene()
        return createStepEngine({ steps: buildSpeedSteps(S, DOM), scene: S, render: renderSpeed, onChange, onTick })
      },
    },
    { id: 'addition', title: 'Addition', disabled: true },   // → BACKLOG FSS1
  ],
})
