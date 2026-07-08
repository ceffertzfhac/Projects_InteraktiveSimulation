# Issues — Kreis- und Spiralbewegung

## Offen
- Farbpalette nicht Okabe-Ito-konform (Violett+Orange+Grün; CLAUDE.md empfiehlt
  keine Kombi Violett+Grün+Orange). Bewusst als Parität zur Quelldatei beibehalten;
  Angleichung als Folge-Aufgabe (siehe `FEATURE_BACKLOG.md`).
- Stoppuhr ohne kanonische Atwood-Subdial (nur Hauptzeiger, wie Quelldatei).

## Behoben
- (keine über v1.0.0 hinaus)

## Bekannte Einschränkungen
- **ISO-Ansicht:** kartesische/polare Vektorzerlegung deaktiviert (nur 2D);
  \(\omega\)/\(\alpha\)-Vektoren nur in ISO (entlang z).
- **Auto-Stopp:** Zielwinkel jenseits des 120 s-Precompute-Horizonts ist nicht
  erreichbar ( Spirale mit \(R\to0\) terminiert ohnehin früher).
- **CSV-Winkelgrößen** immer in Grad (unabhängig von der UI-Winkeleinheit) —
  um Vergleichbarkeit mit der Quelldatei zu wahren.
- **Spiral-Modus** erzwingt \(v_r\neq0\); im Kreis-Modus wird \(v_r=0\) erzwungen.