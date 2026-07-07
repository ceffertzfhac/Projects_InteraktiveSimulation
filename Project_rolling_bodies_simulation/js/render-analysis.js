/**
 * Analyse- & Vergleichs-Rendering: Live-Analyse-Grid, Renn-Bars,
 * Vergleichskörper-Liste, gestrichelte Vergleichskörper in der Szene.
 * @module render-analysis
 */

import {
  SUBJECTS, SUBJ_COLORS, SUBJ_LABELS, ALL_TYPES,
  X_STOP, G
} from './constants.js';

import { computeK } from './physics.js';

import * as state from './state.js';
import { svgEl, physToScreen, fmt, fmtTech } from './render-core.js';

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

    const x_local = interp(state.store.fullData[`${s}_x`]);
    const y_local = interp(state.store.fullData[`${s}_y`]);
    let x_disp = x_local;
    let y_disp = y_local;

    if (isGround) {
      x_disp = x_local * ca + y_local * sa;
      y_disp = -(x_local * sa - y_local * ca);
    }

    c.x.textContent = fmt(x_disp, 3)     + ' m';
    c.y.textContent = fmt(y_disp, 3)     + ' m';
    c.v.textContent = fmt(interp(state.store.fullData[`${s}_vabs`]), 3)  + ' m/s';
    c.a.textContent = fmt(interp(state.store.fullData[`${s}_aabs`]), 3) + ' m/s²';
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
  const tArr = toShow.map(t => Math.sqrt(2 * X_STOP * (1 + computeK(t.key, beta)) / (G * sinA)));
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
      // Trigger a global simulation reset through a custom event to avoid circular imports
      document.dispatchEvent(new CustomEvent('sim-reset-request'));
    });
    compareList.appendChild(label);
  });
  compareInfo.textContent = state.store.compareActive.size > 0
    ? `${state.store.compareActive.size} Vergleichskörper aktiv (gestrichelt)`
    : '– kein Vergleich aktiv –';
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