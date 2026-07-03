import { G, BALL_X, PIXELS_PER_METER } from './constants.js';
import { store, DOM, initDOM } from './state.js';
import { scaleY, flightTime, getDisplayY, getDisplayV, getDisplayA } from './physics.js';
import { fmt, drawRuler, drawStickFigure, drawYAxisDisplay,
         drawStopwatchMarks, drawSubdialMarks,
         updateGraph, updateScene, updateKennwerte,
         updatePhysicsFormulas } from './render.js';

function stopAnimation() {
  if (store.aniFrameId) cancelAnimationFrame(store.aniFrameId);
  store.aniFrameId    = null;
  DOM.playBtn.disabled  = false;
  DOM.pauseBtn.disabled = true;
}

function resetSim() {
  stopAnimation();
  store.simulatedTime  = 0;
  store.lastFrameTime  = 0;
  store.h0 = parseFloat(DOM.h0Slider.value);
  store.v0 = parseFloat(DOM.v0Slider.value);
  store.graphType = DOM.graphSelect.value;
  DOM.speedRadios.forEach(r => { if (r.checked) store.speedFactor = parseFloat(r.value); });
  const parts = DOM.yAxisSelect.value.split('_');
  store.yAxisConfig.direction = parts[0];
  store.yAxisConfig.origin    = parts[1];

  DOM.h0Value.textContent = `${fmt(store.h0, 1)} m`;
  DOM.v0Value.textContent = `${store.v0} m/s`;
  store.t_data = []; store.y_data = []; store.v_data = []; store.a_data = [];

  const bhM = Math.max(0, store.h0 - 1.8);
  DOM.building.setAttribute('height', String(bhM * PIXELS_PER_METER));
  DOM.building.setAttribute('y', String(scaleY(bhM)));

  drawStickFigure(bhM);
  drawRuler();
  drawStopwatchMarks();
  drawSubdialMarks();
  drawYAxisDisplay();

  DOM.ball.setAttribute('cx', String(BALL_X));
  updateScene(0, store.h0, store.v0, -G);  // setzt Vektoren + Stoppuhr bei t=0
  updateGraph();
  updateKennwerte();
  updatePhysicsFormulas();

  DOM.timeLabel.innerHTML = '<i>t</i> = 0,00 s';
  DOM.liveT.textContent     = '0,00 s';
  DOM.liveY.textContent     = `${fmt(getDisplayY(store.h0))} m`;
  DOM.liveV.textContent     = `${fmt(getDisplayV(store.v0))} m/s`;
}

function animate(ts) {
  if (!store.lastFrameTime) store.lastFrameTime = ts;
  store.simulatedTime  += (ts - store.lastFrameTime) / 1000 * store.speedFactor;
  store.lastFrameTime   = ts;

  const { h0, v0, simulatedTime: t } = store;
  const y = h0 + v0 * t - 0.5 * G * t * t;
  const v = v0 - G * t;
  const a = -G;

  if (y >= 0) {
    store.t_data.push(t);
    store.y_data.push(getDisplayY(y));
    store.v_data.push(getDisplayV(v));
    store.a_data.push(getDisplayA(a));
    updateScene(t, y, v, a);
    updateGraph();
    store.aniFrameId = requestAnimationFrame(animate);
  } else {
    const tf = flightTime();
    const vf = v0 - G * tf;
    store.t_data.push(tf);
    store.y_data.push(getDisplayY(0));
    store.v_data.push(getDisplayV(vf));
    store.a_data.push(getDisplayA(-G));
    updateScene(tf, 0, vf, -G);
    updateGraph();
    stopAnimation();
  }
}

function startAnimation() {
  if (!store.aniFrameId) {
    if (store.simulatedTime === 0) resetSim();
    DOM.playBtn.disabled  = true;
    DOM.pauseBtn.disabled = false;
    store.lastFrameTime   = 0;
    store.aniFrameId = requestAnimationFrame(animate);
  }
}

function updateSpeedPills() {
  document.querySelectorAll('.speed-pill').forEach(pill => {
    pill.classList.toggle('active', pill.querySelector('input').checked);
  });
}

function setupTheme() {
  const saved = localStorage.getItem('fh_theme') || 'light';
  document.body.className = saved;
  DOM.themeToggle.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark');
    document.body.classList.toggle('light', !dark);
    localStorage.setItem('fh_theme', dark ? 'dark' : 'light');
    drawRuler();
    drawStopwatchMarks();
    drawSubdialMarks();
  });
}

// ── CSV export ────────────────────────────────────────────────────────────────
function exportCSV(all) {
  const { t_data, y_data, v_data, a_data, graphType, yAxisConfig } = store;
  if (!t_data.length) return;

  const posLabel = yAxisConfig.origin === 'start' ? 's / m' : 'y / m';

  let header, rows;
  if (all) {
    header = `sep=;\nt / s;${posLabel};v / (m/s);a / (m/s²)`;
    rows = t_data.map((_, i) =>
      [t_data[i], y_data[i], v_data[i], a_data[i]].map(v => fmt(v, 4)).join(';'));
  } else {
    const colMap = {
      weg:    { label: posLabel,       data: y_data },
      geschw: { label: 'v / (m/s)',    data: v_data },
      beschl: { label: 'a / (m/s²)',   data: a_data },
    };
    const col = colMap[graphType] || colMap.weg;
    header = `sep=;\nt / s;${col.label}`;
    rows = t_data.map((_, i) => `${fmt(t_data[i], 4)};${fmt(col.data[i], 4)}`);
  }

  const csv  = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `freierfall_${all ? 'alle' : 'diagramm'}.csv`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ── Bootstrap ────────────────────────────────────────────────────────────────

initDOM();
setupTheme();

DOM.h0Slider.addEventListener('input', resetSim);
DOM.v0Slider.addEventListener('input', resetSim);
DOM.graphSelect.addEventListener('change', resetSim);
DOM.yAxisSelect.addEventListener('change', resetSim);
DOM.togVel.addEventListener('change', resetSim);
DOM.togAcc.addEventListener('change', resetSim);

DOM.speedRadios.forEach(r => r.addEventListener('change', () => {
  DOM.speedRadios.forEach(rad => { if (rad.checked) store.speedFactor = parseFloat(rad.value); });
  updateSpeedPills();
}));

DOM.playBtn.addEventListener('click', startAnimation);
DOM.pauseBtn.addEventListener('click', () => { if (store.aniFrameId) stopAnimation(); });
DOM.analysisToggle.addEventListener('click', () => {
  const collapsed = DOM.appLayout.classList.toggle('analysis-collapsed');
  DOM.analysisToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
});
DOM.exportDiagram.addEventListener('click', () => exportCSV(false));
DOM.exportAll.addEventListener('click',     () => exportCSV(true));
document.getElementById('reset_btn').addEventListener('click', () => {
  store.simulatedTime = 0;
  resetSim();
});

updateSpeedPills();
resetSim();

// MathJax rendert display:none-Elemente nicht — alle Formelvarianten kurz zeigen,
// typesetten, dann die inaktiven ausblenden.
function _initFormulaTypeset() {
  const ids = ['pf_up_ground', 'pf_up_start', 'pf_down_ground', 'pf_down_start'];
  const els = ids.map(id => document.getElementById(id)).filter(Boolean);
  els.forEach(el => { el.style.display = ''; });
  MathJax.typesetPromise(els).then(() => updatePhysicsFormulas());
}
if (window.MathJax?.startup?.promise) {
  MathJax.startup.promise.then(_initFormulaTypeset);
} else if (window.MathJax?.typesetPromise) {
  _initFormulaTypeset();
}
