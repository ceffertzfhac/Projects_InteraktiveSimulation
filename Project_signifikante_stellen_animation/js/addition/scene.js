'use strict'
// Szene des Kapitels „Addition": flaches Objekt aus ZAHLEN (Reversibilitäts-Regel).
// Stablängen aL/bL sind die gezeichneten (wahren bzw. probierten) Längen; das Ende
// der Kette ergibt sich daraus — nichts wird doppelt gespeichert.

import { cameraKeys } from '../../../shared/js/step-kit.js'
import { CAM_N, LANE, A_TRUE, B_TRUE } from './constants.js'

export function createAddScene() {
  return {
    ...cameraKeys(CAM_N),
    // Werkstücke: Deckkraft, Startpunkt (m), Lage (Bildschirm-y), Länge (m)
    aA: 0, aX: 0, aY: LANE.up, aL: A_TRUE, bA: 0, bX: 0, bY: LANE.low, bL: B_TRUE,
    // Etiketten: Deckkraft, Anflug 0…1, Andrücken 0…1, Beschriftungs-Text
    tgA: 0, tgAf: 0, tgAs: 0, tgAc: 0, tgB: 0, tgBf: 0, tgBs: 0, tgBc: 0,
    // Maßbänder: Deckkraft, ausgerollt 0…1; Ablesebereich A; Lupe B
    tp0A: 0, tp0R: 0, tp1A: 0, tp1R: 0, zA: 0, lpA: 0, lzA: 0,
    // Taschenrechner: Deckkraft, Tippen 0…1
    calcA: 0, calcT: 0,
    // Kette: Bereich des A-Endes und des Kettenendes, Grenz-Beschriftung
    zAe: 0, zEnd: 0, lmMin: 0, lmMax: 0,
    // Steckbrief: Kopf, Zeilen, Hervorhebung der Spalten (sign. Stellen / Nachkommastellen)
    tbA: 0, r0: 0, r1: 0, r2: 0, hiS: 0, hiN: 0, hiU: 0,
    // Auswertung: Zahlengerade, Band der Summe, Etiketten-Kandidaten
    nAx: 0, bd: 0, cdI: 0, cdA: 0, cbA: 0, cdV: 0, cl0: 0, cl1: 0, cl2: 0,
    // Einheiten-Tafel (fünf Zeilen)
    u1: 0, u2: 0, u3: 0, u4: 0, u5: 0,
    dim: 0,
  }
}
