/**
 * Szenen-Rendering: Viewport-Setup, Hintergrund/Rampe, Hindernis,
 * Koordinatensystem, Zylinder-Stil, Stoppuhr.
 * @module render-scene
 */

import {
  SVG_W, SVG_H, SVG_MIN_PPM, SVG_MAX_PPM, VERT_SPAN_BUFFER,
  RAMP_TICK_INTERVAL, RAMP_TICK_MAIN, RAMP_GRID_INTERVAL,
  RAMP_START_MARKER_OFFSET,
  X_STOP, DRAW_X,
  SW_RADIUS, SW_HAND_LEN, SW_SUB_R, SW_SUB_CY
} from './constants.js';

import * as state from './state.js';
import { svgEl, physToScreen, fmt, fmtTech, shortenEnd } from './render-core.js';

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

  const drawAxis = (ang, label, col, mid) => {
    const x2 = len * Math.cos(ang), y2 = len * Math.sin(ang);
    // Schaft um Marker-Länge (markerWidth 6 · strokeWidth 2) kürzen → Spitze auf (x2,y2).
    const end = shortenEnd(0, 0, x2, y2, 6 * 2);
    g.appendChild(svgEl('line', {
      x1: 0, y1: 0, x2: fmtTech(end.x2), y2: fmtTech(end.y2),
      stroke: col, 'stroke-width': 2, 'marker-end': `url(#${mid})`
    }));
    const lx = (len + 14) * Math.cos(ang), ly = (len + 14) * Math.sin(ang);
    const txt = svgEl('text', {
      x: fmtTech(lx), y: fmtTech(ly), 'text-anchor': 'middle', 'dominant-baseline': 'middle',
      'font-family': 'JetBrains Mono', 'font-size': '12px', 'font-weight': '800', fill: col
    });
    txt.textContent = label;
    g.appendChild(txt);
  };

  const markerId = isDark ? 'arr-cs-dark' : 'arr-cs-light';
  if (!document.getElementById(markerId)) {
    const defs = state.DOM.mainSvg.querySelector('defs');
    const m = svgEl('marker', { id: markerId, markerWidth: 6, markerHeight: 6, refX: 0, refY: 3, orient: 'auto' });
    m.appendChild(svgEl('polygon', { points: '0 0, 6 3, 0 6', fill: color }));
    defs.appendChild(m);
  }

  if (isPlane) {
    // x follows the ramp (downwards), y is perpendicular to the ramp (upwards)
    drawAxis(alpha, 'x', color, markerId);
    drawAxis(alpha - Math.PI/2, 'y', color, markerId);
  } else {
    // Standard ground system
    drawAxis(0, 'x', color, markerId);
    drawAxis(-Math.PI/2, 'y', color, markerId);
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
  cylBody.setAttribute('fill-opacity', '0.7');
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

// ── Stopwatch (kanonisches Design, Ref: Atwood v2.2.x / CLAUDE.md) ──────────
// Hauptzifferblatt r=60, 60 Marken; Hauptzeiger 1 U/60s.
// Hilfszifferblatt (cy=25, r=13), 10 Marken; Hilfszeiger 1 U/s.
export function drawStopwatchMarks() {
  const { swMarks, swSubMarks } = state.DOM;
  swMarks.innerHTML = '';
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const isMaj = i % 5 === 0;
    const rIn   = isMaj ? SW_RADIUS - 8 : SW_RADIUS - 3;
    swMarks.appendChild(svgEl('line', {
      x1: rIn * Math.cos(angle), y1: rIn * Math.sin(angle),
      x2: SW_RADIUS * Math.cos(angle), y2: SW_RADIUS * Math.sin(angle),
      'stroke-width': isMaj ? 2 : 1, class: 'sw-mark',
    }));
  }
  swSubMarks.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * 2 * Math.PI - Math.PI / 2;
    const rIn = SW_SUB_R - 3;
    swSubMarks.appendChild(svgEl('line', {
      x1: rIn * Math.cos(angle), y1: SW_SUB_CY + rIn * Math.sin(angle),
      x2: SW_SUB_R * Math.cos(angle), y2: SW_SUB_CY + SW_SUB_R * Math.sin(angle),
      'stroke-width': 1, class: 'sw-mark',
    }));
  }
}

export function updateStopwatch(t) {
  const { swMainHand, swSubHand } = state.DOM;
  if (!swMainHand) return;
  // Hauptzeiger: 1 Umdrehung / 60 s
  const ma = (t % 60) / 60 * 2 * Math.PI - Math.PI / 2;
  swMainHand.setAttribute('x2', String(SW_HAND_LEN * Math.cos(ma)));
  swMainHand.setAttribute('y2', String(SW_HAND_LEN * Math.sin(ma)));
  // Hilfszeiger: 1 Umdrehung / s (Zehntelsekunden), Reset auf 12 Uhr
  const sa = (t % 1) * 2 * Math.PI - Math.PI / 2;
  swSubHand.setAttribute('x2', String(SW_SUB_R * Math.cos(sa)));
  swSubHand.setAttribute('y2', String(SW_SUB_CY + SW_SUB_R * Math.sin(sa)));
}