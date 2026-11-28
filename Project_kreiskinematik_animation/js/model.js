'use strict'
// Modell: reine, DOM-freie Funktionen (Vitest: test/kreiskinematik.model.test.js).
// Alle Vektoren als [x, y, z]; Koordinaten wie in der Bühne: rechtshändig, y oben, z zum Betrachter.
// Grundlage: grill/2026-11-28-kreiskinematik-animation.md (E8–E10, E14–E22).

// ── Vektorrechnung ───────────────────────────────────────────────────────────
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k]
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export const norm = a => Math.hypot(a[0], a[1], a[2])
export const unit = a => scale(a, 1 / norm(a))
export const lerpV = (a, b, t) => add(a, scale(sub(b, a), t))

// ── Ebenen und Kreisbahnen (E8, E9, E10) ────────────────────────────────────
// Jede Ebene: Normalenvektor n (ganzzahlig, wie in der Formelspalte), Mittelpunkt c der Kreisbahn
// (liegt auf der Achse durch den Ursprung, c ∥ n → „Ursprung auf der Drehachse“), Basis e1, e2
// in der Ebene mit e1 × e2 = n̂. Bahn: r(φ) = c + R (cos φ e1 + sin φ e2); positive Drehung um n̂.
export const R = 1
const S2 = Math.SQRT2, S3 = Math.sqrt(3)
export const PLANES = {
  P0: { n: [0, 0, 1], c: [0, 0, 0], e1: [1, 0, 0], e2: [0, 1, 0] },               // z = 0 (Szene 1)
  P1: { n: [0, 0, 1], c: [0, 0, 2], e1: [1, 0, 0], e2: [0, 1, 0] },               // z = 2
  P2: { n: [1, 0, 0], c: [2, 0, 0], e1: [0, 1, 0], e2: [0, 0, 1] },               // x = 2
  P2p: { n: [1, 0, 0], c: [3, 0, 0], e1: [0, 1, 0], e2: [0, 0, 1] },              // x = 3
  P3: { n: [1, 1, -2], c: [1, 1, -2], e1: [1 / S2, -1 / S2, 0], e2: [-1 / S3, -1 / S3, -1 / S3] }, // x + y − 2z = 6
  P4: { n: [0, 1, 0], c: [0, 2, 0], e1: [1, 0, 0], e2: [0, 0, -1] },              // y = 2
}

// rechte Seite der Normalform n · r = d  (d = n · c)
export const planeD = P => dot(P.n, P.c)
// Abstand eines Punkts von der Ebene (vorzeichenbehaftet, in Längeneinheiten)
export const planeDist = (P, r) => (dot(P.n, r) - planeD(P)) / norm(P.n)
// Punkt der Ebene in Ebenenkoordinaten (u, v) bezüglich c, e1, e2
export const planePoint = (P, u, v) => add(P.c, add(scale(P.e1, u), scale(P.e2, v)))

// Ort auf der Kreisbahn
export const circlePos = (P, phi, rad = R) =>
  add(P.c, add(scale(P.e1, rad * Math.cos(phi)), scale(P.e2, rad * Math.sin(phi))))

// ── Winkelgrößen und Kreuzprodukte (E14–E18) ────────────────────────────────
// ω und α sind vorzeichenbehaftete Beträge entlang n̂ (α < 0: antiparallel, Bremsfall E16).
export const omegaVec = (P, w) => scale(unit(P.n), w)
export const alphaVec = (P, a) => scale(unit(P.n), a)
export const vT = (P, w, r) => cross(omegaVec(P, w), r)                       // v_T = ω × r
export const aZ = (P, w, r) => cross(omegaVec(P, w), cross(omegaVec(P, w), r)) // a_Z = ω × (ω × r)
export const aT = (P, a, r) => cross(alphaVec(P, a), r)                       // a_T = α × r
export const aTotal = (P, w, a, r) => add(aT(P, a, r), aZ(P, w, r))           // a = a_T + a_Z

// gleichmäßig beschleunigte Drehung: φ(t) = φ0 + ω0 t + ½ α t², ω(t) = ω0 + α t
export const phiAt = (w0, a, t, phi0 = 0) => phi0 + w0 * t + 0.5 * a * t * t
export const omegaAt = (w0, a, t) => w0 + a * t
// Bremsfall: Zeitpunkt des Stillstands (ω = 0), nur für antiparalleles α
export const stopTime = (w0, a) => (a * w0 < 0 ? -w0 / a : Infinity)

// Periode T = 2π / ω
export const period = w => 2 * Math.PI / Math.abs(w)

// ── Spiralbahn in P3 (E20, E21) ──────────────────────────────────────────────
// r(t) = R0 + v_r t, φ(t) = ω0 t + ½ α t²; Mittelpunkt c = (1, 1, −2) auf der Achse durch den Ursprung.
export const SPIRAL = { P: 'P3', R0: 0.3, vr: 0.11, w0: 1.6, alpha: 0.18, tEnd: 7.4 }
export const spiralRadius = (t, s = SPIRAL) => s.R0 + s.vr * t
export const spiralPhi = (t, s = SPIRAL) => phiAt(s.w0, s.alpha, t)
export const spiralPos = (t, s = SPIRAL) => {
  const P = PLANES[s.P], r = spiralRadius(t, s), f = spiralPhi(t, s)
  return add(P.c, add(scale(P.e1, r * Math.cos(f)), scale(P.e2, r * Math.sin(f))))
}
// Mittelpunkt als Projektion des Startpunkts r(0) auf die ω-Achse (E21)
export const projectOnAxis = (r, n) => scale(unit(n), dot(r, unit(n)))
