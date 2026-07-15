# Changelog — Kreisbewegung

Alle nennenswerten Änderungen an dieser Simulation. Version folgt
[SemVer](https://semver.org): patch = Bugfix/Style, minor = Feature,
major = brechende Änderung. Die Versionsnummer in `index.html` wird
mitgeführt.

## v1.2.0 — 2026-07-15

I12.9 — Diagramm-Steuerung: zwei unabhängige, frei kombinierbare Diagramm-
Picker statt fester x/y-Paarung im Zwei-Diagramm-Modus (→ BACKLOG I12,
Vorbild kreis_spiralbewegung).

### Geändert (I12.9)
- **Zwei unabhängige Picker** (`graph_select_1`/`graph_select_2`) ersetzen den
  bisherigen Mechanismus, bei dem der Zwei-Diagramm-Toggle automatisch ein
  festes Paar zeigte (z. B. „Ort" → oben *x*(*t*), unten *y*(*t*)). Jetzt
  wählt man für Diagramm 1 und Diagramm 2 unabhängig **jeden** Typ aus
  demselben Optionsset (z. B. Winkel *φ*(*t*) und Beschleunigungsbetrag
  |*a*|(*t*)). Beide Picker sitzen im Sidebar-Cluster „Diagramm"; Diagramm 2
  blendet sich per `#dual_graph_control` ein/aus.
- **Toggle-Label korrigiert:** „x/y gestapelt" → „Zwei Diagramme" (war seit
  dieser Änderung sachlich falsch, da die beiden Diagramme keine feste x/y-
  Bedeutung mehr haben). Widget bleibt bewusst ein Toggle-Switch (kein
  Rename auf `diagram_mode`/`speed-pill` — das ist eine separate, hier nicht
  beauftragte Änderung, → I12.8 betraf nur atwood/atwood_energy).
- **Bahnkurve (yx/xy) aus dem Zwei-Diagramm-Modus gefiltert:** sie hat keine
  Zeitachse und ist daher in keinem der beiden Picker wählbar, sobald „Zwei
  Diagramme" aktiv ist; Diagramm 2 bietet sie generell nie an.
- **Render-Vereinfachung:** `render.js::updateGraph` ruft `drawGraphSlot`
  jetzt für jeden Slot (Single, Top, Bottom) direkt mit dem jeweils echten,
  unabhängigen Typ auf — `drawGraphSlot` war bereits vollständig generisch
  (Titel/Achsenlabel/Skalierung kommen aus `graphTitles`/`graphAxisLabels`/
  `axisLimits[type]`), sodass kein Übersetzungs- oder Mapping-Code nötig war.
- **`constants.js`:** `stackedGraphOptions`/`stackedToTypes`/
  `singleToStackedMap`/`stackedToSingleMap` entfernt (ersatzlos, keine feste
  Paarung mehr); `singleGraphOptions` in `graphOptions` umbenannt (ein
  Optionsset für beide Picker).
- **`state.js`:** `store.graphType`/`store.stackedType` (zwei getrennte
  Felder für Single/Stacked) → `store.graphType1`/`store.graphType2` (zwei
  unabhängige, modusübergreifende Felder). `store.isStacked` bleibt
  unverändert als reines Layout-Flag.
- **CSV-Export:** der Export im Zwei-Diagramm-Modus liest jetzt
  `graphType1`/`graphType2` statt der festen Paar-Zuordnung; Dateiname
  `kreisbewegung_gestapelt_<typ1>_<typ2>.csv` spiegelt die frei gewählte
  Kombination.
- Verifiziert per Playwright-Smoke-Test (unabhängige Kombination
  *φ*(*t*)/|*a*|(*t*), Play/Pause, Layout-Umschalter im Zwei-Diagramm-Modus,
  Bahnkurve-Guard, CSV-Export) — keine Konsolenfehler.

## v1.1.7 — 2026-07-15

I12.4 — Diagramm-Steuerung: Typ-Picker aus der `.graph-toolbar` am Diagramm in
die linke Sidebar verschoben (kanonische „Sidebar-Schule", PO-Entscheidung
2026-07-15, → BACKLOG I12).

### Geändert (I12.4)
- **Diagramm-Typ-Picker** (`graph_select`) aus der `.graph-toolbar` über dem
  Graphen in einen neuen Sidebar-Cluster „Diagramm" verschoben (nach
  „Parameter", vor „Visualisierung") — alle Diagramm-Steuerung an einem Ort in
  der Sidebar. Klasse von shared `.graph-sel` zurück auf Sidebar-Standard
  `.select-field`.
- **Zwei-Diagramm-Toggle** (`toggle_xy_stacked`) aus dem Cluster „Visualisierung"
  in den neuen Cluster „Diagramm" verschoben, direkt unter den Picker — bleibt
  unverändert ein Toggle-Switch (kein Rename auf `diagram_mode`/`speed-pill`;
  kein Umbau in diesem Schritt, → I12.8 betrifft nur atwood/atwood_energy).
- **CSS:** `.graph-toolbar`-Regel aus `css/styles.css` entfernt (jetzt
  ungenutzt).

## v1.1.6 — 2026-07-14

I12.1 — Diagramm-Steuerung vereinheitlichen: lokale `.graph-sel` in shared CSS überführt.

### Geändert (I12.1)
- **CSS:** Die lokale `.graph-sel`-Definition (Diagramm-Typ-Picker in der
  `.graph-toolbar`) entfernt — kanonisch jetzt in `shared/css/design-system.css`
  (→ BACKLOG I12, Toolbar-Select-Klasse). Rein de-duplizierend, kein Sichtwechsel.

## v1.1.5 — 2026-07-13

B23 — Vektor-Pfeilspitzen bei zu kurzem Vektor (repo-weiter Fix des shared-Helpers `shortenEnd`).

### Behoben (B23)
- **Vektor-Pfeillänge/Spitze:** Der shared-Helper `shortenEnd` erzwang bei
  Vektorlängen ≤ Marker-Länge einen 2-px-Schaft-Stub, sodaß die refX=0-Spitze
  über das Ziel hinausschoß. `shortenEnd` gibt jetzt `null` zurück, wenn der
  Vektor kürzer als die Pfeilspitze ist; `setVec` verbirgt Orts-/
  Geschwindigkeits-/Beschleunigungsvektoren dann statt sie mit fehlerhafter
  Überschieß-Spitze zu zeichnen.

## v1.1.4 — 2026-07-13

Copyright-Marke + Disclaimer-Verweis (repo-weit, Vorbereitung I1/ILIAS-Veröffentlichung).

### Geändert
- **Topbar:** Copyright-Marke „© 2026 FH Aachen, FB 8 · Alle Rechte vorbehalten" neben
  dem Institutions-Span ergänzt. Keine Verhaltensänderung — rein rechtlicher Hinweis
  (volle Fassung in repo-root `NOTICE.md` und auf der Übersichtsseite).

## v1.1.3 — 2026-07-12

FK1 — Vorzeichen-Klarstellung für ω im Live-Panel.

### Hinzugefügt
- Kleiner Hinweistext im „Umlaufgrößen"-Panel: das Vorzeichen von \(\omega\)
  zeigt die Drehrichtung (negativ = gegen den Uhrzeigersinn), \(|\omega|\)
  ist die Umlaufgeschwindigkeit. Reiner Text-Zusatz, keine Berechnungs-
  änderung — `live_omega` zeigte den korrekt signierten Wert bereits vorher.

## v1.1.2 — 2026-07-11

T9 — shared/js-Helper konsolidieren.

### Geändert
- **`shortenEnd`/`setAxisLabel`/`setGraphTitle`/`tAxisStep`/`niceStepLE`**
  nutzen jetzt `shared/js/vectors.js`, `shared/js/svg-text.js` bzw.
  `shared/js/ticks.js` statt lokaler Kopien. **`shortenEnd`**: Algorithmus
  von hartem Cutoff auf garantierten 2px-Mindest-Schaft umgestellt
  (Mehrheits-Variante, konsistent mit Stoß/Rolling/3-Massen/Lorentz) —
  sichtbar nur bei Vektorlänge nahe 0 (z. B. \(v≈0\)); per Playwright
  verifiziert (omega=0/5°/s: Nullvektor unverändert, bei 5°/s jetzt exakt
  2px Mindest-Schaft statt vorherigem Cutoff-Wert). **`niceStepLE`**
  bekommt zusätzlich einen Nullwert-Guard (Bugfix, keine praktische
  Auswirkung).

## v1.1.1 — 2026-07-10

Akkordeon-Steuerungs-Sidebar (I8).

### Features
- **Akkordeon-Steuerungs-Sidebar**: 5→4 Cluster konsolidiert — „Diagramm"
  (nur ein Toggle: x/y gestapelt) in „Visualisierung" integriert
  (Single-Control-Cluster-Regel). Parameter/Visualisierung/Legende bleiben
  offen, „Abspielgeschwindigkeit" default eingeklappt. Referenz: Kreis-/
  Spiralbewegung v1.3.0 (Schwester-Sim). Per Browsertest verifiziert.

## v1.1.0 — 2026-07-09
### Geändert (Dual-Diagramme orthogonal zur Sim/Diagramm-Aufteilung)
- Im gestapelten Modus (zwei Diagramme, `isStacked`) liegen die beiden Diagramme
  nun **orthogonal zur Sim/Diagramm-Aufteilung**: im **Übereinander-Layout**
  (`layoutSplit=false`, breite Diagrammzelle) werden sie **nebeneinander** angeordnet
  (statt wie bisher übereinander gestapelt — in der breit-flachen Zelle waren die
  Teilgraphen sehr flach); im **Nebeneinander-Layout** (`layoutSplit=true`, hohe
  Zelle) bleiben sie **übereinander gestapelt** (unverändert). Die **Mittellinie**
  (Sim/Diagramm-Trenner, Grid-Partition) verschiebt sich nicht.
- Technisch: neue `stackedDualGeom()` liefert viewBox + `slotH` + `off2`-Versatz;
  Übereinander-Dual → viewBox `2·GRAPH_W_STACK+Gap` × `GRAPH_H_STACK` + X-Versatz,
  Nebeneinander-Dual → wie gehabt gestapelt. `graphSlotH` + `GRAPH_H_STACKED_STACK`
  entfallen. Kanonische Regel in `simulation_instruction.md` / `CLAUDE.md`
  hinterlegt (Rollout s. `BACKLOG.md`).

## v1.0.10 — 2026-07-07
### Behoben (T6-Regressions-Fix)
- **Simulation war nach T6 (v1.0.9) dysfunktional:** `fmt` wurde in `ui.js` über
  einen mehrzeiligen Import aus `render.js` bezogen (`  fmt,`), aber beim
  T6-Umzug auf `shared/js/format.js` war `render.js` fälschlich als „nur intern"
  eingestuft und das `export { fmt }` weggelassen worden → Importfehler → Modul
  lud nicht. Fix: `export { fmt }` in `render.js` nachgetragen.

## v1.0.9 — 2026-07-07
### Refaktoriert (T6 — einheitliches fmt() via shared/js)
- **Lokale `fmt()`-Definition durch Import aus `shared/js/format.js` ersetzt.**
  Identische Logik (Komma-Dezimal, `Number.isFinite`-Guard → '—') — keine
  Verhaltensänderung, nur DRY: eine repo-weite Hilfsfunktion statt neun lokaler.

## v1.0.8 — 2026-07-06

### Fix
- **Vektor-Pfeilspitzen sitzen jetzt exakt auf dem Zielpunkt (nicht zu
  kurz).** v1.0.7 hatte `refX = markerWidth` (Spitze am Linien-Ende)
  **und** die Schaft-Kürzung um die Marker-Länge kombiniert — eine
  Doppelkompensation: die Spitze wurde dadurch um genau eine Marker-Länge
  **hinter** den Zielpunkt gezogen. Sichtbar am Ortsvektor, dessen goldene
  Spitze am linken Rand des Massenpunkts endete statt in dessen Zentrum.
  Fix: alle Animations-Marker auf `refX = 0` gesetzt (Dreieck-**Basis** am
  gekürzten Linien-Ende, Spitze läuft eine Marker-Länge nach vorn). Zusammen
  mit der beibehaltenen Schaft-Kürzung landet die Spitze exakt auf dem
  Zielpunkt, der Schaft endet an der Dreieck-Basis (kein seitliches
  Herausgucken). Deterministische Geometrie — keine Augenmaß-Justierung.
  Widersprüchliche Regel in `CLAUDE.md` und
  `global_docs/simulation_instruction.md` entsprechend korrigiert.

## v1.0.7 — 2026-07-06

### Fix
- **Vektor-Pfeilspitzen: Schaft-Kürzung verhindert seitliches Ausgucken
  aus der Spitze.** v1.0.3 hatte die Spitze via `refX = markerWidth` korrekt
  auf den Vektor-Endpunkt gesetzt (kein Überschießen mehr). Dabei lief der
  Schaft aber bis zum Endpunkt durch — und da das Dreieck auf eine Punkt-
  Spitze zuläuft (0 Breite), der Schaft aber konstant `1·strokeWidth` breit
  ist, war das Dreieck nahe der Spitze schmaler als der Schaft: die Schaft-
  Kanten guckten seitlich aus der Spitze heraus („man sieht den darunter-
  liegenden Schaft, dort wo die Spitze zusammenläuft").
  Fix: der Schaft wird am Endpunkt um die Marker-Länge
  (`markerWidth · strokeWidth` px) gekürzt, sodaß er an der Dreieck-Basis
  endet; das deckend gefüllte Dreieck (via CSS `#arrowhead-* polygon`) über-
  deckt den Schaft dann vollständig. Hilfe `shortenEnd(x1,y1,x2,y2, by)` zieht
  den Endpunkt in Vektor-Richtung zurück (Guard: bei `len ≤ by` unverändert,
  z. B. bei t=0, φ₀=0 der y-Komponenten-Vektor der Länge 0).
  - Hauptvektoren (Ort/Geschw./Beschl., sw=2,5): Kürzung 12,5 px.
  - Komponenten (rₓ/rᵧ etc., sw=2): Kürzung 10 px.
  - Koordinatenachsen (sw=1,2): Kürzung 6 px.
  Ausnahme `#graph-arrowhead` (Graph-Achsenpfeile) bleibt auf `refX=0`
  **ohne** Schaft-Kürzung — das Graph-bg-Rect ist um die Pfeilspitze
  dimensioniert.
- **Lernen zentral hinterlegt** (CLAUDE.md + `global_docs/simulation_instruction.md`):
  Die Regel „Vektor-Pfeilspitzen" um die Schaft-Kürzung ergänzt — `refX`
  allein reicht nicht (Spitze am Endpunkt, aber Schaft durch zu weit);
  erst die Kürzung macht die Spitze sauber.

## v1.0.6 — 2026-07-06

### Fix
- **Diagramm-Überschrift im Split-Modus plot-relativ plaziert**: Der Titel
  wurde bisher viewBox-zentriert (`x = gW/2`, `y = 18`) gesetzt. Im
  Nebeneinander-Layout (Portrait 410×700) ist der Plotbereich der Bahnkurve
  aber als zentriertes Quadrat vertikal tief gelegen (`plotT ≈ 179`) und
  horizontal versetzt (`plotL+plotW/2 ≈ 226`), sodaß die Überschrift weit
  oben über dem Plot schwebte statt direkt darüber. `drawGraphSlot` setzt
  den Titel jetzt auf `x = plotL + plotW/2`, `y = plotT − 10` (10 px über
  der Plot-Oberkante) — paßt für alle Layouts (Split/Gestapelt) und Modi
  (Single/Stacked, Bahnkurve/Zeitreihe), da der Titel stets über dem
  tatsächlichen Plot-Bereich zentriert ist.

## v1.0.5 — 2026-07-06

### Feature (Probe — Nebeneinander-Layout verfeinert)
- **Sim- und Graph-ViewBox im Split-Modus portrait**: Im Nebeneinander-Layout
  werden Sim- und Diagramm-Zelle hochkant ausgefüllt statt mit einer landscape-
  ViewBox klein zu bleiben. Sim `450×480` → `450×720` (Zentrum mittig bei
  `cy=360` statt 260), Graph `700×410` → `410×700`. Beide ViewBoxen werden per
  JS in `setupScene`/`updateGraph` aus `store.layoutSplit` gesetzt; die
  Graph-Geometrie (`graphW`/`graphHFull`/`graphSlotH` für Single bzw. gestapelte
  Teilgraphs) ist nun layout-abhängig. Der Kreis füllt die schmale Sim-Breite,
  Stoppuhr (oben) und Zeit-Label (unten) nutzen den vertikalen Freiraum.
- **Layout-Wechsel live ohne Sim-Reset**: Der Toggle ruft `relayout()` —
  `setupScene` + `updateGraph` + `updateScene` mit dem neuen Zentrum —, sodaß
  ViewBox/Zoom/Koordinatensystem/Szene/Graph sofort neu aufgebaut werden,
  ohne die Sim-Zeit zurückzusetzen (laufende Animation wird nicht gestört).
- **Layout-abhängige Konstanten** in `constants.js`: `ANIM_H_STACK/SPLIT`,
  `ANIM_CY_STACK/SPLIT`, `GRAPH_W/H_STACK/SPLIT`, `GRAPH_H_STACKED_STACK/SPLIT`
  (statt der früheren einzelnen `ANIM_H`/`GRAPH_W`/…). `ANIM_W`/`ANIM_CX` sind
  für beide Layouts gleich (450 / 225).

## v1.0.4 — 2026-07-06

### Feature (Probe)
- **Layout-Umschalter übereinander ↔ nebeneinander** (probehalber): Toggle-Button
  in der Topbar neben „← Übersicht" schaltet `#center_area` zwischen dem
  Default-Layout (Sim oben, Diagramm unten — gestapelt) und einem
  Nebeneinander-Layout (Sim links, Diagramm rechts) über die Klasse
  `.layout-split` (`grid-template-columns: 1fr 1fr`). Wahl wird in
  `localStorage` (`kb_layout`) persistiert. Auf Viewports ≤1100 px fällt das
  Nebeneinander auf Gestapelt zurück (kein Gequetsche). Hinweis: die Graph-
  ViewBox bleibt landscape — `preserveAspectRatio=meet` zentriert sie in der
  schmalen Zelle; eine echte Portrait-Variante (GRAPH_W/GRAPH_H + Plot-Geometrie
  getauscht) ist bewußt offen für eine Folge-Iteration, falls das
  Nebeneinander-Layout gefällt.

## v1.0.3 — 2026-07-06

### Fix
- **Vektor-Pfeilspitzen sitzen auf dem Endpunkt (kein Überschießen mehr):**
  Alle 10 Animations-Marker (`anim-arrowhead`, `arrowhead-r/v/a/rx/ry/vx/vy/ax/ay`)
  von `refX=0` auf `refX=5` (= markerWidth) gesetzt. Bei `refX=0` ragte die
  Pfeilspitze um `markerWidth · strokeWidth` über den Vektor-Endpunkt hinaus
  — der Ortsvektor (und seine x/y-Zerlegung) endete damit jenseits des
  Kreisradius statt auf ihm. `refX=markerWidth` plaziert die Spitze exakt auf
  dem Endpunkt (Polygon liegt komplett hinter dem Endpunkt). Betroffen waren
  alle Vektoren (Ort/Geschw./Beschl. + Komponenten), nicht nur die Orts-
  Zerlegung. `#graph-arrowhead` bleibt bewußt auf `refX=0` (Graph-bg-Rect ist
  um die Achs-Pfeilspitze dimensioniert, siehe CLAUDE.md-Regel „10 px past
  arrow tips").
- **Lernen zentral hinterlegt** (CLAUDE.md + `global_docs/simulation_instruction.md`):
  Simulations-Vektoren → `refX = markerWidth`; Graph-Achsenpfeile → `refX=0`
  mit bg-Rect-Kompensation. Bekannter, teils nur unvollständig behobener Bug
  (Lorentz/rolling_bodies nutzen `refX = markerWidth − 1` → Rest-Überschießung).

## v1.0.2 — 2026-07-06

Layout- und Darstellungs-Refinements.

### Style
- **Simulationsdarstellung ×1,2**: `DEFAULT_PIXELS_PER_METER` 82 → 98,4,
  `PIXELS_PER_VELOCITY_UNIT` 20 → 24, `PIXELS_PER_ACCELERATION_UNIT` 5 → 6 —
  alle drei Pixel-Konstanten einheitlich um 1,2, sodaß Kreis, Orts-,
  Geschwindigkeits- und Beschleunigungsvektoren gleichmäßig vergrößert werden.
  Das Zentrum (`ANIM_CX`/`ANIM_CY`) bleibt fest; Auto-Zoom greift bei großen R
  weiterhin. Uhr und Zoom-Text sind davon nicht betroffen (eigene Transforms).
- **Stoppuhr auf 80 % und zur Seite**: `scale 0,8`, etwa eine halbe Uhrbreite
  zur Seite sowie noch ~0,2 Uhrbreite nach rechts und unten geschoben
  (`translate(181, -13) scale(0.8)`). Die rechte Hälfte des analogen Kreises
  ragt leicht über den viewBox-Rand (gewünschte Eck-Platzierung).

### Behavior
- **Bahnkurve wird erst während des 1. Umlaufs gezeichnet** (Animation und
  Diagramm): In der Animation ist `trajectory_path` jetzt ein `<path>`, dessen
  `d` in `updateScene` aus den getasteten Positionen `0 .. min(t, T)` aufgebaut
  wird. Im Bahnkurven-Diagramm (`y(x)`/`x(y)`) zeichnet `drawGraphSlot` die
  Polyline ebenfalls nur bis `min(t, T)` (statt sofort die vollständige Kurve).
  Bei `t=0` ist kein Kreis zu sehen (nur der Startpunkt), die Bahn entsteht
  progressiv im 1. Umlauf und ist danach der vollständige Kreis.
  `drawTrajectoryCircle` setzt nur noch `disk.r` (die `r`-Zuweisung an den
  ehemaligen `<circle>` entfällt).

## v1.0.1 — 2026-07-06

Bugfix- und Style-Release nach der Migration.

### Fix
- **Achsenposition in Zeitreihen korrigiert**: In allen `*t`-Diagrammen saß
  die Ordinate (vertikale Achse) am rechten Plot-Rand statt links, und die
  Abszisse war bei nicht-negativen Größen (|v|, |a|, φ) fälschlich in der
  Mitte (y=0). Ursache: invertierte Branches in `drawGraphSlot`
  (`render.js`) bzw. symmetrische y-Range für eigentlich nicht-negative
  Größen. Letzteres behoben über die `pos()`-Hilfe in `recalculateAxisLimits`
  (`physics.js`): y-Range ab 0 → Abszisse am unteren Rand. Ordinate nun
  links (`xMin ≥ 0` → `plotL`), am Nulldurchgang bei Werten um 0.
- **φ-Plot ohne 360°→0-Sägezahn**: `phitData` speichert jetzt den
  ungebrochenen Winkel (`phi·180/π`); die Live-Anzeige nutzt separat
  `angleDeg()` (normiert auf [0°, 360°)).

### Style
- **Gleichskalierte Bahnkurven (Sonderfall Kreisbahn)**: Für die
  Bahnkurven-Diagramme `y(x)`/`x(y)` wird ein zentrierter quadratischer
  Plot-Bereich verwendet (Seite = min(volle Breite, volle Höhe)), sodaß
  x- und y-Achse gleiche px/Einheit haben und die Kreisbahn rund
  erscheint. Zeitreihen behalten das unabhängig skalierte Landscape-Format.
- **Zeichenfläche ~10 % vergrößert** (ohne Diagramm einzuschränken):
  `DEFAULT_PIXELS_PER_METER` 75 → 82.
- **Stoppuhr zur Seite in die Ecke und auf scale 1,50 vergrößert**
  (`translate(-90, -70) scale(1.5)`); analoger Kreis Ø 216 px innerhalb
  des viewBox.

## v1.0.0 — 2026-07-06

Erste modulare Version. Migration des bisherigen Standalone-Prototypen
`AllAnimations/kreisbewegung.html` (1071 Zeilen, Einzel-Datei) in die
kanonische 6-Modul-Architektur des Repos.

### Features
- **6-Modul-Architektur**: `constants.js` · `state.js` · `physics.js` ·
  `render.js` · `ui.js` (ES-Module-Einstieg) · `index.html`/`css/styles.css`.
  Entry-Point ist `js/ui.js` (kein `main.js`); DOM-Cache-Initializer
  heißt `initDOM()`.
- **Precompute + Interpolation**: `precompute()` füllt die Zeitreihen für
  `max(4T, 10 s)`; `interpolateAt(t)` interpoliert linear. Animation
  indiziert nur in die Arrays — keine Per-Frame-Physik. Dynamische
  Erweiterung via `extendMotionData`, wenn die Sim-Zeit ans Ende stößt.
- **Kanonische Topbar-Buttonleiste**: `▶ Play` · `⏸ Pause` · `↺ Reset` ·
  `Diagramm (CSV)` · `Alle Daten (CSV)` in der Topbar (nicht in der Sidebar).
- **3-Spalten-Layout** `280px 1fr 270px` mit **einklappbarer Analyse-Sidebar**
  (default eingeklappt, 44-px-Schiene, Body off-screen — nie `display:none`,
  damit MathJax die Formeln im Hintergrund typesetted).
- **Gestapeltes Center-Layout** (Simulation oben, Diagramm unten) analog
  Federpendel / Rollende Körper.
- **Shared Design-Tokens**: `../shared/css/design-system.css` vor per-sim
  `css/styles.css` verlinkt. FH-Mint, `DM Sans`/`JetBrains Mono` via
  `--font-ui`/`--font-mono`. Vektorfarben: Hauptvektoren aus shared
  (`--c-vel` Geschwindigkeit, `--c-acc` Beschleunigung, `--c-r` Ort als
  sim-spezifischer Token analog `--c-p1`), Komponenten sim-spezifisch
  (`--c-rx/-ry`, `--c-vx/-vy`, `--c-ax/-ay`, `--c-traj`) mit Dark-Mode-
  Varianten — farbblindensicher (kein purple+green+orange zugleich).
- **Dark Mode** über einheitlichen LocalStorage-Key `fh_theme` (persistiert
  beim Navigieren Übersicht↔Sim).
- **CSV-Export** mit `sep=;`-Header, Semikolon-Trenner, Komma-Dezimal:
  „Diagramm (CSV)" exportiert die aktuell gewählte Größe (Single: Zeitreihe
  oder Bahnkurve x;y, Stacked: t + zwei Größen), „Alle Daten (CSV)" den
  vollständigen Datensatz (t, x, y, vx, vy, |v|, ax, ay, |a|, φ).
- **Legende** in der linken Sidebar für alle farbcodierten Vektoren +
  Komponenten + Bahnkurve.
- **Vektoren default sichtbar** (Hauptvektoren `checked`), Komponenten
  default aus. Vektoren werden auch im Ruhezustand (t=0) gezeichnet —
  `updateScene(0,…)` in `resetSim`.
- **Statisches MathJax**: Formeln als statisches HTML in `index.html`
  (kein Laufzeit-`typesetPromise`).
- **Physik-Schreibweise**: \(\varphi(t)=\varphi_0+\omega t\),
  \(x=R\cos\varphi\), \(y=R\sin\varphi\); \(v_x=-R\omega\sin\varphi\),
  \(v_y=R\omega\cos\varphi\); \(a_x=-R\omega^2\cos\varphi\),
  \(a_y=-R\omega^2\sin\varphi\) (Zentripetalbeschleunigung);
  \(|\vec v|=R|\omega|\), \(|\vec a|=R\omega^2=|\vec v|^2/R\),
  \(T=2\pi/|\omega|\).
- **Parameter**: Radius \(R\) (0,5–2,0 m), Anfangswinkel \(\varphi_0\)
  (0–360°), Winkelgeschwindigkeit \(\omega\) (−180…+180 °/s, auch negativ
  = Umkehrrichtung), Abspielgeschwindigkeit 1×/½×/¼×/⅛×. Zoom paßt den
  Kreis automatisch in die Zeichenfläche.
- **Vektoraddition-Stil Komponenten**: \(r_x\) vom Zentrum, \(r_y\) am Ende
  von \(r_x\) (rechtwinklige Zerlegung); analog für \(v\) und \(a\).
- **Diagrammtyp-Dropdown** aus Nutzerperspektive benannt: Bahnkurven
  (y(x), x(y)), Orts-/Geschw.-/Beschl.-Komponenten je x(t)/y(t), Beträge
  |v|(t)/|a|(t) und Winkel φ(t). „x/y gestapelt"-Toggle zeigt je Größe die
  x- und y-Komponente in zwei gestapelten Teilgraphs (bei Bahnkurven
  deaktiviert).
- **Graph-Konventionen** (zentral aus CLAUDE.md/Blueprint übernommen):
  Beide Achsen ≥4 beschriftete Ticks inkl. 0 (1-2-4-5-Folge via
  `niceStepLE` für Ordinate/Position, `tAxisStep` für Zeitachse);
  Abszisse am Nulldurchgang bei Werten um 0 (Schwingungsgrößen x/y/v/a);
  Diagramm-Format pro Layout (Landscape gestapelt); Titel als letztes
  SVG-Kind, klar über weißem Hintergrund; gepaddetes Plot-Gebiet.
- **Stacked-Graph-CSS-Regeln** (Phase-0-Lektion aus Schrägem Wurf): für
  `#graph_line_top`/`#graph_line_bottom`/`#graph_point_top`/
  `#graph_point_bottom` explizite `stroke`/`fill`-Regeln — SVG-Default
  `stroke:none` machte Linien sonst unsichtbar.
- **Stoppuhr** (analog + LCD-Digitaluhr-Easteregg, Klick auf Stoppuhr
  schaltet um), Two-Hand-Design wie Atwood.

### Migrations-Hinweise
- Separate Migration von `kreiskinematik_v5` (M6b) — thematisch Drehung/
  Spirale, nicht identisch. Keine Konsolidierung.
- Der Prototyp `AllAnimations/kreisbewegung.html` und der Quellordner
  (falls vorhanden) werden nach erfolgreicher Abnahme stillgelegt
  (Dubletten-Regel aus `BACKLOG.md`).
- Vorschaubild in `AllAnimations/Vorschaubilder/` belassen (kein
  Emoji-Platzhalter).