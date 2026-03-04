'use strict'

import { MU0, RHO_CU } from './constants.js'
import { store } from './state.js'

/**
 * Calculates the minimum spring constant required to prevent collision
 * at a given current and length, maintaining a safety distance.
 */
export function calculateMinSpringK(I, L, d0_mm) {
  const d_safe = 0.015 // 15mm safety distance
  const d0 = d0_mm / 1000
  if (d0 <= d_safe) return 2.0
  
  // Equilibrium: 2 * D * (d0 - d) = (MU0 * I^2 * L) / (2 * PI * d)
  // D = (MU0 * I^2 * L) / (4 * PI * d * (d0 - d))
  const minD = (MU0 * Math.pow(I, 2) * L) / (4 * Math.PI * d_safe * (d0 - d_safe))
  return Math.max(2.0, minD)
}

/**
 * Computes all dependent physical quantities.
 * Handles both parallel (attractive) and antiparallel (repulsive) flow.
 */
export function computePhysics() {
  const { voltage, targetCurrent, length, crossSection, springK, distance0, inputMode, currentFlowMode } = store

  // 1. Resistance R = rho * L / A
  store.resistance = RHO_CU * (length / crossSection)

  // 2. Current I
  if (inputMode === 'voltage') {
    store.current = voltage / store.resistance
  } else {
    store.current = targetCurrent
    store.voltage = store.current * store.resistance
  }

  // 3. Equilibrium distance d
  const d0_m = distance0 / 1000 
  if (store.current <= 0) {
    store.distance = distance0
    store.deltaY = 0
    store.forceL = 0
    return
  }

  const C = (MU0 * Math.pow(store.current, 2) * length) / (Math.PI * springK)
  const isParallel = (currentFlowMode === 'parallel')

  if (isParallel) {
    // Attractive: d^2 - d0*d + C/4 = 0
    const discriminant = Math.pow(d0_m, 2) - C
    if (discriminant < 0) {
      store.distance = 0
      store.deltaY = distance0
      store.forceL = (MU0 * Math.pow(store.current, 2) * length) / (2 * Math.PI * 1e-5)
    } else {
      const d_m = (d0_m + Math.sqrt(discriminant)) / 2
      store.distance = d_m * 1000 
      store.deltaY = (d0_m - d_m) * 1000 
      store.forceL = (MU0 * Math.pow(store.current, 2) * length) / (2 * Math.PI * d_m)
    }
  } else {
    // Repulsive: d^2 - d0*d - C/4 = 0
    // d = (d0 + sqrt(d0^2 + C)) / 2
    const discriminant = Math.pow(d0_m, 2) + C
    const d_m = (d0_m + Math.sqrt(discriminant)) / 2
    store.distance = d_m * 1000
    store.deltaY = (d_m - d0_m) * 1000 // Extension is positive (pushing away)
    store.forceL = (MU0 * Math.pow(store.current, 2) * length) / (2 * Math.PI * d_m)
  }
}
