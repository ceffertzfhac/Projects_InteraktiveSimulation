'use strict'
// Kapitel „Zusammenfassung" (→ BACKLOG FSS9 w): drei Vollfolien — Grundlagen ·
// Multiplikation und Division · Addition und Subtraktion —, je Regel und zwei Beispiele
// (Beispiel A, B). Keine Bühne: die Folien decken sie ganz ab; die Szene ist leer.

import { svgEl, createCardDeck } from '../../shared/js/step-kit.js'
import { beat as B } from '../../shared/js/step-engine.js'

export const createSummaryScene = () => ({ dim: 0 })

export function initSummaryStage(svg) {
  return svgEl('g', { class: 'summary-stage' }, svg)
}
export const renderSummary = () => {}

export function buildSummarySteps(S, DOM) {
  const C = DOM.cards
  const deck = createCardDeck()
  const steps = []
  // je Beispiel ein Zwischenhalt (Präsentationsmodus, FSS25)
  const step = (title, card) => steps.push({ title, hold: 10, build: tl => {
    deck.show(tl, card)
    card.querySelectorAll('.zs-ex').forEach((ex, i) => {
      B(tl)
      tl.to(ex, { autoAlpha: 1, duration: 0.5 }, i ? '>0.3' : '>0.6')
    })
    const task = card.querySelector('[data-r="task"]')       // Hinweis Übungsaufgaben (FSS27)
    if (task) { B(tl); tl.to(task, { autoAlpha: 1, duration: 0.5 }, '>0.4') }
  } })
  step('Grundlagen', C.zs_grund)
  step('Multiplikation und Division', C.zs_mult)
  step('Addition und Subtraktion', C.zs_add)
  return steps
}
