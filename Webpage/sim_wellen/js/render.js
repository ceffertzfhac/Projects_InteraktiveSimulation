'use strict'

import {
  PX_PER_CM, CANVAS_SIZE, OMEGA, SCREEN_Y_CM,
  GRAPH_PAD, GRAPH_SIZE, TIME_WINDOW_S, TIME_GRAPH_Y_SCALE,
  SCREEN_X_MIN, SCREEN_X_MAX, SCREEN_GRAPH_Y_SCALE,
} from './constants.js'
import { store, DOM } from './state.js'
import {
  causalRadius, distToSource1, distToSource2, waveContribution,
  computeIntensity, nodalBranches, nodalBranchX, waveSpeed,
  amplitude, phaseDifference, interferenceType, resultantAmplitude,
} from './physics.js'
import { setAxisLabel } from '../../shared/js/svg-text.js'
import { fmt } from '../../shared/js/format.js'

const NS = 'http://www.w3.org/2000/svg'
function el(tag, attrs) {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  return e
}

// render.js-lokaler Modul-State (keine Domänen-/Physik-Daten, gehören nicht
// in store — s. Plan/BACKLOG M12).
let imgData = null

export function initCanvasBuffer() {
  const dpr = window.devicePixelRatio || 1
  DOM.canvas.width = CANVAS_SIZE * dpr
  DOM.canvas.height = CANVAS_SIZE * dpr
  imgData = DOM.ctx.createImageData(DOM.canvas.width, DOM.canvas.height)
}

// ── Wellenfeld (Canvas, Pixel-für-Pixel — Architektur-Ausnahme, s. oben) ────
export function drawField() {
  const w = DOM.canvas.width, h = DOM.canvas.height
  const data = imgData.data

  const k = 2 * Math.PI / store.lambda
  const phaseRad = store.phaseDeg * Math.PI / 180
  const omegaT = OMEGA * store.time
  const maxDist = causalRadius(store.lambda, store.time)

  const scale = (CANVAS_SIZE / PX_PER_CM) / w
  const cx = w / 2, cy = h / 2
  const s1x = -store.d / 2, s2x = store.d / 2

  let idx = 0
  for (let y = 0; y < h; y++) {
    const yCm = (y - cy) * scale
    const ySq = yCm * yCm
    for (let x = 0; x < w; x++) {
      const xCm = (x - cx) * scale
      const r1 = Math.sqrt((xCm - s1x) ** 2 + ySq)
      const r2 = Math.sqrt((xCm - s2x) ** 2 + ySq)

      if (store.mode === 'wave') {
        const u1 = waveContribution(r1, k, omegaT, 0, maxDist)
        const u2 = waveContribution(r2, k, omegaT, phaseRad, maxDist)
        const val = Math.tanh((u1 + u2) * 1.5)
        const v = Math.abs(val)
        if (val > 0) {
          data[idx] = 255 * (1 - v)
          data[idx + 1] = 255 - (161 * v)
          data[idx + 2] = 255 - (78 * v)
        } else {
          data[idx] = 255 - (46 * v)
          data[idx + 1] = 255 * (1 - v)
          data[idx + 2] = 255 - (210 * v)
        }
      } else {
        const iVal = computeIntensity(r1, r2, k, phaseRad, maxDist, maxDist)
        let val = Math.min(1, Math.sqrt(iVal) * 0.6)
        const intensity = Math.floor(val * 255)
        data[idx] = intensity * 0.1
        data[idx + 1] = intensity * 0.5
        data[idx + 2] = intensity
      }
      data[idx + 3] = 255
      idx += 4
    }
  }
  DOM.ctx.putImageData(imgData, 0, 0)
}

// ── Overlay (SVG): Quellen, Detektor, Schirmlinie, Knotenlinien ─────────────
export function drawOverlay() {
  const cx = 200, cy = 200
  const scale = PX_PER_CM

  const s1px = cx - (store.d / 2) * scale
  const s2px = cx + (store.d / 2) * scale
  DOM.src1.setAttribute('cx', s1px); DOM.src1.setAttribute('cy', cy)
  DOM.src2.setAttribute('cx', s2px); DOM.src2.setAttribute('cy', cy)
  DOM.lblS1.setAttribute('x', s1px); DOM.lblS1.setAttribute('y', cy)
  DOM.lblS2.setAttribute('x', s2px); DOM.lblS2.setAttribute('y', cy)

  const screenYPx = cy + SCREEN_Y_CM * scale
  DOM.screenLine.setAttribute('y1', screenYPx)
  DOM.screenLine.setAttribute('y2', screenYPx)

  const detX = cx + store.detector.x * scale
  const detY = cy + store.detector.y * scale
  DOM.detectorGrp.setAttribute('transform', `translate(${detX}, ${detY})`)

  DOM.geoLayer.innerHTML = ''
  const line = (x1, y1, x2, y2) => el('line', { x1, y1, x2, y2, class: 'dist-line' })
  DOM.geoLayer.appendChild(line(s1px, cy, detX, detY))
  DOM.geoLayer.appendChild(line(s2px, cy, detX, detY))

  if (store.showNodal) {
    const branches = nodalBranches(store.d, store.lambda, store.phaseDeg)
    for (const branch of branches) {
      let d = ''
      for (let yPx = -200; yPx <= 200; yPx += 5) {
        const yCm = yPx / scale
        const xCm = nodalBranchX(branch, yCm)
        const px = cx + xCm * scale
        d += (yPx === -200 ? 'M' : 'L') + `${px.toFixed(1)},${(cy + yPx).toFixed(1)} `
      }
      DOM.geoLayer.appendChild(el('path', { d, fill: 'none', class: 'nodal-line' }))
    }
  }
}

// ── Graph-Gitter (Zeit- oder Schirm/Intensitäts-Modus, per showScreen) ──────
export function drawGraphGrid() {
  const grid = DOM.graphGrid
  grid.innerHTML = ''
  const P = GRAPH_PAD
  const W = GRAPH_SIZE - P.left - P.right
  const H = GRAPH_SIZE - P.top - P.bottom
  const yAxisX = P.left

  grid.appendChild(el('rect', { x: P.left, y: P.top, width: W, height: H, class: 'graph-bg' }))
  grid.appendChild(el('line', { x1: yAxisX, y1: P.top, x2: yAxisX, y2: P.top + H, class: 'grid-line' }))

  if (!store.showScreen) {
    const xAxisY = P.top + H / 2
    grid.appendChild(el('line', { x1: P.left, y1: xAxisY, x2: P.left + W, y2: xAxisY, class: 'grid-line' }))
    const tLabel = el('text', { x: P.left + W / 2, y: P.top + H + 30, 'text-anchor': 'middle', class: 'axis-label' })
    setAxisLabel(tLabel, 't / s')
    grid.appendChild(tLabel)
    const uLabel = el('text', { x: 15, y: P.top + H / 2, 'text-anchor': 'middle', class: 'axis-label', transform: `rotate(-90, 15, ${P.top + H / 2})` })
    setAxisLabel(uLabel, 'u')
    grid.appendChild(uLabel)
    grid.appendChild(el('line', { id: 'time_marker', x1: P.left + W - 10, y1: P.top, x2: P.left + W - 10, y2: P.top + H, class: 'time-marker' }))
  } else {
    grid.appendChild(el('line', { x1: P.left, y1: P.top + H, x2: P.left + W, y2: P.top + H, class: 'grid-line' }))
    const xLabel = el('text', { x: P.left + W / 2, y: P.top + H + 30, 'text-anchor': 'middle', class: 'axis-label' })
    setAxisLabel(xLabel, 'x / cm')
    grid.appendChild(xLabel)
    const iLabel = el('text', { x: 15, y: P.top + H / 2, 'text-anchor': 'middle', class: 'axis-label', transform: `rotate(-90, 15, ${P.top + H / 2})` })
    setAxisLabel(iLabel, 'I')
    grid.appendChild(iLabel)
  }
}

export function drawGraph() {
  if (store.showScreen) drawScreenGraph()
  else drawTimeGraph()
}

// Zeit-Graph: u₁(t), u₂(t), u_ges(t) am Detektor über ein 2s-Sliding-Fenster.
function drawTimeGraph() {
  const P = GRAPH_PAD
  const W = GRAPH_SIZE - P.left - P.right
  const H = GRAPH_SIZE - P.top - P.bottom
  const centerY = P.top + H / 2

  const tEnd = store.time
  const tStart = tEnd - TIME_WINDOW_S
  const steps = 100

  const r1 = distToSource1(store.detector.x, store.detector.y, store.d)
  const r2 = distToSource2(store.detector.x, store.detector.y, store.d)
  const k = 2 * Math.PI / store.lambda
  const phaseRad = store.phaseDeg * Math.PI / 180
  const vWave = waveSpeed(store.lambda)

  let dU1 = '', dU2 = '', dSum = ''
  for (let i = 0; i <= steps; i++) {
    const rel = i / steps
    const px = P.left + rel * (W - 10)
    const t = tStart + rel * TIME_WINDOW_S
    const maxDistAtT = vWave * t

    const val1 = waveContribution(r1, k, OMEGA * t, 0, maxDistAtT)
    const val2 = waveContribution(r2, k, OMEGA * t, phaseRad, maxDistAtT)
    const valSum = val1 + val2

    const y1 = centerY - val1 * TIME_GRAPH_Y_SCALE
    const y2 = centerY - val2 * TIME_GRAPH_Y_SCALE
    const ySum = centerY - valSum * TIME_GRAPH_Y_SCALE

    const cmd = i === 0 ? 'M' : 'L'
    dU1 += `${cmd}${px.toFixed(1)},${y1.toFixed(1)} `
    dU2 += `${cmd}${px.toFixed(1)},${y2.toFixed(1)} `
    dSum += `${cmd}${px.toFixed(1)},${ySum.toFixed(1)} `
  }
  DOM.pathU1.setAttribute('d', dU1)
  DOM.pathU2.setAttribute('d', dU2)
  DOM.pathSum.setAttribute('d', dSum)
}

// Schirm/Intensitäts-Graph: I(x) entlang einer virtuellen Schirmlinie.
function drawScreenGraph() {
  const P = GRAPH_PAD
  const W = GRAPH_SIZE - P.left - P.right
  const H = GRAPH_SIZE - P.top - P.bottom
  const bottomY = P.top + H
  const steps = 150
  const range = SCREEN_X_MAX - SCREEN_X_MIN

  const k = 2 * Math.PI / store.lambda
  const phaseRad = store.phaseDeg * Math.PI / 180

  let d = `M ${P.left},${bottomY} `
  for (let i = 0; i <= steps; i++) {
    const rel = i / steps
    const px = P.left + rel * W
    const xCm = SCREEN_X_MIN + rel * range
    const r1 = Math.sqrt((xCm - (-store.d / 2)) ** 2 + SCREEN_Y_CM ** 2)
    const r2 = Math.sqrt((xCm - (store.d / 2)) ** 2 + SCREEN_Y_CM ** 2)
    const iVal = computeIntensity(r1, r2, k, phaseRad)
    const py = bottomY - iVal * SCREEN_GRAPH_Y_SCALE
    d += `L ${px.toFixed(1)},${py.toFixed(1)} `
  }
  d += `L ${P.left + W},${bottomY} Z`
  DOM.pathIntensity.setAttribute('d', d)
}

// ── Rechte Analyse-Sidebar: Live-Readouts am Detektor P ─────────────────────
// Umgezogen aus der LINKEN Sidebar des Originals ("Analyse am Punkt P" stand
// dort neben den Reglern) — Live-Readouts gehören repo-weit in die rechte
// Analyse-Sidebar, Steuerung bleibt links (strukturelle Verbesserung, s.
// BACKLOG M12, keine inhaltliche Änderung).
export function updateAnalysis() {
  const r1 = distToSource1(store.detector.x, store.detector.y, store.d)
  const r2 = distToSource2(store.detector.x, store.detector.y, store.d)
  const ds = r2 - r1

  const { dPhi, dPhiDeg } = phaseDifference(ds, store.lambda, store.phaseDeg)
  const cosVal = Math.cos(dPhi)
  const { label, colorVar } = interferenceType(cosVal)

  const A1 = amplitude(r1), A2 = amplitude(r2)
  const aRes = resultantAmplitude(A1, A2, cosVal)

  DOM.outR1.textContent = fmt(r1) + ' cm'
  DOM.outR2.textContent = fmt(r2) + ' cm'
  DOM.outDs.textContent = fmt(Math.abs(ds)) + ' cm'
  DOM.outRatio.textContent = fmt(Math.abs(ds) / store.lambda)
  DOM.outDphi.textContent = fmt(dPhiDeg, 0) + '°'
  DOM.outType.textContent = label
  DOM.outType.style.color = `var(${colorVar})`
  DOM.outAmp.textContent = fmt(aRes)
}

export function updateUIValues() {
  DOM.valDist.textContent = fmt(store.d, 1) + ' cm'
  DOM.valLambda.textContent = fmt(store.lambda, 1) + ' cm'
  DOM.valPhase.textContent = fmt(store.phaseDeg, 0) + '°'
}
