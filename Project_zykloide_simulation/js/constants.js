'use strict'

// ── Physik ──────────────────────────────────────────────────────────────────
export const TIME_STEP = 1 / 60          // Physik-Zeitschritt (60 Hz)
export const SIM_DURATION = 60           // Simulationsdauer (s)
export const DIAGRAM_WINDOW_S = 10       // Zeitfenster im Diagramm (s)
export const POINT_RADIUS_FACTOR = 0.9   // r = 0,9 · R (fest, wie v2.8-Prototyp)

// ── Pixel-Skalierung ─────────────────────────────────────────────────────────
export const PIXELS_PER_METER = 200
export const V_VECTOR_SCALE = 50         // px pro (m/s) für Geschw.-Vektoren
export const A_VECTOR_SCALE = 50         // px pro (m/s²) für Beschl.-Vektoren

// ── Animations-Layout (SVG-Koordinaten) ──────────────────────────────────────
export const ANIM_W = 400                // Animationsfeldbreite
export const GROUND_PX = 350             // Bodenlinie (y-Koordinate)
export const START_OFFSET_PX = 50        // Start-x des Schwerpunkts

// ── Diagramm-Geometrie ───────────────────────────────────────────────────────
export const GRAPH_W = 440
export const GRAPH_H = 410
export const GRAPH_TRANSLATE = { x: 440, y: 40 }

// ── Subjekte & Größen ────────────────────────────────────────────────────────
export const subjects = ['sp', 'p1', 'p2', 'p3', 'p4']
export const quantities = ['x', 'y', 'vx', 'vy', 'vabs', 'ax', 'ay', 'aabs']

export const subjectLabels = {
  sp: 'Schwerpunkt (SP)',
  p1: 'Punkt 1', p2: 'Punkt 2', p3: 'Punkt 3', p4: 'Punkt 4',
}

// CSS-Var je Subjekt (var() funktioniert als CSS-Regel, nicht als SVG-Attribut)
export const subjectColorVar = {
  sp: '--c-sp', p1: '--c-p1', p2: '--c-p2', p3: '--c-p3', p4: '--c-p4',
}

// Anfangswinkel der Punkte auf dem inneren Kreis (θ₀)
export const initialAngles = { p1: 0, p2: Math.PI / 2, p3: Math.PI, p4: 3 * Math.PI / 2 }

// Einheiten je Größe (für CSV-Header & Live-Panel)
export const quantityUnits = {
  x: 'm', y: 'm',
  vx: 'm/s', vy: 'm/s', vabs: 'm/s',
  ax: 'm/s²', ay: 'm/s²', aabs: 'm/s²',
}

// ── Diagramm-Optionen (Nutzerperspektive, HTML-kodiert mit <i> für Symbole) ──
export const graphOptions = {
  'Position': {
    x: 'x-Position <i>x</i>(<i>t</i>) / m',
    y: 'y-Position <i>y</i>(<i>t</i>) / m',
  },
  'Geschwindigkeit': {
    vx: 'Geschw. <i>v</i>ₓ(<i>t</i>) / (m/s)',
    vy: 'Geschw. <i>v</i>ᵧ(<i>t</i>) / (m/s)',
    vabs: 'Betrag |<i>v</i>(<i>t</i>)| / (m/s)',
  },
  'Beschleunigung': {
    ax: 'Beschl. <i>a</i>ₓ(<i>t</i>) / (m/s²)',
    ay: 'Beschl. <i>a</i>ᵧ(<i>t</i>) / (m/s²)',
    aabs: 'Betrag |<i>a</i>(<i>t</i>)| / (m/s²)',
  },
}

// Kurze Titel je Größe (Graph-Titel, TextContent)
export const graphTitles = {
  x: 'x-Position vs. Zeit',
  y: 'y-Position vs. Zeit',
  vx: 'Geschw. vx vs. Zeit',
  vy: 'Geschw. vy vs. Zeit',
  vabs: 'Geschwindigkeitsbetrag vs. Zeit',
  ax: 'Beschl. ax vs. Zeit',
  ay: 'Beschl. ay vs. Zeit',
  aabs: 'Beschleunigungsbetrag vs. Zeit',
}