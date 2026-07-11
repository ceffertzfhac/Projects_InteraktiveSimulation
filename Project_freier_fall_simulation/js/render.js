import { G, PIXELS_PER_METER, GROUND_PX, BALL_X,
         WATCH_CX, WATCH_CY, WATCH_R, SDIAL_CX, SDIAL_CY, SDIAL_R,
         GRAPH_W, GRAPH_H, PIXELS_PER_VEL, PIXELS_PER_ACC, VEL_THRESHOLD } from './constants.js';
import { store, DOM } from './state.js';
import { scaleY, getDisplayY, getDisplayV, getDisplayA, flightTime, getNiceTick } from './physics.js';
import { fmt } from '../../shared/js/format.js';
import { setAxisLabel, setGraphTitle } from '../../shared/js/svg-text.js';
export { fmt };

const NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

// fmt() via shared/js/format.js (T6)

export function drawRuler() {
  DOM.rulerGroup.innerHTML = '';
  const rx = 45, rw = 15;
  const maxM = Math.ceil(GROUND_PX / PIXELS_PER_METER) + 5;
  DOM.rulerGroup.appendChild(el('rect', {
    x: rx, y: scaleY(maxM), width: rw, height: maxM * PIXELS_PER_METER,
    class: 'ruler-bg',
  }));
  for (let m = 0; m <= maxM; m++) {
    const yp = scaleY(m);
    if (m % 5 === 0) {
      const t = el('text', { x: rx - 3, y: yp + 4, 'text-anchor': 'end', class: 'ruler-text' });
      t.textContent = String(m);
      DOM.rulerGroup.appendChild(t);
    }
    DOM.rulerGroup.appendChild(el('line', {
      x1: rx + rw, y1: yp, x2: rx + rw - (m % 5 === 0 ? 10 : 5), y2: yp,
      class: 'ruler-tick', 'stroke-width': m % 5 === 0 ? 2 : 1,
    }));
  }
}

export function drawStickFigure(h_base) {
  DOM.stickFigure.innerHTML = '';
  const PPM = PIXELS_PER_METER;
  const fy = scaleY(h_base);
  const legH = PPM, torsoH = 0.8 * PPM, headR = 0.2 * PPM, legSpread = 0.3 * PPM;
  const crotchY = fy - legH, shoulderY = crotchY - torsoH;
  const bx = 120;
  const armY = scaleY(store.h0) + 3;
  const lp = (x1, y1, x2, y2) => el('line', { x1, y1, x2, y2, class: 'sf-line', 'stroke-width': 2 });
  DOM.stickFigure.appendChild(lp(bx, crotchY, bx, shoulderY));
  DOM.stickFigure.appendChild(lp(bx, crotchY, bx - legSpread, fy));
  DOM.stickFigure.appendChild(lp(bx, crotchY, bx + legSpread, fy));
  DOM.stickFigure.appendChild(lp(bx, armY, bx + 16, armY));
  DOM.stickFigure.appendChild(el('circle', { cx: bx, cy: shoulderY - headR, r: headR, class: 'sf-head', 'stroke-width': 2 }));
}

export function drawYAxisDisplay() {
  DOM.yAxisDisplay.innerHTML = '';
  const { yAxisConfig: { direction, origin }, h0, graphType } = store;
  const ax = 180;
  const yOrig = Math.max(10, Math.min(470, origin === 'ground' ? scaleY(0) : scaleY(h0)));
  const yEnd  = Math.max(10, Math.min(470, yOrig + (direction === 'up' ? -50 : 50)));

  DOM.yAxisDisplay.appendChild(el('line', {
    x1: ax, y1: yOrig, x2: ax, y2: yEnd,
    class: 'yad-line', 'stroke-width': 1.5, 'marker-end': 'url(#arrow-y)',
  }));
  const t0 = el('text', { x: ax + 5, y: yOrig + 4, 'text-anchor': 'start', class: 'yad-text' });
  t0.textContent = '0';
  DOM.yAxisDisplay.appendChild(t0);

  const tipY  = direction === 'up' ? yEnd - 17 : yEnd + 17;
  const angle = direction === 'up' ? -90 : 90;
  const axCh  = (graphType === 'weg' && origin === 'start') ? 's' : 'y';
  const tl = el('text', {
    x: ax + 20, y: tipY,
    transform: `rotate(${angle} ${ax + 20} ${tipY})`,
    'text-anchor': 'middle', class: 'yad-text', 'font-size': 14,
  });
  setAxisLabel(tl, `${axCh} / m`);
  DOM.yAxisDisplay.appendChild(tl);
}

export function drawStopwatchMarks() {
  DOM.swMarks.innerHTML = '';
  for (let s = 0; s < 60; s++) {
    const a = (s / 60) * 2 * Math.PI;
    const ri = WATCH_R - (s % 5 === 0 ? 8 : 5);
    DOM.swMarks.appendChild(el('line', {
      x1: WATCH_CX + ri * Math.sin(a),    y1: WATCH_CY - ri * Math.cos(a),
      x2: WATCH_CX + WATCH_R * Math.sin(a), y2: WATCH_CY - WATCH_R * Math.cos(a),
      class: 'sw-mark', 'stroke-width': s % 5 === 0 ? 2 : 1,
    }));
  }
}

export function drawSubdialMarks() {
  DOM.sdMarks.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * 2 * Math.PI;
    DOM.sdMarks.appendChild(el('line', {
      x1: SDIAL_CX + (SDIAL_R - 3) * Math.sin(a), y1: SDIAL_CY - (SDIAL_R - 3) * Math.cos(a),
      x2: SDIAL_CX + SDIAL_R * Math.sin(a),         y2: SDIAL_CY - SDIAL_R * Math.cos(a),
      class: 'sw-mark', 'stroke-width': 1,
    }));
  }
}

// Largest nice step (1-2-5 series) that still gives at least minDivs ticks
function tAxisStep(range, minDivs = 3) {
  let step = getNiceTick(range, 6);
  if (Math.floor(range / step) < minDivs) {
    const ms = range / minDivs;
    const m  = Math.pow(10, Math.floor(Math.log10(ms)));
    step = [5, 2, 1].map(f => f * m).find(s => s <= ms + 1e-9) ?? m;
  }
  return step;
}

export function updateGraph() {
  const { h0, v0, graphType, yAxisConfig, t_data, y_data, v_data, a_data } = store;
  DOM.gridGroup.innerHTML = '';
  DOM.gridGroup.appendChild(el('rect', { x: 0, y: -15, width: GRAPH_W + 15, height: GRAPH_H + 15, class: 'graph-bg' }));

  const tf   = (v0 + Math.sqrt(v0 * v0 + 2 * G * h0)) / G;
  const tMax = Math.max(tf, 1.0);
  const gw   = GRAPH_W - 20;
  const scX  = t => (t / tMax) * gw;

  let vMin, vMax, yLabel;
  if (graphType === 'weg') {
    const yMaxPhys = h0 + (v0 > 0 ? v0 * v0 / (2 * G) : 0);
    const d0 = getDisplayY(0), dM = getDisplayY(yMaxPhys);
    vMin = Math.min(d0, dM); vMax = Math.max(d0, dM);
    yLabel = yAxisConfig.origin === 'start' ? 's / m' : 'y / m';
  } else if (graphType === 'geschw') {
    const vEnd = v0 - G * tMax;
    const dV0 = getDisplayV(v0), dVe = getDisplayV(vEnd);
    vMin = Math.min(dV0, dVe); vMax = Math.max(dV0, dVe);
    yLabel = 'v / (m/s)';
  } else {
    const dA = getDisplayA(-G);
    vMin = dA - 0.5; vMax = dA + 0.5;
    yLabel = 'a / (m/s²)';
  }

  const rng = vMax - vMin;
  if (rng < 0.01) { vMin -= 1; vMax += 1; }
  else { vMin -= rng * 0.1; vMax += rng * 0.1; }
  if (vMin > 0) vMin = 0;
  if (vMax < 0) vMax = 0;

  const step  = getNiceTick(vMax - vMin);
  let axMin   = Math.floor(vMin / step) * step;
  let axMax   = Math.ceil(vMax  / step) * step;
  if (axMin === axMax) { axMin -= step; axMax += step; }

  const axRng = axMax - axMin || 1;
  const scY   = v => GRAPH_H - 10 - ((v - axMin) / axRng) * (GRAPH_H - 30);
  const x0    = scX(0);
  const y0    = scY(0);

  // Vertical grid lines + x-tick labels — mindestens 3 Zeitmarken außer 0
  const tStep    = tAxisStep(tMax);
  const tDecimals = tStep >= 1 ? 1 : tStep >= 0.1 ? 2 : 3;
  let tc = 0;
  while (tc <= tMax + tStep * 0.01) {
    const xp = scX(Math.min(tc, tMax));
    if (Math.abs(xp - x0) > 2)
      DOM.gridGroup.appendChild(el('line', { x1: xp, y1: 5, x2: xp, y2: GRAPH_H - 5, class: 'grid-line' }));
    const tv = el('text', { x: xp, y: y0 + 16, 'text-anchor': 'middle', class: 'tick-label' });
    tv.textContent = fmt(tc, tDecimals);
    DOM.gridGroup.appendChild(tv);
    tc = Math.round((tc + tStep) * 1e6) / 1e6;
  }

  // Horizontal grid lines + y-tick labels
  const nTicks  = Math.round((axMax - axMin) / step) + 1;
  const decimals = step % 1 === 0 ? 0 : 2;
  for (let i = 0; i < nTicks; i++) {
    const v  = axMin + i * step;
    const yp = scY(v);
    if (Math.abs(yp - y0) > 2 || Math.abs(v) > 0.001)
      DOM.gridGroup.appendChild(el('line', { x1: 0, y1: yp, x2: GRAPH_W, y2: yp, class: 'grid-line' }));
    const tv = el('text', { x: x0 - 5, y: yp + 4, 'text-anchor': 'end', class: 'tick-label' });
    tv.textContent = fmt(v, decimals);
    DOM.gridGroup.appendChild(tv);
  }

  // Axis lines
  DOM.gridGroup.appendChild(el('line', { x1: x0, y1: y0, x2: GRAPH_W - 5, y2: y0,     class: 'axis-line', 'stroke-width': 2, 'marker-end': 'url(#arrowhead)' }));
  DOM.gridGroup.appendChild(el('line', { x1: x0, y1: GRAPH_H - 5, x2: x0, y2: 5,      class: 'axis-line', 'stroke-width': 2, 'marker-end': 'url(#arrowhead)' }));

  // Axis labels
  const tlX = el('text', { x: GRAPH_W / 2, y: y0 + 32, 'text-anchor': 'middle', class: 'axis-label' });
  setAxisLabel(tlX, 't / s');
  DOM.gridGroup.appendChild(tlX);
  const tlY = el('text', { x: x0 - 40, y: GRAPH_H / 2, transform: `rotate(-90 ${x0 - 40} ${GRAPH_H / 2})`, 'text-anchor': 'middle', class: 'axis-label' });
  setAxisLabel(tlY, yLabel);
  DOM.gridGroup.appendChild(tlY);

  // Graph title
  const posSymbol = yAxisConfig.origin === 'start' ? 's(t)' : 'y(t)';
  const titles = { weg: `Weg-Zeit ${posSymbol}`, geschw: 'Geschw.-Zeit v(t)', beschl: 'Beschl.-Zeit a(t)' };
  setGraphTitle(DOM.graphTitle, titles[graphType] || '');

  // Data polyline
  const dArr = graphType === 'weg' ? y_data : graphType === 'geschw' ? v_data : a_data;
  let pts = '';
  for (let i = 0; i < t_data.length; i++) pts += `${scX(t_data[i])},${scY(dArr[i])} `;
  DOM.graphLine.setAttribute('points', pts);

  if (t_data.length > 0) {
    DOM.graphPoint.setAttribute('cx', scX(t_data[t_data.length - 1]));
    DOM.graphPoint.setAttribute('cy', scY(dArr[dArr.length - 1]));
    DOM.graphPoint.setAttribute('visibility', 'visible');
  } else {
    DOM.graphPoint.setAttribute('visibility', 'hidden');
  }
}

export function updateScene(t, y, v, a) {
  const bcy = scaleY(y);
  DOM.ball.setAttribute('cy', String(bcy));

  // Vectors
  if (DOM.togAcc.checked) {
    DOM.accVector.setAttribute('visibility', 'visible');
    DOM.accVector.setAttribute('x1', BALL_X); DOM.accVector.setAttribute('y1', String(bcy));
    DOM.accVector.setAttribute('x2', BALL_X); DOM.accVector.setAttribute('y2', String(bcy + G * PIXELS_PER_ACC));
  } else {
    DOM.accVector.setAttribute('visibility', 'hidden');
  }

  if (DOM.togVel.checked && Math.abs(v) >= VEL_THRESHOLD) {
    DOM.velVector.setAttribute('visibility', 'visible');
    DOM.velVector.setAttribute('x1', BALL_X); DOM.velVector.setAttribute('y1', String(bcy));
    const len = Math.abs(v) * PIXELS_PER_VEL;
    DOM.velVector.setAttribute('x2', BALL_X);
    DOM.velVector.setAttribute('y2', String(bcy + (v > 0 ? -len : len)));
  } else {
    DOM.velVector.setAttribute('visibility', 'hidden');
  }

  // Stopwatch
  const ma = (t % 60) / 60 * 2 * Math.PI;
  DOM.mainHand.setAttribute('x2', String(WATCH_CX + 60 * Math.sin(ma)));
  DOM.mainHand.setAttribute('y2', String(WATCH_CY - 60 * Math.cos(ma)));
  const sa = (t % 1) * 2 * Math.PI;
  DOM.subHand.setAttribute('x2', String(SDIAL_CX + 15 * Math.sin(sa)));
  DOM.subHand.setAttribute('y2', String(SDIAL_CY - 15 * Math.cos(sa)));

  // Live panel
  DOM.timeLabel.innerHTML = `<i>t</i> = ${fmt(t)} s`;
  DOM.liveT.textContent = `${fmt(t)} s`;
  DOM.liveY.textContent = `${fmt(getDisplayY(y))} m`;
  DOM.liveV.textContent = `${fmt(getDisplayV(v))} m/s`;
  DOM.liveA.textContent = `${fmt(getDisplayA(a))} m/s²`;
}

// ── Kinematische Gleichungen (achsenkonfigurationsabhängig) ───────────────────
const _PF_IDS = ['pf_up_ground', 'pf_up_start', 'pf_down_ground', 'pf_down_start']

export function updatePhysicsFormulas() {
  const { direction, origin } = store.yAxisConfig;
  const active = `pf_${direction}_${origin}`;
  _PF_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === active ? '' : 'none';
  });
}

export function updateKennwerte() {
  const { h0, v0 } = store;
  const tf      = flightTime();
  const vImpact = getDisplayV(v0 - G * tf);
  const yMax    = h0 + (v0 > 0 ? v0 * v0 / (2 * G) : 0);
  DOM.liveTfall.textContent   = `${fmt(tf)} s`;
  DOM.liveYmax.textContent    = `${fmt(yMax)} m`;
  DOM.liveVimpact.textContent = `${fmt(vImpact)} m/s`;
  DOM.liveA.textContent       = `${fmt(getDisplayA(-G))} m/s²`;
}
