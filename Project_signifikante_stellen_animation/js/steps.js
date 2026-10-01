'use strict'
// Drehbuch Kapitel 1 „Multiplikation": Array von Schritten { title, hold?, build(tl, S) }.
// build() hängt NUR Tweens/Sets an tl an (Reversibilitäts-Regel, Blueprint §10).
// Die Planer (Kamera, Karten, Label-Slots, Treffer) laufen zur Build-Zeit und
// kennen den Zustand am Ende jedes Schritts — Übergänge schließen nahtlos an.
//
//  M  Messen: eine Stange, zwei Maßbänder (1 m, 0,1 m), zwei Stangen → gleiche Ablesung
//  Z  Zahlengerade: „3" als Intervall; 3,0 / 3,00 / 3,000 — je Zoom ×10, neue Teilung
//  R  Fläche: zweite Achse, Rechteck, Zoom auf die Ecke, mögliche Flächen
//  C  Rückweg (erst b, dann l) · D  Mischungen · E  Merksatz

import { createCamera, createCardDeck, createSlots } from '../../shared/js/step-kit.js'
import {
  T, EASE, CAM_START, CAM_ROD_END, CAM_OVERVIEW, camA, levelWidth, camForExample,
  L_LEVELS, RODS_LEVEL, RODS_MEASURE, ROD_SHORT, ROD_FINE_SHORT,
  B_FINAL, RETURN_PATH, MIXES, CORNER_SAMPLES, R_TEXT, R_SAMPLES, textIndex,
} from './constants.js'
import { parseMeasured, circumference } from './model.js'
import { CMB_FIRST_RETURN, CMB_FIRST_MIX } from './content.js'
import { HITS } from './state.js'

export function buildSteps(S, DOM) {
  const C = DOM.cards
  const cam = createCamera(S, CAM_START)
  const deck = createCardDeck()
  const pl = createSlots(S, 'pl'), ql = createSlots(S, 'ql'), rd = createSlots(S, 'rd')
  const dl = createSlots(S, 'dl'), db = createSlots(S, 'db')
  const L = L_LEVELS.map(parseMeasured)
  const B = parseMeasured(B_FINAL)

  // ── Build-Zeit-Helfer ──────────────────────────────────────────────────────
  const swapDyn = (tl, key, i, at) => {
    tl.to(S, { dynA: 0, duration: 0.18, ease: 'power1.in' }, at)
    tl.set(S, { [key]: i })
    tl.to(S, { dynA: 1, duration: 0.4, ease: 'power2.out' })
  }

  let hitN = 0
  const clearHits = (tl, at) => {
    const v = {}
    for (let i = 0; i < hitN; i++) v[`h${i}a`] = 0
    if (hitN) tl.to(S, { ...v, duration: 0.35 }, at)
    hitN = 0
  }
  const markHit = (tl, x, y, at) => {
    const h = `h${hitN++ % HITS}`
    tl.set(S, { [h + 'x']: x, [h + 'y']: y }, at)
    tl.to(S, { [h + 'a']: 1, duration: 0.3, ease: EASE.pop }, '<')
  }

  // Pfeil „wahre Länge": Stange auf Länge x bringen, Pfeil steigt vom
  // Stangenende zur Zahlengeraden, landet mit Impulsring, hinterläßt Treffer.
  let arUp = false, rodLen = S.rod0
  const fire = (tl, x, at) => {
    if (arUp) tl.to(S, { arD: 0, duration: 0.28, ease: 'power2.in' }, at)
    if (x !== rodLen) tl.to(S, { rod0: x, duration: 0.6, ease: EASE.cam }, arUp ? '>' : at)
    tl.set(S, { arA: 1 }, arUp || x !== rodLen ? '>' : at)
    tl.to(S, { arD: 1, duration: 0.55, ease: 'power3.out' })
    tl.set(S, { ping: 0 })
    tl.to(S, { ping: 1, duration: 0.7, ease: 'power2.out' })
    markHit(tl, x, 0, '<')
    arUp = true; rodLen = x
  }
  const arrowOff = (tl, at) => {
    if (arUp) tl.to(S, { arD: 0, arA: 0, duration: 0.3 }, at)
    arUp = false
  }

  // Mögliche wahre Rechtecke: Ecke springt durch das Unsicherheitsfeld,
  // die Live-Anzeige rechnet l · b mit; danach zurück auf die Nennwerte.
  const vary = (tl, l, b, n) => {
    tl.set(S, { roD: Math.max(l.decimals, b.decimals) + 2 })
    tl.to(S, { roA: 1, duration: 0.35 })
    CORNER_SAMPLES.slice(0, n).forEach(([fx, fy], i) => {
      const x = l.value + fx * l.width / 2, y = b.value + fy * b.width / 2
      tl.to(S, { rW: x, rH: y, duration: 0.65, ease: EASE.cam }, i ? '>1.1' : '>0.1')
      markHit(tl, x, y, '>-0.05')
    })
    tl.to(S, { rW: l.value, rH: b.value, duration: 0.5, ease: EASE.cam }, '>1.2')
    tl.to(S, { roA: 0, duration: 0.3 }, '<0.2')
  }

  const steps = []
  const step = (title, build, hold) => steps.push({ title, build, hold })

  // ── M · Messen ─────────────────────────────────────────────────────────────
  // Stangenende markieren → Ablesebereich der nächsten Marke aufleuchten lassen →
  // geschwungener Pfeil rastet auf der Marke ein → „abgelesen: …"
  const shown = { mk: [false, false], zone: false, rd: -1 }
  const markRod = (tl, i, at) => {
    if (shown.mk[i]) return
    tl.set(S, { [`mk${i}A`]: 1, [`mk${i}D`]: 0 }, at)
    tl.to(S, { [`mk${i}D`]: 1, duration: 0.5, ease: 'power2.out' }, '<')
    shown.mk[i] = true
  }
  const zoneTo = (tl, lo, hi, at) => {
    if (!shown.zone) tl.set(S, { zLo: (lo + hi) / 2, zHi: (lo + hi) / 2, zA: 1 }, at)
    tl.to(S, { zLo: lo, zHi: hi, duration: 0.8, ease: shown.zone ? EASE.cam : EASE.reveal },
      shown.zone ? at : '<')
    shown.zone = true
  }
  const snap = (tl, i, mark, text, at) => {
    tl.set(S, { [`sn${i}A`]: 1, [`sn${i}D`]: 0 }, at)
    if (shown.rd < 0) tl.set(S, { rdX: mark }, '<')
    else tl.to(S, { rdX: mark, duration: 0.5, ease: EASE.cam }, '<')
    tl.to(S, { [`sn${i}D`]: 1, duration: 0.75, ease: 'power2.inOut' }, '<')
    const idx = textIndex(text)
    if (idx !== shown.rd) {
      if (shown.rd < 0) tl.to(S, { rdA: 1, duration: 0.3 }, '>-0.2')
      rd.show(tl, idx, { at: shown.rd < 0 ? '<' : '>-0.2' })
      shown.rd = idx
    }
  }
  const unsnap = (tl, i, at) => tl.to(S, { [`sn${i}A`]: 0, duration: 0.25 }, at)
  const rodTo = (tl, x, at) => {
    tl.to(S, { rod0: x, duration: 0.9, ease: EASE.cam }, at)
    rodLen = x
  }

  step('Eine Metallstange', tl => {
    tl.to(S, { rod0A: 1, rod0S: 0, duration: 1.1, ease: EASE.reveal })
    tl.to(S, { tapeA: 1, tapeY: 0, duration: 0.9, ease: EASE.reveal }, '<0.5')
    tl.to(S, { tg0: 1, duration: T.grow, ease: 'power1.inOut' }, '<0.25')
    deck.show(tl, C.intro, '<')
  }, 3)

  step('Ablesen: 3 m', tl => {
    deck.show(tl, C.read1)
    markRod(tl, 0, '<0.2')
    zoneTo(tl, 2.5, 3.5, '>0.1')
    snap(tl, 0, 3, '3 m', '>0.1')
  }, 4)

  step('Kürzere Stange: 2 m', tl => {
    unsnap(tl, 0)
    deck.show(tl, C.short, '<')
    rodTo(tl, ROD_SHORT, '<0.15')
    zoneTo(tl, 1.5, 2.5, '>-0.2')
    snap(tl, 0, 2, '2 m', '>0.05')
  }, 4)

  step('Feineres Maßband: 0,1 m', tl => {
    unsnap(tl, 0)
    deck.show(tl, C.read2, '<')
    cam.to(tl, CAM_ROD_END, { duration: T.cam, anchor: { y: 0 }, at: '<' })
    rodTo(tl, RODS_MEASURE[0], '<0.2')
    tl.to(S, { tg1: 1, duration: T.grow, ease: 'power1.inOut' }, '>-0.6')
    zoneTo(tl, 2.95, 3.05, '<0.3')
    snap(tl, 0, 3, '3,0 m', '>0.05')
    // Gegenprobe: etwas kürzer → nächste Marke ist 2,9
    unsnap(tl, 0, '>0.9')
    rodTo(tl, ROD_FINE_SHORT, '<')
    zoneTo(tl, 2.85, 2.95, '>-0.3')
    snap(tl, 0, 2.9, '2,9 m', '>0.05')
  }, 4)

  step('Zwei Stangen, eine Ablesung', tl => {
    unsnap(tl, 0)
    deck.show(tl, C.two, '<')
    rodTo(tl, RODS_MEASURE[0], '<0.1')
    zoneTo(tl, 2.95, 3.05, '<0.2')
    snap(tl, 0, 3, '3,0 m', '>0.05')
    tl.to(S, { rod1A: 1, rod1S: 0, duration: 1, ease: EASE.reveal }, '>0.2')
    markRod(tl, 1, '>-0.1')
    snap(tl, 1, 3, '3,0 m', '>0.05')
  }, 5)

  // ── Z · Zahlengerade ───────────────────────────────────────────────────────
  step('Die Zahlengerade', tl => {
    tl.to(S, { rod1A: 0, rdA: 0, zA: 0, mk0A: 0, mk1A: 0, sn0A: 0, sn1A: 0, duration: 0.5 })
    rd.hide(tl, { at: '<' })
    cam.to(tl, camA(3, levelWidth(0)), { duration: T.cam, at: '<0.2', anchor: { y: 0 } })
    tl.to(S, { tg1: 0, duration: 0.8 }, '<')
    tl.to(S, { axisDraw: 1, duration: T.draw, ease: EASE.cam }, '<0.4')
    tl.to(S, { pA: 1, pS: 1, duration: T.pop, ease: EASE.pop }, '>-0.2')
    pl.show(tl, textIndex('3'), { at: '<0.1' })
    deck.show(tl, C.line, '<')
    fire(tl, RODS_LEVEL[0][0], '>0.2')
  }, 3.5)

  step('Rundungsintervall von „3"', tl => {
    deck.show(tl, C.int)
    tl.to(S, { ag0: 1, duration: T.grow, ease: 'power1.inOut' }, '<')
    tl.to(S, { lA: 1, lLo: L[0].lo, lHi: L[0].hi, duration: 1, ease: EASE.reveal }, '<0.3')
    tl.to(S, { lEndA: 1, duration: 0.4 }, '<0.5')
    tl.set(S, { lBndD: 1 }, '<')
    tl.to(S, { lBndA: 1, duration: 0.4 }, '<0.1')
    RODS_LEVEL[0].slice(1).forEach(x => fire(tl, x, '>0.15'))
  }, 4.5)

  for (let k = 1; k < L.length; k++) {
    step(`Teilung ${['', '0,1 m', '1 cm', '1 mm'][k]}: „${L[k].text}"`, tl => {
      // 1) feineres Maßband, neue Ablesung, Intervall schrumpft im alten
      arrowOff(tl)
      clearHits(tl, '<')
      tl.to(S, { ['tg' + k]: 1, duration: T.grow, ease: 'power1.inOut' }, '<')
      pl.show(tl, textIndex(L[k].text), { at: '<0.3' })
      if (k === 1) { tl.set(S, { lvl: 1 }, '<'); deck.show(tl, C.lvl, '<') }
      else swapDyn(tl, 'lvl', k, '<')
      tl.set(S, { gLo: L[k - 1].lo, gHi: L[k - 1].hi, gA: 1 }, '<')
      tl.to(S, { lBndA: 0, duration: 0.2 }, '<')
      tl.to(S, { lLo: L[k].lo, lHi: L[k].hi, gA: 0.3, duration: 1.1, ease: EASE.cam }, '<0.2')
      // 2) Zoom ×10: alte Teilung zieht sich zurück, neue wächst aus der Achse
      cam.to(tl, camA(3, levelWidth(k)), { duration: T.cam, anchor: { y: 0 }, at: '>0.15' })
      tl.to(S, { ['ag' + (k - 1)]: 0, gA: 0, duration: T.cam * 0.8 }, '<')
      tl.to(S, { ['ag' + k]: 1, duration: T.grow, ease: 'power1.inOut' }, '>-0.35')
      tl.set(S, { lBndD: k + 1 }, '<')
      tl.to(S, { lBndA: 1, duration: 0.4 }, '<0.6')
      // 3) Stangen mit verschiedenen wahren Längen — gleiche Ablesung
      RODS_LEVEL[k].forEach(x => fire(tl, x, '>0.1'))
      if (k === L.length - 1) deck.show(tl, C.tenfold, '>0.2')
    }, k === L.length - 1 ? 5.5 : 4)
  }

  // ── R · Fläche ─────────────────────────────────────────────────────────────
  step('Eine zweite Messgröße', tl => {
    arrowOff(tl)
    clearHits(tl, '<')
    pl.hide(tl, { at: '<' })
    tl.to(S, {
      pA: 0, lBndA: 0, lEndA: 0, ag0: 0, ag1: 0, ag2: 0, ag3: 0,
      tapeA: 0, tapeY: 70, rod0A: 0, duration: 0.6,
    }, '<')
    cam.to(tl, CAM_OVERVIEW, { duration: T.camLong, at: '<0.1' })
    tl.to(S, { lSpan: 1, duration: T.camLong * 0.8, ease: EASE.cam }, '<')
    tl.to(S, { xTicks: 1, duration: 0.8 }, '>-0.9')
    tl.set(S, { yAlpha: 1 }, '<')
    tl.to(S, { yDraw: 1, duration: 0.9, ease: EASE.cam }, '<')
    tl.to(S, { names: 1, duration: 0.5 }, '>-0.3')
    tl.to(S, { qA: 1, qS: 1, duration: T.pop, ease: EASE.pop }, '>-0.1')
    ql.show(tl, textIndex(B_FINAL), { at: '<0.15' })
    tl.to(S, { bA: 1, bLo: B.lo, bHi: B.hi, duration: 0.6 }, '<')
    deck.show(tl, C.axis2, 0.5)
  }, 3.5)

  step('Das Rechteck', tl => {
    tl.to(S, { rA: 1, rW: L[3].value, duration: 0.8, ease: EASE.cam })
    tl.to(S, { rH: B.value, duration: 0.8, ease: EASE.cam }, '>-0.1')
    ql.hide(tl, { at: '<' })
    tl.to(S, { qA: 0, duration: 0.4 }, '<')
    dl.show(tl, textIndex(L_LEVELS[3]), { at: '<0.3' })
    db.show(tl, textIndex(B_FINAL), { at: '<0.15' })
    tl.to(S, { aSym: 1, duration: 0.6 }, '<')
    deck.show(tl, C.area, '<')
  }, 5)

  step('Zoom auf die Ecke', tl => {
    cam.to(tl, camForExample(L[3], B), { duration: T.camLong + 0.6 })
    tl.to(S, { stripA: 0.85, aSym: 0, duration: 1 }, '<')
    deck.show(tl, C.corner, '<0.4')
  }, 4)

  step('Mögliche Flächen', tl => {
    vary(tl, L[3], B, 4)
    tl.set(S, { cmb: 0 }, '<')
    tl.to(S, { uA: 1, stripA: 0.35, duration: 0.8, ease: EASE.reveal })
    tl.to(S, { uTagA: 1, duration: 0.5 }, '<0.4')
    deck.show(tl, C.range, '<-0.3')
  }, 6)

  // ── C · Rückweg und D · Mischungen ─────────────────────────────────────────
  let cur = { l: L[3], b: B }
  const toExample = (tl, lt, bt, camTarget) => {
    const l = parseMeasured(lt), b = parseMeasured(bt)
    const lCh = l.text !== cur.l.text, bCh = b.text !== cur.b.text
    if (lCh) dl.show(tl, textIndex(lt), { at: '<' })
    if (bCh) db.show(tl, textIndex(bt), { at: lCh ? '<0.1' : '<' })
    cam.to(tl, camTarget ?? camForExample(l, b), { duration: T.cam, at: '<' })
    tl.to(S, { lLo: l.lo, lHi: l.hi, bLo: b.lo, bHi: b.hi, rW: l.value, rH: b.value,
      duration: T.cam, ease: EASE.cam }, '<')
    cur = { l, b }
    return { l, b }
  }
  const example = (title, [lt, bt], cmb, camTarget) => step(title, tl => {
    clearHits(tl)
    tl.to(S, { uTagA: 0, duration: 0.3 }, '<')
    swapDyn(tl, 'cmb', cmb, '<')
    const { l, b } = toExample(tl, lt, bt, camTarget)
    vary(tl, l, b, 3)
    tl.to(S, { uTagA: 1, duration: 0.4 }, '>-0.2')
  }, 5)

  RETURN_PATH.forEach((p, j) => example(`Rückweg: ${p[0]} · ${p[1]}`, p, CMB_FIRST_RETURN + j))
  MIXES.forEach((p, m) => example(`Beispiel: ${p[0]} · ${p[1]}`, p, CMB_FIRST_MIX + m, CAM_OVERVIEW))

  // ── K · Kreisumfang: exakte Faktoren begrenzen nichts ──────────────────────
  const circ = circumference(R_TEXT)
  step('Kreis mit Radius r', tl => {
    clearHits(tl)
    dl.hide(tl, { at: '<' })
    db.hide(tl, { at: '<' })
    tl.to(S, {
      rA: 0, uA: 0, uTagA: 0, lA: 0, bA: 0, xA: 0, roA: 0, duration: 0.6,
    }, '<')
    tl.set(S, { kA: 1, kDraw: 0, kR: circ.r.value, kLo: circ.r.value, kHi: circ.r.value })
    tl.to(S, { kDraw: 1, duration: 1.4, ease: 'power2.inOut' })
    tl.to(S, { kRadA: 1, duration: 0.5 }, '>-0.3')
    deck.show(tl, C.circle, '<-0.8')
  }, 4)

  step('Umfang U = 2πr', tl => {
    tl.to(S, { kRing: 1, kLo: circ.r.lo, kHi: circ.r.hi, duration: 0.9, ease: EASE.reveal })
    tl.to(S, { kRo: 1, duration: 0.4 }, '<0.3')
    R_SAMPLES.forEach((r, i) => {
      tl.to(S, { kR: r, duration: 0.7, ease: EASE.cam }, i ? '>1.1' : '>0.2')
    })
    tl.to(S, { kR: circ.r.value, duration: 0.6, ease: EASE.cam }, '>1.2')
    tl.to(S, { kRo: 0, duration: 0.4 }, '<0.2')
    deck.show(tl, C.circle2, '<')
  }, 6)

  // ── E · Merksatz ───────────────────────────────────────────────────────────
  step('Merke', tl => {
    tl.to(S, { dim: 1, duration: 0.8 })
    deck.show(tl, C.rule, '<0.2')
  }, 8)

  return steps
}
