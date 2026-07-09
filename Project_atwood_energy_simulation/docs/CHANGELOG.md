# Changelog — Atwood-Energie

Alle nennenswerten Änderungen an dieser Simulation. Version folgt
[SemVer](https://semver.org): patch = Bugfix/Style, minor = Feature,
major = brechende Änderung. Die Versionsnummer in `index.html` wird
mitgeführt.

## v1.1.1 — 2026-07-09

Nullpunkt-Auswahl \(E_{\text{pot}}\) direkt über die Energiebilanz
gepackt und um zwei Bezugspunkte erweitert.

### Features
- **Nullpunkt-Auswahl über der Energiebilanz**: `ep_zero_select` aus der
  linken Sidebar-Sektion in eine schmale `energy-zero-bar` am oberen Rand
  des Graph-Bereichs verschoben (direkt über dem Balkendiagramm). Linke
  Sektion „Reibung & Energie-Referenz" heißt nun „Reibung" (enthält nur
  noch den Reibungskraft-Slider).
- **Zwei weitere Bezugspunkte**: „Boden (h = 0)" und „Decke (oberes Ende)"
  als wählbare \(E_{\text{pot}}\)-Nullpunkte. `physics.js` liefert je Modus
  `hNull1`/`hNull2`: `boden` → 0, `decke` → \(h_{\max}\). Energieerhaltung
  bleibt erhalten (Nullpunkthöhe zeitunabhängig).
- **Nulllinien in der Szene** für alle 5 Modi (separate/y1/y2/boden/decke);
  Boden → Linie am Boden, Decke → Linie an der Decke.

### Notes
- Options-Text ohne MathJax (nativ nicht renderbar); Unicode-Subskripte
  (m₁/m₂) statt `\(...\)`. Das Label „Nullpunkt \(E_{\text{pot}}\)" außerhalb
  des Selects bleibt MathJax-gesetzt.

## v1.1.0 — 2026-07-09

Rework der Diagramm-Anzeige nach PO-Korrektur: das im Prototypen als
**Balkendiagramm** ausgeführte Energie-Overview ist wieder die
**Default-Anzeige rechts**, umschaltbar auf 1 bzw. 2 Achsendiagramme.
Steuerflächen-Orientierung an der Best Practice der Kreis-/Spiralbewegung-Sims.

### Features
- **Energie-Balkendiagramm als Default**: horizontale, zentrierte Balken
  (positiv nach rechts, negativ nach links) für alle 13 Energiegrößen —
  \(m_1\): \(E_{k,1}/E_{p,1}/E_{\text{ges},1}\); \(m_2\): \(E_{k,2}/E_{p,2}/E_{\text{ges},2}\);
  System: \(E_{k,\text{ges}}/E_{p,\text{ges}}/E_{\text{ges}}/E_{\text{Verlust}}\).
  Treu aus dem Prototyp übertragen, aber mit **statischen MathJax-Labels**
  (kein Laufzeit-`typesetPromise` pro Frame) — pro Frame wird nur
  Balken-Breite/Position + Wert aktualisiert.
- **3-Wege-Diagramm-Modus** (statt bisher 1/2): „Energie-Balken" (Default) ·
  „Ein Diagramm" · „Zwei Diagramme". Umschaltung über `speed-pills` in der
  linken Sidebar-Sektion „Diagramme" (Best-Practice-Muster der
  Kreis-/Spiralbewegung-Sims, nicht mehr in einer Center-Toolbar).
- **Skalenmaximum pro Lauf**: `store.energyBarMax` = größter |E| über alle
  13 Reihen × gesamte Animation (Floor 1) — der längste Balken füllt die
  halbe ViewBox, Vergleichbarkeit über die Zeit bleibt erhalten.
- **Steuerflächen-Konsolidierung**: Subjekt-, Diagramm-1/2-Auswahl in die
  linke Sektion „Diagramme" verschoben; nur im Achsenmodus sichtbar
  (`#line_options_group`), Diagramm 2 nur im Modus „Zwei Diagramme".
  Die frühere Center-`graph-toolbar` entfällt; der Graph-Bereich zeigt
  ausschließlich die Balken-Ansicht bzw. das Achsen-SVG.
- **Pill-Logik vereinheitlicht**: `speed-pills` für Abspielgeschwindigkeit
  und Diagramm-Modus gemeinsam über `updateAllPills()` aktiviert.

### Removed
- Center-`graph-toolbar` (Radios + Selects) inkl. ihrer CSS-Regeln
  (`.radio-group`/`.radio-pill`/`.graph-toolbar.*`).

## v1.0.0 — 2026-07-09

Erste modulare Version. Migration des Standalone-Prototypen
`AllAnimations/atwood_energy.html` (1376 Zeilen, Einzel-Datei) in die
kanonische 6-Modul-Architektur des Repos — als **eigenständige Simulation**
(keine Integration in `Project_atwood_simulation/`; bewußt nicht
konsolidiert). Didaktischer Schwerpunkt: **Energieerhaltung und
Energieverlust** an der Atwood-Maschine.

### Features
- **6-Modul-Architektur**: `constants.js` · `state.js` · `physics.js` ·
  `render.js` · `ui.js` (ES-Module-Einstieg) · `index.html`/`css/styles.css`.
  Entry-Point `js/ui.js` (kein `main.js`); DOM-Cache-Initializer `initDOM()`.
  Szene, Rollen-/Apertur-/Massen-Geometrie, Stoppuhr, Lineal, Vektor-Rendering
  aus `Project_atwood_simulation/` übernommen (physikalisch identische Maschine).
- **Energie als Default-Diagrammtyp**: „Energie (E_kin, E_pot, E_ges)" ist
  der voreingestellte Diagrammtyp (Composite, 3 Linien) — die
  Energieerhaltung steht im Mittelpunkt, ohne das 280/1fr/270-Grid zu
  brechen. Eigenständigkeit der Sim ohne Extra-Balken-Sektion.
- **Energie-Diagrammtypen** (Nutzerperspektive benannt): Composite
  „Energie (E_kin, E_pot, E_ges)" · „Kinetische Energie E_kin" ·
  „Potentielle Energie E_pot" · „Gesamtenergie E_ges" · „Energieverlust E_V".
  Daneben die kinematischen Typen „Position y" · „Geschwindigkeit v" ·
  „Beschleunigung a" · „Abstand der Massen Δy".
- **Subjekt-Wahl** System / Nur m₁ / Nur m₂ (System = Summe/gesamt bei
  Energie-Typen, beide Massen bei kinematischen Typen).
- **Layout-Umschalter Nebeneinander ↔ Übereinander** (Topbar-Button,
  persists in `localStorage`). Aktiviert **I9** (Zweier-Diagramme orthogonal
  zur Sim/Diagramm-Aufteilung): Übereinander-Layout + 2 Diagramme →
  Diagramme **nebeneinander** (breite Landscape-Zelle); Nebeneinander-Layout
  + 2 Diagramme → Diagramme **übereinander gestapelt** (hohe Portrait-Zelle).
  Die Mittellinie (Sim/Diagramm-Trenner) verschiebt sich nicht. Default:
  Nebeneinander.
- **2-Diagramm-Modus = zwei frei wählbare Typen** (je Slot eigener
  Dropdown). Default Slot1 „Energie (E_kin, E_pot, E_ges)", Slot2
  „Energieverlust E_V" — erzählt Erhaltung + Verlust.
- **Vereinfachte Coulomb-Reibung** (skalare Rollreibungskraft F_R, mit
  Haftreibungs-Fall `a=0` falls |(m₁−m₂)g| ≤ F_R). Didaktisch zeigt sie
  Energieverlust: E_ges fällt, E_V wächst, E_ges + E_V konstant.
  Modellgrenzen siehe `docs/KNOWN_LIMITATIONS.md` (→ M7).
- **3 wählbare E_pot-Nullpunkte**: je Masse eigene Starthöhe (`separate`,
  Default) · Höhe von m₁-Start (`y1`) · Höhe von m₂-Start (`y2`).
  Referenzhöhe(n) als gestrichelte grüne Linien in der Szene.
- **Reibungspfeil** an der Rolle (Bogen, zeigt entgegen der Drehrichtung;
  nur wenn F_R > 0 und Bewegung).
- **Energie-Live-Panel** (rechtes Analyse-Panel): E_kin/E_pot/E_ges/E_V
  live + zwei **Bilanzzeilen** „E_kin + E_pot = E_ges" und
  „E_ges + E_V = … (konstant)" — Erhaltungsbeweis in Zahlen. Keine
  DOM-Balken (Diagramm ist die Visualisierung; Balken überladen das
  270-px-Panel nicht).
- **Energie-Farben = neue shared Okabe-Ito-Tokens** (`shared/css/design-system.css`),
  konfliktfrei zu Kraft-/Bewegungsvektoren, dark-mode-tauglich:
  `--c-ekin #d55e00`, `--c-epot #009e73`, `--c-etot #999999`,
  `--c-eloss #56b4e9` (+ Dark-Varianten).
- **Akkordeon-Steuerungs-Sidebar (I8)**: linke Cluster einzeln einklappbar
  (`<button class="panel-label">` + Chevron `▾`, rotates -90°→`▸`).
  Default eingeklappt: „Reibung & Energie-Referenz", „Abspielgeschwindigkeit".
- **Koordinatensystem = Höhe vom Boden** (kanonisch): Lineal, Diagramm,
  Slider-Anzeige und Live-Panel einheitlich „Höhe vom Boden in cm", 0 unten.
  E_p = m·g·(h − h_0).
- **Kanonische Topbar-Buttonleiste**: Theme · ▶ Play · ⏸ Pause · ↺ Reset ·
  Diagramm (CSV) · Alle Daten (CSV). CSV `;`/`,` mit Energie-Spalten.
- **3-Spalten-Layout** `280px 1fr 270px` mit **einklappbarer Analyse-Sidebar**
  (default eingeklappt, 44-px-Schiene, Body off-screen — nie `display:none`,
  damit MathJax die Formeln im Hintergrund typesetted).
- **Precompute + Interpolation**: `precompute()` füllt Zeitreihen bis zur
  Kollision (Masse trifft Boden/Blende) bzw. 10 s; `interpolateAt(t)`
  interpoliert linear. Animation indiziert nur — keine Per-Frame-Physik.
- **Shared Design-Tokens**: `../shared/css/design-system.css` vor per-sim
  CSS. FH-Mint, `DM Sans`/`JetBrains Mono`, Okabe-Ito-Kraftfarben,
  Dark Mode via `fh_theme`.
- **Graph-Konventionen** (zentral übernommen): beide Achsen ≥4 beschriftete
  Ticks inkl. 0 (`niceStepLE`/`getNiceTick` Ordinate, `tAxisStep` Abszisse);
  Hintergrund-Rect 10 px über Pfeilspitzen; Titel als letztes SVG-Kind,
  klar über weißem Hintergrund; gepaddetes Plot-Gebiet.
- **Statisches MathJax**: Formeln als statisches HTML in `index.html`
  (kein Laufzeit-`typesetPromise`); Wort-Subskripte via `\text{}`.
- **Stoppuhr** Two-Hand-Design (Hauptzifferblatt r=60 + Hilfszifferblatt
  1 U/s), Atwood-kanonisch.

### Migrations-Hinweise
- Quelle: `AllAnimations/atwood_energy.html` →
  `legacy_archive/atwood_energy.html` (stillgelegt).
- AllAnimations-Karte umgehängt auf `../Project_atwood_energy_simulation/`
  und mit Modular-Badge versehen.
- Vorschaubild in `AllAnimations/Vorschaubilder/` belassen (kein
  Emoji-Platzhalter).
- Bewußt eigenständige Simulation (keine Konsolidierung in
  `Project_atwood_simulation/`); s. `BACKLOG.md` M7.