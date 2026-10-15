'use strict'
// Das Drehbuch: je Kapitel ein Array von Schritten { title, hold?, build(tl, S) }.
// build() hängt NUR Tweens/Sets an tl an (Reversibilitäts-Regel, Blueprint §10).
// Planer (Kamera, Karten) laufen zur Build-Zeit und kennen daher den Zustand am Ende
// jedes Schritts. Alle Zahlen kommen aus store.data (model.js, Seed je Durchlauf).

import { createCamera, createCardDeck } from '../../shared/js/step-kit.js'
import { beat } from '../../shared/js/step-engine.js'
import { T, EASE } from './constants.js'
import { START, store } from './state.js'
import { innerhalb } from './model.js'

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
        deck.show(tl, C.k1_true, '<')
        beat(tl)
        tl.to(S, { tv: 1, duration: T.pop, ease: 'power2.out' })
        beat(tl)
      },
    },
    {
      title: 'Unbekannt', hold: 4,
      build: tl => {
        deck.show(tl, C.k1_unknown, '<')
        beat(tl)
        tl.to(S, { tvF: 0, duration: 1.1, ease: 'power1.inOut' })
        beat(tl)
      },
    },
    {
      title: 'Messreihe', hold: 5,
      build: tl => {
        deck.show(tl, C.k1_series, '<')
        dots(tl, 0, 1)
        tl.to(S, { v1a: 1, duration: 0.5 }, '>-0.1')
        beat(tl)
        tl.to(S, { v1a: 0, duration: 0.4 })
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

  // Teil einer Karte (Rechnung, Folgesatz) erst auf Kommando einblenden
  const part = (tl, card, key, at) => {
    const el = card.querySelector(`[data-r="${key}"]`)
    tl.fromTo(el, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out' }, at)
  }

  // Punkte in der Farbe „innerhalb/außerhalb“ (Intervall der ersten 10 Werte) einfärben
  const classify = (tl, from, to, at) => {
    for (let i = from; i < to; i++) {
      const inside = innerhalb(D.values[i], D.n10.mean, D.n10.sigma)
      tl.to(S, { [(inside ? 'i' : 'o') + i]: 1, duration: 0.4 }, i === from ? at : '<0.12')
    }
  }

  // ── Kapitel 2: Standardabweichung ──────────────────────────────────────────
  const k2 = [
    {
      title: 'Streuung', hold: 6,
      build: tl => {
        deck.show(tl, C.k2_sigma, '<')
        beat(tl)
        part(tl, C.k2_sigma, 'calc')
        beat(tl)
      },
    },
    {
      title: 'Intervall ḡ ± σ_g', hold: 7,
      build: tl => {
        deck.show(tl, C.k2_interval, '<')
        beat(tl)
        tl.set(S, { sh: 0 })
        tl.to(S, { bA: 1, bE: 1, sh: D.n10.sigma, duration: 1.2, ease: EASE.reveal })
        beat(tl)
      },
    },
    {
      title: 'Zehn weitere Werte', hold: 6,
      build: tl => {
        deck.show(tl, C.k2_more, '<')
        dots(tl, 10, 20)
        classify(tl, 10, 20, '<0.4')
      },
    },
    {
      title: 'Strichliste', hold: 7,
      build: tl => {
        deck.show(tl, C.k2_tally, '<')
        tl.to(S, { tlA: 1, duration: 0.6 }, '<')
        tl.to(S, { tIn: D.tally.inside, duration: 0.3 + 0.2 * D.tally.inside, ease: 'none' })
        beat(tl)
        tl.to(S, { tOut: D.tally.outside, duration: 0.3 + 0.2 * D.tally.outside, ease: 'none' })
        beat(tl)
        part(tl, C.k2_tally, 'cmp')
        beat(tl)
      },
    },
    {
      title: 'Neue Auswertung, n = 20', hold: 7,
      build: tl => {
        deck.show(tl, C.k2_new, '<')
        tl.to(S, { tlA: 0, duration: 0.5 }, '<')
        for (let i = 10; i < 20; i++) tl.to(S, { ['i' + i]: 0, ['o' + i]: 0, duration: 0.4 }, '<')
        beat(tl)
        // 1) nur der Bestwert wandert — das Intervall behält seine Breite
        part(tl, C.k2_new, 'm')
        tl.to(S, { mx: D.n20.mean, duration: T.move, ease: EASE.cam }, '<')
        beat(tl)
        // 2) danach ändert sich nur die Breite des Intervalls (σ_g)
        part(tl, C.k2_new, 's')
        tl.to(S, { sh: D.n20.sigma, duration: T.move, ease: EASE.cam }, '<')
        beat(tl)
      },
    },
    {
      title: 'σ_g wird nicht kleiner', hold: 8,
      build: tl => {
        deck.show(tl, C.k2_conv, '<')
        tl.set(S, { plM: 0, pn: 2, px: 20 })
        tl.to(S, { plA: 1, duration: 0.6 }, '<')
        beat(tl)
        tl.to(S, { pn: 10, duration: 2.2, ease: 'none' })
        beat(tl)
        tl.to(S, { pn: 20, duration: 2.2, ease: 'none' })
        beat(tl)
      },
    },
    {
      title: 'Was σ_g beschreibt', hold: 8,
      build: tl => {
        deck.show(tl, C.k2_meaning, '<')
      },
    },
    {
      title: 'Merke · Standardabweichung', hold: 8,
      build: tl => {
        deck.show(tl, C.k2_rule, '<')
      },
    },
  ]

  // ── Kapitel 3: Messunsicherheit ────────────────────────────────────────────
  const k3 = [
    {
      title: 'Messunsicherheit μ_g', hold: 7,
      build: tl => {
        deck.show(tl, C.k3_u, '<')
        tl.to(S, { plA: 0, bA: 0, duration: 0.7 }, '<')
        beat(tl)
        part(tl, C.k3_u, 'calc')
        tl.set(S, { uh: 0 })
        tl.to(S, { uA: 1, uh: D.n20.u, duration: 1.2, ease: EASE.reveal }, '<0.2')
        beat(tl)
      },
    },
    {
      title: 'Maß für die Messserie', hold: 7,
      build: tl => {
        deck.show(tl, C.k3_series, '<')
      },
    },
    {
      title: 'Erwartungswert g_E', hold: 9,
      build: tl => {
        deck.show(tl, C.k3_mu, '<')
        beat(tl)
        tl.to(S, { muA: 1, duration: 0.9, ease: 'power2.out' })
        beat(tl)
      },
    },
    {
      title: 'g_E ≠ „wahrer Wert“', hold: 8,
      build: tl => {
        deck.show(tl, C.k3_gap, '<')
        tl.to(S, { tvF: 1, duration: 0.8 }, '<')
        beat(tl)
        tl.to(S, { gapA: 1, duration: 0.8 })
        beat(tl)
      },
    },
    {
      title: 'Bedeutung von ḡ ± μ_g', hold: 9,
      build: tl => {
        deck.show(tl, C.k3_meaning, '<')
        tl.to(S, { gapA: 0, duration: 0.6 }, '<')
        beat(tl)
        part(tl, C.k3_meaning, 'out')
        beat(tl)
      },
    },
    {
      title: 'Mehr Messungen', hold: 9,
      build: tl => {
        deck.show(tl, C.k3_conv, '<')
        tl.to(S, { gapA: 0, bA: 0, uA: 1, duration: 0.5 }, '<')
        tl.set(S, { plM: 1, pn: 2, px: 20 })
        tl.to(S, { plA: 1, duration: 0.6 })
        beat(tl)
        tl.to(S, { pn: 20, duration: 3.2, ease: 'none' })
        beat(tl)
        part(tl, C.k3_conv, 'n30')
        dots(tl, 20, 30, { gap: 0.12 })
        tl.to(S, { mx: D.n30.mean, uh: D.n30.u, pn: 30, px: 30, duration: 2, ease: 'power1.inOut' }, '<0.3')
        beat(tl)
        part(tl, C.k3_conv, 'n40')
        dots(tl, 30, 40, { gap: 0.12 })
        tl.to(S, { mx: D.n40.mean, uh: D.n40.u, pn: 40, px: 40, duration: 2, ease: 'power1.inOut' }, '<0.3')
        // mäßiger Zoom: die Messwerte bis etwa ±3 σ bleiben im Bild
        cam.to(tl, { w: 4.8, cx: 9.4 }, { duration: T.cam + 0.4, anchor: { y: 0 } })
        beat(tl)
      },
    },
    {
      title: 'Noch mehr Messungen: n = 100', hold: 9,
      build: tl => {
        part(tl, C.k3_conv, 'n100')
        beat(tl)
        tl.to(S, { dsm: 1, duration: 0.7 })
        dots(tl, 40, 100, { gap: 0.04 })
        tl.to(S, { mx: D.n100.mean, uh: D.n100.u, pn: 100, px: 100, pyLo: 8.8, pyHi: 10.0, duration: 3.5, ease: 'power1.inOut' }, '<0.3')
        part(tl, C.k3_conv, 'n100note')
        beat(tl)
      },
    },
    {
      title: 'Grenze eines Experiments', hold: 10,
      build: tl => {
        deck.show(tl, C.k3_limit, '<')
        tl.to(S, { plA: 0, duration: 0.6 }, '<')
        // letzter Zoom: ḡ ± μ_g, g_E und „wahrer Wert“ im Bild
        cam.to(tl, { w: 1.6, cx: 9.45 }, { duration: T.cam + 0.4, anchor: { y: 0 } })
        tl.to(S, { gapA: 1, duration: 0.8 }, '>-0.1')
        beat(tl)
      },
    },
    {
      title: 'Zusammenfassung · Vergleich', hold: 8,
      build: tl => {
        deck.show(tl, C.k3_sum, '<')
        for (const r of ['r1', 'r2', 'r3']) { beat(tl); part(tl, C.k3_sum, r) }
        beat(tl)
      },
    },
    {
      title: 'Zusammenfassung · Abgrenzung', hold: 10,
      build: tl => {
        part(tl, C.k3_sum, 'c0')
        for (const r of ['c1', 'c2']) { beat(tl); part(tl, C.k3_sum, r) }
        beat(tl)
      },
    },
    {
      title: 'Gesamtergebnis', hold: 10,
      build: tl => {
        deck.show(tl, C.k3_total, '<')
        for (const r of ['b1', 'b2']) { beat(tl); part(tl, C.k3_total, r) }
        beat(tl)
      },
    },
    {
      title: 'Merke · Messunsicherheit', hold: 9,
      build: tl => {
        deck.show(tl, C.k3_rule, '<')
      },
    },
  ]

  return { k1, k2, k3 }
}
