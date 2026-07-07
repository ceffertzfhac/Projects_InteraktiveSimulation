# Changelog - Rollende Körper Simulation

Alle wichtigen Änderungen werden hier dokumentiert. Die neuesten Änderungen stehen oben.

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
