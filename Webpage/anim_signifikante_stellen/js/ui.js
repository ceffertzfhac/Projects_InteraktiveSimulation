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
// Kapitel Grundlagen und Multiplikation teilen Szene und Zeichnung (Teil 1 → Teil 2),
// Division hat eine eigene; sichtbar ist nur die Gruppe des aktiven Kapitels.
const groups = { grund: initStage(DOM.svg, DOM), division: initSpeedStage(DOM.svg) }
groups.mult = groups.grund
fillSpeedCards(DOM)

// Multiplikation beginnt dort, wo Grundlagen endet: dessen Schritte (+ Übergang)
// werden vorab still auf die Szene angewendet — der Planer kennt so den Zustand.
function multEngine(onChange, onTick) {
  const S = store.scene = createScene()
  const { grund, cleanup, mult } = buildSteps(S, DOM)
  const g = window.gsap, pre = g.timeline({ paused: true })
  grund.forEach(st => { const sub = g.timeline(); st.build(sub, S); pre.add(sub) })
  const sub = g.timeline(); cleanup(sub); pre.add(sub)
  pre.progress(1)
  pre.kill()
  return createStepEngine({ steps: mult, scene: S, render: renderScene, onChange, onTick })
}

store.presenter = createPresenter({
  root: DOM.transport,
  onChapter: id => {
    for (const [k, g] of Object.entries(groups)) if (k !== id) g.style.display = 'none'
    groups[id].style.display = ''
    // Folienkarten des vorigen Kapitels sicher ausblenden (sein Vorspann ist nicht Teil der Timeline)
    window.gsap.set(Object.values(DOM.cards), { autoAlpha: 0 })
  },
  chapters: [
    {
      id: 'grund', title: 'Grundlagen',
      create: (onChange, onTick) => {
        const S = store.scene = createScene()
        return createStepEngine({ steps: buildSteps(S, DOM).grund, scene: S, render: renderScene, onChange, onTick })
      },
    },
    { id: 'mult', title: 'Multiplikation', create: multEngine },
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
