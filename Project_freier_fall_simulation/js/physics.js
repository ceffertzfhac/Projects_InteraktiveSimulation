import { G, PIXELS_PER_METER, GROUND_PX } from './constants.js';
import { store } from './state.js';

export const scaleY = y_m => GROUND_PX - y_m * PIXELS_PER_METER;

export function getDisplayY(y_abs) {
  const { h0, yAxisConfig: { direction, origin } } = store;
  const v = origin === 'ground' ? y_abs : y_abs - h0;
  return direction === 'up' ? v : -v;
}

export function getDisplayV(v_phys) {
  return store.yAxisConfig.direction === 'up' ? v_phys : -v_phys;
}

export function getDisplayA(a_phys) {
  return store.yAxisConfig.direction === 'up' ? a_phys : -a_phys;
}

export function flightTime() {
  const { h0, v0 } = store;
  return (v0 + Math.sqrt(v0 * v0 + 2 * G * h0)) / G;
}

// Hover-Werte (I13.1): lineare Interpolation über das jeweils bereits
// gewachsene precompute-Array (store.t_data wächst progressiv im RAF-Loop,
// kein Vollständig-vorausberechnetes Array wie bei den übrigen Sims). Ein
// analytisches physicsAt(t) wäre hier riskant, da die Landung (y<0-Clamp,
// s. ui.js::animate) den Verlauf am Ende der Flugbahn kappt — die
// Interpolation über die tatsächlich geplotteten Daten trifft diesen Fall
// automatisch korrekt, ein separat hergeleitetes Analytikum müsste den
// Clamp erneut nachbilden.
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

