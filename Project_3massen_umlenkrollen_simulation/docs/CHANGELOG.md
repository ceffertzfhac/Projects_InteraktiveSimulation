# CHANGELOG — Statisches Kräftegleichgewicht (3-Massen-Umlenkrollen)

## [1.0.5] — 2026-07-06
### Geändert (Abnahme-Feedback: Schrift + Label-Platzierung)
- **Serifenschrift für Variablensymbole:** Kraft-Labels (F⃗) und Massen-Labels (m₁/m₂/m₃) verwenden jetzt eine Serif-Italic (`--font-serif`: Times New Roman/STIX/Cambria …) statt DM Sans. Grund: DM Sans italic ist nur in Weight 400 verfügbar und wirkt schwer („dick"); Serif-Italic ist die math-Konvention (wie LaTeX/MathJax in der Analyse-Sidebar) und naturally leichter. Kraft-Label 13 px, Massen-Label 12 px.
- **Vektor-Pfeil-Länge korrigiert:** `sym.getBBox()` lieferte in einigen Browsern die BBox des Gesamttextes (F + Subscript) → Pfeil war „viel zu lang". Umstellung auf `getStartPositionOfChar(0)`/`getEndPositionOfChar(0)` → Pfeil spannt exakt die F-Glyphenbreite (×0,82, am F-Stamm linksbündig), sitzt am Cap-Top (oberer Balken des F).
- **Label-Platzierung überarbeitet (Kollisionen vermeiden):**
  - m₁/m₃: Schwerkraft- und Seilkraft-Label standen bisher auf derselben Seite → jetzt entgegengesetzt (Schwerkraft außen: m₁ links / m₃ rechts, Seilkraft innen: m₁ rechts / m₃ links).
  - m₂-Seilkräfte: `F_S,li` nutzte die **innere** Normale (zwischen den Seilen → Kollision mit `F_S,re`/`F_G,2`); korrigiert auf **äußere** Normale beider Seilstrecken, Offset 35→42 px.
  - `F_G,2` nach rechts des Schwere-Pfeils (weg von den Seilkräften oben). Komponenten-Wert-Anzeigen entsprechend nach außen verschoben.

## [1.0.4] — 2026-07-06
### Behoben (Abnahme-Feedback)
- **Vektor-Pfeil sitzt über dem F (nicht über dem Subscript):** Pfeil-Lage/Breite wird jetzt aus der tatsächlichen F-Glyphen-BBox (`getBBox()` auf dem F-tspan) gemessen → robust gegenüber `text-anchor`; previously landete der Pfeil bei `end`/`middle`-Ankern über dem Subscript (Mitte von F_{xyz}).
- **Label-Schrift 13 px:** 11 px war noch schwer lesbar → 13 px (mit den dünnen 0,7×-Vektorpfeilen nicht mehr „fett"). Komponenten-Werte 8→9 px.
- **1. Newton richtig herum:** „Ist m₂ in Ruhe, so ist die Summe aller Kräfte auf m₂ null" (Ruhe → ΣF=0) — vorher verdreht (ΣF=0 → Ruhe).

## [1.0.3] — 2026-07-06
### Behoben (Abnahme-Feedback)
- **Vektor-Pfeil über dem F:** Kraft-Labels zeigen jetzt die Vektor-Notation F⃗ (kleiner Pfeil-Pfad über dem kursiven F, in Vektorfarbe gestrichelt ausgeführt als Linie + Chevron-Spitze). Bisher fehlte der Pfeil, es stand nur „F".
- **Schrift-Lesbarkeit:** Label-Schrift von 9 px (0,7×-Skalierung aus v1.0.2 — zu klein/schwer lesbar) auf **11 px** zurückgenommen. font-weight bleibt 400 (nicht fett) — 11 px ist die Mitte zwischen 9 (zu klein) und 13 (zu dick). Massen-Labels 9→11 px, Komponenten-Werte 7→8 px.

## [1.0.2] — 2026-07-06
### Behoben (Abnahme-Feedback)
- **Vektorpfeile & Sim-Schrift auf 0,7× skaliert:** `VEC_STROKE` 3→2,1 (Marker skaliert via `markerUnits=strokeWidth` automatisch mit), Massen-Labels 13→9 px, Kraft-Labels 13→9 px, Komponenten-Werte 10→7 px — Pfeile und Beschriftungen erscheinen jetzt dezent, nicht mehr „fett".
- **Winkel eindeutig als „zur Senkrechten":** Seilkraft und Winkel in der Analyse aufgeteilt (eigene Zellen); Winkel γ jetzt explizit als Winkel **zur Senkrechten (Vertikalen)** ausgewiesen — `γ₁ = angle₁ − π/2`, `γ₃ = π/2 − angle₃` (Horizontalkomponente = T·sin γ, Vertikalkomponente = T·cos γ, in Node verifiziert).
- **Newton-Erklärung in der Analyse:** Formel-Box beginnt jetzt mit dem 1. Newtonschen Gesetz (Summe aller Kräfte = 0 → m₂ bleibt in Ruhe) und `\(\sum\vec{F}=0=...\)`.

## [1.0.1] — 2026-07-06
### Behoben
- **Vektorzerlegung funktionsfähig:** die Komponenten-Vektoren referenzierten `url(#arrowhead-horizontal)`/`-vertical`, aber die Marker-IDs heißen `arrowhead-comp-h`/`-comp-v` → Pfeilspitzen fehlten. Zentrale `MARKER_ID`-Map in `render.js` bindet jeden Vektortyp an den korrekten Marker.
- **Formel-Überlauf in der Analyse-Sidebar (270 px):** lange `\qquad`-Mehrfachgleichungen aufgeteilt (eine Seilkraft-Gleichung je Zeile), Cosinus-Satz als kompakter `\tfrac`-Bruch, MathJax `svg.scale: 0.9`, `.formula-box` mit `overflow-x:auto` als Sicherheit.
- **Colon-Umbruch:** Intro-Zeilen vor den Formeln gekürzt (z. B. „Winkel (Cosinus-Satz):" statt „Winkel aus dem Kräftedreieck (Cosinus-Satz):"), damit das „:" nicht mehr allein auf die nächste Zeile rutscht.
- **Schrift in der Simulation zu dick:** Massen-Labels 16→13 px (`font-weight:400`), Kraft-Labels 15→13 px, Komponenten-Werte 11→10 px.

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