/**
 * Physics calculations
 * @module physics
 */

import {
  G, DT, MASS, X_STOP, MAX_SIM_DURATION, MIN_DURATION, MIN_ALPHA_RAD,
  SUBJECTS, QUANTITIES, ALL_TYPES
} from './constants.js';

import * as state from './state.js';

/**
 * Compute k-factor (rotational inertia coefficient) for a body type
 * @param {string} typeKey - Body type key
 * @param {number} beta - Inner/outer radius ratio for hollow bodies
 * @returns {number} k = I/(mR²)
 */
export function computeK(typeKey, beta) {
  switch (typeKey) {
    case 'solid_cylinder': return 0.5;
    case 'solid_sphere':   return 0.4;
    case 'thin_cylinder':  return 1.0;
    case 'thin_sphere':    return 2/3;
    case 'thick_cylinder': return 0.5 * (1 + beta * beta);
    case 'thick_sphere': {
      if (beta >= 0.9999) return 2/3;
      if (beta <= 0.0001) return 0.4;
      return 0.4 * (1 - Math.pow(beta, 5)) / (1 - Math.pow(beta, 3));
    }
    default: return 0.5;
  }
}

/**
 * Calculate minimum friction coefficient for pure rolling
 * @param {number} k - Form factor
 * @param {number} alpha - Ramp angle in radians
 * @returns {number} Minimum static friction coefficient
 */
export function rollConditionMuMin(k, alpha) {
  if (alpha < MIN_ALPHA_RAD) return 0;
  return Math.tan(alpha) / (1 + 1 / k);
}

/**
 * Precompute motion data for a body
 * @param {number} k - Form factor
 * @param {number} vInit - Initial velocity (m/s)
 * @param {number} a_cm - Center of mass acceleration (m/s²)
 * @returns {Object} Precomputed motion data
 */
export function precomputeBody(k, vInit, a_cm) {
  const n = state.store.fullData.t.length;
  const al_ang = Math.abs(a_cm / state.store.R_m);
  const data = {
    x:       new Float32Array(n),
    vabs:    new Float32Array(n),
    vx:      new Float32Array(n),
    vy:      new Float32Array(n),
    ax:      new Float32Array(n),
    ay:      new Float32Array(n),
    aabs:    new Float32Array(n),
    omega:   new Float32Array(n),
    alpha_w: new Float32Array(n),
  };
  for (let i = 0; i < n; i++) {
    const ti = state.store.fullData.t[i];
    const xi = vInit * ti + 0.5 * a_cm * ti * ti;
    const vi = vInit + a_cm * ti;
    data.x[i]       = xi;
    data.vabs[i]    = Math.abs(vi);
    data.vx[i]      = vi;
    data.vy[i]      = 0;
    data.ax[i]      = a_cm;
    data.ay[i]      = 0;
    data.aabs[i]    = Math.abs(a_cm);
    data.omega[i]   = vi / state.store.R_m;
    data.alpha_w[i] = al_ang;
  }
  data.acm = a_cm;
  data.k   = k;
  return data;
}

export function precompute() {
  state.store.fullData = { t: [], omega: [], alpha_w: [] };
  SUBJECTS.forEach(s => QUANTITIES.forEach(q => state.store.fullData[`${s}_${q}`] = []));

  const k = state.store.kFactor;
  const rm = state.store.R_m;
  const isInclined = state.DOM.modeInclined.checked;
  const vInit = isInclined ? 0 : state.store.v0_m_s;
  const a_cm  = isInclined ? (G * Math.sin(state.store.alpha_rad)) / (1 + k) : 0;
  const al_ang = Math.abs(a_cm / state.store.R_m);

  // Duration
  if (Math.abs(a_cm) < 1e-9) {
    state.store.simDuration = (vInit > 1e-9) ? X_STOP / vInit : 10;
  } else {
    state.store.simDuration = Math.sqrt(2 * X_STOP / Math.abs(a_cm));
  }
  state.store.simDuration = Math.min(Math.max(state.store.simDuration, MIN_DURATION), MAX_SIM_DURATION);

  // Point angular offsets
  const ptsOff = { p1: 0, p2: Math.PI/2, p3: Math.PI, p4: -Math.PI/2 };

  for (let t = 0; t <= state.store.simDuration + DT/2; t += DT) {
    const x_c = vInit * t + 0.5 * a_cm * t * t;
    const v_c = vInit + a_cm * t;
    const phi = x_c / state.store.R_m;
    const omega = v_c / state.store.R_m;

    state.store.fullData.t.push(t);
    state.store.fullData.omega.push(omega);
    state.store.fullData.alpha_w.push(isInclined ? al_ang : 0);

    state.store.fullData.sp_x.push(x_c);
    state.store.fullData.sp_y.push(state.store.R_m);
    state.store.fullData.sp_vx.push(v_c);
    state.store.fullData.sp_vy.push(0);
    state.store.fullData.sp_vabs.push(Math.abs(v_c));
    state.store.fullData.sp_ax.push(a_cm);
    state.store.fullData.sp_ay.push(0);
    state.store.fullData.sp_aabs.push(Math.abs(a_cm));

    for (const p in ptsOff) {
      const ang = ptsOff[p] - phi;
      const ca = Math.cos(ang), sa = Math.sin(ang);

      const px = x_c + rm * ca;
      const py = state.store.R_m + rm * sa;

      const vx = v_c + omega * rm * sa;
      const vy = -omega * rm * ca;

      const ax = a_cm + al_ang * rm * sa - omega * omega * rm * ca;
      const ay = -al_ang * rm * ca - omega * omega * rm * sa;

      state.store.fullData[`${p}_x`].push(px);
      state.store.fullData[`${p}_y`].push(py);
      state.store.fullData[`${p}_vx`].push(vx);
      state.store.fullData[`${p}_vy`].push(vy);
      state.store.fullData[`${p}_vabs`].push(Math.hypot(vx, vy));
      state.store.fullData[`${p}_ax`].push(ax);
      state.store.fullData[`${p}_ay`].push(ay);
      state.store.fullData[`${p}_aabs`].push(Math.hypot(ax, ay));
    }
  }

  // Precompute compare bodies
  state.store.compareData = {};
  for (const ck of state.store.compareActive) {
    const ct = ALL_TYPES.find(t => t.key === ck);
    if (!ct) continue;
    const beta = parseInt(state.DOM.innerRSlider.value, 10) / 100;
    const ck_factor = ct.getK(beta);
    const ca_cm = isInclined ? (G * Math.sin(state.store.alpha_rad)) / (1 + ck_factor) : 0;
    state.store.compareData[ck] = precomputeBody(ck_factor, vInit, ca_cm);
  }
}
