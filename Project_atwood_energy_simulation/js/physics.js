'use strict';

import { G, TIME_STEP, PPM, CM_PER_M, Y_MAX_CM,
         MASS_BASE, MASS_FACTOR, Y_APERTURE_BOTTOM } from './constants.js';
import { store } from './state.js';

// Physik-y (Meter ab Blendenunterkante) → SVG-y
export const svgY = y_m => Y_APERTURE_BOTTOM + y_m * PPM;

// Halbe Massenhöhe in Pixeln
export const massHalfPx = m => (MASS_BASE + m * MASS_FACTOR) / 2;

// Beschleunigung mit vereinfachter Coulomb-Reibung (skalar).
// drive = (m1−m2)·g  (>0 ⇒ m1 fällt). Haftreibung: |drive| ≤ F_R ⇒ a = 0.
// Sonst: a = (drive − sign(drive)·F_R)/(m1+m2).  Seilkraft T = m1·(g−a).
export function getAccel(m1, m2, FR) {
  const drive = (m1 - m2) * G;
  if (Math.abs(drive) <= FR) return { a: 0, T: m1 * G, moving: false };
  const a = (drive - Math.sign(drive) * FR) / (m1 + m2);
  const T = m1 * (G - a);
  return { a, T, moving: true };
}

// Nice-Tick-Schritt für Wertebereich (Ziel ~n Ticks) — 1-2-5-Folge
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
  const { m1, m2, y1_start_cm, y2_start_cm, frictionForce, epZeroMode } = store;
  const y1_m0 = y1_start_cm / CM_PER_M;
  const y2_m0 = y2_start_cm / CM_PER_M;
  const L_m   = y1_m0 + y2_m0;                  // erhaltene Seillänge
  const Y_MAX_M = Y_MAX_CM / CM_PER_M;          // 3,5 m
  const FR = Math.max(0, frictionForce);

  const { a: accel, T: tens, moving } = getAccel(m1, m2, FR);
  const m1_half_m = massHalfPx(m1) / PPM;
  const m2_half_m = massHalfPx(m2) / PPM;

  // Kollision: Masse trifft Boden oder Blende
  const collisions = [];
  if (Math.abs(accel) > 1e-9) {
    if (accel > 0) {
      const s1 = Y_MAX_M - m1_half_m - y1_m0;   // m1 fällt → Boden
      if (s1 > 1e-6) collisions.push(Math.sqrt(2 * s1 / accel));
      const s2 = y2_m0 - m2_half_m;             // m2 steigt → Blende
      if (s2 > 1e-6) collisions.push(Math.sqrt(2 * s2 / accel));
    } else {
      const s1 = y1_m0 - m1_half_m;              // m1 steigt → Blende
      if (s1 > 1e-6) collisions.push(Math.sqrt(2 * s1 / (-accel)));
      const s2 = Y_MAX_M - m2_half_m - y2_m0;   // m2 fällt → Boden
      if (s2 > 1e-6) collisions.push(Math.sqrt(2 * s2 / (-accel)));
    }
  }
  store.t_end = collisions.length > 0 ? Math.min(...collisions) : 10.0;

  // E_pot-Nullpunkthöhen (m über Boden), je Modus:
  //   separate: je Masse eigene Start Höhe  → E_pot_i(0)=0 für beide
  //   y1:       beide auf h1_0 bezogen
  //   y2:       beide auf h2_0 bezogen
  const h1_0 = Y_MAX_M - y1_m0;
  const h2_0 = Y_MAX_M - y2_m0;
  const hNull1 = epZeroMode === 'y2' ? h2_0 : h1_0;
  const hNull2 = epZeroMode === 'y1' ? h1_0 : h2_0;

  // Arrays zurücksetzen
  const A = [
    't_data','y1_data','y2_data','v1_data','v2_data','a1_data','a2_data',
    'ydiff_data','yrel1_data','yrel2_data',
    'ek1_data','ek2_data','ep1_data','ep2_data','eges1_data','eges2_data',
    'ek_sum_data','ep_sum_data','etot_data','wr_data',
  ];
  A.forEach(k => { store[k] = []; });

  for (let t = 0; t <= store.t_end + TIME_STEP; t += TIME_STEP) {
    const tc = Math.min(t, store.t_end);
    const s  = 0.5 * accel * tc * tc;            // Verschiebung m1 (m1 fällt ⇒ s>0)
    const v  = accel * tc;
    const y1 = y1_m0 + s;
    const y2 = L_m - y1;
    const h1 = Y_MAX_M - y1;                      // Höhe m1 über Boden
    const h2 = Y_MAX_M - y2;                      // Höhe m2 über Boden

    // Energien
    const ek1 = 0.5 * m1 * v * v;
    const ek2 = 0.5 * m2 * v * v;
    const ep1 = m1 * G * (h1 - hNull1);
    const ep2 = m2 * G * (h2 - hNull2);
    const eges1 = ek1 + ep1, eges2 = ek2 + ep2;
    const ek_sum = ek1 + ek2, ep_sum = ep1 + ep2, etot = eges1 + eges2;
    // Reibungsarbeit: W_R = F_R · Wegstrecke (nur während Bewegung; a=0 ⇒ 0)
    const dist = 0.5 * Math.abs(accel) * tc * tc;
    const wr = FR * dist;

    store.t_data.push(tc);
    const y1_cm = Y_MAX_CM - y1 * CM_PER_M;       // Höhe vom Boden in cm
    const y2_cm = Y_MAX_CM - y2 * CM_PER_M;
    store.y1_data.push(y1_cm);
    store.y2_data.push(y2_cm);
    store.v1_data.push(v);
    store.v2_data.push(-v);
    store.a1_data.push(accel);
    store.a2_data.push(-accel);
    store.ydiff_data.push(y1_cm - y2_cm);
    store.yrel1_data.push(-s * CM_PER_M);          // Δhöhe m₁ (negativ beim Fallen)
    store.yrel2_data.push(s * CM_PER_M);           // Δhöhe m₂ (positiv beim Steigen)
    store.ek1_data.push(ek1);
    store.ek2_data.push(ek2);
    store.ep1_data.push(ep1);
    store.ep2_data.push(ep2);
    store.eges1_data.push(eges1);
    store.eges2_data.push(eges2);
    store.ek_sum_data.push(ek_sum);
    store.ep_sum_data.push(ep_sum);
    store.etot_data.push(etot);
    store.wr_data.push(wr);

    if (t >= store.t_end) break;
  }

  // Achsen-Limits für jeden Datensatz
  const keys = [
    'y1','y2','v1','v2','a1','a2','ydiff','yrel1','yrel2',
    'ek1','ek2','ep1','ep2','eges1','eges2','ek_sum','ep_sum','etot','wr',
  ];
  const arrs = [
    store.y1_data, store.y2_data, store.v1_data, store.v2_data,
    store.a1_data, store.a2_data, store.ydiff_data, store.yrel1_data, store.yrel2_data,
    store.ek1_data, store.ek2_data, store.ep1_data, store.ep2_data,
    store.eges1_data, store.eges2_data, store.ek_sum_data, store.ep_sum_data,
    store.etot_data, store.wr_data,
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

// Linear interpoliert aus precompute-Arrays zur Zeit t
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