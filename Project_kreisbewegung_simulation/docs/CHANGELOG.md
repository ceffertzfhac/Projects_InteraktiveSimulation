# Changelog — Kreisbewegung

Alle nennenswerten Änderungen an dieser Simulation. Version folgt
[SemVer](https://semver.org): patch = Bugfix/Style, minor = Feature,
major = brechende Änderung. Die Versionsnummer in `index.html` wird
mitgeführt.

## v1.0.0 — 2026-07-06

Erste modulare Version. Migration des bisherigen Standalone-Prototypen
`AllAnimations/kreisbewegung.html` (1071 Zeilen, Einzel-Datei) in die
kanonische 6-Modul-Architektur des Repos.

### Features
- **6-Modul-Architektur**: `constants.js` · `state.js` · `physics.js` ·
  `render.js` · `ui.js` (ES-Module-Einstieg) · `index.html`/`css/styles.css`.
  Entry-Point ist `js/ui.js` (kein `main.js`); DOM-Cache-Initializer
  heißt `initDOM()`.
- **Precompute + Interpolation**: `precompute()` füllt die Zeitreihen für
  `max(4T, 10 s)`; `interpolateAt(t)` interpoliert linear. Animation
  indiziert nur in die Arrays — keine Per-Frame-Physik. Dynamische
  Erweiterung via `extendMotionData`, wenn die Sim-Zeit ans Ende stößt.
- **Kanonische Topbar-Buttonleiste**: `▶ Play` · `⏸ Pause` · `↺ Reset` ·
  `Diagramm (CSV)` · `Alle Daten (CSV)` in der Topbar (nicht in der Sidebar).
- **3-Spalten-Layout** `280px 1fr 270px` mit **einklappbarer Analyse-Sidebar**
  (default eingeklappt, 44-px-Schiene, Body off-screen — nie `display:none`,
  damit MathJax die Formeln im Hintergrund typesetted).
- **Gestapeltes Center-Layout** (Simulation oben, Diagramm unten) analog
  Federpendel / Rollende Körper.
- **Shared Design-Tokens**: `../shared/css/design-system.css` vor per-sim
  `css/styles.css` verlinkt. FH-Mint, `DM Sans`/`JetBrains Mono` via
  `--font-ui`/`--font-mono`. Vektorfarben: Hauptvektoren aus shared
  (`--c-vel` Geschwindigkeit, `--c-acc` Beschleunigung, `--c-r` Ort als
  sim-spezifischer Token analog `--c-p1`), Komponenten sim-spezifisch
  (`--c-rx/-ry`, `--c-vx/-vy`, `--c-ax/-ay`, `--c-traj`) mit Dark-Mode-
  Varianten — farbblindensicher (kein purple+green+orange zugleich).
- **Dark Mode** über einheitlichen LocalStorage-Key `fh_theme` (persistiert
  beim Navigieren Übersicht↔Sim).
- **CSV-Export** mit `sep=;`-Header, Semikolon-Trenner, Komma-Dezimal:
  „Diagramm (CSV)" exportiert die aktuell gewählte Größe (Single: Zeitreihe
  oder Bahnkurve x;y, Stacked: t + zwei Größen), „Alle Daten (CSV)" den
  vollständigen Datensatz (t, x, y, vx, vy, |v|, ax, ay, |a|, φ).
- **Legende** in der linken Sidebar für alle farbcodierten Vektoren +
  Komponenten + Bahnkurve.
- **Vektoren default sichtbar** (Hauptvektoren `checked`), Komponenten
  default aus. Vektoren werden auch im Ruhezustand (t=0) gezeichnet —
  `updateScene(0,…)` in `resetSim`.
- **Statisches MathJax**: Formeln als statisches HTML in `index.html`
  (kein Laufzeit-`typesetPromise`).
- **Physik-Schreibweise**: \(\varphi(t)=\varphi_0+\omega t\),
  \(x=R\cos\varphi\), \(y=R\sin\varphi\); \(v_x=-R\omega\sin\varphi\),
  \(v_y=R\omega\cos\varphi\); \(a_x=-R\omega^2\cos\varphi\),
  \(a_y=-R\omega^2\sin\varphi\) (Zentripetalbeschleunigung);
  \(|\vec v|=R|\omega|\), \(|\vec a|=R\omega^2=|\vec v|^2/R\),
  \(T=2\pi/|\omega|\).
- **Parameter**: Radius \(R\) (0,5–2,0 m), Anfangswinkel \(\varphi_0\)
  (0–360°), Winkelgeschwindigkeit \(\omega\) (−180…+180 °/s, auch negativ
  = Umkehrrichtung), Abspielgeschwindigkeit 1×/½×/¼×/⅛×. Zoom paßt den
  Kreis automatisch in die Zeichenfläche.
- **Vektoraddition-Stil Komponenten**: \(r_x\) vom Zentrum, \(r_y\) am Ende
  von \(r_x\) (rechtwinklige Zerlegung); analog für \(v\) und \(a\).
- **Diagrammtyp-Dropdown** aus Nutzerperspektive benannt: Bahnkurven
  (y(x), x(y)), Orts-/Geschw.-/Beschl.-Komponenten je x(t)/y(t), Beträge
  |v|(t)/|a|(t) und Winkel φ(t). „x/y gestapelt"-Toggle zeigt je Größe die
  x- und y-Komponente in zwei gestapelten Teilgraphs (bei Bahnkurven
  deaktiviert).
- **Graph-Konventionen** (zentral aus CLAUDE.md/Blueprint übernommen):
  Beide Achsen ≥4 beschriftete Ticks inkl. 0 (1-2-4-5-Folge via
  `niceStepLE` für Ordinate/Position, `tAxisStep` für Zeitachse);
  Abszisse am Nulldurchgang bei Werten um 0 (Schwingungsgrößen x/y/v/a);
  Diagramm-Format pro Layout (Landscape gestapelt); Titel als letztes
  SVG-Kind, klar über weißem Hintergrund; gepaddetes Plot-Gebiet.
- **Stacked-Graph-CSS-Regeln** (Phase-0-Lektion aus Schrägem Wurf): für
  `#graph_line_top`/`#graph_line_bottom`/`#graph_point_top`/
  `#graph_point_bottom` explizite `stroke`/`fill`-Regeln — SVG-Default
  `stroke:none` machte Linien sonst unsichtbar.
- **Stoppuhr** (analog + LCD-Digitaluhr-Easteregg, Klick auf Stoppuhr
  schaltet um), Two-Hand-Design wie Atwood.

### Migrations-Hinweise
- Separate Migration von `kreiskinematik_v5` (M6b) — thematisch Drehung/
  Spirale, nicht identisch. Keine Konsolidierung.
- Der Prototyp `AllAnimations/kreisbewegung.html` und der Quellordner
  (falls vorhanden) werden nach erfolgreicher Abnahme stillgelegt
  (Dubletten-Regel aus `BACKLOG.md`).
- Vorschaubild in `AllAnimations/Vorschaubilder/` belassen (kein
  Emoji-Platzhalter).