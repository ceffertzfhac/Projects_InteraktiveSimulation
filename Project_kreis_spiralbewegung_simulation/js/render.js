'use strict'

import {
  ANIM_CX, ANIM_CY, COORD_AXIS_LEN, DEFAULT_PIXELS_PER_METER,
  VEL_SCALE, ACC_SCALE, OMEGA_LEN_FACTOR, ALPHA_LEN_FACTOR, ISO_ANGLE,
  WATCH_TX, WATCH_TY, WATCH_SCALE, WATCH_CX, WATCH_CY, WATCH_R, WATCH_HAND_LEN,
  WATCH_SUBDIAL_R, WATCH_SUBDIAL_OFFSET,
  ZOOM_TEXT_X, ZOOM_TEXT_Y,
  PAD_L, PAD_R, PAD_T, PAD_B,
  quantities, quantityUnits, quantitySymbols, graphOptions, graphTitles,
  SCHEIBE_B_FAKTOR, SCHEIBE_A_FAKTOR,
} from './constants.js'
import { store, DOM } from './state.js'
import { interpolateAt, linePlotIndex, radiusAt } from './physics.js'
import { updateDynamicColors } from './colors.js'
import { fmt } from '../../shared/js/format.js'
import { shortenEnd } from '../../shared/js/vectors.js'
import { setAxisLabel, setGraphTitle } from '../../shared/js/svg-text.js'
import { tAxisStep, niceStepLE } from '../../shared/js/ticks.js'
export { fmt }
export { bFaktor }

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
  drawSubdialMarks()
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

// FX2: Subdial (10 Marken, cy=WATCH_CY+WATCH_SUBDIAL_OFFSET, r=WATCH_SUBDIAL_R)
function drawSubdialMarks() {
  DOM.subdialMarks.innerHTML = ''
  const scy = WATCH_CY + WATCH_SUBDIAL_OFFSET
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * 2 * Math.PI
    DOM.subdialMarks.appendChild(el('line', {
      x1: WATCH_CX + (WATCH_SUBDIAL_R - 3) * Math.sin(a), y1: scy - (WATCH_SUBDIAL_R - 3) * Math.cos(a),
      x2: WATCH_CX + WATCH_SUBDIAL_R * Math.sin(a), y2: scy - WATCH_SUBDIAL_R * Math.cos(a),
      class: 'sw-mark', 'stroke-width': 1,
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

// ── Radius R (Strecke Mittelpunkt → Massenpunkt, gestrichelt + Beschriftung) ─
function drawRadius(P, R_t) {
  DOM.radiusGroup.style.visibility = 'hidden'
  if (!store.togRadius || R_t < 0.05) return
  const c = physToScreen(0, 0, P.z), p = physToScreen(P.x, P.y, P.z)
  const dx = p.x - c.x, dy = p.y - c.y
  const len = Math.hypot(dx, dy)
  if (len < 12) return
  DOM.radiusLine.setAttribute('x1', c.x); DOM.radiusLine.setAttribute('y1', c.y)
  DOM.radiusLine.setAttribute('x2', p.x); DOM.radiusLine.setAttribute('y2', p.y)
  DOM.radiusCenter.setAttribute('cx', c.x); DOM.radiusCenter.setAttribute('cy', c.y)
  // Beschriftung mittig, senkrecht zur Linie versetzt (immer nach oben/außen).
  // B60: Im Scheibenmodus läge die Mitte genau auf Punkt B (r = R/2) → dort bei 3/4 der
  // Strecke und auf der Seite, in die sich die Scheibe dreht (weg von den Labels A/B).
  let nx = -dy / len, ny = dx / len
  let f = 0.5
  if (scheibeAktiv()) {
    f = 0.75
    const s = Math.sign(P.omegaRad) || 1          // Drehsinn: Normale = +t̂ (Bildschirm: y nach unten)
    nx = s * dy / len; ny = -s * dx / len
  } else if (ny > 0) { nx = -nx; ny = -ny }
  DOM.radiusLabel.setAttribute('x', c.x + f * dx + nx * 14)
  DOM.radiusLabel.setAttribute('y', c.y + f * dy + ny * 14 + 6)
  DOM.radiusGroup.style.visibility = 'visible'
}

// ── Legende: zeigt nur, was gerade in der Szene zu sehen ist ────────────────
function updateLegend() {
  const show = {
    r: store.togPosition, R: store.togRadius,
    v: store.togVelocity,
    // Endfarben der dynamischen Mischfarbe schon ohne Zerlegung zeigen (Referenz für den Farbverlauf)
    vr: store.togVelocity && store.motionMode === 'spirale',
    vt: store.togVelocity && store.motionMode === 'spirale',
    a: store.togAcceleration,
    ar: store.togAcceleration,
    at: store.togAcceleration,
    omega: store.togOmega, alpha: store.togAlpha, phi: store.togPhi, traj: store.togTrajectory,
    // Modus „Rotierende Scheibe“: nur dort sind A und B zu unterscheiden
    punktA: scheibeAktiv(), punktB: scheibeAktiv(),
  }
  document.querySelectorAll('[data-legend]').forEach(e => {
    const d = show[e.dataset.legend] ? '' : 'none'
    if (e.style.display !== d) e.style.display = d
  })
}

// Maßstab der Beschleunigungspfeile. B62: Im Scheibenmodus 1,6-fach (für A und B gleich),
// sonst wären die halb so langen Pfeile von B kürzer als ihre Spitze und verschwänden.
function accScale() {
  return ACC_SCALE * store.zoomFactor * (scheibeAktiv() ? SCHEIBE_A_FAKTOR : 1)
}

// ── Vektoren + Zerlegung ─────────────────────────────────────────────────────
function drawVectors(P, R_t) {
  // Alle Vektoren (+ Komponentengruppe) + Phi-Gruppe erst verbergen, dann selektiv
  // anzeigen. [id*="_vector"] greift auch die _x/_y/_r/_t-Komponenten sowie die
  // vector_components_group; Kind-visibility:visible überdeckt Eltern:hidden.
  DOM.animationGroup.querySelectorAll('[id*="_vector"], #phi_arc_group, #radius_group').forEach(e => { e.style.visibility = 'hidden' })

  updateDynamicColors(P)
  updateLegend()
  drawPhiArc(P.phiRad, R_t)
  drawRadius(P, R_t)

  const P_POINT = physToScreen(P.x, P.y, P.z)
  const P_ORIGIN = physToScreen(0, 0, 0)
  const P_CENTER = physToScreen(0, 0, P.z)
  const vScale = VEL_SCALE * store.zoomFactor
  const aScale = accScale()

  const setMain = (lineEl, x1, y1, x2, y2, by) => {
    const s = shortenEnd(x1, y1, x2, y2, by)
    if (!s) { lineEl.style.visibility = 'hidden'; return false } // B23: Vektor kürzer als Spitze
    lineEl.setAttribute('x1', x1); lineEl.setAttribute('y1', y1)
    lineEl.setAttribute('x2', s.x2); lineEl.setAttribute('y2', s.y2)
    lineEl.style.visibility = 'visible'
    return true
  }
  // B65: Komponente nur zeigen, wenn sie nicht verschwindet UND setMain sie zeichnen konnte
  // (sonst bliebe eine Linie der Länge 0 im SVG-Ursprung sichtbar, samt Pfeilspitze).
  const setComp = (lineEl, nonZero, x1, y1, x2, y2, by) => {
    if (!nonZero) { lineEl.style.visibility = 'hidden'; return }
    setMain(lineEl, x1, y1, x2, y2, by)
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
      setComp(DOM.velocityVectorR, Math.abs(store.vr) > 1e-6, P_POINT.x, P_POINT.y, PVR.x, PVR.y, ARROW_LEN_POLAR)
      const vtMag = R_t * P.omegaRad
      const tx = -uy, ty = ux
      const PVT = physToScreen(P.x + tx * vtMag * vScale, P.y + ty * vtMag * vScale, P.z)
      setComp(DOM.velocityVectorT, Math.abs(vtMag) > 1e-6, P_POINT.x, P_POINT.y, PVT.x, PVT.y, ARROW_LEN_POLAR)
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
      setComp(DOM.accelerationVectorR, Math.abs(P.arMag) > 1e-6, P_POINT.x, P_POINT.y, PAR.x, PAR.y, ARROW_LEN_POLAR)
      if (Math.abs(P.atMag) > 1e-6) {
        const tx = -uy, ty = ux
        const atSign = Math.sign(store.alpha_rad)
        const f = store.scaleAt ? 10.0 : 1.0
        const PAT = physToScreen(P.x + atSign * tx * P.atMag * aScale * f, P.y + atSign * ty * P.atMag * aScale * f, P.z)
        setMain(DOM.accelerationVectorT, P_POINT.x, P_POINT.y, PAT.x, PAT.y, ARROW_LEN_POLAR)
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


// ── Modus „Rotierende Scheibe“: Punkt B (r = R/2) neben Punkt A (Rand) ────
// Kreisbahn-Physik (R konstant, v_r = 0), nur 2D. Beide Punkte teilen φ, ω, α (starre Scheibe); sie
// unterscheiden sich im Radius und damit in s, v, a_ZP, a_t. Punkt A ist der
// normale Partikel (drawVectors); hier kommen Speiche, Bahn und Vektoren von B
// sowie die Vergleichstabelle dazu.
const SCHEIBE_ROWS = [
  { key: 'r',     label: 'Radius <i>r</i>' },
  { key: 'dphi',  label: 'Drehwinkel Δ<i>φ</i>' },
  { key: 's',     label: 'Bahnweg <i>s</i>' },
  { key: 'omega', label: 'Winkelgeschw. <i>ω</i>' },
  { key: 'alpha', label: 'Winkelbeschl. <i>α</i>' },
  { key: 'v',     label: 'Bahngeschw. |<i>v</i>|' },
  { key: 'ar',    label: 'Zentripetal |<i>a</i>ᵣ|' },
  { key: 'at',    label: 'Tangential |<i>a</i>ₜ|' },
]
let scheibeCells = null

function scheibeAktiv() {
  return store.motionMode === 'scheibe' && store.currentView === '2D'
}

function buildScheibeTable() {
  const grid = DOM.scheibeGrid
  grid.innerHTML = ''
  const cell = (cls, html) => {
    const d = document.createElement('div')
    d.className = `analysis-cell ${cls}`
    d.innerHTML = html
    grid.appendChild(d)
    return d
  }
  cell('key', '')
  cell('head a', 'A (Rand)'); cell('head b', 'B (Mitte)'); cell('head', 'A : B')
  scheibeCells = {}
  SCHEIBE_ROWS.forEach(r => {
    cell('key', r.label)
    scheibeCells[r.key] = { a: cell('val', '—'), b: cell('val', '—'), q: cell('val ratio', '—') }
  })
}

// Überstrichener Winkel ∫|ω| dt von 0 bis t (rad) — bei Richtungsumkehr (ω wechselt
// das Vorzeichen bei t* = −ω₀/α) werden beide Teilstücke addiert, nicht saldiert (B59).
function sweptAngle(t) {
  const w0 = store.omega0_rad, al = store.alpha_rad
  const dphi = tt => w0 * tt + 0.5 * al * tt * tt
  const tStar = Math.abs(al) > 1e-12 ? -w0 / al : -1
  if (tStar > 0 && tStar < t) return Math.abs(dphi(tStar)) + Math.abs(dphi(t) - dphi(tStar))
  return Math.abs(dphi(t))
}

function scheibeWerte(P, r, time) {
  const omega = P.omega * Math.PI / 180            // rad/s
  const dphiDeg = P.phi - store.phi0_rad * 180 / Math.PI
  return {
    r, dphi: dphiDeg, s: r * sweptAngle(time),
    omega: P.omega, alpha: P.alpha,
    v: Math.abs(r * omega), ar: r * omega * omega, at: Math.abs(r * store.alpha_rad),
  }
}

function updateScheibePanel(P, time) {
  const on = scheibeAktiv()
  DOM.scheibePanel.style.display = on ? '' : 'none'
  DOM.liveLabel.textContent = on ? 'Live-Analyse – Punkt A (Rand)' : 'Live-Analyse'   // FX13
  if (!on) return
  if (!scheibeCells) buildScheibeTable()
  const rA = store.R0, rB = store.R0 * SCHEIBE_B_FAKTOR
  const A = scheibeWerte(P, rA, time), B = scheibeWerte(P, rB, time)
  const unit = { r: 'm', s: 'm', v: 'm/s', ar: 'm/s²', at: 'm/s²' }
  const ang = { dphi: 'phi', omega: 'omega', alpha: 'alpha' }
  SCHEIBE_ROWS.forEach(row => {
    const c = scheibeCells[row.key]
    const show = v => {
      if (ang[row.key]) { const d = angleDisplay(ang[row.key], v); return `${fmt(d.val, 2)} ${d.unit}` }
      return `${fmt(v, 2)} ${unit[row.key]}`
    }
    c.a.textContent = show(A[row.key])
    c.b.textContent = show(B[row.key])
    const q = Math.abs(B[row.key]) > 1e-9 ? A[row.key] / B[row.key] : NaN
    c.q.textContent = Number.isFinite(q) ? fmt(q, 2) : '—'
  })
}

// FX12: Scheibe als starrer Körper — kräftiger Rand (CSS #disk.scheibe), Nabe und
// sechs mitdrehende Speichen. Die Speichen liegen um 30° gegen den Radius zu A versetzt,
// damit sie weder Radiuslinie R noch Ortsvektor noch Punkt B überdecken (B61).
const SCHEIBE_SPEICHEN = 6
function drawScheibeDeko(on, phi, R_t) {
  DOM.disk.classList.toggle('scheibe', on)
  DOM.scheibeDeco.style.visibility = on ? 'visible' : 'hidden'
  if (!on) return
  if (!DOM.scheibeDeco.firstChild) {
    for (let k = 0; k < SCHEIBE_SPEICHEN; k++) DOM.scheibeDeco.appendChild(el('line', {}))
    DOM.scheibeDeco.appendChild(el('circle', {}))
  }
  const C = physToScreen(0, 0, 0)
  const ppm = store.currentPixelsPerMeter
  const rHub = Math.max(4, 0.07 * R_t * ppm)
  const lines = DOM.scheibeDeco.querySelectorAll('line')
  lines.forEach((ln, k) => {
    const a = phi + Math.PI / 6 + k * 2 * Math.PI / SCHEIBE_SPEICHEN
    const ca = Math.cos(a), sa = Math.sin(a)
    ln.setAttribute('x1', C.x + rHub * ca); ln.setAttribute('y1', C.y - rHub * sa)
    ln.setAttribute('x2', C.x + R_t * ppm * ca); ln.setAttribute('y2', C.y - R_t * ppm * sa)
  })
  const hub = DOM.scheibeDeco.querySelector('circle')
  hub.setAttribute('cx', C.x); hub.setAttribute('cy', C.y); hub.setAttribute('r', rHub)
}

function drawScheibe(P, R_t) {
  const on = scheibeAktiv()
  DOM.scheibeGroup.style.visibility = on ? 'visible' : 'hidden'
  drawScheibeDeko(on, P.phiRad, R_t)
  if (!on) return
  const phi = P.phiRad
  const rB = R_t * SCHEIBE_B_FAKTOR
  const ux = Math.cos(phi), uy = Math.sin(phi)         // r̂
  const tx = -uy, ty = ux                              // t̂
  const omega = P.omegaRad, alpha = store.alpha_rad
  const C = physToScreen(0, 0, 0)
  const PA = physToScreen(R_t * ux, R_t * uy, 0)
  const PB = physToScreen(rB * ux, rB * uy, 0)
  const vScale = VEL_SCALE * store.zoomFactor
  const aScale = accScale()

  DOM.scheibeBahnB.setAttribute('cx', C.x); DOM.scheibeBahnB.setAttribute('cy', C.y)
  DOM.scheibeBahnB.setAttribute('r', rB * store.currentPixelsPerMeter)
  DOM.scheibePointB.setAttribute('cx', PB.x); DOM.scheibePointB.setAttribute('cy', PB.y)

  // Beschriftung schräg außen-hinten (r̂ − Drehsinn·t̂): frei von v (vorn), a (innen),
  // der Radiuslinie und der y-Achse bei φ = 90° (B60)
  const sw = Math.sign(omega) || 1
  const lx = (ux - sw * tx) / Math.SQRT2, ly = (uy - sw * ty) / Math.SQRT2
  const labelAt = (el, p, off) => {
    el.setAttribute('x', p.x + lx * off); el.setAttribute('y', p.y - ly * off + 6)
  }
  labelAt(DOM.scheibeLabelA, PA, 20)
  labelAt(DOM.scheibeLabelB, PB, 19)

  const setVec = (lineEl, show, x2, y2, by, opacity = '1') => {
    lineEl.style.visibility = 'hidden'
    if (!show) return
    const s = shortenEnd(PB.x, PB.y, x2, y2, by)
    if (!s) return
    lineEl.setAttribute('x1', PB.x); lineEl.setAttribute('y1', PB.y)
    lineEl.setAttribute('x2', s.x2); lineEl.setAttribute('y2', s.y2)
    lineEl.style.opacity = opacity
    lineEl.style.visibility = 'visible'
  }
  // v_B tangential
  const vB = rB * omega
  const PV = physToScreen(rB * ux + tx * vB * vScale, rB * uy + ty * vB * vScale, 0)
  setVec(DOM.scheibeVB, store.togVelocity && Math.abs(vB) > 1e-6, PV.x, PV.y, ARROW_LEN_MAIN)
  // a_B gesamt = −ω²r r̂ + α r t̂
  const arB = rB * omega * omega, atB = rB * alpha
  const polar = store.aDecomp === 'polar'
  const PAB = physToScreen(rB * ux + (-arB * ux + atB * tx) * aScale, rB * uy + (-arB * uy + atB * ty) * aScale, 0)
  setVec(DOM.scheibeAB, store.togAcceleration && Math.hypot(arB, atB) > 1e-6, PAB.x, PAB.y, ARROW_LEN_ACC, polar ? '0.4' : '1')
  if (polar) {
    const PAR = physToScreen(rB * ux - arB * ux * aScale, rB * uy - arB * uy * aScale, 0)
    setVec(DOM.scheibeArB, store.togAcceleration && Math.abs(arB) > 1e-6, PAR.x, PAR.y, ARROW_LEN_POLAR)
    const f = store.scaleAt ? 10.0 : 1.0
    const sgn = Math.sign(alpha)
    const PAT = physToScreen(rB * ux + sgn * tx * Math.abs(atB) * aScale * f, rB * uy + sgn * ty * Math.abs(atB) * aScale * f, 0)
    setVec(DOM.scheibeAtB, store.togAcceleration && Math.abs(atB) > 1e-6, PAT.x, PAT.y, ARROW_LEN_POLAR)
  } else {
    DOM.scheibeArB.style.visibility = 'hidden'; DOM.scheibeAtB.style.visibility = 'hidden'
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
// füllte die Breite nicht.) SINGLE nutzt das volle Format. DUAL ordnet die beiden
// Diagramme ORTHOGONAL zur Sim/Diagramm-Aufteilung (kanonische Regel, s. CLAUDE.md):
// übereinander-Modus (Landscape, breite Zelle) → Diagramme nebeneinander
// (viewBox-Breite 2·LAND_W+Gap); nebeneinander-Modus (Portrait, hohe Zelle) →
// Diagramme übereinander gestapelt (Slot-Höhe PORT_SLOT_DUAL). Die Mittellinie
// (Sim/Diagramm-Trenner) bleibt unangetastet.
// Orientierung (Landscape/Portrait) wird aus der TATSÄCHLICHEN Zell-Form
// abgeleitet (getBoundingClientRect), nicht nur aus store.layoutSplit — so greift
// der @media-Fallback (≤1100 px erzwingt gestapelt = breite Zelle) automatisch
// zu Landscape; ein Fenster-Resize paßt live nach. Ticks rechnen pro Format neu.
const LAND_W = 700, LAND_H_SINGLE = 410                          // übereinander: breite Zelle (Single + je Diagramm im Dual-nebeneinander)
const PORT_W = 492, PORT_H_SINGLE = 700, PORT_SLOT_DUAL = 345    // nebeneinander: hohe Zelle (Single voll; Dual-Slot = PORT_SLOT_DUAL; PO: 20 % breiter)
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
  const landscape = cellW >= cellH                                  // breite Zelle = übereinander-Modus
  // SINGLE: volles Format (Landscape breit / Portrait hoch)
  if (!dual) {
    const w = landscape ? LAND_W : PORT_W
    const h = landscape ? LAND_H_SINGLE : PORT_H_SINGLE
    return { w, h, cellW: w, cellH: h, dual: false, gap: DUAL_GAP, off2: { x: 0, y: 0 } }
  }
  // DUAL: Diagramme orthogonal zur Sim/Diagramm-Aufteilung.
  //  • Landscape (übereinander): NEBENEINANDER — je Diagramm LAND_W breit,
  //    viewBox-Breite = 2·LAND_W + DUAL_GAP, graphGroup2 versetzt in X.
  //  • Portrait (nebeneinander): ÜBEREINANDER gestapelt — je Diagramm PORT_SLOT_DUAL hoch,
  //    viewBox-Höhe = 2·PORT_SLOT_DUAL + DUAL_GAP, graphGroup2 versetzt in Y.
  if (landscape) {
    const eachW = LAND_W, h = LAND_H_SINGLE
    return { w: eachW * 2 + DUAL_GAP, h, cellW: eachW, cellH: h, dual: true, gap: DUAL_GAP, off2: { x: eachW + DUAL_GAP, y: 0 } }
  }
  const w = PORT_W, eachH = PORT_SLOT_DUAL
  return { w, h: eachH * 2 + DUAL_GAP, cellW: w, cellH: eachH, dual: true, gap: DUAL_GAP, off2: { x: 0, y: eachH + DUAL_GAP } }
}

function yUnitString(qq) {
  if (['phi', 'omega', 'alpha'].includes(qq)) {
    let u = store.angleUnit === 'rad' ? 'rad' : '°'
    if (qq === 'omega') u += '/s'
    if (qq === 'alpha') u += '/s²'
    return u
  }
  if (qq === 'x' || qq === 'y' || qq === 'R') return 'm'
  if (qq.startsWith('v')) return 'm/s'
  if (qq.startsWith('a') || qq === 'ar' || qq === 'at') return 'm/s²'
  return ''
}

// Auto-Range für Y: min/max über den bisher geplotteten Daten-Abschnitt [0..n),
// mit derselben typspezifischen Padding wie computeAxisLimits (Beteiligung von 0
// bei Betrags-/Symmetrie-Größen, kleiner Bereich um konstante Werte). cf = rad-Faktor.
const MAGNITUDE_Q = ['R', 'ar', 'at', 'vabs', 'aabs']
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

// FX13: Kurven je Diagramm. Außerhalb des Scheibenmodus eine Kurve (Punkt A = der
// Massenpunkt). Im Modus A und/oder B; B = SCHEIBE_B_FAKTOR × A für alle Längen-,
// Geschwindigkeits- und Beschleunigungsgrößen, identisch für φ/ω/α (starre Scheibe) —
// dann B gestrichelt, damit die deckungsgleiche Kurve von A sichtbar bleibt.
const ANGULAR_Q = ['phi', 'omega', 'alpha']
function bFaktor(qq) { return ANGULAR_Q.includes(qq) ? 1 : SCHEIBE_B_FAKTOR }
function graphSeries(idx, qq) {
  if (store.motionMode !== 'scheibe') return [{ f: 1, line: `graph-line-${idx}`, point: 'graph-point' }]
  const sel = store.graphPoints[idx] || 'ab'
  const out = []
  if (sel !== 'b') out.push({ f: 1, line: 'graph-line-a', point: 'graph-point', label: 'A (Rand)', key: 'A' })
  if (sel !== 'a') {
    const f = bFaktor(qq)
    out.push({ f, line: 'graph-line-b' + (f === 1 && sel === 'ab' ? ' dashed' : ''), point: 'graph-point-b', label: 'B (Mitte)', key: 'B' })
  }
  return out
}

function drawGraph(idx, time, geom) {
  const group = idx === 1 ? DOM.graphGroup1 : DOM.graphGroup2
  group.innerHTML = ''
  if (idx === 2 && !geom.dual) {
    store.graphScale[2] = null
    hideGraphHover(2)
    return
  }

  const qq = idx === 1 ? store.graphType1 : store.graphType2
  const limits = store.axisLimits[qq]
  if (!limits) {
    store.graphScale[idx] = null
    hideGraphHover(idx)
    return
  }

  const G_W = geom.cellW
  const plotW = G_W - PAD_L - PAD_R
  const plotH = geom.cellH - PAD_T - PAD_B

  // Hover-Werte (I5): Hit-Rect-Geometrie aus denselben Lokalen wie scaleT/scaleY.
  DOM.graphHitRect[idx].setAttribute('x', PAD_L)
  DOM.graphHitRect[idx].setAttribute('y', PAD_T)
  DOM.graphHitRect[idx].setAttribute('width', plotW)
  DOM.graphHitRect[idx].setAttribute('height', plotH)

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

  // Hover-Werte (I5): einzige Quelle der Wahrheit für updateGraphHover() —
  // tMaxAxis/valMin/valMax ändern sich mit dem Auto-Range (Vorschau/wachsend),
  // nie separat neu berechnen (sonst Drift zur gerade gezeichneten Skala).
  store.graphScale[idx] = { qq, cf, tMaxAxis, valMin, valMax }

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

  // Datenlinie(n) + aktueller Punkt. FX13: Im Scheibenmodus je eine Kurve für A und B
  // (B = Faktor × A, s. graphSeries); die Achsenskala bleibt die von A, damit zwei
  // Diagramme „nur A“ / „nur B“ direkt vergleichbar sind (B liegt stets im Bereich von A).
  let curVal = null
  if (plotIndex > 0 && time <= tEnd + 1e-9) {
    const i = Math.max(0, plotIndex - 1)
    const t1 = tArr[i], t2 = tArr[i + 1] || t1
    const a = t2 > t1 ? (time - t1) / (t2 - t1) : 0
    curVal = data[i] + a * ((data[i + 1] || data[i]) - data[i])
  }
  const series = graphSeries(idx, qq)
  const plotted = []                                   // Bildpunkte aller Kurven (für die Legendenlage)
  series.forEach(sr => {
    const pts = []
    for (let i = 0; i < plotIndex && i < data.length; i++) {
      const X = scaleT(tArr[i]), Y = scaleY(data[i] * sr.f * cf)
      pts.push(`${X},${Y}`); plotted.push([X, Y])
    }
    if (curVal !== null) pts.push(`${scaleT(time)},${scaleY(curVal * sr.f * cf)}`)
    group.appendChild(el('polyline', {
      fill: 'none', 'stroke-width': 2, points: pts.join(' '), class: `graph-line ${sr.line}`,
    }))
  })
  if (curVal !== null) {
    series.forEach(sr => group.appendChild(el('circle', {
      r: 4, cx: scaleT(time), cy: scaleY(curVal * sr.f * cf), class: sr.point,
    })))
  }
  // Kurzlegende (nur Scheibenmodus): in der Ecke der Plotfläche, die am wenigsten
  // Kurvenpunkte enthält; die rechte Ecke hält Abstand zum Wiedergabe-Marker am rechten
  // Rand. Halbtransparenter Hintergrund, falls sich eine Kurve doch kreuzt.
  if (series.length && series[0].label) {
    const LW = 104, LH = 10 + series.length * 17, M = 8, MR = 22
    const corners = [
      [PAD_L + M, PAD_T + M], [PAD_L + plotW - LW - MR, PAD_T + M],
      [PAD_L + M, PAD_T + plotH - LH - M - 14], [PAD_L + plotW - LW - MR, PAD_T + plotH - LH - M - 14],
    ]
    const hits = ([x, y]) => plotted.reduce((n, [px, py]) =>
      n + (px >= x - 4 && px <= x + LW + 4 && py >= y - 4 && py <= y + LH + 4 ? 1 : 0), 0)
    let best = corners[0], bestN = Infinity
    corners.forEach(c => { const n = hits(c); if (n < bestN) { best = c; bestN = n } })
    const [lx, ly] = best
    group.appendChild(el('rect', { x: lx, y: ly, width: LW, height: LH, rx: 4, class: 'graph-legend-bg' }))
    series.forEach((sr, k) => {
      const y = ly + 16 + k * 17
      group.appendChild(el('line', { x1: lx + 8, y1: y - 4, x2: lx + 30, y2: y - 4, class: `graph-line ${sr.line}` }))
      const tx = el('text', { x: lx + 36, y, class: 'graph-legend-text' })
      tx.textContent = sr.label
      group.appendChild(tx)
    })
  }

  // Titel (letztes Kind → über Datenlinien + bg)
  const title = el('text', { x: G_W / 2, y: 20, 'text-anchor': 'middle', class: 'graph-title-text' })
  setGraphTitle(title, graphTitles[qq])
  group.appendChild(title)
}

function hideGraphHover(idx) {
  DOM.hoverLine[idx].setAttribute('visibility', 'hidden')
  DOM.hoverPoint[idx].setAttribute('visibility', 'hidden')
  DOM.hoverTooltip[idx].setAttribute('visibility', 'hidden')
}

// I14: beide Slots teilen sich im Zwei-Diagramm-Modus stets die Zeitachse
// (hier keine Bahnkurve wie bei anderen Sims — alle Größen sind Zeitreihen).
function otherSlot(idx) {
  return idx === 1 ? 2 : idx === 2 ? 1 : null
}

// Zeichnet den Hover-Cursor + Tooltip im angegebenen Slot bei Zeit t. Liest
// store.graphScale[idx] (von drawGraph() befüllt) statt eigene Skala zu
// berechnen — einzige Quelle der Wahrheit für updateGraphHover()/refreshHover().
function drawHoverAtT(idx, gs, t) {
  const { qq, cf, tMaxAxis, valMin, valMax } = gs
  const geom = graphGeom()
  const G_W = geom.cellW
  const plotW = G_W - PAD_L - PAD_R
  const plotH = geom.cellH - PAD_T - PAD_B

  const data = store.fullData[`p_${qq}`]
  const tArr = store.fullData.t
  if (!data || !tArr || tArr.length === 0) { hideGraphHover(idx); return }
  const plotIndex = linePlotIndex(t)
  const i = Math.max(0, Math.min(plotIndex - 1, data.length - 2 < 0 ? 0 : data.length - 2))
  const t1 = tArr[i], t2 = tArr[i + 1] || t1
  const a = t2 > t1 ? (t - t1) / (t2 - t1) : 0
  const rawVal = data[i] + a * ((data[i + 1] || data[i]) - data[i])
  const val = rawVal * cf

  const scaleT = tv => PAD_L + (tv / (tMaxAxis || 1)) * plotW
  const scaleY = v => PAD_T + plotH - ((v - valMin) / ((valMax - valMin) || 1)) * plotH
  const xPix = scaleT(t)

  DOM.hoverLine[idx].setAttribute('x1', xPix); DOM.hoverLine[idx].setAttribute('x2', xPix)
  DOM.hoverLine[idx].setAttribute('y1', PAD_T); DOM.hoverLine[idx].setAttribute('y2', PAD_T + plotH)
  DOM.hoverLine[idx].setAttribute('visibility', 'visible')

  // FX13: im Scheibenmodus Ring auf der ersten gezeigten Kurve, Tooltip mit allen Kurven
  const series = graphSeries(idx, qq)
  DOM.hoverPoint[idx].setAttribute('cx', xPix)
  DOM.hoverPoint[idx].setAttribute('cy', scaleY(val * series[0].f))
  DOM.hoverPoint[idx].setAttribute('visibility', 'visible')

  const vals = series.map(sr => ({ key: sr.key, val: val * sr.f }))
  renderHoverTooltip(idx, qq, t, vals, xPix, plotW)
}

// Zeichnet den Hover-Cursor im hoverSourceSlot neu (Auto-Range wächst mit der
// laufenden Wiedergabe) und im Zwei-Diagramm-Modus zusätzlich im jeweils
// anderen Slot bei derselben Zeit (I14: beide Slots teilen sich dort stets
// die Zeitachse).
function refreshHover() {
  const idx = store.hoverSourceSlot
  if (!idx) return
  const gs = store.graphScale[idx]
  if (!gs) {
    hideGraphHover(idx)
    const o = otherSlot(idx)
    if (o) hideGraphHover(o)
    return
  }
  const t = Math.max(0, Math.min(store.hoverT, gs.tMaxAxis, store.simulatedTime))
  store.hoverT = t
  drawHoverAtT(idx, gs, t)
  if (graphGeom().dual) {
    const other = otherSlot(idx)
    if (other) {
      const gsOther = store.graphScale[other]
      if (gsOther) drawHoverAtT(other, gsOther, Math.max(0, Math.min(t, gsOther.tMaxAxis, store.simulatedTime)))
      else hideGraphHover(other)
    }
  }
}

/**
 * Hover-Cursor + Tooltip für die aktuell gehoverte lokale x-Koordinate im
 * angegebenen Diagramm-Slot (1/2). Liest store.graphScale (von drawGraph()
 * befüllt). Im Zwei-Diagramm-Modus wird zusätzlich der jeweils andere Slot
 * synchronisiert (I14).
 */
export function updateGraphHover(idx, localX) {
  store.hoverActive[idx] = localX !== null
  store.hoverLocalX[idx] = localX
  if (localX === null) {
    if (store.hoverSourceSlot === idx) {
      store.hoverSourceSlot = null
      store.hoverT = null
      hideGraphHover(1); hideGraphHover(2)
    } else {
      hideGraphHover(idx)
    }
    return
  }
  const gs = store.graphScale[idx]
  if (!gs) { hideGraphHover(idx); return }

  const geom = graphGeom()
  const plotW = geom.cellW - PAD_L - PAD_R
  const xClamped = Math.max(PAD_L, Math.min(PAD_L + plotW, localX))
  const rawT = (xClamped - PAD_L) / plotW * (gs.tMaxAxis || 1)
  // Cursor nur auf dem bereits gezeichneten Kurvenabschnitt (KNOWN_LIMITATIONS → I5).
  store.hoverSourceSlot = idx
  store.hoverT = Math.max(0, Math.min(rawT, gs.tMaxAxis, store.simulatedTime))
  refreshHover()
}

function renderHoverTooltip(idx, qq, t, vals, xPix, plotW) {
  const textEl = DOM.hoverTooltipText[idx]
  textEl.innerHTML = ''
  const lineH = 15
  const rows = [
    { text: `t = ${fmt(t, 2)} s`, italic: true },
    ...vals.map(v => ({ text: `${quantitySymbols[qq]}${v.key ? ` (${v.key})` : ''} = ${fmt(v.val, 2)} ${yUnitString(qq)}` })),
  ]
  rows.forEach((row, i) => {
    const tspan = el('tspan', { x: 8, y: 16 + i * lineH })
    if (row.italic) {
      const sym = el('tspan', { 'font-style': 'italic' })
      sym.textContent = 't'
      tspan.appendChild(sym)
      tspan.appendChild(document.createTextNode(row.text.slice(1)))
    } else {
      tspan.textContent = row.text
    }
    textEl.appendChild(tspan)
  })

  const bbox = textEl.getBBox()
  const boxW = bbox.width + 16, boxH = bbox.height + 12
  DOM.hoverTooltipBg[idx].setAttribute('width', boxW)
  DOM.hoverTooltipBg[idx].setAttribute('height', boxH)
  DOM.hoverTooltipBg[idx].setAttribute('x', 0)
  DOM.hoverTooltipBg[idx].setAttribute('y', 0)

  let tx = xPix + 12
  tx = Math.max(PAD_L, Math.min(PAD_L + plotW - boxW, tx))
  DOM.hoverTooltip[idx].setAttribute('transform', `translate(${tx}, ${PAD_T + 6})`)
  DOM.hoverTooltip[idx].setAttribute('visibility', 'visible')
}

function drawGraphs(time) {
  const geom = graphGeom()
  // viewBox ans aktuelle Format + Dual-Anordnung anpassen (Landscape Dual =
  // nebeneinander, Portrait Dual = übereinander) — Ticks/Achsen rechnen in
  // drawGraph aus geom neu (B9/B10).
  DOM.graphSvg.setAttribute('viewBox', `0 0 ${geom.w} ${geom.h}`)
  DOM.graphGroup1.setAttribute('transform', 'translate(0,0)')
  DOM.graphGroup2.setAttribute('transform', `translate(${geom.off2.x},${geom.off2.y})`)
  DOM.graphGroup2.style.visibility = geom.dual ? 'visible' : 'hidden'

  // Hover-Werte (I5): Hover-Gruppen sind Geschwister von graph_group_1/2 (nicht
  // Kinder — die werden von drawGraph() per innerHTML='' geleert) und müssen
  // denselben Transform/Sichtbarkeits-Zustand tragen, damit ihre lokalen
  // Koordinaten mit den Diagrammen übereinstimmen (CTM-auf-Hit-Rect-Trick).
  DOM.graphHoverGroup[1].setAttribute('transform', 'translate(0,0)')
  DOM.graphHoverGroup[2].setAttribute('transform', `translate(${geom.off2.x},${geom.off2.y})`)
  DOM.graphHoverGroup[2].style.visibility = geom.dual ? 'visible' : 'hidden'
  if (!geom.dual) { store.graphScale[2] = null; hideGraphHover(2) }

  drawGraph(1, time, geom)
  if (geom.dual) drawGraph(2, time, geom)

  // Hover-Werte (I5): bei offenem Hover jeden Frame mit der frischen Skala
  // neu berechnen (inkl. I14-Sync) — erst NACH beiden Slots, sonst würde der
  // synchronisierte andere Slot noch mit der Skala vom Vorframe gezeichnet.
  refreshHover()
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
  drawScheibe({ phiRad, omegaRad: P.omega * Math.PI / 180 }, R_t)

  // Stoppuhr-Hauptzeiger (1 U/60 s)
  const ma = (time % 60 / 60) * 2 * Math.PI
  DOM.mainHand.setAttribute('x2', WATCH_CX + WATCH_HAND_LEN * Math.sin(ma))
  DOM.mainHand.setAttribute('y2', WATCH_CY - WATCH_HAND_LEN * Math.cos(ma))

  // FX2: Stoppuhr-Subzeiger (1 U/s)
  const scy = WATCH_CY + WATCH_SUBDIAL_OFFSET
  const sa = (time % 1) * 2 * Math.PI
  DOM.subHand.setAttribute('x2', WATCH_CX + WATCH_SUBDIAL_R * Math.sin(sa))
  DOM.subHand.setAttribute('y2', scy - WATCH_SUBDIAL_R * Math.cos(sa))

  updateAnalysisPanel(P)
  updateScheibePanel(P, time)
  drawGraphs(time)

  DOM.timeLabel.innerHTML = `<i>t</i> = ${fmt(time, 2)} s`
}