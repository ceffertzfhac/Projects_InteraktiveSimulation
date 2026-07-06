# Changelog - Rollende Körper Simulation

Alle wichtigen Änderungen werden hier dokumentiert. Die neuesten Änderungen stehen oben.

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
