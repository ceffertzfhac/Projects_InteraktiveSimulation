import { G, TIME_STEP, PPM, PPN, CM_PER_M, Y_MAX_CM,
         MASS_BASE, MASS_FACTOR,
         Y_APERTURE_BOTTOM } from './constants.js';
import { store } from './state.js';

// Physics y (meters from aperture bottom) → SVG y coordinate
export const svgY = y_m => Y_APERTURE_BOTTOM + y_m * PPM;

// Half-height of a mass in pixels
export const massHalfPx = m => (MASS_BASE + m * MASS_FACTOR) / 2;

export function getAccel(m1, m2) {
  const a = G * (m1 - m2) / (m1 + m2);
  const T = m1 * (G - a);
  return { a, T };
}

// Nice tick step for a given data range (target ~n ticks)
export function getNiceTick(range, n = 8) {
  if (range <= 0) return 1;
  const rough = range / n;
  const mag   = Math.pow(10, Math.floor(Math.log10(rough)));
  const fracs = [1, 2, 5, 10];
  let best = fracs[fracs.length - 1] * mag;
  for (const f of fracs) {
    const cand = f * mag;
    if (cand >= rough) { best = cand; break; }
  }
  return best;
}

export function precompute() {
  const { m1, m2, y1_start_cm, y2_start_cm } = store;
  const y1_m = y1_start_cm / CM_PER_M;
  const y2_m = y2_start_cm / CM_PER_M;
  const L_m  = y1_m + y2_m;                  // conserved rope length
  const Y_MAX_M = Y_MAX_CM / CM_PER_M;        // 3.5 m

  const { a: accel, T: tens } = getAccel(m1, m2);
  const m1_half_m = massHalfPx(m1) / PPM;
  const m2_half_m = massHalfPx(m2) / PPM;

  // Time until first collision (mass hits floor or reaches aperture top)
  const collisions = [];
  if (Math.abs(accel) > 1e-9) {
    if (accel > 0) {
      // m1 falls → hits floor
      const s1 = Y_MAX_M - m1_half_m - y1_m;
      if (s1 > 1e-6) collisions.push(Math.sqrt(2 * s1 / accel));
      // m2 rises → top hits aperture
      const s2 = y2_m - m2_half_m;
      if (s2 > 1e-6) collisions.push(Math.sqrt(2 * s2 / accel));
    } else {
      // m1 rises → top hits aperture
      const s1 = y1_m - m1_half_m;
      if (s1 > 1e-6) collisions.push(Math.sqrt(2 * s1 / (-accel)));
      // m2 falls → hits floor
      const s2 = Y_MAX_M - m2_half_m - y2_m;
      if (s2 > 1e-6) collisions.push(Math.sqrt(2 * s2 / (-accel)));
    }
  }
  store.t_end = collisions.length > 0 ? Math.min(...collisions) : 10.0;

  store.t_data = []; store.y1_data = []; store.y2_data = [];
  store.v1_data = []; store.v2_data = [];
  store.a1_data = []; store.a2_data = [];
  store.ydiff_data = [];
  store.yrel1_data = []; store.yrel2_data = [];

  for (let t = 0; t <= store.t_end + TIME_STEP; t += TIME_STEP) {
    const tc = Math.min(t, store.t_end);
    const s  = 0.5 * accel * tc * tc;
    const v  = accel * tc;
    const y1 = y1_m + s;
    const y2 = L_m - y1;

    store.t_data.push(tc);
    const y1_cm = Y_MAX_CM - y1 * CM_PER_M;  // Höhe vom Boden in cm
    const y2_cm = Y_MAX_CM - y2 * CM_PER_M;
    store.y1_data.push(y1_cm);
    store.y2_data.push(y2_cm);
    store.v1_data.push(v);
    store.v2_data.push(-v);
    store.a1_data.push(accel);
    store.a2_data.push(-accel);
    store.ydiff_data.push(y1_cm - y2_cm);
    store.yrel1_data.push(-s * CM_PER_M);  // Δhöhe m₁ (negativ beim Fallen)
    store.yrel2_data.push(s * CM_PER_M);   // Δhöhe m₂ (positiv beim Steigen)

    if (t >= store.t_end) break;
  }

  const keys = ['y1', 'y2', 'v1', 'v2', 'a1', 'a2', 'ydiff', 'yrel1', 'yrel2'];
  const arrs = [
    store.y1_data, store.y2_data, store.v1_data, store.v2_data,
    store.a1_data, store.a2_data, store.ydiff_data,
    store.yrel1_data, store.yrel2_data,
  ];
  store.axisLimits = {};
  keys.forEach((key, i) => {
    const arr = arrs[i];
    store.axisLimits[key] = {
      min: Math.min(...arr),
      max: Math.max(...arr),
      t_max: store.t_end,
      full_data: arr,
    };
  });
}

// Interpolate value from precomputed arrays at time t
export function interpolateAt(arr, t) {
  const { t_data } = store;
  if (!t_data.length) return 0;
  let i = t_data.findIndex(tv => tv > t);
  if (i === -1) i = t_data.length;
  i = Math.max(0, i - 1);
  const t1 = t_data[i], t2 = t_data[i + 1] ?? t1;
  const alpha = t2 > t1 ? (t - t1) / (t2 - t1) : 0;
  return arr[i] + alpha * ((arr[i + 1] ?? arr[i]) - arr[i]);
}
