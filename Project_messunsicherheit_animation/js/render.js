'use strict'
// Rendering: liest NUR die Szene und schreibt SVG-Attribute. Keine Logik,
// keine Zeit. initStage() baut die Elemente einmal, renderScene() pro Frame.

import { svgEl, viewOf, createAxis, readSlots } from '../../shared/js/step-kit.js'
import { VALUE_TEXTS } from './constants.js'
import { roundingInterval } from './model.js'

const VALUE = roundingInterval(VALUE_TEXTS[0]).value
const E = {}

export function initStage(svg) {
  const defs = svgEl('defs', {}, svg)
  const grad = svgEl('linearGradient', { id: 'grad_band', x1: 0, y1: 0, x2: 0, y2: 1 }, defs)
  svgEl('stop', { offset: '0', class: 'band-stop-edge' }, grad)
  svgEl('stop', { offset: '.5', class: 'band-stop-mid' }, grad)
  svgEl('stop', { offset: '1', class: 'band-stop-edge' }, grad)

  E.band = svgEl('g', { class: 'band' }, svg)
  E.bandRect = svgEl('rect', { class: 'band-fill', rx: 4 }, E.band)
  E.axis = createAxis(svg, 'x')
  E.dotLo = svgEl('circle', { class: 'end-closed', r: 6 }, E.band)
  E.dotHi = svgEl('circle', { class: 'end-open', r: 6 }, E.band)
  E.halo = svgEl('circle', { class: 'point-halo' }, svg)
  E.point = svgEl('circle', { class: 'point' }, svg)
  E.labels = [0, 1].map(() => svgEl('text', { class: 'value-label', 'text-anchor': 'middle' }, svg))
}

export function renderScene(S) {
  const V = viewOf(S)
  const ay = V.sy(0)
  E.axis.render(V, { at: ay, draw: S.axisDraw, ticks: S.ticks })

  const x0 = V.sx(S.lo), x1 = V.sx(S.hi)
  E.band.style.opacity = S.bandA
  E.bandRect.setAttribute('x', x0)
  E.bandRect.setAttribute('y', ay - 22)
  E.bandRect.setAttribute('width', Math.max(0, x1 - x0))
  E.bandRect.setAttribute('height', 44)
  E.dotLo.setAttribute('cx', x0); E.dotLo.setAttribute('cy', ay)
  E.dotHi.setAttribute('cx', x1); E.dotHi.setAttribute('cy', ay)

  const px = V.sx(VALUE)
  for (const [el, r] of [[E.halo, 20], [E.point, 8]]) {
    el.setAttribute('cx', px); el.setAttribute('cy', ay)
    el.setAttribute('r', r * S.pS)
    el.style.opacity = S.pA
  }

  readSlots(S, 'lab').forEach((s, n) => {
    const t = E.labels[n]
    t.style.opacity = s.a
    t.setAttribute('x', px)
    t.setAttribute('y', ay - 46 + s.o)
    t.textContent = VALUE_TEXTS[s.i]
  })
}
