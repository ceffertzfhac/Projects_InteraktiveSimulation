'use strict'
// Drehbuch Kapitel 2 „Division": Durchschnittsgeschwindigkeit v = s / t.
// build() hängt NUR Tweens/Sets an tl an (Reversibilitäts-Regel, Blueprint §10);
// Zeilen in Folienkarten (.reveal) werden per autoAlpha-Tween eingeblendet.
//
//  Strecke und Ausrüstung → A misst s grob (1-m-Band), B fein (cm-Band, Lupe)
//  → Lichtschranken → Fahrt in Zeitlupe → Zeiten ablesen (je mit Intervall)
//  → je Person: kleinstmögliches/größtmögliches v per Regler (s_min/t_max, s_max/t_min)
//    → welche Stelle ist unsicher? (Zahlengerade Stelle für Stelle) → Merke

import { createCamera, createCardDeck } from '../../../shared/js/step-kit.js'
import { compareScan, revealSummary } from '../stellen.js'
import {
  T, EASE, CAR_PARK, CAR_ENTRY, CAR_GONE, SLOWMO, V_TRUE, CAM_V_FULL,
} from './constants.js'
import { ROW, CMP, SUMMARY, COMBOS } from './content.js'

const vAt = (r, ks, kt) => {
  const { s, t } = r.e
  return (s.lo + (s.hi - s.lo) * ks) / (t.lo + (t.hi - t.lo) * kt)
}

export function buildSpeedSteps(S, DOM) {
  const C = DOM.cards
  const cam = createCamera(S, CAM_V_FULL)
  const deck = createCardDeck()
  const steps = []
  const step = (title, build, hold) => steps.push({ title, build, hold })
  const cell = (tl, key, at) => tl.to(S, { [key]: 1, duration: 0.45, ease: EASE.reveal }, at)
  const reveal = (tl, card, name, at) =>
    tl.to(card.querySelector(`[data-r="${name}"]`), { autoAlpha: 1, duration: 0.5 }, at)

  // ── Messen ─────────────────────────────────────────────────────────────────
  step('Die Messstrecke', tl => {
    tl.to(S, { roadA: 1, duration: 0.7 })
    tl.to(S, { lineD: 1, duration: 0.8, ease: EASE.cam }, '>-0.2')
    tl.set(S, { carA: 1 }, '<')
    tl.to(S, { carX: CAR_PARK, duration: 1.4, ease: 'power2.out' }, '<')
    deck.show(tl, C.v_intro, 0.3)
  }, 3)

  step('Zwei Ausrüstungen', tl => {
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
  }, 5)

  step('Person B misst die Strecke', tl => {
    deck.show(tl, C.v_sB)
    tl.to(S, { zA: 0, duration: 0.4 }, '<')
    tl.to(S, { tpA1: 1, duration: 0.3 }, '<')
    tl.to(S, { tpD1: 1, duration: 1.4, ease: 'power2.inOut' }, '<')
    tl.to(S, { lpA: 1, lpT: 1, duration: 0.6 }, '>-0.1')
    tl.to(S, { lzT: 1, duration: 0.5 }, '>0.4')
    cell(tl, 'c1s', '>0.1')
  }, 5)

  step('Lichtschranken aufbauen', tl => {
    deck.show(tl, C.v_barrier)
    tl.to(S, { lbA: 1, duration: 0.7 }, '<0.2')
    tl.to(S, { lpT: 0, lzT: 0, duration: 0.4 }, '<')          // Lupe wechselt aufs Zifferblatt
    tl.to(S, { lpD: 1, duration: 0.5 }, '>')
  }, 4)

  // Fliegender Start: Wagen setzt außerhalb des Bildes an und fährt mit konstanter
  // Geschwindigkeit durch; die Uhren messen nur zwischen den Linien (Anzeige aus carX).
  step('Die Fahrt (Zeitlupe)', tl => {
    deck.show(tl, C.v_drive)
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

  // ── Rechnen: Grenzen per Regler, dann Stelle für Stelle ──────────────────────
  let hitN = 0
  // Ecke anfahren (langsam, PO 2026-10-02) — die Beschriftung der Kombination steht
  // an den Reglern, solange der Knopf an der Ecke steht
  const corner = (tl, r, ks, kt, at, color = 0) => {
    tl.to(S, { ks, kt, duration: 1.3, ease: EASE.cam }, at)
    const n = hitN++
    tl.set(S, { [`ch${n}x`]: vAt(r, ks, kt), [`ch${n}c`]: color })
    tl.to(S, { [`ch${n}a`]: 1, duration: 0.3, ease: EASE.pop })
  }
  const clearHits = tl => {
    const v = {}
    for (let n = 0; n < hitN; n++) v[`ch${n}a`] = 0
    if (hitN) tl.to(S, { ...v, vlA: 0, duration: 0.35 })
    hitN = 0
  }
  // Grenzen: kleinstes v = s_min / t_max, größtes v = s_max / t_min
  const bounds = (tl, i, card) => {
    const r = ROW[i]
    corner(tl, r, 0, 1, '>0.3')
    reveal(tl, card, 'min', '<0.6')
    corner(tl, r, 1, 0, '>2')
    reveal(tl, card, 'max', '<0.6')
    tl.to(S, { ks: 1, duration: 1.4 }, '>')           // Standzeit: Grenze lesen
    tl.to(S, { [`bd${i}`]: 1, duration: 1, ease: 'power2.inOut' }, '>0.4')
    clearHits(tl)
  }
  // Ziffern vergleichen: v_max · Rechner · v_min untereinander (an der Stelle der Regler)
  const digits = (tl, i, card, finalW, finalCx) => {
    const r = ROW[i]
    tl.to(S, { frA: 0, vlA: 0, duration: 0.4 })
    compareScan(tl, S, CMP[i], i)
    cam.to(tl, { cx: finalCx ?? Math.max(r.info.R, finalW / 2), w: finalW }, { duration: 1.1, at: '<' })
    tl.to(S, { [`rm${i}`]: 1, duration: 0.5 })
    cell(tl, `c${i}v`, '<')
    reveal(tl, card, 'rnd', '<0.2')                    // Taschenrechner-Zeile: ⟶ runden ⟶ Ergebnis
    reveal(tl, card, 'res', '<0.2')
  }
  const startBounds = (tl, i) => {
    tl.to(S, { dcA: 0, frA: 0, duration: 0.35 })
    tl.set(S, { frI: i, ks: 0.5, kt: 0.5 })
    tl.to(S, { frA: 1, vlA: 1, duration: 0.5 })
  }

  // Person A in zwei Schritten (FSS9 o): erst alle vier Kombinationen bilden und nach
  // Größe ordnen, dann kleinstes und größtes v auswählen
  step('Person A: alle Kombinationen', tl => {
    const K = C.v_combo, row = n => K.querySelector(`[data-c="${n}"]`)
    tl.set(K.querySelectorAll('.corner-row, .c-tag'), { autoAlpha: 0 })
    COMBOS.forEach(c => tl.set(row(c.i), { '--slot': c.i }))
    deck.show(tl, K)
    tl.to(S, { lowA: 0, duration: 0.6 }, '<')
    tl.set(S, { frI: 0, ks: 0.5, kt: 0.5 })
    tl.to(S, { frA: 1, duration: 0.5 })
    tl.to(S, { vAx: 1, vTk: 1, duration: 0.9, ease: EASE.cam }, '<')
    // hineinzoomen: alle vier Kombinationen (9,09 … 9,60 m/s) links der Folienkarte
    cam.to(tl, { cx: 9.5, w: 1.8 }, { duration: T.cam, at: '>0.3' })
    tl.to(S, { vlA: 1, duration: 0.4 })
    COMBOS.forEach((c, n) => {
      corner(tl, ROW[0], c.ks, c.kt, n ? '>1.2' : '>0.3', c.i + 1)
      tl.to(row(c.i), { autoAlpha: 1, duration: 0.45 }, '<')
    })
    // nach Größe sortieren, dann benennen: kleinstes · dazwischen · größtes
    COMBOS.forEach(c => tl.to(row(c.i), { '--slot': c.rank, duration: 0.9, ease: 'power2.inOut' }, c.i ? '<' : '>1.2'))
    reveal(tl, K, 'sorted', '>0.2')
    tl.to(K.querySelectorAll('.c-tag'), { autoAlpha: 1, duration: 0.4, stagger: 0.25 }, '>0.4')
  }, 6)

  step('Person A: kleinstes und größtes v', tl => {
    deck.show(tl, C.v_vA)
    clearHits(tl)                                        // nimmt auch die Live-Marke weg …
    tl.to(S, { ks: 0.5, kt: 0.5, vlA: 1, duration: 0.8, ease: EASE.cam })   // … und holt sie zurück
    bounds(tl, 0, C.v_vA)
  }, 6)

  step('Person A: Ziffern vergleichen', tl => {
    deck.show(tl, C.v_digA)
    digits(tl, 0, C.v_digA, 0.8)
  }, 6)

  step('Person B: Grenzen von v', tl => {
    deck.show(tl, C.v_vB)
    startBounds(tl, 1)
    cam.to(tl, CAM_V_FULL, { duration: T.cam, at: '<' })
    bounds(tl, 1, C.v_vB)
    digits(tl, 1, C.v_vB, 24)
  }, 6)

  step('Kombiniert: A und B', tl => {
    deck.show(tl, C.v_best)
    tl.to(S, { row2: 1, duration: 0.4 }, '<0.2')
    cell(tl, 'c2s', '<0.15')
    cell(tl, 'c2t', '<0.15')
    startBounds(tl, 2)
    cam.to(tl, { cx: 9.27, w: 0.3 }, { duration: T.cam, at: '<' })
    bounds(tl, 2, C.v_best)
    digits(tl, 2, C.v_best, 0.1, 9.29)          // Marke von A (9,3) bleibt links der Karte
  }, 6)

  step('Zusammenfassung', tl => {
    tl.to(S, { dim: 1, dcA: 0, duration: 0.8 })
    deck.show(tl, C.v_sum, '<0.2')
    revealSummary(tl, C.v_sum, SUMMARY.length, reveal)
  }, 8)

  step('Merke', tl => {
    tl.to(S, { dim: 1, dcA: 0, duration: 0.8 })
    deck.show(tl, C.v_rule, '<0.2')
  }, 8)

  return steps
}
