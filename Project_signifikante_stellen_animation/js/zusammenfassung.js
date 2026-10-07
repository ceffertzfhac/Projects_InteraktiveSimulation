'use strict'
// Kapitel „Zusammenfassung" (→ BACKLOG FSS9 w): drei Vollfolien — Grundlagen ·
// Multiplikation und Division · Addition und Subtraktion —, je Regel und zwei Beispiele
// (Beispiel A, B). Keine Bühne: die Folien decken sie ganz ab; die Szene ist leer.

import { svgEl, createCardDeck } from '../../shared/js/step-kit.js'

export const createSummaryScene = () => ({ dim: 0 })

export function initSummaryStage(svg) {
  return svgEl('g', { class: 'summary-stage' }, svg)
}
export const renderSummary = () => {}

export function buildSummarySteps(S, DOM) {
  const C = DOM.cards
  const deck = createCardDeck()
  const steps = []
  const step = (title, card) => steps.push({ title, hold: 10, build: tl => {
    deck.show(tl, card)
    tl.to(card.querySelectorAll('.zs-ex'), { autoAlpha: 1, duration: 0.5, stagger: 0.9 }, '>0.6')
  } })
  step('Grundlagen', C.zs_grund)
  step('Multiplikation und Division', C.zs_mult)
  step('Addition und Subtraktion', C.zs_add)
  return steps
}
