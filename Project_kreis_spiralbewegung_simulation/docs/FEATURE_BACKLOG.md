# Feature-Backlog — Kreis- und Spiralbewegung

Mögliche Erweiterungen nach der Migration (v1.0.0). Nicht priorisiert.

## Didaktisch
- **Okabe-Ito-Farbpalette:** Vektorfarben (aktuell Violett/Orange/Grün aus der
  Quelldatei) auf farbblinden-sichere Okabe-Ito-Tokens angleichen (CLAUDE.md
  empfiehlt `--c-vel`/`--c-acc` shared). Beziehung zu Komponenten-Farben klären.
- **Polar-Zerlegung in ISO-Ansicht:** aktuell nur in 2D (in ISO deaktiviert).
- **Weitere Szenarien-Presets** (z. B. Spirale innen, gleichförmig mit φ₀≠0).

## UX
- **Kanonische Atwood-Subdial** an der Stoppuhr (cy=25, r=13, 10 Marken,
  1 U/s) — Quelldatei hat nur den Hauptzeiger.
- **Hover-Werte** im Diagramm (Cursor folgt Kurve, zeigt exakten Wert).
- **PNG/SVG-Export** der Diagramme (ergänzend zum CSV-Export).

## Technisch
- **nStop-Obergrenze** dokumentieren oder cappen (bei großen n·90° kann das
  Auto-Stopp-Ziel jenseits des 120 s-Precompute-Horizonts liegen).
- **shared/js-Helper** (`setAxisLabel`/`setGraphTitle`/`shortenEnd`/
  `tAxisStep`/`niceStepLE`) aus den modularen Sims konsolidieren, statt jede
  Sim sie lokal hält (Backlog I2-Folge).