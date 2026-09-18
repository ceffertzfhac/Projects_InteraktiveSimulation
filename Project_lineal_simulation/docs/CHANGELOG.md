# Changelog — Schwingendes Lineal

Alle nennenswerten Änderungen an dieser Simulation. Version folgt
[SemVer](https://semver.org): patch = Bugfix/Style, minor = Feature,
major = brechende Änderung. Die Versionsnummer in `index.html` wird
mitgeführt.

## v1.1.0 — 2026-09-18

Abarbeitung des Review-Backlogs (kritisches Technik-/Physik-/UI-/UX-/Didaktik-
Review): numerische Präzision, Accessibility, didaktische Hinweise, Performance.

### Physik / Numerik
- **UI-justierbarer Zeitschritt Δt** (0,001–0,05 s, Default 0,01 s): neuer
  Slider im Panel „Visualisierung". Der Wert lebt im `store` (`store.DT`) —
  zentrale Stelle für alle mutablen Werte; `constants.js` exportiert nur noch
  den Default `DT_DEFAULT`. `precompute()`/RK4 lesen die aktuelle Schrittweite
  aus dem Store. Kleinere Schritte erhöhen die RK4-Genauigkeit bei großen
  Auslenkungen (φ₀ > 45°) ohne spürbaren Performance-Verlust.
- **Interpolation O(log n):** `interpolateAt()` sucht das Zeitintervall jetzt
  per Binary-Search statt `findIndex` (O(n)) — relevant für kleine Δt
  (bis 20 000 Punkte) in Animation, Wiedergabe-Markern und Hover.
- **Diagramm-Downsampling:** Kurven werden stride-verdünnt, wenn mehr Punkte
  als Diagramm-Pixelbreite vorliegen (Endpunkte bleiben erhalten) — visuelle
  Qualität unverändert, Polyline-Knoten bei kleinem Δt stark reduziert.

### UX
- **Instabilitäts-Overlay:** Achse unterhalb des Schwerpunkts (*s* ≤ 0) →
  roter Hinweis über der Szene, Play-Button gesperrt (vorher nur „— instabil"
  im Live-Panel).
- **φ₀-Warnung (didaktisch):** Im kleinen-Winkel-Modell ab φ₀ > 20° erscheint
  ein Hinweis unter dem Slider, dass die Näherung merkbar vom exakten
  Verhalten abweicht und „Exakt (nichtlinear)" gewählt werden sollte.
- **Info-Modal:** Button „❔ Info" (Topbar) öffnet ein `<dialog>` mit
  Modell-Zusammenfassung und Hinweis zum einstellbaren Zeitschritt.
- **Energie-Legende:** Beim Diagrammtyp „Energie" zeigt eine SVG-Legende
  (Farbswatch + Label) die Zuordnung *E*_kin/*E*_pot/*E*_ges.
- **Diagramm-Dropdown-Beschreibungen:** Je `<option>` ein `title`-Tooltip
  mit kurzer physikalischer Erläuterung des Verlaufs.
- **Responsive:** Unter 900 px brechen die drei Spalten (Steuerung / Szene /
  Analyse) gestapelt um; das SVG skaliert weiterhin per `preserveAspectRatio`.

### Accessibility
- ARIA-Labels für alle Slider (inkl. `aria-valuemin/max/now`, dynamisch
  synchronisiert), Buttons, Select; Hover-Tooltip mit `role="tooltip"` +
  `aria-live="polite"`; Warnhinweis mit `role="status"`.
- Globale `:focus-visible`-Fokusanzeige im Design-System; Tooltip-Hintergrund
  auf neue, kontraststarke Token `--tooltip-bg` (Light/Dark).

### Test
- Neue Vitest-Suite `test/physics.test.js` (9 Tests): abgeleitete Größen,
  Stabilitäts-Grenzfall, *store.DT*-Respekt, RK4-Energieerhaltung,
  Binary-Search-Interpolation (Gleichwertigkeit vs. Referenz-Scan).
- CI-Workflow `.github/workflows/ci.yml` (Node 20, `npm ci`, `npm test`).

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