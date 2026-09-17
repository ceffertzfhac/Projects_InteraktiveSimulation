'use strict'

// ── Konfiguration: „Die Integration als Grenzwert" ────────────────────────────
// Schwester-Simulation zu „Die Ableitung als Grenzwert" (Project_ableitung_*):
// dort nähert sich die Sekante mit δ → 0 der Tangente, hier nähern sich Unter-
// und Obersumme mit n → ∞ dem bestimmten Integral. Anders als die Ableitungs-Sim
// ist dies KEIN reines Werkzeug (§7), sondern eine volle Sim-Schale mit
// Verfeinerungs-Animation: der „Zeit"-Parameter der Animation ist die Stufe der
// Zerlegungsfolge N_SEQUENCE (Play läuft n = 1 → 200 hoch).

// ── Definitionsbereich der dargestellten Funktionen ───────────────────────────
export const X_MIN = 0
export const X_MAX = 10
export const NUM_POINTS = 700          // Abtastpunkte der Funktionskurve

// ── Integrationsgrenzen a, b (Slider) ─────────────────────────────────────────
export const A_MIN = 0, A_MAX = 9.5
export const B_MIN = 0.5, B_MAX = 10
export const AB_STEP = 0.1
export const AB_MIN_WIDTH = 0.5        // b − a darf nie kleiner werden
export const A_DEFAULT = 1
export const B_DEFAULT = 8

// ── Zerlegung (Streifenzahl n) ────────────────────────────────────────────────
export const N_MIN = 1, N_MAX = 200, N_DEFAULT = 6

// Verfeinerungs-Animation: Stufenfolge, die Play hochläuft. Bewußt grob-
// logarithmisch (nicht 1,2,3,…,200) — der Grenzübergang ist ein Effekt der
// Größenordnung von n, nicht der einzelnen Stufe; so bleibt jede Stufe
// erkennbar und der Lauf trotzdem kurz.
export const N_SEQUENCE = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 200]
export const STEP_DWELL = 0.75         // s je Stufe bei 1× Tempo

// Streifenzahl, bis zu der Zusatz-Beschriftungen (Δx-Maßstrich, Mittelpunkt-
// Marker) noch lesbar sind — darüber würde die Zeichnung zulaufen.
export const N_LABEL_LIMIT = 16
export const N_MIDDOT_LIMIT = 40

// Ab welcher Streifenbreite (in echten Bildschirmpixeln) die Streifen-Konturen
// entfallen (B33): ein Streifen trägt ~0,6 px Füllungs-Kontur plus 0,9 px
// Obersummen-Kontur, also rund 1,5 px „Tinte" unabhängig von seiner Breite.
// Bei n = 200 (Streifen ~4,4 px) sind das ein Drittel der Fläche — die Zeichnung
// wird zum orange-blauen Strichcode und die Aussage „die Lücke O − U schließt
// sich" ist genau im Moment des Grenzübergangs unsichtbar. Unter 7 px zeichnen
// deshalb nur noch die Füllungen (Klasse `strips-dense`); die Konturen blenden
// sich damit zwischen n ≈ 96 und n ≈ 128 aus.
export const STRIP_OUTLINE_MIN_PX = 7

// ── Auswählbare Funktionen ────────────────────────────────────────────────────
// f: Funktion · F: analytische Stammfunktion (Hauptsatz: ∫ₐᵇ f = F(b) − F(a))
// crit: Nullstellen von f' im Definitionsbereich. Damit lassen sich Infimum und
// Supremum je Teilintervall EXAKT bestimmen (Kandidaten = Ränder + enthaltene
// kritische Stellen) statt durch dichtes Abtasten zu schätzen — Unter-/Obersumme
// sind so echte Riemann-Unter-/Obersummen, nicht bloß linke/rechte Summen.
// Alle vier Funktionen sind auf [X_MIN, X_MAX] strikt positiv, damit „Fläche
// unter der Kurve" wörtlich gilt (Vorzeichenfläche → KNOWN_LIMITATIONS).
export const FUNCS = {
  gerade: {
    label: 'Gerade (linear)',
    f: x => 0.4 * x + 1,
    F: x => 0.2 * x * x + x,
    crit: [],
  },
  parabel: {
    label: 'Parabel (quadratisch)',
    f: x => 0.12 * (x - 5) ** 2 + 1,
    F: x => 0.04 * (x - 5) ** 3 + x,
    crit: [5],
  },
  kubisch: {
    label: 'Kubisch (3. Grades)',
    f: x => 0.02 * (x - 5) ** 3 - 0.3 * (x - 5) + 3,
    F: x => 0.005 * (x - 5) ** 4 - 0.15 * (x - 5) ** 2 + 3 * x,
    crit: [5 - Math.sqrt(5), 5 + Math.sqrt(5)],
  },
  welle: {
    label: 'Welle (Sinus)',
    f: x => 2 + 1.5 * Math.sin(x),
    F: x => 2 * x - 1.5 * Math.cos(x),
    crit: [Math.PI / 2, 3 * Math.PI / 2, 5 * Math.PI / 2],
  },
}
export const DEFAULT_FUNC = 'parabel'

// ── Diagramm-Typen (I12: Optionen dynamisch aus dieser Map, nicht im HTML) ────
export const GRAPH_OPTIONS = {
  konvergenz:       'Konvergenz der Näherungen S(n)',
  integralfunktion: 'Integralfunktion F(x) — Flächenbilanz',
}
export const GRAPH_TYPE_1_DEFAULT = 'konvergenz'
export const GRAPH_TYPE_2_DEFAULT = 'integralfunktion'

// Kleinstes n-Fenster des Konvergenzdiagramms (Vorschauphase, vgl. B9): am Start
// zeigt die Abszisse mindestens 0…N_VIEW_MIN, damit der Graph bei n = 1 nicht auf
// einen einzigen Punkt zusammenfällt. Danach wächst das Fenster mit n mit.
export const N_VIEW_MIN = 8

// ── Geometrie: Hauptdarstellung (Kurve + Streifen) ───────────────────────────
// Format paßt sich dem Layout an (CLAUDE.md „Diagramm-Format pro Layout"):
// übereinander-Layout → breite, flache Zelle → Landscape; nebeneinander-Layout
// → hohe, schmale Zelle → Portrait.
//
// ADAPTIV statt fest (B36): ein starres Format letterboxt per
// `preserveAspectRatio="meet"` in jeder Zelle, deren Seitenverhältnis nicht
// zufällig paßt — bei 1680 px Fensterbreite ist die gestapelte Sim-Zelle
// 1356×414 (Verhältnis 3,27), das alte 900×470 (1,92) füllte davon nur 58 % der
// Breite. Deshalb wird die KURZE Seite festgehalten und die lange aus dem
// tatsächlichen Zellverhältnis abgeleitet: die Zeichnung füllt die Zelle, und
// weil der Maßstab dabei ~1:1 bleibt, behalten Schriftgrößen ihre Pixelgröße.
// Die *_MIN/_MAX-Schranken fangen extreme Fensterformate ab.
export const MAIN_LAND_H = 470, MAIN_LAND_W_MIN = 640, MAIN_LAND_W_MAX = 2000
export const MAIN_PORT_W = 560, MAIN_PORT_H_MIN = 520, MAIN_PORT_H_MAX = 1400
export const MAIN_PAD_L = 66, MAIN_PAD_R = 48, MAIN_PAD_T = 66, MAIN_PAD_B = 54

// ── Geometrie: Diagramm-Slots ────────────────────────────────────────────────
// Zwei-Diagramm-Anordnung ORTHOGONAL zur Sim/Diagramm-Aufteilung (CLAUDE.md,
// Referenz Kreis-/Spiralbewegung): Landscape-Zelle → Slots nebeneinander,
// Portrait-Zelle → Slots übereinander. Gleiche Adaptiv-Logik wie oben (B36) —
// sie behebt zugleich die unlesbaren Diagramme auf schmalen Viewports (B37):
// dort wurde die feste Dual-viewBox 1412×410 in eine 676×380-Zelle gequetscht
// (Maßstab 0,48 → 5-px-Tick-Labels). Mit zellrichtiger viewBox bleibt der
// Maßstab bei ~1 und die Beschriftung lesbar.
export const GRAPH_LAND_H = 410, GRAPH_LAND_W_MIN = 520, GRAPH_LAND_W_MAX = 2400
export const GRAPH_PORT_W = 470, GRAPH_PORT_H_MIN = 520, GRAPH_PORT_H_MAX = 1600
export const DUAL_GAP = 12
export const PAD_L = 62, PAD_R = 44, PAD_T = 48, PAD_B = 52
