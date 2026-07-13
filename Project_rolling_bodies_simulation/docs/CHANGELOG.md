# Changelog - Rollende Körper Simulation

Alle wichtigen Änderungen werden hier dokumentiert. Die neuesten Änderungen stehen oben.

## [2.2.1] — 2026-07-13

B23 — Vektor-Pfeilspitzen bei zu kurzem Vektor (repo-weiter Fix des shared-Helpers `shortenEnd`).

### Behoben (B23)
- **Vektor-Pfeillänge/Spitze:** Der shared-Helper `shortenEnd` erzwang bei
  Vektorlängen ≤ Marker-Länge einen 2-px-Schaft-Stub, sodaß die refX=0-Spitze
  über das Ziel hinausschoß. `shortenEnd` gibt jetzt `null` zurück, wenn der
  Vektor kürzer als die Pfeilspitze ist; `drawArrow` bricht dann ab — kleine
  Kräfte/Geschwindigkeiten werden sauber verborgen statt als Überschieß-Stub
  gezeichnet.

## [2.2.0] — 2026-07-13

I6 — Diagramm-Export als SVG- bzw. PNG-Datei. Ergänzt den bestehenden CSV-Export
um eine visuelle Bilddatei (kanonische Topbar-Buttonleiste).

### Hinzugefügt
- **Topbar:** zwei neue Buttons „Diagramm (SVG)" + „Diagramm (PNG)" nach den
  CSV-Buttons. Nutzen den neuen shared-Helper `shared/js/export-image.js`, der vor
  dem Serialisieren Computed-Styles als Inline-Attribute übernimmt (CSS-Variablen
  und externe Stylesheets greifen in einer losgelösten SVG-Datei sonst nicht).
- **`js/state.js`:** DOM-Cache `exportSvg`/`exportPng` ergänzt (`graphSvg` bestand
  bereits). → BACKLOG I6.

## [2.1.2] — 2026-07-13

T12 — MathJax-Runtime-Typeset entfernt. `rebuildAnalysis()` typesettete die
dynamisch gebaute Analyse-Area debounced (300 ms) per `MathJax.typesetPromise`,
obwohl diese Area kein LaTeX enthält (nur plain `x`/`y`/`|v|`/`|a|`-Keys +
`textContent`-Zahlen) — toter Aufruf. Entfernt: debounce-Timer
(`state._mjDebounceTimer`), `typesetPromise`-Block, der `window._mjReady`-Gate
samt `startup.ready`-Override in `index.html` (MathJax nutzt nun Default-Startup;
die statischen Formeln/Labels in `index.html` werden wie gewohnt einmalig beim
Laden typesettet). Konform zur CLAUDE.md-Regel „MathJax statisch statt dynamisch".

## [2.1.1] — 2026-07-13

Copyright-Marke + Disclaimer-Verweis (repo-weit, Vorbereitung I1/ILIAS-Veröffentlichung).

### Geändert
- **Topbar:** Copyright-Marke „© 2026 FH Aachen, FB 8 · Alle Rechte vorbehalten" neben
  dem Institutions-Span ergänzt. Keine Verhaltensänderung — rein rechtlicher Hinweis
  (volle Fassung in repo-root `NOTICE.md` und auf der Übersichtsseite).

## [2.1.0] - 2026-07-12

I5 — Hover-Werte am Zeit-Diagramm (Rollout, 2. Sim nach Zykloide-Referenz).

### Hinzugefügt
- **Hover-Cursor + Tooltip auf dem Diagramm**: Mouseover über die Kurve zeigt
  eine gestrichelte vertikale Führungslinie, hohle Ring-Punkte je aktivem
  primären Subjekt (Farbe wie die Kurve, Kontur statt Füllung) und ein
  Tooltip mit dem exakten Zeitpunkt *t* sowie den Werten. Nutzt die
  bestehende `makeInterp(t)` (keine neue Interpolation). Cursor bleibt auf
  den bereits gezeichneten Kurvenabschnitt geklammert.
  **Vergleichskörper (Rennen-Modus) bewußt ausgeschlossen** — Hover zeigt
  nur die primären Subjekte (SP/P1–P4), nie `compareActive`/`compareData`
  (PO-Entscheidung). Funktioniert auch bei körperweiten Größen (ω, α_w).
  Wiederverwendet das kanonische `shared/js/hover.js` aus der Zykloide-
  Referenz-Implementierung. Per Playwright verifiziert: Hover während
  Wiedergabe, mit aktivem Vergleichskörper (bleibt außen vor), bei
  körperweiten Größen, `pointerleave` — keine Console-Errors.

## [2.0.10] - 2026-07-11
### Geändert (T9 - shared/js-Helper konsolidieren)
- **`shortenEnd`** (in `render-core.js`, re-exportiert für
  `render-scene.js`/`render-vectors.js`) nutzt jetzt `shared/js/vectors.js`
  statt einer lokalen Kopie. Bereits identischer Algorithmus + identische
  Rückgabe-Keys - reiner Import-Swap, keine sichtbare Änderung.

## [2.0.9] - 2026-07-10
### Hinzugefügt
- **Akkordeon-Steuerungs-Sidebar (I8)**: die linke Sidebar war mit 7 Clustern
  die längste im Repo. Statt die ganze Sidebar einzuklappen, ist jetzt jedes
  `.panel-section`-Cluster einzeln auf-/zuklappbar (Referenz: Kreis-/
  Spiralbewegung v1.3.0). Konsolidiert auf 6 Cluster: „Modus" und
  „Simulationsgeschwindigkeit" (bisher zwei dünne Einzel-Cluster) zu
  „Modus & Tempo" zusammengelegt. Default eingeklappt: „Vergleichskörper
  (Rennen)" und „Modus & Tempo" (seltener nach dem initialen Setup
  angepaßt); „Hauptkörper", „Geometrie & Start", „Visualisierung",
  „Legende Punkte" bleiben offen. `.panel-label` wird zum `<button>` mit
  Chevron; `aria-expanded` pro Cluster. Per Browsertest verifiziert,
  inkl. des Grenzfalls bedingt sichtbarer Inhalte (`#alpha_group`) innerhalb
  eines Clusters — kein „Durchblitzen" beim Einklappen.

## [2.0.8] - 2026-07-07
### Behoben (zwei visuelle Bugs aus PO-Feedback)
- **Vektor-Pfeilspitzen wieder sichtbar (v⃗/a⃗/F⃗_G/N/R).** Die 5 Vektor-Marker
  (`arr-v/a/fg/fn/fr` in `index.html`) trugen das Polygon-Fill als Inline-SVG-Attribut
  `fill="var(--c-…)"`. `var()` wirkt aber **nicht zuverlässig als SVG-Präsentationsattribut
  im `<marker>`-Rendering-Kontext** (Browser erben CSS-Variablen nicht konsistent in den
  Marker-Subbaum via Attribut) → die Spitzen waren unsichtbar (gemeldet für
  Geschwindigkeit; betrifft alle 5 Marker gleich). Fix nach CLAUDE.md-Kanonik (vgl.
  3-Massen-Referenz): Inline-`fill` von den Polygonen entfernt, stattdessen CSS-Regeln
  `#arr-* polygon { fill: var(--c-…) }` in `styles.css`. Der CSS-Cascade erreicht den
  Marker-Subbaum zuverlässig. (Nicht-marker `fill="var(...)"` wie die Zykloiden-Punkte
  `pt_*` waren unbeeinträchtigt — dort funktioniert das Attribut.)
- **Gestrichelte Vergleichskörper rotieren jetzt korrekt.** `drawCompareObjects`
  (render-analysis) zeichnete jeden Vergleichskörper nur als gestrichelten Kreis —
  dieser ist rotationssymmetrisch, sodaß die Roll-Drehung nicht erkennbar war (die Körper
  „rutschten" nur). Jetzt wird jedes Objekt in eine Gruppe mit
  `translate(x,y) rotate((φ+α)·180/π)` gepackt (Rollwinkel φ = x/R, plus Inklination α —
  exakt wie beim Hauptkörper in `render.js`) und zusätzlich ein gestrichelter Radius als
  Rotations-Indikator gezeichnet; dieser wandert mit dem Rollwinkel um den Mittelpunkt.
  Label bleibt aufrecht außerhalb der Rotationsgruppe. Jeder Vergleichskörper rollt jetzt
  mit seiner eigenen Winkelgeschwindigkeit (unterschiedliche k-Faktoren → unterschiedl.
  Beschleunigung → unterschiedl. Drehung), wie es das Rennen veranschaulichen soll.

## [2.0.7] - 2026-07-07
### Refaktoriert (T1 — render.js in thematische Submodule aufgeteilt)
- **`render.js` (1068 Zeilen) in 5 Dateien aufgeteilt, Verhalten unverändert.**
  Die monolithische Datei war die größte des Repos und schwer zu überblicken.
  Aufteilung entlang thematischer Grenzen:
  - `render-core.js` — gemeinsame Helfer (`fmt`-Re-export, `fmtTech`, `fmtE`,
    `svgEl`, `shortenEnd`, `physToScreen`, `localVecToScreen`, `getNiceStep`,
    `makeInterp`); von allen Submodulen importiert.
  - `render-scene.js` — Viewport-Setup, Hintergrund/Rampe, Hindernis,
    Koordinatensystem, Zylinder-Stil, Stoppuhr.
  - `render-vectors.js` — Geschw.-/Beschl.-/Kraftvektoren (Fg/Fn/Fr) +
    Vektor-Legende (private `drawArrow`/`vecLabel` mitgewandert).
  - `render-analysis.js` — Live-Analyse-Grid, Renn-Bars, Vergleichsliste,
    gestrichelte Vergleichskörper (`computeK`-Import aus physics mitgewandert).
  - `render-graph.js` — `getTransformedData` (Boden-/Ebenen-Transform) +
    `updateGraph` (Achsen, Gitter, Datenlinien, Cursor, Legende).
  - `render.js` — jetzt Aggregator: re-exportiert alle 24 öffentlichen Exporte
    (sodaß `import * as render` in `ui.js`/`main.js` unverändert greift) und
    enthält selbst nur noch den Szenen-Orchestrator `updateScene` (pro Frame)
    plus den privaten `douglasPeucker`-Simplifyer für die Punktespuren.
- **Abhängigkeitsgraph zyklenfrei:** `render.js` → 4 Submodule →
  `render-core`/`constants`/`state`/`physics`. `shortenEnd` (bisher
  modul-privat) ist jetzt exportiert, da `render-scene` (Koordinatenachsen)
  und `render-vectors` (Vektor-Pfeile) es gemeinsam nutzen.
- **Verifikation:** `node --check` auf allen 6 Dateien; Diff der
  Funktionskörper (normalisiert, eindeutige Zeilen) Original-vs-Neu ist leer —
  jeder Statement steht wortwörtlich in den Submodulen. Keine
  Verhaltensänderung (reine Code-Umschichtung).

## [2.0.6] - 2026-07-07
### Refaktoriert (T6 — einheitliches fmt() via shared/js)
- **Lokale `fmt()`-Definition durch Import aus `shared/js/format.js` ersetzt**
  (in `render.js` re-exportiert, damit `ui.js` weiterhin `render.fmt(...)` nutzt).
  **Sichtbare Änderung:** bisheriger Default `d=3` entfällt (shared-Default `d=2`);
  die 4 betroffenen Live-Werte (`x_disp`/`y_disp`/`vabs`/`aabs` in `render.js`)
  tragen jetzt explizit `, 3` — Anzeige unverändert. Fallback für nicht-endliche
  Werte '···' → '—' (shared-Standard; nur Randfall). `fmtTech` (Punkt-Dezimal für
  SVG-Attribute) und `fmtE` (Energie mit ' J'-Suffix) bleiben Rolling-spezifisch
  lokal — keine Nutzer-Anzeige im shared-Sinne.

## [2.0.5] - 2026-07-07
### Hinzugefügt (PO-Vorgabe: Kräfte-Beträge im Analyse-Tab)
- **Kräfte-Beträge \(F_G\)/\(F_N\)/\(F_R\) im rechten Analyse-Tab** (Sektion
  „Physik & Rollbedingung") als kleine Liste mit den zugehörigen Vektorfarben.
  Die Werte wurden in [2.0.4] (T8) von den On-Vektor-Labels entfernt; PO-Vorgabe
  war, sie stattdessen hier zu zeigen. m = 1 kg normiert, Kräfte beim reinen Rollen
  zeitunabhängig → Aktualisierung in `resetSim()` (nicht pro Frame). Neue DOM-IDs
  `fmag_g/n/r`; CSS `.force-mags`/`.force-mag-row`/`.force-mag-val`.

## [2.0.4] - 2026-07-07
### Geändert (T8 — Vektor-Label-Notation an 3-Massen-Referenz angeglichen)
- **Vektor-Labels tragen jetzt das Vektorsymbol mit Pfeil** (`F⃗` + Index G/N/R an
  den Kraftvektoren, `v⃗`/`a⃗`/`F⃗_G/N/R` in der SVG-Legende) in Serif-Italic mit
  `stroke:none` (kein Faux-Bold) — statt wie bisher nackter Werte in JetBrains Mono
  bzw. Legenden-Einträgen wie `Fg (linear)`. **Beträge werden bewußt nicht mehr
  gezeigt** (PO-Vorgabe: Werte sind nicht nötig und standen im Weg). Neue Hilfsfunktion
  `vecLabel(x, y, sym, color, sub, anchor)` in `render.js` (für On-Vektor-Labels wie
  Legende); CSS-Klasse `.force-label` in `styles.css`. Sonderfall Reibung = 0
  (gestrichelter Kreis) trägt jetzt halbtransparentes `F⃗_R`.
- **Visualisierung-Sektion in die linke Sidebar verschoben:** Die Vektor-Toggles
  (SP-Bahn, Punktspuren, v/a/F-Vektoren, Kamera, Kraftvektor-Skalierung) saßen zuvor
  im **rechten Analyse-Panel** — das im Default eingeklappt ist, sodaß die Toggles
  unerreichbar waren. Jetzt dauerhaft sichtbar bei den übrigen Controls.
- **Skalierungs-Hinweis geklärt:** Statt der unklaren Klammer `(linear)`/`(proportional)`
  in der Legende erklärt eine Notiz in der Sidebar: „Pfeillänge proportional zum Betrag
  (Kräfte und v); bei a logarithmisch wegen des großen Wertebereichs." (lineare vs.
  proportionale Bezeichnung war synonym und daher verwirrend.)
- **`--font-serif`** wird nun aus `shared/css/design-system.css` bezogen (vorher
  nur in der 3-Massen-Sim lokal definiert).

## [2.0.3] - 2026-07-06
### Behoben (Vektor-Pfeilspitzen — kanonische Geometrie)
- **Pfeilspitzen sitzen jetzt exakt auf dem Zielpunkt statt ~1·strokeWidth
  darüber hinaus.** Alle Vektor-Marker (`arr-v/a/fg/fn/fr` + dynamische
  Koordinatensystem-Marker `arr-cs-*`) von `refX = markerWidth − 1` auf
  `refX = 0` umgestellt (Dreieck-Basis am Linien-Ende) und den Schaft in
  `drawArrow`/`drawAxis`/`addLeg` (Legende) via neuem `shortenEnd()`-Helfer
  um die Marker-Länge (`markerWidth · strokeWidth`) gekürzt. Ergebnis: Spitze
  exakt auf dem Endpunkt, Schaft an der Dreieck-Basis überdeckt — konsistent
  mit der korrigierten kanonischen Regel in `CLAUDE.md` (vgl. Kreisbewegung
  v1.0.8). Rein visuelle Korrektur, keine Physikänderung.

## [2.0.2] - 2026-07-05
### Geändert (UI-Konsistenz)
- **Topbar-Buttonleiste kanonisch geordnet:** Reihenfolge jetzt Theme-Toggle ·
  ▶ Play · Pause · Reset · Diagramm (CSV) · Alle Daten (CSV) (zuvor Export·Reset·
  Pause·Play). Play primär links, Exporte rechts. Einheitlich mit Zykloide,
  Schräger Wurf, Atwood, Freier Fall.
- **Zwei Export-Buttons:** Bisheriger einzelner „Export CSV"-Button heißt jetzt
  „Alle Daten (CSV)" (`export_all_btn`) und exportiert weiterhin alle Subjekte ×
  alle Größen. Neuer „Diagramm (CSV)"-Button (`export_diagram_btn`) exportiert
  nur die aktuell gewählte Größe für die aktiven Subjekte (Körper-Eigenschaften
  ω/α_w → nur SP). Vergleichslinien werden im Diagramm-Export bewusst nicht
  aufgenommen (andere Körper-Typen → Verwechslungsgefahr), nur im Alle-Daten-
  Export. Boden-Transform via exportiertem `render.getTransformedData` (keine
  Logikduplikation zur Diagramm-Anzeige).
- **Haftreibungskoeffizient μ_s in rechte Analyse-Sidebar verschoben:** μ_s ist
  nicht nutzersteuerbar (wird automatisch ausreichend für reines Rollen gewählt),
  gehört daher nicht in die linke Sidebar mit den Parametern. Display jetzt in
  der Sektion „Physik & Rollbedingung" neben der Rollbedingung. DOM-ID `mu_val`
  beibehalten → nur DOM-Verschiebung, kein JS-Change.

## [2.0.1] - 2026-07-03
### Behoben (Fixed)
- **Dark-Mode-Persistenz:** Theme wird jetzt beim Start aus `fh_theme` (localStorage) geladen und beim Toggeln gespeichert — zuvor gar nicht persistiert. Toggle schaltet `dark`/`light` synchron (vorher blieb `light` kleben, wenn `dark` dazukam). Einheitlicher Key `fh_theme` gemäß CLAUDE.md-Konvention.

## [2.0.0] - 2026-07-03

### Hinzugefügt (Feature)
- **Einklappbare Analyse-Sidebar:** Rechte Sidebar (Visualisierung, Analyse-Objekte, Rennen, Energiebilanz, Physik) jetzt ein-/ausklappbar. Steuerung als Panel-Header mit Double-Chevron (rotiert beim Zustandswechsel). Default eingeklappt (44-px-Schiene, vertikales „Analyse"-Label). Body eingeklappt off-screen (`position:fixed; left:-10000px`) statt `display:none`, damit MathJax die Formeln im Hintergrund typesetzt. `aria-expanded`/`aria-controls` + Fokus-Ring. Blueprint: `global_docs/simulation_instruction.md` § „Einklappbare Analyse-Sidebar".
- **Kanonische Stopwatch:** Hauptzifferblatt (r=60, 60 Marken, Hauptzeiger 1 U/60s) + Hilfszifferblatt (cy=25, r=13, 10 Marken, Hilfszeiger 1 U/s, Reset auf 12 Uhr). `translate(640,72) scale(0.7)` im Sim-SVG (statisches Overlay, nicht von Kamera bewegt). Zeigt `simTime`; precompute-basiert. Ref: Atwood v2.2.x / CLAUDE.md.
- **Legende Punkte:** `.legend-grid` in linker Sidebar für SP/P1–P4 (Schwerpunkt + vier Zykloiden-Punkte) mit Farb-Swatches.
- **Back-Button:** `← Übersicht` in Topbar-left (`../AllAnimations/index.html`).

### Geändert (Refactor / Style)
- **Shared Design-CSS eingebunden:** `../shared/css/design-system.css` vor per-Sim `css/styles.css` (DRY). Base-Tokens, Layout-Grid, Klapp-Sidebar-CSS und UI-Komponenten zentral aus shared. per-Sim `styles.css` bereinigt auf Rolling-spezifische Komponenten (Obj-Buttons, Compare, Subj-Pills, Energiebalken, Race-Bars) + SVG-Targets. Google-Fonts-Link entfernt (shared `@import`et sie).
- **Grid:** `255px 1fr 295px` → `280px 1fr 270px` (FH-Standard).
- **Kraft-Vektorfarben auf Okabe-Ito** (colorblind-safe): `F_g`/`F_N`/`F_R` jetzt Blau/Orange/Mauve (`#0072b2`/`#e69f00`/`#cc79a7`, dark `#56b4e9`/`#f0e442`/`#e078c3`) — ersetzt das alte purple/green/orange. Geerbt aus shared.
- **Topbar:** Title-Struktur an FF/Atwood angeglichen (`.version`/`.inst`-Spans).

## [1.9.5] - 2026-07-03

### Geändert (Style)
- **Schriftart:** Syne → DM Sans (FH-Aachen-Design-System); `JetBrains Mono` auf Gewicht 400/500 reduziert. Google-Fonts-Link inkl. `preconnect` für `fonts.gstatic.com`.

## [1.9.4] - 2026-02-25

### Behoben (Fixed)
- **Koordinatensystem:** Die Pfeilspitzen (Marker) des Koordinatensystems werden nun auch im Dark Mode in der korrekten Akzentfarbe angezeigt (statt Schwarz).
- **Dokumentation:** Vollständige Synchronisation von Backlog und Issue-Tracker.

## [1.9.3] - 2026-02-25

## [1.8.0] - 2026-02-25

## [1.7.1] - 2026-02-25

### Geändert (Changed)
- **Visualisierung:** Das Koordinatensystem liegt nun permanent im Vordergrund und wurde mit einer leichten Transparenz versehen.

## [1.7.0] - 2026-02-25

### Hinzugefügt (Added)
- **Koordinatensystem:** Ein visuelles Koordinatensystem am Ursprung der Rampe.
- **Bezugssystem-Auswahl:** Umschaltung zwischen "Ebene" und "Boden".
- **Interaktive UI:** Automatische Deaktivierung von Sub-Optionen.
