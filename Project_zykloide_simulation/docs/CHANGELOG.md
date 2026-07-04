# Changelog — Rollender Zylinder / Zykloide

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