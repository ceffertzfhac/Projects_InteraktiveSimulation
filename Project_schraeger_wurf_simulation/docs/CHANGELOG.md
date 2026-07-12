# Changelog — Schräger Wurf

## v1.3.0 — 2026-07-12

I5 — Hover-Werte am Zeit-Diagramm (Rollout, 3. Sim nach Zykloide-Referenz).

### Hinzugefügt
- **Hover-Cursor + Tooltip auf dem Diagramm**: Mouseover über die Kurve zeigt
  eine gestrichelte vertikale Führungslinie, einen hohlen Ring-Punkt (Farbe
  wie Ball/Kurve, `--accent`) und ein Tooltip mit Zeitpunkt *t* und Wert.
  Funktioniert unabhängig in allen 3 Diagramm-Slots (Single, Stacked-Top,
  Stacked-Bottom) — je eigenes Hit-Rect + eigene Skala, da alle 3 Graph-
  Gruppen in derselben `#main_svg` liegen (anders als bei der Zykloide-
  Referenz mit eigener Graph-SVG). `shared/js/hover.js` unverändert
  wiederverwendet — der CTM-auf-Hit-Rect-Trick funktioniert automatisch
  korrekt für die transformierten `<g>`-Gruppen.
  **Bewußt außen vor:** die Bahnkurve y(x)/x(y) (Single-Modus) — räumliche,
  bei x(y) nicht-monotone Achse, siehe `docs/KNOWN_LIMITATIONS.md`. Cursor
  bleibt zudem auf den bereits gezeichneten Kurvenabschnitt geklammert.
  Per Playwright verifiziert: Hover bei Zeit-Diagramm, kein Hover bei
  Bahnkurve, unabhängige Stacked-Top/Bottom-Slots, Moduswechsel räumt
  Hover-Zustand des jeweils anderen Modus auf — keine Console-Errors.

## v1.2.7 — 2026-07-11

T10 — Typografie-/Tick-Konvention nachrüsten (Recon-Fund aus T9).

### Behoben
- **Diagrammtitel waren nie kursiv**: `titleEl.textContent = …` gesetzt statt
  über `setGraphTitle` gesplittet — repo-weit einzige Sim ohne Titel-Kursivierung.
  Jetzt über `shared/js/svg-text.js` behoben (z. B. „Höhe *y(t)*", „Bahnkurve
  *y(x)*"). Dazu den bisherigen redundanten „… vs. Zeit"-Suffix entfernt
  (Titel enden jetzt konsistent auf „…(t)" wie im Stacked-Modus — vorher
  z. B. „Höhe y(t) vs. Zeit", was mit dem kanonischen Kursiv-Split
  unvereinbar gewesen wäre, da „Zeit" statt des Symbols kursiv geworden wäre).
- **Zeitachse zeigte beliebige Bruchzahlen statt runder Ticks**: fester
  Teilstrich-Zähler (`numXTicks = isTraj ? 5 : 10`) erzeugte z. B.
  `0, 0,342, 0,684, …` bei Flugzeit 3,42 s. Jetzt kanonischer `tAxisStep`
  (garantiert ≥3 Divisionen mit runden 1-2-5-Werten). Per Playwright
  verifiziert: Zeitachse zeigt jetzt z. B. `0,0 / 0,5 / 1,0 / 1,5 / 2,0`.
- **Werteachse** (`getNiceTickStep`, Ziel-Tick-Zahl ohne Garantie) auf
  kanonisches `niceStepLE` (garantiert ≥minDivs Teilstriche) umgestellt.

### Geändert
- **Koordinatensystem-Overlay-Labels** (`x / m`, `y / m` in der Animations-
  szene) nutzen jetzt `setAxisLabel` aus `shared/js/svg-text.js` (reine
  Symbol-Labels, 1:1 kompatibel).
- **Graph-Achsenbeschriftungen** (z. B. „Wurfweite *x* / m") bleiben bewußt
  bei der lokalen `createStyledSvgText`-Funktion — sie kombinieren ein
  beschreibendes Wort mit dem Symbol vor dem Trenner, was die kanonische
  `setAxisLabel` (kursiv = alles vor „ / ") fälschlich mitkursivieren würde.
  Kein Bug, sondern eine dokumentierte, bewußte Ausnahme (s. Kommentar in
  `render.js`).
- Zwei redundante `DOM.graphTitleTop/Bottom.textContent`-Zuweisungen entfernt
  (wurden unmittelbar danach von `drawSingleGraph()` überschrieben — bereits
  vor diesem Fix wirkungslos).
- `getNiceTickStep` aus `physics.js` entfernt (nach der Umstellung ungenutzt).

## v1.2.6 — 2026-07-10

Akkordeon-Steuerungs-Sidebar (I8).

### Features
- **Akkordeon-Steuerungs-Sidebar**: 5 Cluster (Parameter, Diagramm,
  Visualisierung, Legende Vektoren, Abspielgeschwindigkeit) einzeln
  ein-/ausklappbar, kein Konsolidierungsbedarf. Nur „Abspielgeschwindigkeit"
  default eingeklappt. Referenz: Kreis-/Spiralbewegung v1.3.0. Per
  Playwright verifiziert.

## v1.2.5 — 2026-07-10

Ball/Bahn/Vektoren konnten bei hohen, steilen Würfen hinter der Stoppuhr
verschwinden. Bugfix B19 (kritische repo-weite Physik-Review, I10).

### Fixes
- **Ball/Bahn/Vektoren hinter Stoppuhr verdeckt (B19, kritisch)**: die
  Stoppuhr-Gruppe (`#stopwatch_circle`, deckende Füllung `--surface`) stand
  im SVG (`index.html`) **nach** Flugbahn/Ball/Geschwindigkeits-/
  Beschleunigungsvektoren. Deren Wurfparabel läuft je nach Zoomfaktor
  (`resetSim` skaliert Animationsfläche automatisch auf `xMax`/`yMax`) durch
  denselben Bildschirmbereich wie die Stoppuhr (Zentrum ≈(250,47) px,
  r≈43 px). Numerisch verifiziert (Rastersuche über \(h_0\)/\(v_0\)/α):
  z. B. \(h_0=2{,}8\) m, \(v_0=22\) m/s, α=82,5° führt die Bahn bis auf
  5 px an das Stoppuhr-Zentrum heran (weit innerhalb r≈43 px) — Ball und
  Vektoren wären für einen Teil des Flugs komplett unsichtbar. Gleiches
  Muster wie B17/B18 (Atwood-Energie): deckendes SVG-Element nach statt vor
  dynamischem Inhalt gezeichnet. **Korrigiert:** Stoppuhr-Gruppe (+
  Zoom-Text-Anzeige) im Markup vor `frozen_trajectory_line`/
  `trajectory_line`/`ball`/Vektoren verschoben — Ball/Bahn/Vektoren liegen
  jetzt immer sichtbar vor der Stoppuhr. Rein deklarative
  Dokumentreihenfolge, keine JS-Änderung nötig. *(Session 2026-07-10, I10)*

## v1.2.4 — 2026-07-07
### Behoben
- **Achsenrichtung im gestapelten Diagramm auswählbar.** Das Dropdown zur
  Y-Achsen-Konfiguration (Richtung oben/unten, Nullpunkt Boden/Start) war im
  gestapelten Modus ausgegraut — obwohl yAxisConfig dort sehr wohl sinnvoll
  ist: der untere Teilgraph ist jeweils die y-Komponente (Höhe y(t) bzw.
  v_y(t)/a_y(t)), und `drawSingleGraph` wendet `useYAxisConfig:true` darauf
  an (render.js), bzw. `ui.js` zeichnet ihn aus den `_display`-Daten. Die
  Sperre `!store.isStacked` war also zu restriktiv. Da im gestapelten Modus
  `graphType` auf `pos`/`vel`/`acc` steht (nicht auf `yt`/`vyt`/`ayt`), reicht
  das bloße Streichen nicht — die Bedingung wurde erweitert auf
  `!isTraj && (store.isStacked || includes yt/vyt/ayt)`: gestapelt immer aktiv
  (jede Option hat eine y-Komponente), Einzelfeld bei y-Zeitdiagramm, bei
  Bahnkurven und reinen x-Zeitdiagrammen weiterhin deaktiviert.

## v1.2.3 — 2026-07-07
### Refaktoriert (T6 — einheitliches fmt() via shared/js)
- **Lokale `fmt()`-Definition durch Import aus `shared/js/format.js` ersetzt**
  (in `render.js` re-exportiert). Identische Logik (Komma-Dezimal,
  `Number.isFinite`-Guard → '—') — keine Verhaltensänderung, nur DRY: eine
  repo-weite Hilfsfunktion statt neun lokaler.

## v1.2.2 — 2026-07-05

### Fix
- **Gestapeltes Diagramm zeichnete keine Kurven (nur Punkt bewegte sich):** Die
  Stacked-Graph-Elemente `#graph_line_top`/`#graph_line_bottom`/
  `#graph_point_top`/`#graph_point_bottom` hatten keine CSS-Regeln — die Polyline
  war unsichtbar (SVG-Default `stroke:none`), der Punkt erschien als schwarzer
  Default-Circle. CSS-Regeln (Stroke/Fill in Mint) ergänzt; zudem
  `.graph-title-text` (Single + Stacked) nachstyliert, das bisher ungestylt war
  (Default schwarz, im Dark Mode unsichtbar). Single-Modus war nicht betroffen.
- **Diagrammtyp-Auswahl im Dropdown funktionierte nicht:** Der `change`-Handler
  an `#graph_select` rief `resetSim(false)` ohne die neue Auswahl in
  `store.graphType` zu persistieren; `updateDropdownOptions` las den alten Wert,
  baute das Dropdown neu auf und resettete auf den alten Typ. Fix: neue Auswahl
  vor `resetSim` in `store.graphType` schreiben (Pattern wie Atwood/Zykloide).

## v1.2.1 — 2026-07-05

### Geändert (UI-Konsistenz)
- **Topbar-Buttonleiste (kanonisch):** Play/Pause/Reset aus der linken Sidebar
  in die Topbar (`topbar-right`) verschoben — immer erreichbar (vorher am unteren
  Bildschirmrand bei schmalem Viewport verschüttet). Reihenfolge: Theme-Toggle ·
  ▶ Play · ⏸ Pause · ↺ Reset · Diagramm (CSV) · Alle Daten (CSV). Alte
  `btn-row`-Sektion links entfernt.
- **Datenexport in Topbar:** Beide Export-Buttons aus rechter Sidebar in Topbar
  verschoben. Rechte „Datenexport"-Sektion entfernt. Wiring unverändert
  (DOM-IDs beibehalten).

## v1.2.0 — 2026-07-05

### Features
- **Vergleichsbahn als Umschalter in Visualisierung:** Statt zweier Buttons gibt
  es nun einen Toggle „Vergleichsbahn" direkt bei den Visualisierungs-Optionen.
  - **Aktivieren** friert die aktuell angezeigte Bahn ein.
  - **Deaktivieren** löscht die gespeicherte Bahn wieder.
  - Die eingefrorene Bahn wird in **derselben Farbe wie die Flugbahn** (`--c-traj`,
    blau), **70 % transparent** (`opacity: 0.3`) und **gestrichelt** gezeichnet —
    sobald eine zweite Bahn entsteht, sind beide klar unterscheidbar.
  - **Gating:** Der Toggle ist nur bedienbar, wenn „Bahn anzeigen" aktiv ist;
    sonst ist er **ausgegraut** (`disabled` + `.vis-toggle-row:has(input:disabled)`).
    Wird „Bahn anzeigen" ausgeschaltet, wird eine aktive Vergleichsbahn
    zwangsdeaktiviert und gelöscht.
  - Speicherung in **physikalischen Koordinaten** (`store.frozenTraj =
    {x:[…], y:[…]}`), nicht in Pixeln → die eingefrorene Bahn wird bei jedem
    Parameterwechsel durch den **aktuellen** Zoom neu projiziert; beide Bahnen
    teilen dasselbe Koordinatensystem.
  - **Zoom passt auf beide Bahnen** (Fit berücksichtigt aktuelle + eingefrorene
    Extents), damit nichts abgeschnitten wird.
  - `drawFrozenTrajectory()` in `render.js` (gate auf `togTrajectory.checked`);
    `updateCompareToggleState()` in `ui.js` für das Ausgrau-Gating;
    Legendeintrag für Vergleichsbahn (durchscheinende Bahn-Farbe).

### UX
- **„\(x\)/\(y\) gestapelt"-Toggle in den Diagramm-Block verschoben** — die
  Option betrifft die Diagrammdarstellung und gehört dorthin, nicht zu den
  Visualisierungs-Vektoren.

## v1.1.0 — 2026-07-05

### Features
- **Auftreffwinkel \(\alpha_{\text{imp}}\)** als zusätzlicher Wurfkennwert
  (gemessen von der Horizontalen, positiv unterhalb). Geometrische Größe,
  unabhängig von der Y-Achsen-Konfiguration. Neue Funktion `impactAngle()`
  in `physics.js`; Zeile im Wurfkennwerte-Panel + Formel im Physik-Block.
  Verifiziert: h₀=0 → Abwurfwinkel = Auftreffwinkel (Symmetrie); h₀>0 →
  Auftreff steiler als Abwurf; α=90° → 90°.

## v1.0.0 — 2026-07-04

Migration des reifen Standalone-Prototyps (`Standalone Proto/Schräger_Wurf/proto_standalone_schräger_wurf_v47.html`, 1049 Zeilen) in die modulare 6-Modul-Architektur gemäß `global_docs/simulation_instruction.md` (Sprint 4b, Backlog M1).

### Architektur
- 6-Modul-Scaffold: `constants.js`, `state.js`, `physics.js`, `render.js`, `ui.js` (+ `index.html`, `css/styles.css`).
- `ui.js` als ES-Modul-Entry (kein `main.js`).
- Echtes `precompute()` + `interpolateAt(t)` (Atwood-Muster) statt Per-Frame-Physik — Zeitreihen werden einmal pro Parameteränderung gefüllt, die RAF-Schleife indiziert nur.
- Shared Design-System (`../shared/css/design-system.css`) eingebunden; sim-spezifische Tokens + SVG-Target-Regeln in `css/styles.css`.
- 3-Spalten-Layout (280px 1fr 270px), Topbar mit Back-Button + Theme-Toggle, einklappbare Analyse-Sidebar (Default eingeklappt, off-screen body, MathJax-static).

### Features (Parität zum v47-Prototyp)
- Slider \(h_0\), \(|\vec{v}_0|\), \(\alpha\) mit Live-Reset.
- Geschwindigkeitsvektor mit optionaler \(v_x\)/\(v_y\)-Zerlegung, Beschleunigungsvektor (konstant \(g\downarrow\)), Bahn-Trajectory, gestapelte \(x\)/\(y\)-Ansicht.
- `graph_select`-Dropdown: Bahnkurven \(y(x)\)/\(x(y)\), Zeitverläufe (Ort, Geschw., Beschl. für \(x\) und \(y\)), Betrag \(|\vec v(t)|\); Single- und Stacked-Modus.
- Y-Achsen-Konfiguration (↑/↓ × Boden/Start) mit konsistenten Anzeige-Werten in Lineal, Diagramm, Live-Panel.
- Strichmännchen (Arm in \(\alpha\)-Richtung), horizontales + vertikales Lineal, Animations-Koordinatensystem-Overlay.
- Analog-Stoppuhr (Hauptzeiger 1 U/min/60 s, Subdial 1 U/s) + LCD-Digitaluhr-Easteregg (Klick auf Stoppuhr).
- Zoom-Auto-Fit (Wurf passt ins Animationsfeld, max. 2× Standard).
- CSV-Export (`;`-Trenner, Komma-Dezimal): Diagramm-spezifisch + Alle Daten.
- Live-Analyse-Panel (t, x, y, vₓ, vᵧ, |v|, aᵧ) + Wurfkennwerte (Flugzeit, Reichweite, Scheitelhöhe, Auftreffgeschw.) + statische MathJax-Physikformeln (achsenkonfigurationsabhängig, 4 Varianten).
- Dark Mode via `fh_theme`-localStorage-Key (persistiert über Übersicht↔Sim).
- Legende für alle Vektoren/Farben.

### Konventionen (CLAUDE.md)
- Vektoren standardmäßig sichtbar (`updateScene(0,…)` in `resetSim`).
- Farben via CSS-Tokens (`--c-vel`, `--c-acc`, `--c-vx`, `--c-vy`, `--c-traj`); Okabe-Ito-konform.
- Diagramm: `setAxisLabel`/`createStyledSvgText` (kursiv Symbole), Graph-Titel als letztes SVG-Kind, bg-Rect 10 px über Pfeilspitzen.
- Koordinatensystem-Konsistenz: Lineal = Diagramm = Regler-Label = Live-Panel.
- Dezimalkomma in UI/CSV, Punkt in SVG-Attributen.

### Bekannte Hinweise
- Erdbeschleunigung \(g = 9{,}8\,\text{m/s}^2\) (wie v47-Prototyp; Freier Fall nutzt 9,81).
- Stoppuhr-Design folgt dem v47-Prototyp (Analog + LCD-Easteregg), nicht dem Atwood-Standard-Layout — bewusst für Feature-Parität.