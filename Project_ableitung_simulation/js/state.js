'use strict'

import { DEFAULT_FUNC, X0_DEFAULT, DELTA_DEFAULT } from './constants.js'

// ── Mutierbarer Zustand (einzige Quelle für alle veränderlichen Werte) ───────
export const store = {
  // Parameter (Eingaben)
  funcKey: DEFAULT_FUNC,
  x0: X0_DEFAULT,            // Stützstelle
  delta: DELTA_DEFAULT,      // Abstand δ
  centered: true,            // zentrierter (symmetrischer) Modus vs. vorwärts

  // Visualisierungs-Toggles (Default: sichtbar — didaktischer Kern beim Start)
  showTangent: true,
  showSecant: true,
  showDeltaValues: true,   // Δx-/Δy-Werte am Steigungsdreieck
  showSecantSlope: true,   // Sekantensteigung als Readout im Diagramm
  showTangentSlope: true,  // Tangentensteigung als Readout im Diagramm

  // Abgeleiteter/berechneter Zustand
  curve: { xs: [], ys: [] }, // abgetastete Funktionskurve
  yMin: -1, yMax: 1,         // automatische Ordinaten-Grenzen (mit Rand)
  analysis: null,            // { x0,y0,x1,y1,x2,y2,dx,dy,mSec,mTan }

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
  DOM.dxText = q('dx_text')
  DOM.dyText = q('dy_text')
  DOM.secSlopeText = q('sec_slope_text')
  DOM.tanSlopeText = q('tan_slope_text')
  DOM.titleFo = q('graph_title_fo')

  // Statische MathJax-Varianten (Titel: Funktionsgleichung)
  DOM.titleVariants = {
    gerade: q('title_gerade'),
    parabel: q('title_parabel'),
    kubisch: q('title_kubisch'),
    komplex: q('title_komplex'),
  }
  // Panel: Differenzenquotient (zentriert/vorwärts) + f/f' je Funktion
  DOM.diffqVariants = {
    centered: q('diffq_centered'),
    forward: q('diffq_forward'),
  }
  DOM.panelFuncVariants = {
    gerade: q('pf_gerade'),
    parabel: q('pf_parabel'),
    kubisch: q('pf_kubisch'),
    komplex: q('pf_komplex'),
  }

  // Steuerung (linke Sidebar)
  DOM.funcSelect = q('func_select')
  DOM.x0Slider = q('x0_slider')
  DOM.x0Value = q('x0_value')
  DOM.deltaSlider = q('delta_slider')
  DOM.deltaValue = q('delta_value')
  DOM.togTangent = q('toggle_tangent')
  DOM.togSecant = q('toggle_secant')
  DOM.togCentered = q('toggle_centered')
  DOM.togDeltaValues = q('toggle_delta_values')
  DOM.togSecantSlope = q('toggle_secant_slope')
  DOM.togTangentSlope = q('toggle_tangent_slope')

  // Analyse-Panel (rechts)
  DOM.anX0 = q('an_x0')
  DOM.anDx = q('an_dx')
  DOM.anDy = q('an_dy')
  DOM.anMSec = q('an_msec')
  DOM.anMTan = q('an_mtan')
  DOM.anDiff = q('an_diff')

  // Topbar & Layout
  DOM.resetBtn = q('reset_btn')
  DOM.themeToggle = q('theme_toggle')
  DOM.appLayout = q('app_layout')
  DOM.analysisToggle = q('analysis_toggle')
}
