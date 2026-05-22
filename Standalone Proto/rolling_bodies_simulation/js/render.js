/**
 * Rendering functions
 * @module render
 */

import {
  SVG_W, SVG_H, SVG_PADDING_TOP, SVG_PADDING_BOTTOM, SVG_PADDING_LEFT, SVG_PADDING_RIGHT,
  SVG_MIN_PPM, SVG_MAX_PPM, VERT_SPAN_BUFFER,
  GRAPH_PADDING, RAMP_TICK_INTERVAL, RAMP_TICK_MAIN, RAMP_GRID_INTERVAL,
  RAMP_ARC_RADIUS, RAMP_START_MARKER_OFFSET,
  VEC_REF_PX, VEC_V_REF_PX, VEC_A_REF, VEC_A_MAX_PX, VEC_MIN_LEN, VEC_MAX_V_PX,
  TRACE_EPSILON, MASS, G,
  SUBJECTS, SUBJ_COLORS, SUBJ_LABELS, GRAPH_OPTIONS, CMP_KEYS, ALL_TYPES,
  X_STOP, DRAW_X, GRAPH_Y_LABEL_OFFSET, DT
} from './constants.js';

import * as state from './state.js';

/**
 * Format a number for display (with comma)
 */
export function fmt(v, d = 3) {
  if (typeof v !== 'number' || !isFinite(v)) return '···';
  return v.toFixed(d).replace('.', ',');
}

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

export function setupViewport() {
  const sa = Math.sin(state.store.alpha_rad), ca = Math.cos(state.store.alpha_rad);
  const vertSpanUnits = X_STOP * sa + VERT_SPAN_BUFFER * state.store.R_m * ca + state.store.R_m;
  const availH = SVG_H - 50 - 44;
  state.store.ppm = Math.min(SVG_MAX_PPM, Math.max(SVG_MIN_PPM, availH / vertSpanUnits));

  const R_px = state.store.R_m * state.store.ppm;
  state.store._visX0 = 38 + R_px;
  state.store._visX1 = SVG_W - 38 - R_px;

  state.store.rampStartX = state.store._visX0;
  state.store.rampStartY = SVG_H - 44 - X_STOP * state.store.ppm * sa;

  const bodyTopAtStart = state.store.rampStartY - state.store.R_m * state.store.ppm * ca;
  if (bodyTopAtStart < 32) state.store.rampStartY += (32 - bodyTopAtStart);
}

export function drawBackground() {
  const { bgG } = state.DOM;
  bgG.innerHTML = '';
  const isDark = document.body.classList.contains('dark');
  const rampColor = isDark ? 'rgba(232,197,71,.6)'   : 'rgba(0,0,0,.3)';
  const gridColor = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)';
  const tickColor = isDark ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.4)';
  const textColor = isDark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.5)';

  const p0 = physToScreen(-0.5, 0), p1 = physToScreen(DRAW_X, 0);
  const sa = Math.sin(state.store.alpha_rad);
  bgG.appendChild(svgEl('polygon', {
    points: `${fmtTech(p0.x)},${fmtTech(p0.y)} ${fmtTech(p1.x)},${fmtTech(p1.y)} ${fmtTech(p1.x+300*sa+200)},${fmtTech(p1.y+2000)} ${fmtTech(p0.x-200)},${fmtTech(p0.y+2000)}`,
    fill: isDark ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.03)', stroke:'none'
  }));

  bgG.appendChild(svgEl('line', {
    x1: fmtTech(physToScreen(-0.3, 0).x), y1: fmtTech(physToScreen(-0.3, 0).y),
    x2: fmtTech(physToScreen(DRAW_X, 0).x), y2: fmtTech(physToScreen(DRAW_X, 0).y),
    stroke: rampColor, 'stroke-width': isDark ? 2.5 : 2
  }));

  bgG.appendChild(svgEl('line', {
    x1: fmtTech(state.store.rampStartX), y1: fmtTech(state.store.rampStartY),
    x2: fmtTech(state.store.rampStartX), y2: fmtTech(state.store.rampStartY - RAMP_START_MARKER_OFFSET),
    stroke: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.22)',
    'stroke-width': 1.5, 'stroke-dasharray': '5,4'
  }));

  for (let xm = 0; xm <= X_STOP + 0.1; xm += RAMP_TICK_INTERVAL) {
    const isMain = Math.abs(xm % RAMP_TICK_MAIN) < 0.01;
    const pt = physToScreen(xm, 0);
    const tickLen = isMain ? 8 : 4;
    bgG.appendChild(svgEl('line', {
      x1: fmtTech(pt.x), y1: fmtTech(pt.y), x2: fmtTech(pt.x), y2: fmtTech(pt.y + tickLen),
      stroke: tickColor, 'stroke-width': isMain ? 1.5 : 1
    }));
    if (isMain) {
      const txt = svgEl('text', {
        x: fmtTech(pt.x), y: fmtTech(pt.y + tickLen + 10),
        'text-anchor': 'middle', 'dominant-baseline': 'hanging',
        'font-family': 'JetBrains Mono', 'font-size': '9px', fill: textColor
      });
      txt.textContent = fmt(xm, 1) + ' m';
      bgG.appendChild(txt);
    }
  }

  for (let ym = RAMP_GRID_INTERVAL; ym <= 1.2; ym += RAMP_GRID_INTERVAL) {
    const g0 = physToScreen(-0.3, ym), g1 = physToScreen(X_STOP + 0.2, ym);
    bgG.appendChild(svgEl('line', {
      x1: fmtTech(g0.x), y1: fmtTech(g0.y), x2: fmtTech(g1.x), y2: fmtTech(g1.y),
      stroke: gridColor, 'stroke-width': 1
    }));
  }
}

export function drawObstacle() {
  const { obstacleG } = state.DOM;
  obstacleG.innerHTML = '';
  const isDark = document.body.classList.contains('dark');
  const wW = 12 / state.store.ppm, wH = 28 / state.store.ppm;
  const gap = 2 / state.store.ppm;
  const wx = X_STOP + state.store.R_m + gap;

  const p0 = physToScreen(wx, 0);
  const p1 = physToScreen(wx + wW, 0);
  const p2 = physToScreen(wx + wW, wH);
  const p3 = physToScreen(wx, wH);

  obstacleG.appendChild(svgEl('polygon', {
    points: `${fmtTech(p0.x)},${fmtTech(p0.y)} ${fmtTech(p1.x)},${fmtTech(p1.y)} ${fmtTech(p2.x)},${fmtTech(p2.y)} ${fmtTech(p3.x)},${fmtTech(p3.y)}`,
    fill: isDark ? '#a83222' : '#b03020', stroke: isDark ? '#ff7766' : '#7a1a00',
    'stroke-width': '1', opacity: '.85'
  }));
}

export function drawCoordinateSystem() {
  const { coordSystemG } = state.DOM;
  coordSystemG.innerHTML = '';
  const isDark = document.body.classList.contains('dark');
  const color = isDark ? 'var(--accent)' : 'rgba(0,0,0,.7)';
  const alpha = state.store.alpha_rad;
  const isPlane = state.store.coordSystemAlignment === 'plane';
  
  const origin = { x: state.store.rampStartX, y: state.store.rampStartY };
  const len = 50;
  
  const g = svgEl('g', { 
    transform: `translate(${fmtTech(origin.x)},${fmtTech(origin.y)})`,
    opacity: '0.8'
  });
  
  const drawAxis = (ang, label, col) => {
    const x2 = len * Math.cos(ang), y2 = len * Math.sin(ang);
    g.appendChild(svgEl('line', {
      x1: 0, y1: 0, x2: fmtTech(x2), y2: fmtTech(y2),
      stroke: col, 'stroke-width': 2, 'marker-end': 'url(#arr-cs)'
    }));
    const lx = (len + 14) * Math.cos(ang), ly = (len + 14) * Math.sin(ang);
    const txt = svgEl('text', {
      x: fmtTech(lx), y: fmtTech(ly), 'text-anchor': 'middle', 'dominant-baseline': 'middle',
      'font-family': 'JetBrains Mono', 'font-size': '12px', 'font-weight': '800', fill: col
    });
    txt.textContent = label;
    g.appendChild(txt);
  };

  if (!document.getElementById('arr-cs')) {
    const defs = state.DOM.mainSvg.querySelector('defs');
    const m = svgEl('marker', { id: 'arr-cs', markerWidth: 6, markerHeight: 6, refX: 5, refY: 3, orient: 'auto' });
    m.appendChild(svgEl('polygon', { points: '0 0, 6 3, 0 6', fill: 'context-stroke' }));
    defs.appendChild(m);
  }

  if (isPlane) {
    // x follows the ramp (downwards), y is perpendicular to the ramp (upwards)
    drawAxis(alpha, 'x', color);
    drawAxis(alpha - Math.PI/2, 'y', color);
  } else {
    // Standard ground system
    drawAxis(0, 'x', color);
    drawAxis(-Math.PI/2, 'y', color);
  }

  // Alpha visualization in the coordinate system
  if (alpha > 0.01) {
    const arcR = 30;
    const ax1 = arcR;
    const ay1 = 0;
    const ax2 = arcR * Math.cos(alpha);
    const ay2 = arcR * Math.sin(alpha);
    g.appendChild(svgEl('path', {
      d: `M ${ax1} 0 A ${arcR} ${arcR} 0 0 1 ${fmtTech(ax2)} ${fmtTech(ay2)}`,
      fill: 'none', stroke: isDark ? 'var(--accent2)' : 'rgba(0,0,0,0.4)', 'stroke-width': 1.2
    }));
    const midA = alpha / 2;
    const tlx = (arcR + 12) * Math.cos(midA);
    const tly = (arcR + 12) * Math.sin(midA);
    const tAlpha = svgEl('text', {
      x: fmtTech(tlx), y: fmtTech(tly), 'text-anchor': 'middle', 'dominant-baseline': 'middle',
      'font-family': 'JetBrains Mono', 'font-size': '10px', fill: isDark ? 'var(--accent2)' : '#666'
    });
    tAlpha.textContent = 'α';
    g.appendChild(tAlpha);
  }

  coordSystemG.appendChild(g);
}

export function updateCylinderStyle() {
  const type = document.querySelector('input[name="obj"]:checked').value;
  const R_px = state.store.R_m * state.store.ppm;
  const { cylBody, cylInner, sp1, sp2, sp3, sp4 } = state.DOM;
  const isDark = document.body.classList.contains('dark');

  cylBody.setAttribute('stroke-width', '1.5');
  cylBody.setAttribute('fill-opacity', '1');
  cylInner.setAttribute('visibility', 'hidden');
  cylInner.setAttribute('stroke-width', '1');

  if (type === 'solid_cylinder') {
    cylBody.setAttribute('fill', isDark ? '#262c42' : '#5070a0');
    cylBody.setAttribute('stroke', isDark ? '#8890a8' : '#667');
    cylBody.setAttribute('r', fmtTech(R_px));
  } else if (type === 'solid_sphere') {
    cylBody.setAttribute('fill', isDark ? 'url(#sphereGrad)' : 'url(#sphereGradL)');
    cylBody.setAttribute('stroke', 'none');
    cylBody.setAttribute('r', fmtTech(R_px));
  } else if (type === 'thin_cylinder') {
    cylBody.setAttribute('fill', 'none');
    cylBody.setAttribute('stroke', isDark ? '#a0abc7' : '#778');
    cylBody.setAttribute('stroke-width', '4');
    cylBody.setAttribute('r', fmtTech(R_px - 2));
  } else if (type === 'thin_sphere') {
    cylBody.setAttribute('fill', isDark ? 'rgba(100,120,160,.25)' : 'rgba(100,120,160,.1)');
    cylBody.setAttribute('stroke', isDark ? '#66aaff' : '#7090c0');
    cylBody.setAttribute('stroke-width', '2.5');
    cylBody.setAttribute('r', fmtTech(R_px));
  } else if (type.startsWith('thick')) {
    const beta = parseInt(state.DOM.innerRSlider.value, 10) / 100;
    const rIn = R_px * beta;
    if (type === 'thick_cylinder') {
      const thickness = Math.max(2, R_px - rIn);
      cylBody.setAttribute('fill', 'none');
      cylBody.setAttribute('stroke', isDark ? '#a0abc7' : '#889');
      cylBody.setAttribute('stroke-width', thickness);
      cylBody.setAttribute('r', fmtTech(rIn + thickness / 2));
    } else {
      cylBody.setAttribute('fill', isDark ? 'rgba(100,130,170,.3)' : 'rgba(100,130,170,.15)');
      cylBody.setAttribute('stroke', isDark ? '#66aaff' : '#7090c0');
      cylBody.setAttribute('stroke-width', '2');
      cylBody.setAttribute('r', fmtTech(R_px));
      cylInner.setAttribute('visibility', 'visible');
      cylInner.setAttribute('r', fmtTech(rIn));
      cylInner.setAttribute('fill', isDark ? 'var(--bg)' : 'rgba(240,242,248,.8)');
      cylInner.setAttribute('stroke', '#5060a0');
    }
  }

  const sp = [[0, -R_px], [R_px, 0], [0, R_px], [-R_px, 0]];
  [sp1, sp2, sp3, sp4].forEach((el, i) => {
    el.setAttribute('x2', fmtTech(sp[i][0]));
    el.setAttribute('y2', fmtTech(sp[i][1]));
  });
}

function drawArrow(parent, x1, y1, vx, vy, color, markerId, minLen = VEC_MIN_LEN) {
  const len = Math.hypot(vx, vy);
  if (len < minLen) return;
  const el = svgEl('line', {
    x1: fmtTech(x1), y1: fmtTech(y1),
    x2: fmtTech(x1 + vx), y2: fmtTech(y1 + vy),
    stroke: color, 'stroke-width': 2.2,
    'marker-end': `url(#${markerId})`
  });
  parent.appendChild(el);
  return el;
}

export function updateVectorsAndForces(interp, screenSP, camDX) {
  const { vectorsG, forcesG, vecLegendG } = state.DOM;
  vectorsG.innerHTML = '';
  forcesG.innerHTML = '';
  vecLegendG.innerHTML = '';

  const showV  = state.DOM.togV.checked;
  const showA  = state.DOM.togA.checked;
  const showFg = state.DOM.togFg.checked;
  const showFn = state.DOM.togFn.checked;
  const showFr = state.DOM.togFr.checked;

  if (!showV && !showA && !showFg && !showFn && !showFr) return;

  const sx = screenSP.x, sy = screenSP.y;
  const isInclined = state.DOM.modeInclined.checked;
  const ca = Math.cos(state.store.alpha_rad), sa = Math.sin(state.store.alpha_rad);

  const forceScale = state.store.vecScale;
  const linearFPx = (F) => Math.max(4, (Math.abs(F) / (MASS * G)) * VEC_REF_PX * forceScale);

  const logScaleVec = (vx, vy, ref, maxPx) => {
    const mag = Math.hypot(vx, vy);
    if (mag < 1e-6) return { x: 0, y: 0 };
    const pxLen = Math.min(maxPx, Math.max(5, maxPx * 0.5 * (1 + Math.log(1 + mag / ref) / Math.log(2))));
    return { x: vx / mag * pxLen, y: vy / mag * pxLen };
  };

  const ptScreen = (xloc, yloc) => {
    const s = physToScreen(xloc, yloc);
    return { x: s.x + camDX, y: s.y };
  };

  const spX = interp(state.store.fullData.sp_x);
  const contactPt = ptScreen(spX, 0);

  if (showV) {
    for (const s of state.store.activeSubjects) {
      const vxLoc = interp(state.store.fullData[`${s}_vx`]);
      const vyLoc = interp(state.store.fullData[`${s}_vy`]);
      let ptX = sx, ptY = sy;
      if (s !== 'sp') {
        const ps = ptScreen(interp(state.store.fullData[`${s}_x`]), interp(state.store.fullData[`${s}_y`]));
        ptX = ps.x; ptY = ps.y;
      }
      const vScr = localVecToScreen(vxLoc, vyLoc);
      const mag = Math.hypot(vScr.x, vScr.y);
      if (mag < 1e-6) continue;
      const px = Math.min(VEC_MAX_V_PX, Math.max(4, mag * VEC_V_REF_PX));
      drawArrow(vectorsG, ptX, ptY, vScr.x / mag * px, vScr.y / mag * px, 'var(--c-vel)', 'arr-v', VEC_MIN_LEN);
    }
  }

  if (showA) {
    for (const s of state.store.activeSubjects) {
      const axLoc = interp(state.store.fullData[`${s}_ax`]);
      const ayLoc = interp(state.store.fullData[`${s}_ay`]);
      let ptX = sx, ptY = sy;
      if (s !== 'sp') {
        const ps = ptScreen(interp(state.store.fullData[`${s}_x`]), interp(state.store.fullData[`${s}_y`]));
        ptX = ps.x; ptY = ps.y;
      }
      const aScr = localVecToScreen(axLoc, ayLoc);
      const aScaled = logScaleVec(aScr.x, aScr.y, VEC_A_REF, VEC_A_MAX_PX);
      drawArrow(vectorsG, ptX, ptY, aScaled.x, aScaled.y, 'var(--c-acc)', 'arr-a', VEC_MIN_LEN);
    }
  }

  if (showFg) {
    const px = linearFPx(MASS * G);
    drawArrow(forcesG, sx, sy, 0, px, 'var(--c-fg)', 'arr-fg', 0);
    const lbl = svgEl('text', {
      x: fmtTech(sx + 6), y: fmtTech(sy + px * 0.55),
      fill: 'var(--c-fg)', 'font-family': 'JetBrains Mono',
      'font-size': '9px', 'dominant-baseline': 'middle'
    });
    lbl.textContent = `${fmt(MASS * G, 1)} N`;
    forcesG.appendChild(lbl);
  }

  if (showFn) {
    const FN = MASS * G * (isInclined ? ca : 1.0);
    const px = linearFPx(FN);
    drawArrow(forcesG, sx, sy, sa * px, -ca * px, 'var(--c-fn)', 'arr-fn', 0);
    const lx = sx + sa * px * 0.55 + 6;
    const ly = sy - ca * px * 0.55;
    const lbl = svgEl('text', {
      x: fmtTech(lx), y: fmtTech(ly),
      fill: 'var(--c-fn)', 'font-family': 'JetBrains Mono',
      'font-size': '9px', 'dominant-baseline': 'middle', 'text-anchor': 'start'
    });
    lbl.textContent = `${fmt(FN, 1)} N`;
    forcesG.appendChild(lbl);
  }

  if (showFr) {
    const FR = isInclined ? MASS * G * sa * state.store.kFactor / (1 + state.store.kFactor) : 0;
    if (FR > 1e-9) {
      const px = linearFPx(FR);
      drawArrow(forcesG, contactPt.x, contactPt.y, -ca * px, -sa * px, 'var(--c-fr)', 'arr-fr', 0);
      const lx = contactPt.x - ca * px * 1.18;
      const ly = contactPt.y - sa * px * 1.18;
      const lbl = svgEl('text', {
        x: fmtTech(lx), y: fmtTech(ly - 5),
        fill: 'var(--c-fr)', 'font-family': 'JetBrains Mono',
        'font-size': '9px', 'text-anchor': 'middle'
      });
      lbl.textContent = `${fmt(FR, 2)} N`;
      forcesG.appendChild(lbl);
    } else {
      forcesG.appendChild(svgEl('circle', {
        cx: fmtTech(contactPt.x), cy: fmtTech(contactPt.y), r: 4,
        fill: 'none', stroke: 'var(--c-fr)', 'stroke-width': '1.5', 'stroke-dasharray': '2,2'
      }));
      const lbl = svgEl('text', {
        x: fmtTech(contactPt.x + 12), y: fmtTech(contactPt.y - 4),
        fill: 'var(--c-fr)', 'font-family': 'JetBrains Mono', 'font-size': '9px', opacity: '.6'
      });
      lbl.textContent = 'FR = 0 N';
      forcesG.appendChild(lbl);
    }
  }

  let ly2 = 0;
  const addLeg = (color, label, markerId) => {
    const g2 = svgEl('g', { transform: `translate(0,${ly2})` });
    g2.appendChild(svgEl('line', {
      x1: 0, y1: 8, x2: 22, y2: 8,
      stroke: color, 'stroke-width': 2, 'marker-end': `url(#${markerId})`
    }));
    const tx = svgEl('text', {
      x: 28, y: 12, 'font-family': 'JetBrains Mono',
      'font-size': '10px', fill: color
    });
    tx.textContent = label;
    g2.appendChild(tx);
    vecLegendG.appendChild(g2);
    ly2 += 17;
  };
  if (showV)  addLeg('var(--c-vel)', 'v (proportional)', 'arr-v');
  if (showA)  addLeg('var(--c-acc)', 'a (logarithmisch)', 'arr-a');
  if (showFg) addLeg('var(--c-fg)',  'Fg (linear)',       'arr-fg');
  if (showFn) addLeg('var(--c-fn)',  'FN (linear)',       'arr-fn');
  if (showFr) addLeg('var(--c-fr)',  'FR (linear)',       'arr-fr');
  vecLegendG.setAttribute('visibility', ly2 > 0 ? 'visible' : 'hidden');
}

export function rebuildAnalysis() {
  const { analysisArea } = state.DOM;
  analysisArea.innerHTML = '';
  state.store.analysisCache = {};
  SUBJECTS.forEach(s => {
    if (!state.store.activeSubjects.has(s)) return;
    const div = document.createElement('div');
    div.className = 'analysis-subject';
    div.innerHTML = `
      <div class="analysis-subject-header">
        <span class="dot" style="background:${SUBJ_COLORS[s]}"></span>${SUBJ_LABELS[s]}
      </div>
      <div class="analysis-grid">
        <span class="analysis-cell key">x</span>   <span class="analysis-cell val" id="ac_${s}_x">–</span>
        <span class="analysis-cell key">y</span>   <span class="analysis-cell val" id="ac_${s}_y">–</span>
        <span class="analysis-cell key">|v|</span> <span class="analysis-cell val" id="ac_${s}_v">–</span>
        <span class="analysis-cell key">|a|</span> <span class="analysis-cell val" id="ac_${s}_a">–</span>
      </div>`;
    analysisArea.appendChild(div);
    state.store.analysisCache[s] = {
      x: div.querySelector(`#ac_${s}_x`),
      y: div.querySelector(`#ac_${s}_y`),
      v: div.querySelector(`#ac_${s}_v`),
      a: div.querySelector(`#ac_${s}_a`)
    };
  });

  if (state.store._mjDebounceTimer) clearTimeout(state.store._mjDebounceTimer);
  state.store._mjDebounceTimer = setTimeout(() => {
    if (window._mjReady && window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise([analysisArea]).catch(() => {});
    }
  }, 300);
}

export function updateAnalysis(interp) {
  const isGround = state.store.coordSystemAlignment === 'ground';
  const alpha = state.store.alpha_rad;
  const ca = Math.cos(alpha), sa = Math.sin(alpha);

  for (const s of state.store.activeSubjects) {
    const c = state.store.analysisCache[s];
    if (!c) continue;
    
    let x_val = interp(state.store.fullData[`${s}_x`]);
    let y_val = interp(state.store.fullData[`${s}_y`]);

    if (isGround) {
      const x_g = x_val * ca + y_val * sa;
      const y_g = x_val * sa - y_val * ca;
      x_val = x_g;
      y_val = -y_g; 
    }

    c.x.textContent = fmt(x_val)     + ' m';
    c.y.textContent = fmt(y_val)     + ' m';
    c.v.textContent = fmt(interp(state.store.fullData[`${s}_vabs`]))  + ' m/s';
    c.a.textContent = fmt(interp(state.store.fullData[`${s}_aabs`])) + ' m/s²';
  }
}

export function buildRaceBars() {
  const { raceBars } = state.DOM;
  raceBars.innerHTML = '';
  if (!state.DOM.modeInclined.checked) {
    raceBars.innerHTML = '<div class="section-note">Rennen nur im Schrägmodus sinnvoll.</div>';
    return;
  }
  const primaryKey = document.querySelector('input[name="obj"]:checked').value;
  const beta = parseInt(state.DOM.innerRSlider.value, 10) / 100;

  const toShow = [];
  const primType = ALL_TYPES.find(t => t.key === primaryKey);
  if (primType) toShow.push({ ...primType, isPrimary: true });
  for (const ck of state.store.compareActive) {
    const ct = ALL_TYPES.find(t => t.key === ck);
    if (ct) toShow.push({ ...ct, isPrimary: false });
  }

  if (toShow.length < 2) {
    raceBars.innerHTML = '<div class="section-note">Mindestens einen Vergleichskörper aktivieren.</div>';
    return;
  }

  const sinA = Math.sin(state.store.alpha_rad);
  const tArr = toShow.map(t => Math.sqrt(2 * X_STOP * (1 + t.getK(beta)) / (G * sinA)));
  const tMax = Math.max(...tArr);

  toShow.forEach((t, i) => {
    const div = document.createElement('div');
    div.className = 'race-bar';
    div.innerHTML = `
      <div class="race-bar-header">
        <span class="race-bar-label" style="color:${t.color};${t.isPrimary ? 'font-weight:700' : ''}">${t.isPrimary ? '★ ' : ''}${t.label}</span>
        <span class="race-bar-val">${fmt(tArr[i], 2)} s</span>
      </div>
      <div class="race-bar-bg">
        <div class="race-bar-fill" style="background:${t.color};width:${(tArr[i] / tMax * 100).toFixed(1)}%"></div>
      </div>`;
    raceBars.appendChild(div);
  });
}

export function buildCompareList() {
  const { compareList, compareInfo } = state.DOM;
  compareList.innerHTML = '';
  const primaryType = document.querySelector('input[name="obj"]:checked').value;
  ALL_TYPES.forEach(t => {
    if (t.key === primaryType) return;
    const label = document.createElement('label');
    label.className = 'compare-row';
    label.style.setProperty('--color', t.color);
    label.innerHTML = `<input type="checkbox" value="${t.key}" ${state.store.compareActive.has(t.key) ? 'checked' : ''}><span class="cmp-check"></span><span class="cmp-dot"></span>${t.label}`;
    label.querySelector('input').addEventListener('change', e => {
      if (e.target.checked) state.store.compareActive.add(t.key);
      else state.store.compareActive.delete(t.key);
    });
    compareList.appendChild(label);
  });
  compareInfo.textContent = state.store.compareActive.size > 0
    ? `${state.store.compareActive.size} Vergleichskörper aktiv (gestrichelt)`
    : '– kein Vergleich aktiv –';
}

function douglasPeucker(pts, epsilon) {
  if (pts.length < 3) return pts;
  let maxDist = 0, maxIdx = 0;
  const [x1, y1] = pts[0];
  const [x2, y2] = pts[pts.length - 1];
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  for (let i = 1; i < pts.length - 1; i++) {
    let dist;
    if (len < 1e-10) {
      dist = Math.hypot(pts[i][0] - x1, pts[i][1] - y1);
    } else {
      dist = Math.abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / len;
    }
    if (dist > maxDist) { maxDist = dist; maxIdx = i; }
  }
  if (maxDist > epsilon) {
    const left  = douglasPeucker(pts.slice(0, maxIdx + 1), epsilon);
    const right = douglasPeucker(pts.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [pts[0], pts[pts.length - 1]];
}

export function drawCompareObjects(t) {
  const { compareObjsG } = state.DOM;
  compareObjsG.innerHTML = '';
  if (!state.DOM.modeInclined.checked) return;

  for (const ck of state.store.compareActive) {
    const ct = ALL_TYPES.find(x => x.key === ck);
    const cd = state.store.compareData[ck];
    if (!ct || !cd) continue;

    const n = state.store.fullData.t.length;
    let lo = 0, hi = n - 2;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (state.store.fullData.t[mid] <= t) lo = mid;
      else hi = mid - 1;
    }
    const f2 = (state.store.fullData.t[lo + 1] > state.store.fullData.t[lo]) ? (t - state.store.fullData.t[lo]) / (state.store.fullData.t[lo + 1] - state.store.fullData.t[lo]) : 0;
    const cx = cd.x[lo] + f2 * (cd.x[lo + 1] - cd.x[lo]);

    const sc = physToScreen(cx, state.store.R_m);
    const R_px = state.store.R_m * state.store.ppm;

    compareObjsG.appendChild(svgEl('circle', {
      cx: fmtTech(sc.x), cy: fmtTech(sc.y), r: fmtTech(R_px),
      fill: 'none', stroke: ct.color, 'stroke-width': 2,
      'stroke-dasharray': '6,3', opacity: '0.65'
    }));
    const tl = svgEl('text', {
      x: fmtTech(sc.x), y: fmtTech(sc.y - R_px - 5), 'text-anchor': 'middle',
      'font-family': 'JetBrains Mono', 'font-size': '9px', fill: ct.color, opacity: '0.8'
    });
    tl.textContent = ct.label;
    compareObjsG.appendChild(tl);
  }
}

export function updateGraph(t) {
  const { graphSvg, graphBgG, graphAxesG, graphSel, graphLegend, graphCursor } = state.DOM;
  graphBgG.innerHTML = '';
  graphAxesG.innerHTML = '';
  SUBJECTS.forEach(s => {
    document.getElementById(`gline_${s}`).setAttribute('points', '');
    const pt = document.getElementById(`gpt_${s}`);
    pt.style.visibility = 'hidden';
  });
  for (let i = 0; i < 5; i++) document.getElementById(`gcmp_${i}`).setAttribute('points', '');

  const key = graphSel.value;
  const opt = GRAPH_OPTIONS[key];
  if (!opt) return;
  const isBody = !!opt.body;
  const subjs = isBody ? ['sp'] : SUBJECTS.filter(s => state.store.activeSubjects.has(s));
  const cmpAvailable = CMP_KEYS.has(key);

  let vMin = Infinity, vMax = -Infinity;
  const gatherRange = (arr) => {
    for (const v of arr) {
      if (isFinite(v) && v < vMin) vMin = v;
      if (isFinite(v) && v > vMax) vMax = v;
    }
  };

  if (isBody) {
    gatherRange(state.store.fullData[key] || []);
  } else {
    subjs.forEach(s => gatherRange(state.store.fullData[`${s}_${key}`] || []));
    if (cmpAvailable) {
      for (const ck of state.store.compareActive) {
        const cd = state.store.compareData[ck];
        if (cd && cd[key]) gatherRange(Array.from(cd[key]));
      }
    }
  }

  if (!isFinite(vMin)) { vMin = 0; vMax = 1; }
  if (Math.abs(vMax - vMin) < 1e-9) { vMin -= 0.5; vMax += 0.5; }
  else { const pad = (vMax - vMin) * 0.08; vMin -= pad; vMax += pad; }

  const GW = SVG_W, GH = SVG_H;
  const scT = tv => GRAPH_PADDING.l + (tv / state.store.simDuration) * (GW - GRAPH_PADDING.l - GRAPH_PADDING.r);
  const scV = v => GRAPH_PADDING.t + (GH - GRAPH_PADDING.t - GRAPH_PADDING.b) * (1 - (v - vMin) / (vMax - vMin));

  const ln = (x1, y1, x2, y2, c, w, da = '') => {
    const el = svgEl('line', { x1: fmtTech(x1), y1: fmtTech(y1), x2: fmtTech(x2), y2: fmtTech(y2), stroke: c, 'stroke-width': w });
    if (da) el.setAttribute('stroke-dasharray', da);
    return el;
  };
  const isDark = document.body.classList.contains('dark');
  const gridC = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
  const axC = isDark ? '#a0abc7' : '#666';

  graphAxesG.appendChild(ln(GRAPH_PADDING.l, GH - GRAPH_PADDING.b, GW - GRAPH_PADDING.r, GH - GRAPH_PADDING.b, axC, 1));
  graphAxesG.appendChild(ln(GRAPH_PADDING.l, GRAPH_PADDING.t, GRAPH_PADDING.l, GH - GRAPH_PADDING.b, axC, 1));

  const yLab = svgEl('text', {
    x: fmtTech(GRAPH_PADDING.l - GRAPH_Y_LABEL_OFFSET), y: fmtTech((GRAPH_PADDING.t + (GH - GRAPH_PADDING.b)) / 2),
    'text-anchor': 'middle', 'font-family': 'JetBrains Mono', 'font-size': '9.5px', fill: axC,
    transform: `rotate(-90,${fmtTech(GRAPH_PADDING.l - GRAPH_Y_LABEL_OFFSET)},${fmtTech((GRAPH_PADDING.t + (GH - GRAPH_PADDING.b)) / 2)})`
  });
  const yAxisSymbol = opt.unit === 'rad/s' ? 'ω' : (opt.unit === 'rad/s²' ? 'α_w' : key.charAt(0));
  yLab.textContent = `${yAxisSymbol} / ${opt.unit}`;
  graphAxesG.appendChild(yLab);

  const xLab = svgEl('text', {
    x: fmtTech((GRAPH_PADDING.l + GW - GRAPH_PADDING.r) / 2), y: fmtTech(GH - 3),
    'text-anchor': 'middle', 'font-family': 'JetBrains Mono', 'font-size': '9px', fill: axC
  });
  xLab.textContent = 't / s';
  graphAxesG.appendChild(xLab);

  const step = getNiceStep(vMax - vMin, 6);
  const vStart = Math.ceil(vMin / step) * step;
  let ticks = 0;
  for (let v = vStart; v <= vMax + 1e-9 && ticks < 60; v += step, ticks++) {
    const y = scV(v);
    if (y > GH - GRAPH_PADDING.b + 1 || y < GRAPH_PADDING.t - 1) continue;
    graphBgG.appendChild(ln(GRAPH_PADDING.l, y, GW - GRAPH_PADDING.r, y, gridC, 1));
    const txt = svgEl('text', {
      x: fmtTech(GRAPH_PADDING.l - 5), y: fmtTech(y + 3.5), fill: axC, 'text-anchor': 'end',
      'font-family': 'JetBrains Mono', 'font-size': '9px'
    });
    txt.textContent = fmt(v, Math.abs(v) < 10 ? 2 : 1);
    graphAxesG.appendChild(txt);
    graphAxesG.appendChild(ln(GRAPH_PADDING.l - 3, y, GRAPH_PADDING.l, y, axC, 1));
  }

  const xStep = getNiceStep(state.store.simDuration, 8);
  for (let tv = 0; tv <= state.store.simDuration + 1e-9; tv += xStep) {
    const x = scT(tv);
    graphAxesG.appendChild(ln(x, GH - GRAPH_PADDING.b, x, GH - GRAPH_PADDING.b + 4, axC, 1));
    const txt = svgEl('text', {
      x: fmtTech(x), y: fmtTech(GH - GRAPH_PADDING.b + 13), fill: axC, 'text-anchor': 'middle',
      'font-family': 'JetBrains Mono', 'font-size': '9px'
    });
    txt.textContent = fmt(tv, 1);
    graphAxesG.appendChild(txt);
    if (tv > 0) graphBgG.appendChild(ln(x, GRAPH_PADDING.t, x, GH - GRAPH_PADDING.b, gridC, 1));
  }

  const drawLine = (s, arr, lineId) => {
    const pts = [];
    let curIdx = 0;
    for (let i = 0; i < state.store.fullData.t.length; i++) {
      if (state.store.fullData.t[i] > t + 1e-6) break;
      const y = scV(arr[i]);
      if (y > -50 && y < GH + 50) pts.push(`${fmtTech(scT(state.store.fullData.t[i]))},${fmtTech(y)}`);
      curIdx = i;
    }
    document.getElementById(lineId).setAttribute('points', pts.join(' '));
    if (pts.length > 0 && lineId.startsWith('gline_')) {
      const pt = document.getElementById(`gpt_${s}`);
      pt.setAttribute('cx', fmtTech(scT(state.store.fullData.t[curIdx])));
      pt.setAttribute('cy', fmtTech(scV(arr[curIdx])));
      pt.style.visibility = 'visible';
    }
  };

  if (isBody) {
    drawLine('sp', state.store.fullData[key] || [], 'gline_sp');
  } else {
    subjs.forEach(s => drawLine(s, state.store.fullData[`${s}_${key}`] || [], `gline_${s}`));
  }

  let ci = 0;
  if (cmpAvailable) {
    for (const ck of state.store.compareActive) {
      if (ci >= 5) break;
      const ct = ALL_TYPES.find(x => x.key === ck);
      const cd = state.store.compareData[ck];
      if (!ct || !cd || !cd[key]) {
        document.getElementById(`gcmp_${ci}`).setAttribute('points', '');
        ci++;
        continue;
      }
      const pts = [];
      for (let i = 0; i < state.store.fullData.t.length; i++) {
        if (state.store.fullData.t[i] > t + 1e-6) break;
        const yv = scV(cd[key][i]);
        if (yv > -50 && yv < GH + 50) pts.push(`${fmtTech(scT(state.store.fullData.t[i]))},${fmtTech(yv)}`);
      }
      const cmpLine = document.getElementById(`gcmp_${ci}`);
      cmpLine.setAttribute('points', pts.join(' '));
      cmpLine.setAttribute('stroke', ct.color);
      ci++;
    }
  }
  for (; ci < 5; ci++) document.getElementById(`gcmp_${ci}`).setAttribute('points', '');

  const cursorColor = isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)';
  const cx2 = scT(Math.min(t, state.store.simDuration));
  graphCursor.setAttribute('x1', fmtTech(cx2));
  graphCursor.setAttribute('x2', fmtTech(cx2));
  graphCursor.setAttribute('y1', fmtTech(GRAPH_PADDING.t));
  graphCursor.setAttribute('y2', fmtTech(GH - GRAPH_PADDING.b));
  graphCursor.setAttribute('stroke', cursorColor);

  graphLegend.innerHTML = '';
  const addLeg = (color, label, dashed = false) => {
    graphLegend.innerHTML += `<div class="graph-leg-item">
      <div class="graph-leg-dot" style="background:${color};${dashed ? 'border:1px solid ' + color + ';background:transparent' : ''}"></div>
      ${label}</div>`;
  };
  if (isBody) { addLeg('var(--c-sp)', 'Körper (SP)'); }
  else { subjs.forEach(s => addLeg(SUBJ_COLORS[s], SUBJ_LABELS[s])); }
  if (cmpAvailable) {
    for (const ck of state.store.compareActive) {
      const ct = ALL_TYPES.find(x => x.key === ck);
      if (ct) addLeg(ct.color, ct.label, true);
    }
  }
}

export function updateScene(t) {
  const interp = makeInterp(t);
  const spX = interp(state.store.fullData.sp_x);
  const spY = interp(state.store.fullData.sp_y);
  const spSc = physToScreen(spX, spY);

  let camDX = 0;
  if (state.DOM.togFollow.checked) {
    const targetX = state.store._visX0 + (spX / X_STOP) * (state.store._visX1 - state.store._visX0);
    camDX = targetX - spSc.x;
  }
  state.DOM.worldG.setAttribute('transform', `translate(${fmtTech(camDX)},0)`);
  state.DOM.cylinderG.setAttribute('transform', `translate(${fmtTech(spSc.x)},${fmtTech(spSc.y)})`);

  const phi_now = interp(state.store.fullData.sp_x) / state.store.R_m;
  const R_px_now = state.store.R_m * state.store.ppm;
  const rotDeg = (phi_now + state.store.alpha_rad) * 180 / Math.PI;
  state.DOM.spokesG.setAttribute('transform', `rotate(${fmtTech(rotDeg, 3)})`);

  const ptsOff_map = { p1: 0, p2: Math.PI/2, p3: Math.PI, p4: -Math.PI/2 };
  ['p1', 'p2', 'p3', 'p4'].forEach(p => {
    const ang_eff = ptsOff_map[p] - phi_now - state.store.alpha_rad;
    const el = document.getElementById(`pt_${p}`);
    el.setAttribute('cx', fmtTech(R_px_now * Math.cos(ang_eff), 3));
    el.setAttribute('cy', fmtTech(R_px_now * -Math.sin(ang_eff), 3));
  });
  state.DOM.ptSp.setAttribute('cx', 0);
  state.DOM.ptSp.setAttribute('cy', 0);

  const { tracesG, worldG } = state.DOM;
  tracesG.innerHTML = '';
  
  if (state.DOM.togTracesFg.checked) {
    worldG.appendChild(tracesG);
  } else {
    worldG.insertBefore(tracesG, state.DOM.cylinderG);
  }

  const showSPTrace = state.DOM.togSpTrace.checked;
  const showPtTrace = state.DOM.togTraces.checked;
  
  if (showSPTrace || showPtTrace) {
    const idx = Math.min(state.store.fullData.t.length - 1, Math.ceil(t / DT));
    const drawTrace = (key, col) => {
      if (!state.store.activeSubjects.has(key)) return;
      const rawPts = [];
      for (let i = 0; i <= idx; i++) {
        const pt = physToScreen(state.store.fullData[`${key}_x`][i], state.store.fullData[`${key}_y`][i]);
        rawPts.push([pt.x, pt.y]);
      }
      if (rawPts.length < 2) return;
      const decimated = douglasPeucker(rawPts, TRACE_EPSILON);
      const d = decimated.map((p, i) => `${i === 0 ? 'M' : 'L'}${fmtTech(p[0])},${fmtTech(p[1])}`).join('');
      if (d) tracesG.appendChild(svgEl('path', { d, fill: 'none', stroke: col, 'stroke-width': 1.3, opacity: '.5' }));
    };
    if (showSPTrace) drawTrace('sp', 'var(--c-sp)');
    if (showPtTrace) { ['p1', 'p2', 'p3', 'p4'].forEach(p => drawTrace(p, SUBJ_COLORS[p])); }
  }

  drawCoordinateSystem();
  // Always ensure CS is at the very top of worldG
  worldG.appendChild(state.DOM.coordSystemG);

  drawCompareObjects(t);
  const spFixed = { x: spSc.x + camDX, y: spSc.y };
  updateVectorsAndForces(interp, spFixed, camDX);

  const vc = interp(state.store.fullData.sp_vabs), w = interp(state.store.fullData.omega);
  const EkT = 0.5 * MASS * vc * vc;
  const EkR = 0.5 * state.store.kFactor * MASS * state.store.R_m * state.store.R_m * w * w;
  const isInclined = state.DOM.modeInclined.checked;
  const h = isInclined
    ? Math.max(0, (X_STOP - spX) * Math.sin(state.store.alpha_rad) + state.store.R_m * Math.cos(state.store.alpha_rad))
    : 0;
  const Ep = MASS * G * h;
  const Et = EkT + EkR + Ep;

  const E0 = isInclined
    ? MASS * G * (X_STOP * Math.sin(state.store.alpha_rad) + state.store.R_m * Math.cos(state.store.alpha_rad))
    : 0.5 * MASS * state.store.v0_m_s * state.store.v0_m_s * (1 + state.store.kFactor);
  const eMax = Math.max(0.0001, E0);

  state.DOM.ebarTrans.style.width = Math.min(100, EkT / eMax * 100) + '%';
  state.DOM.ebarRot.style.width   = Math.min(100, EkR / eMax * 100) + '%';
  state.DOM.ebarPot.style.width   = Math.min(100, Ep / eMax * 100) + '%';
  state.DOM.ebarTot.style.width   = Math.min(100, Et / eMax * 100) + '%';
  state.DOM.evalTrans.textContent = fmtE(EkT);
  state.DOM.evalRot.textContent   = fmtE(EkR);
  state.DOM.evalPot.textContent   = fmtE(Ep);
  state.DOM.evalTot.textContent   = fmtE(Et);

  updateAnalysis(interp);
  updateGraph(t);
  state.DOM.timeLabel.textContent = `t = ${fmt(t, 3)} s`;
}
