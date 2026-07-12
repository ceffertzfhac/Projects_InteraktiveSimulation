'use strict';

import { Y_MAX_CM, CM_PER_M, PULLEY_R, PPM } from './constants.js';
import { store, DOM, initDOM } from './state.js';
import { precompute, interpolateAt } from './physics.js';
import { fmt, drawRuler, drawStopwatchMarks, drawZeroLines, updateScene, updateGraphs, getLineConfig } from './render.js';

// ── Animations-Steuerung ──────────────────────────────────────────────────────
function stopAnimation() {
  if (store.animFrameId) cancelAnimationFrame(store.animFrameId);
  store.animFrameId   = null;
  DOM.playBtn.disabled  = false;
  DOM.pauseBtn.disabled = true;
}

function animate(ts) {
  if (!store.lastFrameTime) store.lastFrameTime = ts;
  store.simulatedTime += (ts - store.lastFrameTime) / 1000 * store.speedFactor;
  store.lastFrameTime  = ts;

  const t = Math.min(store.simulatedTime, store.t_end);
  // y1/y2_data sind Höhen vom Boden in cm; svgY() erwartet Abstand von Blende in m
  const y1_m = (Y_MAX_CM - interpolateAt(store.y1_data, t)) / CM_PER_M;
  const y2_m = (Y_MAX_CM - interpolateAt(store.y2_data, t)) / CM_PER_M;

  updateScene(t, y1_m, y2_m);
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

// ── Startpositionen ───────────────────────────────────────────────────────────
function updateHeightParams() {
  // Slider-Wert = Höhe vom Boden in cm; store-Wert = Abstand von Blende
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

// ── Rolle (massiv) ─────────────────────────────────────────────────────────────
// Außenradius R fix (PULLEY_R/PPM = 0,4 m = 40 cm). Innenradius-Verhältnis nur
// beim Hohlzylinder relevant; Slider wird für Vollzylinder ausgeblendet.
function updatePulleyParams() {
  store.pulleyMass = parseFloat(DOM.pulleyMassSlider.value);
  DOM.pulleyMassValue.textContent = `${fmt(store.pulleyMass, 2)} kg`;

  store.pulleyShape = DOM.pulleyShapeSelect.value;
  const isHohl = store.pulleyShape === 'hohl';
  DOM.pulleyInnerGroup.style.display = isHohl ? '' : 'none';

  store.pulleyInnerRatio = parseFloat(DOM.pulleyInnerSlider.value);
  const eta = store.pulleyInnerRatio;
  const r_cm = eta * (PULLEY_R / PPM) * 100;     // r = η·R in cm (R = 40 cm)
  DOM.pulleyInnerValue.textContent = `r/R = ${fmt(eta, 2)}  (r = ${fmt(r_cm, 1)} cm)`;
}

// ── Diagramm-Auswahl ──────────────────────────────────────────────────────────
const ENERGY_OPTS = [
  { val: 'ecomposite', label: 'Energie (E_kin, E_pot, E_ges)' },
  { val: 'ekin', label: 'Kinetische Energie E_kin' },
  { val: 'erot', label: 'Rotationsenergie E_rot (Rolle)' },
  { val: 'epot', label: 'Potentielle Energie E_pot' },
  { val: 'eges', label: 'Gesamtenergie E_ges' },
  { val: 'wr', label: 'Energieverlust E_V' },
];
const KIN_OPTS = [
  { val: 'y', label: 'Position y' },
  { val: 'v', label: 'Geschwindigkeit v' },
  { val: 'a', label: 'Beschleunigung a' },
  { val: 'ydiff', label: 'Abstand der Massen Δy' },
];
const ALL_OPTS = [...ENERGY_OPTS, ...KIN_OPTS];

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
  const mode = DOM.graphModeRadios.find(r => r.checked)?.value || 'bars';
  store.diagramMode = mode;
  // Balken-Modus braucht keine Achsen-Optionen; 1/2-Modus zeigt Subjekt + Diagramm-Auswahl.
  if (mode === 'bars') {
    DOM.lineOptionsGroup.style.display = 'none';
  } else {
    DOM.lineOptionsGroup.style.display = '';
    DOM.graphSel2Group.style.display = mode === '2' ? '' : 'none';
  }
  populateSelect(DOM.graphSelect1, ALL_OPTS);
  populateSelect(DOM.graphSelect2, ALL_OPTS);
  DOM.graphSelect1.value = store.graphType1;
  DOM.graphSelect2.value = store.graphType2;
  store.graphType1 = DOM.graphSelect1.value;
  store.graphType2 = DOM.graphSelect2.value;
  // Je Diagramm ein eigenes Subjekt (unabhängig wählbar im Modus „Zwei Diagramme").
  DOM.subjectSelect1.value = store.subject1;
  DOM.subjectSelect2.value = store.subject2;
  store.subject1 = DOM.subjectSelect1.value;
  store.subject2 = DOM.subjectSelect2.value;
}

// ── Layout-Umschalter (Nebeneinander ↔ Übereinander) ──────────────────────────
function applyLayout() {
  const split = store.layoutSplit;
  DOM.mainSvg.closest('.center-area').classList.toggle('layout-split', split);
  if (DOM.layoutToggle) {                              // FAE11: Button ausgeblendet → null-sicher
    DOM.layoutToggle.textContent = split ? '▦ Nebeneinander' : '▦ Übereinander';
    DOM.layoutToggle.classList.toggle('active', split);
  }
  localStorage.setItem('atwood_energy_layout', split ? 'split' : 'stacked');
}

// ── Reibungspfeil-Toggle bei F_R = 0 deaktivieren (FAE3) ──────────────────────
function updateFrictionArrowToggle() {
  const off = store.frictionForce <= 0;
  DOM.togFrictionArrow.disabled = off;
  DOM.frictionArrowRow.classList.toggle('is-disabled', off);
}

// ── Reset ─────────────────────────────────────────────────────────────────────
function resetSim() {
  stopAnimation();
  store.simulatedTime  = 0;
  store.lastFrameTime   = 0;

  store.m1 = parseFloat(DOM.m1Slider.value);
  store.m2 = parseFloat(DOM.m2Slider.value);
  DOM.m1Value.textContent = `${fmt(store.m1, 1)} kg`;
  DOM.m2Value.textContent = `${fmt(store.m2, 1)} kg`;

  updateHeightParams();

  store.frictionForce = parseFloat(DOM.frictionSlider.value);
  DOM.frictionValue.textContent = `${fmt(store.frictionForce, 1)} N`;
  updateFrictionArrowToggle();
  store.epZeroMode = DOM.epZeroSelect.value;

  updatePulleyParams();

  store.showForces       = DOM.togForces.checked;
  store.showNetForce     = DOM.togNet.checked;
  store.showFrictionArrow = DOM.togFrictionArrow.checked;
  store.showZeroLines    = DOM.togZeroLines.checked;

  updateGraphSelectors();

  precompute();
  drawZeroLines();

  const y1_m = store.y1_start_cm / 100;
  const y2_m = store.y2_start_cm / 100;
  updateScene(0, y1_m, y2_m);
  updateGraphs(0);

  // Stoppuhr auf 12 Uhr zurück
  DOM.swHand.setAttribute('x2', '0');
  DOM.swHand.setAttribute('y2', String(-50));
  DOM.subHand.setAttribute('x2', '0');
  DOM.subHand.setAttribute('y2', '13');
  DOM.timeLabel.innerHTML = '<i>t</i> = 0,00 s';
}

// ── Pill-Status ───────────────────────────────────────────────────────────────
// speed-pills werden für Abspielgeschwindigkeit UND Diagramm-Modus verwendet.
function updateAllPills() {
  document.querySelectorAll('.speed-pill').forEach(p => p.classList.toggle('active', p.querySelector('input').checked));
}

// ── Theme ──────────────────────────────────────────────────────────────────────
function setupTheme() {
  const saved = localStorage.getItem('fh_theme') || 'light';
  document.body.className = saved;
  DOM.themeToggle.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark');
    document.body.classList.toggle('light', !dark);
    localStorage.setItem('fh_theme', dark ? 'dark' : 'light');
    drawRuler();
    drawStopwatchMarks();
    drawZeroLines();
  });
}

// ── Einklappbare Analyse-Sidebar ───────────────────────────────────────────────
function setupAnalysisToggle() {
  DOM.analysisToggle.addEventListener('click', () => {
    const collapsed = DOM.appLayout.classList.toggle('analysis-collapsed');
    DOM.analysisToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  });
}

// ── Akkordeon-Steuerungs-Sidebar (I8) ──────────────────────────────────────────
function setupAccordion() {
  document.querySelectorAll('.left-panel .panel-label').forEach(lbl => {
    lbl.addEventListener('click', () => lbl.closest('.panel-section').classList.toggle('collapsed'));
  });
}

// ── CSV-Export ─────────────────────────────────────────────────────────────────
function exportCSV(all) {
  const { t_data } = store;
  const energyCols = (key) => store[`${key}_data`];

  if (all) {
    const header = 'sep=;\nt / s;y₁ / cm;y₂ / cm;v₁ / (m/s);v₂ / (m/s);a₁ / (m/s²);a₂ / (m/s²);Δy / cm;E_kin / J;E_rot / J;E_pot / J;E_ges / J;E_V / J';
    const rows = t_data.map((_, i) => [
      t_data[i], store.y1_data[i], store.y2_data[i], store.v1_data[i], store.v2_data[i],
      store.a1_data[i], store.a2_data[i], store.ydiff_data[i],
      store.ek_sum_data[i], store.ek_rot_data[i], store.ep_sum_data[i], store.etot_data[i], store.wr_data[i],
    ].map(v => fmt(v, 4)).join(';'));
    download([header, ...rows].join('\n'), 'atwood_energy_all.csv');
    return;
  }

  // Diagramm-Export: sichtbare Typen
  const mode = store.diagramMode;
  const cols = [];
  const headers = ['t / s'];
  const addType = (type, subject) => {
    const cfg = getLineConfig(type, subject);
    cfg.lines.forEach(ln => {
      cols.push(store.axisLimits[ln.key]?.full_data ?? store[`${ln.key}_data`]);
      headers.push(`${ln.label} / ${cfg.unit}`);
    });
  };
  addType(store.graphType1, store.subject1);
  if (mode === '2') addType(store.graphType2, store.subject2);
  const rows = t_data.map((_, i) => [t_data[i], ...cols.map(c => c[i])].map(v => fmt(v, 4)).join(';'));
  download([`sep=;\n${headers.join(';')}`, ...rows].join('\n'), 'atwood_energy_diagram.csv');
}

function download(csv, name) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
initDOM();
setupTheme();
setupAnalysisToggle();
setupAccordion();
drawRuler();
drawStopwatchMarks();

// Layout wiederherstellen — FAE11: nur Nebeneinander sinnvoll (Umschalter
// ausgeblendet), daher Layout immer Nebeneinander. savedLayout-Auswertung
// bleibt als Kommentar, falls der Umschalter reaktiviert wird.
// const savedLayout = localStorage.getItem('atwood_energy_layout');
// store.layoutSplit = savedLayout === 'stacked' ? false : true;
store.layoutSplit = true;
applyLayout();

// Massen
DOM.m1Slider.addEventListener('input', resetSim);
DOM.m2Slider.addEventListener('input', resetSim);

// Startpositionen
DOM.heightMode.addEventListener('change', () => { updateHeightParams(); resetSim(); });
DOM.y1Slider.addEventListener('input', resetSim);
DOM.y2Slider.addEventListener('input', resetSim);
DOM.diffSlider.addEventListener('input', resetSim);

// Reibung & Energie-Referenz
DOM.frictionSlider.addEventListener('input', resetSim);
DOM.epZeroSelect.addEventListener('change', resetSim);

// Rolle (massiv)
DOM.pulleyMassSlider.addEventListener('input', resetSim);
DOM.pulleyShapeSelect.addEventListener('change', () => { updatePulleyParams(); resetSim(); });
DOM.pulleyInnerSlider.addEventListener('input', resetSim);

// Visualisierung
DOM.togForces.addEventListener('change', () => { store.showForces = DOM.togForces.checked; resetSim(); });
DOM.togNet.addEventListener('change', () => { store.showNetForce = DOM.togNet.checked; resetSim(); });
DOM.togFrictionArrow.addEventListener('change', () => { store.showFrictionArrow = DOM.togFrictionArrow.checked; resetSim(); });
DOM.togZeroLines.addEventListener('change', () => { store.showZeroLines = DOM.togZeroLines.checked; drawZeroLines(); });

// Diagramm
DOM.graphModeRadios.forEach(r => r.addEventListener('change', () => {
  updateAllPills(); updateGraphSelectors(); updateGraphs(store.simulatedTime);
}));
DOM.graphSelect1.addEventListener('change', () => { store.graphType1 = DOM.graphSelect1.value; updateGraphs(store.simulatedTime); });
DOM.graphSelect2.addEventListener('change', () => { store.graphType2 = DOM.graphSelect2.value; updateGraphs(store.simulatedTime); });
DOM.subjectSelect1.addEventListener('change', () => { store.subject1 = DOM.subjectSelect1.value; updateGraphs(store.simulatedTime); });
DOM.subjectSelect2.addEventListener('change', () => { store.subject2 = DOM.subjectSelect2.value; updateGraphs(store.simulatedTime); });

// Layout-Umschalter (FAE11: Button ausgeblendet — Listener null-sicher,
// Code bleibt zum Reaktivieren erhalten)
if (DOM.layoutToggle) {
  DOM.layoutToggle.addEventListener('click', () => {
    store.layoutSplit = !store.layoutSplit;
    applyLayout();
    updateGraphs(store.simulatedTime);
  });
}

// Geschwindigkeit
document.querySelectorAll('input[name="speed"]').forEach(r => r.addEventListener('change', () => {
  document.querySelectorAll('input[name="speed"]').forEach(rad => { if (rad.checked) store.speedFactor = parseFloat(rad.value); });
  updateAllPills();
}));

// Play/Pause/Reset
DOM.playBtn.addEventListener('click', startAnimation);
DOM.pauseBtn.addEventListener('click', () => { if (store.animFrameId) stopAnimation(); });
DOM.resetBtn.addEventListener('click', () => { store.simulatedTime = 0; resetSim(); });

// Export
DOM.exportDiagram.addEventListener('click', () => exportCSV(false));
DOM.exportAll.addEventListener('click', () => exportCSV(true));

updateAllPills();
resetSim();