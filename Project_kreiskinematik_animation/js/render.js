'use strict'
// Rendering: liest NUR die Szene. initStage() baut die 3D-Objekte einmal (step-3d.js),
// renderScene(S) setzt Lage, Länge, Deckkraft und Farbe — keine Logik, keine Zeit.

import { createStage3D } from '../../shared/js/step-3d.js'
import { AXIS, PLANE_SIZE, N_LEN, VECTORS } from './constants.js'
import { PLANES, planePoint, unit, add, scale, sub } from './model.js'
import { store } from './state.js'

const E = {}
const P3 = PLANES.P3
const AX = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]

export function initStage(DOM) {
  const st = store.stage3d = createStage3D({ container: DOM.stage3d })
  E.axes = AX.map(() => st.arrow({ radius: 0.016, head: 0.2, headR: 0.06, order: 0 }))
  E.ticks = AX.flatMap(d => AXIS.ticks.map(k => ({ pos: scale(d, k), s: st.sphere({ r: 0.035, order: 0 }) })))
  E.plane = st.plane()
  E.vec = { n: st.arrow(), r: st.arrow() }
  E.pt = st.sphere({ r: 0.075 })
  E.lab = Object.fromEntries(Object.entries(DOM.labels).map(([k, el]) => [k, st.label(el)]))
  E.legend = DOM.legend
}

// Beschriftung knapp hinter der Pfeilspitze, in Pfeilrichtung
const beyond = (from, to, d = 0.32) => add(to, scale(unit(sub(to, from)), d))

export function renderScene(S) {
  const st = store.stage3d, pal = st.palette
  st.setCamera({ az: S.camAz, el: S.camEl, d: S.camD, tx: S.camTx, ty: S.camTy, tz: S.camTz })

  // Achsen wachsen vom Ursprung in beide Richtungen
  const axC = pal.get('--c-axis')
  AX.forEach((d, i) => {
    const a = scale(d, -AXIS.neg * S.axDraw), b = scale(d, AXIS.pos * S.axDraw)
    E.axes[i].set(a, b, { opacity: S.axDraw > 0 ? 1 : 0, color: axC })
  })
  E.ticks.forEach(({ pos, s }) => {
    const k = Math.abs(pos[0] + pos[1] + pos[2])
    const show = Math.max(0, Math.min(1, (S.axDraw * AXIS.pos - k) / 0.4))
    s.set(pos, { opacity: show, color: axC })
  })
  ;['x', 'y', 'z'].forEach((k, i) => E.lab[k]?.set(scale(AX[i], AXIS.pos * S.axDraw + 0.3), { opacity: S.axLab }))

  // Ebenenstück P3
  E.plane.set({ c: P3.c, e1: P3.e1, e2: P3.e2, size: PLANE_SIZE, opacity: S.plA,
    color: pal.get('--c-plane'), edgeColor: pal.get('--c-plane-edge') })

  // Normalenvektor n an r0 = Mittelpunkt; Farbe Grau → Mint (ω)
  const nTo = add(P3.c, scale(unit(P3.n), N_LEN * S.nG))
  const nCol = pal.mix(VECTORS.n, VECTORS.w, S.nMix)
  E.vec.n.set(P3.c, nTo, { opacity: S.nA, color: nCol })
  E.lab.n?.set(beyond(P3.c, nTo), { opacity: S.nLab * S.nA * (1 - S.nMix) })
  E.lab.w?.set(beyond(P3.c, nTo), { opacity: S.wLab * S.nA })

  // Ortsvektor r vom Ursprung zu einem Punkt der Ebene
  const rTip = planePoint(P3, S.rU, S.rV), rTo = scale(rTip, S.rG)
  E.vec.r.set([0, 0, 0], rTo, { opacity: S.rA, color: pal.get(VECTORS.r) })
  E.pt.set(rTip, { opacity: S.ptA, color: pal.get('--c-point') })
  E.lab.r?.set(beyond([0, 0, 0], rTo, 0.3), { opacity: S.rLab * S.rA })

  // Legende: nur Vektoren, deren Beschriftung schon an die Legende übergeben hat
  for (const [k, el] of Object.entries(E.legend)) {
    const a = S[k + 'Leg'] ?? 0
    el.style.display = a > 0.002 ? '' : 'none'
    el.style.opacity = a
    const sw = el.querySelector('.leg-sw')
    if (sw) sw.style.background = (k === 'n' ? nCol : pal.get(VECTORS[k])).getStyle()
  }
  const box = Object.values(E.legend)[0]?.parentElement
  if (box) box.style.visibility = Object.keys(E.legend).some(k => (S[k + 'Leg'] ?? 0) > 0.002) ? '' : 'hidden'
  st.render()
}

