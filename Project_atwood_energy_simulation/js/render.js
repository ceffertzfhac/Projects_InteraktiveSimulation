'use strict';

import { G, PPM, PPN, CM_PER_M, Y_MAX_CM,
         MASS_BASE, MASS_FACTOR,
         PULLEY_X, PULLEY_Y, PULLEY_R,
         X_LEFT, X_RIGHT,
         Y_APERTURE_BOTTOM, Y_FLOOR_SVG,
         SW_RADIUS, SW_HAND_LEN,
         LAND_W, LAND_H, PORT_W, PORT_H_SINGLE, PORT_SLOT_DUAL, DUAL_GAP } from './constants.js';
import { store, DOM } from './state.js';
import { svgY, massHalfPx, getAccel, pulleyEffMass, getNiceTick, interpolateAt } from './physics.js';
import { fmt } from '../../shared/js/format.js';
export { fmt };

const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}
function textEl(content, x, y, anchor, cls) {
  const t = document.createElementNS(NS, 'text');
  t.setAttribute('x', String(x)); t.setAttribute('y', String(y));
  t.setAttribute('text-anchor', anchor); t.setAttribute('class', cls);
  t.textContent = content; return t;
}

// Achsenbeschriftung: Größe kursiv, Einheit aufrecht (Split bei ' / ').
function setAxisLabel(textElObj, text) {
  while (textElObj.firstChild) textElObj.removeChild(textElObj.firstChild);
  const sep = text.indexOf(' / ');
  if (sep === -1) { textElObj.textContent = text; return; }
  const qty = document.createElementNS(NS, 'tspan');
  qty.setAttribute('font-style', 'italic');
  qty.textContent = text.slice(0, sep);
  textElObj.appendChild(qty);
  const unit = document.createElementNS(NS, 'tspan');
  unit.textContent = text.slice(sep);
  textElObj.appendChild(unit);
}

// Diagrammtitel: Klartext aufrecht, abschließendes Symbol kursiv (Split am letzten Leerzeichen).
function setGraphTitle(textElObj, text) {
  while (textElObj.firstChild) textElObj.removeChild(textElObj.firstChild);
  const sep = text.lastIndexOf(' ');
  if (sep === -1) { textElObj.textContent = text; return; }
  const word = document.createElementNS(NS, 'tspan');
  word.textContent = text.slice(0, sep + 1);
  textElObj.appendChild(word);
  const sym = document.createElementNS(NS, 'tspan');
  sym.setAttribute('font-style', 'italic');
  sym.textContent = text.slice(sep + 1);
  textElObj.appendChild(sym);
}

// Fügt dem Graph-SVG den Achsenpfeil-Marker hinzu (einmalig).
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

// ── Lineal (linker Rand, cm-Skala, 0 unten) ────────────────────────────────────
export function drawRuler() {
  const g = DOM.rulerGroup;
  g.innerHTML = '';
  const rx = 8, rw = 22;
  g.appendChild(el('rect', {
    x: rx, y: Y_APERTURE_BOTTOM, width: rw, height: (Y_MAX_CM / CM_PER_M) * PPM,
    class: 'ruler-bg', rx: 2,
  }));
  for (let cm = 0; cm <= Y_MAX_CM; cm += 10) {
    const y = Y_APERTURE_BOTTOM + cm;
    const isMajor = cm % 50 === 0;
    const tickLen = isMajor ? 10 : 5;
    g.appendChild(el('line', { x1: rx + rw - tickLen, y1: y, x2: rx + rw, y2: y, class: 'ruler-tick' }));
    if (isMajor) {
      g.appendChild(textEl(`${Y_MAX_CM - cm}`, rx + rw - tickLen - 2, y + 3.5, 'end', 'ruler-text'));
    }
  }
  g.appendChild(textEl('cm', rx + rw / 2, Y_APERTURE_BOTTOM + 12, 'middle', 'ruler-text'));
}

// ── Stoppuhr-Striche ──────────────────────────────────────────────────────────
export function drawStopwatchMarks() {
  DOM.swMarks.innerHTML = '';
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const isMaj = i % 5 === 0;
    const r_in = isMaj ? SW_RADIUS - 8 : SW_RADIUS - 3;
    DOM.swMarks.appendChild(el('line', {
      x1: r_in * Math.cos(angle), y1: r_in * Math.sin(angle),
      x2: SW_RADIUS * Math.cos(angle), y2: SW_RADIUS * Math.sin(angle),
      'stroke-width': isMaj ? 2 : 1, class: 'sw-mark',
    }));
  }
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

// ── E_pot-Nulllinien in der Szene (Referenzhöhe(n), je Modus) ──────────────────
export function drawZeroLines() {
  const g = DOM.zeroLinesGroup;
  g.innerHTML = '';
  if (!store.showZeroLines) return;
  const { epZeroMode, y1_start_cm, y2_start_cm } = store;
  const Y_MAX_M = Y_MAX_CM / CM_PER_M;
  // { h: Höhe über Boden (m), right: zusätzlich rechts beschriften (Nulllinie der rechten Masse m₂) }
  const lines = [];
  if (epZeroMode === 'separate') {
    lines.push({ h: Y_MAX_M - y1_start_cm / CM_PER_M, right: false });
    lines.push({ h: Y_MAX_M - y2_start_cm / CM_PER_M, right: true });   // m₂ ⇒ auch rechts (FAE7)
  } else if (epZeroMode === 'y1') {
    lines.push({ h: Y_MAX_M - y1_start_cm / CM_PER_M, right: false });
  } else if (epZeroMode === 'y2') {
    lines.push({ h: Y_MAX_M - y2_start_cm / CM_PER_M, right: true });   // Nulllinie der rechten Masse (FAE7)
  } else if (epZeroMode === 'boden') {
    lines.push({ h: 0, right: false });
  } else if (epZeroMode === 'decke') {
    lines.push({ h: Y_MAX_M, right: false });
  }
  const x1 = X_LEFT - 38, x2 = X_RIGHT + 38;
  for (const { h: h_m, right } of lines) {
    const y = Y_FLOOR_SVG - h_m * PPM;
    g.appendChild(el('line', { x1, y1: y, x2, y2: y, class: 'zero-line' }));
    if (right) {
      // Nulllinie der rechten Masse (m₂) ⇒ nur rechts beschriften (FAE7-Korrektur).
      g.appendChild(textEl('E_pot = 0', x2 + 2, y - 3, 'start', 'zero-line-label'));
    } else {
      g.appendChild(textEl('E_pot = 0', x1 - 2, y - 3, 'end', 'zero-line-label'));
    }
  }
}

// ── Reibungspfeil am Rollenbogen ──────────────────────────────────────────────
// a>0 (m1 fällt, Rolle CCW) ⇒ Reibung SD-CW-Pfeil (Spitze rechts)
// a<0 (m2 fällt, Rolle CW)   ⇒ Reibung CCW-Pfeil  (Spitze links)
const FR_CW  = 'M 171.72 21.72 A 40 40 0 0 0 228.28 21.72';
const FR_CCW = 'M 228.28 21.72 A 40 40 0 0 1 171.72 21.72';

// ── Diagrammtyp-Konfiguration ────────────────────────────────────────────────
// Liefert { unit, title, ylabel, lines:[{key,color,label}] } je Typ + Subjekt.
function kin(key, unit, titleSing, titleBoth, sym) {
  return {
    unit,
    title: sub => sub === 'system' ? `${titleBoth} ${sym}₁, ${sym}₂`
                                  : `${titleSing} ${sym}${sub === 'm2' ? '₂' : '₁'}(t)`,
    ylabel: sub => sub === 'system' ? `${sym}₁, ${sym}₂ / ${unit}`
                                    : `${sym}${sub === 'm2' ? '₂' : '₁'} / ${unit}`,
    lines: sub => sub === 'm2' ? [{ key: `${key}2`, color: 'var(--c-m2)', label: `${sym}₂` }]
              : sub === 'system' ? [
                  { key: `${key}1`, color: 'var(--c-m1)', label: `${sym}₁` },
                  { key: `${key}2`, color: 'var(--c-m2)', label: `${sym}₂` },
                ]
              : [{ key: `${key}1`, color: 'var(--c-m1)', label: `${sym}₁` }],
  };
}

// Subjekt-Suffix für Energie-Diagrammtitel ("System" | "m₁" | "m₂").
const eSubj = sub => sub === 'm1' ? 'm₁' : sub === 'm2' ? 'm₂' : 'System';

const GRAPH_CFG = {
  ecomposite: {
    unit: 'J',
    title: sub => `Energie ${eSubj(sub)} (E_kin, E_pot, E_ges)`,
    ylabel: () => 'E / J',
    lines: sub => sub === 'm1' ? [
        { key: 'ek1',   color: 'var(--c-ekin)', label: 'E_kin' },
        { key: 'ep1',   color: 'var(--c-epot)', label: 'E_pot' },
        { key: 'eges1', color: 'var(--c-etot)', label: 'E_ges' },
      ] : sub === 'm2' ? [
        { key: 'ek2',   color: 'var(--c-ekin)', label: 'E_kin' },
        { key: 'ep2',   color: 'var(--c-epot)', label: 'E_pot' },
        { key: 'eges2', color: 'var(--c-etot)', label: 'E_ges' },
      ] : [
        { key: 'ek_sum', color: 'var(--c-ekin)', label: 'E_kin' },
        { key: 'ep_sum', color: 'var(--c-epot)', label: 'E_pot' },
        { key: 'etot',   color: 'var(--c-etot)', label: 'E_ges' },
      ],
  },
  ekin: {
    unit: 'J', title: sub => `Kinetische Energie ${eSubj(sub)} E_kin(t)`, ylabel: () => 'E_kin / J',
    lines: sub => [{ key: sub === 'm1' ? 'ek1' : sub === 'm2' ? 'ek2' : 'ek_sum', color: 'var(--c-ekin)', label: 'E_kin' }],
  },
  epot: {
    unit: 'J', title: sub => `Potentielle Energie ${eSubj(sub)} E_pot(t)`, ylabel: () => 'E_pot / J',
    lines: sub => [{ key: sub === 'm1' ? 'ep1' : sub === 'm2' ? 'ep2' : 'ep_sum', color: 'var(--c-epot)', label: 'E_pot' }],
  },
  eges: {
    unit: 'J', title: sub => `Gesamtenergie ${eSubj(sub)} E_ges(t)`, ylabel: () => 'E_ges / J',
    lines: sub => [{ key: sub === 'm1' ? 'eges1' : sub === 'm2' ? 'eges2' : 'etot', color: 'var(--c-etot)', label: 'E_ges' }],
  },
  wr: {
    unit: 'J', title: () => 'Energieverlust E_V(t)', ylabel: () => 'E_V / J',
    lines: () => [{ key: 'wr', color: 'var(--c-eloss)', label: 'E_V' }],
  },
  erot: {
    unit: 'J', title: () => 'Rotationsenergie E_rot(t)', ylabel: () => 'E_rot / J',
    lines: () => [{ key: 'ek_rot', color: 'var(--c-ekin)', label: 'E_rot' }],
  },
  y:     kin('y', 'cm',   'Position',         'Positionen',         'y'),
  v:     kin('v', 'm/s',  'Geschwindigkeit',  'Geschwindigkeiten',   'v'),
  a:     kin('a', 'm/s²', 'Beschleunigung',   'Beschleunigungen',    'a'),
  ydiff: {
    unit: 'cm', title: () => 'Abstand der Massen Δy(t)', ylabel: () => 'Δy / cm',
    lines: () => [{ key: 'ydiff', color: 'var(--c-m1)', label: 'Δy' }],
  },
};

export function getLineConfig(type, subject) {
  const cfg = GRAPH_CFG[type] || GRAPH_CFG.ecomposite;
  return {
    unit:   cfg.unit,
    title:  cfg.title(subject),
    ylabel: cfg.ylabel(subject),
    lines:  cfg.lines(subject),
  };
}

// Größter Nice-Step (1-2-5-Folge), der noch ≥ minDivs Teilstriche liefert.
function tAxisStep(range, minDivs = 3) {
  let step = getNiceTick(range, 6);
  if (Math.floor(range / step) < minDivs) {
    const ms = range / minDivs;
    const m  = Math.pow(10, Math.floor(Math.log10(ms)));
    step = [5, 2, 1].map(f => f * m).find(s => s <= ms + 1e-9) ?? m;
  }
  return step;
}

// ── I9-Geometrie: Zweier-Diagramme orthogonal zur Sim/Diagramm-Aufteilung ──────
// Landscape (Übereinander-Layout) + 2 → Diagramme nebeneinander;
// Portrait  (Nebeneinander-Layout) + 2 → Diagramme übereinander gestapelt.
function graphGeom() {
  const dual = store.diagramMode === '2';
  const landscape = !store.layoutSplit;
  if (!dual) {
    const w = landscape ? LAND_W : PORT_W;
    const h = landscape ? LAND_H : PORT_H_SINGLE;
    return { w, h, cellW: w, cellH: h, dual: false, off2: { x: 0, y: 0 } };
  }
  if (landscape) {
    const eachW = LAND_W, h = LAND_H;
    return { w: eachW * 2 + DUAL_GAP, h, cellW: eachW, cellH: h, dual: true, off2: { x: eachW + DUAL_GAP, y: 0 } };
  }
  const w = PORT_W, eachH = PORT_SLOT_DUAL;
  return { w, h: eachH * 2 + DUAL_GAP, cellW: w, cellH: eachH, dual: true, off2: { x: 0, y: eachH + DUAL_GAP } };
}

// ── Graph-Update ─────────────────────────────────────────────────────────────
export function updateGraphs(time) {
  // Default-Modus: Energie-Balkendiagramm (horizontal, zentriert).
  if (store.diagramMode === 'bars') {
    DOM.graphSvg.style.display = 'none';
    DOM.energyBarsView.style.display = '';
    updateEnergyBars(time);
    return;
  }
  // Achsendiagramm-Modus (1 oder 2 Liniengraphen).
  DOM.graphSvg.style.display = '';
  DOM.energyBarsView.style.display = 'none';

  const geom = graphGeom();
  DOM.graphSvg.setAttribute('viewBox', `0 0 ${geom.w} ${geom.h}`);
  ensureAxisMarker(DOM.graphSvg);

  DOM.graphGroup1.setAttribute('transform', 'translate(0,0)');
  if (geom.dual) {
    DOM.graphGroup2.style.visibility = 'visible';
    DOM.graphGroup2.setAttribute('transform', `translate(${geom.off2.x},${geom.off2.y})`);
    drawSingleGraph(DOM.graphGroup1, geom.cellW, geom.cellH, time, store.graphType1, store.subject1);
    drawSingleGraph(DOM.graphGroup2, geom.cellW, geom.cellH, time, store.graphType2, store.subject2);
  } else {
    DOM.graphGroup2.style.visibility = 'hidden';
    drawSingleGraph(DOM.graphGroup1, geom.cellW, geom.cellH, time, store.graphType1, store.subject1);
  }
}

// ── Energie-Balkendiagramm (Default-Diagramm-Anzeige) ─────────────────────────
// 13 Reihen (m₁: E_k/E_p/E_ges · m₂: E_k/E_p/E_ges · System: E_k/E_p/E_ges/E_V),
// zentrierte horizontale Balken (positiv nach rechts, negativ nach links),
// skaliert auf store.energyBarMax (halbe ViewBox-Breite = voller längster Balken).
// Statische MathJax-Labels in index.html — hier nur rect-Breite/Position + Wert.
const BAR_CENTER = 50, BAR_HALF = 50; // ViewBox 0..100, Center 50
let _barRows = null;
function cacheBarRows() {
  _barRows = [...DOM.energyBarsView.querySelectorAll('.ebar-row')].map(row => ({
    rect: row.querySelector('.ebar-fill'),
    val:  row.querySelector('.ebar-value'),
    key:  row.dataset.key,
    neg:  row.dataset.neg === '1',
  }));
}

export function updateEnergyBars(time) {
  if (!_barRows) cacheBarRows();
  if (!store.t_data.length) return;
  const max = store.energyBarMax || 1;
  for (const r of _barRows) {
    const arr = store[`${r.key}_data`];
    if (!arr) continue;
    const raw = interpolateAt(arr, time);
    const val = r.neg ? -raw : raw;
    const w = (Math.abs(val) / max) * BAR_HALF;
    r.rect.setAttribute('x', String(val >= 0 ? BAR_CENTER : BAR_CENTER - w));
    r.rect.setAttribute('width', String(Math.max(0, w)));
    r.val.textContent = `${fmt(val, 2)} J`;
  }
}

function drawSingleGraph(group, cellW, cellH, time, type, subject) {
  if (!store.t_data.length) return;
  const cfg = getLineConfig(type, subject);
  const SVG_W = cellW, SVG_H = cellH;
  const P = { top: 30, right: 25, bottom: 40, left: 58 };
  const PLOT_W = SVG_W - P.left - P.right;
  const PLOT_H = SVG_H - P.top - P.bottom;
  if (PLOT_W < 20 || PLOT_H < 20) return;

  const { t_data } = store;
  const t_max = store.t_end;

  // Gemeinsamer Wertebereich über alle Linien
  let rawMin = Infinity, rawMax = -Infinity;
  for (const ln of cfg.lines) {
    const lim = store.axisLimits[ln.key];
    if (!lim) return;
    rawMin = Math.min(rawMin, lim.min);
    rawMax = Math.max(rawMax, lim.max);
  }
  const range  = Math.max(Math.abs(rawMax - rawMin), 0.001);
  const step   = getNiceTick(range);
  const nMin   = Math.floor(rawMin / step - 0.5) * step;
  const nMax   = Math.ceil(rawMax  / step + 0.5) * step;
  const nRange = nMax - nMin;

  const scaleT = tt => t_max > 0 ? P.left + (Math.min(tt, t_max) / t_max) * PLOT_W : P.left;
  const scaleY = v => SVG_H - P.bottom - ((v - nMin) / nRange) * PLOT_H;

  const gridEl = group.querySelector('.graph_grid');
  gridEl.innerHTML = '';

  // Hintergrund-Rect (10 px über y-Pfeil, rechts vom x-Pfeil)
  gridEl.appendChild(el('rect', { x: P.left, y: P.top - 10, width: PLOT_W + 10, height: PLOT_H + 10, class: 'graph-bg' }));

  // Y-Ticks + Gitter
  let yv = nMin;
  while (yv <= nMax + step * 0.01) {
    const py = scaleY(yv);
    if (py >= P.top - 1 && py <= SVG_H - P.bottom + 1) {
      gridEl.appendChild(el('line', { x1: P.left, y1: py, x2: P.left + PLOT_W, y2: py, class: 'grid-line' }));
      gridEl.appendChild(textEl(fmt(yv, Math.abs(yv) < 1 && step < 1 ? 2 : 1), P.left - 5, py + 3.5, 'end', 'tick-label'));
    }
    yv = Math.round((yv + step) * 1e6) / 1e6;
  }

  // X-Ticks (Zeit)
  const tStep = tAxisStep(t_max);
  let tv = 0;
  while (tv <= t_max + tStep * 0.01) {
    const px = scaleT(Math.min(tv, t_max));
    gridEl.appendChild(el('line', { x1: px, y1: P.top, x2: px, y2: SVG_H - P.bottom, class: 'grid-line' }));
    gridEl.appendChild(textEl(fmt(tv, 1), px, SVG_H - P.bottom + 13, 'middle', 'tick-label'));
    tv = Math.round((tv + tStep) * 1e6) / 1e6;
  }

  // Achsen
  gridEl.appendChild(el('line', { x1: P.left, y1: SVG_H - P.bottom, x2: P.left, y2: P.top, class: 'axis-line', 'stroke-width': 1.5, 'marker-end': 'url(#arr-axis-g)' }));
  gridEl.appendChild(el('line', { x1: P.left, y1: SVG_H - P.bottom, x2: P.left + PLOT_W, y2: SVG_H - P.bottom, class: 'axis-line', 'stroke-width': 1.5, 'marker-end': 'url(#arr-axis-g)' }));

  // Achsenbeschriftung
  const yAxisLabel = el('text', { x: 0, y: 0, class: 'axis-label', transform: `translate(${P.left - 40}, ${P.top + PLOT_H / 2}) rotate(-90)`, 'text-anchor': 'middle' });
  setAxisLabel(yAxisLabel, cfg.ylabel);
  gridEl.appendChild(yAxisLabel);
  const xAxisLabel = el('text', { x: P.left + PLOT_W / 2, y: SVG_H - 5, class: 'axis-label', 'text-anchor': 'middle' });
  setAxisLabel(xAxisLabel, 't / s');
  gridEl.appendChild(xAxisLabel);

  // Daten bis zur aktuellen Zeit
  const plotIdx = (() => { let i = t_data.findIndex(tt => tt > time); return i === -1 ? t_data.length : i; })();
  const buildPoints = (data) => {
    const pts = [];
    for (let i = 0; i < plotIdx; i++) pts.push(`${scaleT(t_data[i])},${scaleY(data[i])}`);
    if (plotIdx > 0 && time > 0) {
      const cv = interpolateAt(data, time);
      pts.push(`${scaleT(Math.min(time, t_max))},${scaleY(cv)}`);
    }
    return pts.join(' ');
  };

  const lineEls = [group.querySelector('.graph_line_a'), group.querySelector('.graph_line_b'), group.querySelector('.graph_line_c')];
  const ptEls   = [group.querySelector('.graph_point_a'), group.querySelector('.graph_point_b'), group.querySelector('.graph_point_c')];
  cfg.lines.forEach((ln, idx) => {
    const lim = store.axisLimits[ln.key];
    lineEls[idx].setAttribute('points', buildPoints(lim.full_data));
    lineEls[idx].style.stroke = ln.color;
    lineEls[idx].style.display = 'block';
    if (plotIdx > 0 && time > 0) {
      const cv = interpolateAt(lim.full_data, time);
      ptEls[idx].setAttribute('cx', String(scaleT(Math.min(time, t_max))));
      ptEls[idx].setAttribute('cy', String(scaleY(cv)));
      ptEls[idx].style.fill = ln.color;
      ptEls[idx].setAttribute('visibility', 'visible');
    } else {
      ptEls[idx].setAttribute('visibility', 'hidden');
    }
  });
  for (let idx = cfg.lines.length; idx < 3; idx++) {
    lineEls[idx].style.display = 'none';
    ptEls[idx].setAttribute('visibility', 'hidden');
  }

  // Titel (letztes SVG-Kind, klar über weißem Hintergrund)
  const titleEl = group.querySelector('.graph_title');
  titleEl.setAttribute('x', String(SVG_W / 2));
  titleEl.setAttribute('y', '12');
  setGraphTitle(titleEl, cfg.title);
}

// ── Szenen-Update ─────────────────────────────────────────────────────────────
export function updateScene(t, y1_m, y2_m) {
  const { m1, m2, showForces, showNetForce, showFrictionArrow, frictionForce,
          pulleyShape, pulleyInnerRatio } = store;
  const FR = Math.max(0, frictionForce);
  const mEff = pulleyEffMass(store);             // I/R² der massiven Rolle
  const { a: accel, T1, T2, moving } = getAccel(m1, m2, FR, mEff);
  const drive = (m1 - m2) * G;

  const m1_w = MASS_BASE + m1 * MASS_FACTOR;
  const m2_w = MASS_BASE + m2 * MASS_FACTOR;
  const m1_hpx = m1_w / 2, m2_hpx = m2_w / 2;

  const y1_svg = svgY(y1_m);
  const y2_svg = svgY(y2_m);

  // Massen positionieren
  DOM.mass1Group.setAttribute('transform', `translate(${X_LEFT - m1_w / 2}, ${y1_svg - m1_hpx})`);
  DOM.mass1Rect.setAttribute('width', String(m1_w));
  DOM.mass1Rect.setAttribute('height', String(m1_w));
  DOM.mass1Label.setAttribute('x', '-6'); DOM.mass1Label.setAttribute('y', String(m1_hpx + 20)); // FAE4: 20 px nach unten
  DOM.mass1Label.setAttribute('text-anchor', 'end');
  setMassLabel(DOM.mass1Label, 'm₁', fmt(m1, 1), 'kg');

  DOM.mass2Group.setAttribute('transform', `translate(${X_RIGHT - m2_w / 2}, ${y2_svg - m2_hpx})`);
  DOM.mass2Rect.setAttribute('width', String(m2_w));
  DOM.mass2Rect.setAttribute('height', String(m2_w));
  DOM.mass2Label.setAttribute('x', String(m2_w + 6)); DOM.mass2Label.setAttribute('y', String(m2_hpx - 20)); // FAE4: 20 px nach oben
  DOM.mass2Label.setAttribute('text-anchor', 'start');
  setMassLabel(DOM.mass2Label, 'm₂', fmt(m2, 1), 'kg');

  // Seil
  DOM.rope.setAttribute('d',
    `M ${X_LEFT} ${y1_svg} V ${PULLEY_Y} A ${PULLEY_R} ${PULLEY_R} 0 0 1 ${X_RIGHT} ${PULLEY_Y} V ${y2_svg}`);

  // Kräfte (Seilkräfte T1/T2 sind bei massiver Rolle verschieden)
  const vis = showForces ? 'visible' : 'hidden';
  const netVis = (showForces && showNetForce) ? 'visible' : 'hidden';
  const Fg1 = m1 * G * PPN, Fg2 = m2 * G * PPN;
  const T1_len = T1 * PPN, T2_len = T2 * PPN;
  setVec(DOM.fG1,  X_LEFT,  y1_svg + m1_hpx, X_LEFT,  y1_svg + m1_hpx + Fg1, vis);
  setVec(DOM.fT1,  X_LEFT,  y1_svg - m1_hpx, X_LEFT,  y1_svg - m1_hpx - T1_len, vis);
  setVec(DOM.fG2,  X_RIGHT, y2_svg + m2_hpx, X_RIGHT, y2_svg + m2_hpx + Fg2, vis);
  setVec(DOM.fT2,  X_RIGHT, y2_svg - m2_hpx, X_RIGHT, y2_svg - m2_hpx - T2_len, vis);
  setVec(DOM.fNet1, X_LEFT,  y1_svg, X_LEFT,  y1_svg + m1 * accel * PPN, netVis);
  setVec(DOM.fNet2, X_RIGHT, y2_svg, X_RIGHT, y2_svg - m2 * accel * PPN, netVis);

  // Massive Rolle: Loch (Hohlzylinder) + Rotations-Markierung (Winkel φ = s/R).
  // m1 fällt (s>0) ⇒ linke Seilseite unten ⇒ Rolle auf dem Bildschirm CCW
  // ⇒ SVG-rotate negativ (SVG positiv = CW auf y-down-Bildschirm).
  if (DOM.pulleyInner) {
    if (pulleyShape === 'hohl') {
      const rPx = pulleyInnerRatio * PULLEY_R;
      DOM.pulleyInner.setAttribute('r', String(rPx));
      DOM.pulleyInner.setAttribute('visibility', 'visible');
    } else {
      DOM.pulleyInner.setAttribute('visibility', 'hidden');
    }
  }
  if (DOM.pulleyRotor) {
    const s_m = y1_m - (store.y1_start_cm / CM_PER_M);   // Verschiebung m1 (fällt ⇒ >0, Apertur-Koordinate wächst beim Fallen)
    const R_m = PULLEY_R / PPM;
    const phiDeg = (s_m / R_m) * (180 / Math.PI);
    DOM.pulleyRotor.setAttribute('transform', `rotate(${-phiDeg} ${PULLEY_X} ${PULLEY_Y})`);
  }

  // Reibungspfeil an der Rolle (nur wenn F_R>0 und Bewegung)
  const frVis = (showForces && showFrictionArrow && FR > 0 && moving) ? 'visible' : 'hidden';
  if (frVis === 'visible') {
    DOM.frictionArrow.setAttribute('d', accel > 0 ? FR_CW : FR_CCW);
  }
  DOM.frictionArrow.setAttribute('visibility', frVis);
  DOM.frictionLabel.setAttribute('visibility', frVis);

  // Stoppuhr
  const ma = (t % 60) / 60 * 2 * Math.PI - Math.PI / 2;
  DOM.swHand.setAttribute('x2', String(SW_HAND_LEN * Math.cos(ma)));
  DOM.swHand.setAttribute('y2', String(SW_HAND_LEN * Math.sin(ma)));
  const sa = (t % 1) * 2 * Math.PI - Math.PI / 2;
  DOM.subHand.setAttribute('x2', String(13 * Math.cos(sa)));
  DOM.subHand.setAttribute('y2', String(25 + 13 * Math.sin(sa)));

  // Zeit-Label
  DOM.timeLabel.innerHTML = `<i>t</i> = ${fmt(t)} s`;

  // Live-Analyse — Kinematik
  const v1 = interpolateAt(store.v1_data, t);
  const v2 = interpolateAt(store.v2_data, t);
  DOM.liveA1.textContent   = `${fmt(-accel, 3)} m/s²`;
  DOM.liveA2.textContent   = `${fmt(accel, 3)} m/s²`;
  DOM.liveT1.textContent   = `${fmt(T1, 2)} N`;
  DOM.liveT2.textContent   = `${fmt(T2, 2)} N`;
  const frAct = moving ? FR : Math.min(FR, Math.abs(drive));
  DOM.liveFr.textContent   = `${fmt(frAct, 2)} N`;
  DOM.liveV1.textContent   = `${fmt(v1, 3)} m/s`;
  DOM.liveV2.textContent   = `${fmt(v2, 3)} m/s`;
  DOM.liveY1.textContent   = `${fmt(Y_MAX_CM - y1_m * CM_PER_M, 1)} cm`;
  DOM.liveY2.textContent   = `${fmt(Y_MAX_CM - y2_m * CM_PER_M, 1)} cm`;
  DOM.liveYdiff.textContent = `${fmt((y2_m - y1_m) * CM_PER_M, 1)} cm`;

  // Live-Analyse — Energie
  const ek = interpolateAt(store.ek_sum_data, t);
  const ep = interpolateAt(store.ep_sum_data, t);
  const et = interpolateAt(store.etot_data, t);
  const wr = interpolateAt(store.wr_data, t);
  const erot = interpolateAt(store.ek_rot_data, t);
  DOM.liveEkin.textContent = `${fmt(ek, 2)} J`;
  DOM.liveEpot.textContent = `${fmt(ep, 2)} J`;
  DOM.liveEtot.textContent = `${fmt(et, 2)} J`;
  DOM.liveWr.textContent   = `${fmt(wr, 2)} J`;
  DOM.liveErot.textContent = `${fmt(erot, 2)} J`;
  DOM.balance1.innerHTML = `<i>E</i><sub>kin</sub> + <i>E</i><sub>pot</sub> = <i>E</i><sub>ges</sub> = ${fmt(et, 2)} J`;
  DOM.balance2.innerHTML = `<i>E</i><sub>ges</sub> + <i>E</i><sub>V</sub> = ${fmt(et + wr, 2)} J <span class="bal-const">(konstant)</span>`;
}

function setMassLabel(textElObj, sym, val, unit) {
  textElObj.innerHTML = '';
  const s = document.createElementNS(NS, 'tspan');
  s.setAttribute('font-style', 'italic'); s.textContent = sym;
  textElObj.appendChild(s);
  const v = document.createElementNS(NS, 'tspan');
  v.textContent = `=${val} ${unit}`;
  textElObj.appendChild(v);
}

function setVec(lineElObj, x1, y1, x2, y2, vis) {
  lineElObj.setAttribute('x1', x1); lineElObj.setAttribute('y1', y1);
  lineElObj.setAttribute('x2', x2); lineElObj.setAttribute('y2', y2);
  const len = Math.abs(y2 - y1) + Math.abs(x2 - x1);
  lineElObj.setAttribute('visibility', vis === 'visible' && len > 1 ? 'visible' : 'hidden');
}