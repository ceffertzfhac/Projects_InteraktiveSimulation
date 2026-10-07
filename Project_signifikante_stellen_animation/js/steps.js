'use strict'
// Drehbuch der Kapitel „Grundlagen" und „Multiplikation" (eine Szene, ein Planer):
// buildSteps() liefert { grund, cleanup, mult } — Arrays von Schritten { title, hold?, build(tl, S) }.
// Das Kapitel Multiplikation spielt grund + cleanup vorab still ab (Startzustand).
// build() hängt NUR Tweens/Sets an tl an (Reversibilitäts-Regel, Blueprint §10).
// Die Planer (Kamera, Karten, Label-Slots, Treffer) laufen zur Build-Zeit und
// kennen den Zustand am Ende jedes Schritts — Übergänge schließen nahtlos an.
//
//  M  Messen: ein Stab, zwei Maßbänder (1 m, 0,1 m), zwei Stäbe → gleiche Ablesung
//  Z  Zahlengerade: „3" als Intervall, letzte Ziffer unsicher (± ½ Einheit);
//     3,0 / 3,00 / 3,000 — je Zoom ×10, neue Teilung; signifikante Stellen, führende Nullen
//  ── Kapitel Multiplikation ──
//  R  Fläche: Achsen l / m und b / m mit Rechteck, Taschenrechner, Zoom auf die Ecke, mögliche Flächen,
//     Ecken-Test (l_min·b_min … l_max·b_max), Ziffern vergleichen (erste abweichende Ziffer
//     = unsichere), groß: wie viele Stellen gebe ich an? (Band gegen Klammer)
//  C  Gröber gemessen (b, dann beide: 6,686 → 6,68 → 6) · K Kreis · E Merksatz

import { createCamera, createCardDeck, createSlots } from '../../shared/js/step-kit.js'
import {
  T, EASE, CAM_START, CAM_ROD_END, CAM_OVERVIEW, camA, levelWidth, camForExample,
  L_LEVELS, RODS_LEVEL, RODS_MEASURE, ROD_SHORT, ROD_FINE_OTHER,
  B_FINAL, RETURN_PATH, MIXES, CORNER_SAMPLES, R_TEXTS, R_SAMPLES, textIndex,
  SIG_TOKENS, SIG_REPS,
} from './constants.js'
import { parseMeasured, circleExample } from './model.js'
import { CMB_FIRST_RETURN, CMB_FIRST_MIX, LUPE, LUPE_CIRCLE, COMPARE, SUMMARY, CORNERS } from './content.js'
import { HITS } from './state.js'
import { scanPlaces, compareScan as scanCompare, revealSummary } from './stellen.js'

export function buildSteps(S, DOM) {
  const C = DOM.cards
  const cam = createCamera(S, CAM_START)
  const deck = createCardDeck()
  const pl = createSlots(S, 'pl'), ql = createSlots(S, 'ql'), rd = createSlots(S, 'rd')
  const rl = createSlots(S, 'rl')
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
  const markHit = (tl, x, y, at, color = 0) => {
    const h = `h${hitN++ % HITS}`
    tl.set(S, { [h + 'x']: x, [h + 'y']: y, [h + 'c']: color }, at)
    tl.to(S, { [h + 'a']: 1, duration: 0.3, ease: EASE.pop }, '<')
  }

  // Pfeil „wahre Länge": Stab auf Länge x bringen, Pfeil steigt vom
  // Stabende zur Zahlengeraden, landet mit Impulsring, hinterläßt Treffer.
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

  let steps = []
  const step = (title, build, hold) => steps.push({ title, build, hold })

  // Zeilen einer Folienkarte (data-r) nacheinander einblenden
  const rows = card => card.querySelectorAll('[data-r]')
  const hideRows = (tl, card, at) => tl.set(rows(card), { autoAlpha: 0 }, at)
  const reveal = (tl, card, name, at) =>
    tl.to(card.querySelector(`[data-r="${name}"]`), { autoAlpha: 1, duration: 0.5 }, at)

  // Tafel „Welche Stelle ist unsicher?" (Band gegen Klammer) — derzeit nicht im Drehbuch,
  // bleibt für Einzelfälle (PO 2026-10-02: Ziffernvergleich ist die Hauptmethode)
  const lupeScan = (tl, idx, full, at) => {
    const info = LUPE[idx].info
    const first = (full ? info.places : info.places.slice(-3))[0].p
    tl.to(S, { slA: 0, duration: 0.3 }, at)
    tl.set(S, { slP: first })
    scanPlaces(tl, S, info, idx, {
      full, hold: full ? 1.4 : 1,
      zoom: (t2, p) => t2.to(S, { slP: p, duration: 0.9, ease: EASE.cam }, '>0.1'),
    })
  }

  // ── M · Messen ─────────────────────────────────────────────────────────────
  // Stabende markieren → Ablesebereich der nächsten Marke aufleuchten lassen →
  // geschwungener Pfeil rastet auf der Marke ein → „abgelesener Messwert: …"
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

  step('Ein Metallstab', tl => {
    tl.to(S, { rod0A: 1, rod0S: 0, duration: 1.1, ease: EASE.reveal })
    // Maßband: Haken am Stabanfang, dann aus dem Gehäuse ausrollen; die Teilung wächst mit
    tl.to(S, { tapeA: 1, tapeY: 0, duration: 0.6, ease: EASE.reveal }, '<0.5')
    tl.to(S, { tapeR: 1, duration: 1.8, ease: 'power2.out' }, '>')
    tl.to(S, { tg0: 1, duration: T.grow, ease: 'power1.inOut' }, '<0.3')
    deck.show(tl, C.intro, '<')
  }, 3)

  step('Ablesen: 3 m', tl => {
    deck.show(tl, C.read1)
    markRod(tl, 0, '<0.2')
    zoneTo(tl, 2.5, 3.5, '>0.1')
    snap(tl, 0, 3, '3 m', '>0.1')
  }, 4)

  step('Kürzerer Stab: 2 m', tl => {
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
    zoneTo(tl, 3.05, 3.15, '<0.3')
    snap(tl, 0, 3.1, '3,1 m', '>0.05')
    // Gegenprobe: etwas länger → nächste Marke ist 3,2
    unsnap(tl, 0, '>0.9')
    rodTo(tl, ROD_FINE_OTHER, '<')
    zoneTo(tl, 3.15, 3.25, '>-0.3')
    snap(tl, 0, 3.2, '3,2 m', '>0.05')
  }, 4)

  step('Zwei Stäbe, ein Messwert', tl => {
    unsnap(tl, 0)
    deck.show(tl, C.two, '<')
    rodTo(tl, RODS_MEASURE[0], '<0.1')
    zoneTo(tl, 3.05, 3.15, '<0.2')
    snap(tl, 0, 3.1, '3,1 m', '>0.05')
    tl.to(S, { rod1A: 1, rod1S: 0, duration: 1, ease: EASE.reveal }, '>0.2')
    markRod(tl, 1, '>-0.1')
    snap(tl, 1, 3.1, '3,1 m', '>0.05')
  }, 5)

  // ── Z · Zahlengerade ───────────────────────────────────────────────────────
  step('Die Zahlengerade', tl => {
    tl.to(S, { rod1A: 0, rdA: 0, zA: 0, mk0A: 0, mk1A: 0, sn0A: 0, sn1A: 0, duration: 0.5 })
    rd.hide(tl, { at: '<' })
    cam.to(tl, camA(3 + 0.12 * levelWidth(0), levelWidth(0)), { duration: T.cam, at: '<0.2', anchor: { y: 0 } })
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

  step('Die letzte Ziffer ist unsicher', tl => {
    deck.show(tl, C.unc)
    tl.set(S, { ucA: 1 }, '<')
    tl.to(S, { ucBox: 1, duration: 0.5 }, '<0.3')
    tl.set(S, { pmA: 1, pmD: 0 }, '>0.3')
    tl.to(S, { pmD: 1, duration: 1, ease: EASE.reveal })
  }, 6)

  for (let k = 1; k < L.length; k++) {
    step(`Teilung ${['', '0,1 m', '1 cm', '1 mm'][k]}: „${L[k].text}"`, tl => {
      // 1) feineres Maßband, neue Ablesung, Intervall schrumpft im alten
      arrowOff(tl)
      clearHits(tl, '<')
      tl.to(S, { pmA: 0, ucBox: 0, duration: 0.3 }, '<')
      tl.to(S, { ['tg' + k]: 1, duration: T.grow, ease: 'power1.inOut' }, '<')
      pl.show(tl, textIndex(L[k].text), { at: '<0.3' })
      if (k === 1) { tl.set(S, { lvl: 1 }, '<'); deck.show(tl, C.lvl, '<') }
      else swapDyn(tl, 'lvl', k, '<')
      tl.set(S, { gLo: L[k - 1].lo, gHi: L[k - 1].hi, gA: 1 }, '<')
      tl.to(S, { lBndA: 0, duration: 0.2 }, '<')
      tl.to(S, { lLo: L[k].lo, lHi: L[k].hi, pX: L[k].value, gA: 0.3, duration: 1.1, ease: EASE.cam }, '<0.2')
      // 2) Zoom ×10 auf den neuen Messwert: alte Teilung zieht sich zurück, neue wächst
      cam.to(tl, camA(L[k].value + 0.12 * levelWidth(k), levelWidth(k)), { duration: T.cam, anchor: { y: 0 }, at: '>0.15' })
      tl.to(S, { ['ag' + (k - 1)]: 0, gA: 0, duration: T.cam * 0.8 }, '<')
      tl.to(S, { ['ag' + k]: 1, duration: T.grow, ease: 'power1.inOut' }, '>-0.35')
      tl.set(S, { lBndD: k + 1 }, '<')
      tl.to(S, { lBndA: 1, duration: 0.4 }, '<0.6')
      // 3) unsichere Stelle wandert eine Stelle nach rechts: ±-Pfeile, Markierung
      tl.set(S, { pmA: 1, pmD: 0 }, '>0.1')
      tl.to(S, { pmD: 1, duration: 0.8, ease: EASE.reveal })
      tl.to(S, { ucBox: 1, duration: 0.4 }, '<0.2')
      // 4) Stäbe mit verschiedenen wahren Längen — gleiche Ablesung
      RODS_LEVEL[k].forEach(x => fire(tl, x, '>0.1'))
    }, 5)
  }

  // Signifikante Stellen: zählen, gesichert/unsicher; dieselbe Messung in anderen Einheiten
  const toRep = (tl, k, at) => {
    const r = SIG_REPS[k], v = {}
    for (const [id] of SIG_TOKENS) {
      if (id in r) v[`tk${id}x`] = r[id] - r.w / 2
      v[`tk${id}a`] = id in r ? 1 : 0
    }
    tl.to(S, { ...v, duration: 1.1, ease: EASE.cam }, at)
  }
  step('Was sind signifikante Stellen?', tl => {
    deck.show(tl, C.sigdef)
    arrowOff(tl, '<')
    clearHits(tl, '<')
    tl.to(S, { pmA: 0, duration: 0.3 }, '<')
    tl.to(S, { sgA: 1, duration: 0.5 }, '<0.2')
    ;[1, 2, 3, 4].forEach(n => tl.to(S, { [`bg${n}`]: 1, duration: 0.4, ease: EASE.pop }, '>0.25'))
    tl.to(S, { brS: 1, duration: 0.4 }, '>0.4')
    tl.to(S, { brU: 1, duration: 0.4 }, '>0.3')
  }, 7)

  step('Führende Nullen zählen nicht', tl => {
    // „gesichert" und „unsicher" wandern in jeder Schreibweise mit (PO 2026-10-07);
    // die Nullen-Klammer steht, solange es führende Nullen gibt
    deck.show(tl, C.zeros)
    toRep(tl, 1, '>0.1')                         // 0,003120 km
    tl.to(S, { brZ: 1, duration: 0.4 }, '>0.1')
    toRep(tl, 2, '>2.2')                         // 312,0 cm — Nullen-Klammer blendet mit den Nullen aus
    tl.set(S, { brZ: 0 }, '>')
    toRep(tl, 3, '>1.4')                         // 3120 mm (Endnull zählt)
  }, 7)

  const grund = steps
  steps = []
  // Übergang ins Kapitel Multiplikation (still vorab abgespielt): Ziffernzeile, Karte weg
  const cleanup = tl => {
    tl.to(S, { sgA: 0, duration: 0.3 })
    deck.hide(tl, '<')
  }

  // ── R · Fläche ─────────────────────────────────────────────────────────────
  // Gleich zu Beginn als Flächenbestimmung erkennbar: Achsen l / m und b / m,
  // Rechteck mit beiden Kantenlängen und A (PO 2026-10-07, FSS9 g)
  step('Flächenbestimmung', tl => {
    arrowOff(tl)
    clearHits(tl, '<')
    tl.to(S, { sgA: 0, pmA: 0, ucBox: 0, lA: 0, duration: 0.4 }, '<')
    pl.hide(tl, { at: '<' })
    tl.to(S, {
      pA: 0, lBndA: 0, lEndA: 0, ag0: 0, ag1: 0, ag2: 0, ag3: 0,
      tapeA: 0, tapeY: 70, rod0A: 0, duration: 0.6,
    }, '<')
    tl.set(S, { lSpan: 1 })
    cam.to(tl, CAM_OVERVIEW, { duration: T.camLong, at: '<0.1' })
    tl.to(S, { xTicks: 1, duration: 0.8 }, '>-0.9')
    tl.set(S, { yAlpha: 1 }, '<')
    tl.to(S, { yDraw: 1, duration: 0.9, ease: EASE.cam }, '<')
    tl.to(S, { names: 1, duration: 0.5 }, '>-0.3')
    deck.show(tl, C.axis2, '<')
    tl.to(S, { rA: 1, rW: L[3].value, duration: 0.8, ease: EASE.cam }, '>0.1')
    tl.to(S, { rH: B.value, duration: 0.8, ease: EASE.cam }, '>-0.1')
    dl.show(tl, textIndex(L_LEVELS[3]), { at: '<0.3' })
    db.show(tl, textIndex(B_FINAL), { at: '<0.15' })
    tl.to(S, { aSym: 1, duration: 0.6 }, '<')
  }, 4)

  step('Messwerte und Taschenrechner', tl => {
    deck.show(tl, C.area)
    // Rundungsintervalle beider Messwerte als Streifen
    tl.set(S, { bLo: B.value, bHi: B.value }, '<')
    tl.to(S, { lA: 1, bA: 1, bLo: B.lo, bHi: B.hi, duration: 0.6 }, '<0.2')
    // Taschenrechner: Eingabe Taste für Taste, dann alle Stellen des Produkts —
    // mehr, als die Messung hergibt
    tl.set(S, { calcT: 0 }, '>0.3')
    tl.to(S, { calcA: 1, duration: 0.5 })
    tl.to(S, { calcT: 1, duration: 3.2, ease: 'none' }, '>0.1')
  }, 5)

  step('Zoom auf die Ecke', tl => {
    tl.to(S, { calcA: 0, duration: 0.3 })
    cam.to(tl, camForExample(L[3], B), { duration: T.camLong + 0.6, at: '<' })
    tl.to(S, { stripA: 0.85, aSym: 0, duration: 1 }, '<')
    deck.show(tl, C.corner, '<0.4')
  }, 4)

  step('Mögliche Flächen', tl => {
    deck.show(tl, C.vary)
    vary(tl, L[3], B, 4)
  }, 4)

  // Grenzen eines Rechenbeispiels: kleinste = l_min·b_min, größte = l_max·b_max
  const goCorner = (tl, x, y, at, color) => {
    tl.to(S, { rW: x, rH: y, duration: 0.7, ease: EASE.cam }, at)
    markHit(tl, x, y, '>-0.05', color)
  }
  const boundsEnd = (tl, l, b) => {
    tl.to(S, { rW: l.value, rH: b.value, duration: 0.6, ease: EASE.cam }, '>1')
    tl.to(S, { roA: 0, mxA: 0, mnA: 0, duration: 0.3 }, '<0.2')
    tl.to(S, { uA: 1, stripA: 0.35, duration: 0.7, ease: EASE.reveal })
    tl.to(S, { uTagA: 1, duration: 0.5 }, '<0.3')
  }
  const bounds = (tl, l, b, card) => {
    tl.set(S, { roD: Math.max(l.decimals, b.decimals) + 2 })
    tl.to(S, { roA: 1, edA: 1, duration: 0.4 })
    goCorner(tl, l.lo, b.lo, '>0.2')
    tl.to(S, { mnA: 1, duration: 0.4 }, '>0.1')
    reveal(tl, card, 'min', '<')
    goCorner(tl, l.hi, b.hi, '>1')
    tl.to(S, { mnA: 0, mxA: 1, duration: 0.4 }, '>0.1')
    reveal(tl, card, 'max', '<')
    boundsEnd(tl, l, b)
  }

  // Ecken-Test (FSS9 h): alle vier Ecken anfahren — je Ecke ein farbiger Treffer und die
  // Zeile gleicher Farbe in der Liste —, dann nach Größe sortieren, A_min und A_max
  // markieren, die gemischten Ecken herausnehmen
  step('Grenzen der Fläche', tl => {
    clearHits(tl)
    const K = C.corners, row = i => K.querySelector(`[data-c="${i}"]`)
    const tag = i => K.querySelector(`[data-ct="${i}"]`)
    const l = L[3], b = B
    tl.set(K.querySelectorAll('.corner-row'), { autoAlpha: 0 }, '<')
    tl.set(K.querySelector('[data-r="sorted"]'), { autoAlpha: 0 }, '<')
    CORNERS.forEach(c => { tl.set(row(c.i), { '--slot': c.i }, '<'); tl.set(tag(c.i), { autoAlpha: 0 }, '<') })
    tl.set(K.querySelectorAll('.corner-row'), { outline: 'none' }, '<')
    deck.show(tl, K, '<')
    tl.set(S, { roD: Math.max(l.decimals, b.decimals) + 2 })
    tl.to(S, { roA: 1, edA: 1, duration: 0.4 })
    CORNERS.forEach((c, n) => {
      goCorner(tl, c.ls === 'min' ? l.lo : l.hi, c.bs === 'min' ? b.lo : b.hi, n ? '>0.9' : '>0.2', c.i + 1)
      tl.to(row(c.i), { autoAlpha: 1, duration: 0.45 }, '<')
    })
    // nach Größe sortieren
    CORNERS.forEach(c => tl.to(row(c.i), { '--slot': c.rank, duration: 0.9, ease: EASE.cam }, c.i ? '<' : '>1'))
    reveal(tl, K, 'sorted', '>0.2')
    // A_min und A_max markieren — am Bild die Rechtecke
    const lo = CORNERS.find(c => c.rank === 0), hi = CORNERS.find(c => c.rank === 3)
    tl.to(tag(lo.i), { autoAlpha: 1, duration: 0.4 }, '>0.8')
    tl.set(row(lo.i), { outline: '2px solid var(--accent)' }, '<')
    tl.to(S, { rW: l.lo, rH: b.lo, mnA: 1, duration: 0.7, ease: EASE.cam }, '<')
    tl.to(tag(hi.i), { autoAlpha: 1, duration: 0.4 }, '>0.9')
    tl.set(row(hi.i), { outline: '2px solid var(--accent)' }, '<')
    tl.to(S, { rW: l.hi, rH: b.hi, mxA: 1, duration: 0.7, ease: EASE.cam }, '<')
    // gemischte Ecken heraus, A_max rückt nach
    const mixed = CORNERS.filter(c => c.rank === 1 || c.rank === 2)
    tl.to(mixed.map(c => row(c.i)), { autoAlpha: 0, duration: 0.5 }, '>1.2')
    tl.to(S, Object.fromEntries(mixed.map(c => [`h${c.i}a`, 0]).concat([['duration', 0.5]])), '<')
    tl.to(row(hi.i), { '--slot': 1, duration: 0.8, ease: EASE.cam }, '>0.1')
    tl.to(K.querySelector('[data-r="sorted"]'), { autoAlpha: 0, duration: 0.3 }, '<')
    boundsEnd(tl, l, b)
  }, 7)

  step('Ziffern vergleichen', tl => {
    hideRows(tl, C.cmp, '<')
    deck.show(tl, C.cmp)
    scanCompare(tl, S, COMPARE[0], 0, { at: '<' })
    reveal(tl, C.cmp, 'res', '>')
  }, 6)

  // ── C · Gröber gemessen ────────────────────────────────────────────────────
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
    tl.to(S, { uTagA: 0, uA: 0, slA: 0, dcA: 0, dim: 0, duration: 0.3 }, '<')
    deck.show(tl, C.range, '<')
    swapDyn(tl, 'cmb', cmb, '<')
    hideRows(tl, C.range, '<')
    const { l, b } = toExample(tl, lt, bt, camTarget)
    bounds(tl, l, b, C.range)
    tl.to(S, { dcA: 0, duration: 0.3 }, '>0.2')
    scanCompare(tl, S, COMPARE[cmb], cmb)
    reveal(tl, C.range, 'res', '>')
  }, 6)

  RETURN_PATH.forEach((p, j) => example(`Gröber: ${p[0]} · ${p[1]}`, p, CMB_FIRST_RETURN + j))
  MIXES.forEach((p, m) => example(`Beispiel: ${p[0]} · ${p[1]}`, p, CMB_FIRST_MIX + m, CAM_OVERVIEW))

  // ── K · Kreis: Radius variieren → Umfang umlaufend → Fläche von innen nach außen ──
  // Je Stufe (r = 3,0, dann r = 3) für den größten und den kleinsten möglichen Kreis;
  // die Zähler im Werte-Protokoll laufen mit. 2, π und der Exponent sind exakt.
  const circles = R_TEXTS.map(circleExample)
  const varyR = (tl, samples, r) => {
    tl.to(S, { rLive: 1, duration: 0.3 })
    samples.forEach((x, i) => tl.to(S, { kR: x, duration: 0.7, ease: EASE.cam }, i ? '>1.1' : '>0.1'))
    tl.to(S, { kR: r.value, duration: 0.6, ease: EASE.cam }, '>1.1')
    tl.to(S, { rLive: 0, duration: 0.3 })
  }
  const traceU = (tl, c) => {
    ;[[c.r.hi, 0], [c.r.lo, 1]].forEach(([R, i]) => {
      tl.to(S, { kR: R, rLive: 1, duration: 0.8, ease: EASE.cam }, '>0.2')
      tl.set(S, { [`tr${i}R`]: R, [`tr${i}A`]: 1, [`tr${i}D`]: 0 })
      tl.to(S, { [`tr${i}D`]: 1, duration: 2.4, ease: 'power1.inOut' })
      reveal(tl, C.umfang, i ? 'min' : 'max', '>-0.2')
    })
    tl.to(S, { kR: c.r.value, rLive: 0, duration: 0.7, ease: EASE.cam }, '>0.4')
  }
  const fillA = (tl, c) => {
    ;[[c.r.hi, 0], [c.r.lo, 1]].forEach(([R, i]) => {
      tl.to(S, { kR: R, rLive: 1, duration: 0.8, ease: EASE.cam }, '>0.2')
      tl.set(S, { [`f${i}R`]: 0, [`f${i}A`]: 1 })
      tl.to(S, { [`f${i}R`]: R, duration: 2, ease: 'power2.inOut' })
      reveal(tl, C.frange, i ? 'min' : 'max', '>-0.2')
    })
    tl.to(S, { kR: c.r.value, rLive: 0, duration: 0.7, ease: EASE.cam }, '>0.4')
  }

  step('Kreis: r = 3,0 m', tl => {
    clearHits(tl)
    dl.hide(tl, { at: '<' })
    db.hide(tl, { at: '<' })
    tl.to(S, { rA: 0, uA: 0, uTagA: 0, lA: 0, bA: 0, xA: 0, roA: 0, edA: 0, slA: 0, dcA: 0, duration: 0.6 }, '<')
    const c = circles[0]
    tl.set(S, { kA: 1, kDraw: 0, kR: c.r.value, kLo: c.r.value, kHi: c.r.value, circ: 0 })
    tl.to(S, { kDraw: 1, duration: 1.3, ease: 'power2.inOut' })
    tl.to(S, { kDisc: 1, kRadA: 1, duration: 0.6 }, '>-0.4')
    rl.show(tl, textIndex(R_TEXTS[0]), { at: '<' })
    deck.show(tl, C.circle0, '<')
    tl.to(S, { kRing: 1, kLo: c.r.lo, kHi: c.r.hi, duration: 0.8, ease: EASE.reveal }, '>0.2')
    varyR(tl, R_SAMPLES[0], c.r)
  }, 3)

  R_TEXTS.forEach((rt, j) => {
    const c = circles[j]
    if (j > 0) {
      step(`Kreis: r = ${rt} m`, tl => {
        tl.to(S, { tr0A: 0, tr1A: 0, f0A: 0, f1A: 0, slA: 0, dcA: 0, duration: 0.5 })
        tl.set(S, { tr0D: 0, tr1D: 0, f0R: 0, f1R: 0 })
        rl.show(tl, textIndex(rt), { at: '<' })
        swapDyn(tl, 'circ', j, '<')
        deck.show(tl, C.circle0, '<')
        tl.to(S, { kLo: c.r.lo, kHi: c.r.hi, duration: 1.1, ease: EASE.cam }, '<0.2')
        varyR(tl, R_SAMPLES[j], c.r)
      }, 3)
    }
    step(`Umfang bei r = ${rt} m`, tl => {
      tl.to(S, { dcA: 0, duration: 0.3 })
      hideRows(tl, C.umfang, '<')
      deck.show(tl, C.umfang, '<')
      traceU(tl, c)
      scanCompare(tl, S, COMPARE[LUPE_CIRCLE + 2 * j], LUPE_CIRCLE + 2 * j, { at: '>0.1' })
      reveal(tl, C.umfang, 'res', '>')
    }, 6)
    step(`Fläche bei r = ${rt} m`, tl => {
      tl.to(S, { dcA: 0, duration: 0.3 })
      hideRows(tl, C.frange, '<')
      deck.show(tl, C.frange, '<')
      fillA(tl, c)
      scanCompare(tl, S, COMPARE[LUPE_CIRCLE + 2 * j + 1], LUPE_CIRCLE + 2 * j + 1, { at: '>0.1' })
      reveal(tl, C.frange, 'res', '>')
    }, 6)
  })

  // ── Z · Zusammenfassung → E · Merksatz ─────────────────────────────────────
  step('Zusammenfassung', tl => {
    tl.to(S, { dim: 1, slA: 0, dcA: 0, duration: 0.8 })
    deck.show(tl, C.m_sum, '<0.2')
    revealSummary(tl, C.m_sum, SUMMARY.length, reveal)
  }, 8)

  step('Merke', tl => {
    tl.to(S, { dim: 1, slA: 0, dcA: 0, duration: 0.8 })
    deck.show(tl, C.rule, '<0.2')
  }, 8)

  return { grund, cleanup, mult: steps }
}
