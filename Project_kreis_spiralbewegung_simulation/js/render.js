'use strict'

import {
  ANIM_CX, ANIM_CY, COORD_AXIS_LEN, DEFAULT_PIXELS_PER_METER,
  VEL_SCALE, ACC_SCALE, OMEGA_LEN_FACTOR, ALPHA_LEN_FACTOR, ISO_ANGLE,
  WATCH_TX, WATCH_TY, WATCH_SCALE, WATCH_CX, WATCH_CY, WATCH_R, WATCH_HAND_LEN,
  ZOOM_TEXT_X, ZOOM_TEXT_Y,
  PAD_L, PAD_R, PAD_T, PAD_B,
  quantities, quantityUnits, quantitySymbols, graphOptions, graphTitles,
} from './constants.js'
import { store, DOM } from './state.js'
import { niceStepLE, tAxisStep, interpolateAt, linePlotIndex, radiusAt } from './physics.js'
import { fmt } from '../../shared/js/format.js'
export { fmt }

const NS = 'http://www.w3.org/2000/svg'

function el(tag, attrs) {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  return e
}

// SVG-Text aus HTML-<i>-Tags (Symbol kursiv, Rest upright)
function createStyledSvgText(svgEl, text) {
  while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild)
  const regex = /<i>(.*?)<\/i>|([^<>&]+)/g
  let m
  while ((m = regex.exec(text)) !== null) {
    if (m[1]) {
      const t = el('tspan', { 'font-style': 'italic' })
      t.textContent = m[1]
      svgEl.appendChild(t)
    } else if (m[2]) {
      svgEl.appendChild(document.createTextNode(m[2]))
    }
  }
}

// Achsenbeschriftung: 'Größe / Einheit' → Größe italic, Einheit upright
function setAxisLabel(textEl, text) {
  while (textEl.firstChild) textEl.removeChild(textEl.firstChild)
  const sep = text.indexOf(' / ')
  if (sep === -1) { textEl.textContent = text; return }
  const qty = el('tspan', { 'font-style': 'italic' })
  qty.textContent = text.slice(0, sep)
  textEl.appendChild(qty)
  const unit = el('tspan', {})
  unit.textContent = text.slice(sep)
  textEl.appendChild(unit)
}

// Graph-Titel: letztes Wort (Symbol) italic
function setGraphTitle(textEl, text) {
  while (textEl.firstChild) textEl.removeChild(textEl.firstChild)
  const sep = text.lastIndexOf(' ')
  if (sep === -1) { textEl.textContent = text; return }
  const main = el('tspan', {})
  main.textContent = text.slice(0, sep + 1)
  textEl.appendChild(main)
  const sym = el('tspan', { 'font-style': 'italic' })
  sym.textContent = text.slice(sep + 1)
  textEl.appendChild(sym)
}

// Pfeilspitze kanonisch: refX=0 + Schaft um Marker-Länge kürzen → Spitze auf Ziel
function shortenEnd(x1, y1, x2, y2, by) {
  if (!(by > 0)) return { x2, y2 }
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len <= by) return { x2, y2 }
  return { x2: x2 - (dx / len) * by, y2: y2 - (dy / len) * by }
}

const ARROW_LEN_MAIN = 5 * 2.5    // Hauptvektoren sw=2,5 → 12,5 px
const ARROW_LEN_ACC = 5 * 3       // Beschleunigung sw=3 → 15 px
const ARROW_LEN_POLAR = 5 * 2     // Polar-Komponenten sw=2 → 10 px

// ── Koordinatentransformation (zentral) ──────────────────────────────────────
function projectISO(x, y, z) {
  const s = store.currentPixelsPerMeter
  const ca = Math.cos(ISO_ANGLE), sa = Math.sin(ISO_ANGLE)
  return {
    x: ANIM_CX - x * s * ca + y * s * ca,
    y: ANIM_CY + x * s * sa + y * s * sa - z * s,
  }
}

export function physToScreen(x, y, z = 0) {
  if (store.currentView === '2D') {
    return { x: ANIM_CX + x * store.currentPixelsPerMeter, y: ANIM_CY - y * store.currentPixelsPerMeter }
  }
  return projectISO(x, y, z)
}

// ── Hintergrund (statisch, je Reset/Theme) ───────────────────────────────────
export function drawBackground() {
  const isISO = store.currentView === 'ISO'
  DOM.isoViewElements.style.visibility = isISO ? 'visible' : 'hidden'
  DOM.view2dElements.style.visibility = isISO ? 'hidden' : 'visible'

  if (isISO) {
    const AXIS_LEN = 1.8
    const O = projectISO(0, 0, 0)
    const X = projectISO(AXIS_LEN, 0, 0)
    const Y = projectISO(0, AXIS_LEN, 0)
    const Z = projectISO(0, 0, AXIS_LEN)
    DOM.isoAxisX.setAttribute('x1', O.x); DOM.isoAxisX.setAttribute('y1', O.y)
    DOM.isoAxisX.setAttribute('x2', X.x); DOM.isoAxisX.setAttribute('y2', X.y)
    DOM.isoAxisY.setAttribute('x1', O.x); DOM.isoAxisY.setAttribute('y1', O.y)
    DOM.isoAxisY.setAttribute('x2', Y.x); DOM.isoAxisY.setAttribute('y2', Y.y)
    DOM.isoAxisZ.setAttribute('x1', O.x); DOM.isoAxisZ.setAttribute('y1', O.y)
    DOM.isoAxisZ.setAttribute('x2', Z.x); DOM.isoAxisZ.setAttribute('y2', Z.y)
    DOM.isoLabelX.setAttribute('x', X.x - 15); DOM.isoLabelX.setAttribute('y', X.y + 10)
    DOM.isoLabelY.setAttribute('x', Y.x + 10); DOM.isoLabelY.setAttribute('y', Y.y + 10)
    DOM.isoLabelZ.setAttribute('x', Z.x - 10); DOM.isoLabelZ.setAttribute('y', Z.y - 5)
    // Iso-Kreis (Bahn in der Höhenebene h)
    const R_circ = store.motionMode === 'spirale' ? (store.R0 > 0 ? store.R0 : 0) : store.R0
    let d = ''
    const seg = 100
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * 2 * Math.PI
      const p = projectISO(R_circ * Math.cos(a), R_circ * Math.sin(a), store.h)
      d += (i === 0 ? 'M ' : ' L ') + `${p.x} ${p.y}`
    }
    DOM.isoCirclePath.setAttribute('d', d)
  } else {
    DOM.coordSystem2d.innerHTML = ''
    const attrs = { stroke: 'var(--text)', 'stroke-opacity': '0.5', 'stroke-width': 1.5, 'marker-end': 'url(#arrowhead)' }
    DOM.coordSystem2d.appendChild(el('line', { ...attrs, x1: ANIM_CX - COORD_AXIS_LEN, y1: ANIM_CY, x2: ANIM_CX + COORD_AXIS_LEN, y2: ANIM_CY }))
    const xLab = el('text', { x: ANIM_CX + COORD_AXIS_LEN + 10, y: ANIM_CY + 4, class: 'axis-label' })
    createStyledSvgText(xLab, '<i>x</i>')
    DOM.coordSystem2d.appendChild(xLab)
    DOM.coordSystem2d.appendChild(el('line', { ...attrs, x1: ANIM_CX, y1: ANIM_CY + COORD_AXIS_LEN, x2: ANIM_CX, y2: ANIM_CY - COORD_AXIS_LEN }))
    const yLab = el('text', { x: ANIM_CX - 10, y: ANIM_CY - COORD_AXIS_LEN - 5, class: 'axis-label' })
    createStyledSvgText(yLab, '<i>y</i>')
    DOM.coordSystem2d.appendChild(yLab)
  }

  // Disk (nur 2D sichtbar — im ISO via view_2d hidden)
  DOM.disk.setAttribute('cx', ANIM_CX)
  DOM.disk.setAttribute('cy', ANIM_CY)
  DOM.disk.setAttribute('r', store.R0 * store.currentPixelsPerMeter)
  DOM.disk.style.transformOrigin = `${ANIM_CX}px ${ANIM_CY}px`

  drawStopwatchMarks()
  DOM.trajectoryPath.setAttribute('d', '')
}

function drawStopwatchMarks() {
  DOM.stopwatchMarks.innerHTML = ''
  for (let s = 0; s < 60; s++) {
    const a = (s / 60) * 2 * Math.PI
    const rIn = (s % 5 === 0) ? WATCH_R - 8 : WATCH_R - 5
    DOM.stopwatchMarks.appendChild(el('line', {
      x1: WATCH_CX + rIn * Math.sin(a), y1: WATCH_CY - rIn * Math.cos(a),
      x2: WATCH_CX + WATCH_R * Math.sin(a), y2: WATCH_CY - WATCH_R * Math.cos(a),
      class: 'sw-mark', 'stroke-width': s % 5 === 0 ? 2 : 1,
    }))
  }
}

// ── Phi-Winkelbogen ──────────────────────────────────────────────────────────
function drawPhiArc(phiRad, R_t) {
  if (!store.togPhi || Math.abs(phiRad) < 1e-3) { DOM.phiArcGroup.style.visibility = 'hidden'; return }
  const arcRPhys = R_t * 0.65
  if (arcRPhys < 0.1) { DOM.phiArcGroup.style.visibility = 'hidden'; return }
  DOM.phiArcGroup.style.visibility = 'visible'
  const phiVis = phiRad % (2 * Math.PI)

  if (store.currentView === '2D') {
    const arcRPx = arcRPhys * store.currentPixelsPerMeter
    const sx = ANIM_CX + arcRPx, sy = ANIM_CY
    const ex = ANIM_CX + arcRPx * Math.cos(phiVis), ey = ANIM_CY - arcRPx * Math.sin(phiVis)
    const large = Math.abs(phiVis) > Math.PI ? 1 : 0
    const sweep = phiVis >= 0 ? 0 : 1
    DOM.phiArc.setAttribute('d', `M ${sx} ${sy} A ${arcRPx} ${arcRPx} 0 ${large} ${sweep} ${ex} ${ey}`)
    const la = phiVis / 2
    const lr = arcRPx > 20 ? arcRPx - 15 : arcRPx + 5
    DOM.phiLabel.setAttribute('x', ANIM_CX + lr * Math.cos(la))
    DOM.phiLabel.setAttribute('y', ANIM_CY - lr * Math.sin(la) + 5)
  } else {
    let d = ''
    const seg = 30
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * phiVis
      const p = projectISO(arcRPhys * Math.cos(a), arcRPhys * Math.sin(a), store.h)
      d += (i === 0 ? 'M ' : ' L ') + `${p.x} ${p.y}`
    }
    DOM.phiArc.setAttribute('d', d)
    const la = phiVis / 2
    const lr = arcRPhys * 1.15
    const p = projectISO(lr * Math.cos(la), lr * Math.sin(la), store.h)
    DOM.phiLabel.setAttribute('x', p.x); DOM.phiLabel.setAttribute('y', p.y)
  }
}

// ── Vektoren + Zerlegung ─────────────────────────────────────────────────────
function drawVectors(P, R_t) {
  // Alle Vektoren (+ Komponentengruppe) + Phi-Gruppe erst verbergen, dann selektiv
  // anzeigen. [id*="_vector"] greift auch die _x/_y/_r/_t-Komponenten sowie die
  // vector_components_group; Kind-visibility:visible überdeckt Eltern:hidden.
  DOM.animationGroup.querySelectorAll('[id*="_vector"], #phi_arc_group').forEach(e => { e.style.visibility = 'hidden' })

  drawPhiArc(P.phiRad, R_t)

  const P_POINT = physToScreen(P.x, P.y, P.z)
  const P_ORIGIN = physToScreen(0, 0, 0)
  const P_CENTER = physToScreen(0, 0, P.z)
  const vScale = VEL_SCALE * store.zoomFactor
  const aScale = ACC_SCALE * store.zoomFactor

  const setMain = (lineEl, x1, y1, x2, y2, by) => {
    const s = shortenEnd(x1, y1, x2, y2, by)
    lineEl.setAttribute('x1', x1); lineEl.setAttribute('y1', y1)
    lineEl.setAttribute('x2', s.x2); lineEl.setAttribute('y2', s.y2)
    lineEl.style.visibility = 'visible'
  }

  if (store.togPosition) {
    setMain(DOM.positionVector, P_ORIGIN.x, P_ORIGIN.y, P_POINT.x, P_POINT.y, ARROW_LEN_MAIN)
    if (store.rDecomp === 'xy' && store.currentView === '2D') {
      const PX = physToScreen(P.x, 0, P.z)
      DOM.positionVectorX.setAttribute('x1', P_ORIGIN.x); DOM.positionVectorX.setAttribute('y1', P_ORIGIN.y)
      DOM.positionVectorX.setAttribute('x2', PX.x); DOM.positionVectorX.setAttribute('y2', P_ORIGIN.y)
      DOM.positionVectorY.setAttribute('x1', PX.x); DOM.positionVectorY.setAttribute('y1', P_ORIGIN.y)
      DOM.positionVectorY.setAttribute('x2', P_POINT.x); DOM.positionVectorY.setAttribute('y2', P_POINT.y)
      DOM.positionVectorX.style.visibility = 'visible'
      DOM.positionVectorY.style.visibility = 'visible'
    }
  }

  if (store.togVelocity) {
    const PVE = physToScreen(P.x + P.vx * vScale, P.y + P.vy * vScale, P.z)
    setMain(DOM.velocityVector, P_POINT.x, P_POINT.y, PVE.x, PVE.y, ARROW_LEN_MAIN)
    DOM.velocityVector.style.opacity = (store.vDecomp === 'none') ? '1.0' : '0.4'
    if (store.vDecomp === 'xy' && store.currentView === '2D') {
      DOM.velocityVectorX.setAttribute('x1', P_POINT.x); DOM.velocityVectorX.setAttribute('y1', P_POINT.y)
      DOM.velocityVectorX.setAttribute('x2', PVE.x); DOM.velocityVectorX.setAttribute('y2', P_POINT.y)
      DOM.velocityVectorY.setAttribute('x1', PVE.x); DOM.velocityVectorY.setAttribute('y1', P_POINT.y)
      DOM.velocityVectorY.setAttribute('x2', PVE.x); DOM.velocityVectorY.setAttribute('y2', PVE.y)
      DOM.velocityVectorX.style.visibility = 'visible'
      DOM.velocityVectorY.style.visibility = 'visible'
    } else if (store.vDecomp === 'polar' && store.currentView === '2D') {
      const rLen = Math.hypot(P.x, P.y)
      const ux = rLen > 0 ? P.x / rLen : 0, uy = rLen > 0 ? P.y / rLen : 0
      const PVR = physToScreen(P.x + ux * store.vr * vScale, P.y + uy * store.vr * vScale, P.z)
      setMain(DOM.velocityVectorR, P_POINT.x, P_POINT.y, PVR.x, PVR.y, ARROW_LEN_POLAR)
      if (Math.abs(store.vr) > 1e-6) DOM.velocityVectorR.style.visibility = 'visible'
      const vtMag = R_t * P.omegaRad
      const tx = -uy, ty = ux
      const PVT = physToScreen(P.x + tx * vtMag * vScale, P.y + ty * vtMag * vScale, P.z)
      setMain(DOM.velocityVectorT, P_POINT.x, P_POINT.y, PVT.x, PVT.y, ARROW_LEN_POLAR)
      if (Math.abs(vtMag) > 1e-6) DOM.velocityVectorT.style.visibility = 'visible'
    }
  }

  if (store.togAcceleration) {
    const PAE = physToScreen(P.x + P.ax * aScale, P.y + P.ay * aScale, P.z)
    setMain(DOM.accelerationVector, P_POINT.x, P_POINT.y, PAE.x, PAE.y, ARROW_LEN_ACC)
    DOM.accelerationVector.style.opacity = (store.aDecomp === 'none') ? '1.0' : '0.4'
    if (store.aDecomp === 'xy' && store.currentView === '2D') {
      DOM.accelerationVectorX.setAttribute('x1', P_POINT.x); DOM.accelerationVectorX.setAttribute('y1', P_POINT.y)
      DOM.accelerationVectorX.setAttribute('x2', PAE.x); DOM.accelerationVectorX.setAttribute('y2', P_POINT.y)
      DOM.accelerationVectorY.setAttribute('x1', PAE.x); DOM.accelerationVectorY.setAttribute('y1', P_POINT.y)
      DOM.accelerationVectorY.setAttribute('x2', PAE.x); DOM.accelerationVectorY.setAttribute('y2', PAE.y)
      DOM.accelerationVectorX.style.visibility = 'visible'
      DOM.accelerationVectorY.style.visibility = 'visible'
    } else if (store.aDecomp === 'polar' && store.currentView === '2D') {
      const rLen = Math.hypot(P.x, P.y)
      const ux = rLen > 0 ? P.x / rLen : 0, uy = rLen > 0 ? P.y / rLen : 0
      const PAR = physToScreen(P.x - ux * P.arMag * aScale, P.y - uy * P.arMag * aScale, P.z)
      setMain(DOM.accelerationVectorR, P_POINT.x, P_POINT.y, PAR.x, PAR.y, ARROW_LEN_POLAR)
      if (Math.abs(P.arMag) > 1e-6) DOM.accelerationVectorR.style.visibility = 'visible'
      if (Math.abs(P.atMag) > 1e-6) {
        const tx = -uy, ty = ux
        const atSign = Math.sign(store.alpha_rad)
        const f = store.scaleAt ? 10.0 : 1.0
        const PAT = physToScreen(P.x + atSign * tx * P.atMag * aScale * f, P.y + atSign * ty * P.atMag * aScale * f, P.z)
        setMain(DOM.accelerationVectorT, P_POINT.x, P_POINT.y, PAT.x, PAT.y, ARROW_LEN_POLAR)
        DOM.accelerationVectorT.style.visibility = 'visible'
      }
    }
  }

  if (store.currentView === 'ISO') {
    if (store.togOmega) {
      const len = Math.sign(P.omegaDeg) * Math.abs(P.omegaDeg) * OMEGA_LEN_FACTOR
      const PE = projectISO(0, 0, P.z + len)
      setMain(DOM.omegaVector, P_CENTER.x, P_CENTER.y, PE.x, PE.y, ARROW_LEN_MAIN)
    }
    if (store.togAlpha && store.alpha_rad !== 0) {
      const len = Math.sign(store.alpha_rad) * Math.abs(P.alphaDeg) * ALPHA_LEN_FACTOR
      const PE = projectISO(0, 0, P.z + len)
      setMain(DOM.alphaVector, P_CENTER.x, P_CENTER.y, PE.x, PE.y, ARROW_LEN_MAIN)
    }
  }
}

// ── Live-Analyse-Panel ───────────────────────────────────────────────────────
function angleDisplay(qq, valDeg) {
  if (!['phi', 'omega', 'alpha'].includes(qq)) return { val: valDeg, unit: quantityUnits[qq] }
  if (store.angleUnit === 'rad') {
    const u = qq === 'phi' ? 'rad' : (qq === 'omega' ? 'rad/s' : 'rad/s²')
    return { val: valDeg * Math.PI / 180, unit: u }
  }
  return { val: valDeg, unit: quantityUnits[qq] }
}

function updateAnalysisPanel(P) {
  quantities.forEach(qq => {
    if (!DOM.live[qq]) return
    const { val, unit } = angleDisplay(qq, P[qq])
    DOM.live[qq].textContent = `${fmt(val, 2)} ${unit}`
  })
}

// ── Diagramm zeichnen ────────────────────────────────────────────────────────
// Graph-Format paßt sich ans Layout an (CLAUDE.md „Diagramm-Format pro Layout").
// Maße pro Orientierung übernommen aus Kreisbewegung v1.0.10 — das bewährt sich
// dort und füllt die Zelle: das BREITE Landscape (700×410) füllt die gestapelte
// (breite, flache) Zelle, das PORTRAIT (410×700) die hohe Split-Zelle. (Mein
// früher 480×430 war fast quadratisch → wirkte im untereinander-Modus „3:4",
// füllte die Breite nicht.) Dual teilt die Gesamthöhe in 2 Slots + Gap (wie
// Kreisbewegung); Single nutzt die volle Höhe.
// Orientierung (Landscape/Portrait) wird aus der TATSÄCHLICHEN Zell-Form
// abgeleitet (getBoundingClientRect), nicht nur aus store.layoutSplit — so greift
// der @media-Fallback (≤1100 px erzwingt gestapelt = breite Zelle) automatisch
// zu Landscape; ein Fenster-Resize paßt live nach. Ticks rechnen pro Format neu.
const LAND_W = 700, LAND_H_SINGLE = 410, LAND_SLOT_DUAL = 200   // gestapelt
const PORT_W = 410, PORT_H_SINGLE = 700, PORT_SLOT_DUAL = 345   // nebeneinander
const DUAL_GAP = 10
// Vorschau-Spanne für die dynamische Achsenskalierung (B9): am Start (und solange
// die Kurve diesen Punkt noch nicht erreicht hat) zeigt der Graph ein festes
// Fenster 0..T_PREVIEW × (Wertebereich bis T_PREVIEW) — eine sinnvolle, stabile
// Anfangsansicht statt der vorskalierten Vollspanne (φ≈6000°) oder eines abrupt
// winzigen Mini-Fensters. Erst wenn die Kurve T_PREVIEW erreicht, beginnt der
// dynamische Auto-Range (Achsen wachsen mit). PO-Vorgabe „sagen wir 3 s".
const GRAPH_T_PREVIEW = 3

function graphGeom() {
  const dual = store.diagramMode === '2'
  const rect = DOM.graphSvg.getBoundingClientRect()
  const cellW = rect.width || 600
  const cellH = rect.height || LAND_H_SINGLE
  const landscape = cellW >= cellH                                  // breite Zelle
  const w = landscape ? LAND_W : PORT_W
  const hSingle = landscape ? LAND_H_SINGLE : PORT_H_SINGLE
  const slotDual = landscape ? LAND_SLOT_DUAL : PORT_SLOT_DUAL
  const hEach = dual ? slotDual : hSingle
  const totalH = dual ? slotDual * 2 + DUAL_GAP : hSingle
  return { w, h: totalH, hEach, dual, gap: DUAL_GAP }
}

function yUnitString(qq) {
  if (['phi', 'omega', 'alpha'].includes(qq)) {
    let u = store.angleUnit === 'rad' ? 'rad' : '°'
    if (qq === 'omega') u += '/s'
    if (qq === 'alpha') u += '/s²'
    return u
  }
  if (qq === 'x' || qq === 'y') return 'm'
  if (qq.startsWith('v')) return 'm/s'
  if (qq.startsWith('a') || qq === 'ar' || qq === 'at') return 'm/s²'
  return ''
}

// Auto-Range für Y: min/max über den bisher geplotteten Daten-Abschnitt [0..n),
// mit derselben typspezifischen Padding wie computeAxisLimits (Beteiligung von 0
// bei Betrags-/Symmetrie-Größen, kleiner Bereich um konstante Werte). cf = rad-Faktor.
const MAGNITUDE_Q = ['ar', 'at', 'vabs', 'aabs']
const SYMMETRIC_Q = ['x', 'y', 'vx', 'vy', 'ax', 'ay']
function plottedValueRange(qq, data, n, cf) {
  let rawMin = Infinity, rawMax = -Infinity
  for (let i = 0; i < n; i++) { const v = data[i] * cf; if (v < rawMin) rawMin = v; if (v > rawMax) rawMax = v }
  const range = rawMax - rawMin
  const pad = range < 1e-9 ? Math.max(Math.abs(rawMax || 0) * 0.1, 1) : range * 0.1
  let min, max
  if (MAGNITUDE_Q.includes(qq)) {
    min = 0; max = rawMax + pad                                              // 0..max+pad
  } else if (SYMMETRIC_Q.includes(qq)) {
    min = rawMin - pad; max = rawMax + pad
    if (min > 0) min = -pad                                                  // 0 im Sichtbereich
    if (max < 0) max = pad
  } else {                                                                   // φ/ω/α
    if (rawMin >= 0) { min = Math.max(0, rawMin - pad); max = rawMax + pad }
    else if (rawMax <= 0) { min = rawMin - pad; max = Math.min(0, rawMax + pad) }
    else { min = rawMin - pad; max = rawMax + pad }
  }
  return { min, max }
}

function drawGraph(idx, time, geom) {
  const group = idx === 1 ? DOM.graphGroup1 : DOM.graphGroup2
  group.innerHTML = ''
  if (idx === 2 && !geom.dual) return

  const qq = idx === 1 ? store.graphType1 : store.graphType2
  const limits = store.axisLimits[qq]
  if (!limits) return

  const G_W = geom.w
  const plotW = G_W - PAD_L - PAD_R
  const plotH = geom.hEach - PAD_T - PAD_B

  const isAngular = ['phi', 'omega', 'alpha'].includes(qq)
  const cf = (isAngular && store.angleUnit === 'rad') ? Math.PI / 180 : 1.0

  const data = store.fullData[`p_${qq}`]
  const tArr = store.fullData.t
  const tEnd = tArr.length ? tArr[tArr.length - 1] : 0
  const plotIndex = linePlotIndex(time)

  // ── Dynamische Achsenskalierung (B9): Auto-Range auf den bisher geplotteten
  //    Bereich — X (Zeit) bis zur aktuellen Sim-Zeit, Y (Wert) min/max über die
  //    geplotteten Daten, beides auf Nice-Steps gerundet. Der Graph füllt sofort
  //    die Fläche und zeigt aktuelle Werte in lesbarer Skala, statt auf den
  //    Endwert (z. B. φ≈6000°) vorskaliert lange leer zu bleiben. Beide Achsen
  //    wachsen mit; am Ende (volle Spanne) identisch zur Vorausberechnung.
  //
  //    Vorschauphase: Am Start (und solange die Kurve T_PREVIEW noch nicht
  //    erreicht hat) festes Fenster 0..T_PREVIEW × (Wertebereich bis T_PREVIEW)
  //    — stabile, sinnvolle Anfangsansicht statt Vollspanne oder abruptem
  //    Mini-Fenster. Erst wenn die Kurve T_PREVIEW erreicht, beginnt der
  //    dynamische Auto-Range (kein Sprung: am Übergang dieselben Daten → dieselbe
  //    Skala). Bei kurzen Läufen (T_PREVIEW≥tEnd) bleibt die ganze Spanne fest.
  const T_PREVIEW = Math.min(GRAPH_T_PREVIEW, tEnd)
  const previewIdx = Math.max(2, linePlotIndex(T_PREVIEW))
  const inPreview = time < T_PREVIEW - 1e-9 || plotIndex < 2

  let tMaxAxis, valMin, valMax
  if (inPreview) {
    // Feste Vorschau: 0..T_PREVIEW, Y = Bereich über [0, T_PREVIEW]
    tMaxAxis = T_PREVIEW
    const yr = plottedValueRange(qq, data, previewIdx, cf)
    valMin = yr.min; valMax = yr.max
  } else {
    // Dynamisch: Auto-Range auf den geplotteten Bereich (wachsend)
    tMaxAxis = Math.max(time, tArr[plotIndex - 1])
    const yr = plottedValueRange(qq, data, plotIndex, cf)
    valMin = yr.min; valMax = yr.max
  }
  if (tMaxAxis < 1e-6) tMaxAxis = T_PREVIEW || 1

  const scaleT = t => PAD_L + (t / (tMaxAxis || 1)) * plotW
  const scaleY = v => PAD_T + plotH - ((v - valMin) / ((valMax - valMin) || 1)) * plotH
  const xAxisY = PAD_T + plotH
  // Abszisse bei y=0, wenn 0 im Wertebereich liegt; sonst am unteren Rand
  // (rein positiver/negativer Bereich — CLAUDE.md „Abszisse am Nulldurchgang").
  const xAxisPos = (valMin <= 0 && 0 <= valMax) ? scaleY(0) : xAxisY

  // Hintergrund (Plot-Fläche)
  group.appendChild(el('rect', { x: PAD_L, y: PAD_T, width: plotW, height: plotH, class: 'graph-bg' }))

  // Y-Gitter + Ticks — 1-2-4-5-Nice-Step, ≥4 (dual) bzw. ≥6 (single) Teilstriche (B9)
  const yStep = niceStepLE(valMax - valMin, geom.dual ? 4 : 6)
  for (let v = Math.ceil(valMin / yStep) * yStep; v <= valMax + 1e-9; v += yStep) {
    const yp = scaleY(v)
    if (yp < PAD_T || yp > xAxisY + 1) continue
    group.appendChild(el('line', { x1: PAD_L, y1: yp, x2: PAD_L + plotW, y2: yp, class: 'grid-line' }))
    const t = el('text', { x: PAD_L - 8, y: yp + 4, 'text-anchor': 'end', class: 'tick-label' })
    t.textContent = fmt(v, yStep % 1 === 0 ? 0 : (yStep < 0.1 ? 2 : 1))
    group.appendChild(t)
  }
  // X-Gitter + Ticks (Label am unteren Rand, Achse bei y=0)
  const tStep = tAxisStep(tMaxAxis)
  for (let tg = tStep; tg <= tMaxAxis + 1e-9; tg += tStep) {
    const xp = scaleT(tg)
    group.appendChild(el('line', { x1: xp, y1: PAD_T, x2: xp, y2: xAxisY, class: 'grid-line' }))
    const t = el('text', { x: xp, y: xAxisY + 15, 'text-anchor': 'middle', class: 'tick-label' })
    t.textContent = fmt(tg, tStep < 1 ? 1 : 0)
    group.appendChild(t)
  }

  // Achsen (X bei y=0 bzw. am unteren Rand, Y am linken Rand; refX=0 ohne Kürzung)
  const axisAttrs = { class: 'axis-line', 'stroke-width': 1.5, 'marker-end': 'url(#arrowhead)' }
  group.appendChild(el('line', { ...axisAttrs, x1: PAD_L, y1: xAxisPos, x2: PAD_L + plotW, y2: xAxisPos }))
  group.appendChild(el('line', { ...axisAttrs, x1: PAD_L, y1: xAxisY, x2: PAD_L, y2: PAD_T }))

  // Achsenbeschriftungen
  const yLabel = el('text', {
    transform: `rotate(-90, ${PAD_L - 40}, ${PAD_T + plotH / 2})`,
    x: PAD_L - 40, y: PAD_T + plotH / 2, 'text-anchor': 'middle', class: 'axis-label',
  })
  setAxisLabel(yLabel, `${quantitySymbols[qq]} / ${yUnitString(qq)}`)
  group.appendChild(yLabel)
  const xLabel = el('text', { x: PAD_L + plotW / 2, y: xAxisY + PAD_B - 10, 'text-anchor': 'middle', class: 'axis-label' })
  setAxisLabel(xLabel, 't / s')
  group.appendChild(xLabel)

  // Datenlinie + aktueller Punkt
  const pts = []
  for (let i = 0; i < plotIndex && i < data.length; i++) {
    pts.push(`${scaleT(tArr[i])},${scaleY(data[i] * cf)}`)
  }
  let curVal = null
  if (plotIndex > 0 && time <= tEnd + 1e-9) {
    const i = Math.max(0, plotIndex - 1)
    const t1 = tArr[i], t2 = tArr[i + 1] || t1
    const a = t2 > t1 ? (time - t1) / (t2 - t1) : 0
    curVal = data[i] + a * ((data[i + 1] || data[i]) - data[i])
    pts.push(`${scaleT(time)},${scaleY(curVal * cf)}`)
  }
  group.appendChild(el('polyline', {
    fill: 'none', 'stroke-width': 2, points: pts.join(' '), class: `graph-line graph-line-${idx}`,
  }))
  if (curVal !== null) {
    group.appendChild(el('circle', {
      r: 4, cx: scaleT(time), cy: scaleY(curVal * cf), class: 'graph-point',
    }))
  }

  // Titel (letztes Kind → über Datenlinien + bg)
  const title = el('text', { x: G_W / 2, y: 20, 'text-anchor': 'middle', class: 'graph-title-text' })
  setGraphTitle(title, graphTitles[qq])
  group.appendChild(title)
}

function drawGraphs(time) {
  const geom = graphGeom()
  // viewBox ans aktuelle Format anpassen (Landscape gestapelt / Portrait split) —
  // Ticks/Achsen rechnen in drawGraph aus geom neu (B9/B10).
  DOM.graphSvg.setAttribute('viewBox', `0 0 ${geom.w} ${geom.h}`)
  DOM.graphGroup1.setAttribute('transform', 'translate(0,0)')
  DOM.graphGroup2.setAttribute('transform', `translate(0,${geom.hEach + geom.gap})`)
  DOM.graphGroup2.style.visibility = geom.dual ? 'visible' : 'hidden'
  drawGraph(1, time, geom)
  if (geom.dual) drawGraph(2, time, geom)
}

// ── Szene aktualisieren ──────────────────────────────────────────────────────
export function updateScene(time) {
  const interp = interpolateAt(time)
  if (!interp) return
  const P = interp.p
  const R_t = radiusAt(time)
  const phiRad = P.phi * Math.PI / 180

  const P_POINT = physToScreen(P.x, P.y, store.h)
  DOM.point.setAttribute('cx', P_POINT.x); DOM.point.setAttribute('cy', P_POINT.y)

  if (store.currentView === '2D') {
    DOM.disk.style.transform = `rotate(${-P.phi}deg)`
  }

  if (store.togTrajectory) {
    const tArr = store.fullData.t
    const xs = store.fullData.p_x, ys = store.fullData.p_y
    let d = `M ${physToScreen(xs[0], ys[0], store.h).x},${physToScreen(xs[0], ys[0], store.h).y}`
    for (let k = 1; k <= interp.i; k++) {
      d += ` L ${physToScreen(xs[k], ys[k], store.h).x},${physToScreen(xs[k], ys[k], store.h).y}`
    }
    d += ` L ${P_POINT.x},${P_POINT.y}`
    DOM.trajectoryPath.setAttribute('d', d)
  } else {
    DOM.trajectoryPath.setAttribute('d', '')
  }

  drawVectors({
    x: P.x, y: P.y, z: store.h,
    vx: P.vx, vy: P.vy, ax: P.ax, ay: P.ay,
    arMag: P.ar, atMag: P.at,
    omegaRad: P.omega * Math.PI / 180,
    phiRad,
    omegaDeg: P.omega, alphaDeg: P.alpha,
  }, R_t)

  // Stoppuhr-Hauptzeiger (1 U/60 s)
  const ma = (time % 60 / 60) * 2 * Math.PI
  DOM.mainHand.setAttribute('x2', WATCH_CX + WATCH_HAND_LEN * Math.sin(ma))
  DOM.mainHand.setAttribute('y2', WATCH_CY - WATCH_HAND_LEN * Math.cos(ma))

  updateAnalysisPanel(P)
  drawGraphs(time)

  DOM.timeLabel.innerHTML = `<i>t</i> = ${fmt(time, 2)} s`
}