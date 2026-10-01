'use strict'
// Konstanten: Bühnengeometrie, Timing, Inhalte. Keine Logik.

// Bühne: SVG-viewBox 1200×675 (16:9). Sichtfenster der Kamera in SVG-Pixeln.
export const VIEW = { vL: 90, vR: 1110, vT: 120, vB: 600 }
// Lage der Zahlengeraden: Anteil der Sichthöhe von unten (Platz für Folienkarten oben)
export const AXIS_FRAC = 0.32

// Timing (Sekunden bei Tempo 1×) und Easing — Material-nahe Kurven
export const T = { draw: 1.1, cam: 1.3, reveal: 0.6, pop: 0.6 }
export const EASE = { cam: 'power2.inOut', reveal: 'power3.out', pop: 'back.out(2.2)' }

// Inhalt der Beispiel-Animation
export const VALUE_TEXTS = ['2', '2,0']     // grob → fein; Szene speichert nur Indizes
export const START_WIDTH = 2.5               // sichtbare Breite der Zahlengeraden (Welt)
