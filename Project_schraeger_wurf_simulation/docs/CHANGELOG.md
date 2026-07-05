# Changelog — Schräger Wurf

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