'use strict'
// Einstiegspunkt (ES-Modul, kein main.js): Durchlauf (Seed), DOM-Cache, Theme, Bühne, Presenter.
// Der Presenter baut Transportleiste, Kapitel-Tabs und Tastatur und erzeugt pro Kapitel eine
// frische Szene + Engine. Kapitel 2 und 3 spielen ihre Vorgänger still als Vorspann ab.

import { createStepEngine, createPresenter } from '../../shared/js/step-engine.js'
import { store, DOM, initDOM, initData, createScene } from './state.js'
import { initStage, renderScene } from './render.js'
import { buildSteps } from './steps.js'
import { fillCards } from './content.js'

function setupTheme() {
  document.body.classList.add(localStorage.getItem('fh_theme') || 'light')
  document.body.classList.toggle('light', !document.body.classList.contains('dark'))
  DOM.themeToggle.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark')
    document.body.classList.toggle('light', !dark)
    localStorage.setItem('fh_theme', dark ? 'dark' : 'light')
  })
}

// Neuer Durchlauf = neuer Seed in der Adresse, Seite neu laden (Position im Hash bleibt)
function setupNewRun() {
  document.getElementById('new_run').addEventListener('click', () => {
    const u = new URL(location.href)
    u.searchParams.set('s', String(Math.floor(Math.random() * 1e9)))
    location.href = u.toString()
  })
  const seed = document.getElementById('seed_info')
  if (seed) seed.textContent = 'Durchlauf ' + store.seed
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
initData()
initDOM()
setupTheme()
setupNewRun()
initStage(DOM.svg)
fillCards()

// Kapitel n beginnt dort, wo Kapitel n−1 endet: dessen Schritte werden vorab still auf die
// Szene angewendet — der Planer kennt so den Zustand.
function engineFor(which, onChange, onTick) {
  const S = store.scene = createScene()
  const steps = buildSteps(S, DOM)
  const order = ['k1', 'k2', 'k3']
  const g = window.gsap, pre = g.timeline({ paused: true })
  for (const k of order.slice(0, order.indexOf(which))) {
    steps[k].forEach(st => { const sub = g.timeline(); st.build(sub, S); pre.add(sub) })
  }
  pre.progress(1)
  pre.kill()
  return createStepEngine({ steps: steps[which], scene: S, render: renderScene, onChange, onTick })
}

store.presenter = createPresenter({
  root: DOM.transport,
  onChapter: () => { window.gsap.set(Object.values(DOM.cards), { autoAlpha: 0 }) },
  chapters: [
    { id: 'bestwert', title: 'Bestwert', create: (c, t) => engineFor('k1', c, t) },
    { id: 'stabw', title: 'Standardabweichung', create: (c, t) => engineFor('k2', c, t) },
    { id: 'unsicherheit', title: 'Messunsicherheit', create: (c, t) => engineFor('k3', c, t) },
  ],
})

// Formeln einmal setzen (statisches HTML, kein Setzen zur Laufzeit) — erst, wenn Layout und
// Schrift stehen: Karten messen ihre Schrift in cqw; bei Bühnenbreite 0 würde MathJax
// „Infinity“-Breiten erzeugen.
function typesetWhenReady(tries = 0) {
  const card = document.querySelector('.slide-card')
  const ok = window.MathJax?.startup?.promise && document.readyState === 'complete' &&
    parseFloat(getComputedStyle(card).fontSize) > 6
  if (!ok && tries < 100) return void setTimeout(() => typesetWhenReady(tries + 1), 80)
  Promise.all([document.fonts.ready, window.MathJax.startup.promise])
    .then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
    .then(() => window.MathJax.typesetPromise())
}
typesetWhenReady()
