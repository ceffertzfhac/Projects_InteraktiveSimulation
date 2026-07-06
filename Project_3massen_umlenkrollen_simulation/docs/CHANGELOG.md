# CHANGELOG — Statisches Kräftegleichgewicht (3-Massen-Umlenkrollen)

## [1.0.0] — 2026-07-06
### Migration (Standalone `3massen_umlenkrollen_v2.html` → modular)
- **Scaffold:** `Project_3massen_umlenkrollen_simulation/` in kanonischer 6-Modul-Struktur (`constants/state/physics/render/ui`, kein `main.js`, `js/ui.js` als Einstieg).
- **Sim- vs. Werkzeug-Schale:** als **Sim-Schale** umgesetzt (analog Lorentz): Topbar mit Back · Titel · Theme-Toggle · **Reset**; bewußt **kein** Play/Pause, keine Stoppuhr, kein CSV-Export (statisches Gleichgewicht, keine Zeitreihe).
- **Physik (`physics.js`):** `computeEquilibrium()` löst Winkel analytisch aus dem Kräftedreieck (Cosinus-Satz), berechnet die m₂-Position als Tangentenschnittpunkt, Seil-/Bogenlängen mit Kollisionsprüfung. Liefert Zustandsobjekt oder Fehlstatus (`no-equilibrium` / `collision`).
- **Render (`render.js`):** `drawBackground()` (Decke, Koordinatensystem, Raster) + `updateScene()` (Rollen, Seilpfad, Massen, Kraftvektoren). SVG-`<text>`-Labels mit italic-tspan ersetzen das HTML-Overlay + Laufzeit-`MathJax.typesetPromise()` des Prototyps (MathJax nun rein statisch).
- **Vektor-Pfeilspitzen:** kanonische Geometrie (CLAUDE.md) — `refX=0` + Schaft-Kürzung um `markerWidth·strokeWidth` via `shortenEnd`; Spitze landet exakt auf dem Zielpunkt.
- **Kraftfarben (Okabe-Ito, colorblind-safe):** Prototyp-Farben (BlueViolet/Rot/Cyan/Orange) ersetzt — Schwerkraft `--c-fg`, Seilkraft `--c-fn`, Horizontalkomponente `--c-comp-h` (Vermilion), Vertikalkomponente `--c-comp-v` (Sky-Blue); Komponenten zusätzlich gestrichelt + perpendicular. Massen kategorial via `--c-p1/p2/p3`.
- **Layout:** 3-Spalten-App `280px 1fr 270px`, linke Sidebar (Parameter · Visualisierung · Legende), einklappbare rechte Analyse-Sidebar (Default eingeklappt) mit statischer Formel-Herleitung.
- **Feature-Parität erhalten:** m₂-Stepper (± in 0,1-Schritten), dynamische Seillängen-Slider-Kopplung (min/max = pulleyDist·0,8/1,6), Komponentenzerlegung + Werteanzeige, Hintergrundraster, Gleichgewichtswarnung.
- **Übernommener Default:** \(m_3 = 1{,}1\) kg (Sliderwert des Prototyps; das HTML-Display „2,1 kg" war Stale-Text — siehe `issues.md`).
- **Verlinkung:** Karte in `AllAnimations/index.html` auf die modulare Sim umgehängt, Badge „Prototyp" → „Modular"; Vorschaubild bleibt. Standalone-HTML ins `legacy_archive/` verschoben.