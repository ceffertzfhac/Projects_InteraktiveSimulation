'use strict'
// Das Drehbuch: je Kapitel ein Array von Schritten { title, hold?, build(tl, S) }.
// build() hängt NUR Tweens/Sets an tl an (Reversibilitäts-Regel, Blueprint §10).
// beat(tl) = Zwischenhalt des Präsentationsmodus.

import { createCardDeck } from '../../shared/js/step-kit.js'
import { beat } from '../../shared/js/step-engine.js'
import { T, EASE, CAM_TYPICAL } from './constants.js'

export function buildSteps(S, DOM) {
  const deck = createCardDeck()
  const C = DOM.cards
  const cam = (tl, to, at, duration = T.cam) => tl.to(S, { ...to, duration, ease: EASE.cam }, at)
  const fade = (tl, vars, at) => tl.to(S, { ...vars, duration: T.fade, ease: 'power1.inOut' }, at)
  // Beschriftung an der Spitze → Legende (E13)
  const toLegend = (tl, k, at) => { fade(tl, { [k + 'Lab']: 0 }, at); fade(tl, { [k + 'Leg']: 1 }, '<0.15') }

  return {
    // ── Technischer Durchstich (FKI2/FKI3, E23) ──────────────────────────────
    durchstich: [
      {
        title: 'Koordinatensystem',
        build: tl => {
          deck.show(tl, C.d_axes)
          tl.to(S, { axDraw: 1, duration: T.draw, ease: EASE.reveal }, '<0.1')
          fade(tl, { axLab: 1 }, '>-0.4')
          beat(tl)
          cam(tl, CAM_TYPICAL)
        },
      },
      {
        title: 'Ebene und Normalenvektor',
        build: tl => {
          deck.show(tl, C.d_plane)
          cam(tl, { camAz: -14, camEl: 19, camTx: 0.5, camTy: 0.3, camTz: -0.8, camD: 16 }, '<')
          fade(tl, { plA: 1 }, '<0.6')
          beat(tl)
          tl.set(S, { nA: 1 })
          tl.to(S, { nG: 1, duration: T.reveal, ease: EASE.reveal })
          fade(tl, { nLab: 1 }, '<0.3')
          beat(tl)
          toLegend(tl, 'n')
        },
      },
      {
        title: 'Ortsvektor',
        hold: 3,
        build: tl => {
          deck.show(tl, C.d_r)
          tl.set(S, { rA: 1 }, '<')
          tl.to(S, { rG: 1, duration: T.reveal, ease: EASE.reveal }, '<')
          fade(tl, { ptA: 1, rLab: 1 }, '<0.4')
          beat(tl)
          // mehrere Punkte der Ebene; Kamera dreht mit — die Beschriftung folgt der Spitze
          tl.to(S, { camAz: 24, duration: 3 * T.move, ease: EASE.move })
          tl.to(S, { rU: 0.9, rV: 0.8, duration: T.move, ease: EASE.move }, '<')
          tl.to(S, { rU: 0.7, rV: -1.0, duration: T.move, ease: EASE.move })
          tl.to(S, { rU: -0.8, rV: -0.6, duration: T.move, ease: EASE.move })
          beat(tl)
          toLegend(tl, 'r')
          cam(tl, { camAz: -14 }, '<')
        },
      },
      {
        title: 'Farbwechsel n → ω',
        build: tl => {
          deck.show(tl, C.d_mix)
          tl.to(S, { nMix: 1, duration: 1.0, ease: 'power1.inOut' }, '<')
          fade(tl, { nLeg: 0 }, '<')
          fade(tl, { wLab: 1 }, '<0.3')
          beat(tl)
          toLegend(tl, 'w')
        },
      },
    ],

    normalform: [
      { title: 'Normalform der Ebene', build: tl => { deck.show(tl, C.k1_title) } },
    ],
  }
}
