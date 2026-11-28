'use strict'
// Einstiegspunkt (ES-Modul, kein main.js): DOM-Cache, Theme, Bühne, Presenter, Druck.

import { createStepEngine, createPresenter } from '../../shared/js/step-engine.js'
import { createPrint } from '../../shared/js/step-print.js'
import { store, DOM, initDOM, createScene } from './state.js'
import { initStage, renderScene } from './render.js'
import { buildSteps } from './steps.js'
import { CHAPTERS } from './constants.js'

function setupTheme() {
  document.body.classList.add(localStorage.getItem('fh_theme') || 'light')
  document.body.classList.toggle('light', !document.body.classList.contains('dark'))
  DOM.themeToggle.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark')
    document.body.classList.toggle('light', !dark)
    localStorage.setItem('fh_theme', dark ? 'dark' : 'light')
    store.presenter?.engine?.refresh()
  })
}

// Kapitel n beginnt dort, wo Kapitel n−1 endet: dessen Schritte laufen vorab still (Vorspann).
function engineFor(id, onChange, onTick) {
  const S = store.scene = createScene()
  const steps = buildSteps(S, DOM)
  const order = CHAPTERS.map(c => c.id).filter(k => steps[k])
  const g = window.gsap, pre = g.timeline({ paused: true })
  for (const k of order.slice(0, order.indexOf(id))) {
    steps[k].forEach(st => { const sub = g.timeline(); st.build(sub, S); pre.add(sub) })
  }
  pre.progress(1)
  pre.kill()
  return createStepEngine({ steps: steps[id], scene: S, render: renderScene, onChange, onTick })
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
initDOM()
setupTheme()
initStage(DOM)

const built = buildSteps(createScene(), DOM)
store.presenter = createPresenter({
  root: DOM.transport,
  onChapter: () => { window.gsap.set(Object.values(DOM.cards), { autoAlpha: 0 }) },
  chapters: CHAPTERS.map(c => built[c.id]
    ? { ...c, create: (ch, t) => engineFor(c.id, ch, t) }
    : { ...c, disabled: true }),
})

createPrint({
  presenter: store.presenter, button: document.getElementById('print_btn'),
  popover: document.getElementById('print_pop'), stage: document.querySelector('.stage'),
  docTitle: 'Kreiskinematik und Vektorrechnung',
})

// Formeln einmal setzen (statisches HTML) — erst, wenn Layout und Schrift stehen.
function typesetWhenReady(tries = 0) {
  const card = document.querySelector('.slide-card')
  const ok = window.MathJax?.startup?.promise && document.readyState === 'complete' &&
    parseFloat(getComputedStyle(card).fontSize) > 6
  if (!ok && tries < 100) return void setTimeout(() => typesetWhenReady(tries + 1), 80)
  Promise.all([document.fonts.ready, window.MathJax.startup.promise])
    .then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
    .then(() => window.MathJax.typesetPromise())
    .then(() => store.presenter.engine?.refresh())
}
typesetWhenReady()
