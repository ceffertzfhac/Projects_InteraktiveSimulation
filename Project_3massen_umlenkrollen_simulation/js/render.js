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

// Hintergrundraster (2,5-cm-Spacing = doppelte Dichte), via Toggle sichtbar/versteckt.
// Deckt den übergebenen Bereich ab (bei Auto-Zoom die aktuelle viewBox-Ausdehnung),
// damit das Raster auch beim Herauszoomen die ganze sichtbare Fläche füllt.
export function drawGrid(x0 = 0, y0 = 0, x1 = SVG_W, y1 = SVG_H) {
  const spacing = 2.5 * PIXELS_PER_CM
  const sx = Math.floor(x0 / spacing) * spacing
  const sy = Math.floor(y0 / spacing) * spacing
  let d = ''
  for (let x = sx; x <= x1; x += spacing) d += `M ${x} ${y0} L ${x} ${y1} `
  for (let y = sy; y <= y1; y += spacing) d += `M ${x0} ${y} L ${x1} ${y} `
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
  // Gestrichelte Komponenten um 0,8 dünnere Strichdicke (PO-Vorgabe). Da der Marker
  // via markerUnits=strokeWidth skaliert, muß shortenEnd um die *tatsächliche*
  // Marker-Länge (5·sw) kürzen — sonst endet die dünnere gestrichelte Spitze zu
  // kurz (kanonische Geometrie, s. CLAUDE.md).
  const sw = dashed ? VEC_STROKE - 0.8 : VEC_STROKE
  const end = shortenEnd(x1, y1, x2, y2, 5 * sw)
  const line = document.createElementNS(SVGNS, 'line')
  line.setAttribute('x1', x1); line.setAttribute('y1', y1)
  line.setAttribute('x2', end.x); line.setAttribute('y2', end.y)
  line.setAttribute('class', `vec ${VEC_CLASS[type]}`)
  line.setAttribute('stroke-width', sw)
  line.setAttribute('marker-end', `url(#${MARKER_ID[type]})`)
  if (dashed) line.setAttribute('stroke-dasharray', '5 5')
  return line
}

// ── SVG-Kraft-Label als EINE Einheit: Zeile 1 = F⃗<sub>…</sub> (Symbol kursiv,
//    Vektor-Pfeil via Combining-Arrow U+20D7 — von der Schrift selbst plaziert),
//    optional Zeile 2 = Komponentenwert (vx, vy) in Mono. Label und Wert bilden ein
//    gemeinsames <text> → sie können prinzipiell nie gegeneinander kollidieren.
//    comp = { vx, vyInternal } (intern y nach unten positiv → Anzeige -vyInternal)
//    oder null (nur Symbol). Gibt das <text>-Element zurück (für die Kollisions-
//    auflösung in resolveLabelCollisions()). compColored=true: vx/vy-Werte in den
//    Farben der gestrichelten Komponenten (nur für die Seilkräfte an m₂, wo solche
//    Komponenten gezeichnet werden); sonst trägt die Wertzeile die Vektorfarbe.
function addForceLabel(x, y, sub, type, anchor = 'start', comp = null, compColored = false) {
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
  if (comp && store.showComponentValues) {
    const dy1 = '1.2em'
    if (compColored) {
      // Nur Seilkräfte an m₂: vx → Horizontalkomponente (--c-comp-h),
      // vy → Vertikalkomponente (--c-comp-v); Strukturzeichen erben die Kraftfarbe.
      // Färbung via CSS-Klassen (.comp-val-h/v), da var() als SVG-Fill-Attribut
      // nicht aufgelöst wird (s. CLAUDE.md) — so greift auch der Dark-Mode automatisch.
      const seg = (txt, extra = '') => {
        const ts = document.createElementNS(SVGNS, 'tspan')
        ts.setAttribute('class', `comp-val-line ${extra}`.trim())
        ts.textContent = txt
        return ts
      }
      const t0 = seg('(')
      t0.setAttribute('x', x); t0.setAttribute('dy', dy1)
      text.appendChild(t0)
      text.appendChild(seg(comp.vx.toFixed(1), 'comp-val-h'))
      text.appendChild(seg(', '))
      text.appendChild(seg((-comp.vyInternal).toFixed(1), 'comp-val-v'))
      text.appendChild(seg(') N'))
    } else {
      // Anderswo: ganze Wertzeile in der Vektor-/Kraftfarbe (Fill vom Label erben).
      const val = document.createElementNS(SVGNS, 'tspan')
      val.setAttribute('x', x); val.setAttribute('dy', dy1)
      val.setAttribute('class', 'comp-val-line')
      val.textContent = `(${comp.vx.toFixed(1)}, ${(-comp.vyInternal).toFixed(1)}) N`
      text.appendChild(val)
    }
  }
  DOM.forceVectorsGroup.appendChild(text)
  return text
}

// ── Winkel α zur Horizontalen an m₂ eintragen ─────────────────────────────────
// Gestrichelte Horizontale als Bezugslinie durch den Seil-Angriffspunkt, Bögen
// zwischen Horizontale und jeweiliger Seilstrecke (linkes Seil = angle1 im
// math.-Konventionsraum 90..180°, rechtes = angle3 0..90°), dazu die Bezeichnung
// α₁/α₃ (Serif-Italic wie die Kraft-Labels, Subscript numerisch aufrecht). NUR die
// Bezeichnung — kein Wert (PO-Vorgabe). Bogenradius außerhalb der m₂-Masse, sodaß
// die Masse (z-Order oben) die Horizontale mittig überdeckt und nur die äußeren
// Bezugs-Stücke sichtbar bleiben.
function drawAngleAtM2(m2Attach, m2Size, angle1, angle3) {
  DOM.angleGroup.innerHTML = ''
  const cx = m2Attach.x, cy = m2Attach.y
  const r = Math.max(28, m2Size / 2 + 10)              // Bogenradius, außerhalb der m₂-Masse
  const armLen = r + 12
  // math-Winkel (y↑) → Bildschirm (y↓): y = cy − r·sin(θ)
  const toScreen = (theta, rad) => ({ x: cx + rad * Math.cos(theta), y: cy - rad * Math.sin(theta) })

  const h = document.createElementNS(SVGNS, 'line')
  h.setAttribute('x1', cx - armLen); h.setAttribute('y1', cy)
  h.setAttribute('x2', cx + armLen); h.setAttribute('y2', cy)
  h.setAttribute('class', 'angle-ref')
  DOM.angleGroup.appendChild(h)

  // Bogen als Polyline (statt SVG-Arc-Sweep-Flag-Raterei): sample im math-Winkelraum.
  const arcPath = (fromTheta, toTheta, steps = 14) => {
    let d = ''
    for (let i = 0; i <= steps; i++) {
      const t = fromTheta + (toTheta - fromTheta) * (i / steps)
      const p = toScreen(t, r)
      d += (i === 0 ? 'M' : 'L') + ` ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
    }
    return d
  }
  const aL = document.createElementNS(SVGNS, 'path')
  aL.setAttribute('d', arcPath(angle1, Math.PI)); aL.setAttribute('class', 'angle-arc')
  DOM.angleGroup.appendChild(aL)
  const aR = document.createElementNS(SVGNS, 'path')
  aR.setAttribute('d', arcPath(0, angle3)); aR.setAttribute('class', 'angle-arc')
  DOM.angleGroup.appendChild(aR)

  // α-Label je Sektor auf der Winkelhalbierenden (gerade außerhalb des Bogens).
  const labelAt = (thetaMid, sub) => {
    const p = toScreen(thetaMid, r + 6)
    const t = document.createElementNS(SVGNS, 'text')
    t.setAttribute('x', p.x.toFixed(1)); t.setAttribute('y', p.y.toFixed(1))
    t.setAttribute('class', 'angle-label')
    t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'middle')
    const s = document.createElementNS(SVGNS, 'tspan')
    s.setAttribute('font-style', 'italic'); s.textContent = 'α'
    const sb = document.createElementNS(SVGNS, 'tspan')
    sb.setAttribute('dy', '0.25em'); sb.setAttribute('font-size', '0.7em'); sb.textContent = sub
    t.appendChild(s); t.appendChild(sb)
    DOM.angleGroup.appendChild(t)
  }
  labelAt((angle1 + Math.PI) / 2, '1')   // α₁: Sektor linkes Seil (angle1) ↔ linke Horizontale (π)
  labelAt(angle3 / 2, '3')               // α₃: Sektor rechtes Seil (angle3) ↔ rechte Horizontale (0)
}

// ── Kollisionsauflösung der Label-Einheiten ───────────────────────────────────
// Deterministische Platzierung (an den Vektoren) hält für die meisten Konfigurationen,
// aber bei kleinem Rollenabstand/bestimmten Massen überlappen zwei Einheiten (z. B.
// F_G,2 und F_S,3). Diese Nachbearbeitung schiebt überlappende Label-Boxen entlang der
// Achse geringster Durchdringung (MTV) auseinander — die Massen sind feste Hindernisse,
// damit kein Label auf eine Masse rutscht. labels: [{el, ...}], obstacles: [{x,y,w,h}].
function resolveLabelCollisions(labels, obstacles) {
  const PAD = 4
  const items = labels.map(l => {
    const b = l.el.getBBox()
    return { el: l.el, x: b.x, y: b.y, w: b.width, h: b.height, dx: 0, dy: 0, fixed: false }
  })
  obstacles.forEach(o => items.push({ el: null, x: o.x, y: o.y, w: o.w, h: o.h, dx: 0, dy: 0, fixed: true }))

  for (let iter = 0; iter < 20; iter++) {
    let moved = false
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i], b = items[j]
        if (a.fixed && b.fixed) continue
        const ax1 = a.x + a.dx, ay1 = a.y + a.dy, ax2 = ax1 + a.w, ay2 = ay1 + a.h
        const bx1 = b.x + b.dx, by1 = b.y + b.dy, bx2 = bx1 + b.w, by2 = by1 + b.h
        const ox = Math.min(ax2, bx2) - Math.max(ax1, bx1) + PAD // x-Überlappung (+Puffer)
        const oy = Math.min(ay2, by2) - Math.max(ay1, by1) + PAD // y-Überlappung (+Puffer)
        if (ox <= 0 || oy <= 0) continue // keine Überlappung
        // entlang der Achse geringster Durchdringung trennen
        if (ox < oy) {
          const dir = (ax1 + ax2) <= (bx1 + bx2) ? -1 : 1
          if (a.fixed) b.dx -= dir * ox
          else if (b.fixed) a.dx += dir * ox
          else { a.dx += dir * ox / 2; b.dx -= dir * ox / 2 }
        } else {
          const dir = (ay1 + ay2) <= (by1 + by2) ? -1 : 1
          if (a.fixed) b.dy -= dir * oy
          else if (b.fixed) a.dy += dir * oy
          else { a.dy += dir * oy / 2; b.dy -= dir * oy / 2 }
        }
        moved = true
      }
    }
    if (!moved) break
  }
  items.forEach(it => {
    if (it.el && (it.dx || it.dy)) it.el.setAttribute('transform', `translate(${it.dx.toFixed(1)} ${it.dy.toFixed(1)})`)
  })
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

// ── Szene aktualisieren ───────────────────────────────────────────────────────
export function updateScene() {
  const pulleyDist = store.pulleyDistCm * PIXELS_PER_CM
  const pulleyLeftX = SVG_CENTER_X - pulleyDist / 2
  const pulleyRightX = SVG_CENTER_X + pulleyDist / 2
  positionPulleys(pulleyLeftX, pulleyRightX)

  DOM.forceVectorsGroup.innerHTML = ''
  DOM.angleGroup.innerHTML = ''
  const eq = store.equilibrium

  if (!eq || eq.status !== 'ok') {
    DOM.rope.setAttribute('d', '')
    hideMasses()
    return
  }

  const { m2_pos, tp_L, tp_R, m1_attach, m3_attach, T1, T3, Fg2, T1_vec, T3_vec, angle1, angle3 } = eq
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
  const labels = []  // Kraft-Label-Einheiten für die Kollisionsauflösung

  // Gewichtskräfte (vertikal nach unten) — Labels AUSSERHALB (m1 links, m3 rechts),
  // m2 rechts des Schwere-Pfeils (weg von den Seilkräften oben).
  if (store.showGravity) {
    DOM.forceVectorsGroup.appendChild(createForceVector(m1Center.x, m1Center.y, m1Center.x, m1Center.y + T1 * FORCE_SCALE_FACTOR, 'gravity'))
    DOM.forceVectorsGroup.appendChild(createForceVector(m2Center.x, m2Center.y, m2Center.x, m2Center.y + Fg2 * FORCE_SCALE_FACTOR, 'gravity'))
    DOM.forceVectorsGroup.appendChild(createForceVector(m3Center.x, m3Center.y, m3Center.x, m3Center.y + T3 * FORCE_SCALE_FACTOR, 'gravity'))
    labels.push({ el: addForceLabel(m1Center.x - m1Size / 2 - 8, m1Center.y + (T1 * FORCE_SCALE_FACTOR) / 2, 'G,1', 'gravity', 'end', { vx: 0, vyInternal: T1 }), ax: m1Center.x, ay: m1Center.y })
    labels.push({ el: addForceLabel(m2Center.x + m2Size / 2 + 8, m2Center.y + (Fg2 * FORCE_SCALE_FACTOR) / 2, 'G,2', 'gravity', 'start', { vx: 0, vyInternal: Fg2 }), ax: m2Center.x, ay: m2Center.y })
    labels.push({ el: addForceLabel(m3Center.x + m3Size / 2 + 8, m3Center.y + (T3 * FORCE_SCALE_FACTOR) / 2, 'G,3', 'gravity', 'start', { vx: 0, vyInternal: T3 }), ax: m3Center.x, ay: m3Center.y })
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
    labels.push({ el: addForceLabel(m1Center.x + m1Size / 2 + 8, m1Center.y - (T1 * FORCE_SCALE_FACTOR) / 2, 'S,1', 'tension', 'start', { vx: 0, vyInternal: -T1 }), ax: m1Center.x, ay: m1Center.y })
    labels.push({ el: addForceLabel(m3Center.x - m3Size / 2 - 8, m3Center.y - (T3 * FORCE_SCALE_FACTOR) / 2, 'S,3', 'tension', 'end', { vx: 0, vyInternal: -T3 }), ax: m3Center.x, ay: m3Center.y })
    // Äußere Normale: F_S,li links der linken Seilstrecke, F_S,re rechts der rechten.
    // Label an der Vektorspitze + äußere Normale, Text wächst von m₂ weg (li: end, re: start).
    const off = 30
    const nLx = T1_vec.y / T1,  nLy = -T1_vec.x / T1   // äußere Normale links
    const nRx = -T3_vec.y / T3, nRy = T3_vec.x / T3    // äußere Normale rechts
    labels.push({ el: addForceLabel(t1End.x + nLx * off, t1End.y + nLy * off, 'S,li', 'tension', 'end', { vx: T1_vec.x, vyInternal: T1_vec.y }, true), ax: m2Attach.x, ay: m2Attach.y })
    labels.push({ el: addForceLabel(t3End.x + nRx * off, t3End.y + nRy * off, 'S,re', 'tension', 'start', { vx: T3_vec.x, vyInternal: T3_vec.y }, true), ax: m2Attach.x, ay: m2Attach.y })
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

  // Winkel α (zur Horizontalen) an m₂ eintragen — Horizontale als Bezug, Bögen
  // zwischen Horizontale und Seilstrecken, α₁/α₃-Bezeichnung (nur Label, kein Wert).
  drawAngleAtM2(m2Attach, m2Size, angle1, angle3)

  // Restüberlappungen der Label-Einheiten auflösen (Massen als feste Hindernisse)
  const massObstacles = [
    { x: m1_attach.x - m1Size / 2, y: m1_attach.y, w: m1Size, h: m1Size },
    { x: m2_pos.x - m2Size / 2,    y: m2_pos.y,    w: m2Size, h: m2Size },
    { x: m3_attach.x - m3Size / 2, y: m3_attach.y, w: m3Size, h: m3Size },
  ]
  resolveLabelCollisions(labels, massObstacles)

  // Massen über die Vektoren legen (z-Order: zuletzt angehängt = oben)
  const parent = DOM.massLeftGroup.parentNode
  parent.appendChild(DOM.massLeftGroup)
  parent.appendChild(DOM.massRightGroup)
  parent.appendChild(DOM.massMiddleGroup)
}

// ── Analyse-Panel (HTML, statisches MathJax — nur textContent aktualisieren) ─
// Winkel zur Horizontalen: α₁ = 90° − γ₁ = 180° − angle1°, α₃ = 90° − γ₃ = angle3°
// (angle1/angle3 sind die Seil-Richtungen im math.-Konventionsraum ab der +x-Achse,
// siehe physics.js). γ (zur Senkrechten) bleibt die kosinussatz-native Größe.
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
  // γ = Seil-Neigungswinkel zur Senkrechten; α = Winkel zur Horizontalen = 90° − γ.
  const gamma1Deg = ((angle1 - Math.PI / 2) * 180) / Math.PI
  const gamma3Deg = ((Math.PI / 2 - angle3) * 180) / Math.PI
  const alpha1Deg = 90 - gamma1Deg
  const alpha3Deg = 90 - gamma3Deg
  DOM.leftForce.textContent = `${fmt(T1, 2)} N`
  DOM.leftAngle.textContent = `${fmt(alpha1Deg, 1)}°`
  DOM.rightForce.textContent = `${fmt(T3, 2)} N`
  DOM.rightAngle.textContent = `${fmt(alpha3Deg, 1)}°`
  DOM.verticalForcesValue.textContent = `↑ ${fmt(-T1_vec.y - T3_vec.y, 2)} N vs ↓ ${fmt(Fg2, 2)} N`
  DOM.horizontalForcesValue.textContent = `← ${fmt(-T1_vec.x, 2)} N vs → ${fmt(T3_vec.x, 2)} N`
  DOM.equilibriumWarning.style.visibility = 'hidden'
}