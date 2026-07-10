# Changelog — Elastischer Stoß

Alle nennenswerten Änderungen an dieser Simulation. Version folgt
[SemVer](https://semver.org): patch = Bugfix/Style, minor = neues Feature,
major = brechende Änderung. Die Versionsnummer in `index.html` wird
mitgeführt.

## v1.0.1 — 2026-07-10

Feder verband fälschlich beide Gleiter permanent statt zweier unabhängiger
Federstummel. Bugfix (PO-Meldung direkt nach Migration).

### Fixes
- **Feder spannte über die gesamte Lücke zwischen den Gleitern (kritisch,
  physikalisch falsch)**: `updateScene()` zeichnete einen einzelnen
  Zickzack-Pfad von der rechten Kante des Gleiters 1 bis zur linken Kante
  von Gleiter 2 (`drawZigzagSpring(s1x, s2x, …)`), unabhängig vom
  tatsächlichen Abstand. Nach der Kollision, wenn sich die Gleiter
  trennen, wuchs die „Feder" ungebremst mit — visuell als **permanente
  Kopplung** (gekoppelter Oszillator), obwohl es sich um zwei unabhängige
  freie Körper handelt, die nur beim Kontakt kurz über Federstummel
  wechselwirken (wie im migrierten Canvas-Prototyp, der zwei separate,
  je an einem Gleiter befestigte Halbfedern fester Ruhelänge zeichnete —
  bei der SVG-Neufassung versehentlich zu einer einzigen, spannenden
  Feder vereinfacht). **Korrigiert:** zwei unabhängige Federstummel
  (Armlänge `SPRING_REST_LENGTH_M/2`, als zwei Teilpfade in
  `#spring_path`), die nur bei Lücke < voller Ruhelänge symmetrisch
  ineinander stauchen; sind die Gleiter weiter als die Ruhelänge
  entfernt, bleibt zwischen den Stummeln eine sichtbare Lücke. Starre
  Prellböcke (`k`→∞) zeigten das gleiche Problem nicht (waren bereits
  unabhängige, fest-lange Elemente), zeigten aber unnötig eine
  Lücken-abhängige „Stauchung" trotz Δt=0 — ebenfalls auf feste
  Ruhelänge korrigiert. Per Playwright-Screenshot vor/während/nach dem
  Stoß verifiziert.

## v1.0.0 — 2026-07-10

Migration von `AllAnimations/elastischerStoß.html` (Standalone-Prototyp,
Canvas-basiert) nach `Project_stoss_simulation/` (6-Modul-Architektur,
SVG-basiert). M8, letzte offene Standalone→Modular-Migration.

### Features
- **Physik auf geschlossene Lösung umgestellt (größter Eingriff)**: der
  Prototyp berechnete die Federkontaktphase per Mikro-Zeitschritt-Integration
  (0,1 ms Schritte, ~10.000 Schritte/Frame). Die neue `precompute()` löst
  alle drei Bewegungsphasen **analytisch exakt**:
  1. Freier Flug vor dem Kontakt (`x=x₀+v₀t`).
  2. Kontaktphase (endliche Feder): Relativkoordinate \(s\) (Federkompression)
     folgt ungedämpfter SHM \(s(t)=(v_{\text{rel},0}/\omega)\sin(\omega t)\),
     \(\omega=\sqrt{k/\mu}\), \(\mu\) = reduzierte Masse — Herleitung aus
     Trennung von Schwerpunkt- und Relativbewegung (Schwerpunktgeschwindigkeit
     bleibt während des Kontakts konstant, keine äußere Kraft).
  3. Freier Flug nach dem Kontakt mit den elastischen Stoß-Endgeschwindigkeiten.
  Bei starrer Feder (\(k\to\infty\)) schrumpft die Kontaktdauer auf 0
  (Geschwindigkeits-Sprung). Wand-Sonderfälle (eine Masse „unendlich")
  eigens hergeleitet (Reflexion \(v'=2v_{\text{Wand}}-v\)).
  **Numerisch verifiziert** (Node-Testskript, 6 Parameterkombinationen
  inkl. Wand + starre Feder): Energie-/Impulserhaltung exakt bis auf
  Floating-Point-Rauschen (~1e-16), keine Orts-Sprünge an den
  Phasengrenzen. Zusätzlich per Playwright-Browsertest gegen die von Hand
  nachgerechneten Endgeschwindigkeiten bestätigt.
- **SVG statt Canvas**: Gleiter als Rechtecke (feste Breite — reale
  Luftkissenbahn-Gleiter ändern ihre Länge nicht durch Zusatzgewichte;
  Masse als Zahlenwert am Gleiter), Zickzack-Pfad als Feder, Prellblöcke
  bei starrer Feder, kanonische Pfeilspitzen-Geometrie für Geschwindigkeits-
  vektoren. Auto-Zoom/-Pan **einmalig** aus den precompute-Arrays berechnet
  (statt Live-Pan pro Frame), garantiert beide Gleiter über die gesamte
  Simulationsdauer im Sichtbereich.
- **Kanonische Stoppuhr** (Hauptzeiger 1 U/60s + Subdial 1 U/s) statt der
  Prototyp-Einzelzeiger-Uhr — hilfreich, da Stoßdauern oft < 1 s sind.
- Diagrammtypen: Geschwindigkeit \(v(t)\), Beschleunigung \(a(t)\), Impuls
  \(p(t)\), Energie \(E(t)\) (inkl. Federenergie). Beide Achsen ≥4 Ticks
  inkl. 0 (`niceStepLE`, 1-2-4-5-Folge), Abszisse am Nulldurchgang bei
  vorzeichenbehafteten Größen.
- Einklappbare Analyse-Sidebar (Live-Analyse, Stoß-Kennwerte Δt/F_max/
  Endgeschwindigkeiten, Energie-/Impuls-Balken, Physik-Formelbox), Design-
  System (Dark Mode funktioniert — im Prototyp bewußt nicht gefixt, siehe
  `BACKLOG.md` Dark-Mode-Fix-Notiz zu M8), CSV-Export (Diagramm + alle Daten).

### Bekannte Vereinfachungen
Siehe `docs/KNOWN_LIMITATIONS.md`.
