'use strict'
// Konstanten: Bühnengeometrie, Timing, Inhalte. Keine Logik.

// Bühne: SVG-viewBox 1200×675 (16:9); linke ⅔ = 3D-Bühne, rechte ⅓ = Formelspalte
export const STAGE = { w: 1200, h: 675, split: 800 }

// Timing (Sekunden bei Tempo 1×) und Easing
export const T = { cam: 1.8, draw: 1.2, reveal: 0.6, pop: 0.6, fade: 0.5 }
export const EASE = { cam: 'power2.inOut', reveal: 'power3.out', pop: 'back.out(2.2)', lin: 'none' }

// Kapitel (Szenen 1–5 des Ablaufskripts, docs/ABLAUFSKRIPT.md)
export const CHAPTERS = [
  { id: 'normalform', title: 'Normalform der Ebene' },
  { id: 'kreisbahn', title: 'Kreisbahn' },
  { id: 'omega', title: 'Winkelgeschwindigkeit' },
  { id: 'beschleunigung', title: 'Beschleunigung' },
  { id: 'spirale', title: 'Spiralbahn' },
]
