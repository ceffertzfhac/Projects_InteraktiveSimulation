# Changelog — Schwingendes Lineal

Alle nennenswerten Änderungen an dieser Simulation. Version folgt
[SemVer](https://semver.org): patch = Bugfix/Style, minor = Feature,
major = brechende Änderung. Die Versionsnummer in `index.html` wird
mitgeführt.

## v1.0.0 — 2026-07-15

Erstfassung aus der Lineal-Aufgabe (→ `new_sim_input/Lineal/`):
„Bestimmen Sie die Periodendauer der Schwingung für kleine Auslenkungen"
eines handelsüblichen Plastiklineals als physikalisches Pendel.

### Physik
- **Physikalisches Pendel:** Lineal (Länge *l*, Breite *b*) schwingt reibungsfrei
  um eine Achse durch ein Loch im Abstand *a* vom oberen Rand.
  *I*_S = ⅟₁₂·*m*·(*l*²+*b*²), *I*_A = *I*_S + *m*·*s*² (Steiner, *s* = *l*/2−*a*),
  ω₀ = √(*g*·*s*/(⅟₁₂(*l*²+*b*²)+*s*²)), *T* = 2π/ω₀ (harmonisch).
  Die Masse kürzt in *T* heraus (didaktischer Hinweis in der Sidebar).
- **Zwei Modelle umschaltbar:** „Kleine Winkel" (geschlossene harmonische Lösung,
  *T* = 2π/ω₀) und „Exakt (nichtlinear)" (RK4-Integration von φ̈ = −ω₀²·sin φ,
  *T* = (4/ω₀)·K(sin(φ₀/2)) via AGM-berechnetem elliptischem Integral). Bei
  großen Auslenkungen wird die Abweichung der Näherung sichtbar.
- **Energie** (modellkonsistent, echte Invariante je Modell):
  *E*_kin = ½·*I*_A·ω², *E*_pot = ½·*m*·*g*·*s*·φ² (linear) bzw.
  *m*·*g*·*s*·(1−cos φ) (exakt), *E*_ges konstant. Nur hier wirkt die Masse.
- Sanity: *T* ≈ 0,902 s für die Aufgabenvorgabe (32 cm × 3,7 cm, Loch bei 1,9 cm);
  *E*_ges-Schwankung < 1·10⁻¹⁸ (linear) bzw. < 1·10⁻⁹ (RK4 über 6 Perioden).

### Simulation
- Slider: Lochposition *a* (1–14 cm), Lineallänge *l* (30–40 cm), Breite *b*
  (1–6 cm), Anfangsauslenkung φ₀ (5–90°), Masse *m* (1–50 g). Achse rutscht
  unter den Schwerpunkt (*s* ≤ 0) → „instabil", keine Schwingung.
- Animiertes Lineal ( Rotation um den Drehpunkt, Winkelbogen φ, Schwerpunkt,
  Schwerkraft- & Geschwindigkeitsvektor, Ruhelage-Bezugslinie, cm-Teilstriche).
- Diagramme (Picker, linke Sidebar): φ(t), ω(t), α(t) (jeweils Abszisse am
  Nulldurchgang, symmetrische Ordinate) und Energie (*E*_kin/*E*_pot/*E*_ges,
  drei Linien). Hover-Werte (→ BACKLOG I13.1) mit mehrreihigem Tooltip.
- Kanonische Topbar, einklappbare Analyse-Sidebar (Formeln + Live-Werte),
  Akkordeon-Steuerungs-Sidebar links, CSV-Export, Dark Mode über Tokens.