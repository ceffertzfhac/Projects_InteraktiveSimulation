export const G = 9.81;
export const PIXELS_PER_METER = 13;
export const PIXELS_PER_VEL = 4;
export const PIXELS_PER_ACC = 5;
export const VEL_THRESHOLD = 0.1;

export const GROUND_PX = 440;
export const BALL_X = 136;
export const WATCH_CX = 280;
export const WATCH_CY = 120;
export const WATCH_R = 72;
export const SDIAL_CX = 280;
export const SDIAL_CY = 150;
export const SDIAL_R = 16;
export const GRAPH_W = 480;
export const GRAPH_H = 410;
export const GRAPH_H_STACKED = 210;
export const GRAPH_SINGLE_TRANSLATE = { x: 400, y: 40 };
export const GRAPH_STACKED_TOP_TRANSLATE = { x: 400, y: 20 };
export const GRAPH_STACKED_BOTTOM_TRANSLATE = { x: 400, y: 255 };

// Diagramm-Typ-Optionen (kanonisch, → BACKLOG I12 Sidebar-Schule). Labels aus
// Nutzerperspektive; Schlüssel stimmen mit graphType/render.js überein.
export const GRAPH_OPTIONS = {
  weg:    { label: 'Weg-Zeit' },
  geschw: { label: 'Geschwindigkeit-Zeit' },
  beschl: { label: 'Beschleunigung-Zeit' },
};
