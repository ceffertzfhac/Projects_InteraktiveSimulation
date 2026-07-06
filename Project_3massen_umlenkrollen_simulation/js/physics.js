'use strict'

// Statisches Kräftegleichgewicht: zwei Rollen oben, m₁ links und m₃ rechts am
// Seil hängend, m₂ in der Mitte am gemeinsamen Seil. Die Seilwinkel ergeben sich
// analytisch aus dem Kräftedreieck (Cosinus-Satz); die Geometrie (m₂-Position
// als Schnittpunkt der beiden Seiltangenten) daraus. Keine Zeit-Animation.

import { G, PULLEY_RADIUS, PULLEY_Y } from './constants.js'

// ── Winkel aus dem Kräftedreieck (Cosinus-Satz) ───────────────────────────────
// T1 = m1·g (linkes Seil), T3 = m3·g (rechtes Seil), Fg2 = m2·g (Gewicht von m₂).
// Dreiecksungleichung muß erfüllt sein, sonst kein Gleichgewicht möglich.
function solveForAngles(m1, m2, m3) {
  const T1 = m1 * G
  const T3 = m3 * G
  const Fg2 = m2 * G
  if (T1 + T3 <= Fg2 || T1 + Fg2 <= T3 || T3 + Fg2 <= T1) return null
  const cosGamma1 = (T1 ** 2 + Fg2 ** 2 - T3 ** 2) / (2 * T1 * Fg2)
  const cosGamma3 = (T3 ** 2 + Fg2 ** 2 - T1 ** 2) / (2 * T3 * Fg2)
  if (Math.abs(cosGamma1) > 1 || Math.abs(cosGamma3) > 1) return null
  const gamma1 = Math.acos(cosGamma1)
  const gamma3 = Math.acos(cosGamma3)
  // angle1/angle3: Steigungswinkel der Seile gegen die Vertikale (Bildschirm).
  const angle1 = Math.PI / 2 + gamma1
  const angle3 = Math.PI / 2 - gamma3
  return { angle1, angle3, T1, T3, Fg2 }
}

// ── Geometrie: m₂-Position als Tangentenschnittpunkt ──────────────────────────
// Berechnet die Seil-Austrittspunkte an den Rollen (tp_L, tp_R) und die m₂-
// Position (Schnitt der beiden Seilgeraden). Bildschirm-Koordinaten (Y ↓).
function calculateGeometry(m1, m2, m3, pulleyLeftX, pulleyRightX) {
  const angles = solveForAngles(m1, m2, m3)
  if (!angles) return null
  const { angle1, angle3 } = angles
  const phiL = angle1 - Math.PI / 2
  const phiR = angle3 + Math.PI / 2
  const tpL = {
    x: pulleyLeftX + PULLEY_RADIUS * Math.cos(phiL),
    y: PULLEY_Y - PULLEY_RADIUS * Math.sin(phiL),
  }
  const tpR = {
    x: pulleyRightX + PULLEY_RADIUS * Math.cos(phiR),
    y: PULLEY_Y - PULLEY_RADIUS * Math.sin(phiR),
  }
  const m1Screen = -Math.tan(angle1)
  const m3Screen = -Math.tan(angle3)
  const c1 = tpL.y - m1Screen * tpL.x
  const c3 = tpR.y - m3Screen * tpR.x
  if (Math.abs(m1Screen - m3Screen) < 1e-9) return null // parallele Seile
  const m2X = (c3 - c1) / (m1Screen - m3Screen)
  const m2Y = m1Screen * m2X + c1
  return { m2_pos: { x: m2X, y: m2Y }, tp_L: tpL, tp_R: tpR, angle1, angle3, phi_L: phiL, phi_R: phiR }
}

// ── Hauptberechnung: Gleichgewicht + Seillängen + Angriffspunkte ──────────────
// Liefert ein Zustandsobjekt für render.js bzw. einen Fehlstatus.
//   segmentRopeLength: gesamte Seilsegmentlänge je Seite (cm → px erfolgt in ui).
export function computeEquilibrium(m1, m2, m3, pulleyLeftX, pulleyRightX, segmentRopeLengthPx) {
  const geo = calculateGeometry(m1, m2, m3, pulleyLeftX, pulleyRightX)
  if (!geo) return { status: 'no-equilibrium' }
  const { m2_pos, tp_L, tp_R, angle1, angle3, phi_L, phi_R } = geo

  // m₂ darf nicht oberhalb der Rollen liegen (Gleichgewicht nicht physikalisch).
  if (m2_pos.y < PULLEY_Y) return { status: 'no-equilibrium' }

  const exitLeft = { x: pulleyLeftX - PULLEY_RADIUS, y: PULLEY_Y }
  const exitRight = { x: pulleyRightX + PULLEY_RADIUS, y: PULLEY_Y }

  // Seillängen: Diagonalstück m₂→Rolle + Rollenbogen + herabhängendes Reststück.
  const lenLDiag = Math.hypot(m2_pos.x - tp_L.x, m2_pos.y - tp_L.y)
  const arcLenL = (Math.PI - phi_L) * PULLEY_RADIUS
  const lenHang1 = segmentRopeLengthPx - (lenLDiag + arcLenL)
  const lenRDiag = Math.hypot(m2_pos.x - tp_R.x, m2_pos.y - tp_R.y)
  const arcLenR = phi_R * PULLEY_RADIUS
  const lenHang3 = segmentRopeLengthPx - (lenRDiag + arcLenR)

  if (lenHang1 < 0 || lenHang3 < 0) return { status: 'collision' }

  const m1Attach = { x: exitLeft.x, y: exitLeft.y + lenHang1 }
  const m3Attach = { x: exitRight.x, y: exitRight.y + lenHang3 }

  const T1 = m1 * G
  const T3 = m3 * G
  const Fg2 = m2 * G
  // Seilkraft-Vektoren auf m₂ in Bildschirm-Koordinaten (Y ↓).
  const T1Vec = { x: T1 * Math.cos(angle1), y: -T1 * Math.sin(angle1) }
  const T3Vec = { x: T3 * Math.cos(angle3), y: -T3 * Math.sin(angle3) }

  return {
    status: 'ok',
    m2_pos, tp_L, tp_R, angle1, angle3, phi_L, phi_R,
    exitLeft, exitRight, m1_attach: m1Attach, m3_attach: m3Attach,
    T1, T3, Fg2, T1_vec: T1Vec, T3_vec: T3Vec,
  }
}