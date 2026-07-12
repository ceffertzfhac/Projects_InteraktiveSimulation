export const G = 9.81;
export const TIME_STEP = 1 / 60;

export const CEILING_H    = 10;
export const PULLEY_X     = 200;
export const PULLEY_R     = 40;
export const PULLEY_Y     = CEILING_H + PULLEY_R;   // 50

export const APERTURE_THICK  = 7.5;
export const APERTURE_GAP    = 10;
export const APERTURE_HOLE_W = 8;

export const PPM         = 100;   // pixels per meter
export const PPN         = 1.5;   // pixels per newton
export const MASS_BASE   = 30;
export const MASS_FACTOR = 2.5;
export const CM_PER_M    = 100;
export const Y_MAX_CM    = 350;

// SVG y where physics y=0 starts (bottom of aperture)
export const Y_APERTURE_BOTTOM = PULLEY_Y + PULLEY_R + APERTURE_GAP + APERTURE_THICK; // 107.5

// SVG y of floor
export const Y_FLOOR_SVG = Y_APERTURE_BOTTOM + (Y_MAX_CM / CM_PER_M) * PPM; // 457.5

// Rope x attachment points (tangent to pulley sides)
export const X_LEFT  = PULLEY_X - PULLEY_R; // 160
export const X_RIGHT = PULLEY_X + PULLEY_R; // 240

// Stopwatch position inside main SVG (in local pre-scale coords, center at 0,0)
export const SW_TRANSFORM = 'translate(340, 55) scale(0.7)';
export const SW_RADIUS    = 60;
export const SW_HAND_LEN  = 50;
