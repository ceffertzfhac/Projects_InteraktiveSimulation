'use strict'

/**
 * @module lineal/constants
 * Konstanten (SI) und UI-Grenzen des schwingenden Lineals. Keine veränderlichen
 * Werte — mutabler Laufzeit-State lebt ausschließlich in `state.js` (store).
 */

// ── Physikalische Konstanten ──────────────────────────────────────────────────
export const G = 9.81            // m/s² — Erdbeschleunigung

// ── Precompute ────────────────────────────────────────────────────────────────
export const DT = 0.01          // s — feste Schrittweite der Zeitreihen
export const PERIODS_SHOWN = 6   // angezeigte Schwingungsperioden (Fenster = N·T)
export const T_WINDOW_MIN = 3    // s — unterer Fenster-Plafond
export const AUTO_STOP_T = 8     // s — Auto-Stopp-Modus: Wiedergabe endet hier (kein Loop)
export const T_WINDOW_MAX_CONT = 600 // s — Kontinuierlich-Modus: Obergrenze des skalierenden Fensters

// ── Slider-Grenzen (UI-Einheiten: cm, °, g) ────────────────────────────────────
export const A_MIN = 1.0, A_MAX = 14.0, A_DEFAULT = 1.9    // Lochposition (Kante→Loch) [cm]
export const L_MIN = 30.0, L_MAX = 40.0, L_DEFAULT = 32.0  // Lineallänge [cm]
export const B_MIN = 1.0, B_MAX = 6.0,  B_DEFAULT = 3.7    // Linealbreite [cm]
export const PHI0_MIN = 5, PHI0_MAX = 90, PHI0_DEFAULT = 20 // Anfangsauslenkung [°]
export const M_MIN = 1.0, M_MAX = 50.0, M_DEFAULT = 8.5    // Masse [g]

// ── Animationsfläche (viewBox 0 0 900 500; Simulation links 0–430) ────────────
export const PPM = 520           // px pro Meter
export const PIVOT_X = 215       // px — Drehpunkt (Achse durch das Loch)
export const PIVOT_Y = 95        // px — Drehpunkt nahe oberem Rand
export const RULER_RX = 4        // px — Eckradius des Lineals
export const HOLE_R = 4          // px — Loch-Radius am Drehpunkt

// Vektor-Skalierung (nur Darstellung)
// Alle Vektoren werden mit store.vecScale (Slider 0,5×–4×) multipliziert.
// F_G dient als Referenz: |F_G| = m·g entspricht exakt GRAV_VEC_LEN px bei 1×.
// Die übrigen Kraftvektoren sind auf m·g bezogen (massenunabhängige Verhältnisse).
// a und F_ges = m·a sind auf die Maximal-Beschleunigung des Fensters bezogen
// (|a| = store.aMax → ACC_REF_LEN px): die Pendel-Beschleunigung ist klein
// (≈ 0,2 g), bei g-Bezug wäre der Vektor kürzer als die Pfeilspitze.
export const PIXELS_PER_VEL = 70          // px pro (m/s) — Bahngeschwindigkeit des Schwerpunkts
export const GRAV_VEC_LEN = 48            // px — Referenzlänge: |F_G| = m·g bei vecScale = 1
export const ACC_REF_LEN  = 48            // px — Referenzlänge: |a| = store.aMax bei vecScale = 1
export const VEC_MARKER_LEN = 12.5        // px = markerWidth(5) · strokeWidth(2.5)

// Vektor-Skalierungsfaktor (UI-Einheit: ×, Referenz = 1)
export const VEC_SCALE_MIN = 0.5, VEC_SCALE_MAX = 4.0, VEC_SCALE_DEFAULT = 1.0

// ── Diagrammfläche (Graph-Gruppe bei translate(450,45)) ───────────────────────
export const GRAPH_W = 420
export const GRAPH_H = 410

// ── Diagramm-Optionen (Nutzerperspektive; <i> für Symbole) ────────────────────
// Schlüssel = store.graphType. 'symmetric' → Ordinate um 0 (Abszisse am Nulldurchgang).
export const GRAPH_OPTIONS = {
  phi:    { title: 'Auslenkung vs. Zeit φ(t)',     yLabel: 'φ / °',        unit: '°',     symmetric: true,  keys: ['phi'] },
  omega:  { title: 'Winkelgeschwindigkeit ω(t)',   yLabel: 'ω / (rad/s)',  unit: 'rad/s', symmetric: true,  keys: ['omega'] },
  alpha:  { title: 'Winkelbeschleunigung α(t)',    yLabel: 'α / (rad/s²)', unit: 'rad/s²',symmetric: true,  keys: ['alpha'] },
  energy: { title: 'Energie vs. Zeit E(t)',        yLabel: 'E / µJ',       unit: 'µJ',    symmetric: false, keys: ['ekin', 'epot', 'eges'] },
  forces: { title: 'Kraftbeträge vs. Zeit |F|(t)', yLabel: '|F| / mN',     unit: 'mN',    symmetric: false, keys: ['fgrav', 'fnorm', 'fges', 'fsusp'] },
}

// Kurztitel je Typ (letztes Symbol kursiv via setGraphTitle)
export const GRAPH_TITLES = {
  phi:    'Auslenkung vs. Zeit φ(t)',
  omega:  'Winkelgeschwindigkeit vs. Zeit ω(t)',
  alpha:  'Winkelbeschleunigung vs. Zeit α(t)',
  energy: 'Energie vs. Zeit E(t)',
  forces: 'Kraftbeträge vs. Zeit |F|(t)',
}

// Energie-Linienfarben (colorblind-safe: Blau / Orange / Mint)
export const ENERGY_COLORS = { ekin: '--c-vel', epot: '--c-fn', eges: '--accent' }
export const ENERGY_LABELS = {
  ekin: 'Kinetische Energie E_kin',
  epot: 'Potentielle Energie E_pot',
  eges: 'Gesamtenergie E_ges',
}

// Kraftbetrags-Kurven (Farben = Vektorfarben der Szene)
export const FORCE_COLORS = { fgrav: '--c-fg', fnorm: '--c-fn', fges: '--c-fr', fsusp: '--c-epot' }
export const FORCE_LABELS = {
  fgrav: 'Schwerkraft |F_G|',
  fnorm: 'Längskraft |F_N|',
  fges:  'Resultierende |F_ges|',
  fsusp: 'Kraft auf Aufhängung |F_Aufh|',
}