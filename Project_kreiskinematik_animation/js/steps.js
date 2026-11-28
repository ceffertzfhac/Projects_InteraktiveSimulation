'use strict'
// Das Drehbuch: je Kapitel ein Array von Schritten { title, hold?, build(tl, S) }.
// build() hängt NUR Tweens/Sets an tl an (Reversibilitäts-Regel, Blueprint §10).

import { createCardDeck } from '../../shared/js/step-kit.js'

export function buildSteps(S, DOM) {
  const deck = createCardDeck()
  return {
    normalform: [
      { title: 'Normalform der Ebene', build: tl => { deck.show(tl, DOM.cards.k1_title) } },
    ],
  }
}
