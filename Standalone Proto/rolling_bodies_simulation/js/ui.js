/**
 * UI Event Handlers
 * @module ui
 */

import * as state from './state.js';
import * as render from './render.js';
import {
  G, DEFAULT_DURATION, MIN_DURATION, MAX_SIM_DURATION,
  ALL_TYPES, GRAPH_OPTIONS
} from './constants.js';
import { computeK, rollConditionMuMin, precompute } from './physics.js';

export function setupUI() {
  // Graph select options
  const gSel = state.DOM.graphSel;
  for (const k in GRAPH_OPTIONS) {
    const o = document.createElement('option');
    o.value = k;
    o.textContent = GRAPH_OPTIONS[k].label;
    gSel.appendChild(o);
  }
  gSel.addEventListener('change', () => render.updateGraph(state.store.simTime));

  // Vector scale buttons
  document.querySelectorAll('.vec-scale-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.vec-scale-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.store.vecScale = parseFloat(btn.dataset.scale);
      render.updateScene(state.store.simTime);
    });
  });

  // Object type
  document.querySelectorAll('input[name="obj"]').forEach(inp => {
    inp.addEventListener('change', e => {
      document.querySelectorAll('.obj-btn').forEach(b => b.classList.remove('active'));
      e.target.closest('.obj-btn').classList.add('active');
      state.store.compareActive.delete(e.target.value);
      resetSim();
    });
  });

  // Speed
  document.querySelectorAll('input[name="speed"]').forEach(inp => {
    inp.addEventListener('change', e => {
      document.querySelectorAll('.speed-pill').forEach(b => b.classList.remove('active'));
      e.target.closest('.speed-pill').classList.add('active');
      state.store.speedFactor = parseFloat(e.target.value);
    });
  });

  // Mode
  ['mode_flat', 'mode_inclined'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => resetSim());
  });

  // Sliders
  ['radius_slider', 'vel_slider', 'alpha_slider', 'inner_r_slider'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => resetSim());
  });

  // Vis toggles
  document.querySelectorAll('.toggle-switch input').forEach(el => {
    el.addEventListener('change', () => {
      updateUIInteractivity();
      render.updateScene(state.store.simTime);
    });
  });

  // Coord alignment
  document.querySelectorAll('input[name="coord_align"]').forEach(inp => {
    inp.addEventListener('change', e => {
      state.store.coordSystemAlignment = e.target.value;
      render.updateScene(state.store.simTime);
    });
  });

  // Subject pills
  document.querySelectorAll('.subj-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const s = pill.dataset.subj;
      if (state.store.activeSubjects.has(s)) {
        if (state.store.activeSubjects.size > 1) { state.store.activeSubjects.delete(s); pill.classList.remove('active'); }
      } else { state.store.activeSubjects.add(s); pill.classList.add('active'); }
      render.rebuildAnalysis();
      render.updateScene(state.store.simTime);
    });
  });

  // Buttons
  state.DOM.playBtn.addEventListener('click', startAnim);
  state.DOM.pauseBtn.addEventListener('click', stopAnim);
  state.DOM.resetBtn.addEventListener('click', () => { state.store.simTime = 0; resetSim(); });
  state.DOM.exportBtn.addEventListener('click', exportCSV);

  // Theme toggle
  state.DOM.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    render.drawBackground();
    render.drawObstacle();
    render.updateCylinderStyle();
    render.updateScene(state.store.simTime);
  });

  updateUIInteractivity();
}

function updateUIInteractivity() {
  const tracesActive = state.DOM.togTraces.checked;
  const fgRow = state.DOM.rowTracesFg;
  const fgInp = state.DOM.togTracesFg;
  
  if (tracesActive) {
    fgRow.style.opacity = '1';
    fgRow.style.pointerEvents = 'auto';
    fgInp.disabled = false;
  } else {
    fgRow.style.opacity = '0.4';
    fgRow.style.pointerEvents = 'none';
    fgInp.disabled = true;
  }
}

export function getKFactor() {
  const t = document.querySelector('input[name="obj"]:checked').value;
  const beta = parseInt(state.DOM.innerRSlider.value, 10) / 100;
  return computeK(t, beta);
}

export function resetSim(preserveTime = false) {
  stopAnim();
  if (!preserveTime) state.store.simTime = 0;

  state.store.R_m = parseFloat(state.DOM.radiusSlider.value) / 100;
  state.store.v0_m_s = parseFloat(state.DOM.velSlider.value) / 100;
  state.store.alpha_rad = state.DOM.modeInclined.checked
    ? parseFloat(state.DOM.alphaSlider.value) * Math.PI / 180 : 0;
  
  state.store.kFactor = getKFactor();

  // Automatische Rollbedingung: mu_s fixieren auf mu_min
  const muMin = rollConditionMuMin(state.store.kFactor, state.store.alpha_rad);
  state.store.mu_s = muMin;

  state.DOM.radiusVal.textContent = render.fmt(state.store.R_m * 100, 1) + ' cm';
  state.DOM.velVal.textContent    = render.fmt(state.store.v0_m_s * 100, 0) + ' cm/s';
  state.DOM.alphaVal.textContent  = render.fmt(state.store.alpha_rad * 180 / Math.PI, 1) + '°';
  state.DOM.muVal.textContent     = render.fmt(state.store.mu_s, 2);
  state.DOM.innerRVal.textContent = render.fmt(state.DOM.innerRSlider.value / 100, 2);
  state.DOM.kvalDisplay.textContent = render.fmt(state.store.kFactor, 4);

  const beta = parseInt(state.DOM.innerRSlider.value, 10) / 100;
  state.DOM.kbadgeThickCyl.textContent = `k = ${render.fmt(computeK('thick_cylinder', beta), 3)}`;
  state.DOM.kbadgeThickSph.textContent = `k = ${render.fmt(computeK('thick_sphere', beta), 3)}`;

  const type = document.querySelector('input[name="obj"]:checked').value;
  state.DOM.innerRGroup.style.display = type.startsWith('thick') ? 'block' : 'none';
  state.DOM.alphaGroup.style.display = state.DOM.modeInclined.checked ? 'block' : 'none';
  state.DOM.velSlider.disabled = state.DOM.modeInclined.checked;
  state.DOM.velVal.style.opacity = state.DOM.modeInclined.checked ? '0.4' : '1';

  // Rollbedingung-Box Status
  const rc = state.DOM.rollcondBox;
  rc.className = 'roll-condition roll-ok';
  rc.textContent = 'Reines Rollen (fixiert) ✓';
  state.DOM.muRequiredNote.textContent = state.store.alpha_rad > 0.001
    ? `Fixierter Haftreibungskoeff. μₛ = μₛ,min = ${render.fmt(muMin, 3)}`
    : 'Haftreibung nicht erforderlich (Ebene)';

  render.buildRaceBars();
  render.buildCompareList();
  precompute();
  render.setupViewport();
  render.updateCylinderStyle();
  render.drawBackground();
  render.drawObstacle();
  render.rebuildAnalysis();
  render.updateScene(state.store.simTime);
}

export function exportCSV() {
  const btn = state.DOM.exportBtn;
  const cols = ['t', ...['sp', 'p1', 'p2', 'p3', 'p4'].flatMap(s => 
    ['x', 'y', 'vx', 'vy', 'vabs', 'ax', 'ay', 'aabs'].map(q => `${s}_${q}`)
  ), 'omega', 'alpha_w'];
  const head = cols.join(';');
  const rows = state.store.fullData.t.map((_, i) => {
    return [
      state.store.fullData.t[i],
      ...['sp', 'p1', 'p2', 'p3', 'p4'].flatMap(s => 
        ['x', 'y', 'vx', 'vy', 'vabs', 'ax', 'ay', 'aabs'].map(q => state.store.fullData[`${s}_${q}`][i])
      ),
      state.store.omega[i], state.store.alpha_w[i]
    ].map(n => render.fmt(n, 6)).join(';');
  });
  const note = '# Rollende Koerper Simulation | t=s, x/y=m, v=m/s, a=m/s2, omega=rad/s, alpha_w=rad/s2\n';
  const blob = new Blob(['\uFEFF' + note + head + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rollende_koerper_export.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  btn.textContent = '✓ Gespeichert';
  btn.classList.add('success');
  setTimeout(() => { btn.textContent = 'Export CSV'; btn.classList.remove('success'); }, 2000);
}

export function startAnim() {
  if (state.store.animId) return;
  if (state.store.simTime >= state.store.simDuration - 0.001) { state.store.simTime = 0; }
  state.store.lastTs = 0;
  state.store.animId = requestAnimationFrame(animate);
  state.DOM.playBtn.disabled = true;
  state.DOM.pauseBtn.disabled = false;
}

export function stopAnim() {
  if (state.store.animId) { cancelAnimationFrame(state.store.animId); state.store.animId = null; }
  state.DOM.playBtn.disabled = false;
  state.DOM.pauseBtn.disabled = true;
}

function animate(now) {
  try {
    if (!state.store.lastTs) state.store.lastTs = now;
    const dt = (now - state.store.lastTs) / 1000;
    state.store.lastTs = now;
    state.store.simTime += dt * state.store.speedFactor;
    if (state.store.simTime >= state.store.simDuration) { state.store.simTime = state.store.simDuration; stopAnim(); }
    render.updateScene(state.store.simTime);
    if (state.store.animId) state.store.animId = requestAnimationFrame(animate);
  } catch (err) {
    console.error('Animation error:', err);
    stopAnim();
  }
}
