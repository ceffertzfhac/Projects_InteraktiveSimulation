'use strict'
// Das Drehbuch: ein Array von Schritten { title, hold?, build(tl, S) }.
// build() hängt NUR Tweens/Sets an tl an (Reversibilitäts-Regel, Blueprint §10).
// Planer (Kamera, Karten, Slots) laufen zur Build-Zeit und kennen daher den
// Zustand am Ende jedes Schritts — Übergänge schließen nahtlos an.

import { createCamera, createCardDeck, createSlots } from '../../shared/js/step-kit.js'
import { T, EASE, VALUE_TEXTS } from './constants.js'
import { START } from './state.js'
import { roundingInterval } from './model.js'

export function buildSteps(S, DOM) {
  const cam = createCamera(S, START)
  const deck = createCardDeck()
  const label = createSlots(S, 'lab')
  const coarse = roundingInterval(VALUE_TEXTS[0])
  const fine = roundingInterval(VALUE_TEXTS[1])

  return [
    {
      title: 'Zahlengerade',
      build: tl => {
        tl.to(S, { axisDraw: 1, duration: T.draw, ease: EASE.cam })
        deck.show(tl, DOM.cards.intro, '<0.3')
      },
    },
    {
      title: 'Messwert',
      build: tl => {
        tl.to(S, { pA: 1, pS: 1, duration: T.pop, ease: EASE.pop })
        label.show(tl, 0, { at: '<0.15' })
        tl.to(S, { ticks: 1, duration: 0.6 }, '<')
      },
    },
    {
      title: 'Rundungsintervall',
      build: tl => {
        tl.to(S, { bandA: 1, lo: coarse.lo, hi: coarse.hi, duration: 0.9, ease: EASE.reveal })
        deck.show(tl, DOM.cards.band, '<0.2')
      },
    },
    {
      title: 'Zoom ×10',
      hold: 3,
      build: tl => {
        cam.to(tl, { w: START.w / 10 }, { duration: T.cam, anchor: { y: 0 } })
        label.show(tl, 1, { at: '<0.2' })
        tl.to(S, { lo: fine.lo, hi: fine.hi, duration: 0.9, ease: EASE.cam }, '<0.3')
        deck.show(tl, DOM.cards.zoom, '<')
      },
    },
  ]
}
