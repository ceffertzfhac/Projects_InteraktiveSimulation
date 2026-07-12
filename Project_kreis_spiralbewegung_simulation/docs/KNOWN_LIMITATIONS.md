# Known Limitations — Kreis- und Spiralbewegung

Bewußte lokale Einschränkungen. Bugs, Features und Tech-Schulden werden zentral
in `../../BACKLOG.md` getrackt (siehe `## KONVENTIONEN` dort). Sim-spezifische
Folge-Aufgaben dieser Sim: → **FX1** (Okabe-Ito-Farbpalette), → **FX2**
(kanonische Atwood-Subdial), → **FX3**–**FX5**; Querschnitts-Features → **I5**
(Hover), **I6** (PNG/SVG-Export); shared-Helper → **T9**.

## Bekannte Einschränkungen
- **ISO-Ansicht:** kartesische/polare Vektorzerlegung deaktiviert (nur 2D);
  ω/α-Vektoren nur in ISO (entlang z).
- **Auto-Stopp:** Zielwinkel jenseits des 120 s-Precompute-Horizonts ist nicht
  erreichbar ( Spirale mit R→0 terminiert ohnehin früher). → **FX5**.
- **CSV-Winkelgrößen** immer in Grad (unabhängig von der UI-Winkeleinheit) —
  um Vergleichbarkeit mit der Quelldatei zu wahren.
- **Hover-Cursor (I5) nur auf bereits gezeichnetem Kurvenabschnitt**
  (konsistent mit der Zykloide-Referenz und den anderen Rollout-Sims). → **I5**.
- **Spiral-Modus** erzwingt v_r≠0; im Kreis-Modus wird v_r=0 erzwungen.