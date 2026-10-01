'use strict'
// Einstiegspunkt (ES-Modul, kein main.js): DOM-Cache, Theme, Bühne, Presenter.
// Der Presenter (shared/js/step-engine.js) baut Transportleiste, Kapitel-Tabs und
// Tastatursteuerung und erzeugt pro Kapitel eine frische Szene + Engine.

import { createStepEngine, createPresenter } from '../../shared/js/step-engine.js'
import { store, DOM, initDOM, createScene } from './state.js'
import { initStage, renderScene } from './render.js'
import { buildSteps } from './steps.js'

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
initStage(DOM.svg, DOM)

store.presenter = createPresenter({
  root: DOM.transport,
  chapters: [
    {
      id: 'multiplikation', title: 'Multiplikation',
      create: onChange => {
        const S = store.scene = createScene()
        return createStepEngine({ steps: buildSteps(S, DOM), scene: S, render: renderScene, onChange })
      },
    },
    { id: 'addition', title: 'Addition', disabled: true },   // → BACKLOG FSS1
  ],
})
