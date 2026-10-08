'use strict'

// Busfahrt der Linie 42 — portiert aus der Aspekt-Figur Abb. 1.2 des
// Interaktiven Skripts (src/figures/bus_weg_zeit/). Datenquelle der Kurve ist
// das matplotlib-Notebook weg_zeit_diagramm_bushaltestellen.ipynb; die dort
// randomisierten Halte-/Fahrtdauern sind wie in der Skript-Figur angepinnt.

// ── Zeit ───────────────────────────────────────────────────────────────────────
export const T_MAX = 400        // s — Fahrtverlauf 0 … 400 s
export const DT    = 0.25       // s — Abtastung je Bewegungsphase in precompute()

// ── Haltestellen ───────────────────────────────────────────────────────────────
export const STOP_POSITIONS = [0, 500, 1000, 1500]   // m
export const STOP_LABELS    = ['H1', 'H2', 'H3', 'H4']
export const X_MAX = 1500                            // m — Streckenende (H4)

// ── Fahrplan: Halte (x konstant) + Fahrten mit Trapez-Geschwindigkeitsprofil ───
// Je Fahrt: ACCEL_RATIO der Dauer beschleunigen, Rest−2·ACCEL_RATIO konstant,
// ACCEL_RATIO bremsen; v_max = Δx / ((1 − r)·Δt). Summe der Dauern = 400 s.
export const ACCEL_RATIO = 0.3
export const SEGMENTS = [
  { type: 'halt',  tStart:   0, tEnd:  30, xStart:    0, xEnd:    0 },
  { type: 'fahrt', tStart:  30, tEnd: 120, xStart:    0, xEnd:  500 },
  { type: 'halt',  tStart: 120, tEnd: 155, xStart:  500, xEnd:  500 },
  { type: 'fahrt', tStart: 155, tEnd: 240, xStart:  500, xEnd: 1000 },
  { type: 'halt',  tStart: 240, tEnd: 275, xStart: 1000, xEnd: 1000 },
  { type: 'fahrt', tStart: 275, tEnd: 370, xStart: 1000, xEnd: 1500 },
  { type: 'halt',  tStart: 370, tEnd: 400, xStart: 1500, xEnd: 1500 },
]

// ── Diagramm-Typen (Picker in der linken Sidebar, §3/I12) ──────────────────────
export const GRAPH_OPTIONS = {
  ort:    { label: 'Ort-Zeit x(t)',              axis: 'x / m',      unit: 'm',    title: 'Ort-Zeit-Diagramm x(t)' },
  geschw: { label: 'Geschwindigkeit-Zeit v(t)',  axis: 'v / (m/s)',  unit: 'm/s',  title: 'Geschwindigkeit-Zeit-Diagramm v(t)' },
  beschl: { label: 'Beschleunigung-Zeit a(t)',   axis: 'a / (m/s²)', unit: 'm/s²', title: 'Beschleunigung-Zeit-Diagramm a(t)' },
}

// ── Geometrie (eine SVG, viewBox 0 0 900 480) ──────────────────────────────────
// Links die senkrecht gestellte Straße, rechts das Diagramm. Straße und
// Ordinate des Ort-Zeit-Diagramms teilen sich denselben Maßstab und dieselbe
// Höhe: der Schwerpunkt des Busses (Kreuz, Busmitte) liegt pixelgenau auf der
// Höhe des Kurvenpunkts x(t) — der Bus wird als Massepunkt betrachtet.
export const VIEW_W = 900
export const VIEW_H = 480

export const GRAPH_X = 270      // px — Ursprung der Diagrammgruppe (translate)
export const GRAPH_Y = 50
export const GRAPH_W = 560      // px — Breite inkl. Achsenpfeil
export const GRAPH_H = 380      // px
export const PLOT_W  = GRAPH_W - 20          // Datenbereich in t
export const PLOT_BOTTOM = GRAPH_H - 10      // group-lokal, unterer Plot-Rand
export const PLOT_TOP    = 20                // group-lokal, oberer Plot-Rand

export const T_TICK_STEP = 50   // s
export const X_TICK_STEP = 250  // m

// Straße (senkrecht: x = 0 unten, x = 1500 oben)
export const ROAD_X      = 150                       // px — Mittellinie
export const ROAD_HALF_W = 18                        // px
export const STREET_Y0   = GRAPH_Y + PLOT_BOTTOM     // Bildschirm-y bei x = 0 m
export const STREET_LEN  = PLOT_BOTTOM - PLOT_TOP    // px für 0 … 1500 m
export const BUS_LEN     = 44   // px — entlang der Fahrtrichtung
export const BUS_WID     = 30   // px — quer
// Der Bus hält mit dem Schwerpunkt an Hx und ragt dort um BUS_LEN/2 über die
// Haltestelle hinaus — das Band reicht deshalb unter H1 und über H4 hinaus.
export const ROAD_TOP    = STREET_Y0 - STREET_LEN - BUS_LEN / 2 - 4
export const ROAD_BOTTOM = STREET_Y0 + BUS_LEN / 2 + 4
export const CROSS_R     = 4.8  // px — halbe Armlänge des (diagonalen) Schwerpunkt-Kreuzes

// ── Abspieltempo (400 s Fahrt in Echtzeit wären zu lang) ───────────────────────
export const SPEED_DEFAULT = 12
