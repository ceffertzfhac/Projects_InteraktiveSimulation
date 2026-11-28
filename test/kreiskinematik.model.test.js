// Modell-Test: Kreiskinematik (Schritt-Animation, 3D) — Ebenen, Kreuzprodukte, Spirale. → BACKLOG FKI4.
import { test, expect } from 'vitest'
import {
  add, sub, scale, dot, cross, norm, unit, PLANES, R, planeD, planeDist, planePoint, circlePos,
  omegaVec, vT, aZ, aT, aTotal, phiAt, omegaAt, stopTime, period,
  SPIRAL, spiralPos, spiralRadius, projectOnAxis,
} from '../Project_kreiskinematik_animation/js/model.js'

const close = (a, b, d = 9) => a.forEach((x, i) => expect(x).toBeCloseTo(b[i], d))
const H = 1e-4
// Ableitungen per zentralem Differenzenquotienten
const d1 = (f, t) => scale(sub(f(t + H), f(t - H)), 1 / (2 * H))
const d2 = (f, t) => scale(add(sub(f(t + H), scale(f(t), 2)), f(t - H)), 1 / (H * H))

test('Ebenengleichungen wie im Drehbuch (E9, E10)', () => {
  expect(planeD(PLANES.P0)).toBe(0)
  expect(planeD(PLANES.P1)).toBe(2)
  expect(planeD(PLANES.P2)).toBe(2)
  expect(planeD(PLANES.P2p)).toBe(3)
  expect(planeD(PLANES.P3)).toBe(6)            // x + y − 2z = 6
  expect(planeD(PLANES.P4)).toBe(2)
  expect(planeDist(PLANES.P3, [1, 1, 1])).toBeCloseTo(-6 / Math.sqrt(6), 12) // Skript-Punkt (1,1,1) liegt in x+y−2z=0
})

test('Basis je Ebene orthonormal, rechtshändig (e1 × e2 = n̂), Mittelpunkt auf der Achse durch den Ursprung', () => {
  for (const [k, P] of Object.entries(PLANES)) {
    expect(norm(P.e1), k).toBeCloseTo(1, 12)
    expect(norm(P.e2), k).toBeCloseTo(1, 12)
    expect(dot(P.e1, P.e2), k).toBeCloseTo(0, 12)
    close(cross(P.e1, P.e2), unit(P.n), 12)
    expect(norm(cross(P.c, P.n)), k).toBeCloseTo(0, 12)   // c ∥ n (E8)
  }
})

test('Punkte der Ebene und der Kreisbahn erfüllen die Normalform (r − r0) · n = 0', () => {
  for (const P of Object.values(PLANES)) {
    for (const [u, v] of [[0.3, -1.2], [2, 0.7], [-1.1, 1.9]]) expect(dot(sub(planePoint(P, u, v), P.c), P.n)).toBeCloseTo(0, 12)
    for (const f of [0, 1, 2.5, 4]) {
      const r = circlePos(P, f)
      expect(planeDist(P, r)).toBeCloseTo(0, 12)
      expect(norm(sub(r, P.c))).toBeCloseTo(R, 12)
    }
  }
})

test('Normalenvektor strecken, stauchen, umdrehen: Ebene bleibt (Szene 1)', () => {
  const P = PLANES.P3, r = planePoint(P, 0.8, -0.4)
  for (const k of [0.5, 2, -1, -0.3]) expect(dot(sub(r, P.c), scale(P.n, k))).toBeCloseTo(0, 12)
})

test('v_T = ω × r ist die Ableitung des Orts, |v_T| = ω R (E14)', () => {
  const w = 1.7
  for (const P of Object.values(PLANES)) for (const t of [0.2, 1.3]) {
    const pos = s => circlePos(P, w * s)
    const r = pos(t), v = vT(P, w, r)
    close(v, d1(pos, t), 6)
    expect(norm(v)).toBeCloseTo(w * R, 9)
  }
})

test('komponentenweise an P4: (0, ω, 0) × (R cos φ, 2, −R sin φ) — die 2 fällt heraus (E14)', () => {
  const w = 1.3, f = 0.9, r = circlePos(PLANES.P4, f)
  close(r, [R * Math.cos(f), 2, -R * Math.sin(f)], 12)
  close(cross([0, w, 0], r), [-w * R * Math.sin(f), 0, -w * R * Math.cos(f)], 12)
  close(vT(PLANES.P4, w, r), [-w * R * Math.sin(f), 0, -w * R * Math.cos(f)], 12)
})

test('a_Z = ω × (ω × r) = −ω² (r − r_M), Betrag ω² R, = zweite Ableitung bei konstantem ω (E15)', () => {
  const w = 1.4
  for (const P of Object.values(PLANES)) {
    const pos = s => circlePos(P, w * s), r = pos(0.7), a = aZ(P, w, r)
    close(a, scale(sub(r, P.c), -w * w), 9)
    expect(norm(a)).toBeCloseTo(w * w * R, 9)
    close(a, d2(pos, 0.7), 4)
  }
  const f = 0.9, r = circlePos(PLANES.P4, f)
  close(aZ(PLANES.P4, w, r), [-w * w * R * Math.cos(f), 0, w * w * R * Math.sin(f)], 12)
})

test('a_T = α × r ∥ v_T, a = a_T + a_Z = zweite Ableitung bei konstantem α (E17, E18)', () => {
  const w0 = 0.8
  for (const al of [0.6, -0.5]) for (const P of Object.values(PLANES)) {
    const pos = s => circlePos(P, phiAt(w0, al, s)), t = 1.1, r = pos(t), w = omegaAt(w0, al, t)
    const at = aT(P, al, r), v = vT(P, w, r)
    expect(norm(cross(at, v))).toBeCloseTo(0, 9)
    expect(Math.sign(dot(at, v))).toBe(Math.sign(al * w))
    expect(norm(at)).toBeCloseTo(Math.abs(al) * R, 9)
    close(aTotal(P, w, al, r), d2(pos, t), 4)
  }
  const f = 0.9, al = -0.4, r = circlePos(PLANES.P4, f)
  close(aT(PLANES.P4, al, r), [-al * R * Math.sin(f), 0, -al * R * Math.cos(f)], 12)
})

test('Bremsfall mit Umkehr: ω schrumpft auf null und klappt um (E16)', () => {
  const w0 = 2, al = -0.8, ts = stopTime(w0, al)
  expect(ts).toBeCloseTo(2.5, 12)
  expect(omegaAt(w0, al, ts)).toBeCloseTo(0, 12)
  expect(omegaAt(w0, al, ts + 1)).toBeLessThan(0)
  expect(stopTime(w0, 0.8)).toBe(Infinity)
  close(omegaVec(PLANES.P4, omegaAt(w0, al, ts + 1)), [0, -0.8, 0], 12)
})

test('Periode und Länge von ω: ¼ T ↔ 4 ω, 4 T ↔ ¼ ω (Szene 3)', () => {
  const w = 1.2
  expect(period(4 * w)).toBeCloseTo(period(w) / 4, 12)
  expect(period(w / 4)).toBeCloseTo(4 * period(w), 12)
})

test('Spirale liegt in P3, Radius wächst linear, Mittelpunkt = Projektion von r(0) (E20, E21)', () => {
  const P = PLANES[SPIRAL.P]
  for (const t of [0, 1.5, SPIRAL.tEnd]) {
    const r = spiralPos(t)
    expect(planeDist(P, r)).toBeCloseTo(0, 12)
    expect(norm(sub(r, P.c))).toBeCloseTo(spiralRadius(t), 12)
  }
  close(projectOnAxis(spiralPos(0), P.n), P.c, 12)
  close(spiralPos(0), add(P.c, scale(P.e1, SPIRAL.R0)), 12)
})
