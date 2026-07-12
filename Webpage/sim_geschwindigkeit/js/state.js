'use strict'

import { DEFAULT_FUNC, T0_DEFAULT, DELTA_DEFAULT } from './constants.js'

// ── Mutierbarer Zustand (einzige Quelle für alle veränderlichen Werte) ───────
export const store = {
  // Parameter (Eingaben)
  funcKey: DEFAULT_FUNC,
  t0: T0_DEFAULT,            // Stützstelle
  delta: DELTA_DEFAULT,      // Δt (vorzeichenbehaftet)
  centered: true,            // zentrierter (symmetrischer) Modus vs. vorwärts

  // Visualisierungs-Toggles (Original-Default: beide aus — didaktisch schrittweise
  // vom Schüler zugeschaltet, nicht vorab alles zeigen)
  showTangent: false,
  showSecant: false,

  // Abgeleiteter/berechneter Zustand
  curve: { ts: [], xs: [] }, // abgetastete Ort-Zeit-Kurve
  xMin: -1, xMax: 1,         // automatische Ordinaten-Grenzen (mit Rand)
  analysis: null,            // { t0,x0,t1,x1,t2,x2,dt,dx,mSec,mTan }

  isDarkMode: false,
}

// ── DOM-Cache ────────────────────────────────────────────────────────────────
export const DOM = {}

const q = id => document.getElementById(id)

export function initDOM() {
  // SVG-Grundelemente
  DOM.graphSvg = q('graph_svg')
  DOM.gridGroup = q('grid_group')
  DOM.plotClipRect = q('plot_clip_rect')
  DOM.funcLine = q('func_line')
  DOM.tangentLine = q('tangent_line')
  DOM.secantLine = q('secant_line')
  DOM.triH = q('tri_h')
  DOM.triV = q('tri_v')
  DOM.p1Dot = q('p1_dot')
  DOM.p2Dot = q('p2_dot')
  DOM.point = q('point')
  DOM.dtText = q('dt_text')
  DOM.dxText = q('dx_text')
  DOM.secSlopeText = q('sec_slope_text')
  DOM.tanSlopeText = q('tan_slope_text')
  DOM.titleFo = q('graph_title_fo')

  // Statische MathJax-Varianten (Titel: Funktionsgleichung)
  DOM.titleVariants = {
    gerade: q('title_gerade'),
    parabel: q('title_parabel'),
    komplex: q('title_komplex'),
  }
  // Panel: Differenzenquotient (zentriert/vorwärts) + x/v je Funktion
  DOM.diffqVariants = {
    centered: q('diffq_centered'),
    forward: q('diffq_forward'),
  }
  DOM.panelFuncVariants = {
    gerade: q('pf_gerade'),
    parabel: q('pf_parabel'),
    komplex: q('pf_komplex'),
  }

  // Steuerung (linke Sidebar)
  DOM.funcRadios = Array.from(document.querySelectorAll('input[name="func"]'))
  DOM.t0Slider = q('t0_slider')
  DOM.t0Value = q('t0_value')
  DOM.t0StepDown = q('t0_step_down')
  DOM.t0StepUp = q('t0_step_up')
  DOM.deltaSlider = q('delta_slider')
  DOM.deltaValue = q('delta_value')
  DOM.togTangent = q('toggle_tangent')
  DOM.togSecant = q('toggle_secant')
  DOM.togCentered = q('toggle_centered')

  // Analyse-Panel (rechts)
  DOM.anT0 = q('an_t0')
  DOM.anDeltaT = q('an_delta_t')
  DOM.anDx = q('an_dx')
  DOM.anMSec = q('an_msec')
  DOM.anMTan = q('an_mtan')
  DOM.anDiff = q('an_diff')

  // Topbar & Layout
  DOM.resetBtn = q('reset_btn')
  DOM.themeToggle = q('theme_toggle')
  DOM.appLayout = q('app_layout')
  DOM.analysisToggle = q('analysis_toggle')
}
