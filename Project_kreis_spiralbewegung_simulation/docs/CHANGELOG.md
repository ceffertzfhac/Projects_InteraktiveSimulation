# Changelog — Kreis- und Spiralbewegung

Versionierung: patch = Bugfix/Style, minor = neues Feature, major = brechende Änderung.
Die Version in `index.html` ist mit der neuesten Changelog-Version synchron gehalten.

## [1.0.0] — 2026-07-08
### Neu (Migration von `AllAnimations/kreiskinematik_v5.html`)
- Modularisierung der 1479-Zeilen-Standalonedatei in den kanonischen 6-Module-
  Scaffold (`constants`/`state`/`physics`/`render`/`ui` + `css/styles.css`),
  ES-Module-Entry via `js/ui.js` (kein `main.js`), 3-Spalten-Layout 280/1fr/270
  mit einklappbarer Analyse-Sidebar (§3/§8 Blueprint).
- **Dark Mode repariert:** shared Tokens (`--bg`, `--surface`, `--text`, …)
  werden direkt genutzt, kein `:root`-Remap mehr (der in der Quelldatei den
  Light-Wert einfror — CSS-Variablen lösen eager am deklarierenden Element).
  Sim-spezifische Tokens (`--c-r`/`--c-v`/`--c-a`/`--c-omega`/`--c-alpha`/
  `--c-phi`, `--graph-bg`, `--disk-fill`, …) mit `body.dark`-Varianten.
- **Statisches MathJax:** Radius-Label \(R\)/\(R_0\) und Physik-Formelbox als
  zwei `display`-umgeschaltete Varianten — kein `MathJax.typeset` zur Laufzeit.
- **Kanonische Vektor-Pfeilspitzen** (`refX=0` + `shortenEnd`): Haupt- und
  Polar-Komponentenvektoren enden mit der Spitze exakt auf dem Zielpunkt
  (Quelldatei hatte `refX=markerWidth`-Halbfertig-Varianten und einen
  `EXTENSION_PX=10`-Workaround, der entfallen ist).
- **Graph-Konventionen** (`setAxisLabel`/`setGraphTitle`): kursive Größe,
  uprechte Einheit; Titel als letztes SVG-Kind; Abszisse bei \(y=0\) für
  symmetrische Größen (x/y/vx/vy/ax/ay); t-Tick-Labels am unteren Rand;
  Graph-bg-Rect; ≥4 Ticks via `getNiceTickStep`/`tAxisStep`.
- **Precompute auf festes 120 s-Horizont** (statt extend-on-the-fly); Spiral-
  \(R\to0\)-Wächter bricht die Precompute-Schleife ab → `effectiveDuration`
  als konsistentes Cap (interpolateAt, Graph-t_max, CSV-Länge, animate).
- Physik unverändert (analytisch geschlossen): \(\omega(t)=\omega_0+\alpha t\),
  \(\varphi(t)=\varphi_0+\omega_0 t+\tfrac12\alpha t^2\), \(R(t)=R_0+v_r t\)
  (Spirale), v/a mit Coriolis-Term. Auto-Stopp via analytischer Quadrat-Lösung.
- Features portiert: 2D/ISO-Ansicht, kartesische + polare Vektorzerlegung,
  \(\vec{a}_t\) 10×-Skalierung, \(\omega\)/\(\alpha\)-Vektoren (ISO), \(\varphi\)-
  Bogen, Bahnverlauf, Auto-Stopp (n·90°), 4 Szenarien-Presets, deg/rad-Umschalt,
  Ein-/Zwei-Diagramm-Modus, 13 wählbare Größen, CSV-Export (Diagramm + alle
  14 Spalten), Stoppuhr, Auto-Zoom.

### Bekannte Einschränkungen (siehe `issues.md`)
- Farbpalette (Violett+Orange+Grün) bewusst nicht Okabe-Ito-normalisiert
  (Parität zur Quelldatei); Angleichung ist Folge-Aufgabe.
- Stoppuhr ohne kanonische Atwood-Subdial (Quelldatei hat nur Hauptzeiger).