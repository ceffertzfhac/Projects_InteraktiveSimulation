/**
 * Gemeinsame Render-Helfer (Koordinatentransforms, Formatierung, SVG-Bau,
 * Pfeilspitzen-Geometrie). Importiert von allen render-*-Submodulen.
 * Keine eigenen Seiteneffekte beim Laden.
 * @module render-core
 */

import * as state from './state.js';
import { fmt } from '../../shared/js/format.js';
import { shortenEnd } from '../../shared/js/vectors.js';
export { fmt, shortenEnd };

// fmt() via shared/js/format.js (T6). fmtTech (Punkt-Dezimal für SVG-Attribute)
// und fmtE (Energie mit ' J'-Suffix) bleiben Rolling-spezifisch (keine
// Nutzer-Anzeige im shared-Sinne).

/**
 * Format for technical SVG attributes (always with dot)
 */
export function fmtTech(v, d = 2) {
  if (typeof v !== 'number' || !isFinite(v)) return '0';
  return v.toFixed(d);
}

/**
 * Format energy value
 */
export function fmtE(v) { return (v || 0).toFixed(4).replace('.', ',') + ' J'; }

/**
 * Create SVG element with attributes
 */
export function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

/**
 * Convert physics coordinates to screen coordinates
 */
export function physToScreen(xLoc, yLoc) {
  const ca = Math.cos(state.store.alpha_rad), sa = Math.sin(state.store.alpha_rad);
  return {
    x: state.store.rampStartX + xLoc * state.store.ppm * ca + yLoc * state.store.ppm * sa,
    y: state.store.rampStartY + xLoc * state.store.ppm * sa - yLoc * state.store.ppm * ca
  };
}

/**
 * Convert local velocity/acceleration vector to screen coordinates
 */
export function localVecToScreen(vx, vy) {
  const ca = Math.cos(state.store.alpha_rad), sa = Math.sin(state.store.alpha_rad);
  return {
    x: vx * ca + vy * sa,
    y: vx * sa - vy * ca
  };
}

/**
 * Calculate nice axis step for graphs
 */
export function getNiceStep(range, n) {
  if (!isFinite(range) || range < 1e-12) return 1;
  const m = range / n;
  const e = Math.floor(Math.log10(m));
  const p = Math.pow(10, e);
  let q = m / p;
  q = q <= 1 ? 1 : q <= 2 ? 2 : q <= 5 ? 5 : 10;
  return q * p;
}

/**
 * Create interpolation function for time-series data
 */
export function makeInterp(t) {
  const tArr = state.store.fullData.t;
  const n = tArr.length;
  if (!n) return () => 0;
  if (n === 1) return arr => (arr[0] || 0);
  if (t <= tArr[0]) return arr => (arr[0] || 0);
  if (t >= tArr[n-1]) return arr => (arr[n-1] || 0);
  let lo = 0, hi = n-2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (tArr[mid] <= t) lo = mid; else hi = mid-1;
  }
  const t1 = tArr[lo], t2 = tArr[lo+1];
  const f = (t2 > t1) ? (t - t1) / (t2 - t1) : 0;
  return arr => { const v0 = arr[lo] || 0, v1 = arr[lo+1] || v0; return v0 + f * (v1 - v0); };
}