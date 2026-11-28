'use strict'
// Einstiegspunkt (ES-Modul, kein main.js): DOM-Cache, Theme, 3D-Bühne, Presenter, Druck,
// freie Kamera (nur bei Pause, weiche Rückfahrt).

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

// Freie Kamera (E12): Drehen/Zoomen nur, wenn weder Auto-Play läuft noch ein Schritt abgespielt
// wird; nächster Schritt, Auto-Play, Taste R und Knopf „Ansicht“ fahren weich zurück.
function setupFreeCamera() {
  const st = store.stage3d
  const eng = () => store.presenter?.engine
  st.setAllowed(() => { const e = eng(); return !!e && !e.playing && !e.busy })
  st.setRedraw(() => { if (store.scene) renderScene(store.scene) })
  st.onUser = active => DOM.viewReset.classList.toggle('on', active)
  DOM.viewReset.addEventListener('click', () => st.resetUser())
  document.addEventListener('keydown', e => {
    if (e.target.closest('textarea, select, input:not([type=radio]):not([type=checkbox])')) return
    if ((e.key !== 'r' && e.key !== 'R') || e.altKey || e.ctrlKey || e.metaKey) return
    st.resetUser()
    e.preventDefault()
  })
}

// Kapitel n beginnt dort, wo Kapitel n−1 endet: dessen Schritte laufen vorab still (Vorspann).
function engineFor(id, onChange, onTick) {
  const S = store.scene = createScene()
  const steps = buildSteps(S, DOM)
  const order = CHAPTERS.filter(c => !c.standalone && steps[c.id]).map(c => c.id)
  const g = window.gsap, pre = g.timeline({ paused: true })
  for (const k of order.slice(0, Math.max(0, order.indexOf(id)))) {
    steps[k].forEach(st => { const sub = g.timeline(); st.build(sub, S); pre.add(sub) })
  }
  pre.progress(1)
  pre.kill()
  // Schritt läuft oder Auto-Play startet → freie Ansicht weich zurück auf die Drehbuch-Kamera
  const change = st => { if (st.busy || st.playing) store.stage3d.resetUser(); onChange(st) }
  return createStepEngine({ steps: steps[id], scene: S, render: renderScene, onChange: change, onTick })
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
initDOM()
setupTheme()
initStage(DOM)
setupFreeCamera()

const built = buildSteps(createScene(), DOM)
store.presenter = createPresenter({
  root: DOM.transport,
  onChapter: () => { window.gsap.set(Object.values(DOM.cards), { autoAlpha: 0 }) },
  chapters: CHAPTERS.map(c => built[c.id]
    ? { id: c.id, title: c.title, create: (ch, t) => engineFor(c.id, ch, t) }
    : { id: c.id, title: c.title, disabled: true }),
})

createPrint({
  presenter: store.presenter, button: document.getElementById('print_btn'),
  popover: document.getElementById('print_pop'), stage: document.querySelector('.stage'),
  docTitle: 'Kreiskinematik und Vektorrechnung',
  before: () => store.stage3d.clearUser(),
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
