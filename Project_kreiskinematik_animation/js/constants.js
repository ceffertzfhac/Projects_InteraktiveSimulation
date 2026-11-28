'use strict'
// Konstanten: Bühnengeometrie, Timing, Kamera, Inhalte. Keine Logik.

// Bühne: 1200×675 (16:9); linke ⅔ = 3D-Bühne, rechte ⅓ = Formelspalte
export const STAGE = { w: 1200, h: 675, split: 800 }

// Timing (Sekunden bei Tempo 1×) und Easing
export const T = { cam: 2.0, draw: 1.4, reveal: 0.7, pop: 0.6, fade: 0.5, move: 1.6 }
export const EASE = {
  cam: 'power2.inOut', reveal: 'power3.out', pop: 'back.out(2.2)', lin: 'none', move: 'power1.inOut',
}

// Kamera: Frontansicht (x rechts, y oben, z aus dem Bildschirm) und „typische Lage“ (E4)
export const CAM_FRONT = { camAz: 0, camEl: 0, camD: 15, camTx: 0, camTy: 0, camTz: 0 }
export const CAM_TYPICAL = { camAz: 36, camEl: 21, camD: 15 }

// Koordinatenachsen: Länge in negativer / positiver Richtung, Teilstriche bei ganzen Zahlen
export const AXIS = { neg: 3, pos: 3.3, ticks: [-3, -2, -1, 1, 2, 3] }

// Größe des Ebenenstücks (Kantenlänge in Längeneinheiten) und Länge des gezeigten n
export const PLANE_SIZE = 3.4
export const N_LEN = 1.3

// Kapitel (Szenen 1–5 des Ablaufskripts, docs/ABLAUFSKRIPT.md); „Durchstich“ = technischer
// Probelauf (FKI2/FKI3, E23), kein Vorspann für die übrigen Kapitel
export const CHAPTERS = [
  { id: 'durchstich', title: 'Durchstich 3D', standalone: true },
  { id: 'normalform', title: 'Normalform der Ebene' },
  { id: 'kreisbahn', title: 'Kreisbahn' },
  { id: 'omega', title: 'Winkelgeschwindigkeit' },
  { id: 'beschleunigung', title: 'Beschleunigung' },
  { id: 'spirale', title: 'Spiralbahn' },
]

// Vektoren mit Beschriftung und Legendeneintrag: Schlüssel → CSS-Farbtoken
export const VECTORS = { n: '--c-n', w: '--c-omega', r: '--c-r' }
