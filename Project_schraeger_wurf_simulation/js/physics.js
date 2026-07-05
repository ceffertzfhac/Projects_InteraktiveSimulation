'use strict'

import { G, TIME_STEP, BALL_START_X_PX, GROUND_PX } from './constants.js'
import { store } from './state.js'

// ── Koordinatentransformation (zentral, siehe CLAUDE.md) ─────────────────────
export const scaleX = x_m => BALL_START_X_PX + x_m * store.currentPixelsPerMeter
export const scaleY = y_m => GROUND_PX - y_m * store.currentPixelsPerMeter

// ── Anzeige-Werte (achsenkonfigurationsabhängig) ─────────────────────────────
export function getDisplayY(y_phys) {
  const { origin } = store.yAxisConfig
  const y = origin === 'ground' ? y_phys : y_phys - store.h0
  return store.yAxisConfig.direction === 'down' ? -y : y
}
export function getDisplayV(v_phys) {
  return store.yAxisConfig.direction === 'up' ? v_phys : -v_phys
}
export function getDisplayA(a_phys) {
  return store.yAxisConfig.direction === 'up' ? a_phys : -a_phys
}

// ── Flugzeit / Scheitel / Reichweite ─────────────────────────────────────────
export function flightTime() {
  const { v0y, h0 } = store
  return (v0y + Math.sqrt(v0y * v0y + 2 * G * h0)) / G
}
export function maxHeight() {
  const { h0, v0y } = store
  return h0 + (v0y > 0 ? v0y * v0y / (2 * G) : 0)
}
export function range() {
  return store.v0x * flightTime()
}

// Auftreffwinkel (gemessen von der Horizontalen, positiv unterhalb).
// Geometrische Größe — unabhängig von der Y-Achsen-Konfiguration.
export function impactAngle() {
  const tf = flightTime()
  const vyImpact = store.v0y - G * tf
  if (Math.abs(store.v0x) < 1e-9) return 90 // Senkrechter Wurf: Auftreff vertikal
  return Math.atan(Math.abs(vyImpact) / store.v0x) * 180 / Math.PI
}

// ── Nice-Tick (1-2-5-Serie) ──────────────────────────────────────────────────
export function getNiceTickStep(range, ticks = 8) {
  if (range < 1e-9) return 1
  const m = range / ticks
  const e = Math.floor(Math.log10(m))
  const p = 10 ** e
  let n = m / p
  if (n <= 1) n = 1
  else if (n <= 2) n = 2
  else if (n <= 5) n = 5
  else n = 10
  return n * p
}

// ── Precompute: gesamte Flugbahn bis Aufprall (aus v47 precomputeFlightData) ─
export function precompute() {
  store.tData = []; store.xtData = []; store.ytData = []
  store.vxtData = []; store.vytData = []; store.axtData = []
  store.aytData = []; store.vabsData = []
  store.axisLimits = {}

  const { h0, v0x, v0y } = store
  const tEnd = (v0y + Math.sqrt(v0y * v0y + 2 * G * h0)) / G

  for (let t = 0; t <= tEnd + TIME_STEP; t += TIME_STEP) {
    const x = v0x * t
    const y = h0 + v0y * t - 0.5 * G * t * t
    const vx = v0x
    const vy = v0y - G * t
    if (y < -0.01 && store.tData.length > 0) {
      const lastT = store.tData[store.tData.length - 1]
      const lastY = store.ytData[store.ytData.length - 1]
      if (y - lastY < -1e-9) {
        const tImpact = lastT + (0 - lastY) * (t - lastT) / (y - lastY)
        if (tImpact > lastT) {
          store.tData.push(tImpact); store.xtData.push(v0x * tImpact)
          store.ytData.push(0); store.vxtData.push(v0x)
          store.vytData.push(v0y - G * tImpact); store.axtData.push(0)
          store.aytData.push(-G)
          store.vabsData.push(Math.sqrt(v0x * v0x + (v0y - G * tImpact) ** 2))
        }
      }
      break
    }
    if (y >= -0.01 || store.tData.length === 0) {
      store.tData.push(t); store.xtData.push(x); store.ytData.push(y)
      store.vxtData.push(vx); store.vytData.push(vy); store.axtData.push(0)
      store.aytData.push(-G); store.vabsData.push(Math.sqrt(vx * vx + vy * vy))
    }
  }

  for (let i = 0; i < store.ytData.length; i++) {
    if (store.ytData[i] < 0) store.ytData[i] = 0
  }

  const actualTMax = store.tData.length > 0 ? store.tData[store.tData.length - 1] : 1.0
  const dataSets = {
    xt: { data: store.xtData, label: 'Wurfweite <i>x</i>(<i>t</i>) / m' },
    yt: { data: store.ytData, label: 'Höhe <i>y</i>(<i>t</i>) / m' },
    vxt: { data: store.vxtData, label: 'Geschw. <i>v</i>ₓ(<i>t</i>) / (m/s)' },
    vyt: { data: store.vytData, label: 'Geschw. <i>v</i>ᵧ(<i>t</i>) / (m/s)' },
    axt: { data: store.axtData, label: 'Beschl. <i>a</i>ₓ(<i>t</i>) / (m/s²)' },
    ayt: { data: store.aytData, label: 'Beschl. <i>a</i>ᵧ(<i>t</i>) / (m/s²)' },
    vabs: { data: store.vabsData, label: 'Betrag der Geschw. |<i>v</i>(<i>t</i>)| / (m/s)' },
  }

  const addPadding = (min, max) => {
    if (Math.abs(max - min) < 1e-9) { min -= 1; max += 1 }
    else { const p = (max - min) * 0.1; min -= p; max += p }
    return { min, max }
  }

  for (const key in dataSets) {
    let rawMin = Math.min(...dataSets[key].data)
    let rawMax = Math.max(...dataSets[key].data)
    if (dataSets[key].data.length === 0) { rawMin = 0; rawMax = 0 }
    let padded = addPadding(rawMin, rawMax)
    if (padded.max < 0 && key !== 'vyt') padded.max = 0
    if (padded.min > 0) padded.min = 0
    store.axisLimits[key] = {
      min: padded.min, max: padded.max, tMax: actualTMax,
      yLabelText: dataSets[key].label, fullData: dataSets[key].data,
    }
    if (['yt', 'vyt', 'ayt'].includes(key)) {
      let displayData
      if (key === 'yt') displayData = dataSets[key].data.map(getDisplayY)
      else if (key === 'vyt') displayData = dataSets[key].data.map(getDisplayV)
      else displayData = dataSets[key].data.map(getDisplayA)
      let dMin = Math.min(...displayData)
      let dMax = Math.max(...displayData)
      if (displayData.length === 0) { dMin = 0; dMax = 0 }
      let dPadded = addPadding(dMin, dMax)
      if (dPadded.max < 0 && key !== 'vyt') dPadded.max = 0
      if (dPadded.min > 0) dPadded.min = 0
      store.axisLimits[key + '_display'] = {
        min: dPadded.min, max: dPadded.max, tMax: actualTMax,
        yLabelText: dataSets[key].label, fullData: displayData,
      }
    }
  }
}

// ── Interpolation an beliebigen Zeitsample (Atwood-Muster) ───────────────────
export function interpolateAt(t) {
  const { tData } = store
  if (tData.length === 0) return null
  if (t >= tData[tData.length - 1]) {
    const i = tData.length - 1
    return sample(i, 0)
  }
  let i = 0
  while (i < tData.length - 1 && tData[i + 1] <= t) i++
  const t1 = tData[i], t2 = tData[i + 1]
  const a = (t - t1) / (t2 - t1)
  return sample(i, a)
}

function sample(i, a) {
  const { tData, xtData, ytData, vxtData, vytData, vabsData, axtData, aytData } = store
  const has = i + 1 < tData.length
  const lerp = arr => has ? arr[i] + a * (arr[i + 1] - arr[i]) : arr[i]
  return {
    i, t: has ? tData[i] + a * (tData[i + 1] - tData[i]) : tData[i],
    x: lerp(xtData), y: lerp(ytData),
    vx: lerp(vxtData), vy: lerp(vytData), vabs: lerp(vabsData),
    ax: lerp(axtData), ay: lerp(aytData),
  }
}

// Index des letzten Samples mit t <= time (für Linien-Plot bis currentTime)
export function linePlotIndex(time) {
  const { tData } = store
  let idx = tData.findIndex(t => t > time)
  if (idx === -1 && tData.length > 0) idx = tData.length
  else if (tData.length === 0) idx = 0
  return idx
}