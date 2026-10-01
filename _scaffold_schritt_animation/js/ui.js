'use strict'
// Einstiegspunkt (ES-Modul, kein main.js): DOM-Cache, Theme, Bühne, Presenter.
// Der Presenter baut Transportleiste + Kapitel-Tabs + Tastatur und erzeugt pro
// Kapitel eine frische Szene + Engine.

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
initStage(DOM.svg)

store.presenter = createPresenter({
  root: DOM.transport,
  chapters: [
    {
      id: 'beispiel', title: 'Beispiel',
      create: onChange => {
        const S = store.scene = createScene()
        return createStepEngine({ steps: buildSteps(S, DOM), scene: S, render: renderScene, onChange })
      },
    },
    { id: 'kapitel2', title: 'Kapitel 2', disabled: true },
  ],
})
