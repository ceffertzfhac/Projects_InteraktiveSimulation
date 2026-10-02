'use strict'
// Drehbuch Kapitel 4 „Addition" (→ BACKLOG FSS1). build() hängt NUR Tweens/Sets an
// tl an (Reversibilitäts-Regel); Folienzeilen (data-r) per autoAlpha.
//
//  Zwei Werkstücke → A grob messen (0,1 m), Etikett 0,4 m → B fein (1 mm), 1,253 m
//  → Steckbrief (Stellenwert = absolute, Stellenzahl = relative Unsicherheit)
//  → hintereinanderlegen → wo endet die Kette? → Grenzen kleinste+kleinste …
//  → welches Etikett? (1,653 / 2 / 1,7) → welche Stelle ist unsicher?
//  → die Falle (Faustregel der Multiplikation) → gleiche Einheit → Merke

import { createCamera, createCardDeck } from '../../../shared/js/step-kit.js'
import { scanPlaces } from '../stellen.js'
import { T, EASE, LANE, A_TRUE, B_TRUE, A_SAMPLES, CAM_N } from './constants.js'
import { SUM, CANDS, LUPE } from './content.js'

export function buildAddSteps(S, DOM) {
  const C = DOM.cards
  const cam = createCamera(S, CAM_N)
  const deck = createCardDeck()
  const steps = []
  const step = (title, build, hold) => steps.push({ title, build, hold })
  const reveal = (tl, card, name, at) =>
    tl.to(card.querySelector(`[data-r="${name}"]`), { autoAlpha: 1, duration: 0.5 }, at)
  const stick = (tl, k, at) => {                     // Etikett aufkleben
    tl.set(S, { [`tg${k}`]: 1, [`tg${k}s`]: 0 }, at)
    tl.to(S, { [`tg${k}s`]: 1, duration: 0.6, ease: 'back.out(1.6)' })
  }
  // Kette: A-Länge und B-Anfang gemeinsam (B liegt an A an)
  const chain = (tl, aL, bL, at, d = 0.6) =>
    tl.to(S, { aL, bX: aL, ...(bL ? { bL } : {}), duration: d, ease: EASE.cam }, at)

  step('Zwei Werkstücke', tl => {
    deck.show(tl, C.a_intro)
    tl.to(S, { aA: 1, duration: 0.6 }, '<0.2')
    tl.to(S, { bA: 1, duration: 0.6 }, '<0.3')
  }, 3)

  step('Stab A messen: 0,1-m-Teilung', tl => {
    deck.show(tl, C.a_a)
    tl.to(S, { tpA: 1, tdA: 1, duration: 0.7 }, '<')
    tl.to(S, { zA: 1, duration: 0.5 }, '>0.2')
    stick(tl, 'A', '>0.3')
    tl.to(S, { tbA: 1, r0: 1, duration: 0.5 }, '>0.1')
  }, 5)

  step('Werkstück B messen: 1-mm-Teilung', tl => {
    deck.show(tl, C.a_b)
    tl.to(S, { zA: 0, duration: 0.3 }, '<')
    tl.to(S, { aY: LANE.up, aX: 1.35, duration: 0.9, ease: EASE.cam }, '<')
    tl.to(S, { bY: LANE.low, bX: 0, duration: 0.9, ease: EASE.cam }, '<0.3')
    tl.to(S, { tdB: 1, duration: 0.6 }, '>-0.2')
    tl.to(S, { lpA: 1, duration: 0.5 }, '>0.1')
    tl.to(S, { lzA: 1, duration: 0.4 }, '>0.3')
    stick(tl, 'B', '>0.3')
    tl.to(S, { r1: 1, duration: 0.5 }, '>0.1')
  }, 5)

  step('Steckbrief: Stellenwert und Stellenzahl', tl => {
    deck.show(tl, C.a_steck)
    tl.to(S, { lpA: 0, duration: 0.4 }, '<')
    tl.to(S, { hiU: 1, duration: 0.5 }, '>0.3')
  }, 6)

  step('Hintereinanderlegen', tl => {
    deck.show(tl, C.a_chain)
    tl.to(S, { hiU: 0, duration: 0.3 }, '<')
    tl.to(S, { bX: A_TRUE, duration: 0.9, ease: EASE.cam }, '<0.2')
    tl.to(S, { aY: LANE.low, aX: 0, duration: 0.9, ease: EASE.cam }, '>0.1')
  }, 4)

  step('Wo endet die Kette?', tl => {
    deck.show(tl, C.a_end)
    tl.to(S, { zAe: 1, duration: 0.5 }, '<0.2')
    A_SAMPLES.forEach((x, i) => chain(tl, x, null, i ? '>0.5' : '>0.2'))
    tl.to(S, { zEnd: 1, duration: 0.6 }, '>0.2')
    chain(tl, A_TRUE, null, '<')
    tl.to(S, { nAx: 1, duration: 0.8, ease: EASE.cam }, '>0.2')
    tl.to(S, { bd: 1, duration: 0.9, ease: 'power2.inOut' }, '>-0.2')
  }, 5)

  step('Kleinste + kleinste, größte + größte', tl => {
    deck.show(tl, C.a_bounds)
    chain(tl, SUM.a.lo, SUM.b.lo, '<0.3', 0.8)
    tl.to(S, { lmMin: 1, duration: 0.4 })
    reveal(tl, C.a_bounds, 'min', '<')
    chain(tl, SUM.a.hi, SUM.b.hi, '>0.9', 0.9)
    tl.to(S, { lmMax: 1, duration: 0.4 })
    reveal(tl, C.a_bounds, 'max', '<')
    reveal(tl, C.a_bounds, 'pm', '>0.6')
    chain(tl, A_TRUE, B_TRUE, '>0.4', 0.6)
  }, 6)

  // Kandidaten: Klammer = Rundungsintervall des Etiketts, Band = was wir wissen
  const views = [{ cx: 1.66, w: 0.32 }, { cx: 1.95, w: 2.4 }, { cx: 1.66, w: 0.32 }]
  step('Welches Etikett?', tl => {
    deck.show(tl, C.a_label)
    CANDS.forEach((c, i) => {
      tl.to(S, { cdA: 0, cbA: 0, cdV: 0, duration: 0.25 }, i ? '>0.9' : '<')
      tl.set(S, { cdI: i })
      cam.to(tl, views[i], { duration: 1, at: '>' })
      tl.to(S, { cdA: 1, duration: 0.4 }, '<0.2')
      tl.to(S, { cbA: 1, duration: 0.5 }, '>0.3')
      tl.to(S, { cdV: 1, duration: 0.4 }, '>0.1')
      tl.to(S, { [`cl${i}`]: 1, duration: 0.4 }, '>0.6')
    })
  }, 6)

  step('Welche Stelle ist unsicher?', tl => {
    deck.show(tl, C.a_dig)
    tl.to(S, { cdA: 0, cbA: 0, cdV: 0, duration: 0.3 }, '<')
    scanPlaces(tl, S, LUPE.info, 0, {
      full: true, hold: 1.3,
      zoom: (t2, p) => cam.to(t2, { cx: Math.max(LUPE.info.R, 2 * 10 ** p), w: 4 * 10 ** p }, { duration: 1, at: '>0.1' }),
    })
    cam.to(tl, views[2], { duration: 1, at: '<' })
    tl.to(S, { slB: 1, duration: 0.4 })
    reveal(tl, C.a_dig, 'res', '<')
    tl.to(S, { r2: 1, duration: 0.5 }, '<')
  }, 6)

  step('Die Falle', tl => {
    deck.show(tl, C.a_trap)
    tl.to(S, { hiS: 1, duration: 0.5 }, '<0.3')
    reveal(tl, C.a_trap, 'sig', '<')
    tl.to(S, { hiS: 0, hiN: 1, duration: 0.5 }, '>1.6')
    reveal(tl, C.a_trap, 'dec', '<')
  }, 7)

  step('Gleiche Einheit!', tl => {
    deck.show(tl, C.a_unit)
    tl.to(S, { hiN: 0, nAx: 0, slA: 0, slB: 0, cl0: 0, cl1: 0, cl2: 0, duration: 0.5 }, '<')
    ;[1, 2, 3].forEach(n => tl.to(S, { [`u${n}`]: 1, duration: 0.5 }, '>0.6'))
  }, 6)

  step('Merke', tl => {
    tl.to(S, { dim: 1, duration: 0.8 })
    deck.show(tl, C.a_rule, '<0.2')
  }, 9)

  return steps
}
