'use strict'

// ── Konfiguration: „Geschwindigkeit als Steigung der Ort-Zeit-Kurve" ────────
// Diagrammatisches Werkzeug ohne Zeit-Animation (kein requestAnimationFrame-
// Loop, kein Play/Pause/Stoppuhr/CSV — analog Project_ableitung_simulation,
// dessen Architektur hier als Vorbild dient: dieselbe Sekante→Tangente-Idee,
// nur mit Zeit t als Abszisse und Ort x(t) als Ordinate statt eines
// abstrakten y=f(x)).

export const T_MIN = 0
export const T_MAX = 20
export const NUM_POINTS = 500          // Abtastpunkte der Ort-Zeit-Kurve

// Stützstelle t₀ (Slider + Step-Buttons ±T0_FINE_STEP)
export const T0_MIN = 0
export const T0_MAX = 20
export const T0_STEP = 0.01
export const T0_FINE_STEP = 0.01
export const T0_DEFAULT = 10

// Δt-Regler: VORZEICHENBEHAFTET (anders als bei Ableitung, wo δ stets der
// positive volle Stützpunkt-Abstand ist). Im zentrierten Modus ist ein
// Vorzeichenwechsel bedeutungslos (symmetrisches Intervall, nur die p1/p2-
// Zuordnung tauscht) — im vorwärts-Modus unterscheidet das Vorzeichen aber
// echte Vorwärts- von Rückwärts-Differenzenquotienten (pädagogisch relevant,
// deshalb 1:1 aus dem Original übernommen statt auf „nur positiv" vereinfacht).
export const DELTA_LIMIT = 5
export const DELTA_STEP = 0.01
export const DELTA_DEFAULT = 1.0

// Auswählbare Funktionen: analytische Funktion f + analytische Ableitung f'.
// Bugfix ggü. Original (das die Geschwindigkeit numerisch per zentraler
// Differenz über ein festes 10 000-Punkte-Array berechnete): hier liefert
// jede Variante ihre Ableitung analytisch (exakter, gleiches Muster wie
// Ableitung-Sim). Numerisch gegen zentrale Differenzen verifiziert (node,
// Abweichung <1e-8 über den vollen Definitionsbereich).
export const FUNCS = {
  gerade: {
    label: 'Gerade',
    f:  t => 2 * t - 5,
    fp: _t => 2,
  },
  parabel: {
    label: 'Parabel',
    f:  t => (t - 5) ** 2 + 1,
    fp: t => 2 * (t - 5),
  },
  komplex: {
    label: 'Komplex',
    // x(t) = 1/1000 · (−4(t+2)² − 4(t+2) − 20) · sin(t)
    f: t => (1 / 1000) * (-4 * (t + 2) ** 2 - 4 * (t + 2) - 20) * Math.sin(t),
    // Produktregel: g(t)=Klammerausdruck/1000, x=g(t)·sin(t) → x'=g'·sin+g·cos
    fp: t => {
      const g = (1 / 1000) * (-4 * (t + 2) ** 2 - 4 * (t + 2) - 20)
      const gp = (1 / 1000) * (-8 * (t + 2) - 4)
      return gp * Math.sin(t) + g * Math.cos(t)
    },
  },
}
export const DEFAULT_FUNC = 'gerade'

// ── Diagramm-Geometrie (Landscape, füllt die mittlere Spalte, meet-zentriert) ──
export const GRAPH_W = 780
export const GRAPH_H = 580
export const PAD_L = 62   // Platz für x-Ticks + Ordinatenlabel „x / m"
// PAD_R größer als bei Ableitung-Vorbild (26px): dort steht am rechten Rand
// nur ein bloßes Symbol „x", hier „t / s" (Symbol+Einheit) — braucht mehr
// Breite, sonst wird das Label vom SVG-viewBox rechts abgeschnitten.
export const PAD_R = 46
export const PAD_T = 56   // Platz für den Funktions-Titel (MathJax)
export const PAD_B = 48   // Platz für t-Ticks + Abszissenlabel „t / s"
