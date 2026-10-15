'use strict'
// Zustand. Die Szene ist ein flaches Objekt aus ZAHLEN — GSAP tweent sie,
// render.js liest sie. Texte der Bühne werden aus Zahlen berechnet, damit jeder
// Schritt exakt rückwärts abspielbar ist. Die Messwerte eines Durchlaufs liegen
// unveränderlich in store.data (Seed im URL-Hash, → model.js).

import { cameraKeys } from '../../shared/js/step-kit.js'
import { VIEW, AXIS_FRAC, START_WIDTH, CENTER, STACK_DIST } from './constants.js'
import { drawValues, analyse, parseSeed, stackRows } from './model.js'

export const store = { presenter: null, scene: null, seed: 0, data: null, rows: [] }

export const START = { view: VIEW, cx: CENTER, w: START_WIDTH }
START.cy = (0.5 - AXIS_FRAC) * START_WIDTH * (VIEW.vB - VIEW.vT) / (VIEW.vR - VIEW.vL)

// Neuer Durchlauf: Seed aus der Adresse (?s=123) oder zufällig
export function initData(forceNew = false) {
  let seed = forceNew ? null : parseSeed(location.search)
  if (seed == null) seed = Math.floor(Math.random() * 1e9)
  store.seed = seed
  const u = new URL(location.href)
  u.searchParams.set('s', String(seed))
  history.replaceState(null, '', u)
  store.data = analyse(drawValues(seed))
  store.rows = stackRows(store.data.values, STACK_DIST)
}

export function createScene() {
  const S = {
    ...cameraKeys(START),
    axisDraw: 0, ticks: 0,
    tv: 0, tvF: 1,               // „wahrer Wert“: Deckkraft, Auffälligkeit (1 = kräftig)
    nl: 1,                       // Nummern in den Punkten (1) → kleine Punkte ohne Nummer (0)
    mA: 0, mx: CENTER,           // Bestwert-Marker: Deckkraft, Lage
    bA: 0, sh: 0, bE: 0,         // σ-Intervall um mx: Deckkraft, Halbbreite, Randbeschriftung
    uA: 0, uh: 0,                // u-Intervall um mx: Deckkraft, Halbbreite
    muA: 0, gapA: 0,             // Erwartungswert-Marker, Abstand zum „wahren Wert“
    tlA: 0, tIn: 0, tOut: 0,     // Strichliste: Deckkraft, Anzahl innen/außen (gebrochen = wächst)
    plA: 0, plM: 0, pn: 2,       // Diagramm: Deckkraft, Modus (0 σ(n), 1 ḡ(n)), gezeichnete Punkte
    pyLo: 0, pyHi: 2.5,
  }
  for (let i = 0; i < 40; i++) Object.assign(S, { ['d' + i]: 0, ['i' + i]: 0, ['o' + i]: 0 })
  return S
}

export const DOM = {}
export function initDOM() {
  DOM.svg = document.getElementById('stage_svg')
  DOM.transport = document.getElementById('transport')
  DOM.themeToggle = document.getElementById('theme_toggle')
  DOM.cards = {}
  document.querySelectorAll('[data-card]').forEach(el => { DOM.cards[el.dataset.card] = el })
}
