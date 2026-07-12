/**
 * Render-Aggregator (Rollende Körper).
 *
 * Diese Datei ist der öffentliche Eingangspunkt des Render-Subsystems
 * (`import * as render from './render.js'` in ui.js/main.js). Sie re-exportiert
 * die thematischen Submodule und enthält selbst nur noch den Szenen-Orchestrator
 * `updateScene` (der Vektoren, Vergleichskörper, Analyse, Diagramm, Stoppuhr und
 * Spuren pro Frame koordiniert) sowie den privaten Douglas-Peucker-Simplifyer
 * für die Punktespuren.
 *
 * Submodule:
 *   render-core.js     — gemeinsame Helfer (fmt, svgEl, physToScreen, …)
 *   render-scene.js    — Viewport, Hintergrund, Koordinatensystem, Zylinder, Stoppuhr
 *   render-vectors.js  — v/a/F-Vektoren + Vektor-Legende
 *   render-analysis.js — Live-Analyse, Renn-Bars, Vergleichsliste, Vergleichskörper
 *   render-graph.js    — Diagramm (Transform + updateGraph)
 *
 * Verhalten unverändert zur Monolith-Version (nur Aufteilung).
 * @module render
 */

import {
  X_STOP, DT, MASS, G, TRACE_EPSILON, SUBJ_COLORS
} from './constants.js';

import * as state from './state.js';
import { makeInterp, physToScreen, fmt, fmtE, fmtTech, svgEl } from './render-core.js';

// Für updateScene benötigte Funktionen der Submodule (lokal importiert):
import { drawCoordinateSystem, updateStopwatch } from './render-scene.js';
import { updateVectorsAndForces } from './render-vectors.js';
import { drawCompareObjects, updateAnalysis } from './render-analysis.js';
import { updateGraph } from './render-graph.js';

// ── Öffentliche API: alle Exporte der Submodule + Core unverändert weiterreichen ──
export {
  fmt, fmtTech, fmtE, svgEl, physToScreen, localVecToScreen, getNiceStep, makeInterp
} from './render-core.js';
export {
  setupViewport, drawBackground, drawObstacle, drawCoordinateSystem,
  updateCylinderStyle, drawStopwatchMarks, updateStopwatch
} from './render-scene.js';
export { updateVectorsAndForces } from './render-vectors.js';
export {
  rebuildAnalysis, updateAnalysis, buildRaceBars, buildCompareList, drawCompareObjects
} from './render-analysis.js';
export { getTransformedData, updateGraph, updateGraphHover } from './render-graph.js';

// ── Privater Spur-Simplifyer (nur für updateScene) ───────────────────────────
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

// ── Szenen-Orchestrator (pro Frame) ──────────────────────────────────────────
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

  drawCoordinateSystem();
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
  updateStopwatch(t);

  // ── TRACES (drawn last to be on top of everything) ────────────────
  const { tracesG, worldG } = state.DOM;
  tracesG.innerHTML = '';
  worldG.appendChild(tracesG);

  const showSPTrace = state.DOM.togSpTrace.checked;
  const showPtTrace = state.DOM.togTraces.checked;

  if (showSPTrace || showPtTrace) {
    const idx = Math.min(state.store.fullData.t.length - 1, Math.ceil(t / DT));
    const drawTrace = (key, col) => {
      if (!state.store.activeSubjects.has(key)) return;
      const rawPts = [];
      const dataX = state.store.fullData[`${key}_x`];
      const dataY = state.store.fullData[`${key}_y`];
      if (!dataX || !dataY || dataX.length === 0) return;

      // SP: VOLLSTÄNDIGER PFAD | Punkte: Bis zum Zeitpunkt t
      const endI = (key === 'sp') ? (dataX.length - 1) : Math.max(1, idx);
      for (let i = 0; i <= endI && i < dataX.length; i++) {
        const pt = physToScreen(dataX[i], dataY[i]);
        if (isFinite(pt.x) && isFinite(pt.y)) rawPts.push([pt.x, pt.y]);
      }
      if (rawPts.length < 2) return;

      const decimated = (key === 'sp') ? rawPts : douglasPeucker(rawPts, TRACE_EPSILON);
      const d = decimated.map((p, i) => `${i === 0 ? 'M' : 'L'}${fmtTech(p[0])},${fmtTech(p[1])}`).join('');
      if (d) {
        const strokeCol = (key === 'sp') ? '#ff00ff' : col;
        const path = svgEl('path', {
          d, fill: 'none', stroke: strokeCol,
          'stroke-width': key === 'sp' ? 6.0 : 1.8,
          opacity: '1.0', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
          'pointer-events': 'none'
        });
        tracesG.appendChild(path);
      }
    };
    if (showSPTrace) drawTrace('sp', 'var(--accent)');
    if (showPtTrace) ['p1', 'p2', 'p3', 'p4'].forEach(p => drawTrace(p, SUBJ_COLORS[p]));
  }
  worldG.appendChild(state.DOM.coordSystemG);
}