import { Y_MAX_CM, CM_PER_M, GRAPH_OPTIONS } from './constants.js';
import { store, DOM, initDOM } from './state.js';
import { precompute, interpolateAt } from './physics.js';
import { fmt, drawRuler, drawStopwatchMarks, updateScene, updateGraphs } from './render.js';

// ── Animation control ─────────────────────────────────────────────────────────
function stopAnimation() {
  if (store.animFrameId) cancelAnimationFrame(store.animFrameId);
  store.animFrameId    = null;
  DOM.playBtn.disabled  = false;
  DOM.pauseBtn.disabled = true;
}

function animate(ts) {
  if (!store.lastFrameTime) store.lastFrameTime = ts;
  store.simulatedTime += (ts - store.lastFrameTime) / 1000 * store.speedFactor;
  store.lastFrameTime  = ts;

  const t = Math.min(store.simulatedTime, store.t_end);
  // y1_data/y2_data are height-from-floor in cm; svgY() expects distance-from-aperture in m
  const y1_meters = (Y_MAX_CM - interpolateAt(store.y1_data, t)) / CM_PER_M;
  const y2_meters = (Y_MAX_CM - interpolateAt(store.y2_data, t)) / CM_PER_M;

  updateScene(t, y1_meters, y2_meters);
  updateGraphs(t);

  if (store.simulatedTime < store.t_end) {
    store.animFrameId = requestAnimationFrame(animate);
  } else {
    stopAnimation();
  }
}

function startAnimation() {
  if (!store.animFrameId) {
    if (store.simulatedTime === 0) resetSim();
    DOM.playBtn.disabled  = true;
    DOM.pauseBtn.disabled = false;
    store.lastFrameTime   = 0;
    store.animFrameId = requestAnimationFrame(animate);
  }
}

// ── Height configuration ──────────────────────────────────────────────────────
function updateHeightParams() {
  // Slider-Wert = Höhe vom Boden in cm; store.y1_start_cm = Abstand von Apertur
  const y1_h = parseFloat(DOM.y1Slider.value);
  DOM.y1Value.textContent = `${fmt(y1_h, 0)} cm`;

  if (DOM.heightMode.value === 'y1y2') {
    DOM.y1Group.style.display   = '';
    DOM.y2Group.style.display   = '';
    DOM.diffGroup.style.display = 'none';
    const y2_h = parseFloat(DOM.y2Slider.value);
    DOM.y2Value.textContent = `${fmt(y2_h, 0)} cm`;
    store.y1_start_cm = Y_MAX_CM - y1_h;
    store.y2_start_cm = Y_MAX_CM - y2_h;
  } else {
    DOM.y1Group.style.display   = '';
    DOM.y2Group.style.display   = 'none';
    DOM.diffGroup.style.display = '';
    const diff_cm = parseFloat(DOM.diffSlider.value);
    const y2_h   = Math.min(320, Math.max(40, y1_h + diff_cm));
    DOM.diffValue.textContent = `${fmt(diff_cm, 0)} cm`;
    DOM.y2Value.textContent   = `${fmt(y2_h, 0)} cm`;
    store.y1_start_cm = Y_MAX_CM - y1_h;
    store.y2_start_cm = Y_MAX_CM - y2_h;
  }
}

// ── Graph selectors ───────────────────────────────────────────────────────────
function populateSelect(sel, opts) {
  const cur = sel.value;
  sel.innerHTML = '';
  opts.forEach(({ val, label }) => {
    const o = document.createElement('option');
    o.value = val; o.textContent = label;
    if (val === cur) o.selected = true;
    sel.appendChild(o);
  });
}

function updateGraphSelectors() {
  const mode    = DOM.graphModeRadios.find(r => r.checked)?.value || '1';
  const subject = DOM.subjectSelect.value;

  DOM.subjectGroup.style.display   = mode === '1' ? '' : 'none';
  DOM.graphSel2Group.style.display = mode === '2' ? '' : 'none';

  const baseOpts = ['y', 'v', 'a', 'yrel'].map(val => ({ val, label: GRAPH_OPTIONS[val].label }));
  const singleOpts = [...baseOpts];
  if (mode === '1' && subject !== 'both') {
    singleOpts.push({ val: 'ydiff', label: GRAPH_OPTIONS.ydiff.label });
  }

  populateSelect(DOM.graphSelect1, singleOpts);
  populateSelect(DOM.graphSelect2, baseOpts);

  store.graphCfg.mode    = mode;
  store.graphCfg.type1   = DOM.graphSelect1.value;
  store.graphCfg.type2   = DOM.graphSelect2.value;
  store.graphCfg.subject = mode === '1' ? subject : 'both';
}

// ── Full reset ────────────────────────────────────────────────────────────────
function resetSim() {
  stopAnimation();
  store.simulatedTime  = 0;
  store.lastFrameTime  = 0;

  store.m1 = parseFloat(DOM.m1Slider.value);
  store.m2 = parseFloat(DOM.m2Slider.value);
  DOM.m1Value.textContent = `${fmt(store.m1, 1)} kg`;
  DOM.m2Value.textContent = `${fmt(store.m2, 1)} kg`;

  updateHeightParams();
  store.showForces  = DOM.togForces.checked;
  store.showNetForce = DOM.togNet.checked;
  DOM.speedRadios.forEach(r => { if (r.checked) store.speedFactor = parseFloat(r.value); });

  precompute();

  const y1_m = store.y1_start_cm / 100;
  const y2_m = store.y2_start_cm / 100;
  updateScene(0, y1_m, y2_m);
  updateGraphs(0);

  // Reset stopwatch hand to 12 o'clock
  DOM.swHand.setAttribute('x2', '0');
  DOM.swHand.setAttribute('y2', String(-50));
  DOM.subHand.setAttribute('x2', '0');
  DOM.subHand.setAttribute('y2', '13');
  DOM.timeLabel.innerHTML = '<i>t</i> = 0,00 s';
}

// ── Pill active-state sync ────────────────────────────────────────────────────
function updateSpeedPills() {
  document.querySelectorAll('.speed-pill').forEach(p => {
    p.classList.toggle('active', p.querySelector('input').checked);
  });
}

// ── Theme ─────────────────────────────────────────────────────────────────────
function setupTheme() {
  const saved = localStorage.getItem('fh_theme') || 'light';
  document.body.className = saved;
  DOM.themeToggle.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark');
    document.body.classList.toggle('light', !dark);
    localStorage.setItem('fh_theme', dark ? 'dark' : 'light');
    drawRuler();
    drawStopwatchMarks();
  });
}

// ── Einklappbare Analyse-Sidebar ───────────────────────────────────────────
function setupAnalysisToggle() {
  DOM.analysisToggle.addEventListener('click', () => {
    const collapsed = DOM.appLayout.classList.toggle('analysis-collapsed');
    DOM.analysisToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  });
}

// ── Akkordeon-Steuerungs-Sidebar (I8): linke Cluster ein-/ausklappbar ──────
// .panel-label ist <button> → Enter/Space triggert click nativ.
function setupAccordion() {
  document.querySelectorAll('.panel-section.collapsible > .panel-label').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.parentElement;
      const collapsed = section.classList.toggle('collapsed');
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
  });
}

// ── CSV export ────────────────────────────────────────────────────────────────
function exportCSV(all) {
  const { t_data, y1_data, y2_data, v1_data, v2_data,
          a1_data, a2_data, ydiff_data, yrel1_data, yrel2_data, graphCfg } = store;

  const arrMap = {
    y1: y1_data, y2: y2_data, v1: v1_data, v2: v2_data,
    a1: a1_data, a2: a2_data, ydiff: ydiff_data,
    yrel1: yrel1_data, yrel2: yrel2_data,
  };
  const unitMap = { y: 'cm', v: 'm/s', a: 'm/s²', ydiff: 'cm', yrel: 'cm' };
  const symMap  = { y: 'y', v: 'v', a: 'a', ydiff: 'Δy', yrel: 'Δy' };

  let header, rows;
  if (all) {
    header = 'sep=;\nt / s;y₁ / cm;y₂ / cm;v₁ / (m/s);v₂ / (m/s);a₁ / (m/s²);a₂ / (m/s²);Δy / cm';
    rows = t_data.map((_, i) =>
      [t_data[i], y1_data[i], y2_data[i], v1_data[i], v2_data[i],
       a1_data[i], a2_data[i], ydiff_data[i]].map(v => fmt(v, 4)).join(';'));
  } else {
    const { mode, type1, type2, subject } = graphCfg;
    if (mode === '1') {
      const isYdiff = type1 === 'ydiff';
      const key1 = isYdiff ? 'ydiff' : `${type1}${subject === 'm2' ? '2' : '1'}`;
      const key2 = (!isYdiff && subject === 'both') ? `${type1}2` : null;
      const sub1 = subject === 'm2' ? '₂' : '₁';
      const lbl1 = isYdiff ? 'Δy / cm' : `${symMap[type1] ?? type1}${sub1} / ${unitMap[type1]}`;
      const lbl2 = key2 ? `${symMap[type1] ?? type1}₂ / ${unitMap[type1]}` : null;
      header = `sep=;\nt / s;${lbl1}${lbl2 ? ';' + lbl2 : ''}`;
      rows = t_data.map((_, i) => {
        const parts = [fmt(t_data[i], 4), fmt(arrMap[key1][i], 4)];
        if (key2) parts.push(fmt(arrMap[key2][i], 4));
        return parts.join(';');
      });
    } else {
      header = `sep=;\nt / s;${symMap[type1] ?? type1}₁ / ${unitMap[type1]};${symMap[type2] ?? type2}₂ / ${unitMap[type2]}`;
      const k1 = `${type1}1`, k2 = `${type2}2`;
      rows = t_data.map((_, i) =>
        [fmt(t_data[i], 4), fmt(arrMap[k1][i], 4), fmt(arrMap[k2][i], 4)].join(';'));
    }
  }

  const csv  = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `atwood_${all ? 'all' : 'diagram'}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
initDOM();
setupTheme();
setupAnalysisToggle();
setupAccordion();
drawRuler();
drawStopwatchMarks();
updateGraphSelectors();

DOM.m1Slider.addEventListener('input', resetSim);
DOM.m2Slider.addEventListener('input', resetSim);

DOM.heightMode.addEventListener('change', () => { updateHeightParams(); resetSim(); });
DOM.y1Slider.addEventListener('input', resetSim);
DOM.y2Slider.addEventListener('input', resetSim);
DOM.diffSlider.addEventListener('input', resetSim);

DOM.togForces.addEventListener('change', () => { store.showForces = DOM.togForces.checked; resetSim(); });
DOM.togNet.addEventListener('change',    () => { store.showNetForce = DOM.togNet.checked; resetSim(); });

DOM.graphModeRadios.forEach(r => r.addEventListener('change', () => {
  updateSpeedPills(); updateGraphSelectors(); updateGraphs(store.simulatedTime);
}));
DOM.graphSelect1.addEventListener('change', () => {
  store.graphCfg.type1 = DOM.graphSelect1.value;
  updateGraphs(store.simulatedTime);
});
DOM.graphSelect2.addEventListener('change', () => {
  store.graphCfg.type2 = DOM.graphSelect2.value;
  updateGraphs(store.simulatedTime);
});
DOM.subjectSelect.addEventListener('change', () => {
  updateGraphSelectors(); updateGraphs(store.simulatedTime);
});

DOM.speedRadios.forEach(r => r.addEventListener('change', () => {
  DOM.speedRadios.forEach(rad => { if (rad.checked) store.speedFactor = parseFloat(rad.value); });
  updateSpeedPills();
}));

DOM.playBtn.addEventListener('click', startAnimation);
DOM.pauseBtn.addEventListener('click', () => { if (store.animFrameId) stopAnimation(); });
document.getElementById('reset_btn').addEventListener('click', () => {
  store.simulatedTime = 0; resetSim();
});

DOM.exportDiagram.addEventListener('click', () => exportCSV(false));
DOM.exportAll.addEventListener('click',     () => exportCSV(true));

updateSpeedPills();
resetSim();
