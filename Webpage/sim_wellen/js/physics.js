'use strict'

// ── Stateless-Berechnung (Formeln unverändert aus dem Original) ─────────────
// Superposition zweier Kreiswellen mit 1/√r-Amplitudendämpfung (physikalisch
// korrekt für zweidimensionale Energieausbreitung) + Kausalitäts-Cutoff
// (Wellenfront erreicht einen Punkt erst nach endlicher Ausbreitungszeit).

import { MIN_DIST, FREQ } from './constants.js'

export function waveSpeed(lambda) { return lambda * FREQ }

export function causalRadius(lambda, time) { return waveSpeed(lambda) * time }

export function amplitude(r) { return 1.0 / Math.sqrt(Math.max(MIN_DIST, r)) }

// Abstand des Punkts (x,y) [cm, Ursprung = Mitte] zu Quelle 1/2 (auf der
// x-Achse bei ∓d/2).
export function distToSource1(x, y, d) { return Math.hypot(x - (-d / 2), y) }
export function distToSource2(x, y, d) { return Math.hypot(x - (d / 2), y) }

// Momentane Auslenkung einer Quelle am Punkt im Abstand r; 0 außerhalb des
// bereits erreichten Wellenfront-Radius (maxDist = Infinity → kein Cutoff,
// z. B. im Schirm-Graph, der die eingeschwungene Momentaufnahme zeigt).
export function waveContribution(r, k, omegaT, phase, maxDist = Infinity) {
  if (r > maxDist) return 0
  return amplitude(r) * Math.sin(k * r - omegaT + phase)
}

// Zeitgemittelte Interferenz-Intensität I = A1²+A2²+2·A1·A2·cos(Δφ). Mit
// Kausalitäts-Cutoff pro Quelle (nur im Wellenfeld-Modus relevant — der
// Schirm-Graph zeigt die eingeschwungene Verteilung, maxDist=Infinity).
export function computeIntensity(r1, r2, k, phaseRad, maxDist1 = Infinity, maxDist2 = Infinity) {
  const active1 = r1 <= maxDist1
  const active2 = r2 <= maxDist2
  const A1 = amplitude(r1), A2 = amplitude(r2)
  if (active1 && active2) {
    const delta = k * (r2 - r1) + phaseRad
    return A1 * A1 + A2 * A2 + 2 * A1 * A2 * Math.cos(delta)
  }
  if (active1) return A1 * A1
  if (active2) return A2 * A2
  return 0
}

// Phasendifferenz Δφ am Detektor (rad + auf [0,360) normalisierte Grad).
export function phaseDifference(ds, lambda, phaseDeg) {
  const k = 2 * Math.PI / lambda
  const phi0 = phaseDeg * Math.PI / 180
  const dPhi = k * ds + phi0
  let dPhiDeg = (dPhi * 180 / Math.PI) % 360
  if (dPhiDeg < 0) dPhiDeg += 360
  return { dPhi, dPhiDeg }
}

// Klassifikation konstruktiv/destruktiv/intermediär aus cos(Δφ).
export function interferenceType(cosVal) {
  if (cosVal > 0.9) return { label: 'Konstruktiv (Max)', colorVar: '--constructive' }
  if (cosVal < -0.9) return { label: 'Destruktiv (Min)', colorVar: '--destructive' }
  return { label: 'Intermediär', colorVar: '--text2' }
}

export function resultantAmplitude(A1, A2, cosVal) {
  return Math.sqrt(A1 * A1 + A2 * A2 + 2 * A1 * A2 * cosVal)
}

// Hyperbel-Parameter (a,b) je Knotenlinien-Ast (destruktive Interferenz,
// Fokuspunkte = die beiden Quellen bei x=∓d/2). targetDs = geforderter
// Wegunterschied für Minimum n; a=targetDs/2, c=d/2, b=√(c²−a²). Äste mit
// |targetDs|≥d sind geometrisch nicht erreichbar (a≥c) und werden ausgelassen.
export function nodalBranches(d, lambda, phaseDeg) {
  const phaseShiftLen = (phaseDeg / 360) * lambda
  const maxN = Math.floor(d / lambda + 1)
  const branches = []
  for (let n = -maxN; n <= maxN; n++) {
    const targetDs = (n + 0.5) * lambda - phaseShiftLen
    if (Math.abs(targetDs) >= d * 0.99) continue
    const a = targetDs / 2
    const c = d / 2
    const b = Math.sqrt(c * c - a * a)
    branches.push({ a, b, sign: Math.sign(targetDs) })
  }
  return branches
}

// x(y) auf einem Hyperbel-Ast (Ursprung = Mitte zwischen den Quellen).
export function nodalBranchX(branch, yCm) {
  const term = 1 + (yCm * yCm) / (branch.b * branch.b)
  return -branch.sign * Math.abs(branch.a) * Math.sqrt(term)
}

export function clampDetector(x, y, maxAbs) {
  return {
    x: Math.max(-maxAbs, Math.min(maxAbs, x)),
    y: Math.max(-maxAbs, Math.min(maxAbs, y)),
  }
}
