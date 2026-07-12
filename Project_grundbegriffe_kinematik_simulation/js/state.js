'use strict'

import { TA_DEFAULT, TB_DEFAULT } from './constants.js'

// ── Mutierbarer Zustand (einzige Quelle für alle veränderlichen Werte) ───────
export const store = {
  tA: TA_DEFAULT,
  tB: TB_DEFAULT,

  // Toggles (Default wie Original: nur die ganze Strecke sichtbar)
  toggles: {
    pathBg: true,
    sA: false,
    sB: false,
    verschiebung_BA: false,
    verschiebung_AB: false,
    abstand: false,
    weg: false,
  },

  // Bugfix ggü. Original: dort war „welche Erklär-Variante ist gerade
  // sichtbar" nur implizit über DOM-display-Styles erkennbar. Jetzt einzige
  // Quelle der Wahrheit, von Hover/Click/Leave synchron gehalten.
  currentVariant: 'default',

  // Feste Bahnkurve (einmalig berechnet, ändert sich nie) + Achsen-Grenzen
  // (Original: setupScales() bei jedem drawScene() neu berechnet — liefert
  // wegen fester Kurve stets denselben Wert, daher hier einmalig in init()).
  path: null,        // { t, x, y, cumulative_s, yMax }
  xMaxBound: 1,
  yMaxBound: 1,

  // Von tA/tB abgeleitet (bei jeder Reglerbewegung neu berechnet)
  ab: null,         // { indexA, indexB, x_A, y_A, x_B, y_B, deltaS_mag, s_AB_length }

  isDarkMode: false,
}

// ── DOM-Cache ────────────────────────────────────────────────────────────────
export const DOM = {}

const q = id => document.getElementById(id)

export function initDOM() {
  // SVG-Grundelemente
  DOM.graphSvg = q('graph_svg')
  DOM.gridGroup = q('grid_group')
  DOM.plotArea = q('plot_area')

  // Steuerung (linke Sidebar)
  DOM.tASlider = q('tA_slider'); DOM.tAValue = q('tA_value')
  DOM.tBSlider = q('tB_slider'); DOM.tBValue = q('tB_value')

  DOM.controls = {
    pathBg: q('control_path_bg'),
    sA: q('control_sA'),
    sB: q('control_sB'),
    verschiebung_BA: q('control_verschiebung_BA'),
    verschiebung_AB: q('control_verschiebung_AB'),
    abstand: q('control_abstand'),
    weg: q('control_weg'),
  }
  DOM.toggles = {
    pathBg: q('toggle_path_bg'),
    sA: q('toggle_sA'),
    sB: q('toggle_sB'),
    verschiebung_BA: q('toggle_verschiebung_BA'),
    verschiebung_AB: q('toggle_verschiebung_AB'),
    abstand: q('toggle_abstand'),
    weg: q('toggle_weg'),
  }
  DOM.values = {
    sA: q('val_sA'),
    sB: q('val_sB'),
    verschiebung_BA: q('val_verschiebung_BA'),
    verschiebung_AB: q('val_verschiebung_AB'),
    abstand: q('val_abstand'),
    weg: q('val_weg'),
  }

  // Rechte Analyse-Sidebar: 8 statische Erklär-Varianten
  DOM.analysisVariants = {}
  for (const key of ['default', 'sA', 'sB', 'verschiebung_BA', 'verschiebung_AB', 'abstand', 'weg', 'pathBg']) {
    DOM.analysisVariants[key] = q('analysis_' + key)
  }

  // Topbar & Layout
  DOM.resetBtn = q('reset_btn')
  DOM.themeToggle = q('theme_toggle')
  DOM.appLayout = q('app_layout')
  DOM.analysisToggle = q('analysis_toggle')
}
