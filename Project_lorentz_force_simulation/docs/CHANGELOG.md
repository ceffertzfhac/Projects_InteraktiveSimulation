# CHANGELOG - Lorentzkraft Simulation

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
