# Changelog — Rollender Zylinder / Zykloide

## v1.0.8 — 2026-07-11

T9 — shared/js-Helper konsolidieren.

### Behoben
- **Zeitachse zeigte teils zu wenige Ticks**: `tAxisStep` war ein
  Einzeiler (`getNiceTickStep(tMax, 3)`), der den repo-weiten Vertrag
  „garantiert ≥3 Divisionen / ≥4 Ticks inkl. 0" (CLAUDE.md) nicht erfüllte
  — z. B. bei `t_max=10 s` (Standard-Diagrammfenster) nur 2 Divisionen/3
  Ticks (0, 5, 10). Jetzt über `shared/js/ticks.js`s echten `tAxisStep`
  (Nachkorrektur-Logik) ersetzt. Per Playwright verifiziert: Standard-
  Diagrammfenster zeigt jetzt 6 Ticks (0, 2, 4, 6, 8, 10) statt vorher 3.

## v1.0.7 — 2026-07-10

Akkordeon-Steuerungs-Sidebar (I8).

### Features
- **Akkordeon-Steuerungs-Sidebar**: 5 Cluster (Systemparameter,
  Visualisierung, Analyse-Objekte, Legende, Abspielgeschwindigkeit)
  einzeln ein-/ausklappbar, kein Konsolidierungsbedarf. Nur
  „Abspielgeschwindigkeit" default eingeklappt. Referenz: Kreis-/
  Spiralbewegung v1.3.0. Per Playwright verifiziert.

## v1.0.6 — 2026-07-07
### Refaktoriert (T6 — einheitliches fmt() via shared/js)
- **Lokale `fmt()`-Definition durch Import aus `shared/js/format.js` ersetzt**
  (in `render.js` re-exportiert). Identische Logik (Komma-Dezimal,
  `Number.isFinite`-Guard → '—') — keine Verhaltensänderung, nur DRY: eine
  repo-weite Hilfsfunktion statt neun lokaler.

## v1.0.5 — 2026-07-05
### Geändert (Style)
- **Zylinder-Startposition weiter links:** `START_OFFSET_PX` 50 → 30 — der Zylinder startet näher an der linken Viewbox-Kante. Kamera-Follow-Trigger unverändert.

## v1.0.4 — 2026-07-05
### Geändert (Style)
- **Diagramm breiter:** `GRAPH_W` 440 → 700 (Diagramm-SVG viewBox 700×410, Seitenverhältnis wie Rollende Körper). Das Diagramm füllt jetzt die volle Breite des `graph-wrapper` statt mit breiten Rändern zentriert zu bleiben. Titel x zentriert auf 350.

## v1.0.3 — 2026-07-05

### Geändert (UI-Konsistenz mit Rollenden Körpern)
- **Diagramm-Placement an Rollende Körper angeglichen:** Bisher waren Animation
  und Diagramm in einer gemeinsamen SVG (900×500) nebeneinander platziert und
  der Diagramm-Typ-Selektor steckte in der linken Sidebar. Jetzt ist das
  Diagramm — wie bei den Rollenden Körpern — in einem separaten `graph-wrapper`
  unter der Simulation gestapelt (`center-area` als `grid 1fr 1fr`), mit eigener
  `graph-toolbar` (Diagramm-Typ-Dropdown + Legende der aktiven Subjekte) oberhalb
  des `graph_svg`. `main_svg` zeigt nur noch die Animation (viewBox 400×500).
  Studierende finden sich so in beiden Sims sofort zurecht.
- **Graph-Legende:** Aktive Subjekte werden jetzt als Farbpunkte + Label im
  Graph-Toolbar angezeigt (Klassen `graph-leg-item`/`graph-leg-dot`, einheitlich
  mit Rollenden Körpern).
- **Aufgeräumt:** Unbenutzte Konstante `GRAPH_TRANSLATE` entfernt (Diagramm ist
  nicht mehr translatiert, sondern eigenes SVG). Diagramm-Sektion aus linker
  Sidebar entfernt.

## v1.0.2 — 2026-07-05

### Geändert (UI-Konsistenz)
- **Topbar-Buttonleiste (kanonisch):** Play/Pause/Reset aus der linken Sidebar
  in die Topbar (`topbar-right`) verschoben — einheitlich mit Rollenden Körpern,
  immer erreichbar (vorher am unteren Bildschirmrand bei schmalem Viewport
  verschüttet). Reihenfolge: Theme-Toggle · ▶ Play · ⏸ Pause · ↺ Reset ·
  Diagramm (CSV) · Alle Daten (CSV). Play primär (`.btn.primary`), alle
  weiteren Buttons einheitlich als `.btn` (gleiche Höhe). Alte
  `btn-row`-Sektion links entfernt.
- **Datenexport in Topbar:** „Alle Daten (CSV)" aus rechter Sidebar in Topbar
  verschoben; zusätzlich neuer Button „Diagramm (CSV)". Rechte
  „Datenexport"-Sektion entfernt.

### Hinzugefügt (Feature)
- **Diagramm-CSV-Export:** `exportDiagramCSV()` exportiert nur die aktuell
  gewählte Größe (`store.graphType`) für die aktivierten Subjekte
  (`subject_*`-Checkboxen) — Dateiname `zykloide_<größe>_daten.csv`. Format
  konsistent zum Alle-Daten-Export (`;` Trenner, `,` Dezimal, `sep=;`-Header).

## v1.0.1 — 2026-07-05

### Fix
- **Kritischer ASI-Bug (Simulation ladete nicht):** In `ui.js` schloss die
  `DOM.speedRadios.forEach(...)`-Anweisung ohne Semikolon ab; die darauffolgende
  Zeile begann mit `[DOM.togSpTrace, …].forEach(...)`. JavaScript fasste beides
  als Index-Zugriff `speedRadios.forEach(...)[…]` auf — `forEach` gibt `undefined`
  zurück, also `undefined[…]` → `TypeError: Cannot read properties of undefined`.
  Die gesamte `ui.js` scheiterte beim Laden → Simulation war nicht funktionsfähig.
  Fix: `;`-Präfix vor der zeilen-startendenen `[…].forEach` (no-semicolon-Stil,
  ASI-Hazard bei `[`/`(` am Zeilenanfang). Vollständiger End-to-End-Test mit
  jsdom (precompute 3601 Samples, SP linear, Punkte/Trochoiden, Kamera-Follow,
  Diagramm, Vektoren) ok.

## v1.0.0 — 2026-07-04

Migration des Standalone-Prototyps (`AllAnimations/zykloide3.html`, v2.8, 863 Zeilen) in die modulare 6-Modul-Architektur gemäß `global_docs/simulation_instruction.md` (Sprint 4b, Backlog M4). Inhalt und Name bewusst belassen („Rollender Zylinder / Zykloide", `r = 0{,}9\,R` hardcoded).

### Architektur
- 6-Modul-Scaffold: `constants.js`, `state.js`, `physics.js`, `render.js`, `ui.js` (+ `index.html`, `css/styles.css`).
- `ui.js` als ES-Modul-Entry (kein `main.js`).
- Echtes `precompute()` + `interpolateAt(t)` (Atwood-Muster) statt Per-Frame-Physik — Zeitreihen (5 Subjekte × 8 Größen + t über 60 s) werden einmal pro Parameteränderung gefüllt, die RAF-Schleife indiziert nur.
- Shared Design-System (`../shared/css/design-system.css`) eingebunden; sim-spezifische Tokens + SVG-Target-Regeln in `css/styles.css`.
- 3-Spalten-Layout (280px 1fr 270px), Topbar mit Back-Button + Theme-Toggle, einklappbare Analyse-Sidebar (Default eingeklappt, off-screen body, MathJax-static).

### Features (Parität zum v2.8-Prototyp)
- Slider \(R\) (20–80 cm) und \(v_c\) (10–100 cm/s) mit Live-Reset; \(\omega = v_c/R\) automatisch.
- 5 Subjekte: Schwerpunkt (SP) + Punkte P1–P4 (\(\theta_0 = 0,\,\tfrac{\pi}{2},\,\pi,\,\tfrac{3\pi}{2}\)) auf innerem Kreis \(r = 0{,}9\,R\) → Trochoiden.
- Traces-Toggles: SP-Bahn, Punktpuren (P1–P4), Z-Reihenfolge der Spuren (vor/hinter dem Zylinder).
- Geschw.- und Beschl.-Vektoren für alle aktiven Subjekte (Okabe-Ito-Farben).
- Subjekt-Checkboxen steuern Diagrammlinien + Live-Analyse-Gruppen (statisch im HTML, `display`-Toggling, kein `typesetPromise` zur Laufzeit).
- `graph_select`-Dropdown: 8 Größen (\(x, y, v_x, v_y, |v|, a_x, a_y, |a|\)) vs. Zeit, gruppiert (Position/Geschwindigkeit/Beschleunigung).
- Kamera-Follow: Welt wird ab `trigger_x_px` nach links verschoben; Diagramm bleibt statisch.
- CSV-Export (5 Subjekte × 8 Größen, `;`-Trenner, Komma-Dezimal, `sep=;`-Präfix).
- Live-Analyse-Panel pro aktivem Subjekt (8 Werte) + statische MathJax-Physikformeln.
- Dark Mode via `fh_theme`-localStorage-Key (persistiert über Übersicht↔Sim).
- Legende für alle Subjekt-/Vektorfarben.

### Konventionen (CLAUDE.md)
- Vektoren standardmäßig sichtbar (`toggle_v_vectors` `checked`, `updateScene(0)` in `resetSim`).
- Farben via shared Tokens (`--c-p1..p4`, `--c-sp`, `--c-vel`, `--c-acc`); `var()` nur in CSS-Regeln, nicht in SVG-Attributen (Klassen/IDs stattdessen).
- Diagramm: `createStyledSvgText` (kursiv Symbole), Graph-Titel als letztes SVG-Kind, bg-Rect.
- t-Achse: ≥3 Tick-Marken außer Ursprung (`tAxisStep`).
- MathJax statisch: alle Formeln als HTML in `index.html`, Subjekt-Gruppen per `display:none` (MathJax typeset beim Laden).
- Dezimalkomma in UI/CSV, Punkt in SVG-Attributen.