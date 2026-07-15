# Changelog — Elastischer Stoß

Alle nennenswerten Änderungen an dieser Simulation. Version folgt
[SemVer](https://semver.org): patch = Bugfix/Style, minor = neues Feature,
major = brechende Änderung. Die Versionsnummer in `index.html` wird
mitgeführt.

## v1.1.0 — 2026-07-15

I12 — Diagramm-Steuerung: Typ-Picker zurück in die linke Sidebar
(kehrt I12.3 um). PO-Entscheidung 2026-07-15: kanonische „Sidebar-Schule"
statt Proximity-Toolbar am Diagramm.

### Geändert (kehrt I12.3 um)
- **Diagramm-Typ-Picker** (`graph_select`, Größe v/a/p/E) aus der
  `.graph-toolbar` am Diagramm zurück in die linke Sidebar verschoben —
  neuer Akkordeon-Cluster „Diagramm" (`panel-section collapsible` mit
  `<button class="panel-label">` + `acc-chevron`), eingefügt vor
  „Abspielgeschwindigkeit". Klasse von shared `.graph-sel` zurück auf
  Sidebar-Standard `.select-field` (vollbreit). Die lokalen
  `.sim-wrapper`/`.graph-wrapper`-Layout-Wrapper aus I12.3 bleiben
  (reine Layout-Funktion, picker-unabhängig).
- **Optionen dynamisch aus `GRAPH_OPTIONS`:** neue Map in
  `js/constants.js` (`export const GRAPH_OPTIONS = { v: {label: …}, … }`),
  in `js/ui.js` befüllt eine neue `populateGraphSelect()` den Select beim
  Bootstrap und setzt `store.graphType`. Labels als Klartext (MathJax
  rendert nicht in `<option>`).
- **Aufräum:** `.graph-toolbar`-Block incl. `#graph_toolbar` aus
  `index.html` und `css/styles.css` entfernt. Akkordeon-CSS
  (`.panel-section.collapsible`/`.acc-chevron`) in `css/styles.css`
  ergänzt (bisher hatte stoss keine Akkordeon-Cluster).

## v1.0.6 — 2026-07-14

I12.3 — Diagramm-Steuerung: Diagrammtyp-Picker aus der Sidebar in eine `.graph-toolbar` direkt am Diagramm verschoben; Center-Layout kanonisiert.

### Geändert (I12.3)
- **Diagramm-Typ-Picker** (`graph_select`, Größe v/a/p/E) aus dem linken
  Sidebar-Cluster „Diagramm" in eine neue `.graph-toolbar` über dem Graphen
  verschoben — Steuerung am beeinflussten Objekt (Proximity, → BACKLOG I12
  / Blueprint §3). Klasse von Sidebar-`select-field` auf shared `.graph-sel`
  (→ I12.1) umgestellt. Der verbleibende Sidebar-Cluster heißt jetzt
  „Abspielgeschwindigkeit" (Label war als „Diagramm" obsolet geworden, da nur
  noch die Zeitlupe-Pills darin verbleiben).
- **Center-Layout kanonisiert:** #main_svg und #graph_svg waren bisher nackte
  Flex-Kinder des (statischen) `center-area` — #main_svg mit shared
  `height:100%` als Basis, #graph_svg intrinsisch (gequetscht), und
  `.time-label` hing an `position:absolute` ohne positionierten Vorfahren.
  Jetzt: #main_svg + time-label in shared `.sim-wrapper` (flex:1,
  position:relative → time-label korrekt verankert), #graph_svg in lokaler
  `.graph-wrapper` (flex:1, position:relative → sauberer 50/50-Sim/Diagramm-
  Split, Graph bekommt definitive Größe). `.graph-toolbar` absolut am
  Wrapper-Top-Left. Kanonische Zykloide-Referenz (separates #graph_svg),
  kein getScreenCTM-Overlay nötig (anders als Freier Fall, in-SVG-Graph).
  Optionen bleiben vorerst statisch (→ I12.5 `GRAPH_OPTIONS`-Map).

## v1.0.5 — 2026-07-13

B23 — Vektor-Pfeilspitzen bei zu kurzem Vektor (repo-weiter Fix des shared-Helpers `shortenEnd`).

### Behoben (B23)
- **Vektor-Pfeillänge/Spitze:** Der shared-Helper `shortenEnd` erzwang bei
  Vektorlängen ≤ Marker-Länge einen 2-px-Schaft-Stub, sodaß die refX=0-Spitze
  über das Ziel hinausschoß. `shortenEnd` gibt jetzt `null` zurück, wenn der
  Vektor kürzer als die Pfeilspitze ist; `drawVec` verbirgt Geschwindigkeits-
  vektoren dann (ergänzt den bestehenden |v|<0,02-Guard) statt sie mit
  Überschieß-Spitze zu zeichnen.

## v1.0.4 — 2026-07-13

Copyright-Marke + Disclaimer-Verweis (repo-weit, Vorbereitung I1/ILIAS-Veröffentlichung).

### Geändert
- **Topbar:** Copyright-Marke „© 2026 FH Aachen, FB 8 · Alle Rechte vorbehalten" neben
  dem Institutions-Span ergänzt. Keine Verhaltensänderung — rein rechtlicher Hinweis
  (volle Fassung in repo-root `NOTICE.md` und auf der Übersichtsseite).

## v1.0.3 — 2026-07-11

T9 — shared/js-Helper konsolidieren.

### Geändert
- **`shortenEnd`/`setAxisLabel`/`setGraphTitle`/`tAxisStep`/`niceStepLE`**
  nutzen jetzt `shared/js/vectors.js`, `shared/js/svg-text.js` bzw.
  `shared/js/ticks.js` statt lokaler Kopien. `setAxisLabel`/`setGraphTitle`:
  DOM-Form vereinheitlicht (bisher Text-Node statt `tspan` für einen Teil
  des Labels) — keine sichtbare Änderung. `tAxisStep`: bisheriger
  `minDivs=4`-Default jetzt explizit am Call-Site übergeben (kanonischer
  Default ist repo-weit `3`) — unverändertes Verhalten.

## v1.0.2 — 2026-07-10

Ruhende Gleiter „liefen" beim Verstellen der Federkonstante seitlich im
Sichtfenster. Bugfix (PO-Meldung).

### Fixes
- **Optischer Schwerpunkt verschob sich beim Reglern ohne Play (kritisch,
  irreführend)**: `fitCamera()` zentrierte die Kamera auf `(minX+maxX)/2`
  über den **gesamten** vorausberechneten Bewegungsverlauf (inkl.
  Nachlauf nach dem Stoß). Da die Federkonstante \(k\) die Stoßdauer und
  damit `simDuration` sowie die im Nachlauf zurückgelegte Strecke ändert
  — ohne daß sich die Startpositionen ändern — verschob sich der
  berechnete Kameramittelpunkt bei jeder \(k\)-Änderung (v. a. bei
  asymmetrischem Nachlauf, z. B. wenn die leichtere Masse nach dem Stoß
  weiter zurückspringt als die schwere vorankommt). Sichtbar als
  seitliches „Laufen" der ruhenden Gleiter, obwohl `t=0` und die
  Animation gar nicht läuft. **Korrigiert:** Kamera-Mittelpunkt jetzt
  **fest** auf den Start-Mittelpunkt `(X1_START_M+X2_START_M)/2 = 0`
  verankert (regler-unabhängige Konstante); nur noch der Zoom (`ppm`)
  paßt sich der tatsächlich gebrauchten Spannweite an — symmetrisch um
  den festen Mittelpunkt, kein Pan-Sprung mehr. Sichtbarkeits-Garantie
  während der Animation bleibt erhalten (Playwright-Test mit
  Extremparametern: 0 Off-Screen-Frames). Per Browsertest verifiziert:
  Mittelpunkt bleibt bei Variation von \(k\)/\(v_1\)/\(m_2\) exakt
  konstant (± 0 px).

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
