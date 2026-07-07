'use strict'

import { SCALE, Y_COND1, Y_CEILING, COLORS, SVG_W } from './constants.js'
import { store, DOM } from './state.js'

const SVGNS = 'http://www.w3.org/2000/svg'

function fmt(n, decimals = 2) {
  return n.toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// Kanonische Pfeilspitzen-Geometrie (siehe CLAUDE.md): Marker mit refX=0
// (Dreieck-Basis am Linien-Ende) + Schaft um Marker-Länge `by = markerWidth ·
// strokeWidth` gekürzt → Spitze exakt auf dem Zielpunkt, kein Schaft-Überstand.
// Kürzt (x2,y2) entlang (x2−x1,y2−y1); 2px-Stub für orient="auto" bei kurzen Pfeilen.
function shortenEnd(x1, y1, x2, y2, by) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy)
  if (len < 1e-6) return { x: x2, y: y2 }
  const shaft = Math.max(len - by, 2)
  return { x: x1 + dx / len * shaft, y: y1 + dy / len * shaft }
}

// Vektor-Label: Symbol kursiv via Serif-tspan + Vektor-Pfeil (Combining-Arrow
// U+20D7), optional tiefgestellter Index. Referenz: 3-Massen-Sim (T8). Fill =
// Vektorfarbe (inline); .force-label setzt Serif + stroke:none (kein Faux-Bold,
// s. CLAUDE.md-Regel). Werte werden bewußt nicht gezeigt (PO-Vorgabe).
function vecLabel(x, y, sym, color, sub = null, anchor = 'start') {
  const t = document.createElementNS(SVGNS, 'text')
  t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('class', 'force-label')
  t.setAttribute('fill', color); t.setAttribute('text-anchor', anchor)
  t.setAttribute('dominant-baseline', 'middle')
  const s = document.createElementNS(SVGNS, 'tspan')
  s.setAttribute('font-style', 'italic'); s.textContent = `${sym}⃗`   // Symbol + U+20D7
  t.appendChild(s)
  if (sub) {
    const sb = document.createElementNS(SVGNS, 'tspan')
    sb.setAttribute('dy', '0.25em'); sb.setAttribute('font-size', '0.7em'); sb.textContent = sub
    t.appendChild(sb)
  }
  return t
}

/**
 * Generates path d for a helix segment between angles t1 and t2.
 */
function getHelixSegment(t1, t2, xCenter, yStart, hPerRad, radius) {
  const steps = 12
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = t1 + (t2 - t1) * (i / steps)
    const x = xCenter + radius * Math.cos(t)
    const y = yStart + hPerRad * t
    d += (i === 0 ? 'M' : 'L') + ` ${x.toFixed(2)} ${y.toFixed(2)}`
  }
  return d
}

/**
 * Draws a 3D spring using interleaved segments for correct depth perception.
 */
function draw3DSpring(g, x, yStart, yEnd) {
  g.innerHTML = ''
  g.setAttribute('filter', 'url(#shadow)')
  
  if (!isFinite(x) || !isFinite(yStart) || !isFinite(yEnd)) return
  
  const totalH = yEnd - yStart
  const hookH = 15
  const activeH = totalH - 2 * hookH
  
  if (activeH < 5) {
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    l.setAttribute('x1', x); l.setAttribute('y1', yStart); l.setAttribute('x2', x); l.setAttribute('y2', yEnd)
    l.setAttribute('stroke', '#666'); l.setAttribute('stroke-width', '2')
    g.appendChild(l)
    return
  }

  // 1. Top Hook
  const topHook = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  topHook.setAttribute('d', `M ${x} ${Y_CEILING} L ${x} ${yStart + hookH}`)
  topHook.setAttribute('fill', 'none'); topHook.setAttribute('stroke', '#555'); topHook.setAttribute('stroke-width', '2')
  g.appendChild(topHook)

  // 2. Coils (Interleaved Rendering)
  const numCoils = 14
  const radius = 7
  const hPerRad = activeH / (numCoils * 2 * Math.PI)
  const wireWidth = 2.6

  for (let i = 0; i < numCoils; i++) {
    const tStart = i * 2 * Math.PI
    const yBase = yStart + hookH

    // Back Arc (PI to 2PI) - drawn first so it's behind
    const dBack = getHelixSegment(tStart + Math.PI, tStart + 2 * Math.PI, x, yBase, hPerRad, radius)
    const backPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    backPath.setAttribute('d', dBack); backPath.setAttribute('fill', 'none')
    backPath.setAttribute('stroke', '#333'); backPath.setAttribute('stroke-width', wireWidth * 0.8)
    g.appendChild(backPath)

    // Front Arc (0 to PI) - covers the back part
    const dFront = getHelixSegment(tStart, tStart + Math.PI, x, yBase, hPerRad, radius)
    
    // Layer 1: Front Outline (Black)
    const l1 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    l1.setAttribute('d', dFront); l1.setAttribute('fill', 'none'); l1.setAttribute('stroke-linecap', 'round')
    l1.setAttribute('stroke', '#111'); l1.setAttribute('stroke-width', wireWidth + 1.0)
    g.appendChild(l1)
    
    // Layer 2: Front Body (Metallic Gradient)
    const l2 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    l2.setAttribute('d', dFront); l2.setAttribute('fill', 'none'); l2.setAttribute('stroke-linecap', 'round')
    l2.setAttribute('stroke', 'url(#springGrad)'); l2.setAttribute('stroke-width', wireWidth)
    g.appendChild(l2)
    
    // Layer 3: Front Highlight (Subtle White)
    const l3 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    l3.setAttribute('d', dFront); l3.setAttribute('fill', 'none'); l3.setAttribute('stroke-linecap', 'round')
    l3.setAttribute('stroke', '#fff'); l3.setAttribute('stroke-width', wireWidth * 0.3); l3.setAttribute('stroke-opacity', '0.5')
    g.appendChild(l3)
  }

  // 3. Bottom Hook
  const botHook = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  botHook.setAttribute('d', `M ${x + radius} ${yEnd - hookH} L ${x} ${yEnd}`)
  botHook.setAttribute('fill', 'none'); botHook.setAttribute('stroke', '#555'); botHook.setAttribute('stroke-width', '2')
  g.appendChild(botHook)
}

/**
 * Helper to set multi-line text in SVG using tspan.
 */
function setMultiLineLabel(id, line1, line2, x, y, dy = 14) {
  const el = document.getElementById(id)
  if (!el) return
  el.setAttribute('x', x)
  el.setAttribute('y', y)
  el.innerHTML = `<tspan x="${x}" dy="0">${line1}</tspan>` +
                 `<tspan x="${x}" dy="${dy}">${line2}</tspan>`
}

export function updateFlow() {
  const g = DOM.flow_g
  g.innerHTML = ''
  if (!store.showFlow || store.current <= 0) return

  const y1 = Y_COND1; const y2 = Y_COND1 - store.distance * SCALE
  const visualLength = Math.min(store.length * 120, 600)
  const xStart = (SVG_W - visualLength) / 2
  const numParticles = 8; const spacing = visualLength / numParticles
  const isPhys = store.directionMode === 'physical'; const isParallel = store.currentFlowMode === 'parallel'
  const offset = (store.flowTime * 60 * (store.current > 500 ? 0.01 : 0.025)) % spacing

  const yArr = [y1, y2]
  yArr.forEach((y, idx) => {
    let flowDir = isPhys ? -1 : 1
    if (idx === 1 && !isParallel) flowDir *= -1 
    for (let i = -1; i <= numParticles; i++) {
      const x = xStart + i * spacing + offset * flowDir
      if (x >= xStart && x <= xStart + visualLength) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        group.setAttribute('transform', `translate(${x}, ${y})`)
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        circle.setAttribute('r', '4.5'); circle.setAttribute('fill', isPhys ? COLORS.CURRENT_PHYS : COLORS.VEL)
        circle.setAttribute('stroke', '#fff4'); circle.setAttribute('stroke-width', '0.5')
        group.appendChild(circle)
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        label.setAttribute('text-anchor', 'middle'); label.setAttribute('dy', '3.5'); label.setAttribute('font-size', '9'); label.setAttribute('font-weight', 'bold'); label.setAttribute('fill', '#fff'); label.setAttribute('font-family', 'sans-serif')
        label.textContent = isPhys ? '−' : '+'
        group.appendChild(label)
        g.appendChild(group)
      }
    }
  })
}

export function updateScene() {
  const y2 = Y_COND1 - store.distance * SCALE
  const visualLength = Math.min(store.length * 120, 600)
  const xStart = (SVG_W - visualLength) / 2
  const h = 4 * Math.sqrt(store.crossSection) 
  const ry = h / 2

  // 1. Conductors & Labels
  document.getElementById('cond1').setAttribute('x', xStart); document.getElementById('cond1').setAttribute('width', visualLength)
  document.getElementById('cond1').setAttribute('height', h); document.getElementById('cond1').setAttribute('y', Y_COND1 - ry); document.getElementById('cond1').setAttribute('rx', ry)
  setMultiLineLabel('label_cond1', 'Kupferleitung 1', '(fixiert)', SVG_W / 2, Y_COND1 + ry + 25)
  
  document.getElementById('cond2').setAttribute('x', xStart); document.getElementById('cond2').setAttribute('width', visualLength)
  document.getElementById('cond2').setAttribute('height', h); document.getElementById('cond2').setAttribute('y', y2 - ry); document.getElementById('cond2').setAttribute('rx', ry)
  setMultiLineLabel('label_cond2', 'Kupferleitung 2', '(beweglich)', SVG_W / 2, y2 - ry - 38)

  // 2. Springs (Interleaved 3D)
  const springX1 = xStart + visualLength * 0.15
  const springX2 = xStart + visualLength * 0.85
  draw3DSpring(DOM.spring1_g, springX1, Y_CEILING, y2 - ry)
  draw3DSpring(DOM.spring2_g, springX2, Y_CEILING, y2 - ry)

  // 3. Leads
  DOM.lead1_l.setAttribute('d', `M ${xStart} ${Y_COND1} L ${xStart} 480`)
  DOM.lead1_r.setAttribute('d', `M ${xStart + visualLength} ${Y_COND1} L ${xStart + visualLength} 480`)
  DOM.lead2_l.setAttribute('d', `M ${xStart} ${y2} L ${xStart} 0`)
  DOM.lead2_r.setAttribute('d', `M ${xStart + visualLength} ${y2} L ${xStart + visualLength} 0`)

  // 4. Flow
  updateFlow()

  // 5. Vectors
  DOM.vectors_g.innerHTML = ''
  if (store.showCurrent && store.current > 0) {
    const isPhys = store.directionMode === 'physical'; const isParallel = store.currentFlowMode === 'parallel'
    const color = isPhys ? COLORS.CURRENT_PHYS : COLORS.CURRENT; const marker = isPhys ? 'url(#arr-current-phys)' : 'url(#arr-current)'
    for (let i = 0; i < 2; i++) {
      const y = (i === 0) ? Y_COND1 : y2
      let dir = isPhys ? -1 : 1; if (i === 1 && !isParallel) dir *= -1
      const labelX = xStart + visualLength * 0.25
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      // Schaft um Marker-Länge (7·2) kürzen → refX=0-Spitze landet exakt bei labelX+20·dir.
      const cEnd = shortenEnd(labelX - 20 * dir, y, labelX + 20 * dir, y, 7 * 2)
      path.setAttribute('d', `M ${labelX - 20 * dir} ${y} L ${cEnd.x} ${cEnd.y}`)
      path.setAttribute('stroke', color); path.setAttribute('stroke-width', '2'); path.setAttribute('marker-end', marker)
      DOM.vectors_g.appendChild(path)
      const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      lbl.setAttribute('x', labelX + 25 * dir); lbl.setAttribute('y', y - 6 - ry)
      lbl.setAttribute('fill', color); lbl.setAttribute('font-size', '10'); lbl.setAttribute('font-style', 'italic'); lbl.textContent = isPhys ? 'e-' : 'I'
      DOM.vectors_g.appendChild(lbl)
    }
  }

  // 6. Forces (Logarithmic)
  if (store.showForces && store.forceL > 0) {
    const isParallel = store.currentFlowMode === 'parallel'
    const fl_len = 30 + 30 * Math.log10(1 + store.forceL * 200)
    const dynamicWidth = 0.8 + 1.0 * Math.log10(1 + store.forceL * 100)
    const forceX = xStart + visualLength * 0.75
    const fDir = isParallel ? 1 : -1
    const fl_line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    // Schaft um Marker-Länge (7·dynamicWidth) kürzen → refX=0-Spitze auf dem Kraft-Endpunkt.
    const flEnd = shortenEnd(forceX, y2 + fDir * ry, forceX, y2 + fDir * (ry + fl_len), 7 * dynamicWidth)
    fl_line.setAttribute('x1', forceX); fl_line.setAttribute('y1', y2 + fDir * ry); fl_line.setAttribute('x2', flEnd.x); fl_line.setAttribute('y2', flEnd.y)
    fl_line.setAttribute('stroke', COLORS.FORCE_L); fl_line.setAttribute('stroke-width', dynamicWidth); fl_line.setAttribute('marker-end', 'url(#arr-fl)')
    DOM.vectors_g.appendChild(fl_line)
    // Kraft-Label F⃗_L (T8, 3-Massen-Notation) — nur Symbol mit Pfeil, kein Wert.
    DOM.vectors_g.appendChild(vecLabel(forceX + 8, y2 + fDir * (ry + fl_len + 10), 'F', COLORS.FORCE_L, 'L'))
    const sDir = isParallel ? -1 : 1; const fs_len = fl_len / 2
    for (let x of [springX1, springX2]) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      const fsEnd = shortenEnd(x, y2 + sDir * ry, x, y2 + sDir * (ry + fs_len), 7 * dynamicWidth)
      line.setAttribute('x1', x); line.setAttribute('y1', y2 + sDir * ry); line.setAttribute('x2', x); line.setAttribute('y2', fsEnd.y)
      line.setAttribute('stroke', COLORS.FORCE_S); line.setAttribute('stroke-width', dynamicWidth); line.setAttribute('marker-end', 'url(#arr-fs)')
      DOM.vectors_g.appendChild(line)
      DOM.vectors_g.appendChild(vecLabel(x + 8, y2 + sDir * (ry + fs_len + 10), 'F', COLORS.FORCE_S, 'S'))
    }
  }

  // 7. Intelligent Gauges
  let maxU = 10; if (store.voltage < 2) maxU = 2;
  DOM.v_marker_1.textContent = fmt(maxU / 2, 1); DOM.v_marker_2.textContent = maxU + 'V'
  let maxI = 1000; if (store.current < 20) maxI = 20; else if (store.current < 100) maxI = 100; else if (store.current < 500) maxI = 500;
  DOM.i_marker_1.textContent = fmt(maxI / 2, 0); DOM.i_marker_2.textContent = maxI + 'A'
  DOM.v_gauge_fill.style.width = `${Math.min((store.voltage / maxU) * 100, 100)}%`
  DOM.i_gauge_fill.style.width = `${Math.min((store.current / maxI) * 100, 100)}%`
  DOM.v_gauge_val.textContent = fmt(store.voltage, 2) + ' V'; DOM.i_gauge_val.textContent = fmt(store.current, 2) + ' A'
  
  DOM.res_val.innerHTML = `\\( ${fmt(store.resistance, 4)} \\, \\Omega \\)`
  DOM.cur_val.innerHTML = `\\( ${fmt(store.current, 2)} \\, \\text{A} \\)`
  DOM.force_val.innerHTML = `\\( ${fmt(store.forceL, 4)} \\, \\text{N} \\)`
  DOM.dist_curr_val.innerHTML = `\\( ${fmt(store.distance, 1)} \\, \\text{mm} \\)`
  DOM.delta_y_val.innerHTML = `\\( ${fmt(store.deltaY, 2)} \\, \\text{mm} \\)`
  if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise()
  if (store.distance <= 10) { DOM.status_label.textContent = 'KOLLISION!'; DOM.status_label.style.color = 'var(--c-acc)' }
  else { DOM.status_label.textContent = 'STATISCH (GLEICHGEWICHT)'; DOM.status_label.style.color = 'var(--text3)' }
}

export function initRender() {
  DOM.spring1_g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); DOM.springs_g.appendChild(DOM.spring1_g)
  DOM.spring2_g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); DOM.springs_g.appendChild(DOM.spring2_g)
}
