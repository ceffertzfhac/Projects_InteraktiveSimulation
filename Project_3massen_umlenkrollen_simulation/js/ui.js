'use strict'

// ── Einstieg (ES-Module, kein main.js, kein requestAnimationFrame-Loop). ──────
// Statische Sim: Parameteränderung → computeEquilibrium → updateScene + Analyse.

import { store, DOM, initDOM } from './state.js'
import {
  M1_DEFAULT, M1_MIN, M1_MAX, M1_STEP,
  M3_DEFAULT, M3_MIN, M3_MAX, M3_STEP,
  M2_DEFAULT, M2_MIN, M2_MAX, M2_STEP,
  PULLEY_DIST_DEFAULT_CM, PULLEY_DIST_MIN_CM, PULLEY_DIST_MAX_CM, PULLEY_DIST_STEP_CM,
  ROPE_LEN_DEFAULT_CM, ROPE_LEN_STEP_CM, ROPE_LEN_MIN_FACTOR, ROPE_LEN_MAX_FACTOR,
  AUTOZOOM_MARGIN, AUTOZOOM_DURATION_MS, AUTOZOOM_VEC_PAD, DECOR_LEGEND_W, DECOR_LEGEND_H,
  PIXELS_PER_CM, SVG_CENTER_X, SVG_W, SVG_H,
} from './constants.js'
import { computeEquilibrium } from './physics.js'
import { drawBackground, updateScene, updateAnalysis, drawGrid, layoutDecor } from './render.js'

// ── Theme (einheitlicher Key fh_theme auf allen Seiten) ──────────────────────
function setupTheme() {
  const saved = localStorage.getItem('fh_theme')
  const dark = saved ? saved === 'dark' : window.matchMedia?.('(prefers-color-scheme: dark)').matches
  document.body.classList.toggle('dark', dark)
  document.body.classList.toggle('light', !dark)
  DOM.themeToggle?.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark')
    document.body.classList.toggle('light', !isDark)
    localStorage.setItem('fh_theme', isDark ? 'dark' : 'light')
  })
}

// ── Slider-Anzeigewerte ───────────────────────────────────────────────────────
function syncSliderLabels() {
  DOM.m1Value.textContent = `${store.m1.toFixed(2)} kg`
  DOM.m3Value.textContent = `${store.m3.toFixed(2)} kg`
  DOM.m2Value.textContent = `${store.m2.toFixed(2)} kg`
  DOM.pulleyDistValue.textContent = `${store.pulleyDistCm.toFixed(1)} cm`
  DOM.ropeLenValue.textContent = `${store.ropeLenCm.toFixed(1)} cm`
  DOM.m2PlusBtn.disabled = store.m2 >= M2_MAX
  DOM.m2MinusBtn.disabled = store.m2 <= M2_MIN
}

// Dynamische Kopplung: Seillängen-Slider min/max = pulleyDist·[MIN..MAX]-Faktor
function applyRopeLenBounds() {
  const min = store.pulleyDistCm * ROPE_LEN_MIN_FACTOR
  const max = store.pulleyDistCm * ROPE_LEN_MAX_FACTOR
  DOM.ropeLenSlider.min = min
  DOM.ropeLenSlider.max = max
  if (store.ropeLenCm < min) store.ropeLenCm = min
  if (store.ropeLenCm > max) store.ropeLenCm = max
  DOM.ropeLenSlider.value = store.ropeLenCm
}

// ── Auto-Zoom ─────────────────────────────────────────────────────────────────
// Die viewBox umschließt den gezeichneten Inhalt (Massen, Vektoren inkl. Pfeilspitzen,
// Labels) mit Rand-Puffer und ist mindestens SVG_H hoch. Dekoration (Decke, Achsen-
// Legende, Raster) folgt der Ansicht, statt sie zu bestimmen — dadurch füllt die Szene
// die verfügbare Fläche. Oben verankert (xMidYMin), horizontal zentriert; das
// Hereinzoomen wird smooth getweent, das Herauszoomen greift sofort.
const _vb = { x: 0, y: 0, w: SVG_W, h: SVG_H } // aktuell dargestellte viewBox
let _vbAnim = null
// Bezugsgröße für „Zoom: 1,00×": die Ansicht im Reset-Zustand (Standardparameter). Sie
// wird bei jedem Reset neu erfaßt und als Maße (nicht als Skala) gehalten, damit die
// Anzeige beim Ändern der Fenstergröße richtig bleibt.
let _refVb = null
let _captureRef = false

// Ausdehnung des gezeichneten Inhalts.
// Gemessen wird die Root-bbox, aber mit **ausgeblendetem Raster** (B47): das Raster wird
// selbst auf die zuletzt berechnete Ziel-viewBox gezeichnet und trieb als Teil seiner
// eigenen Messgrundlage den Zoom bei jedem Update um AUTOZOOM_MARGIN weiter heraus
// (unbegrenzt, auch durch Reset nicht rückstellbar). `display:none`-Kinder fallen aus der
// Root-bbox heraus — das gilt hier auch für die geparkten Massen ohne Gleichgewicht (B48).
// Wichtig: **nicht** über die Kinder einzeln iterieren — `el.getBBox()` liefert die Box im
// *eigenen* Koordinatensystem, also OHNE das eigene `transform`. Die Massen tragen ihre
// Position genau dort (`translate` in `placeMass`) und fehlten dadurch in der Messung, so
// daß sie unten aus dem Bild ragten. Die Root-bbox rechnet die Kind-Transforms korrekt ein.
// Die Vektor-Gruppe wird zusätzlich um AUTOZOOM_VEC_PAD aufgeblasen, weil getBBox
// Strichbreite und Marker nicht mitmißt (B50).
function contentBBox() {
  // Dekoration (Raster, Decke, Achsen-Legende) richtet sich nach der Ansicht und darf sie
  // deshalb nicht mitbestimmen — für die Messung kurz ausblenden (fällt dann aus der
  // Root-bbox) und danach wiederherstellen.
  const decor = [DOM.gridGroup, DOM.ceiling, DOM.coordGroup]
  const saved = decor.map(el => el.style.display)
  decor.forEach(el => { el.style.display = 'none' })
  let bb = null, vec = null
  try { bb = DOM.mainSvg.getBBox() } catch { /* nicht gerendert */ }
  try { vec = DOM.forceVectorsGroup.getBBox() } catch { /* keine Vektoren */ }
  decor.forEach((el, i) => { el.style.display = saved[i] })
  if (!bb || (!bb.width && !bb.height)) return null
  let x0 = bb.x, y0 = bb.y, x1 = bb.x + bb.width, y1 = bb.y + bb.height
  if (vec && (vec.width || vec.height)) {
    const p = AUTOZOOM_VEC_PAD
    x0 = Math.min(x0, vec.x - p); y0 = Math.min(y0, vec.y - p)
    x1 = Math.max(x1, vec.x + vec.width + p); y1 = Math.max(y1, vec.y + vec.height + p)
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

// Die Ansicht umschließt den Inhalt (nicht mehr zwingend den nominalen 900×500-Rahmen):
// so füllt die Szene die verfügbare Fläche, statt auf die Breite der Dekoration
// aufgebläht zu werden. Oben bleibt sie bei y = 0 verankert (Platz für die Decke).
function targetViewBox() {
  const bb = contentBBox()
  if (!bb) return { x: 0, y: 0, w: SVG_W, h: SVG_H }
  const left = bb.x, right = bb.x + bb.w, bottom = bb.y + bb.h
  // Rand-Puffer wächst mit der Ansicht: in viewBox-Einheiten fix, schrumpft er auf dem
  // Bildschirm mit jedem Herauszoomen (16 Einheiten waren bei 0,34× nur noch ~13 px, der
  // Inhalt klebte am unteren Rand). Über den Zoom-Faktor skaliert bleibt er optisch
  // konstant. Kein Rückkopplungsrisiko: k stammt aus der Inhalts-Ausdehnung, nicht aus
  // der vorigen viewBox.
  const k = Math.max(1, bottom / SVG_H)
  const M = AUTOZOOM_MARGIN * k
  let x = left - M
  let w = (right + M) - x
  let h = Math.max(SVG_H, bottom + M)

  // Auf das Seitenverhältnis des Sim-Feldes aufziehen. Das ändert die Darstellungsgröße
  // **nicht** — `preserveAspectRatio="… meet"` nimmt ohnehin min(cw/w, ch/h), und genau
  // dieses Minimum bleibt gleich (nachgemessen: Szene vorher wie nachher 610×471 px).
  // Es verwandelt aber den bisher ungenutzten Letterbox-Rand in Fläche *innerhalb* der
  // viewBox — dort wohnt die Achsen-Legende, ohne der Szene in die Quere zu kommen.
  // Reicht der so gewonnene Rand nicht für die Legende, wird gezielt nachgelegt.
  const r = DOM.mainSvg.getBoundingClientRect()
  const asp = r.width > 0 && r.height > 0 ? r.width / r.height : w / h
  if (w / h < asp) {
    const w2 = Math.max(h * asp, w + 2 * DECOR_LEGEND_W)
    x -= (w2 - w) / 2
    w = w2
  } else {
    h = Math.max(w / asp, h + DECOR_LEGEND_H)
  }
  return { x, y: 0, w, h, cb: bottom }
}

function setViewBox(v) {
  DOM.mainSvg.setAttribute('viewBox', `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`)
}

// Raster deckt die ganze sichtbare Fläche ab — nur zeichnen, wenn es auch sichtbar ist.
function syncGrid(v) {
  if (DOM.togGrid.checked) drawGrid(v.x, v.y, v.x + v.w, v.y + v.h)
}

// Dekoration (Decke, Achsen-Legende) und Raster auf die Ziel-Ansicht setzen.
function syncDecor(v) {
  layoutDecor(v, v.cb)
  syncGrid(v)
}

// Zoomfaktor: tatsächliche Darstellungsskala relativ zur Standardansicht (<1 = heraus-
// gezoomt). B49: der frühere Vergleich rein der viewBox-Maße mit 900×500 ignorierte, daß
// bei preserveAspectRatio="… meet" je nach Container-Seitenverhältnis die andere Achse
// bindet — eine höhere viewBox ändert dann die Darstellung gar nicht.
function updateZoomReadout() {
  const r = DOM.mainSvg.getBoundingClientRect()
  const cur = Math.min(r.width / _vb.w, r.height / _vb.h)
  const rw = _refVb ? _refVb.w : SVG_W, rh = _refVb ? _refVb.h : SVG_H
  const ref = Math.min(r.width / rw, r.height / rh)
  store.zoomFactor = cur > 0 && ref > 0 ? cur / ref : 1
  if (DOM.zoomReadout) DOM.zoomReadout.textContent = `Zoom: ${store.zoomFactor.toFixed(2).replace('.', ',')}×`
}

function applyAutoZoom() {
  const t = targetViewBox()
  if (_captureRef) { _refVb = { w: t.w, h: t.h }; _captureRef = false }
  syncDecor(t) // erst nach der Messung — Dekoration darf sie nicht beeinflussen (B47)
  // Nichts zu tun, wenn Ziel praktisch schon erreicht. B51: laufenden Tween abbrechen,
  // sonst schreibt er danach weiter auf _vb und überholt den eben gesetzten Wert.
  const near = Math.abs(t.x - _vb.x) < 0.5 && Math.abs(t.w - _vb.w) < 0.5 && Math.abs(t.h - _vb.h) < 0.5
  // HERAUSzoomen greift sofort: beim Reglerziehen kommt alle ~15 ms ein neues Ziel, die
  // über 220 ms geeaste viewBox hinkt dem Inhalt dann dauerhaft hinterher und die unteren
  // Massen stehen währenddessen außerhalb des Bildes. Nur das HEREINzoomen (Inhalt wird
  // kleiner, nichts kann abgeschnitten werden) wird smooth getweent.
  const grows = t.x < _vb.x - 0.5 || t.x + t.w > _vb.x + _vb.w + 0.5 || t.h > _vb.h + 0.5
  if (_vbAnim) { cancelAnimationFrame(_vbAnim); _vbAnim = null }
  if (near || grows) { Object.assign(_vb, t); setViewBox(_vb); updateZoomReadout(); return }
  const start = { ..._vb }
  const t0 = performance.now()
  const ease = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2) // easeInOutQuad
  const step = now => {
    const k = Math.min(1, (now - t0) / AUTOZOOM_DURATION_MS)
    const e = ease(k)
    _vb.x = start.x + (t.x - start.x) * e
    _vb.y = start.y + (t.y - start.y) * e
    _vb.w = start.w + (t.w - start.w) * e
    _vb.h = start.h + (t.h - start.h) * e
    setViewBox(_vb)
    updateZoomReadout()
    _vbAnim = k < 1 ? requestAnimationFrame(step) : null
  }
  _vbAnim = requestAnimationFrame(step)
}

// ── Parameter aus UI lesen ────────────────────────────────────────────────────
function readInputs() {
  store.m1 = parseFloat(DOM.m1Slider.value)
  store.m3 = parseFloat(DOM.m3Slider.value)
  store.pulleyDistCm = parseFloat(DOM.pulleyDistSlider.value)
  // Erst den aktuellen Reglerwert lesen, DANN an die (evtl. neuen) Grenzen klemmen.
  // (Reihenfolge kritisch: applyRopeLenBounds schreibt den Slider zurück — würde man
  //  vorher klemmen, überschriebe es die gerade getätigte Reglerbewegung.)
  store.ropeLenCm = parseFloat(DOM.ropeLenSlider.value)
  applyRopeLenBounds()
  store.showGravity = DOM.togGravity.checked
  store.showTension = DOM.togTension.checked
  store.showComponents = DOM.togComponents.checked
  store.showComponentValues = DOM.togComponentValues.checked
}

// ── Kern-Update: berechnen + rendern ──────────────────────────────────────────
function update() {
  readInputs()
  syncSliderLabels()
  const pulleyDist = store.pulleyDistCm * PIXELS_PER_CM
  const pulleyLeftX = SVG_CENTER_X - pulleyDist / 2
  const pulleyRightX = SVG_CENTER_X + pulleyDist / 2
  const segLenPx = store.ropeLenCm * PIXELS_PER_CM
  store.equilibrium = computeEquilibrium(store.m1, store.m2, store.m3, pulleyLeftX, pulleyRightX, segLenPx)
  updateScene()
  updateAnalysis()
  applyAutoZoom() // nach updateScene: bbox des gezeichneten Inhalts steht fest
}

// ── Reset auf Defaults ────────────────────────────────────────────────────────
function resetSim() {
  DOM.m1Slider.value = M1_DEFAULT
  DOM.m3Slider.value = M3_DEFAULT
  store.m2 = M2_DEFAULT
  DOM.pulleyDistSlider.value = PULLEY_DIST_DEFAULT_CM
  store.pulleyDistCm = PULLEY_DIST_DEFAULT_CM
  applyRopeLenBounds()
  DOM.ropeLenSlider.value = ROPE_LEN_DEFAULT_CM
  DOM.togGravity.checked = false
  DOM.togTension.checked = false
  DOM.togComponents.checked = false
  DOM.togComponentValues.checked = false
  DOM.togGrid.checked = false
  DOM.gridGroup.style.display = 'none'
  _captureRef = true // Standardansicht = Bezug für „1,00×"
  update()
}

// ── Debounce (Slider-Ziehen) ──────────────────────────────────────────────────
function debounce(fn, ms) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms) }
}

// ── Event-Wiring ──────────────────────────────────────────────────────────────
function setupUI() {
  const debouncedUpdate = debounce(update, 15)
  const sliders = [DOM.m1Slider, DOM.m3Slider, DOM.pulleyDistSlider, DOM.ropeLenSlider]
  sliders.forEach(s => s.addEventListener('input', debouncedUpdate))
  const toggles = [DOM.togGravity, DOM.togTension, DOM.togComponents, DOM.togComponentValues]
  toggles.forEach(t => t.addEventListener('change', update))

  // m₂-Stepper (Schritt 0,1, Clamp an Grenzen)
  DOM.m2PlusBtn.addEventListener('click', () => {
    if (store.m2 < M2_MAX) {
      store.m2 = Math.min(parseFloat((store.m2 + M2_STEP).toPrecision(12)), M2_MAX)
      update()
    }
  })
  DOM.m2MinusBtn.addEventListener('click', () => {
    if (store.m2 > M2_MIN) {
      store.m2 = Math.max(parseFloat((store.m2 - M2_STEP).toPrecision(12)), M2_MIN)
      update()
    }
  })

  DOM.togGrid.addEventListener('change', () => {
    // Beim Einschalten auf die aktuelle viewBox zeichnen (im Aus-Zustand wird nicht
    // mitgezeichnet, s. syncGrid).
    if (DOM.togGrid.checked) drawGrid(_vb.x, _vb.y, _vb.x + _vb.w, _vb.y + _vb.h)
    DOM.gridGroup.style.display = DOM.togGrid.checked ? '' : 'none'
  })

  DOM.resetBtn.addEventListener('click', resetSim)

  // Das Aufziehen auf das Feld-Seitenverhältnis (targetViewBox) hängt von der Fenster-
  // größe ab — bei Größenänderung neu bestimmen, damit die Legende im Rand bleibt.
  window.addEventListener('resize', debounce(applyAutoZoom, 120))

  // Einklappbare Analyse-Sidebar
  DOM.analysisToggle?.addEventListener('click', () => {
    const collapsed = DOM.appLayout.classList.toggle('analysis-collapsed')
    DOM.analysisToggle.setAttribute('aria-expanded', String(!collapsed))
  })
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
function init() {
  initDOM()
  setupTheme()
  drawBackground()
  setupUI()
  // Initiale Slider-Attribute (min/max/step) aus Konstanten setzen
  DOM.m1Slider.min = M1_MIN; DOM.m1Slider.max = M1_MAX; DOM.m1Slider.step = M1_STEP
  DOM.m3Slider.min = M3_MIN; DOM.m3Slider.max = M3_MAX; DOM.m3Slider.step = M3_STEP
  DOM.pulleyDistSlider.min = PULLEY_DIST_MIN_CM; DOM.pulleyDistSlider.max = PULLEY_DIST_MAX_CM
  DOM.pulleyDistSlider.step = PULLEY_DIST_STEP_CM
  DOM.ropeLenSlider.step = ROPE_LEN_STEP_CM
  resetSim()
}

init()