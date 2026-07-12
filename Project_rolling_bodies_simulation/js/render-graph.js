/**
 * Diagramm-Rendering: Daten-Transform (Boden-/Ebenen-Koordinatensystem) und
 * updateGraph (Achsen, Gitter, Datenlinien, Cursor, Legende).
 * @module render-graph
 */

import {
  GRAPH_OPTIONS, CMP_KEYS, SUBJECTS, SUBJ_COLORS, SUBJ_LABELS, ALL_TYPES,
  GRAPH_PADDING, SVG_W, SVG_H, GRAPH_Y_LABEL_OFFSET
} from './constants.js';

import * as state from './state.js';
import { svgEl, getNiceStep, fmt, fmtTech, makeInterp } from './render-core.js';

// Transformiert eine Subjekt-/Körpergröße ins angezeigte Koordinatensystem
// (Boden- vs. Ebenen-Align). Wird von updateGraph UND dem Diagramm-CSV-Export
// genutzt — keine Logikduplikation.
export function getTransformedData(key, subject) {
  const isBodyProp = GRAPH_OPTIONS[key] && GRAPH_OPTIONS[key].body
  const dataKey = isBodyProp ? key : (subject ? `${subject}_${key}` : key)

  const isGround = state.store.coordSystemAlignment === 'ground'
  if (!isGround || !['x', 'y', 'vx', 'vy', 'ax', 'ay'].includes(key)) {
    return state.store.fullData[dataKey] || []
  }

  const srcArr = state.store.fullData[dataKey]
  if (!srcArr || srcArr.length === 0) return []

  const alpha = state.store.alpha_rad
  const ca = Math.cos(alpha), sa = Math.sin(alpha)
  const subjPrefix = isBodyProp ? 'sp' : (subject || 'sp')
  const xArr = state.store.fullData[`${subjPrefix}_x`]
  const yArr = state.store.fullData[`${subjPrefix}_y`]
  const vxArr = state.store.fullData[`${subjPrefix}_vx`]
  const vyArr = state.store.fullData[`${subjPrefix}_vy`]
  const axArr = state.store.fullData[`${subjPrefix}_ax`]
  const ayArr = state.store.fullData[`${subjPrefix}_ay`]

  const transformed = new Float32Array(srcArr.length)
  for (let i = 0; i < srcArr.length; i++) {
    const curX = xArr ? xArr[i] : 0
    const curY = yArr ? yArr[i] : state.store.R_m
    const curVX = vxArr ? vxArr[i] : 0
    const curVY = vyArr ? vyArr[i] : 0
    const curAX = axArr ? axArr[i] : 0
    const curAY = ayArr ? ayArr[i] : 0

    if (key === 'x') {
      transformed[i] = curX * ca + curY * sa
    } else if (key === 'y') {
      transformed[i] = -curX * sa + curY * ca
    } else if (key === 'vx') {
      transformed[i] = curVX * ca + curVY * sa
    } else if (key === 'vy') {
      transformed[i] = -curVX * sa + curVY * ca
    } else if (key === 'ax') {
      transformed[i] = curAX * ca + curAY * sa
    } else if (key === 'ay') {
      transformed[i] = -curAX * sa + curAY * ca
    }
  }
  return transformed
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

  // Hover-Werte (I5): Hit-Rect-Geometrie aus denselben Konstanten wie
  // scT/scV — keine Drift zwischen Klickfläche und tatsächlicher Plot-Fläche.
  state.DOM.graphHitRect.setAttribute('x', GRAPH_PADDING.l);
  state.DOM.graphHitRect.setAttribute('y', GRAPH_PADDING.t);
  state.DOM.graphHitRect.setAttribute('width', SVG_W - GRAPH_PADDING.l - GRAPH_PADDING.r);
  state.DOM.graphHitRect.setAttribute('height', SVG_H - GRAPH_PADDING.t - GRAPH_PADDING.b);

  const key = graphSel.value;
  const opt = GRAPH_OPTIONS[key];
  if (!opt) {
    state.store.graphScale = null
    hideGraphHover()
    return
  }
  const isBody = !!opt.body;
  const subjs = isBody ? ['sp'] : SUBJECTS.filter(s => state.store.activeSubjects.has(s));
  const cmpAvailable = CMP_KEYS.has(key);

  const alpha = state.store.alpha_rad;
  const ca = Math.cos(alpha), sa = Math.sin(alpha);
  const isGround = state.store.coordSystemAlignment === 'ground';

  const transformVec = (vx, vy) => {
    if (!isGround) return { vx, vy };
    return { vx: vx * ca + vy * sa, vy: vx * sa - vy * ca };
  };

  let vMin = Infinity, vMax = -Infinity;
  const gatherRange = (arr) => {
    for (const v of arr) {
      if (isFinite(v) && v < vMin) vMin = v;
      if (isFinite(v) && v > vMax) vMax = v;
    }
  };

  if (isBody) {
    gatherRange(getTransformedData(key, null));
  } else {
    subjs.forEach(s => gatherRange(getTransformedData(key, s)));
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

  // Hover-Werte (I5): einzige Quelle der Wahrheit für updateGraphHover() —
  // nie separat neu berechnen (sonst Drift zur gerade gezeichneten Skala).
  // Nur die primär aktiven Subjekte (subjs), keine Vergleichskörper (PO-Entscheidung).
  state.store.graphScale = { key, isBody, subjs, vMin, vMax };

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
    drawLine('sp', getTransformedData(key, null), 'gline_sp');
  } else {
    subjs.forEach(s => drawLine(s, getTransformedData(key, s), `gline_${s}`));
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

  // Hover-Werte (I5): bei offenem Hover jeden Frame mit der frischen Skala
  // neu berechnen (Subjekt-Auswahl/Größe können sich ändern). Die RAF-
  // Schleife selbst bleibt hover-unwissend — nur diese Rückkopplung hierher.
  if (state.store.hoverActive) updateGraphHover(state.store.hoverLocalX)
}

function hideGraphHover() {
  state.DOM.hoverLine.setAttribute('visibility', 'hidden')
  SUBJECTS.forEach(s => state.DOM.hoverPoint[s].setAttribute('visibility', 'hidden'))
  state.DOM.hoverTooltip.setAttribute('visibility', 'hidden')
}

/**
 * Hover-Cursor + Tooltip für die aktuell gehoverte lokale x-Koordinate
 * (SVG-Koordinaten des #graph_svg-viewBox). Liest state.store.graphScale
 * (von updateGraph() befüllt) statt eigene Skala zu berechnen.
 */
export function updateGraphHover(localX) {
  state.store.hoverActive = localX !== null
  state.store.hoverLocalX = localX
  const gs = state.store.graphScale
  if (localX === null || !gs || gs.subjs.length === 0) { hideGraphHover(); return }

  const { key, isBody, subjs, vMin, vMax } = gs
  const padL = GRAPH_PADDING.l, padT = GRAPH_PADDING.t
  const plotW = SVG_W - GRAPH_PADDING.l - GRAPH_PADDING.r
  const plotH = SVG_H - GRAPH_PADDING.t - GRAPH_PADDING.b
  const xClamped = Math.max(padL, Math.min(padL + plotW, localX))
  const rawT = (xClamped - padL) / plotW * state.store.simDuration
  // Cursor nur auf dem bereits gezeichneten Kurvenabschnitt (KNOWN_LIMITATIONS → I5).
  const t = Math.max(0, Math.min(rawT, state.store.simDuration, state.store.simTime))

  const scT = tv => padL + (tv / state.store.simDuration) * plotW
  const scV = v => padT + plotH * (1 - (v - vMin) / ((vMax - vMin) || 1))
  const xPix = scT(t)
  const interp = makeInterp(t)

  state.DOM.hoverLine.setAttribute('x1', xPix); state.DOM.hoverLine.setAttribute('x2', xPix)
  state.DOM.hoverLine.setAttribute('y1', padT); state.DOM.hoverLine.setAttribute('y2', padT + plotH)
  state.DOM.hoverLine.setAttribute('visibility', 'visible')

  const shown = isBody ? ['sp'] : subjs
  const values = {}
  SUBJECTS.forEach(s => {
    if (!shown.includes(s)) { state.DOM.hoverPoint[s].setAttribute('visibility', 'hidden'); return }
    const v = interp(getTransformedData(key, isBody ? null : s))
    values[s] = v
    state.DOM.hoverPoint[s].setAttribute('cx', xPix)
    state.DOM.hoverPoint[s].setAttribute('cy', scV(v))
    state.DOM.hoverPoint[s].setAttribute('visibility', 'visible')
  })

  renderHoverTooltip(isBody, shown, values, key, t, xPix, padL, plotW, padT)
}

function renderHoverTooltip(isBody, shown, values, key, t, xPix, padL, plotW, padT) {
  const opt = GRAPH_OPTIONS[key]
  const textEl = state.DOM.hoverTooltipText
  textEl.innerHTML = ''
  const lineH = 15
  const rows = [{ text: `t = ${fmt(t, 2)} s`, color: null, italic: true }]
  const labelFor = s => isBody ? 'Körper (SP)' : SUBJ_LABELS[s]
  shown.forEach(s => rows.push({
    label: labelFor(s), text: `${fmt(values[s], 2)} ${opt.unit}`, color: SUBJ_COLORS[s],
  }))
  rows.forEach((row, i) => {
    const tspan = svgEl('tspan', { x: 8, y: 16 + i * lineH })
    if (row.color) tspan.style.fill = row.color
    if (row.italic) {
      const sym = svgEl('tspan', { 'font-style': 'italic' })
      sym.textContent = 't'
      tspan.appendChild(sym)
      tspan.appendChild(document.createTextNode(row.text.slice(1)))
    } else {
      tspan.textContent = `${row.label}: ${row.text}`
    }
    textEl.appendChild(tspan)
  })

  const bbox = textEl.getBBox()
  const boxW = bbox.width + 16, boxH = bbox.height + 12
  state.DOM.hoverTooltipBg.setAttribute('width', boxW)
  state.DOM.hoverTooltipBg.setAttribute('height', boxH)
  state.DOM.hoverTooltipBg.setAttribute('x', 0)
  state.DOM.hoverTooltipBg.setAttribute('y', 0)

  let tx = xPix + 12
  tx = Math.max(padL, Math.min(padL + plotW - boxW, tx))
  state.DOM.hoverTooltip.setAttribute('transform', `translate(${tx}, ${padT + 6})`)
  state.DOM.hoverTooltip.setAttribute('visibility', 'visible')
}