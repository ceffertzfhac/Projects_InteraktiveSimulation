import { G, PPM, PPN, CM_PER_M, Y_MAX_CM,
         MASS_BASE, MASS_FACTOR,
         PULLEY_X, PULLEY_Y, PULLEY_R,
         X_LEFT, X_RIGHT,
         Y_APERTURE_BOTTOM,
         SW_RADIUS, SW_HAND_LEN } from './constants.js';
import { store, DOM } from './state.js';
import { svgY, massHalfPx, getAccel, getNiceTick, interpolateAt } from './physics.js';

const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

// Renders axis label text with the quantity symbol italic and the unit upright.
// Splits at ' / ': everything before is italic, ' / unit' stays upright.
function setAxisLabel(textEl, text) {
  while (textEl.firstChild) textEl.removeChild(textEl.firstChild);
  const sep = text.indexOf(' / ');
  if (sep === -1) { textEl.textContent = text; return; }
  const qty = document.createElementNS(NS, 'tspan');
  qty.setAttribute('font-style', 'italic');
  qty.textContent = text.slice(0, sep);
  textEl.appendChild(qty);
  const unit = document.createElementNS(NS, 'tspan');
  unit.textContent = text.slice(sep);
  textEl.appendChild(unit);
}

// Graph title: German descriptive word(s) upright, trailing symbol expression italic.
// Splits at last space: "Position y₁(t)" → "Position " + italic "y₁(t)".
function setGraphTitle(textEl, text) {
  while (textEl.firstChild) textEl.removeChild(textEl.firstChild);
  const sep = text.lastIndexOf(' ');
  if (sep === -1) { textEl.textContent = text; return; }
  const word = document.createElementNS(NS, 'tspan');
  word.textContent = text.slice(0, sep + 1);
  textEl.appendChild(word);
  const sym = document.createElementNS(NS, 'tspan');
  sym.setAttribute('font-style', 'italic');
  sym.textContent = text.slice(sep + 1);
  textEl.appendChild(sym);
}

export function fmt(n, d = 2) { return n.toFixed(d).replace('.', ','); }

// Adds axis arrowhead marker to a graph SVG's <defs> on first call.
function ensureAxisMarker(svgEl) {
  if (svgEl.querySelector('#arr-axis-g')) return;
  let defs = svgEl.querySelector('defs');
  if (!defs) { defs = document.createElementNS(NS, 'defs'); svgEl.insertBefore(defs, svgEl.firstChild); }
  const marker = document.createElementNS(NS, 'marker');
  marker.setAttribute('id', 'arr-axis-g');
  marker.setAttribute('markerWidth', '6'); marker.setAttribute('markerHeight', '4');
  marker.setAttribute('refX', '0');        marker.setAttribute('refY', '2');
  marker.setAttribute('orient', 'auto');
  const poly = document.createElementNS(NS, 'polygon');
  poly.setAttribute('points', '0 0, 6 2, 0 4');
  poly.setAttribute('class', 'arr-axis-poly');
  marker.appendChild(poly);
  defs.appendChild(marker);
}

// ── Ruler (left edge, shows cm scale) ────────────────────────────────────────
export function drawRuler() {
  const g = DOM.rulerGroup;
  g.innerHTML = '';
  const rx = 8, rw = 22;
  // Background
  g.appendChild(el('rect', {
    x: rx, y: Y_APERTURE_BOTTOM, width: rw, height: (Y_MAX_CM / CM_PER_M) * PPM,
    class: 'ruler-bg', rx: 2,
  }));
  // Tick marks every 10cm, labels every 50cm
  for (let cm = 0; cm <= Y_MAX_CM; cm += 10) {
    const y = Y_APERTURE_BOTTOM + cm;   // 1 cm = 1 px (PPM=100)
    const isMajor = cm % 50 === 0;
    const tickLen = isMajor ? 10 : 5;
    g.appendChild(el('line', {
      x1: rx + rw - tickLen, y1: y, x2: rx + rw, y2: y,
      class: 'ruler-tick',
    }));
    if (isMajor) {
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', String(rx + rw - tickLen - 2));
      t.setAttribute('y', String(y + 3.5));
      t.setAttribute('text-anchor', 'end');
      t.setAttribute('class', 'ruler-text');
      t.textContent = `${Y_MAX_CM - cm}`;
      g.appendChild(t);
    }
  }
  // Unit label
  const lbl = document.createElementNS(NS, 'text');
  lbl.setAttribute('x', String(rx + rw / 2));
  lbl.setAttribute('y', String(Y_APERTURE_BOTTOM + 12));
  lbl.setAttribute('text-anchor', 'middle');
  lbl.setAttribute('class', 'ruler-text');
  lbl.textContent = 'cm';
  g.appendChild(lbl);
}

// ── Stopwatch ─────────────────────────────────────────────────────────────────
export function drawStopwatchMarks() {
  DOM.swMarks.innerHTML = '';
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const isMaj = i % 5 === 0;
    const r_in  = isMaj ? SW_RADIUS - 8 : SW_RADIUS - 3;
    DOM.swMarks.appendChild(el('line', {
      x1: r_in * Math.cos(angle), y1: r_in * Math.sin(angle),
      x2: SW_RADIUS * Math.cos(angle), y2: SW_RADIUS * Math.sin(angle),
      'stroke-width': isMaj ? 2 : 1, class: 'sw-mark',
    }));
  }
  // Subdial: 10 marks for tenths of a second (subdial center at (0, 25), r=13)
  DOM.sdMarks.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * 2 * Math.PI - Math.PI / 2;
    DOM.sdMarks.appendChild(el('line', {
      x1: 10 * Math.cos(angle), y1: 25 + 10 * Math.sin(angle),
      x2: 13 * Math.cos(angle), y2: 25 + 13 * Math.sin(angle),
      'stroke-width': 1, class: 'sw-mark',
    }));
  }
}

// ── Scene update ──────────────────────────────────────────────────────────────
export function updateScene(t, y1_m, y2_m) {
  const { m1, m2, showForces, showNetForce } = store;
  const { a: accel, T: tens } = getAccel(m1, m2);

  const m1_w = MASS_BASE + m1 * MASS_FACTOR;
  const m2_w = MASS_BASE + m2 * MASS_FACTOR;
  const m1_h = m1_w, m2_h = m2_w;
  const m1_hpx = m1_h / 2;
  const m2_hpx = m2_h / 2;

  const y1_svg = svgY(y1_m);
  const y2_svg = svgY(y2_m);

  // Position masses
  DOM.mass1Group.setAttribute('transform',
    `translate(${X_LEFT - m1_w / 2}, ${y1_svg - m1_hpx})`);
  DOM.mass1Rect.setAttribute('width', String(m1_w));
  DOM.mass1Rect.setAttribute('height', String(m1_h));
  DOM.mass1Label.setAttribute('x', String(-6));
  DOM.mass1Label.setAttribute('y', String(m1_hpx));
  DOM.mass1Label.setAttribute('text-anchor', 'end');
  DOM.mass1Label.innerHTML = '';
  const lbl1s = document.createElementNS(NS, 'tspan');
  lbl1s.setAttribute('font-style', 'italic'); lbl1s.textContent = 'm₁';
  DOM.mass1Label.appendChild(lbl1s);
  const lbl1v = document.createElementNS(NS, 'tspan');
  lbl1v.textContent = `=${fmt(m1, 1)} kg`;
  DOM.mass1Label.appendChild(lbl1v);

  DOM.mass2Group.setAttribute('transform',
    `translate(${X_RIGHT - m2_w / 2}, ${y2_svg - m2_hpx})`);
  DOM.mass2Rect.setAttribute('width', String(m2_w));
  DOM.mass2Rect.setAttribute('height', String(m2_h));
  DOM.mass2Label.setAttribute('x', String(m2_w + 6));
  DOM.mass2Label.setAttribute('y', String(m2_hpx));
  DOM.mass2Label.setAttribute('text-anchor', 'start');
  DOM.mass2Label.innerHTML = '';
  const lbl2s = document.createElementNS(NS, 'tspan');
  lbl2s.setAttribute('font-style', 'italic'); lbl2s.textContent = 'm₂';
  DOM.mass2Label.appendChild(lbl2s);
  const lbl2v = document.createElementNS(NS, 'tspan');
  lbl2v.textContent = `=${fmt(m2, 1)} kg`;
  DOM.mass2Label.appendChild(lbl2v);

  // Rope
  DOM.rope.setAttribute('d',
    `M ${X_LEFT} ${y1_svg} V ${PULLEY_Y} A ${PULLEY_R} ${PULLEY_R} 0 0 1 ${X_RIGHT} ${PULLEY_Y} V ${y2_svg}`);

  // Force vectors
  const vis = showForces ? 'visible' : 'hidden';
  const netVis = (showForces && showNetForce) ? 'visible' : 'hidden';
  const Fg1 = m1 * G * PPN, Fg2 = m2 * G * PPN;
  const T_len = tens * PPN;
  const Fnet1_len = Math.abs(m1 * accel) * PPN;
  const Fnet2_len = Math.abs(m2 * accel) * PPN;

  setVec(DOM.fG1,  X_LEFT,  y1_svg + m1_hpx, X_LEFT,  y1_svg + m1_hpx + Fg1, vis);
  setVec(DOM.fT1,  X_LEFT,  y1_svg - m1_hpx, X_LEFT,  y1_svg - m1_hpx - T_len, vis);
  setVec(DOM.fG2,  X_RIGHT, y2_svg + m2_hpx, X_RIGHT, y2_svg + m2_hpx + Fg2, vis);
  setVec(DOM.fT2,  X_RIGHT, y2_svg - m2_hpx, X_RIGHT, y2_svg - m2_hpx - T_len, vis);
  setVec(DOM.fNet1, X_LEFT,  y1_svg, X_LEFT,  y1_svg + m1 * accel * PPN, netVis);
  setVec(DOM.fNet2, X_RIGHT, y2_svg, X_RIGHT, y2_svg - m2 * accel * PPN, netVis);

  // Stopwatch: main hand = 1 rev/60s (seconds), sub hand = 1 rev/s (tenths)
  const ma = (t % 60) / 60 * 2 * Math.PI - Math.PI / 2;
  DOM.swHand.setAttribute('x2', String(SW_HAND_LEN * Math.cos(ma)));
  DOM.swHand.setAttribute('y2', String(SW_HAND_LEN * Math.sin(ma)));
  const sa = (t % 1) * 2 * Math.PI - Math.PI / 2;
  DOM.subHand.setAttribute('x2', String(13 * Math.cos(sa)));
  DOM.subHand.setAttribute('y2', String(25 + 13 * Math.sin(sa)));

  // Time label
  DOM.timeLabel.innerHTML = `<i>t</i> = ${fmt(t)} s`;

  // Live analysis
  const v1 = interpolateAt(store.v1_data, t);
  const v2 = interpolateAt(store.v2_data, t);
  DOM.liveA1.textContent    = `${fmt(accel, 3)} m/s²`;
  DOM.liveA2.textContent    = `${fmt(-accel, 3)} m/s²`;
  DOM.liveTens.textContent  = `${fmt(tens, 2)} N`;
  DOM.liveV1.textContent    = `${fmt(v1, 3)} m/s`;
  DOM.liveV2.textContent    = `${fmt(v2, 3)} m/s`;
  DOM.liveY1.textContent    = `${fmt(Y_MAX_CM - y1_m * CM_PER_M, 1)} cm`;
  DOM.liveY2.textContent    = `${fmt(Y_MAX_CM - y2_m * CM_PER_M, 1)} cm`;
  DOM.liveYdiff.textContent = `${fmt((y2_m - y1_m) * CM_PER_M, 1)} cm`;
}

function setVec(lineEl, x1, y1, x2, y2, vis) {
  lineEl.setAttribute('x1', x1); lineEl.setAttribute('y1', y1);
  lineEl.setAttribute('x2', x2); lineEl.setAttribute('y2', y2);
  // Only show if vector has meaningful length
  const len = Math.abs(y2 - y1) + Math.abs(x2 - x1);
  lineEl.setAttribute('visibility', vis === 'visible' && len > 1 ? 'visible' : 'hidden');
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

// ── Graph rendering ───────────────────────────────────────────────────────────
const GRAPH_TYPE_INFO = {
  y:     { unit: 'cm',   label1: 'y₁',  label2: 'y₂',  title1: 'Position y₁(t)',          title2: 'Position y₂(t)',          titleBoth: 'Positionen y₁, y₂' },
  v:     { unit: 'm/s',  label1: 'v₁',  label2: 'v₂',  title1: 'Geschwindigkeit v₁(t)',    title2: 'Geschwindigkeit v₂(t)',    titleBoth: 'Geschwindigkeiten v₁, v₂' },
  a:     { unit: 'm/s²', label1: 'a₁',  label2: 'a₂',  title1: 'Beschleunigung a₁(t)',    title2: 'Beschleunigung a₂(t)',    titleBoth: 'Beschleunigungen a₁, a₂' },
  ydiff: { unit: 'cm',   label1: 'Δy',  label2: null,   title1: 'Abstand der Massen Δy(t)', title2: null,                     titleBoth: null },
  yrel:  { unit: 'cm',   label1: 'Δy₁', label2: 'Δy₂', title1: 'Verschiebung Δy₁(t)',     title2: 'Verschiebung Δy₂(t)',     titleBoth: 'Verschiebungen Δy₁, Δy₂' },
};

export function updateGraphs(time) {
  const { mode, type1, type2, subject } = store.graphCfg;

  DOM.graphSvgSingle.style.display = mode === 'single' ? 'block' : 'none';
  DOM.graphSvgTop.style.display    = mode === 'dual'   ? 'block' : 'none';
  DOM.graphSvgBottom.style.display = mode === 'dual'   ? 'block' : 'none';

  if (mode === 'single') {
    drawSingleGraph(DOM.graphSvgSingle, time, type1, subject, false);
  } else {
    drawSingleGraph(DOM.graphSvgTop,    time, type1, 'm1', true);
    drawSingleGraph(DOM.graphSvgBottom, time, type2, 'm2', true);
  }
}

function drawSingleGraph(svgEl, time, type, subject, isStacked) {
  if (!store.t_data.length) return;
  const vb     = svgEl.getAttribute('viewBox').split(' ');
  const SVG_W  = parseFloat(vb[2]);
  const SVG_H  = parseFloat(vb[3]);
  const P      = { top: 30, right: 25, bottom: 40, left: 58 };
  const PLOT_W = SVG_W - P.left - P.right;
  const PLOT_H = SVG_H - P.top  - P.bottom;

  const { t_data } = store;
  const t_max = store.t_end;
  const isYdiff = type === 'ydiff';
  const key1 = isYdiff ? 'ydiff' : `${type}${subject === 'm2' ? '2' : '1'}`;
  const key2 = (!isYdiff && subject === 'both') ? `${type}2` : null;

  if (!store.axisLimits[key1]) return;
  const lim1  = store.axisLimits[key1];
  const lim2  = key2 ? store.axisLimits[key2] : null;

  const rawMin = Math.min(lim1.min, lim2 ? lim2.min : Infinity);
  const rawMax = Math.max(lim1.max, lim2 ? lim2.max : -Infinity);
  const range  = Math.max(Math.abs(rawMax - rawMin), 0.001);
  const step   = getNiceTick(range);
  const nMin   = Math.floor(rawMin / step - 0.5) * step;
  const nMax   = Math.ceil(rawMax  / step + 0.5) * step;
  const nRange = nMax - nMin;

  const scaleT = t => t_max > 0 ? P.left + (t / t_max) * PLOT_W : P.left;
  const scaleY = v => SVG_H - P.bottom - ((v - nMin) / nRange) * PLOT_H;

  // Clear grid group
  const gridEl = svgEl.querySelector('.graph_grid');
  gridEl.innerHTML = '';

  // Graph background — 10 px Luft über y-Pfeil und rechts vom x-Pfeil
  gridEl.appendChild(el('rect', {
    x: P.left, y: P.top - 10, width: PLOT_W + 10, height: PLOT_H + 10, class: 'graph-bg',
  }));

  // Grid lines + Y ticks
  let yv = nMin;
  while (yv <= nMax + step * 0.01) {
    const py = scaleY(yv);
    if (py >= P.top - 1 && py <= SVG_H - P.bottom + 1) {
      gridEl.appendChild(el('line', { x1: P.left, y1: py, x2: P.left + PLOT_W, y2: py, class: 'grid-line' }));
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', String(P.left - 5));
      t.setAttribute('y', String(py + 3.5));
      t.setAttribute('text-anchor', 'end');
      t.setAttribute('class', 'tick-label');
      t.textContent = fmt(yv, Math.abs(yv) < 1 && step < 1 ? 2 : 1);
      gridEl.appendChild(t);
    }
    yv = Math.round((yv + step) * 1e6) / 1e6;
  }

  // X-axis ticks — mindestens 3 Zeitmarken außer 0
  const tStep = tAxisStep(t_max);
  let tv = 0;
  while (tv <= t_max + tStep * 0.01) {
    const px = scaleT(Math.min(tv, t_max));
    gridEl.appendChild(el('line', { x1: px, y1: P.top, x2: px, y2: SVG_H - P.bottom, class: 'grid-line' }));
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', String(px));
    t.setAttribute('y', String(SVG_H - P.bottom + 13));
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('class', 'tick-label');
    t.textContent = fmt(tv, 1);
    gridEl.appendChild(t);
    tv = Math.round((tv + tStep) * 1e6) / 1e6;
  }

  // Axis lines — y-Achse von unten nach oben (marker-end zeigt aufwärts)
  ensureAxisMarker(svgEl);
  gridEl.appendChild(el('line', {
    x1: P.left, y1: SVG_H - P.bottom, x2: P.left, y2: P.top,
    class: 'axis-line', 'stroke-width': 1.5, 'marker-end': 'url(#arr-axis-g)',
  }));
  gridEl.appendChild(el('line', {
    x1: P.left, y1: SVG_H - P.bottom, x2: P.left + PLOT_W, y2: SVG_H - P.bottom,
    class: 'axis-line', 'stroke-width': 1.5, 'marker-end': 'url(#arr-axis-g)',
  }));

  // Axis labels
  const info = GRAPH_TYPE_INFO[type] || GRAPH_TYPE_INFO.ydiff;
  const yLabelText = (() => {
    if (isYdiff) return `Δy / ${info.unit}`;
    if (subject === 'both') return `${info.label1}, ${info.label2} / ${info.unit}`;
    return `${subject === 'm2' ? info.label2 : info.label1} / ${info.unit}`;
  })();
  const yAxisLabel = el('text', {
    x: 0, y: 0, class: 'axis-label',
    transform: `translate(${P.left - 40}, ${P.top + PLOT_H / 2}) rotate(-90)`,
    'text-anchor': 'middle',
  });
  setAxisLabel(yAxisLabel, yLabelText);
  gridEl.appendChild(yAxisLabel);

  const xAxisLabel = el('text', {
    x: P.left + PLOT_W / 2, y: SVG_H - 5, class: 'axis-label', 'text-anchor': 'middle',
  });
  setAxisLabel(xAxisLabel, 't / s');
  gridEl.appendChild(xAxisLabel);

  // Data up to current time
  const plotIdx = (() => {
    let i = t_data.findIndex(tv => tv > time);
    return i === -1 ? t_data.length : i;
  })();

  const buildPoints = (data) => {
    const pts = [];
    for (let i = 0; i < plotIdx; i++) pts.push(`${scaleT(t_data[i])},${scaleY(data[i])}`);
    if (plotIdx > 0 && time > 0) {
      const cv = interpolateAt(data, time);
      pts.push(`${scaleT(Math.min(time, t_max))},${scaleY(cv)}`);
    }
    return pts.join(' ');
  };

  const color1 = subject === 'm2' ? 'var(--c-m2)' : 'var(--c-m1)';
  const line1 = svgEl.querySelector('.graph_line_1');
  line1.setAttribute('points', buildPoints(lim1.full_data));
  line1.style.stroke = color1;
  line1.style.display = 'block';

  const line2 = svgEl.querySelector('.graph_line_2');
  if (key2 && lim2) {
    line2.setAttribute('points', buildPoints(lim2.full_data));
    line2.style.stroke = 'var(--c-m2)';
    line2.style.display = 'block';
  } else {
    line2.style.display = 'none';
  }

  // Current position dot
  const pt1 = svgEl.querySelector('.graph_point_1');
  if (plotIdx > 0 && time > 0) {
    const cv = interpolateAt(lim1.full_data, time);
    pt1.setAttribute('cx', String(scaleT(Math.min(time, t_max))));
    pt1.setAttribute('cy', String(scaleY(cv)));
    pt1.style.fill = color1;
    pt1.setAttribute('visibility', 'visible');
  } else {
    pt1.setAttribute('visibility', 'hidden');
  }
  const pt2 = svgEl.querySelector('.graph_point_2');
  if (key2 && lim2 && plotIdx > 0 && time > 0) {
    const cv = interpolateAt(lim2.full_data, time);
    pt2.setAttribute('cx', String(scaleT(Math.min(time, t_max))));
    pt2.setAttribute('cy', String(scaleY(cv)));
    pt2.style.fill = 'var(--c-m2)';
    pt2.setAttribute('visibility', 'visible');
  } else {
    pt2.setAttribute('visibility', 'hidden');
  }

  // Graph title
  const titleEl = svgEl.querySelector('.graph_title');
  const titleText = (() => {
    if (isYdiff) return info.title1;
    if (isStacked) return subject === 'm2' ? info.title2 : info.title1;
    if (subject === 'both') return info.titleBoth;
    return subject === 'm2' ? info.title2 : info.title1;
  })();
  setGraphTitle(titleEl, titleText);
}
