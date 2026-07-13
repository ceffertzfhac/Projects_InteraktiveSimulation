'use strict'

import {
  G, PIXELS_PER_METER, L0,
  ANIM_W, ANIM_H, ANCHOR_OFFSET_FROM_EDGE, ANCHOR_THICKNESS, ANCHOR_CROSS_DIMENSION,
  INITIAL_MASS_SIZE, MIN_MASS_SIZE, MASS_MIN, MASS_MAX, K_MIN, K_MAX,
  PIXELS_PER_VELOCITY_UNIT, PIXELS_PER_ACCELERATION_UNIT,
  VEC_MARKER_LEN,
  GRAPH_W, GRAPH_H,
  WATCH_CX, WATCH_CY, WATCH_R, SDIAL_CX, SDIAL_CY, SDIAL_R,
  SEG_THICK, SEG_LEN, DIGIT_SPACING, COLON_WIDTH, LCD_FRAME_PADDING,
  DIGIT_WIDTH, DIGIT_HEIGHT, COLON_DOT_SIZE,
  DIGITAL_FRAME_X, DIGITAL_FRAME_Y, DIGITAL_FRAME_W, DIGITAL_FRAME_H,
  DIGIT_SEGMENTS_MAP,
  graphTitles, graphAxisLabels,
} from './constants.js'
import { store, DOM } from './state.js'
import { linePlotIndex, frequency, kineticEnergy, potentialEnergy, totalEnergy,
         displacement, velocity, acceleration } from './physics.js'
import { fmt } from '../../shared/js/format.js'
import { setAxisLabel, setGraphTitle } from '../../shared/js/svg-text.js'
import { tAxisStep, niceStepLE } from '../../shared/js/ticks.js'
import { shortenEnd } from '../../shared/js/vectors.js'
export { fmt }

const NS = 'http://www.w3.org/2000/svg'

function el(tag, attrs) {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  return e
}

// ── Diagramm-Linien je Typ (I7: Energie-Composite = 3 Linien) ──────────────────
// dataKey = Name des precompute-Arrays in store; color = Stroke-Farbe.
// Schwingungsgrößen bleiben wie bisher auf var(--accent); Energie nutzt die
// kanonischen Energie-Tokens (--c-ekin/-epot/-etot, s. shared design-system.css).
const GRAPH_LINES = {
  pos_t:      [{ dataKey: 'xData',    color: 'var(--accent)' }],
  v_t:        [{ dataKey: 'vData',    color: 'var(--accent)' }],
  a_t:        [{ dataKey: 'aData',    color: 'var(--accent)' }],
  ekin:       [{ dataKey: 'ekData',   color: 'var(--c-ekin)' }],
  epot:       [{ dataKey: 'epData',   color: 'var(--c-epot)' }],
  eges:       [{ dataKey: 'egesData', color: 'var(--c-etot)' }],
  ecomposite: [
    { dataKey: 'ekData',   color: 'var(--c-ekin)' },
    { dataKey: 'epData',   color: 'var(--c-epot)' },
    { dataKey: 'egesData', color: 'var(--c-etot)' },
  ],
}

// Aktueller Wert einer Linie zur absoluten Zeit t (exakt analytisch, kein
// Interpolations-Rundungsfehler am Nulldurchgang — I7).
function lineCurrentValue(dataKey, t) {
  const x = displacement(t), v = velocity(t)
  switch (dataKey) {
    case 'xData':    return x
    case 'vData':    return v
    case 'aData':    return acceleration(t)
    case 'ekData':   return kineticEnergy(x, v)
    case 'epData':   return potentialEnergy(x)
    case 'egesData': return kineticEnergy(x, v) + potentialEnergy(x)
    default:         return 0
  }
}

// fmt() via shared/js/format.js (T6)

// SVG-Text mit gemischter Formatierung aus HTML-<i>-Tags (Symbol kursiv)
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


// ── Feder (Zickzack-Polyline) ────────────────────────────────────────────────
function drawSpring(startX, startY, endX, endY, numSegments = 20) {
  const dx = endX - startX, dy = endY - startY
  const length = Math.sqrt(dx * dx + dy * dy)
  if (length < 5) { DOM.spring.setAttribute('points', `${startX},${startY} ${endX},${endY}`); return }
  let points = `${startX},${startY} `
  const springWidth = 20
  const perpX = -dy / length, perpY = dx / length
  for (let i = 1; i < numSegments; i++) {
    const progress = i / numSegments
    const lineX = startX + progress * dx
    const lineY = startY + progress * dy
    const offset = i % 2 === 0 ? -springWidth : springWidth
    points += `${lineX + offset * perpX},${lineY + offset * perpY} `
  }
  points += `${endX},${endY}`
  DOM.spring.setAttribute('points', points)
}

// ── Stoppuhr-Skalen ──────────────────────────────────────────────────────────
export function drawStopwatchMarks() {
  DOM.stopwatchMarks.innerHTML = ''
  for (let s = 0; s < 60; s++) {
    const a = (s / 60) * 2 * Math.PI
    const ri = WATCH_R - (s % 5 === 0 ? 8 : 5)
    DOM.stopwatchMarks.appendChild(el('line', {
      x1: WATCH_CX + ri * Math.sin(a), y1: WATCH_CY - ri * Math.cos(a),
      x2: WATCH_CX + WATCH_R * Math.sin(a), y2: WATCH_CY - WATCH_R * Math.cos(a),
      class: 'sw-mark', 'stroke-width': s % 5 === 0 ? 2 : 1,
    }))
  }
}

export function drawSubdialMarks() {
  DOM.subdialMarks.innerHTML = ''
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * 2 * Math.PI
    DOM.subdialMarks.appendChild(el('line', {
      x1: SDIAL_CX + (SDIAL_R - 3) * Math.sin(a), y1: SDIAL_CY - (SDIAL_R - 3) * Math.cos(a),
      x2: SDIAL_CX + SDIAL_R * Math.sin(a), y2: SDIAL_CY - SDIAL_R * Math.cos(a),
      class: 'sw-mark', 'stroke-width': 1,
    }))
  }
}

function segmentRectDefs() {
  return [
    { x: SEG_THICK, y: 0, width: SEG_LEN, height: SEG_THICK },
    { x: SEG_LEN + SEG_THICK, y: SEG_THICK, width: SEG_THICK, height: SEG_LEN },
    { x: SEG_LEN + SEG_THICK, y: SEG_LEN + 2 * SEG_THICK, width: SEG_THICK, height: SEG_LEN },
    { x: SEG_THICK, y: 2 * SEG_LEN + 2 * SEG_THICK, width: SEG_LEN, height: SEG_THICK },
    { x: 0, y: SEG_LEN + 2 * SEG_THICK, width: SEG_THICK, height: SEG_LEN },
    { x: 0, y: SEG_THICK, width: SEG_THICK, height: SEG_LEN },
    { x: SEG_THICK, y: SEG_LEN + SEG_THICK, width: SEG_LEN, height: SEG_THICK },
  ]
}

export function initDigitalDisplaySegments() {
  DOM.digitalDisplayGroup.innerHTML = ''
  DOM.digitalDisplayGroup.appendChild(el('rect', {
    id: 'digital_display_frame', x: DIGITAL_FRAME_X, y: DIGITAL_FRAME_Y,
    width: DIGITAL_FRAME_W, height: DIGITAL_FRAME_H,
    class: 'lcd-frame', 'stroke-width': 2, rx: 8, ry: 8,
  }))
  const contentY = DIGITAL_FRAME_Y + LCD_FRAME_PADDING
  const defs = segmentRectDefs()
  const x0 = DIGITAL_FRAME_X + LCD_FRAME_PADDING
  const x1 = x0 + DIGIT_WIDTH + DIGIT_SPACING
  const xColon = x1 + DIGIT_WIDTH + DIGIT_SPACING
  const x2 = xColon + COLON_WIDTH + DIGIT_SPACING
  const x3 = x2 + DIGIT_WIDTH + DIGIT_SPACING
  const xs = [x0, x1, x2, x3]
  for (let i = 0; i < 4; i++) {
    defs.forEach((d, si) => {
      DOM.digitalDisplayGroup.appendChild(el('rect', {
        id: `digit_seg_${i}_${si}`, x: xs[i] + d.x, y: contentY + d.y,
        width: d.width, height: d.height, class: 'lcd-seg-off', rx: 1, ry: 1,
      }))
    })
  }
  const colonX = xColon + COLON_WIDTH / 2
  DOM.digitalDisplayGroup.appendChild(el('rect', {
    id: 'colon_dot_top', x: colonX - COLON_DOT_SIZE / 2, y: contentY + DIGIT_HEIGHT * 0.3 - COLON_DOT_SIZE / 2,
    width: COLON_DOT_SIZE, height: COLON_DOT_SIZE, class: 'lcd-seg-off', rx: COLON_DOT_SIZE / 2,
  }))
  DOM.digitalDisplayGroup.appendChild(el('rect', {
    id: 'colon_dot_bottom', x: colonX - COLON_DOT_SIZE / 2, y: contentY + DIGIT_HEIGHT * 0.7 - COLON_DOT_SIZE / 2,
    width: COLON_DOT_SIZE, height: COLON_DOT_SIZE, class: 'lcd-seg-off', rx: COLON_DOT_SIZE / 2,
  }))
}

export function updateDigitalDisplay(totalSeconds) {
  const seconds = Math.floor(totalSeconds % 60)
  const hundredths = Math.round(totalSeconds * 100) % 100
  const digits = [Math.floor(seconds / 10), seconds % 10, Math.floor(hundredths / 10), hundredths % 10]
  for (let i = 0; i < 4; i++) {
    const active = DIGIT_SEGMENTS_MAP[digits[i]]
    for (let si = 0; si < 7; si++) {
      const segEl = document.getElementById(`digit_seg_${i}_${si}`)
      if (segEl) segEl.setAttribute('class', active.includes(si) ? 'lcd-seg-on' : 'lcd-seg-off')
    }
  }
  document.getElementById('colon_dot_top')?.setAttribute('class', 'lcd-seg-on')
  document.getElementById('colon_dot_bottom')?.setAttribute('class', 'lcd-seg-on')
}

// ── Szene aufbauen (statische Elemente, orientierungsabhängig) ───────────────
// Gibt { animCenterX, animCenterY, springAttachX, springAttachY } zurück.
export function setupScene() {
  const cx0 = ANIM_W / 2, cy0 = ANIM_H / 2
  const A = store.amplitude
  const massSize = store.currentMassRenderSize
  let animCenterX, animCenterY, springAttachX, springAttachY

  // Achsenpfeile erst ausblenden
  DOM.xAxisArrow.style.visibility = 'hidden'
  DOM.xAxisLabelText.style.visibility = 'hidden'
  DOM.yAxisArrow.style.visibility = 'hidden'
  DOM.yAxisLabelText.style.visibility = 'hidden'
  DOM.unstretchedLine.style.visibility = 'hidden'
  DOM.unstretchedLabel.style.visibility = 'hidden'
  DOM.surface.style.visibility = 'hidden'

  if (store.oscillationMode === 'horizontal') {
    // Horizontaler Aufbau hat keine massenabhängige Dehnung (keine Gravitation
    // entlang der Schwingungsachse) — volle Skalierung, kein Clamp nötig.
    store.currentPixelsPerMeter = PIXELS_PER_METER
    const scale = v => v * store.currentPixelsPerMeter
    // Horizontaler Aufbau: breites SVG → gestapelt (Sim oben, Diagramm unten).
    DOM.centerArea.classList.remove('layout-side')
    // Stoppuhr nach rechts (auf Oszillator-Höhe), Oszillator nutzt die Breite.
    // viewBox weiter (600) + nach oben gestraft (y ab 125, Höhe 225, Aspect
    // 2,67) → SVG füllt die breite Zelle statt höhenlimitiert mit Seitenrändern
    // zu sein; Schrift skaliert hoch. Sim-Reihe schmaler (CSS 1fr/1fr) → der
    // frei werdende Raum ans Diagramm.
    DOM.mainSvg.setAttribute('viewBox', '0 125 600 225')
    DOM.stopwatch.setAttribute('transform', 'translate(340, 180) scale(0.595)')
    DOM.pos0Label.innerHTML = 'Anfangsauslenkung <i>x</i>₀:'
    DOM.anchorObject.setAttribute('x', ANCHOR_OFFSET_FROM_EDGE)
    DOM.anchorObject.setAttribute('y', cy0 - ANCHOR_CROSS_DIMENSION / 2)
    DOM.anchorObject.setAttribute('width', ANCHOR_THICKNESS)
    DOM.anchorObject.setAttribute('height', ANCHOR_CROSS_DIMENSION)
    springAttachX = ANCHOR_OFFSET_FROM_EDGE + ANCHOR_THICKNESS
    springAttachY = cy0
    animCenterX = springAttachX + scale(L0)
    animCenterY = cy0

    DOM.surface.style.visibility = 'visible'
    DOM.surface.setAttribute('x1', 0)
    DOM.surface.setAttribute('x2', ANIM_W)
    DOM.surface.setAttribute('y1', animCenterY + massSize / 2)
    DOM.surface.setAttribute('y2', animCenterY + massSize / 2)

    DOM.equilibriumLine.setAttribute('x1', animCenterX)
    DOM.equilibriumLine.setAttribute('y1', animCenterY - 80)
    DOM.equilibriumLine.setAttribute('x2', animCenterX)
    DOM.equilibriumLine.setAttribute('y2', animCenterY + 80)
    DOM.equilibriumLabel.setAttribute('x', animCenterX)
    DOM.equilibriumLabel.setAttribute('y', animCenterY - 90)
    DOM.equilibriumLabel.textContent = 'x = 0 (Ruhelage)'

    DOM.minPosLine.setAttribute('x1', animCenterX - scale(Math.abs(A)))
    DOM.minPosLine.setAttribute('x2', animCenterX - scale(Math.abs(A)))
    DOM.minPosLine.setAttribute('y1', animCenterY - 70)
    DOM.minPosLine.setAttribute('y2', animCenterY + 70)
    DOM.maxPosLine.setAttribute('x1', animCenterX + scale(Math.abs(A)))
    DOM.maxPosLine.setAttribute('x2', animCenterX + scale(Math.abs(A)))
    DOM.maxPosLine.setAttribute('y1', animCenterY - 70)
    DOM.maxPosLine.setAttribute('y2', animCenterY + 70)
    DOM.minPosLabel.setAttribute('x', animCenterX - scale(Math.abs(A)))
    DOM.minPosLabel.setAttribute('y', animCenterY - 80)
    DOM.minPosLabel.textContent = '−x₀'
    DOM.maxPosLabel.setAttribute('x', animCenterX + scale(Math.abs(A)))
    DOM.maxPosLabel.setAttribute('y', animCenterY - 80)
    DOM.maxPosLabel.textContent = '+x₀'

    DOM.xAxisArrow.setAttribute('x1', animCenterX)
    DOM.xAxisArrow.setAttribute('y1', animCenterY + massSize / 2 + 20)
    DOM.xAxisArrow.setAttribute('x2', animCenterX + scale(1.8))
    DOM.xAxisArrow.setAttribute('y2', animCenterY + massSize / 2 + 20)
    DOM.xAxisArrow.style.visibility = 'visible'
    createStyledSvgText(DOM.xAxisLabelText, '<i>x</i>')
    DOM.xAxisLabelText.setAttribute('x', animCenterX + scale(1.8) + 15)
    DOM.xAxisLabelText.setAttribute('y', animCenterY + massSize / 2 + 25)
    DOM.xAxisLabelText.style.visibility = 'visible'
  } else {
    // Vertikaler Aufbau: hohes SVG → nebeneinander (Sim links, Diagramm rechts).
    DOM.centerArea.classList.add('layout-side')
    // Masse hängt nach unten, Auslenkung ±A·scale in y. viewBox auf den
    // tatsächlichen Inhaltsbereich gestrafft (x 135..435, y 5..480): der
    // Oszillator (y-Achse bei x≈145, Equilibrium-Label bis x≈405) plus Stoppuhr
    // oben-rechts (bis x≈429) füllen so die hohe, schmale Zelle aus, statt im
    // 450-breiten viewBox mit großem linken Leerraum winzig zu skalieren.
    DOM.mainSvg.setAttribute('viewBox', '135 5 300 475')
    DOM.stopwatch.setAttribute('transform', 'translate(220, 60) scale(0.595)')
    DOM.pos0Label.innerHTML = 'Anfangsauslenkung <i>y</i>₀:'
    const deltaL = (store.m * G) / store.k
    springAttachX = cx0
    springAttachY = ANCHOR_OFFSET_FROM_EDGE + ANCHOR_THICKNESS

    // B5: bei großer Masse/kleinem k wird δL=mg/k groß — die Ruhelage kann weit
    // unter den sichtbaren viewBox-Bereich (y bis 480) rutschen. Skaliert
    // Pixel/Meter dynamisch so, daß Federlänge + δL + Amplitude in den
    // verfügbaren Platz passen (Clamp nach oben bei PIXELS_PER_METER, sodaß
    // kleine δL wie bisher unskaliert bleiben).
    const neededMeters = L0 + deltaL + Math.abs(A)
    const availablePx = 480 - springAttachY - 60 // Bodenrand minus Label-/Massenpuffer
    store.currentPixelsPerMeter = Math.min(PIXELS_PER_METER, availablePx / neededMeters)
    const scale = v => v * store.currentPixelsPerMeter

    DOM.anchorObject.setAttribute('x', cx0 - ANCHOR_CROSS_DIMENSION / 2)
    DOM.anchorObject.setAttribute('y', ANCHOR_OFFSET_FROM_EDGE)
    DOM.anchorObject.setAttribute('width', ANCHOR_CROSS_DIMENSION)
    DOM.anchorObject.setAttribute('height', ANCHOR_THICKNESS)
    animCenterX = cx0
    animCenterY = springAttachY + scale(L0) + scale(deltaL)

    DOM.equilibriumLine.setAttribute('x1', animCenterX - 80)
    DOM.equilibriumLine.setAttribute('y1', animCenterY)
    DOM.equilibriumLine.setAttribute('x2', animCenterX + 80)
    DOM.equilibriumLine.setAttribute('y2', animCenterY)
    DOM.equilibriumLabel.setAttribute('x', animCenterX + 120)
    DOM.equilibriumLabel.setAttribute('y', animCenterY + 4)
    DOM.equilibriumLabel.textContent = 'y = 0 (Ruhelage)'

    const unstretchedY = springAttachY + scale(L0)
    DOM.unstretchedLine.setAttribute('x1', animCenterX - 50)
    DOM.unstretchedLine.setAttribute('y1', unstretchedY)
    DOM.unstretchedLine.setAttribute('x2', animCenterX + 50)
    DOM.unstretchedLine.setAttribute('y2', unstretchedY)
    DOM.unstretchedLabel.setAttribute('x', animCenterX + 100)
    DOM.unstretchedLabel.setAttribute('y', unstretchedY + 4)
    DOM.unstretchedLabel.textContent = 'Feder entspannt'
    DOM.unstretchedLine.style.visibility = 'visible'
    DOM.unstretchedLabel.style.visibility = 'visible'

    DOM.minPosLine.setAttribute('x1', animCenterX - 70)
    DOM.minPosLine.setAttribute('x2', animCenterX + 70)
    DOM.minPosLine.setAttribute('y1', animCenterY - scale(Math.abs(A)))
    DOM.minPosLine.setAttribute('y2', animCenterY - scale(Math.abs(A)))
    DOM.maxPosLine.setAttribute('x1', animCenterX - 70)
    DOM.maxPosLine.setAttribute('x2', animCenterX + 70)
    DOM.maxPosLine.setAttribute('y1', animCenterY + scale(Math.abs(A)))
    DOM.maxPosLine.setAttribute('y2', animCenterY + scale(Math.abs(A)))
    DOM.minPosLabel.setAttribute('x', animCenterX + 80)
    DOM.minPosLabel.setAttribute('y', animCenterY - scale(Math.abs(A)) - 5)
    DOM.minPosLabel.textContent = '+y₀'
    DOM.maxPosLabel.setAttribute('x', animCenterX + 80)
    DOM.maxPosLabel.setAttribute('y', animCenterY + scale(Math.abs(A)) + 15)
    DOM.maxPosLabel.textContent = '−y₀'

    DOM.yAxisArrow.setAttribute('x1', animCenterX - massSize / 2 - 50)
    DOM.yAxisArrow.setAttribute('y1', animCenterY)
    DOM.yAxisArrow.setAttribute('x2', animCenterX - massSize / 2 - 50)
    DOM.yAxisArrow.setAttribute('y2', animCenterY - scale(1.8))
    DOM.yAxisArrow.style.visibility = 'visible'
    createStyledSvgText(DOM.yAxisLabelText, '<i>y</i>')
    DOM.yAxisLabelText.setAttribute('x', animCenterX - massSize / 2 - 50)
    DOM.yAxisLabelText.setAttribute('y', animCenterY - scale(1.8) - 15)
    DOM.yAxisLabelText.style.visibility = 'visible'
  }

  const showAmp = Math.abs(A) > 1e-6
  ;[DOM.minPosLine, DOM.maxPosLine, DOM.minPosLabel, DOM.maxPosLabel].forEach(e => {
    e.style.visibility = showAmp ? 'visible' : 'hidden'
  })

  // Diagramm-Format pro Aufbau: horizontal → Landscape (700×410), vertikal →
  // Portrait (410×700), damit der Graph in die hohe, schmale Zelle neben dem
  // vertikalen Oszillator paßt statt als flacher Streifen winzig zu skalieren.
  DOM.graphSvg.setAttribute('viewBox',
    store.oscillationMode === 'vertical' ? `0 0 ${GRAPH_H} ${GRAPH_W}` : `0 0 ${GRAPH_W} ${GRAPH_H}`)

  return { animCenterX, animCenterY, springAttachX, springAttachY }
}

// ── Szene aktualisieren (Masse, Feder, Vektoren, Stoppuhr) ───────────────────
export function updateScene(t, x, v, a, centers) {
  // Nutzt dieselbe (ggf. B5-geclampte) Skala wie setupScene(), damit die
  // Schwingung nicht von der Ruhelage/Feder abweicht.
  const scale = val => val * store.currentPixelsPerMeter
  const { animCenterX, animCenterY, springAttachX, springAttachY } = centers
  const massSize = store.currentMassRenderSize
  const vecOffset = 0.5 * massSize + 5
  let massCx, massCy
  // B23: shortenEnd gibt null zurück, wenn der Vektor kürzer als die Pfeilspitze
  // ist (Nulldurchgang von v/a, Ruhelage bei x=0). Ein zu kurzer Vektor wird
  // verborgen statt mit überschießender Spitze gezeichnet.
  let posShort = false, velShort = false, accShort = false

  if (store.oscillationMode === 'horizontal') {
    massCx = animCenterX + scale(x)
    massCy = animCenterY
    if (DOM.togPosition.checked) {
      // B22: Schaft um Marker-Länge kürzen → Spitze landet exakt auf dem
      // Zielpunkt (Massenzentrum), nicht 12.5 px darüber hinaus.
      const e = shortenEnd(animCenterX, massCy + vecOffset, massCx, massCy + vecOffset, VEC_MARKER_LEN)
      if (e) {
        DOM.positionVector.setAttribute('x1', animCenterX)
        DOM.positionVector.setAttribute('y1', massCy + vecOffset)
        DOM.positionVector.setAttribute('x2', e.x2)
        DOM.positionVector.setAttribute('y2', e.y2)
      } else posShort = true
    }
    if (DOM.togVelocity.checked) {
      const tx = massCx + v * PIXELS_PER_VELOCITY_UNIT
      const e = shortenEnd(massCx, massCy, tx, massCy, VEC_MARKER_LEN)
      if (e) {
        DOM.velocityVector.setAttribute('x1', massCx)
        DOM.velocityVector.setAttribute('y1', massCy)
        DOM.velocityVector.setAttribute('x2', e.x2)
        DOM.velocityVector.setAttribute('y2', e.y2)
      } else velShort = true
    }
    if (DOM.togAcceleration.checked) {
      const tx = massCx + a * PIXELS_PER_ACCELERATION_UNIT
      const e = shortenEnd(massCx, massCy - vecOffset, tx, massCy - vecOffset, VEC_MARKER_LEN)
      if (e) {
        DOM.accelerationVector.setAttribute('x1', massCx)
        DOM.accelerationVector.setAttribute('y1', massCy - vecOffset)
        DOM.accelerationVector.setAttribute('x2', e.x2)
        DOM.accelerationVector.setAttribute('y2', e.y2)
      } else accShort = true
    }
  } else {
    massCx = animCenterX
    massCy = animCenterY - scale(x) // y zeigt nach oben → positive Auslenkung verkleinert SVG-y
    if (DOM.togPosition.checked) {
      const e = shortenEnd(massCx + vecOffset, animCenterY, massCx + vecOffset, massCy, VEC_MARKER_LEN)
      if (e) {
        DOM.positionVector.setAttribute('x1', massCx + vecOffset)
        DOM.positionVector.setAttribute('y1', animCenterY)
        DOM.positionVector.setAttribute('x2', e.x2)
        DOM.positionVector.setAttribute('y2', e.y2)
      } else posShort = true
    }
    if (DOM.togVelocity.checked) {
      const ty = massCy - v * PIXELS_PER_VELOCITY_UNIT
      const e = shortenEnd(massCx, massCy, massCx, ty, VEC_MARKER_LEN)
      if (e) {
        DOM.velocityVector.setAttribute('x1', massCx)
        DOM.velocityVector.setAttribute('y1', massCy)
        DOM.velocityVector.setAttribute('x2', e.x2)
        DOM.velocityVector.setAttribute('y2', e.y2)
      } else velShort = true
    }
    if (DOM.togAcceleration.checked) {
      const ty = massCy - a * PIXELS_PER_ACCELERATION_UNIT
      const e = shortenEnd(massCx - vecOffset, massCy, massCx - vecOffset, ty, VEC_MARKER_LEN)
      if (e) {
        DOM.accelerationVector.setAttribute('x1', massCx - vecOffset)
        DOM.accelerationVector.setAttribute('y1', massCy)
        DOM.accelerationVector.setAttribute('x2', e.x2)
        DOM.accelerationVector.setAttribute('y2', e.y2)
      } else accShort = true
    }
  }

  DOM.mass.setAttribute('x', massCx - massSize / 2)
  DOM.mass.setAttribute('y', massCy - massSize / 2)
  drawSpring(springAttachX, springAttachY, massCx, massCy)

  DOM.positionVector.style.visibility = (DOM.togPosition.checked && !posShort) ? 'visible' : 'hidden'
  DOM.velocityVector.style.visibility = (DOM.togVelocity.checked && !velShort) ? 'visible' : 'hidden'
  DOM.accelerationVector.style.visibility = (DOM.togAcceleration.checked && !accShort) ? 'visible' : 'hidden'

  // Stoppuhr
  if (store.isDigitalDisplay) {
    updateDigitalDisplay(t)
  } else {
    const mainA = (t % 60 / 60) * 2 * Math.PI
    const subA = (t % 1) * 2 * Math.PI
    DOM.mainHand.setAttribute('x2', WATCH_CX + 60 * Math.sin(mainA))
    DOM.mainHand.setAttribute('y2', WATCH_CY - 60 * Math.cos(mainA))
    DOM.subHand.setAttribute('x2', SDIAL_CX + 15 * Math.sin(subA))
    DOM.subHand.setAttribute('y2', SDIAL_CY - 15 * Math.cos(subA))
  }

  // Live-Panel
  const sym = store.oscillationMode === 'horizontal' ? 'x' : 'y'
  DOM.timeLabel.innerHTML = `<i>t</i> = ${fmt(t)} s`
  DOM.liveT.textContent = `${fmt(t)} s`
  DOM.liveX.textContent = `${fmt(x)} m`
  DOM.liveV.textContent = `${fmt(v)} m/s`
  DOM.liveA.textContent = `${fmt(a)} m/s²`
  DOM.liveEkin.textContent = `${fmt(kineticEnergy(x, v))} J`
  DOM.liveEpot.textContent = `${fmt(potentialEnergy(x))} J`
  DOM.liveEtot.textContent = `${fmt(totalEnergy())} J`
  void sym
}

// ── Kennwerte (T, ω, f) ──────────────────────────────────────────────────────
export function updateKennwerte() {
  DOM.liveTper.textContent = store.T === Infinity ? '∞ s' : `${fmt(store.T, 2)} s`
  DOM.liveOmega.textContent = `${fmt(store.omega, 2)} rad/s`
  DOM.liveF.textContent = store.T === Infinity ? '— Hz' : `${fmt(frequency(), 2)} Hz`
}

// ── Diagramm zeichnen ────────────────────────────────────────────────────────
// time = absolute (visualTime-basierte) Zeit, offset = store.timingOffset
// (B21: Startpunkt der manuellen Zeitmessung) — Plot-Position wird um offset
// verschoben (0, solange keine manuelle Zeitmessung aktiv ist), während die
// zugrundeliegenden precompute-Arrays (store.tData) absolut indiziert bleiben.
export function updateGraph(time, offset = 0, showCurrent = true) {
  const limits = store.axisLimits[store.graphType]
  DOM.gridGroup.innerHTML = ''
  const lineEls = [DOM.graphLine, DOM.graphLineB, DOM.graphLineC]
  const pointEls = [DOM.graphPoint, DOM.graphPointB, DOM.graphPointC]
  for (const le of lineEls) { if (!le) continue; le.setAttribute('points', ''); le.style.display = 'none' }
  for (const pe of pointEls) { if (!pe) continue; pe.style.visibility = 'hidden' }
  if (!limits) return

  // Diagramm-Geometrie pro Aufbau: horizontal → Landscape (GRAPH_W×GRAPH_H),
  // vertikal → Portrait (GRAPH_H×GRAPH_W). Gepaddetes Plot-Gebiet: links Platz
  // für y-Ticks + y-Achsenlabel, unten Platz für t-Ticks + t-Achsenlabel, oben
  // Platz für Titel. So ist das gesamte Diagramm sichtbar — nichts wird am
  // viewBox-Rand beschnitten.
  const isVertical = store.oscillationMode === 'vertical'
  const graphW = isVertical ? GRAPH_H : GRAPH_W
  const graphH = isVertical ? GRAPH_W : GRAPH_H
  const padL = 60, padR = 18, padT = 30, padB = 42
  const plotW = graphW - padL - padR
  const plotH = graphH - padT - padB
  const plotBottom = padT + plotH

  const tMax = limits.tMax
  const valMin = limits.min, valMax = limits.max
  const valRng = (valMax - valMin) || 1
  const scX = tv => padL + (tv / (tMax || 1)) * plotW
  const scY = v => padT + plotH - ((v - valMin) / valRng) * plotH
  const x0 = scX(0), y0 = scY(0)

  // Abszisse (Zeitachse) am Nulldurchgang plazieren, wenn 0 im Wertebereich
  // liegt; sonst am unteren Rand (alles ≥0) bzw. oberen Rand (alles ≤0).
  const zeroInRange = valMin < 0 && valMax > 0
  const xAxisY = zeroInRange ? y0 : (valMax <= 0 ? padT : plotBottom)

  // Hintergrund-Rect (Plot-Bereich)
  DOM.gridGroup.appendChild(el('rect', { x: padL, y: padT, width: plotW, height: plotH, class: 'graph-bg' }))

  // Achsen (mit Pfeilspitzen): Abszisse am Nulldurchgang, Ordinate volle Höhe
  DOM.gridGroup.appendChild(el('line', { x1: x0, y1: xAxisY, x2: padL + plotW, y2: xAxisY, class: 'axis-line', 'stroke-width': 1.5, 'marker-end': 'url(#graph-arrowhead)' }))
  DOM.gridGroup.appendChild(el('line', { x1: x0, y1: plotBottom, x2: x0, y2: padT, class: 'axis-line', 'stroke-width': 1.5, 'marker-end': 'url(#graph-arrowhead)' }))

  // Y-Ticks: feine 1-2-4-5-Folge, ≥4 beschriftete Ticks inkl. 0 (5–9 Ticks)
  const yStep = niceStepLE(valRng, 4)
  const yDec = yStep % 1 === 0 ? 0 : (yStep >= 0.1 ? 1 : 2)
  for (let v = Math.ceil(valMin / yStep) * yStep; v <= valMax + 1e-9; v = Math.round((v + yStep) * 1e9) / 1e9) {
    const yp = scY(v)
    if (Math.abs(yp - y0) > 1.5)
      DOM.gridGroup.appendChild(el('line', { x1: padL, y1: yp, x2: padL + plotW, y2: yp, class: 'grid-line' }))
    const tv = el('text', { x: padL - 8, y: yp + 4, 'text-anchor': 'end', class: 'tick-label' })
    tv.textContent = fmt(v, yDec)
    DOM.gridGroup.appendChild(tv)
  }

  // t-Ticks (≥3 neben Ursprung, tAxisStep); Gitterlinien volle Höhe, Labels
  // am unteren Plot-Rand (unabhängig von der Abszissen-Position)
  const tStep = tAxisStep(tMax)
  const tDec = tStep >= 1 ? 1 : (tStep >= 0.1 ? 2 : 3)
  for (let tc = 0; tc <= tMax + tStep * 0.01; tc = Math.round((tc + tStep) * 1e6) / 1e6) {
    const xp = scX(Math.min(tc, tMax))
    if (Math.abs(xp - x0) > 2)
      DOM.gridGroup.appendChild(el('line', { x1: xp, y1: padT, x2: xp, y2: plotBottom, class: 'grid-line' }))
    const tv = el('text', { x: xp, y: plotBottom + 16, 'text-anchor': 'middle', class: 'tick-label' })
    tv.textContent = fmt(tc, tDec)
    DOM.gridGroup.appendChild(tv)
  }

  // Achsenbeschriftungen
  const yLabel = graphAxisLabels[store.oscillationMode][store.graphType]
  const tlY = el('text', { x: padL - 42, y: padT + plotH / 2, transform: `rotate(-90 ${padL - 42} ${padT + plotH / 2})`, 'text-anchor': 'middle', class: 'axis-label' })
  setAxisLabel(tlY, yLabel)
  DOM.gridGroup.appendChild(tlY)
  const tlX = el('text', { x: padL + plotW / 2, y: plotBottom + 32, 'text-anchor': 'middle', class: 'axis-label' })
  setAxisLabel(tlX, 't / s')
  DOM.gridGroup.appendChild(tlX)

  // Titel (als letztes SVG-Kind, oberhalb Plot-Bereich, zentriert pro Format)
  DOM.graphTitle.setAttribute('x', graphW / 2)
  setGraphTitle(DOM.graphTitle, graphTitles[store.graphType])

  // Daten-Polylinien bis zum aktuellen Zeitpunkt (I7: je Linie im Typ-Config).
  // store.tData ist absolut indiziert; Punkte vor dem Messstart (< offset)
  // werden nicht gezeichnet, die übrigen um offset verschoben, damit die
  // Messung bei 0 beginnt (B21).
  const idx = linePlotIndex(time)
  const displayTime = time - offset
  const lines = GRAPH_LINES[store.graphType] || [{ dataKey: 'xData', color: 'var(--accent)' }]
  lines.forEach((ln, li) => {
    const le = lineEls[li], pe = pointEls[li]
    if (!le) return
    const data = store[ln.dataKey]
    if (!data) { le.style.display = 'none'; return }
    let pts = ''
    for (let i = 0; i < idx && i < data.length; i++) {
      if (store.tData[i] < offset) continue
      pts += `${scX(store.tData[i] - offset)},${scY(data[i])} `
    }
    if (showCurrent) {
      const cv = lineCurrentValue(ln.dataKey, time)
      pts += `${scX(displayTime)},${scY(cv)} `
      if (pe) {
        pe.setAttribute('cx', scX(displayTime))
        pe.setAttribute('cy', scY(cv))
        pe.style.fill = ln.color
        pe.style.visibility = 'visible'
      }
    }
    le.setAttribute('points', pts)
    le.style.stroke = ln.color
    le.style.display = 'block'
  })
}

export { MASS_MIN, MASS_MAX, K_MIN, K_MAX, INITIAL_MASS_SIZE, MIN_MASS_SIZE }