/**
 * Vektor-Rendering: Geschwindigkeits-, Beschleunigungs- und Kraftvektoren
 * (Fg/Fn/Fr) inkl. Vektor-Legende. T8-Label-Notation (F⃗ + Index, Serif-Italic,
 * stroke:none — kein Faux-Bold, s. CLAUDE.md).
 * @module render-vectors
 */

import {
  VEC_REF_PX, VEC_V_REF_PX, VEC_A_REF, VEC_A_MAX_PX, VEC_MIN_LEN, VEC_MAX_V_PX,
  MASS, G
} from './constants.js';

import * as state from './state.js';
import { svgEl, physToScreen, localVecToScreen, fmtTech, shortenEnd } from './render-core.js';

function drawArrow(parent, x1, y1, vx, vy, color, markerId, minLen = VEC_MIN_LEN) {
  const len = Math.hypot(vx, vy);
  if (len < minLen) return;
  // Schaft um Marker-Länge (markerWidth 7 · strokeWidth 2,2) kürzen → Spitze
  // (refX=0-Marker) landet exakt auf (x1+vx, y1+vy).
  const end = shortenEnd(x1, y1, x1 + vx, y1 + vy, 7 * 2.2);
  if (!end) return; // B23: Vektor kürzer als Pfeilspitze (len < 7·2,2)
  const el = svgEl('line', {
    x1: fmtTech(x1), y1: fmtTech(y1),
    x2: fmtTech(end.x2), y2: fmtTech(end.y2),
    stroke: color, 'stroke-width': 2.2,
    'marker-end': `url(#${markerId})`
  });
  parent.appendChild(el);
  return el;
}

// Vektor-Label: Symbol kursiv via Serif-tspan mit Vektor-Pfeil (Combining-Arrow
// U+20D7), optional tiefgestellter Index. Referenz: 3-Massen-Sim (T8). Fill =
// Vektorfarbe (inline); Klasse .force-label setzt Serif + stroke:none (kein
// Faux-Bold, s. CLAUDE.md-Regel). Werte werden bewußt nicht gezeigt (PO-Vorgabe).
function vecLabel(x, y, sym, color, sub = null, anchor = 'start') {
  const t = svgEl('text', {
    x: fmtTech(x), y: fmtTech(y), class: 'force-label', fill: color,
    'text-anchor': anchor, 'dominant-baseline': 'middle',
  });
  const s = svgEl('tspan', { 'font-style': 'italic' }); s.textContent = `${sym}⃗`;   // Symbol + U+20D7
  t.appendChild(s);
  if (sub) {
    const sb = svgEl('tspan', { dy: '0.25em', 'font-size': '0.7em' }); sb.textContent = sub;
    t.appendChild(sb);
  }
  return t;
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
    forcesG.appendChild(vecLabel(sx + 8, sy + px * 0.5, 'F', 'var(--c-fg)', 'G'));
  }

  if (showFn) {
    const FN = MASS * G * (isInclined ? ca : 1.0);
    const px = linearFPx(FN);
    drawArrow(forcesG, sx, sy, sa * px, -ca * px, 'var(--c-fn)', 'arr-fn', 0);
    forcesG.appendChild(vecLabel(sx + sa * px * 0.55 + 8, sy - ca * px * 0.55, 'F', 'var(--c-fn)', 'N'));
  }

  if (showFr) {
    const FR = isInclined ? MASS * G * sa * state.store.kFactor / (1 + state.store.kFactor) : 0;
    if (FR > 1e-9) {
      const px = linearFPx(FR);
      drawArrow(forcesG, contactPt.x, contactPt.y, -ca * px, -sa * px, 'var(--c-fr)', 'arr-fr', 0);
      forcesG.appendChild(vecLabel(contactPt.x - ca * px * 1.18, contactPt.y - sa * px * 1.18, 'F', 'var(--c-fr)', 'R', 'middle'));
    } else {
      forcesG.appendChild(svgEl('circle', {
        cx: fmtTech(contactPt.x), cy: fmtTech(contactPt.y), r: 4,
        fill: 'none', stroke: 'var(--c-fr)', 'stroke-width': '1.5', 'stroke-dasharray': '2,2'
      }));
      const lbl = vecLabel(contactPt.x + 14, contactPt.y - 6, 'F', 'var(--c-fr)', 'R');
      lbl.setAttribute('opacity', '.6');
      forcesG.appendChild(lbl);
    }
  }

  let ly2 = 0;
  // Legende: Vektor-Symbol mit Pfeil (vecLabel, serif-italic) — dieselbe Notation wie
  // an den Vektoren selbst. Keine Skalierungs-Klammern mehr (s. force-scale-note).
  const addLeg = (color, sym, sub, markerId) => {
    const g2 = svgEl('g', { transform: `translate(0,${ly2})` });
    // Legenden-Pfeil: Schaft um Marker-Länge (7·2) kürzen, damit die refX=0-Spitze bei x=22 endet.
    g2.appendChild(svgEl('line', {
      x1: 0, y1: 8, x2: shortenEnd(0, 8, 22, 8, 7 * 2).x2, y2: 8,
      stroke: color, 'stroke-width': 2, 'marker-end': `url(#${markerId})`
    }));
    g2.appendChild(vecLabel(28, 8, sym, color, sub));
    vecLegendG.appendChild(g2);
    ly2 += 18;
  };
  if (showV)  addLeg('var(--c-vel)', 'v', null, 'arr-v');
  if (showA)  addLeg('var(--c-acc)', 'a', null, 'arr-a');
  if (showFg) addLeg('var(--c-fg)',  'F', 'G', 'arr-fg');
  if (showFn) addLeg('var(--c-fn)',  'F', 'N', 'arr-fn');
  if (showFr) addLeg('var(--c-fr)',  'F', 'R', 'arr-fr');
  vecLegendG.setAttribute('visibility', ly2 > 0 ? 'visible' : 'hidden');
}