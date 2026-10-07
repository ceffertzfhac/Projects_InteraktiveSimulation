'use strict'
// Zustand. Die Szene ist ein flaches Objekt aus ZAHLEN — GSAP tweent sie,
// render.js liest sie. Texte sind Indizes in Tabellen (constants.js TEXTS,
// content.js DYN), damit jeder Schritt exakt rückwärts abspielbar ist.

import { cameraKeys, slotKeys } from '../../shared/js/step-kit.js'
import { CAM_START, RODS_MEASURE, ROD_COARSE, SIG_TOKENS, SIG_REPS, rodTint } from './constants.js'
import { stellenKeys, compareKeys } from './stellen.js'
import { timeKeys } from './zeit.js'

export const store = { presenter: null, scene: null }   // scene = Szene des aktiven Kapitels

export const HITS = 5            // Treffer-Markierungen (Zahlengerade bzw. Rechteckecke)

export function createScene() {
  const S = {
    ...cameraKeys(CAM_START),
    // Maßband: Deckkraft, Einflug von unten, ausgerollt 0…1, Teilung je Stufe (grow 0…1)
    tapeA: 0, tapeY: 60, tapeR: 0, tg0: 0, tg1: 0, tg2: 0, tg3: 0,
    // Stäbe: wahre Länge, Deckkraft, Einschub von links (Weltlänge)
    rod0: ROD_COARSE, rod0A: 0, rod0S: -1.2, rod1: RODS_MEASURE[1], rod1A: 0, rod1S: -1.2,
    rod0T: rodTint(ROD_COARSE), rod1T: rodTint(RODS_MEASURE[1]),   // Metallfarbe je Stab
    // Ablesung unter dem Maßband
    rdX: 3, rdA: 0, ...slotKeys('rd'),
    // Ablesebereich auf dem Maßband, Stabende-Markierung, „Einrast"-Pfeil je Stab
    zLo: 3, zHi: 3, zA: 0,
    mk0A: 0, mk0D: 0, mk1A: 0, mk1D: 0, sn0A: 0, sn0D: 0, sn1A: 0, sn1D: 0,
    // Zahlengerade und Teilung je Stufe (wächst gestaffelt aus der Achse)
    axisDraw: 0, ag0: 0, ag1: 0, ag2: 0, ag3: 0,
    xTicks: 0, yDraw: 0, yAlpha: 0, names: 0, nameLA: 0,   // nameLA: „l / m“ schon an der Zahlengeraden
    // Pfeil „wahre Länge" vom Stabende zur Zahlengeraden + Landeimpuls
    arD: 0, arA: 0, ping: 1,
    // Messpunkt auf der Zahlengeraden
    pA: 0, pS: 0.3, pX: 3, ...slotKeys('pl'),
    lLo: 3, lHi: 3, lA: 0, lSpan: 0, lEndA: 0, lBndA: 0, lBndD: 1,
    gLo: 3, gHi: 3, gA: 0,                 // Geister-Intervall (vorige Stufe)
    // Teil R: Breite b, Rechteck, Flächenbereich
    qA: 0, qS: 0.3, ...slotKeys('ql'),
    bLo: 2, bHi: 2, bA: 0, stripA: 0.55,
    rW: 0, rH: 0, rA: 0, aSym: 0,
    ...slotKeys('dl'), ...slotKeys('db'),
    roA: 0, roD: 5,                        // Live-Anzeige l · b an der Ecke (Deckkraft, Stellen)
    uA: 0, uTagA: 0, dim: 0, xA: 1,
    // Kreis: Deckkraft, Einzeichnen, Radius (wahr/variiert), Unsicherheitsring, Live-U
    kA: 0, kDraw: 0, kR: 3, kLo: 3, kHi: 3, kRing: 0, kRadA: 0, kDisc: 0,
    ...slotKeys('rl'),                     // Radius-Label „r = 3,0 m" → „r = 3 m"
    rLive: 0,                              // Radius-Label zeigt den aktuellen (wahren) Wert
    // Umfang umlaufend: größter (0) und kleinster (1) Kreis — Radius, Fortschritt, Deckkraft
    tr0R: 3, tr0D: 0, tr0A: 0, tr1R: 3, tr1D: 0, tr1A: 0,
    // Fläche von innen nach außen: Füllradius, Deckkraft
    f0R: 0, f0A: 0, f1R: 0, f1A: 0,
    // Unsichere letzte Ziffer: Markierung an Messwerten, ±-Maßpfeile am Intervall
    ucA: 0, ucBox: 0, pmA: 0, pmD: 0,
    // Signifikante Stellen: Zählmarken, Klammern „gesichert"/„unsicher"/„nur Stellenwert"
    sgA: 0, bg1: 0, bg2: 0, bg3: 0, bg4: 0, brS: 0, brU: 0, brZ: 0,
    // Teil R: Grenzen markieren (l_min … b_max), kleinstes/größtes Rechteck
    edA: 0, mnA: 0, mxA: 0,
    ...stellenKeys(), slBig: 0,            // Tafel „Welche Stelle ist unsicher?" (+ groß)
    ...compareKeys(),                      // Tafel „Ziffern vergleichen"
    calcA: 0, calcT: 0,                    // Taschenrechner im Rechteck (Deckkraft, Tippen 0…1)
    ...timeKeys(),                         // Grundlagen-Abschluss: Zeitmessung am Auto (zeit.js)
    // Dynamische Zahlen in Folienkarten
    dynA: 1, lvl: 0, cmb: 0, circ: 0,
  }
  // Ziffern-Token: Spalte (zentriert) und Deckkraft, Start = Schreibweise 0
  const r0 = SIG_REPS[0]
  for (const [id] of SIG_TOKENS) {
    Object.assign(S, { [`tk${id}x`]: (r0[id] ?? 0) - r0.w / 2, [`tk${id}a`]: id in r0 ? 1 : 0 })
  }
  for (let i = 0; i < HITS; i++) Object.assign(S, { [`h${i}x`]: 3, [`h${i}y`]: 2, [`h${i}a`]: 0, [`h${i}c`]: 0 })
  return S
}

export const DOM = {}
export function initDOM() {
  DOM.svg = document.getElementById('stage_svg')
  DOM.transport = document.getElementById('transport')
  DOM.themeToggle = document.getElementById('theme_toggle')
  DOM.cards = {}
  document.querySelectorAll('.slide-card').forEach(c => { DOM.cards[c.dataset.card] = c })
  DOM.dyn = [...document.querySelectorAll('[data-dyn]')]
}
