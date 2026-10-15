'use strict'
// Konstanten: Bühnengeometrie, Timing, Layout. Keine Logik.

// Bühne: SVG-viewBox 1200×675 (16:9). Das linke Zweidrittel (x < 800) gehört der Grafik,
// rechts liegt die Erläuterungsspalte (HTML, css/styles.css). Sichtfenster der Kamera:
export const VIEW = { vL: 70, vR: 750, vT: 40, vB: 640 }
// Zahlengerade: y = 330 → Anteil der Sichthöhe von unten
export const AXIS_Y = 330
export const AXIS_FRAC = (VIEW.vB - AXIS_Y) / (VIEW.vB - VIEW.vT)

// Sichtbereich der Zahlengeraden (Welt = g in m/s²)
export const CENTER = 9.3
export const START_WIDTH = 6.4

// Timing (Sekunden bei Tempo 1×) und Easing
export const T = { draw: 1.1, cam: 1.4, reveal: 0.6, pop: 0.5, dot: 0.45, move: 1.2 }
export const EASE = { cam: 'power2.inOut', reveal: 'power3.out', pop: 'back.out(2.2)' }

// Punkte-Reihen (Punktdiagramm über der Geraden)
export const DOT = { r0: 14, r1: 7, row0: 30, row1: 17, base: 18 }
export const STACK_DIST = [0.27, 0.14]    // Mindestabstand (Welt) für die ersten 10 / die übrigen

// Diagramm unten links
export const PLOT = { x0: 140, x1: 735, y0: 440, y1: 600 }
