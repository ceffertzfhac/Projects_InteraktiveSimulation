'use strict'
// Szene des Kapitels „Addition": flaches Objekt aus ZAHLEN (Reversibilitäts-Regel).
// Stablängen aL/bL sind die gezeichneten (wahren bzw. probierten) Längen; das Ende
// der Gesamtlänge ergibt sich daraus — nichts wird doppelt gespeichert.

import { cameraKeys } from '../../../shared/js/step-kit.js'
import { compareKeys } from '../stellen.js'
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
    // hintereinander: Bereich des A-Endes und des Gesamt-Endes, Grenz-Beschriftung
    zAe: 0, zEnd: 0, lmMin: 0, lmMax: 0,
    // Steckbrief: Kopf, Zeilen, Hervorhebung der Spalten (sign. Stellen / Nachkommastellen)
    tbA: 0, r0: 0, r1: 0, r2: 0, hiS: 0, hiN: 0, hiU: 0,
    // Auswertung: Zahlengerade mit Band der Summe, Vergleichstafel
    nAx: 0, bd: 0, ...compareKeys(),
    // Einheiten-Tafel: sieben Zeilen; Rechenzeilen 3–6 in drei Teilen (Summanden, Rechner, Ergebnis)
    u1: 0, u2: 0, u3: 0, u4: 0, u5: 0, u6: 0, u7: 0,
    u3b: 0, u4b: 0, u5b: 0, u6b: 0, u3c: 0, u4c: 0, u5c: 0, u6c: 0,
    dim: 0,
  }
}
