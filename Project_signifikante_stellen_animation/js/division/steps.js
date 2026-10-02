'use strict'
// Drehbuch Kapitel 2 „Division": Durchschnittsgeschwindigkeit v = s / t.
// build() hängt NUR Tweens/Sets an tl an (Reversibilitäts-Regel, Blueprint §10).
//
//  Strecke und Ausrüstung → A misst s grob (1-m-Band), B fein (cm-Band, Lupe)
//  → Lichtschranken → Fahrt in Zeitlupe (beide Uhren laufen) → Zeiten ablesen
//  → v für A, v für B (Zeit begrenzt!) → Kombination → Merke

import { createCamera, createCardDeck } from '../../../shared/js/step-kit.js'
import {
  T, EASE, CAR_PARK, CAR_ENTRY, CAR_GONE, SLOWMO, V_TRUE, CAM_V_FULL, CAM_V_ZOOM,
} from './constants.js'

export function buildSpeedSteps(S, DOM) {
  const C = DOM.cards
  const cam = createCamera(S, CAM_V_FULL)
  const deck = createCardDeck()
  const steps = []
  const step = (title, build, hold) => steps.push({ title, build, hold })
  const cell = (tl, key, at) => tl.to(S, { [key]: 1, duration: 0.45, ease: EASE.reveal }, at)

  step('Die Messstrecke', tl => {
    tl.to(S, { roadA: 1, duration: 0.7 })
    tl.to(S, { lineD: 1, duration: 0.8, ease: EASE.cam }, '>-0.2')
    tl.set(S, { carA: 1 }, '<')
    tl.to(S, { carX: CAR_PARK, duration: 1.4, ease: 'power2.out' }, '<')
    deck.show(tl, C.v_intro, 0.3)
  }, 3)

  step('Zwei Personen, zwei Ausrüstungen', tl => {
    deck.show(tl, C.v_equip)
    tl.to(S, { pnA0: 1, pnY0: 0, duration: T.reveal, ease: EASE.reveal }, '<')
    tl.to(S, { pnA1: 1, pnY1: 0, duration: T.reveal, ease: EASE.reveal }, '<0.35')
  }, 5)

  step('Person A misst die Strecke', tl => {
    deck.show(tl, C.v_sA)
    tl.to(S, { tpA0: 1, duration: 0.3 }, '<')
    tl.to(S, { tpD0: 1, duration: 1.4, ease: 'power2.inOut' }, '<')
    tl.to(S, { guideD: 1, duration: 0.6, ease: EASE.cam }, '>-0.1')
    tl.set(S, { zA: 1 }, '>0.1')
    tl.to(S, { zW: 1, duration: 0.7, ease: EASE.reveal })
    tl.to(S, { tbA: 1, duration: 0.4 }, '>0.1')
    cell(tl, 'c0s', '<0.15')
  }, 4.5)

  step('Person B misst die Strecke', tl => {
    deck.show(tl, C.v_sB)
    tl.to(S, { zA: 0, duration: 0.4 }, '<')
    tl.to(S, { tpA1: 1, duration: 0.3 }, '<')
    tl.to(S, { tpD1: 1, duration: 1.4, ease: 'power2.inOut' }, '<')
    tl.to(S, { lpA: 1, lpT: 1, duration: 0.6 }, '>-0.1')
    tl.to(S, { lzT: 1, duration: 0.5 }, '>0.4')
    cell(tl, 'c1s', '>0.1')
  }, 4.5)

  step('Lichtschranken aufbauen', tl => {
    deck.show(tl, C.v_barrier)
    tl.to(S, { lbA: 1, duration: 0.7 }, '<0.2')
    // Lupe wechselt auf das Zifferblatt von B
    tl.to(S, { lpT: 0, lzT: 0, duration: 0.4 }, '<')
    tl.to(S, { lpD: 1, duration: 0.5 }, '>')
  }, 4)

  // Wagen fährt mit konstanter Geschwindigkeit (in Zeitlupe); beide Uhren laufen
  // genau zwischen den Lichtschranken — ihre Anzeige folgt aus carX.
  step('Die Fahrt (Zeitlupe)', tl => {
    deck.show(tl, C.v_drive)
    // Fliegender Start: Wagen setzt außerhalb des Bildes zurück und fährt mit
    // konstanter Geschwindigkeit durch (die Uhren messen nur zwischen den Linien).
    tl.to(S, { carA: 0, duration: 0.3 }, '<0.2')
    tl.set(S, { carX: CAR_ENTRY, carA: 1 })
    tl.to(S, { carX: CAR_GONE, duration: SLOWMO * (CAR_GONE - CAR_ENTRY) / V_TRUE, ease: 'none' }, '>0.2')
  }, 2.5)

  step('Zeiten ablesen', tl => {
    deck.show(tl, C.v_t)
    tl.to(S, { wGlowA: 1, duration: 0.5 }, '<0.2')
    cell(tl, 'c0t', '<0.2')
    tl.to(S, { wGlowA: 0, wGlowB: 1, duration: 0.5 }, '>0.8')
    tl.to(S, { lzD: 1, duration: 0.5 }, '<0.2')
    cell(tl, 'c1t', '>0.3')
    tl.to(S, { wGlowB: 0, duration: 0.5 }, '>0.8')
  }, 5)

  step('Geschwindigkeit: Person A', tl => {
    deck.show(tl, C.v_vA)
    tl.to(S, { vAx: 1, vTk: 1, duration: 1, ease: EASE.cam }, '<0.2')
    cell(tl, 'c0v', '>-0.2')
    tl.to(S, { bd0: 1, duration: 0.9, ease: EASE.reveal }, '<0.2')
  }, 6)

  step('Geschwindigkeit: Person B', tl => {
    deck.show(tl, C.v_vB)
    cell(tl, 'c1v', '<0.3')
    tl.to(S, { bd1: 1, duration: 1.4, ease: EASE.reveal }, '<0.2')
  }, 6)

  step('Das Beste aus beiden', tl => {
    deck.show(tl, C.v_best)
    tl.to(S, { row2: 1, duration: 0.4 }, '<0.2')
    cell(tl, 'c2s', '<0.15')
    cell(tl, 'c2t', '<0.15')
    cell(tl, 'c2v', '>0.1')
    tl.to(S, { vTrue: 1, duration: 0.5 }, '<')
    cam.to(tl, CAM_V_ZOOM, { duration: T.cam, at: '>0.2' })
    tl.to(S, { bd2: 1, duration: 0.9, ease: EASE.reveal }, '>-0.2')
  }, 6)

  step('Merke', tl => {
    tl.to(S, { dim: 1, duration: 0.8 })
    deck.show(tl, C.v_rule, '<0.2')
  }, 8)

  return steps
}
