'use strict'

// ── Render: pure SVG mutation. Statisches Kräftegleichgewicht (keine Zeit). ──
// drawBackground() einmalig (Decke, Koordinatensystem, Raster); updateScene()
// bei jeder Parameteränderung (Rollen, Seil, Massen, Vektoren, Labels).

import {
  SVG_W, SVG_H, SVG_CENTER_X, PIXELS_PER_CM, FORCE_SCALE_FACTOR, SIZE_PER_KG,
  CEILING_Y, PULLEY_Y, PULLEY_RADIUS, TRIANGLE_SIDE_LENGTH, VEC_CLASS,
} from './constants.js'
import { store, DOM } from './state.js'

const SVGNS = 'http://www.w3.org/2000/svg'
const VEC_STROKE = 2.1      // px — 0,7× des v1.0.1-Werts (Marker skaliert via markerUnits=strokeWidth)
const MARKER_LEN = 5 * VEC_STROKE   // Marker-Länge = markerWidth · strokeWidth

// Marker-ID je Vektortyp (muß mit den <marker id="…"> in index.html übereinstimmen).
const MARKER_ID = {
  gravity: 'arrowhead-gravity',
  tension: 'arrowhead-tension',
  horizontal: 'arrowhead-comp-h',
  vertical: 'arrowhead-comp-v',
}

// ── Zahl-Formatierung (Komma-Dezimal) ─────────────────────────────────────────
export function fmt(n, d = 2) {
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(d).replace('.', ',')
}

// ── Kanonische Pfeilspitzen-Geometrie (CLAUDE.md): refX=0 + Schaft um ────────
// Marker-Länge (markerWidth·strokeWidth) gekürzt → Spitze exakt auf Zielpunkt.
function shortenEnd(x1, y1, x2, y2, by) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy)
  if (len < 1e-6) return { x: x2, y: y2 }
  const shaft = Math.max(len - by, 2)
  return { x: x1 + (dx / len) * shaft, y: y1 + (dy / len) * shaft }
}

// ── Zentrale Koordinatentransformation ────────────────────────────────────────
// Die Physik rechnet direkt in Bildschirm-Pixeln (Y ↓). physToScreen kapselt
// diese Konvention zentral — Anpassungen nur an dieser Stelle.
export function physToScreen(x, y) {
  return { x, y }
}

// ── Statischer Hintergrund (einmalig) ─────────────────────────────────────────
export function drawBackground() {
  // Decke
  DOM.ceiling.setAttribute('x', 0)
  DOM.ceiling.setAttribute('y', CEILING_Y - 20)
  DOM.ceiling.setAttribute('width', SVG_W)
  DOM.ceiling.setAttribute('height', 20)
  drawGrid()
}

// Hintergrundraster (5-cm-Spacing), via Toggle sichtbar/versteckt.
export function drawGrid() {
  const spacing = 5 * PIXELS_PER_CM
  let d = ''
  for (let x = 0; x < SVG_W; x += spacing) d += `M ${x} 0 L ${x} ${SVG_H} `
  for (let y = 0; y < SVG_H; y += spacing) d += `M 0 ${y} L ${SVG_W} ${y} `
  const path = document.createElementNS(SVGNS, 'path')
  path.setAttribute('d', d)
  DOM.gridGroup.innerHTML = ''
  DOM.gridGroup.appendChild(path)
}

// ── Rollen + Halterungen positionieren (parameter-abhängig) ───────────────────
function positionPulleys(pulleyLeftX, pulleyRightX) {
  const lv1 = `${pulleyLeftX - TRIANGLE_SIDE_LENGTH / 2},${CEILING_Y}`
  const lv2 = `${pulleyLeftX + TRIANGLE_SIDE_LENGTH / 2},${CEILING_Y}`
  const lv3 = `${pulleyLeftX},${PULLEY_Y}`
  DOM.pulleyMountLeft.setAttribute('points', `${lv1} ${lv2} ${lv3}`)
  const rv1 = `${pulleyRightX - TRIANGLE_SIDE_LENGTH / 2},${CEILING_Y}`
  const rv2 = `${pulleyRightX + TRIANGLE_SIDE_LENGTH / 2},${CEILING_Y}`
  const rv3 = `${pulleyRightX},${PULLEY_Y}`
  DOM.pulleyMountRight.setAttribute('points', `${rv1} ${rv2} ${rv3}`)
  for (const [el, cx] of [[DOM.pulleyLeft, pulleyLeftX], [DOM.pulleyRight, pulleyRightX]]) {
    el.setAttribute('cx', cx); el.setAttribute('cy', PULLEY_Y)
  }
  for (const [el, cx] of [[DOM.pulleyLeftCenter, pulleyLeftX], [DOM.pulleyRightCenter, pulleyRightX]]) {
    el.setAttribute('cx', cx); el.setAttribute('cy', PULLEY_Y)
  }
}

// ── Kraft-Vektor (Linie + Marker, Schaft gekürzt) ─────────────────────────────
function createForceVector(x1, y1, x2, y2, type, dashed = false) {
  const end = shortenEnd(x1, y1, x2, y2, MARKER_LEN)
  const line = document.createElementNS(SVGNS, 'line')
  line.setAttribute('x1', x1); line.setAttribute('y1', y1)
  line.setAttribute('x2', end.x); line.setAttribute('y2', end.y)
  line.setAttribute('class', `vec ${VEC_CLASS[type]}`)
  line.setAttribute('stroke-width', VEC_STROKE)
  line.setAttribute('marker-end', `url(#${MARKER_ID[type]})`)
  if (dashed) line.setAttribute('stroke-dasharray', '5 5')
  return line
}

// ── SVG-Kraft-Label: F⃗<sub>…</sub> (Symbol kursiv, Vektor-Pfeil via Combining-
//    Arrow U+20D7 darüber — von der Schrift selbst plaziert, wie in LaTeX/MathJax;
//    kein hand-positionierter Pfad, der mit dem F-Glyphen verschmilzt).
function addForceLabel(x, y, sub, type, anchor = 'start') {
  const text = document.createElementNS(SVGNS, 'text')
  text.setAttribute('x', x); text.setAttribute('y', y)
  text.setAttribute('class', `force-label ${VEC_CLASS[type]}`)
  text.setAttribute('text-anchor', anchor)
  const sym = document.createElementNS(SVGNS, 'tspan')
  sym.setAttribute('font-style', 'italic')
  sym.textContent = 'F⃗'   // F + COMBINING RIGHT ARROW ABOVE → F⃗
  const subT = document.createElementNS(SVGNS, 'tspan')
  subT.setAttribute('dy', '0.25em'); subT.setAttribute('font-size', '0.7em')
  subT.textContent = sub
  text.appendChild(sym); text.appendChild(subT)
  DOM.forceVectorsGroup.appendChild(text)
}

// ── Komponenten-Wert-Anzeige (x, y) in JetBrains Mono ─────────────────────────
function addComponentDisplay(x, y, vx, vyInternal, type, anchor = 'start') {
  const displayY = -vyInternal // Y-Anzeige positiv nach oben
  const xComp = vx.toFixed(1)
  const yComp = displayY.toFixed(1)
  const text = document.createElementNS(SVGNS, 'text')
  text.setAttribute('x', x); text.setAttribute('y', y)
  text.setAttribute('class', `comp-val ${VEC_CLASS[type]}`)
  text.setAttribute('text-anchor', anchor)
  const l1 = document.createElementNS(SVGNS, 'tspan')
  l1.textContent = `(${xComp},`
  const l2 = document.createElementNS(SVGNS, 'tspan')
  l2.setAttribute('x', x); l2.setAttribute('dy', '12')
  l2.textContent = `${yComp})`
  text.appendChild(l1); text.appendChild(l2)
  DOM.forceVectorsGroup.appendChild(text)
}

// ── Massen-Gruppe plazieren + beschriften ─────────────────────────────────────
function placeMass(group, rect, label, attach, size, labelText) {
  rect.setAttribute('width', size); rect.setAttribute('height', size)
  label.setAttribute('x', size / 2); label.setAttribute('y', size / 2)
  group.setAttribute('transform', `translate(${attach.x - size / 2}, ${attach.y})`)
  label.textContent = labelText
}

function hideMasses() {
  for (const g of [DOM.massLeftGroup, DOM.massMiddleGroup, DOM.massRightGroup]) {
    g.setAttribute('transform', 'translate(-1000, -1000)')
  }
}

// ── SCRIFT-TEST (temporär): rendert "test" in diversen Fonts/Größen/Weights ──
// numeriert ins Sim-Feld. Sobald die Auswahl feststeht, wird dieser Block wieder
// entfernt und die gewählte Variante auf die Sim-Labels angewandt.
const FONT_TEST = true
const FONT_VARIANTS = [
  // Serif italic (Math-Konvention, wie LaTeX/MathJax)
  { n: 1,  ff: "'Times New Roman', 'STIX Two Text', Cambria, Georgia, serif", fs: 11, w: 400, it: true,  t: 'test' },
  { n: 2,  ff: "'Times New Roman', 'STIX Two Text', Cambria, Georgia, serif", fs: 12, w: 400, it: true,  t: 'test' },
  { n: 3,  ff: "'Times New Roman', 'STIX Two Text', Cambria, Georgia, serif", fs: 13, w: 400, it: true,  t: 'test' },
  { n: 4,  ff: "'Times New Roman', 'STIX Two Text', Cambria, Georgia, serif", fs: 14, w: 400, it: true,  t: 'test' },
  { n: 5,  ff: "'Times New Roman', 'STIX Two Text', Cambria, Georgia, serif", fs: 13, w: 500, it: true,  t: 'test' },
  { n: 6,  ff: "'Times New Roman', 'STIX Two Text', Cambria, Georgia, serif", fs: 13, w: 600, it: true,  t: 'test' },
  { n: 7,  ff: "'Times New Roman', 'STIX Two Text', Cambria, Georgia, serif", fs: 13, w: 400, it: false, t: 'test' },
  { n: 8,  ff: "'Times New Roman', 'STIX Two Text', Cambria, Georgia, serif", fs: 13, w: 500, it: false, t: 'test' },
  // DM Sans (Share-UI-Font)
  { n: 9,  ff: "'DM Sans', Verdana, system-ui, sans-serif", fs: 12, w: 400, it: true,  t: 'test' },
  { n: 10, ff: "'DM Sans', Verdana, system-ui, sans-serif", fs: 13, w: 400, it: true,  t: 'test' },
  { n: 11, ff: "'DM Sans', Verdana, system-ui, sans-serif", fs: 13, w: 500, it: true,  t: 'test' },
  { n: 12, ff: "'DM Sans', Verdana, system-ui, sans-serif", fs: 13, w: 400, it: false, t: 'test' },
  { n: 13, ff: "'DM Sans', Verdana, system-ui, sans-serif", fs: 13, w: 500, it: false, t: 'test' },
  { n: 14, ff: "'DM Sans', Verdana, system-ui, sans-serif", fs: 13, w: 600, it: false, t: 'test' },
  // system-ui (auf macOS: San Francisco)
  { n: 15, ff: "system-ui, sans-serif", fs: 13, w: 400, it: true,  t: 'test' },
  { n: 16, ff: "system-ui, sans-serif", fs: 13, w: 400, it: false, t: 'test' },
  { n: 17, ff: "system-ui, sans-serif", fs: 13, w: 500, it: false, t: 'test' },
  // Georgia / Cambria / STIX Two Text
  { n: 18, ff: "Georgia, serif",              fs: 13, w: 400, it: true, t: 'test' },
  { n: 19, ff: "Cambria, serif",              fs: 13, w: 400, it: true, t: 'test' },
  { n: 20, ff: "'STIX Two Text', serif",      fs: 13, w: 400, it: true, t: 'test' },
  // JetBrains Mono
  { n: 21, ff: "'JetBrains Mono', monospace", fs: 12, w: 400, it: false, t: 'test' },
  { n: 22, ff: "'JetBrains Mono', monospace", fs: 13, w: 400, it: false, t: 'test' },
  // F⃗-Proben (Combining-Arrow-Rendering prüfen, mit Subscript)
  { n: 23, ff: "'Times New Roman', 'STIX Two Text', Cambria, Georgia, serif", fs: 13, w: 400, it: true, t: 'F⃗ test' },
  { n: 24, ff: "'Times New Roman', 'STIX Two Text', Cambria, Georgia, serif", fs: 14, w: 400, it: true, t: 'F⃗G,1 test' },
]

function drawFontTest() {
  let g = document.getElementById('font_test_group')
  if (!g) {
    g = document.createElementNS(SVGNS, 'g')
    g.setAttribute('id', 'font_test_group')
    DOM.mainSvg.appendChild(g)
  } else {
    DOM.mainSvg.appendChild(g) // zuletzt angehängt = oben
  }
  g.innerHTML = ''

  const bg = document.createElementNS(SVGNS, 'rect')
  bg.setAttribute('x', 0); bg.setAttribute('y', 0)
  bg.setAttribute('width', SVG_W); bg.setAttribute('height', SVG_H)
  bg.style.fill = 'var(--bg)'
  g.appendChild(bg)

  const header = document.createElementNS(SVGNS, 'text')
  header.setAttribute('x', 20); header.setAttribute('y', 26)
  header.style.fill = 'var(--text)'
  header.style.font = "600 15px 'DM Sans', sans-serif"
  header.textContent = 'Schrift-Test — bitte Nummer(n) nennen, die gut aussehen'
  g.appendChild(header)

  const colX = [20, 320, 620]
  const rowY0 = 56, dY = 52
  FONT_VARIANTS.filter(v => v.n === 23 || v.n === 24).forEach((v, i) => {
    const c = i % 3, r = Math.floor(i / 3)
    const x = colX[c], y = rowY0 + r * dY

    const num = document.createElementNS(SVGNS, 'text')
    num.setAttribute('x', x); num.setAttribute('y', y)
    num.style.fill = 'var(--text2)'
    num.style.font = "400 11px 'DM Sans', sans-serif"
    num.textContent = `${v.n}.`
    g.appendChild(num)

    const s = document.createElementNS(SVGNS, 'text')
    s.setAttribute('x', x + 34); s.setAttribute('y', y)
    s.style.fill = 'var(--text)'
    s.style.fontFamily = v.ff
    s.style.fontSize = v.fs + 'px'
    s.style.fontWeight = v.w
    s.style.fontStyle = v.it ? 'italic' : 'normal'
    s.textContent = v.t
    g.appendChild(s)
  })
}

// ── Szene aktualisieren ───────────────────────────────────────────────────────
export function updateScene() {
  if (FONT_TEST) { drawFontTest(); return }
  const pulleyDist = store.pulleyDistCm * PIXELS_PER_CM
  const pulleyLeftX = SVG_CENTER_X - pulleyDist / 2
  const pulleyRightX = SVG_CENTER_X + pulleyDist / 2
  positionPulleys(pulleyLeftX, pulleyRightX)

  DOM.forceVectorsGroup.innerHTML = ''
  const eq = store.equilibrium

  if (!eq || eq.status !== 'ok') {
    DOM.rope.setAttribute('d', '')
    hideMasses()
    return
  }

  const { m2_pos, tp_L, tp_R, m1_attach, m3_attach, T1, T3, Fg2, T1_vec, T3_vec } = eq
  const m1Size = store.m1 * SIZE_PER_KG
  const m2Size = store.m2 * SIZE_PER_KG
  const m3Size = store.m3 * SIZE_PER_KG

  // Seilpfad: m₁ → Rolle links (Bogen) → m₂ → Rolle rechts (Bogen) → m₃
  const d = `M ${m1_attach.x} ${m1_attach.y} ` +
            `L ${eq.exitLeft.x} ${eq.exitLeft.y} ` +
            `A ${PULLEY_RADIUS} ${PULLEY_RADIUS} 0 0 1 ${tp_L.x} ${tp_L.y} ` +
            `L ${m2_pos.x} ${m2_pos.y} ` +
            `L ${tp_R.x} ${tp_R.y} ` +
            `A ${PULLEY_RADIUS} ${PULLEY_RADIUS} 0 0 1 ${eq.exitRight.x} ${eq.exitRight.y} ` +
            `L ${m3_attach.x} ${m3_attach.y}`
  DOM.rope.setAttribute('d', d)

  placeMass(DOM.massLeftGroup, DOM.massLeftRect, DOM.massLeftLabel, m1_attach, m1Size, 'm₁')
  placeMass(DOM.massRightGroup, DOM.massRightRect, DOM.massRightLabel, m3_attach, m3Size, 'm₃')
  placeMass(DOM.massMiddleGroup, DOM.massMiddleRect, DOM.massMiddleLabel, m2_pos, m2Size, 'm₂')

  const m1Center = { x: m1_attach.x, y: m1_attach.y + m1Size / 2 }
  const m3Center = { x: m3_attach.x, y: m3_attach.y + m3Size / 2 }
  const m2Center = { x: m2_pos.x, y: m2_pos.y + m2Size / 2 }
  const m2Attach = { x: m2_pos.x, y: m2_pos.y }
  const showComps = store.showComponentValues

  // Gewichtskräfte (vertikal nach unten) — Labels AUSSERHALB (m1 links, m3 rechts),
  // m2 rechts des Schwere-Pfeils (weg von den Seilkräften oben).
  if (store.showGravity) {
    DOM.forceVectorsGroup.appendChild(createForceVector(m1Center.x, m1Center.y, m1Center.x, m1Center.y + T1 * FORCE_SCALE_FACTOR, 'gravity'))
    DOM.forceVectorsGroup.appendChild(createForceVector(m2Center.x, m2Center.y, m2Center.x, m2Center.y + Fg2 * FORCE_SCALE_FACTOR, 'gravity'))
    DOM.forceVectorsGroup.appendChild(createForceVector(m3Center.x, m3Center.y, m3Center.x, m3Center.y + T3 * FORCE_SCALE_FACTOR, 'gravity'))
    addForceLabel(m1Center.x - m1Size / 2 - 7, m1Center.y + (T1 * FORCE_SCALE_FACTOR) / 2, 'G,1', 'gravity', 'end')
    addForceLabel(m2Center.x + m2Size / 2 + 7, m2Center.y + (Fg2 * FORCE_SCALE_FACTOR) / 2, 'G,2', 'gravity')
    addForceLabel(m3Center.x + m3Size / 2 + 7, m3Center.y + (T3 * FORCE_SCALE_FACTOR) / 2, 'G,3', 'gravity')
    if (showComps) {
      addComponentDisplay(m1Center.x - m1Size / 2 - 24, m1Center.y + (T1 * FORCE_SCALE_FACTOR) / 2 - 9, 0, T1, 'gravity', 'end')
      addComponentDisplay(m2Center.x + m2Size / 2 + 30, m2Center.y + (Fg2 * FORCE_SCALE_FACTOR) / 2 - 9, 0, Fg2, 'gravity')
      addComponentDisplay(m3Center.x + m3Size / 2 + 30, m3Center.y + (T3 * FORCE_SCALE_FACTOR) / 2 - 9, 0, T3, 'gravity')
    }
  }

  // Seilkräfte (gesamt) — m1/m3 Labels auf der INNEREN Seite (entgegengesetzt zur
  // Schwerkraft), m2-Seilkräfte auf der ÄUSSEREN Seite der jeweiligen Seilstrecke.
  if (store.showTension) {
    DOM.forceVectorsGroup.appendChild(createForceVector(m1Center.x, m1Center.y, m1Center.x, m1Center.y - T1 * FORCE_SCALE_FACTOR, 'tension'))
    DOM.forceVectorsGroup.appendChild(createForceVector(m3Center.x, m3Center.y, m3Center.x, m3Center.y - T3 * FORCE_SCALE_FACTOR, 'tension'))
    const t1End = { x: m2Attach.x + T1_vec.x * FORCE_SCALE_FACTOR, y: m2Attach.y + T1_vec.y * FORCE_SCALE_FACTOR }
    const t3End = { x: m2Attach.x + T3_vec.x * FORCE_SCALE_FACTOR, y: m2Attach.y + T3_vec.y * FORCE_SCALE_FACTOR }
    DOM.forceVectorsGroup.appendChild(createForceVector(m2Attach.x, m2Attach.y, t1End.x, t1End.y, 'tension'))
    DOM.forceVectorsGroup.appendChild(createForceVector(m2Attach.x, m2Attach.y, t3End.x, t3End.y, 'tension'))
    addForceLabel(m1Center.x + m1Size / 2 + 7, m1Center.y - (T1 * FORCE_SCALE_FACTOR) / 2, 'S,1', 'tension')
    addForceLabel(m3Center.x - m3Size / 2 - 7, m3Center.y - (T3 * FORCE_SCALE_FACTOR) / 2, 'S,3', 'tension', 'end')
    // Äußere Normale: F_S,li links der linken Seilstrecke, F_S,re rechts der rechten.
    const off = 42
    const nLx = T1_vec.y / T1,  nLy = -T1_vec.x / T1   // äußere Normale links
    const nRx = -T3_vec.y / T3, nRy = T3_vec.x / T3    // äußere Normale rechts
    addForceLabel(m2Attach.x + (T1_vec.x * FORCE_SCALE_FACTOR) / 2 + nLx * off, m2Attach.y + (T1_vec.y * FORCE_SCALE_FACTOR) / 2 + nLy * off, 'S,li', 'tension')
    addForceLabel(m2Attach.x + (T3_vec.x * FORCE_SCALE_FACTOR) / 2 + nRx * off, m2Attach.y + (T3_vec.y * FORCE_SCALE_FACTOR) / 2 + nRy * off, 'S,re', 'tension')
    if (showComps) {
      addComponentDisplay(m1Center.x + m1Size / 2 + 30, m1Center.y - (T1 * FORCE_SCALE_FACTOR) / 2 - 9, 0, -T1, 'tension')
      addComponentDisplay(m3Center.x - m3Size / 2 - 50, m3Center.y - (T3 * FORCE_SCALE_FACTOR) / 2 - 9, 0, -T3, 'tension', 'end')
      const coff = 56
      addComponentDisplay(m2Attach.x + T1_vec.x * FORCE_SCALE_FACTOR * 0.6 + nLx * coff, m2Attach.y + T1_vec.y * FORCE_SCALE_FACTOR * 0.6 + nLy * coff, T1_vec.x, T1_vec.y, 'tension')
      addComponentDisplay(m2Attach.x + T3_vec.x * FORCE_SCALE_FACTOR * 0.6 + nRx * coff, m2Attach.y + T3_vec.y * FORCE_SCALE_FACTOR * 0.6 + nRy * coff, T3_vec.x, T3_vec.y, 'tension')
    }
  }

  // Komponentenzerlegung der Seilkräfte auf m₂ (gestrichelt, x dann y)
  if (store.showComponents) {
    const sx = m2Attach.x, sy = m2Attach.y
    const t1ex = sx + T1_vec.x * FORCE_SCALE_FACTOR, t1ey = sy + T1_vec.y * FORCE_SCALE_FACTOR
    const t3ex = sx + T3_vec.x * FORCE_SCALE_FACTOR, t3ey = sy + T3_vec.y * FORCE_SCALE_FACTOR
    DOM.forceVectorsGroup.appendChild(createForceVector(sx, sy, t1ex, sy, 'horizontal', true))
    DOM.forceVectorsGroup.appendChild(createForceVector(t1ex, sy, t1ex, t1ey, 'vertical', true))
    DOM.forceVectorsGroup.appendChild(createForceVector(sx, sy, t3ex, sy, 'horizontal', true))
    DOM.forceVectorsGroup.appendChild(createForceVector(t3ex, sy, t3ex, t3ey, 'vertical', true))
  }

  // Massen über die Vektoren legen (z-Order: zuletzt angehängt = oben)
  const parent = DOM.massLeftGroup.parentNode
  parent.appendChild(DOM.massLeftGroup)
  parent.appendChild(DOM.massRightGroup)
  parent.appendChild(DOM.massMiddleGroup)
}

// ── Analyse-Panel (HTML, statisches MathJax — nur textContent aktualisieren) ─
// Winkel γ zur Vertikalen: γ₁ = angle1 − π/2, γ₃ = π/2 − angle3 (siehe physics.js).
export function updateAnalysis() {
  const eq = store.equilibrium
  if (!eq || eq.status !== 'ok') {
    DOM.leftForce.textContent = '—'
    DOM.leftAngle.textContent = '—'
    DOM.rightForce.textContent = '—'
    DOM.rightAngle.textContent = '—'
    DOM.verticalForcesValue.textContent = '—'
    DOM.horizontalForcesValue.textContent = '—'
    DOM.equilibriumWarning.style.visibility = 'visible'
    DOM.equilibriumWarning.textContent =
      eq && eq.status === 'collision'
        ? 'Kollision: Seillänge zu kurz!'
        : 'Kein statisches Gleichgewicht möglich!'
    return
  }
  const { T1, T3, Fg2, T1_vec, T3_vec, angle1, angle3 } = eq
  const gamma1Deg = ((angle1 - Math.PI / 2) * 180) / Math.PI
  const gamma3Deg = ((Math.PI / 2 - angle3) * 180) / Math.PI
  DOM.leftForce.textContent = `${fmt(T1, 2)} N`
  DOM.leftAngle.textContent = `${fmt(gamma1Deg, 1)}°`
  DOM.rightForce.textContent = `${fmt(T3, 2)} N`
  DOM.rightAngle.textContent = `${fmt(gamma3Deg, 1)}°`
  DOM.verticalForcesValue.textContent = `↑ ${fmt(-T1_vec.y - T3_vec.y, 2)} N vs ↓ ${fmt(Fg2, 2)} N`
  DOM.horizontalForcesValue.textContent = `← ${fmt(-T1_vec.x, 2)} N vs → ${fmt(T3_vec.x, 2)} N`
  DOM.equilibriumWarning.style.visibility = 'hidden'
}