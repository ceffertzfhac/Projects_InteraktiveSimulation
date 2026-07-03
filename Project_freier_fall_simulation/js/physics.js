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

export function getNiceTick(range, tgt = 8) {
  const step0 = range / tgt;
  const exp = Math.floor(Math.log10(step0));
  const p = Math.pow(10, exp);
  const f = step0 / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}
