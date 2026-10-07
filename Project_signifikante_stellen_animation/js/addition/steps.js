'use strict'
// Drehbuch Kapitel 4 „Addition" (→ BACKLOG FSS1, FSS7). build() hängt NUR Tweens/Sets
// an tl an (Reversibilitäts-Regel); Folienzeilen (data-r) per autoAlpha.
//
//  Zwei Werkstücke, zwei Maßbänder → A: Band rollt aus, Etikett 0,8 m, Band rollt ein
//  → B: Band rollt aus, Lupe, Etikett 1,877 m, Band rollt ein → Steckbrief
//  → hintereinanderlegen (Taschenrechner 2,677; A-Ende wackelt) → kleinstmögliche /
//  größtmögliche Gesamtlänge (Ziffernvergleich) → welches Etikett? (2,677 / 3 / 2,7)
//  → die Falle (Faustregel der Multiplikation) → gleiche Einheit, ehrlich umrechnen → Merke

import { createCardDeck } from '../../../shared/js/step-kit.js'
import { EASE, LANE, A_TRUE, B_TRUE, A_SAMPLES } from './constants.js'
import { SUM, CMP, SUMMARY } from './content.js'
import { compareScan, revealSummary } from '../stellen.js'

export function buildAddSteps(S, DOM) {
  const C = DOM.cards
  const deck = createCardDeck()
  const steps = []
  const step = (title, build, hold) => steps.push({ title, build, hold })
  const reveal = (tl, card, name, at) =>
    tl.to(card.querySelector(`[data-r="${name}"]`), { autoAlpha: 1, duration: 0.5 }, at)
  // Maßband ausrollen / einrollen (Tempo 0,75 gegenüber v0.14, PO 2026-10-07, FSS9 ab)
  const rollOut = (tl, i, at) => {
    tl.set(S, { [`tp${i}A`]: 1, [`tp${i}R`]: 0 }, at)
    tl.to(S, { [`tp${i}R`]: 1, duration: 1.4 / 0.75, ease: 'power2.out' })
  }
  const rollIn = (tl, i, at) => {
    tl.to(S, { [`tp${i}R`]: 0, duration: 1 / 0.75, ease: 'power2.in' }, at)
    tl.to(S, { [`tp${i}A`]: 0, duration: 0.3 })
  }
  // Etikett: anfliegen, andrücken, „wird beschriftet: …" ein- und wieder ausblenden
  const label = (tl, k, at) => {
    tl.set(S, { [`tg${k}`]: 1, [`tg${k}f`]: 0, [`tg${k}s`]: 0 }, at)
    tl.to(S, { [`tg${k}c`]: 1, duration: 0.4 }, '<')
    tl.to(S, { [`tg${k}f`]: 1, duration: 0.9, ease: 'none' }, '<')
    tl.to(S, { [`tg${k}s`]: 1, duration: 0.45, ease: 'power1.inOut' })
    tl.to(S, { [`tg${k}c`]: 0, duration: 0.4 }, '>1.2')
  }
  // Kette: A-Länge und B-Anfang gemeinsam (B liegt an A an)
  const chain = (tl, aL, bL, at, d = 0.6) =>
    tl.to(S, { aL, bX: aL, ...(bL ? { bL } : {}), duration: d, ease: EASE.cam }, at)

  step('Zwei Werkstücke, zwei Maßbänder', tl => {
    deck.show(tl, C.a_intro)
    tl.to(S, { aA: 1, duration: 0.6 }, '<0.2')
    tl.to(S, { bA: 1, duration: 0.6 }, '<0.3')
  }, 3)

  step('Stab A messen', tl => {
    deck.show(tl, C.a_a)
    rollOut(tl, 0, '<0.2')
    tl.to(S, { zA: 1, duration: 0.5 }, '>0.2')
    label(tl, 'A', '>0.4')
    tl.to(S, { tbA: 1, r0: 1, duration: 0.5 }, '<0.8')
    tl.to(S, { zA: 0, duration: 0.3 }, '>0.3')
    rollIn(tl, 0, '<')
  }, 4)

  step('Werkstück B messen', tl => {
    deck.show(tl, C.a_b)
    rollOut(tl, 1, '<0.2')
    tl.to(S, { lpA: 1, duration: 0.5 }, '>0.1')
    tl.to(S, { lzA: 1, duration: 0.4 }, '>0.3')
    label(tl, 'B', '>0.4')
    tl.to(S, { r1: 1, duration: 0.5 }, '<0.8')
    tl.to(S, { lpA: 0, lzA: 0, duration: 0.4 }, '>0.3')
    rollIn(tl, 1, '<')
  }, 4)

  step('Steckbrief', tl => {
    deck.show(tl, C.a_steck)
    tl.to(S, { hiU: 1, duration: 0.5 }, '>0.3')
  }, 6)

  step('Wie lang sind beide zusammen?', tl => {
    deck.show(tl, C.a_chain)
    tl.to(S, { hiU: 0, duration: 0.3 }, '<')
    tl.to(S, { bX: A_TRUE + 0.03, bY: LANE.up, duration: 1.1, ease: EASE.cam }, '<0.2')
    tl.to(S, { bX: A_TRUE, duration: 0.35, ease: 'power2.in' })
    // Taschenrechner: 0,8 + 1,877 = 2,677
    tl.set(S, { calcT: 0 }, '>0.2')
    tl.to(S, { calcA: 1, duration: 0.4 })
    tl.to(S, { calcT: 1, duration: 2.6, ease: 'none' }, '>0.1')
    reveal(tl, C.a_chain, 'calc', '>0.2')
    // Wo endet die Kette? A wackelt durch sein Intervall, B fährt mit
    tl.to(S, { zAe: 1, duration: 0.5 }, '>0.8')
    reveal(tl, C.a_chain, 'end', '<')
    A_SAMPLES.forEach((x, i) => chain(tl, x, null, i ? '>0.5' : '>0.2'))
    tl.to(S, { zEnd: 1, duration: 0.6 }, '>0.2')
    chain(tl, A_TRUE, null, '<')
  }, 5)

  step('Grenzen der Gesamtlänge', tl => {
    deck.show(tl, C.a_bounds)
    tl.to(S, { calcA: 0, duration: 0.4 }, '<')
    chain(tl, SUM.a.lo, SUM.b.lo, '<0.3', 0.8)
    tl.to(S, { lmMin: 1, duration: 0.4 })
    reveal(tl, C.a_bounds, 'min', '<')
    chain(tl, SUM.a.hi, SUM.b.hi, '>0.9', 0.9)
    tl.to(S, { lmMax: 1, duration: 0.4 })
    reveal(tl, C.a_bounds, 'max', '<')
    reveal(tl, C.a_bounds, 'pm', '>0.6')
    chain(tl, A_TRUE, B_TRUE, '>0.4', 0.6)
    tl.to(S, { nAx: 1, duration: 0.8, ease: EASE.cam }, '>0.2')
    tl.to(S, { bd: 1, duration: 0.9, ease: 'power2.inOut' }, '>-0.2')
  }, 6)

  // Welches Etikett? Ziffernvergleich L_max · Rechner · L_min
  step('Welches Etikett?', tl => {
    deck.show(tl, C.a_label)
    tl.to(S, { nAx: 0, duration: 0.5 }, '<')
    compareScan(tl, S, CMP, 0, { at: '>0.1' })
    reveal(tl, C.a_label, 'res', '>0.4')
    tl.to(S, { r2: 1, duration: 0.5 }, '<')
  }, 6)

  step('Die Falle', tl => {
    deck.show(tl, C.a_trap)
    tl.to(S, { hiS: 1, duration: 0.5 }, '<0.3')
    reveal(tl, C.a_trap, 'sig', '<')
    tl.to(S, { hiS: 0, hiN: 1, duration: 0.5 }, '>1.6')
    reveal(tl, C.a_trap, 'dec', '<')
  }, 7)

  step('Erst umrechnen', tl => {
    deck.show(tl, C.a_unit)
    tl.to(S, { hiN: 0, nAx: 0, dcA: 0, lmMin: 0, lmMax: 0, zAe: 0, zEnd: 0, duration: 0.5 }, '<')
    // langsam aufbauen: erst die falsche Umrechnung (800 mm), dann die ehrliche, dann je Einheit
    // Summanden → Taschenrechner → gerundetes Ergebnis
    tl.to(S, { u1: 1, duration: 0.6 }, '>0.3')
    tl.to(S, { u2: 1, duration: 0.6 }, '>2.2')
    ;[3, 4, 5, 6, 7].forEach(n => {
      tl.to(S, { [`u${n}`]: 1, duration: 0.6 }, '>2')
      tl.to(S, { [`u${n}b`]: 1, duration: 0.5 }, '>1.2')
      tl.to(S, { [`u${n}c`]: 1, duration: 0.5 }, '>1.2')
    })
    tl.to(S, { u8: 1, duration: 0.6 }, '>1.6')
  }, 8)

  step('Zusammenfassung', tl => {
    tl.to(S, { dim: 1, dcA: 0, duration: 0.8 })
    deck.show(tl, C.a_sum, '<0.2')
    revealSummary(tl, C.a_sum, SUMMARY.length, reveal)
  }, 8)

  step('Merke', tl => {
    tl.to(S, { dim: 1, duration: 0.8 })
    deck.show(tl, C.a_rule, '<0.2')
  }, 9)

  return steps
}
