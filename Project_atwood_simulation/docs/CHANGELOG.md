# Changelog – Atwood-Maschine

## v2.3.0 — 2026-07-15

I12.7 + I12.8 — Diagramm-Steuerung: Optionen zentralisiert + Mehrfach-Modus-
Dialekt vereinheitlicht (→ BACKLOG I12).

### Geändert (I12.7)
- **Diagrammtyp-Optionen zentralisiert:** neue `GRAPH_OPTIONS`-Map in
  `js/constants.js` (Label je Typ-Schlüssel `y`/`v`/`a`/`yrel`/`ydiff`).
  `updateGraphSelectors()` in `ui.js` baut die Options-Listen jetzt aus dieser
  Map statt aus hartkodierten Label-Strings. Die (bereits zuvor toten, da bei
  jedem Laden von `populateSelect()` sofort überschriebenen) statischen
  `<option>`-Elemente in `graph_select_1`/`graph_select_2` in `index.html`
  entfernt.

### Geändert
- **Mehrfach-Modus-Kontrakt kanonisiert:** der bisher eigene Dialekt
  `graph_mode`/`.radio-pill`/`single`\|`dual` ersetzt durch den repo-weiten
  Kontrakt `diagram_mode`/`.speed-pill`/`1`\|`2` (Labels „Ein Diagramm"/„Zwei
  Diagramme" statt „Einzeln"/„Geteilt") — gleiche Widget-Klasse wie
  Abspielgeschwindigkeit, Atwood-Energie und die übrigen Sims mit
  Zwei-Diagramm-Modus. Sidebar-Platzierung war bereits kanonisch (Atwood
  bleibt Sidebar, → I12.4) und ist von dieser Änderung nicht betroffen.
- **CSS:** die lokale `.radio-group`/`.radio-pill`-Definition entfernt
  (ungenutzt, jetzt shared `.speed-pills`/`.speed-pill`).
- **JS:** `updateModePills()` (identisch zu `updateSpeedPills()`, nur mit
  `.radio-pill`-Selektor) entfernt — `updateSpeedPills()` deckt jetzt beide
  Pill-Gruppen ab (generischer `.speed-pill`-Selektor).
- Rein internes Verhalten (`store.graphCfg.mode` intern weiterhin `'1'`/`'2'`
  statt `'single'`/`'dual'`); keine funktionale Änderung an Diagrammauswahl,
  CSV-Export oder Render-Logik.

## v2.2.8 — 2026-07-13

Copyright-Marke + Disclaimer-Verweis (repo-weit, Vorbereitung I1/ILIAS-Veröffentlichung).

### Geändert
- **Topbar:** Copyright-Marke „© 2026 FH Aachen, FB 8 · Alle Rechte vorbehalten" neben
  dem Institutions-Span ergänzt. Keine Verhaltensänderung — rein rechtlicher Hinweis
  (volle Fassung in repo-root `NOTICE.md` und auf der Übersichtsseite).

## v2.2.7 — 2026-07-11

T9 — shared/js-Helper konsolidieren.

### Geändert
- **`setAxisLabel`/`setGraphTitle`/`tAxisStep`/`getNiceTick`** nutzen jetzt
  `shared/js/svg-text.js` bzw. `shared/js/ticks.js` statt lokaler Kopien.
  `getNiceTick` wird weiterhin direkt (ohne `tAxisStep`-Wrapper) für die
  Werteachse importiert. Keine sichtbare Änderung.

## v2.2.6 — 2026-07-10

Akkordeon-Steuerungs-Sidebar (I8).

### Features
- **Akkordeon-Steuerungs-Sidebar**: die 5 Cluster der linken Sidebar
  (Massen, Startpositionen, Visualisierung, Legende Kräfte,
  Abspielgeschwindigkeit) sind jetzt einzeln auf-/zuklappbar (Referenz:
  Kreis-/Spiralbewegung v1.3.0). Default eingeklappt: „Legende Kräfte" +
  „Abspielgeschwindigkeit" (selten nach dem initialen Setup angepaßt);
  Massen/Startpositionen/Visualisierung bleiben offen. Per Browsertest
  verifiziert, inkl. Grenzfall bedingt sichtbarer Inhalte (`#diff_group`
  im „y1diff"-Modus) innerhalb eines Clusters — kein „Durchblitzen" beim
  Einklappen.

## v2.2.5 — 2026-07-10

Startpositionsgrenzen von Atwood-Energie übernommen + F_G/F_ges je Masse
in „Physik (konstant)" ergänzt. FA4, FA5.

### Features
- **Startpositionsgrenzen von Atwood-Energie übernommen (FA4)**:
  `y1_slider`/`y2_slider` `min`/`max` 70/330 → 40/320 cm (Höhe vom Boden),
  Diff-Modus-Klammer in `ui.js` (`Math.min(330,…)`/`Math.max(70,…)` →
  `Math.min(320,…)`/`Math.max(40,…)`) analog angepasst. Physikalisch
  identische Maschine wie Atwood-Energie (gleiche `MASS_BASE`/
  `MASS_FACTOR`/`Y_MAX_CM`) — bei max. Masse (10 kg, Halbhöhe 27,5 cm)
  keine Kollision mit Boden/Oberkante (→ FAE1/FAE6).
- **\(F_G\)/\(F_{\text{ges}}\) je Masse in „Physik (konstant)" (FA5)**:
  Live-Werte-Box zeigte bisher nur \(a_1\), \(a_2\), \(F_S\). Ergänzt:
  \(F_{G,1}=m_1 g\), \(F_{G,2}=m_2 g\) (immer positiv, Schwerkraft) sowie
  \(F_{\text{ges},1}=m_1 a_1\), \(F_{\text{ges},2}=m_2 a_2\) (resultierende
  Kraft je Masse) — `a_i` dabei im selben Höhen-Vorzeichen wie die bereits
  angezeigten \(a_1\)/\(a_2\) (B14-Konvention: `F_ges,1 = m1·(-accel)`,
  `F_ges,2 = m2·accel`), damit \(F=ma\) mit den sichtbaren Werten
  konsistent aufgeht. Neue DOM-IDs `live_fg1`/`live_fg2`/`live_fnet1`/
  `live_fnet2`. *(PO-Wunsch 2026-07-10)*

## v2.2.4 — 2026-07-10

Vorzeichen von v₁/v₂/a₁/a₂ auf die Höhen-Konvention korrigiert. Bugfix B14.

### Fixes
- **v₁/v₂/a₁/a₂ hatten invertiertes Vorzeichen gegenüber y₁/y₂ (B14,
  kritisch)**: `y1_data`/`y2_data` sind kanonisch als „Höhe vom Boden"
  gespeichert (wächst beim Steigen). `v1_data`/`a1_data` (`physics.js`)
  wurden dagegen direkt aus der **Apertur-Koordinate** übernommen (positiv
  wenn m₁ **fällt**), ohne die Umrechnung, die `yrel1_data`/`yrel2_data`
  bereits korrekt anwenden. Folge: Live-Panel, „v"/„a"-Diagramme und
  CSV-Export zeigten bei fallendem m₁ (y₁ sinkt) ein **positives,
  wachsendes** v₁ statt negativ — Ableitungsbeziehung dy/dt=v verletzt.
  Gefunden bei der kritischen Physik-Review der Schwester-Sim
  Atwood-Energie (identisches Pattern, dort als B14 zuerst behoben).
  **Korrigiert:** `physics.js` `v1_data.push(-v)`/`v2_data.push(v)`/
  `a1_data.push(-accel)`/`a2_data.push(accel)`; `render.js` Live-Panel
  `liveA1`/`liveA2` (nutzte `accel` direkt statt Array) ebenfalls getauscht.

## v2.2.3 — 2026-07-07
### Refaktoriert (T6 — einheitliches fmt() via shared/js)
- **Lokale `fmt()`-Definition durch Import aus `shared/js/format.js` ersetzt**
  (in `render.js` re-exportiert, damit `ui.js` weiterhin `import { fmt }` bezieht).
  **Neu:** `Number.isFinite`-Guard → '—' statt bisherigem 'NaN'-String bei nicht-
  endlichen Werten (latenter Bugfix; Atwood hatte keinen Guard). Komma-Dezimal
  unverändert — keine sichtbare Änderung im Normalbetrieb.

## v2.2.2 — 2026-07-05
### Geändert (UI-Konsistenz)
- **Topbar-Buttonleiste (kanonisch):** Play/Pause/Reset aus der linken Sidebar in die Topbar (`topbar-right`) verschoben — immer erreichbar. Reihenfolge: Theme-Toggle · ▶ Play · ⏸ Pause · ↺ Reset · Diagramm (CSV) · Alle Daten (CSV). Alte `btn-row`-Sektion links entfernt.
- **Datenexport in Topbar:** Beide Export-Buttons aus rechter Sidebar in Topbar verschoben. Rechte „Datenexport"-Sektion entfernt. Wiring unverändert (DOM-IDs beibehalten).

## v2.2.1 — 2026-07-03
### Behoben (Fixed)
- **Dark-Mode-Persistenz vereinheitlicht:** Theme-Key `atw_theme` → `fh_theme` (CLAUDE.md-Konvention). Der Dark Mode bleibt jetzt beim Navigieren Übersicht↔Sim erhalten und startet in jeder Sim im zuletzt gewählten Modus.

## v2.2.0 — 2026-07-03
### Hinzugefügt (Feature)
- **Einklappbare Live-Analyse-Sidebar:** Rechte Sidebar (Physik konstant, Live-Analyse, Diagramm, Datenexport, Physik) jetzt ein-/ausklappbar. Steuerung sitzt als Header direkt am Panel (Double-Chevron, rotiert beim Zustandswechsel). Default eingeklappt (44-px-Schiene mit vertikalem „Analyse"-Label) — die Sim-/Diagrammfläche hat beim Laden maximal Platz. Body eingeklappt off-screen (`position:fixed; left:-10000px`) statt `display:none`, damit MathJax die Formeln im Hintergrund typesetzt. `aria-expanded`/`aria-controls` + Fokus-Ring. Umgesetzt nach Best-Practice-Blueprint `global_docs/simulation_instruction.md` § „Einklappbare Analyse-Sidebar".

### Geändert (Refactor)
- **Shared Design-CSS eingebunden:** `../shared/css/design-system.css` vor der per-Sim `css/styles.css` verlinkt (DRY). Base-Tokens, Layout-Grid, Klapp-Sidebar-CSS und UI-Komponenten (Topbar, Panel, Slider, Toggle, Buttons, Legende, Formel-Box) nun zentral aus shared; per-Sim `styles.css` bereinigt auf Atwood-spezifische Tokens (`--sim-bg`/`--pulley-*`/`--c-m1`/`--c-m2`) + SVG-Target-Regeln + Radio-Group + Center-Layout (Sim links | Graph rechts). Google-Fonts-Link entfernt (shared `@import`et sie).

## v2.1.10 — 2026-07-03
### Behoben (Fixed)
- **Back-Button:** Übersicht-Link nach Move des Übersichtsordners an den Repo-Root korrigiert (`../Standalone%20Proto/AllAnimations/…` → `../AllAnimations/…`).

## v2.1.9 — 2026-06-15
**Feature: Diagrammtyp „Verschiebung ab Start" + Umbenennung**

- Neuer Diagrammtyp „Verschiebung ab Start" (yrel) in allen Modi verfügbar — zeigt Δy₁(t) bzw. Δy₂(t) für die jeweilige Masse
- „Positionsdifferenz Δy" → „Abstand der Massen Δy" (intuitiver)
- CSV-Export: yrel-Daten korrekt eingebunden, Labels als Δy₁/Δy₂

## v2.1.8 — 2026-06-15
**Bugfix: Slider-Richtung + Graphtitel höher**

- Startpositions-Slider y₁/y₂ auf Höhe-vom-Boden umgestellt: `min=70, max=330, value=250` — rechts schieben = Höhe steigt (war umgekehrt)
- Graphtitel in allen 3 SVGs: `y="18"` → `y="10"` (höher, klar über Plotbereich)
- t-Achse: `getNiceTick(t_max,6)` → `tAxisStep(t_max)` — garantiert ≥3 Zeitmarken außer 0

## v2.1.7 — 2026-06-15
**Bugfix: Koordinatensystem Lineal ↔ Diagramm konsistent**

- y₁/y₂-Daten in physics.js auf Höhe vom Boden (cm) umgestellt — Lineal und Diagramm zeigen dieselbe Größe
- Animations-Loop in ui.js konvertiert zurück auf Abstand-von-Apertur für SVG-Positionierung (svgY erwartet dieses Koordinatensystem)
- Regler-Anzeigewerte für y₁/y₂ ebenfalls auf Höhe-vom-Boden umgestellt (war Abstand-von-Apertur)
- Graphtitel-Z-Order: `<text class="graph_title">` in allen 3 SVGs ans Ende verschoben (nach Polylines + Circles) — liegt jetzt immer im Vordergrund
- Live-Panel (y₁, y₂, Δy) ebenfalls auf Höhe vom Boden umgestellt
- yrel₁/yrel₂: Verschiebung vorzeichenrichtig (negativ beim Fallen, positiv beim Steigen)

## v2.1.6 — 2026-06-15
**Feature: Diagrammtyp „Position relativ zum Start" + Graphtitel-Z-Order**

- Neuer Diagrammtyp `yrel`: zeigt Verschiebung Δy₁(t) = y₁(t) − y₁(0) / Δy₂(t) = y₂(t) − y₂(0) in cm; verfügbar in Diagrammtyp 1 und 2
- Physics.js: `yrel1_data` / `yrel2_data` werden in `precompute()` berechnet und in `axisLimits` registriert
- Graphtitel: `<text class="graph_title">` in allen 3 SVGs nach `<g class="graph_grid">` verschoben — Titel nicht mehr von weißer Hintergrundfläche verdeckt

## v2.1.5 — 2026-06-15
**Lineal: 0 unten (physikalisch natürliche Orientierung)**

- Lineal-Beschriftung invertiert: 0 cm am Boden, Maximalwert oben — entspricht der Erwartung „Höhe nimmt nach oben zu", passend zum Default m₁ > m₂

## v2.1.4 — 2026-06-15
**PO-Review-Korrekturen XIV**

- Achsenpfeile in allen drei Graph-SVGs ergänzt: Marker `#arr-axis-g` wird per `ensureAxisMarker()` beim ersten Zeichnen in die SVG-Defs injiziert
- y-Achse von unten→oben gezeichnet (marker-end zeigt aufwärts), x-Achse links→rechts
- Hintergrund-Rect 10 px über y-Pfeil und rechts vom x-Pfeil erweitert

## v2.1.3 — 2026-06-15
**PO-Review-Korrekturen XIII**

- Resultierende überall von `F_{\text{res}}` → `F_{\text{ges}}` umbenannt (Toggle, Legende)

## v2.1.2 — 2026-06-15
**PO-Review-Korrekturen XII**

- Seilkraft überall von `F_T` → `F_S` umbenannt (Toggle, Legende, Analyse-Panel, MathJax-Formel)
- Interne IDs (`force_t1_vector`, `arr-ft`, CSS-Klassen) unverändert

## v2.1.1 — 2026-06-15
**PO-Review-Korrekturen XI**

- Physikalische Größen korrekt kursiv in SVG und HTML:
  - Massenbezeichner in der Simulation: `m₁`/`m₂` (kursiv) per tspan, Zahl+Einheit aufrecht
  - Graphentitel: Größensymbol (z.B. `y₁(t)`) kursiv via setGraphTitle(), deutsches Wort aufrecht
  - Zeitlabel: `<i>t</i> = 0,00 s` (HTML innerHTML)
- Achsenlabels und y-Achsen-Display waren bereits korrekt (setAxisLabel, setMassLabel)

## v2.1.0 — 2026-06-15
**PO-Review-Korrekturen X**

- SVG-ViewBox auf `0 -20 400 520` erweitert (20 px Luft über der Decke)
- Decken-Rect nach oben verschoben: `y="-20"` (Unterkante jetzt bei y=-10)
- Aufhänge-Trapez entsprechend verlängert: Oberkante bei y=-10, Breite 48 px (war 36 px bei y=10) — Scheitelpunkt-Steigung linear extrapoliert; Umlenkrolle unverändert

## v2.0.9 — 2026-06-15
**PO-Review-Korrekturen IX**

- SVG-Z-Order: `#pulley_mount` (Trapez/Aufhängung) aus Hintergrund an vorletzten Platz verschoben — liegt jetzt vor Scheibe und Faden, nur `#pulley_axle` noch darüber

## v2.0.8 — 2026-06-15
**PO-Review-Korrekturen VIII**

- Massenbeschriftung neben die Masserechtecke verschoben: m₁ links (text-anchor: end), m₂ rechts (text-anchor: start) — Kraftangriffspunkt am Rect sichtbar
- Beschriftungsfarbe der Massen auf Massenfarbe umgestellt (war #fff, jetzt var(--c-m1)/var(--c-m2))
- Achsenbeschriftung: physikalische Größe kursiv (italic tspan), Einheit aufrecht — via setAxisLabel()

## v2.0.7 — 2026-06-15
**PO-Review-Korrekturen VII**

- Linke Seitenleiste auf 280px verbreitert (war 255px) — Play/Pause/Reset nicht mehr umgebrochen
- `flex-wrap: wrap` aus `.btn-row` entfernt
- Kräftevektorfarben auf Okabe-Ito-Palette (barrierefrei) umgestellt:
  Fg = #0072b2 (blau), FT = #e69f00 (orange), Fres = #cc79a7 (mauve)
- Freier Fall: Breite der linken Seitenleiste ebenfalls auf 280px angeglichen (Konsistenz)

## v2.0.6 — 2026-06-15
**PO-Review-Korrekturen VI**

- Stoppuhr: CSS für Hilfszifferblatt (`#sw-subdial-face`) und Hilfszeiger (`#stopwatch_sub_hand` in Accent-Farbe) ergänzt
- Hilfszeiger-Reset auf 12 Uhr (y2=13) in resetSim()

## v2.0.5 — 2026-06-15
**PO-Review-Korrekturen V**

- SVG-Z-Order: ruler_group nach aperture_path verschoben — „0 cm" nicht mehr verdeckt
- Stoppuhr auf FF-Design portiert: Hauptzifferblatt (60 Striche, 1 Umdr./60s) + Hilfszifferblatt (10 Striche, 1 Umdr./s = Zehntel sichtbar)

## v2.0.4 — 2026-06-15
**PO-Review-Korrekturen IV**

- Panel-Padding auf 14px 16px angeglichen (wie Freier Fall)
- „cm"-Label des Lineals von Apertur-Bereich in Lineal-Bereich verschoben (y: -5 → +12)
- Stoppuhr 1,4× größer: scale(0.5 → 0.7), Mittelpunkt auf y=55 angehoben
- Stoppuhr-Drehzahl: 1 Umdrehung/Sekunde statt 1/60s — Zehntel-Sekunden ablesbar

## v2.0.3 — 2026-06-15
**PO-Review-Korrekturen III**

- Layout: Gitterspalten auf 255px | 1fr | 270px (wie Freier Fall)
- sim-wrapper von fixem 340px auf proportionale 44% umgestellt — skaliert jetzt mit Viewport

## v2.0.2 — 2026-06-15
**PO-Review-Korrekturen II**

- Icons ↺ und ⏸ auf 1,8-fache Größe skaliert
- Reset-Button aus Header in btn-row (neben Play/Pause) verschoben

## v2.0.1 — 2026-06-15
**PO-Review-Korrekturen I**

- MathJax-Subscript `F_{\text{res}}` korrigiert (war kursiv)

## v2.0.0 — 2026-06-13
**Migration auf modulare 6-Datei-Architektur (Sprint 2)**

- Aufgeteilt in: index.html, css/styles.css, js/(constants|state|physics|render|ui).js
- FH Aachen Corporate Design: Mint #00B1AC, DM Sans, JetBrains Mono
- Dark/Light-Mode mit localStorage-Persistenz
- Layout: Sidebar | Simulation (340px) + Diagramm (flex) | Analyse
- Kräftevektoren: Fg, FT, Fresultierende – einzeln togglebar, CSS-Farb-Tokens
- Drei Graph-SVGs (single / dual oben / dual unten) – nahtloser Moduswechsel
- Precomputed Arrays: vollständige Trajektorien vor Animationsstart
- Kollisionserkennung: exakte Stoppzeit per kinematischer Berechnung
- Höhenmodus-Selector: y₁+y₂ unabhängig oder y₁+Δy
- Graph: Einzeln/Geteilt-Modus, Subjekt-Selector (m₁, m₂, m₁+m₂)
- CSV-Export: Diagrammdaten oder alle 8 Spalten (sep=;, Komma als Dezimaltrenner)
- Speed Pills: 1×, ½×, ¼×, ⅛×
- MathJax-Formeln im Analyse-Panel
- Legende für Massfarben und Kräfte
- In AllAnimations/index.html integriert (Kap. 1.2)

## v1.x — 2025 (Standalone-Prototyp)
Ursprünglicher Standalone-Prototyp in `atwood.html`.
Single-file, altes Design, kein Dark Mode.
