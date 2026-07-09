'use strict';

import { G, TIME_STEP, PPM, CM_PER_M, Y_MAX_CM,
         MASS_BASE, MASS_FACTOR, Y_APERTURE_BOTTOM } from './constants.js';
import { store } from './state.js';

// Physik-y (Meter ab Blendenunterkante) → SVG-y
export const svgY = y_m => Y_APERTURE_BOTTOM + y_m * PPM;

// Halbe Massenhöhe in Pixeln
export const massHalfPx = m => (MASS_BASE + m * MASS_FACTOR) / 2;

// Effektive Rollen-Masse I/R² (zusätzliche träge Masse im Atwood-System).
//   voll: I = ½ M_p R²        ⇒ I/R² = ½ M_p
//   hohl: I = ½ M_p (R² + r²) ⇒ I/R² = ½ M_p (1 + η²),  η = r/R
// E_rot = ½ I ω² = ½ (I/R²) v²  (Rolle dreht ohne Schlupf, ω = v/R).
export function pulleyEffMass({ pulleyMass: Mp, pulleyShape, pulleyInnerRatio: eta }) {
  if (Mp <= 0) return 0;
  return pulleyShape === 'hohl' ? 0.5 * Mp * (1 + eta * eta) : 0.5 * Mp;
}

// Beschleunigung mit vereinfachter Coulomb-Reibung (skalar) + massiver Rolle.
// drive = (m1−m2)·g  (>0 ⇒ m1 fällt). Haftreibung: |drive| ≤ F_R ⇒ a = 0.
// Sonst: a = (drive − sign(drive)·F_R)/(m1+m2+mEff).  mEff = I/R² der Rolle.
// Seilkräfte sind bei massiver Rolle verschieden: T1 = m1·(g−a), T2 = m2·(g+a).
export function getAccel(m1, m2, FR, mEff = 0) {
  const drive = (m1 - m2) * G;
  if (Math.abs(drive) <= FR) return { a: 0, T1: m1 * G, T2: m2 * G, moving: false };
  const a  = (drive - Math.sign(drive) * FR) / (m1 + m2 + mEff);
  const T1 = m1 * (G - a);
  const T2 = m2 * (G + a);
  return { a, T1, T2, moving: true };
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
  const mEff = pulleyEffMass(store);            // I/R² der massiven Rolle

  const { a: accel, moving } = getAccel(m1, m2, FR, mEff);
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
  //   separate: je Masse eigene Starthöhe → E_pot_i(0)=0 für beide
  //   y1:       beide auf Starthöhe von m₁ bezogen
  //   y2:       beide auf Starthöhe von m₂ bezogen
  //   boden:    beide auf Boden (h = 0) bezogen — klassische Lageenergie
  //   decke:    beide auf Decke (h = h_max) bezogen — Energien ≤ 0
  const h1_0 = Y_MAX_M - y1_m0;
  const h2_0 = Y_MAX_M - y2_m0;
  let hNull1, hNull2;
  switch (epZeroMode) {
    case 'y1':    hNull1 = h1_0;     hNull2 = h1_0;     break;
    case 'y2':    hNull1 = h2_0;     hNull2 = h2_0;     break;
    case 'boden': hNull1 = 0;        hNull2 = 0;        break;
    case 'decke': hNull1 = Y_MAX_M;  hNull2 = Y_MAX_M;  break;
    default:      hNull1 = h1_0;     hNull2 = h2_0;     // separate
  }

  // Arrays zurücksetzen
  const A = [
    't_data','y1_data','y2_data','v1_data','v2_data','a1_data','a2_data',
    'ydiff_data','yrel1_data','yrel2_data',
    'ek1_data','ek2_data','ep1_data','ep2_data','eges1_data','eges2_data',
    'ek_sum_data','ep_sum_data','etot_data','wr_data','ek_rot_data',
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
    const ek_rot = 0.5 * mEff * v * v;             // Rotationsenergie der Rolle
    const ep1 = m1 * G * (h1 - hNull1);
    const ep2 = m2 * G * (h2 - hNull2);
    const eges1 = ek1 + ep1, eges2 = ek2 + ep2;
    // E_ges (System-Gesamtenergie) schließt die Rotationsenergie der Rolle ein —
    // die Rolle ist Teil des Systems. eges1/eges2 sind die Einzelmassen-Energien
    // (ohne E_rot, die gehört zur Rolle). Ohne Reibung ist E_ges exakt konstant.
    const ek_sum = ek1 + ek2 + ek_rot, ep_sum = ep1 + ep2, etot = ek_sum + ep_sum;
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
    store.ek_rot_data.push(ek_rot);

    if (t >= store.t_end) break;
  }

  // Achsen-Limits für jeden Datensatz
  const keys = [
    'y1','y2','v1','v2','a1','a2','ydiff','yrel1','yrel2',
    'ek1','ek2','ep1','ep2','eges1','eges2','ek_sum','ep_sum','etot','wr','ek_rot',
  ];
  const arrs = [
    store.y1_data, store.y2_data, store.v1_data, store.v2_data,
    store.a1_data, store.a2_data, store.ydiff_data, store.yrel1_data, store.yrel2_data,
    store.ek1_data, store.ek2_data, store.ep1_data, store.ep2_data,
    store.eges1_data, store.eges2_data, store.ek_sum_data, store.ep_sum_data,
    store.etot_data, store.wr_data, store.ek_rot_data,
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

  // Skalenmaximum für das Energie-Balkendiagramm (Default-Anzeige):
  // größter |E| über alle 13 Energie-Reihen × alle t — sodaß der längste
  // Balken die halbe ViewBox ausfüllt (±50 um Center 50) und die Balken über
  // der gesamten Animation vergleichbar bleiben.
  const eArrs = [
    store.ek1_data, store.ep1_data, store.eges1_data,
    store.ek2_data, store.ep2_data, store.eges2_data,
    store.ek_sum_data, store.ep_sum_data, store.etot_data, store.wr_data,
    store.ek_rot_data,
  ];
  let emax = 1;
  for (const a of eArrs) for (const v of a) { const av = Math.abs(v); if (av > emax) emax = av; }
  store.energyBarMax = emax || 1;
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