'use strict'
// Szene des Kapitels „Division": flaches Objekt aus ZAHLEN (Reversibilitäts-
// Regel, Blueprint §10). Die Stoppuhren speichern nichts — ihre Anzeige folgt
// aus der Wagenposition carX; der Live-Wert v aus den Reglern ks/kt.

import { cameraKeys } from '../../../shared/js/step-kit.js'
import { stellenKeys } from '../stellen.js'
import { CAM_V_FULL, CAR_PARK } from './constants.js'

export function createSpeedScene() {
  return {
    ...cameraKeys(CAM_V_FULL),             // Kamera nur für die v-Zahlengerade
    ...stellenKeys(),                      // „Welche Stelle ist unsicher?"
    // Straße samt Tafeln (lowA blendet alles Untere aus, sobald v berechnet wird)
    lowA: 1, roadA: 0, lineD: 0, carA: 0, carX: CAR_PARK - 6,
    pnA0: 0, pnY0: 30, pnA1: 0, pnY1: 30,
    tpA0: 0, tpD0: 0, tpA1: 0, tpD1: 0,
    zA: 0, zW: 0, guideD: 0,
    lpA: 0, lpT: 0, lpD: 0, lzT: 0, lzD: 0,
    lbA: 0, wGlowA: 0, wGlowB: 0,
    // Messprotokoll: Kopfzeile, Zellen je Zeile (s, t, v), Zeile Kombination
    tbA: 0, c0s: 0, c0t: 0, c0v: 0, c1s: 0, c1t: 0, c1v: 0, c2s: 0, c2t: 0, c2v: 0, row2: 0,
    // Regler s und t (Anteil im Intervall 0…1), Zeile, Live-Wert auf der Zahlengeraden
    frA: 0, frI: 0, ks: 0.5, kt: 0.5, vlA: 0,
    ch0x: 9, ch0a: 0, ch1x: 9, ch1a: 0, ch2x: 9, ch2a: 0, ch3x: 9, ch3a: 0,
    // v-Zahlengerade, Bänder (0…1 von v_min nach v_max), Ergebnis-Marken
    vAx: 0, vTk: 0, bd0: 0, bd1: 0, bd2: 0, rm0: 0, rm1: 0, rm2: 0,
    dim: 0,
  }
}
