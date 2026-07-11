# CHANGELOG - Lorentzkraft Simulation

## [1.5.8] - 2026-07-11
### Geändert (T9 - shared/js-Helper konsolidieren)
- **`shortenEnd`** nutzt jetzt `shared/js/vectors.js` statt einer lokalen
  Kopie. Rückgabe-Keys von `{x,y}` auf `{x2,y2}` umgestellt (kanonisch,
  Mehrheit der Sims); alle 3 Call-Sites angepasst. Keine sichtbare
  Änderung - Algorithmus war bereits identisch mit der neuen shared
  Funktion.

## [1.5.7] - 2026-07-07
### Behoben (B1 — RHO_CU-Duplikat in ui.js)
- **`RHO_CU` jetzt aus `constants.js` importiert** statt als Magic Number `0.0178`
  hartkodiert in `ui.js` (Zeile ~26, geschätzter Strom im Spannungsmodus zur
  Federhärte-Limit-Berechnung). Bisher war der Wert abgeschrieben, während
  `physics.js` bereits die Konstante importiert nutzte — bei künftiger Änderung
  von `RHO_CU` (anderes Material/Korrektur) wären Slider-Limit und Physik
  auseinandergelaufen. Rein interne Konsistenz — keine Verhaltens-/Optikänderung.

## [1.5.6] - 2026-07-07
### Refaktoriert (T6 — einheitliches fmt() via shared/js)
- **Lokale `fmt()`-Definition durch Import aus `shared/js/format.js` ersetzt** —
  repo-weit eine einzige, robuste Hilfsfunktion (Komma-Dezimal, `Number.isFinite`-
  Guard → '—' statt 'NaN'-String). **Sichtbare Änderung:** die bisherige Lorentz-
  Variante nutzte `toLocaleString('de-DE')` und erzeugte bei Werten ≥ 1000 einen
  Tausenderpunkt (z. B. „1.000,00 A"); die einheitliche `toFixed`-Variante zeigt
  „1000,00 A" (kein Tausenderpunkt). Betrifft nur Slider-Maxima (Strom 1000 A,
  Abstand 1000 mm) — bewußt zugunsten repo-weiter Einheitlichkeit geopfert
  (BACKLOG T6: robuste `toFixed`-Variante als Basis). Zusätzlich NaN-Guard neu.

## [1.5.5] - 2026-07-07
### Refaktoriert (T7 — Feder-Magic-Numbers zu Konstanten)
- **Feder-Helix-Parameter aus `render.js` nach `constants.js` ausgelagert** (neues
  `SPRING`-Objekt): Windungen (`COILS=14`), Helix-Radius (`7`), Drahtbreite (`2,6`),
  Hook-Länge (`15`), Fallback-Schwelle (`5`), Sample-Schritte (`12`) sowie die
  Strichbreiten-Multiplikatoren/Farben der drei Layer + Hooks. `draw3DSpring()` und
  `getHelixSegment()` referenzieren jetzt `SPRING.*` statt nackter Zahlen. Rein
  interne Refaktorierung — keine Verhaltens-/Optikänderung.

## [1.5.4] - 2026-07-07
### Geändert (T8 — Vektor-Label-Notation an 3-Massen-Referenz angeglichen)
- **Kraft-Vektor-Labels tragen jetzt das Vektorsymbol mit Pfeil** (`F⃗` + Index L für
  Lorentzkraft, S für Federkraft) in Serif-Italic mit `stroke:none` (kein Faux-Bold)
  — statt wie bisher `FL=…N` / `Fs=…N` als nackte Mono-Zeichenkette. **Beträge werden
  bewußt nicht mehr gezeigt** (PO-Vorgabe: Werte sind nicht nötig und standen im Weg).
  Neue Hilfsfunktion `vecLabel(...)` in `render.js`; CSS-Klasse `.force-label` in
  `styles.css`. Farbe bleibt wie bisher.
- **Namens-Hinweis:** F_S ist laut CLAUDE.md-Konvention „Seilkraft"; hier bezeichnet
  es die **Federkraft** (vorbestehende Mehrdeutigkeit, wird durch T8 nicht neu
  eingeführt — Indexbuchstabe `S` wie bisher beibehalten).
- **Strom-Pfeil-Labels** (`e-`/`I`) bleiben unverändert (keine Kraft-Vektor-Labels;
  `e-` ist Partikel, `I` eine Strom-Richtungsmarkierung — keine Vektor-Symbole im
  T8-Sinne).
- **`--font-serif`** wird nun aus `shared/css/design-system.css` bezogen.

## [1.5.3] - 2026-07-06
### Behoben (Vektor-Pfeilspitzen — kanonische Geometrie)
- **Pfeilspitzen (Strom-Pfeile `I`/`e⁻`, Kraft-Pfeile `F_L`/`F_s`) sitzen
  jetzt exakt auf dem Zielpunkt statt ~1·strokeWidth darüber hinaus.** Marker
  `arr-current`/`arr-current-phys`/`arr-fl`/`arr-fs` von `refX = markerWidth − 1`
  auf `refX = 0` umgestellt (Dreieck-Basis am Linien-Ende); der Schaft wird via
  neuem `shortenEnd()`-Helfer um die Marker-Länge (`markerWidth · strokeWidth`)
  gekürzt — bei den Kraft-Pfeilen mit der **dynamischen** Strichbreite
  (`7 · dynamicWidth`), sodaß die Spitze bei jeder Kraftstärke passt. Konsistent
  mit der korrigierten kanonischen Regel in `CLAUDE.md` (vgl. Kreisbewegung
  v1.0.8, Rollende Körper v2.0.3). Rein visuelle Korrektur, keine Physikänderung.

## [1.5.2] - 2026-07-05
### Behoben (Fixed)
- **Kritischer ASI-Bug (Simulation ladete nicht):** In `ui.js` schloss die
  Zuweisung `store.isDarkMode = …` (Zeile 81) ohne Semikolon ab; die darauffolgende
  `[DOM.voltage_slider, …].forEach(...)`-Zeile wurde von JS als Index-Zugriff
  `…contains('dark')[DOM.voltage_slider, …]` gelesen — `contains('dark')` gibt
  `boolean` zurück, `boolean[…]` → `undefined`, `.forEach` auf `undefined` →
  `TypeError: Cannot read properties of undefined`. `initUI()` scheiterte, damit
  der gesamte `main()`-Bootstrap → Simulation nicht funktionsfähig. Drei
  `[DOM....].forEach`-Blöcke (Sliders/Radios/Toggles) betroffen.
  Fix: `;`-Präfix vor zeilen-startende `[…].forEach` (no-semicolon-Stil,
  ASI-Hazard bei `[`/`(` am Zeilenanfang).
- **Tote Referenz entfernt:** `DOM.tog_bfield` in `main.js` referenzierte ein
  nicht existierendes Element (kein B-Feld-Toggle in der UI).

## [1.5.1] - 2026-07-03
### Behoben (Fixed)
- **Dark-Mode-Persistenz:** Theme wird jetzt beim Start aus `fh_theme` (localStorage) geladen und beim Toggeln gespeichert — zuvor gar nicht persistiert. Toggle schaltet `dark`/`light` synchron. Einheitlicher Key `fh_theme` gemäß CLAUDE.md-Konvention.

## [1.5.0] - 2026-07-03

### Hinzugefügt (Feature)
- **Einklappbare Analyse-Sidebar:** Rechte Sidebar (Live-Analyse, Formeln) jetzt ein-/ausklappbar. Steuerung als Panel-Header mit Double-Chevron. Default eingeklappt (44-px-Schiene, vertikales „Analyse"-Label). Body eingeklappt off-screen (`position:fixed; left:-10000px`) statt `display:none`, damit MathJax die Formeln im Hintergrund typesetzt. `aria-expanded`/`aria-controls` + Fokus-Ring. Blueprint: `global_docs/simulation_instruction.md`.
- **Legende:** `.legend-grid` in linker Sidebar für Strom (technisch/physikalisch), Lorentzkraft \(F_L\), Federkraft \(F_S\).
- **Back-Button:** `← Übersicht` in Topbar-left (`../AllAnimations/index.html`).

### Behoben (Fixed)
- **Stale Gold-Reste entfernt:** `rgba(232,197,71,…)` (`.obj-btn.active`/`.speed-pill.active`/`.inner-r-group`/`.formula-box`/`.vec-scale-btn.active`) und `.btn.primary:hover #d4b33e` — alles auf Mint/Akzent bzw. aus shared geerbt. (Zudem tote Rolling-CSS-Klassen entfernt, die nie in Lorentz verwendet wurden.)
- **Doppeltes `:root`/`body.dark` am Dateiende entfernt:** Die zweite Definition überschrieb u. a. `--c-current` im Dark Mode auf `#000000` (Pfeil unsichtbar). Token-Block jetzt konsolidiert in einer Definition.

### Geändert (Refactor / Style)
- **Shared Design-CSS eingebunden:** `../shared/css/design-system.css` vor per-Sim `css/styles.css` (DRY). Base-Tokens, Layout-Grid, Klapp-Sidebar-CSS und UI-Komponenten zentral aus shared. per-Sim `styles.css` bereinigt auf Lorentz-spezifische Tokens + Gauges + Radio-Rows + Analyse-Header + SVG-Marker. Google-Fonts-Link entfernt (shared `@import`et sie).
- **Grid:** `255px 1fr 295px` → `280px 1fr 270px` (FH-Standard).
- **Kraftfarben colorblind-safe:** \(F_L\)/\(F_S\) jetzt Okabe-Ito Blau/Orange (`var(--c-fg)`/`var(--c-fn)`, dark `#56b4e9`/`#f0e442`) — ersetzt purple/grün (purple+green+orange war für Rot-Grün-Schwache untauglich).
- **Topbar:** Title-Struktur an FF/Atwood angeglichen (`.version`/`.inst`-Spans).

### Bewusst nicht umgesetzt
- **Keine Stopwatch:** Lorentz ist ein statisches Gleichgewicht ohne Zeitanimation — die Stopwatch ist Sims mit Zeitverlauf vorbehalten (Atwood/Rolling/FF).

## [1.4.1] - 2026-07-03
### Geändert (Style)
- **Schriftart:** Syne → DM Sans (FH-Aachen-Design-System); `JetBrains Mono` auf Gewicht 400/500 reduziert. Google-Fonts-Link inkl. `preconnect` für `fonts.gstatic.com`.

## [1.0.0] - 2026-02-25
### Hinzugefügt
- Initiale Version der Lorentz-Kraft-Simulation.
- Berechnung des Widerstands und der Stromstärke für Kupferleiter.
- Dynamische Berechnung der Gleichgewichtslage zwischen Lorentzkraft und Federkraft.
- SVG-Visualisierung von Leitern, Federn und Magnetfeldern.
- Kraftvektoren für Lorentzkraft und Federkraft.
- Sidebar mit Parametern für Spannung, Geometrie und Mechanik.
- Live-Analyse-Panel mit Formeln und aktuellen Werten.
- Unterstützung für Dark/Light-Mode.
