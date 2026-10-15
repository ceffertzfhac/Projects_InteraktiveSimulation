'use strict'
// Rendering: liest NUR die Szene (Zahlen) und die unveränderlichen Messwerte aus store.data;
// schreibt SVG-Attribute. Keine Logik, keine Zeit. initStage() baut die Elemente einmal,
// renderScene() läuft pro Frame. Beschriftungen mit Zahlen entstehen aus Szenenwerten.

import { svgEl, viewOf, createAxis, createPool, clamp, lerp } from '../../shared/js/step-kit.js'
import { fmt } from '../../shared/js/format.js'
import { AXIS_Y, DOT, PLOT, VIEW } from './constants.js'
import { G_TRUE, MU } from './model.js'
import { store } from './state.js'

const E = {}
const NS_I = (parent, txt, attrs = {}) => {
  const t = svgEl('text', attrs, parent)
  if (txt) t.textContent = txt
  return t
}
const setText = (el, s) => { if (el._s !== s) { el._s = s; el.textContent = s } }

// Kursives Symbol + optional tiefgestellter Index (Größen kursiv, → CLAUDE.md Typografie)
function sym(el, base, sub, tail = '') {
  el.textContent = ''
  const i = svgEl('tspan', { 'font-style': 'italic' }, el)
  i.textContent = base
  if (sub) {
    const t = svgEl('tspan', { 'font-style': 'italic', 'baseline-shift': 'sub', 'font-size': '72%' }, el)
    t.textContent = sub
  }
  if (tail) svgEl('tspan', {}, el).textContent = tail
}

export function initStage(svg) {
  const defs = svgEl('defs', {}, svg)
  const cv = svgEl('clipPath', { id: 'clip_view' }, defs)
  svgEl('rect', { x: VIEW.vL - 16, y: 0, width: VIEW.vR - VIEW.vL + 38, height: 675 }, cv)
  const cp = svgEl('clipPath', { id: 'clip_plot' }, defs)
  svgEl('rect', { x: PLOT.x0, y: PLOT.y0 - 10, width: PLOT.x1 - PLOT.x0 + 14, height: PLOT.y1 - PLOT.y0 + 20 }, cp)

  E.plot = initPlot(svg)
  const view = svgEl('g', { 'clip-path': 'url(#clip_view)' }, svg)
  E.band = svgEl('g', {}, view)
  E.bandRect = svgEl('rect', { class: 'band-sigma' }, E.band)
  E.edgeL = svgEl('line', { class: 'band-edge' }, E.band)
  E.edgeR = svgEl('line', { class: 'band-edge' }, E.band)
  E.ub = svgEl('g', {}, view)
  E.ubRect = svgEl('rect', { class: 'band-u' }, E.ub)
  E.trueG = svgEl('g', {}, view)
  E.trueBar = svgEl('rect', { class: 'true-bar', width: 8, rx: 3 }, E.trueG)
  E.muG = svgEl('g', {}, view)
  E.muRod = svgEl('line', { class: 'mu-rod' }, E.muG)
  E.gapG = svgEl('g', {}, view)
  E.gapLine = svgEl('line', { class: 'gap-line' }, E.gapG)
  E.gapTL = svgEl('line', { class: 'gap-line' }, E.gapG)
  E.gapTR = svgEl('line', { class: 'gap-line' }, E.gapG)

  E.axis = createAxis(svg, 'x')
  E.axName = NS_I(svg, '', { class: 'plot-name', 'text-anchor': 'end' })
  sym(E.axName, 'g', '', ' / (m/s²)')

  E.dots = svgEl('g', { 'clip-path': 'url(#clip_view)' }, svg)
  E.dot = []
  for (let i = 0; i < 100; i++) {
    const g = svgEl('g', {}, E.dots)
    const mark = svgEl('line', { class: 'dot-mark' }, g)
    const base = svgEl('circle', { class: 'dot' }, g)
    const cin = svgEl('circle', { class: 'dot dot-in' }, g)
    const cout = svgEl('circle', { class: 'dot dot-out' }, g)
    let num = null
    if (i < 10) {
      num = NS_I(g, '', { class: 'dot-num' })
      sym(num, 'g', String(i + 1))
    }
    E.dot.push({ g, mark, base, cin, cout, num })
  }

  const top = svgEl('g', { 'clip-path': 'url(#clip_view)' }, svg)
  E.mean = svgEl('g', {}, top)
  E.meanRod = svgEl('line', { class: 'mean-rod' }, E.mean)
  E.meanLab = NS_I(E.mean, '', { class: 'mean-label' })
  E.edgeLabs = [0, 1].map(() => NS_I(top, '', { class: 'edge-label' }))
  E.muLab = NS_I(top, '', { class: 'mu-label' })
  sym(E.muLab, 'g', 'E', ' = ' + fmt(MU, 2))
  E.gapLab = NS_I(top, 'systematischer Fehler', { class: 'gap-label' })
  E.trueLab = [0, 1].map(() => NS_I(top, '', { class: 'true-label' }))
  E.trueLab[0].textContent = '„wahrer Wert“'
  E.trueLab[1].textContent = fmt(G_TRUE, 2) + ' m/s²'

  E.val = NS_I(top, '', { class: 'val-callout' })
  sym(E.val, 'g', '1', ' = ' + fmt(store.data.values[0], 2) + ' m/s²')
  E.tally = initTally(svg)
  return svg
}

// ── Strichliste ──────────────────────────────────────────────────────────────
function initTally(svg) {
  const g = svgEl('g', {}, svg)
  const T = { g, cols: [], strokes: [[], []], heads: [], nums: [] }
  const cx = [235, 565]
  const names = ['innerhalb', 'außerhalb']
  for (let c = 0; c < 2; c++) {
    T.heads.push(NS_I(g, names[c], { class: 'tally-head', x: cx[c] - 40, y: 468 }))
    T.nums.push(NS_I(g, '', { class: 'tally-num', x: cx[c] + 70, y: 556, fill: c ? 'var(--c-out)' : 'var(--c-in)' }))
    for (let j = 0; j < 10; j++) {
      const grp = Math.floor(j / 5), k = j % 5
      const x0 = cx[c] - 85 + grp * 66
      const el = svgEl('line', { class: 'tally-stroke ' + (c ? 'tally-out' : 'tally-in') }, g)
      if (k < 4) { el.setAttribute('x1', x0 + k * 12); el.setAttribute('x2', x0 + k * 12); el.setAttribute('y1', 500); el.setAttribute('y2', 548) }
      else { el.setAttribute('x1', x0 - 6); el.setAttribute('x2', x0 + 46); el.setAttribute('y1', 544); el.setAttribute('y2', 504) }
      T.strokes[c].push(el)
    }
  }
  return T
}

// ── Diagramm σ_g(n) / ḡ(n) ───────────────────────────────────────────────────
function initPlot(svg) {
  const g = svgEl('g', {}, svg)
  const P = { g }
  P.grid = svgEl('g', {}, g)
  P.ticksX = createPool(g, () => NS_I(null, '', { class: 'plot-tick', 'text-anchor': 'middle' }))
  P.ticksY = createPool(g, () => NS_I(null, '', { class: 'plot-tick', 'text-anchor': 'end', 'dominant-baseline': 'middle' }))
  P.gridPool = createPool(P.grid, () => svgEl('line', { class: 'plot-grid' }))
  const xe = PLOT.x1 + 24, ye = PLOT.y0 - 10
  svgEl('line', { class: 'plot-axis', x1: PLOT.x0, x2: xe, y1: PLOT.y1, y2: PLOT.y1 }, g)
  svgEl('line', { class: 'plot-axis', x1: PLOT.x0, x2: PLOT.x0, y1: PLOT.y1, y2: ye }, g)
  svgEl('path', { class: 'axis-head', d: `M${xe - 11} ${PLOT.y1 - 5.5}L${xe} ${PLOT.y1}L${xe - 11} ${PLOT.y1 + 5.5}` }, g)
  svgEl('path', { class: 'axis-head', d: `M${PLOT.x0 - 5.5} ${ye + 11}L${PLOT.x0} ${ye}L${PLOT.x0 + 5.5} ${ye + 11}` }, g)
  P.nameX = NS_I(g, 'n', { class: 'plot-name', x: PLOT.x1 + 34, y: PLOT.y1 + 6, 'font-style': 'italic' })
  P.nameY = [0, 1].map(() => NS_I(g, '', { class: 'plot-name', x: PLOT.x0 - 8, y: PLOT.y0 - 24, 'text-anchor': 'start' }))
  sym(P.nameY[0], 'σ', 'g', ' / (m/s²)')
  sym(P.nameY[1], 'ḡ', '', ' / (m/s²)')
  const c = svgEl('g', { 'clip-path': 'url(#clip_plot)' }, g)
  P.bandPoly = svgEl('polygon', { class: 'plot-band' }, c)
  P.trueLine = svgEl('line', { stroke: 'var(--c-true)', 'stroke-width': 2.5, 'stroke-opacity': .55 }, c)
  P.muLine = svgEl('line', { stroke: 'var(--c-mu)', 'stroke-width': 2.5, 'stroke-dasharray': '3 6', 'stroke-linecap': 'round' }, c)
  P.line = svgEl('polyline', { class: 'plot-line' }, c)
  P.pt = svgEl('circle', { class: 'plot-pt', r: 5 }, c)
  // Legende (nur im Modus ḡ(n)): Band, Linien, Erwartungswert, „wahrer Wert“
  P.leg = svgEl('g', {}, g)
  let lx = PLOT.x0 + 108
  const ly = PLOT.y0 - 24
  const W = 7.0                      // geschätzte Zeichenbreite bei 15 px
  const item = (kind, chars, build) => {
    if (kind === 'band') svgEl('rect', { class: 'plot-band', x: lx, y: ly - 13, width: 24, height: 15, rx: 3 }, P.leg)
    else svgEl('line', { x1: lx, x2: lx + 24, y1: ly - 5, y2: ly - 5, stroke: kind === 'mu' ? 'var(--c-mu)' : 'var(--c-true)',
      'stroke-width': 3, 'stroke-dasharray': kind === 'mu' ? '3 5' : 'none', 'stroke-linecap': 'round' }, P.leg)
    build(NS_I(P.leg, '', { class: 'plot-leg', x: lx + 30, y: ly }))
    lx += 30 + chars * W + 10
  }
  item('band', 26, t => {
    sym(t, 'ḡ', '', ' ± ')
    svgEl('tspan', { 'font-style': 'italic' }, t).textContent = 'μ'
    svgEl('tspan', { 'font-style': 'italic', 'baseline-shift': 'sub', 'font-size': '72%' }, t).textContent = 'g'
    svgEl('tspan', {}, t).textContent = ' (Messunsicherheit)'
  })
  item('mu', 20, t => sym(t, 'g', 'E', ' (Erwartungswert)'))
  item('true', 13, t => { t.textContent = '„wahrer Wert“' })
  return P
}

function niceStep(range, divs) {
  const raw = range / divs, b = 10 ** Math.floor(Math.log10(raw))
  return [1, 2, 5, 10].map(m => m * b).find(s => s >= raw) ?? b * 10
}

function renderPlot(S) {
  const P = E.plot
  P.g.style.display = S.plA <= 0.002 ? 'none' : ''
  if (S.plA <= 0.002) return
  P.g.style.opacity = S.plA
  const mode1 = S.plM
  const yLo = lerp(0, S.pyLo, mode1), yHi = lerp(2.5, S.pyHi, mode1)
  const lo = mode1 > 0.5 ? S.pyLo : 0, hi = mode1 > 0.5 ? S.pyHi : 2.5
  const sx = n => PLOT.x0 + n / S.px * (PLOT.x1 - PLOT.x0)
  const sy = y => PLOT.y1 - (y - yLo) / (yHi - yLo) * (PLOT.y1 - PLOT.y0)
  P.nameY[0].style.opacity = 1 - mode1
  P.nameY[1].style.opacity = mode1
  // Teilungen
  const stepY = niceStep(hi - lo, 4)
  P.ticksX.begin(); P.ticksY.begin(); P.gridPool.begin()
  const stepX = S.px <= 24 ? 5 : S.px <= 60 ? 10 : 20
  for (let n = 0; n <= S.px + 1e-9; n += stepX) {
    const t = P.ticksX.next(); t.setAttribute('x', sx(n)); t.setAttribute('y', PLOT.y1 + 24); setText(t, String(n))
  }
  for (let v = Math.ceil((lo - 1e-9) / stepY) * stepY; v <= hi + 1e-9; v += stepY) {
    const y = sy(v)
    if (y > PLOT.y1 + 1 || y < PLOT.y0 - 1) continue
    const t = P.ticksY.next(); t.setAttribute('x', PLOT.x0 - 10); t.setAttribute('y', y)
    setText(t, fmt(v, stepY < 0.1 ? 2 : stepY < 1 ? 1 : 0))
    const l = P.gridPool.next(); l.setAttribute('x1', PLOT.x0); l.setAttribute('x2', PLOT.x1)
    l.setAttribute('y1', y); l.setAttribute('y2', y)
  }
  P.ticksX.end(); P.ticksY.end(); P.gridPool.end()

  const ser = store.data.series
  const last = Math.floor(S.pn), frac = S.pn - last
  const pts = []
  const val = (r, m) => (m > 0.5 ? r.mean : r.sigma)
  for (const r of ser) { if (r.n > last) break; pts.push([sx(r.n), sy(val(r, mode1))]) }
  const nxt = ser[last - 1]   // Punkt n = last + 1 (Index n−2 + 1)
  if (nxt && frac > 0 && pts.length) {
    const p0 = ser[last - 2]
    if (p0) pts.push([lerp(sx(p0.n), sx(nxt.n), frac), lerp(sy(val(p0, mode1)), sy(val(nxt, mode1)), frac)])
  }
  P.line.setAttribute('points', pts.map(p => p.join(',')).join(' '))
  const tip = pts[pts.length - 1]
  P.pt.style.display = tip ? '' : 'none'
  if (tip) { P.pt.setAttribute('cx', tip[0]); P.pt.setAttribute('cy', tip[1]) }

  // Modus 1: Band ḡ ± μ_g, Erwartungswert-Linie, „wahrer Wert“
  const m1 = mode1 > 0.002
  for (const el of [P.bandPoly, P.trueLine, P.muLine, P.leg]) el.style.opacity = mode1
  if (m1) {
    const up = [], dn = []
    for (const r of ser) { if (r.n > last) break; up.push([sx(r.n), sy(r.mean + r.u)]); dn.push([sx(r.n), sy(r.mean - r.u)]) }
    P.bandPoly.setAttribute('points', up.concat(dn.reverse()).map(p => p.join(',')).join(' '))
    for (const [el, v] of [[P.trueLine, G_TRUE], [P.muLine, MU]]) {
      el.setAttribute('x1', PLOT.x0); el.setAttribute('x2', PLOT.x1)
      el.setAttribute('y1', sy(v)); el.setAttribute('y2', sy(v))
    }
  }
}

// ── Hauptzeichnung ───────────────────────────────────────────────────────────
export function renderScene(S) {
  const V = viewOf(S)
  const ay = V.sy(0)
  const d = store.data
  E.axis.render(V, { at: ay, draw: S.axisDraw, ticks: S.ticks })
  E.axName.setAttribute('x', V.R + 20); E.axName.setAttribute('y', ay + 62)
  E.axName.style.opacity = S.ticks

  // „wahrer Wert“
  const tx = V.sx(G_TRUE)
  const ta = S.tv * (0.2 + 0.8 * S.tvF)
  E.trueG.style.opacity = ta
  E.trueBar.setAttribute('x', tx - 4); E.trueBar.setAttribute('y', ay - 190)
  E.trueBar.setAttribute('height', 200)
  E.trueLab.forEach((t, k) => {
    t.setAttribute('x', tx); t.setAttribute('y', ay - 226 + k * 26)
    t.style.opacity = ta
  })

  // Punkte
  const kd = 1 - 0.43 * S.dsm
  const rowH = lerp(DOT.row1, DOT.row0, S.nl) * (1 - 0.41 * S.dsm)
  d.values.forEach((v, i) => {
    const o = E.dot[i], a = S['d' + i]
    o.g.style.display = a <= 0.002 ? 'none' : ''
    if (a <= 0.002) return
    const rr = (i < 10 ? lerp(DOT.r1, DOT.r0, S.nl) : DOT.r1) * kd
    const r = rr * a
    const x = V.sx(v), y = ay - DOT.base - r * 0 - store.rows[i] * rowH - rr
    for (const c of [o.base, o.cin, o.cout]) { c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', r) }
    o.base.style.opacity = a
    // Strichmarkierung auf dem Zahlenstrahl (nach oben und unten), Farbe wie der Punkt
    o.mark.setAttribute('x1', x); o.mark.setAttribute('x2', x)
    o.mark.setAttribute('y1', ay - 11 * a); o.mark.setAttribute('y2', ay + 11 * a)
    o.mark.style.stroke = S['i' + i] > 0.5 ? 'var(--c-in)' : S['o' + i] > 0.5 ? 'var(--c-out)' : 'var(--c-val)'
    o.mark.style.strokeWidth = 3 - 1.2 * S.dsm
    o.cin.style.opacity = S['i' + i]
    o.cout.style.opacity = S['o' + i]
    if (o.num) { o.num.setAttribute('x', x); o.num.setAttribute('y', y + 1); o.num.style.opacity = S.nl * a }
  })

  // Erster Messwert mit tatsächlichem Zahlenwert
  {
    const o = store.rows[0] * rowH
    E.val.setAttribute('x', V.sx(d.values[0]))
    E.val.setAttribute('y', ay - DOT.base - o - 2 * DOT.r0 - 18)
    E.val.style.opacity = S.v1a
  }

  // Bestwert-Marker
  const mxp = V.sx(S.mx)
  E.mean.style.opacity = S.mA
  E.meanRod.setAttribute('x1', mxp); E.meanRod.setAttribute('x2', mxp)
  E.meanRod.setAttribute('y1', ay - 150); E.meanRod.setAttribute('y2', ay + 14)
  E.meanLab.setAttribute('x', mxp); E.meanLab.setAttribute('y', ay - 160)
  setText(E.meanLab, 'ḡ = ' + fmt(S.mx, 2))

  // σ-Intervall
  const x0 = V.sx(S.mx - S.sh), x1 = V.sx(S.mx + S.sh)
  E.band.style.opacity = S.bA
  E.bandRect.setAttribute('x', x0); E.bandRect.setAttribute('width', Math.max(0, x1 - x0))
  E.bandRect.setAttribute('y', ay - 150); E.bandRect.setAttribute('height', 162)
  for (const [l, x] of [[E.edgeL, x0], [E.edgeR, x1]]) {
    l.setAttribute('x1', x); l.setAttribute('x2', x); l.setAttribute('y1', ay - 150); l.setAttribute('y2', ay + 40)
  }
  E.edgeLabs.forEach((t, k) => {
    t.setAttribute('x', k ? x1 : x0); t.setAttribute('y', ay + 66)
    t.style.opacity = S.bA * S.bE
    setText(t, fmt(k ? S.mx + S.sh : S.mx - S.sh, 2))
  })

  // u-Intervall
  const u0 = V.sx(S.mx - S.uh), u1 = V.sx(S.mx + S.uh)
  E.ub.style.opacity = S.uA
  E.ubRect.setAttribute('x', u0); E.ubRect.setAttribute('width', Math.max(0, u1 - u0))
  E.ubRect.setAttribute('y', ay - 150); E.ubRect.setAttribute('height', 162)

  // Erwartungswert und systematischer Fehler
  const mux = V.sx(MU)
  E.muG.style.opacity = S.muA
  E.muRod.setAttribute('x1', mux); E.muRod.setAttribute('x2', mux)
  E.muRod.setAttribute('y1', ay - 100); E.muRod.setAttribute('y2', ay + 40)
  E.muLab.setAttribute('x', mux); E.muLab.setAttribute('y', ay + 66)
  E.muLab.style.opacity = S.muA
  const gy = ay + 112
  E.gapG.style.opacity = S.gapA
  E.gapLine.setAttribute('x1', mux); E.gapLine.setAttribute('x2', tx)
  E.gapLine.setAttribute('y1', gy); E.gapLine.setAttribute('y2', gy)
  for (const [l, x] of [[E.gapTL, mux], [E.gapTR, tx]]) {
    l.setAttribute('x1', x); l.setAttribute('x2', x); l.setAttribute('y1', gy - 8); l.setAttribute('y2', gy + 8)
  }
  E.gapLab.setAttribute('x', (mux + tx) / 2); E.gapLab.setAttribute('y', gy + 30)
  E.gapLab.style.opacity = S.gapA

  // Strichliste
  const T = E.tally
  T.g.style.display = S.tlA <= 0.002 ? 'none' : ''
  T.g.style.opacity = S.tlA
  const cnt = [S.tIn, S.tOut]
  for (let c = 0; c < 2; c++) {
    T.strokes[c].forEach((el, j) => { el.style.opacity = clamp(cnt[c] - j, 0, 1) })
    setText(T.nums[c], String(Math.round(cnt[c])))
    T.nums[c].setAttribute('x', 235 + c * 330 + 70)
  }

  renderPlot(S)
}
