'use strict';

// Physikalische Konstanten
export const G = 9.81;
export const TIME_STEP = 1 / 60;

// Szene-Geometrie (wie Project_atwood_simulation — identische Atwood-Maschine)
export const CEILING_H    = 10;
export const PULLEY_X     = 200;
export const PULLEY_R     = 40;
export const PULLEY_Y     = CEILING_H + PULLEY_R;   // 50

export const APERTURE_THICK  = 7.5;
export const APERTURE_GAP    = 10;
export const APERTURE_HOLE_W = 8;

export const PPM         = 100;   // Pixel pro Meter
export const PPN         = 1.5;   // Pixel pro Newton
export const MASS_BASE   = 30;
export const MASS_FACTOR = 2.5;
export const CM_PER_M    = 100;
export const Y_MAX_CM    = 350;

// SVG-y, ab dem physikalisch y=0 beginnt (Blendenunterkante)
export const Y_APERTURE_BOTTOM = PULLEY_Y + PULLEY_R + APERTURE_GAP + APERTURE_THICK; // 107.5

// SVG-y des Bodens
export const Y_FLOOR_SVG = Y_APERTURE_BOTTOM + (Y_MAX_CM / CM_PER_M) * PPM; // 457.5

// Seil-Befestigungspunkte (Tangenten an den Rollen-Seiten)
export const X_LEFT  = PULLEY_X - PULLEY_R; // 160
export const X_RIGHT = PULLEY_X + PULLEY_R; // 240

// Stoppuhr-Position im Haupt-SVG (lokal pre-scale, Zentrum 0,0)
export const SW_TRANSFORM = 'translate(340, 55) scale(0.7)';
export const SW_RADIUS    = 60;
export const SW_HAND_LEN  = 50;

// Diagramm-Geometrie — I9: Zweier-Diagramme orthogonal zur Sim/Diagramm-Aufteilung.
// Landscape = Übereinander-Layout (breit-flache Diagrammzelle),
// Portrait  = Nebeneinander-Layout (hohe schmale Diagrammzelle).
export const LAND_W        = 840;   // Landscape Einzel-Breite (FAE13: +20 % Abszissenbreite)
export const LAND_H        = 410;   // Landscape Einzel-Höhe
export const PORT_W        = 590;   // Portrait Einzel-Breite (FAE13: +20 % Abszissenbreite)
export const PORT_H_SINGLE = 700;   // Portrait Einzel-Höhe
export const PORT_SLOT_DUAL = 345;  // Portrait Zweier-Teilhöhe (gestapelt)
export const DUAL_GAP     = 20;     // Lücke zwischen den beiden Teilgraphen