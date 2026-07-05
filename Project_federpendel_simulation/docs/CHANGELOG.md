# Changelog — Federpendel

Alle nennenswerten Änderungen an dieser Simulation. Version folgt
[SemVer](https://semver.org/): patch = Bugfix/Style, minor = Feature,
major = brechende Änderung. Die Versionsnummer in `index.html` wird
mitgeführt.

## v1.0.3 — 2026-07-05

### Fix
- **Sim nutzt SVG-Fläche effizienter**: Layout zurück auf gestapelt
  (rows `1.5fr 1fr`). Der Simulationsinhalt füllte das 450×480-viewBox
  nicht aus (horizontaler Aufbau: Inhalt y ≈ 88–320, 56 % Leerraum).
  `setupScene` setzt den viewBox jetzt pro Aufbau: horizontal
  `0 75 450 260` (Inhalt ~88–320, aspect 1,73 statt 0,94 → Inhalt
  ~1,8× größer auf der Zelle), vertikal `0 0 450 480` (volle Höhe, da
  Auslenkung amplitudeabhängig nach unten reicht).
- **Stoppuhr-Verschiebung**: Gruppen-Transform `translate(250,60)` →
  `translate(220,60)`, damit analoger Kreis (x bis 459) und LCD-Rahmen
  (x bis 481) nicht über den 450-breiten viewBox hinausragen (waren im
  Prototyp mit 900-breitem viewBox ok, bei der Migration beschnitten).

## v1.0.2 — 2026-07-05

### Fix
- **Sim-Anzeige nutzt verfügbare Fläche**: Center-Layout von gestapelt
  (rows) auf **side-by-side** (columns `1.5fr 1fr`) umgestellt. Das fast
  quadratische Sim-SVG (450×480) blieb in der breiten Center-Zelle bei
  gestapeltem Layout immer höhenlimitiert (leere Fläche links/rechts).
  Side-by-side macht die Sim-Zelle hoch und quadratisch → das SVG füllt
  sie aus. Media-Query (`max-width: 1100px`) fällt auf gestapeltes
  Layout zurück.

## v1.0.1 — 2026-07-05

### Fix
- **Sim-Anzeige vergrößert**: Center-Layout von `1fr 1fr` auf
  `1.5fr 1fr` geändert — die fast quadratische Sim-SVG (450×480) wirkt
  in der breiten Center-Zelle höhenlimitiert sonst klein; Sim-Zelle
  bekommt jetzt ≈60 %, Diagramm ≈40 % der Höhe.

## v1.0.0 — 2026-07-04

Erste modulare Version. Migration des bisherigen Standalone-Prototypen
`AllAnimations/federpendel.html` (v6.2, 642 Zeilen, Einzel-Datei) in die
kanonische 6-Modul-Architektur des Repos.

### Features
- **6-Modul-Architektur**: `constants.js` · `state.js` · `physics.js` ·
  `render.js` · `ui.js` (ES-Module-Einstieg) · `index.html`/`css/styles.css`.
  Entry-Point ist `js/ui.js` (kein `main.js`); DOM-Cache-Initializer
  heißt `initDOM()`.
- **Precompute + Interpolation**: `precompute()` füllt die Zeitreihen
  für `max(4T, 10 s)`; `interpolateAt(t)` interpoliert linear. Animation
  indiziert nur in die Arrays — keine Per-Frame-Physik. Dynamische
  Erweiterung via `extendMotionData`, wenn die Sim-Zeit ans Ende stößt.
- **Kanonische Topbar-Buttonleiste**: `▶ Play` · `⏸ Pause` · `↺ Reset` ·
  `Diagramm (CSV)` · `Alle Daten (CSV)` in der Topbar (nicht in der Sidebar).
- **3-Spalten-Layout** `280px 1fr 270px` mit **einklappbarer Analyse-Sidebar**
  (default eingeklappt, 44-px-Schiene, Body off-screen — nie `display:none`,
  damit MathJax die Formeln im Hintergrund typesetted).
- **Gestapeltes Center-Layout** (Simulation oben, Diagramm unten) analog
  Rollende Körper / Zykloide.
- **Shared Design-Tokens**: `../shared/css/design-system.css` vor per-sim
  `css/styles.css` verlinkt. FH-Mint, `DM Sans`/`JetBrains Mono` via
  `--font-ui`/`--font-mono`, Okabe-Ito-Vektorfarben (`--c-sp` Auslenkung,
  `--c-vel` Geschwindigkeit, `--c-acc` Beschleunigung) mit Dark-Mode-
  Varianten.
- **Dark Mode** über einheitlichen LocalStorage-Key `fh_theme` (persistiert
  beim Navigieren Übersicht↔Sim).
- **CSV-Export** mit `sep=;`-Header, Semikolon-Trenner, Komma-Dezimal:
  „Diagramm (CSV)" exportiert die aktuell gewählte Größe,
  „Alle Daten (CSV)" den vollständigen Datensatz (t, x, v, a, E_kin, E_pot,
  E_ges).
- **Legende** in der linken Sidebar für alle farbcodierten Vektoren + Masse.
- **Vektoren default sichtbar** (Toggles `checked`), auch im Ruhezustand
  (`updateScene(0,…)` in `resetSim`).
- **Statisches MathJax**: Formeln als statisches HTML in `index.html`,
  orientierungsabhängiges \(x_0\)/\(y_0\)-Label via JS-`innerHTML`-Wechsel
  (kein Laufzeit-`typesetPromise`).
- **Physik-Schreibweise**: \(x(t)=x_0\cos(\omega t)\),
  \(v(t)=-x_0\omega\sin(\omega t)\), \(a(t)=-\omega^2 x(t)\);
  \(\omega=\sqrt{k/m}\), \(T=2\pi/\omega\).
- Horizontaler und vertikaler Aufbau (Radio), Masse- und Federdicke skalieren
  mit \(m\) bzw. \(k\), analoge Stoppuhr + LCD-Digitaluhr-Easteregg
  (Klick auf Stoppuhr schaltet um), manuelle Zeitmessung mit
  „Zeitmessung starten"-Button, Abspielgeschwindigkeit 1×/½×/¼×.
- Diagrammtyp-Dropdown (Auslenkung/Geschwindigkeit/Beschleunigung vs. Zeit)
  aus Nutzerperspektive benannt; `tAxisStep` garantiert ≥3 Ticks auf der
  t-Achse; Diagrammtitel als letztes SVG-Kind, klar über weißem Hintergrund.

### Migrations-Hinweise
- Der Prototyp `AllAnimations/federpendel.html` und der Quellordner
  `Standalone Proto/Federpendel/` wurden nach erfolgreicher Migration
  stillgelegt (Dubletten-Regel aus `BACKLOG.md`).
- Vorschaubild in `AllAnimations/Vorschaubilder/` belassen (kein
  Emoji-Platzhalter).