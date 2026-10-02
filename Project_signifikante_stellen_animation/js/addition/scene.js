'use strict'
// Szene des Kapitels „Addition": flaches Objekt aus ZAHLEN (Reversibilitäts-Regel).
// Stablängen aL/bL sind die gezeichneten (wahren bzw. probierten) Längen; das Ende
// der Kette ergibt sich daraus — nichts wird doppelt gespeichert.

import { cameraKeys } from '../../../shared/js/step-kit.js'
import { stellenKeys } from '../stellen.js'
import { CAM_N, LANE, A_TRUE, B_TRUE } from './constants.js'

export function createAddScene() {
  return {
    ...cameraKeys(CAM_N),
    ...stellenKeys(),
    // Werkstücke: Deckkraft, Startpunkt (m), Lage (Bildschirm-y), Länge (m)
    aA: 0, aX: 0, aY: LANE.low, aL: A_TRUE, bA: 0, bX: 0.7, bY: LANE.up, bL: B_TRUE,
    // Etiketten (Deckkraft, Aufkleben 0…1)
    tgA: 0, tgAs: 0, tgB: 0, tgBs: 0,
    // Maßband: Deckkraft, Teilung 0,1 m (tdA) bzw. 1 cm (tdB), Ablesebereich A, Lupe B
    tpA: 0, tdA: 0, tdB: 0, zA: 0, lpA: 0, lzA: 0,
    // Kette: Bereich des A-Endes und des Kettenendes auf dem Band, Grenz-Beschriftung
    zAe: 0, zEnd: 0, lmA: 0, lmMin: 0, lmMax: 0,
    // Steckbrief: Kopf, Zeilen, Hervorhebung der Spalten (sign. Stellen / Nachkommastellen)
    tbA: 0, r0: 0, r1: 0, r2: 0, hiS: 0, hiN: 0, hiU: 0,
    // Auswertung: Zahlengerade, Band der Summe, Etiketten-Kandidaten
    nAx: 0, bd: 0, cdI: 0, cdA: 0, cbA: 0, cdV: 0, cl0: 0, cl1: 0, cl2: 0,
    // Rechnung in mm (drei Zeilen)
    u1: 0, u2: 0, u3: 0,
    dim: 0,
  }
}
