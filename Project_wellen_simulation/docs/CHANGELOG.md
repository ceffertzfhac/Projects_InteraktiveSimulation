# Changelog — Wellen (Interferenz zweier Punktquellen)

Alle nennenswerten Änderungen an dieser Simulation. Version folgt
[SemVer](https://semver.org/): patch = Bugfix/Style, minor = Feature,
major = brechende Änderung. Die Versionsnummer in `index.html` wird
mitgeführt.

## v1.0.1 — 2026-07-13

Copyright-Marke + Disclaimer-Verweis (repo-weit, Vorbereitung I1/ILIAS-Veröffentlichung).

### Geändert
- **Topbar:** Copyright-Marke „© 2026 FH Aachen, FB 8 · Alle Rechte vorbehalten" neben
  dem Institutions-Span ergänzt. Keine Verhaltensänderung — rein rechtlicher Hinweis
  (volle Fassung in repo-root `NOTICE.md` und auf der Übersichtsseite).

## v1.0.0 — 2026-07-12

M12 — Migration von `AllAnimations/wellen.html` (Prototyp, per S1 nur
verlinkt) auf die 6-Modul-Architektur (`constants.js`/`state.js`/
`physics.js`/`render.js`/`ui.js`/`css/styles.css`). Letzte der drei
verbliebenen Prototyp-Migrationen (M10 Geschwindigkeit, M11 Grundbegriffe,
M12 Wellen).

### Architektur
- **Bewusste Ausnahme vom precompute()-Muster** (s.
  `docs/KNOWN_LIMITATIONS.md`): kontinuierliches, unbeschränktes Wellenfeld
  statt einer begrenzten Trajektorie — `physics.js` bleibt zustandslos,
  `render.js`s Canvas-Loop berechnet live pro Frame, wie im Original.
- Canvas (Pixel-für-Pixel-Interferenzfeld) + SVG-Overlay (Quellen, Detektor,
  Schirmlinie, Knotenlinien-Hyperbeln) + separates SVG-Diagramm (Zeit- oder
  Schirm/Intensitäts-Graph) — 1:1 aus dem Original übernommene
  Drei-Schichten-Rendering-Architektur, keine Konvertierung auf reines SVG.
- Formeln (Wellen-Superposition, Kausalitäts-Cutoff, Intensität,
  Knotenlinien-Hyperbeln) numerisch 1:1 gegen das Original verifiziert
  (Node-Testskript, mehrere Parameterkombinationen, Abweichung 0).

### Geändert (gegenüber dem Prototyp)
- **„Analyse am Punkt P" umgezogen**: lag im Original in der linken
  Steuerungs-Sidebar neben den Reglern — Live-Readouts gehören repo-weit in
  die rechte, einklappbare Analyse-Sidebar (strukturelle Verbesserung, keine
  inhaltliche Änderung).
- **Graph-Padding dedupliziert**: im Original 3× identisch in
  `drawGraphGrid`/`drawTimeGraph`/`drawScreenGraph` — jetzt eine zentrale
  `GRAPH_PAD`-Konstante.
- **Achsenbeschriftung** auf `shared/js/svg-text.js::setAxisLabel`
  umgestellt (`t / s`, `x / cm`) statt rohem `textContent`.
- **Legende im Diagramm neu positioniert**: kollidierte im Original knapp mit
  dem Achsenlabel „Zeit t"/„Position x auf Schirm" (`y=370/380` vs.
  Achsenlabel bei `y=390`) — jetzt `y=345`, innerhalb der Diagrammfläche,
  kollisionsfrei in beiden Graph-Modi.
- Akkordeon-Steuerungs-Sidebar links (I8: Systemparameter · Visualisierung ·
  Legende, 3 Cluster), einklappbare Analyse-Sidebar rechts.
- Kanonische Topbar-Buttonleiste (Theme-Toggle · Play · Pause · Reset) — kein
  CSV (s. `docs/KNOWN_LIMITATIONS.md`).

### Übernommen (unverändert aus dem Prototyp)
- Alle Physik-Formeln (Wellen-Superposition, 1/√r-Dämpfung,
  Kausalitäts-Cutoff, Intensität, Knotenlinien-Hyperbeln, Interferenz-
  Klassifikation).
- Detektor-Drag-Verhalten (Maus + Touch, Distanz-Schwellwert).
- Feste Frequenz (nicht regelbar), nur `d`/`λ`/`δ₀` als Regler.
