'use strict'
// Szene des Kapitels „Division": flaches Objekt aus ZAHLEN (Reversibilitäts-
// Regel, Blueprint §10). Die Stoppuhren speichern nichts — ihre Anzeige folgt
// aus der Wagenposition carX, daher läuft auch das Zurückspulen exakt.

import { cameraKeys } from '../../../shared/js/step-kit.js'
import { CAM_V_FULL, CAR_PARK } from './constants.js'

export function createSpeedScene() {
  return {
    ...cameraKeys(CAM_V_FULL),             // Kamera nur für die v-Achse
    // Straße, Start-/Ziellinie, Wagen (Front bei carX Metern)
    roadA: 0, lineD: 0, carA: 0, carX: CAR_PARK - 6,
    // Ausrüstungs-Tafeln (Deckkraft, Einflug von unten)
    pnA0: 0, pnY0: 30, pnA1: 0, pnY1: 30,
    // Maßbänder A (1 m) und B (cm): Deckkraft, Ausrollen 0…1
    tpA0: 0, tpD0: 0, tpA1: 0, tpD1: 0,
    // Ablesebereich auf Band A, Hilfslinie Ziel → Bänder
    zA: 0, zW: 0, guideD: 0,
    // Lupe: Deckkraft, Inhalt Maßband (lpT) bzw. Zifferblatt (lpD), Zonen darin
    lpA: 0, lpT: 0, lpD: 0, lzT: 0, lzD: 0,
    // Lichtschranken
    lbA: 0,
    // Hervorhebung der Uhren nach dem Ablesen
    wGlowA: 0, wGlowB: 0,
    // Messprotokoll: Kopfzeile, Zellen je Zeile (s, t, v), Zeile A+B
    tbA: 0, c0s: 0, c0t: 0, c0v: 0, c1s: 0, c1t: 0, c1v: 0, c2s: 0, c2t: 0, c2v: 0, row2: 0,
    // v-Achse und Bänder (Wachsen 0…1 vom Messwert nach außen), wahrer Wert
    vAx: 0, vTk: 0, bd0: 0, bd1: 0, bd2: 0, vTrue: 0,
    dim: 0,
  }
}
