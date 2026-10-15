'use strict'
// Das Drehbuch: je Kapitel ein Array von Schritten { title, hold?, build(tl, S) }.
// build() hängt NUR Tweens/Sets an tl an (Reversibilitäts-Regel, Blueprint §10).
// Planer (Kamera, Karten) laufen zur Build-Zeit und kennen daher den Zustand am Ende
// jedes Schritts. Alle Zahlen kommen aus store.data (model.js, Seed je Durchlauf).

import { createCamera, createCardDeck } from '../../shared/js/step-kit.js'
import { beat } from '../../shared/js/step-engine.js'
import { T, EASE } from './constants.js'
import { START, store } from './state.js'

export function buildSteps(S, DOM) {
  const cam = createCamera(S, START)
  const deck = createCardDeck()
  const D = store.data
  const C = DOM.cards

  // Punkte i … j−1 nacheinander einblenden
  const dots = (tl, from, to, { gap = 0.22, at } = {}) => {
    for (let i = from; i < to; i++) {
      tl.to(S, { ['d' + i]: 1, duration: T.dot, ease: EASE.pop }, i === from ? at : `<${gap}`)
    }
  }

  // ── Kapitel 1: Bestwert ────────────────────────────────────────────────────
  const k1 = [
    {
      title: 'Messgröße', hold: 4,
      build: tl => {
        tl.to(S, { axisDraw: 1, duration: T.draw, ease: EASE.cam })
        tl.to(S, { ticks: 1, duration: 0.6 }, '>-0.3')
        deck.show(tl, C.k1_g, '<0.2')
      },
    },
    {
      title: '„Wahrer Wert“', hold: 4,
      build: tl => {
        tl.to(S, { tv: 1, duration: T.pop, ease: 'power2.out' })
        deck.show(tl, C.k1_true, '<0.1')
        beat(tl)
      },
    },
    {
      title: 'Unbekannt', hold: 4,
      build: tl => {
        tl.to(S, { tvF: 0, duration: 1.1, ease: 'power1.inOut' })
        deck.show(tl, C.k1_unknown, '<')
      },
    },
    {
      title: 'Messreihe', hold: 5,
      build: tl => {
        deck.show(tl, C.k1_series, '<')
        dots(tl, 0, 1)
        beat(tl)
        dots(tl, 1, 10)
        beat(tl)
      },
    },
    {
      title: 'Bestwert', hold: 6,
      build: tl => {
        tl.to(S, { nl: 0, duration: 0.8, ease: 'power1.inOut' })
        deck.show(tl, C.k1_mean, '<0.2')
        beat(tl)
        tl.set(S, { mx: D.n10.mean })
        tl.to(S, { mA: 1, duration: 0.7, ease: 'power2.out' })
        beat(tl)
      },
    },
    {
      title: 'Merke · Bestwert', hold: 8,
      build: tl => {
        deck.show(tl, C.k1_rule, '<')
      },
    },
  ]

  return { k1, k2: [], k3: [] }
}
