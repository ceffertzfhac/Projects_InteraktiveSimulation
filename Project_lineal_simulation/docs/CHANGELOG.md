# Changelog — Schwingendes Lineal

Alle nennenswerten Änderungen an dieser Simulation. Version folgt
[SemVer](https://semver.org): patch = Bugfix/Style, minor = Feature,
major = brechende Änderung. Die Versionsnummer in `index.html` wird
mitgeführt.

## v1.4.0 — 2026-09-26

### Neu
- **Bedien-Sidebar einklappbar (→ BACKLOG I17).** Kopfleiste „Bedienung“ mit
  Doppel-Chevron oben in der linken Sidebar; eingeklappt eine 44-px-Schiene wie
  die Analyse rechts. Vorgabe: ausgeklappt. Gemeinsames Modul
  `shared/js/panel-toggle.js`, Layout in `shared/css/design-system.css`.
- Schmales, gestapeltes Layout (< 900 px): eingeklappt bleibt nur die waagerechte Kopfleiste stehen, keine Schiene.

## v1.3.5 — 2026-09-22

### Style
- **Header zweizeilig für schmale Bildschirme.** Das Copyright steht jetzt
  kleiner in einer eigenen Zeile unter „Titel · Version · FH Aachen – FB 8 –
  Physik"; das Physik-Logo sitzt rechts daneben über beide Zeilen. Styling
  zentral in `shared/css/design-system.css` (kein Inline-Style mehr).
  Die Copyright-Marke fehlte hier bisher und ist jetzt wie in allen anderen
  Sims ergänzt.

## v1.3.4 — 2026-09-22

### Style
- **Physik-Logo in der Topbar.** Das Logo „Lehr- und Forschungsgebiet
  Physik – FB 8" sitzt dezent (41 px, leicht transparent) im Header
  rechts neben „FH Aachen – FB 8 – Physik". Pilot für den Rollout auf alle Sims; Bild und CSS
  (`.topbar-logo`) liegen zentral in `shared/`.

## v1.3.3 — 2026-09-18

### Bugfix
- **Zeitmodus „Kontinuierlich": Zeitachse wächst mit (B45).** Das
  Seitenblättern aus v1.3.2 ist ersetzt: die Achse beginnt immer bei 0 und
  skaliert laufend mit der Wiedergabezeit (\(t_\text{max} = \max(t_\text{end}, t)\),
  wie bei der Zykloide) — die gesamte bisherige Kurve bleibt sichtbar.
- Bei stark gestauchter Achse (Periode < 6 px) wird die Schwingung als
  Min/Max-Hüllkurve je Pixelspalte gezeichnet (wie ein Oszilloskop) — keine
  Aliasing-Bögen, Amplitude bleibt exakt; davor periodische Abtastung mit
  24 Punkten je Periode.
- Ordinatenbereich gecacht, damit das Neuskalieren pro Frame flüssig bleibt.

## v1.3.2 — 2026-09-18

### Bugfixes
- **Zeitmodus „Kontinuierlich" friert nicht mehr ein (B45):** die Wiedergabe
  klemmte die Zeit auf das Precompute-Fenster (≈ 8 s) — danach standen Lineal,
  Vektoren, Zeitanzeige und Live-Panel still. Jetzt wird die Schwingung mit
  echter Zeit periodisch fortgesetzt (`interpolatePeriodic`, war bisher
  ungenutzt). Das Diagramm **blättert seitenweise**: ist ein Fenster voll,
  beginnt die Kurve auf einer neuen Seite mit fortlaufender Zeitachse
  (z. B. 8,2 … 16 s); Hover-Werte berücksichtigen den Seitenversatz.
- **Serien-Legende (B44):** bleibt innerhalb der Plotfläche (gemessene Breite,
  Hintergrund, mehr Kopfraum); Formelzeichen typografisch korrekt (Symbol
  kursiv, Index tiefgestellt, z. B. |*F*<sub>Aufh</sub>|) statt `|F_Aufh|` —
  auch in der Energie-Legende und im Hover-Tooltip.
- **CSV-Export (B46):** „Diagramm (CSV)" funktioniert beim Typ Kraftbeträge;
  „Alle Daten (CSV)" enthält die vier Kraftbeträge.

## v1.3.1 — 2026-09-18

### Konventionen
- **Resultierende Kraft heißt jetzt \(\vec{F}_\text{ges}\)** statt
  \(\vec{F}_\text{res}\) (FB-8-Namenskonvention, s. `CLAUDE.md`): Toggle,
  Legende, Formeln im Analyse-Panel, Diagramm-Legende/Hover/CSV-Symbol sowie
  interne Schlüssel (`fges_data`, `ges_vector`, `tog_ges`, `arrow-ges`).

### Übersicht
- Vorschaubild `Vorschaubilder/lineal.png` ergänzt (ersetzt den
  CSS-Placeholder auf beiden Übersichten).

## v1.3.0 — 2026-09-18

Kraft auf die Aufhängung, Kraftbetrags-Diagramm, Referenzkurve und Zeitmodus.
Freigabe für die öffentliche Übersicht (→ BACKLOG I15).

### Physik / Vektoren
- **Kraft auf die Aufhängung \(\vec{F}_\text{Aufh} = m\,(\vec{g} - \vec{a})\)**
  (Reaktion nach Newton 3) als neuer Vektor (Toggle, Default aus), Farbe
  `--c-epot`; Legende und Formelteil im Analyse-Panel ergänzt.
- **\(\vec{a}\) und \(\vec{F}_\text{res}\) auf die Maximal-Beschleunigung des
  Fensters skaliert** (`store.aMax`) statt auf *g*: die Pendelbeschleunigung
  ist klein (≈ 0,2 g), bei g-Bezug war der Vektor kürzer als die Pfeilspitze.

### Diagramm
- Neuer Diagrammtyp **„Kraftbeträge (|F|)"**: |F_G|, |F_N|, |F_res|, |F_Aufh|
  über der Zeit in mN (Kurvenfarben = Vektorfarben der Szene).
- **„Vorherige Kurve als Referenz"** (Toggle): friert die aktuelle Kurve als
  gestrichelte Referenz ein; sie bleibt bei Parameteränderungen sichtbar und
  wird mit der neuen Achsenskala mitskaliert. Ein Wechsel des Diagrammtyps
  ersetzt sie.

### Wiedergabe
- **Zeitmodus** (neuer Cluster, default eingeklappt): „Auto-Stopp (8 s)" hält
  nach 8 s an (Play startet von vorn), „Kontinuierlich" (Default) läuft ohne
  Loop-Sprung weiter — über das Precompute-Fenster hinaus periodisch
  fortgesetzt (`interpolatePeriodic`). Das Fenster ist jetzt ein ganzzahliges
  Vielfaches von *T* (Obergrenze 600 s).
- Zeitschritt-Slider \(\Delta t\) entfernt: feste Schrittweite `DT = 0,01 s`
  (didaktisch ohne Mehrwert, verwirrte bei großen Werten).

### Sonstiges
- Hinweis „Masse kürzt in *T* heraus" aus der Steuerung ins Analyse-Panel
  verschoben (dort bei den Formeln).
- Vitest: DT-Slider-Test durch Tests für feste Schrittweite, Zeitmodus-Fenster
  und periodische Fortsetzung ersetzt.

## v1.2.0 — 2026-09-18

Kräftebild am Schwerpunkt, progressive Diagrammwiedergabe und PO-Korrekturen.

### Physik / Vektoren
- **Kräfte am Schwerpunkt** (neue Vektoren, über Toggles wählbar):
  - **Normalkraft \(\vec{F}_N\)** (Achsenkraft, entlang des Lineals):
    \(F_N = m\,(s\,\omega^2 + g\cos\varphi)\) in Richtung der Achse — am
    Umkehrpunkt am größten, zeigt dort nach oben (Lineal „zieht" an der Achse).
  - **Resultierende Kraft \(\vec{F}_\text{res} = m\vec{a}\)**: Zusammensetzung aus
    Zentripetal- (\(s\,\omega^2\), radial zur Achse) und Tangentialbeschleunigung
    (\(s\,\ddot\varphi\), tangential zur Bahn).
  - **Beschleunigung \(\vec{a}\)**: richtungsgleich zu \(\vec{F}_\text{res}\)
    (massenunabhängig), Skalareferenz \(|a|=g\).
- **Vektor-Skalierungsfaktor** (Slider 0,5×–4×, Default 1×): skaliert alle
  Vektoren (F_G als Referenz \(|F_G|=mg\), F_N/F_res darauf bezogen, a auf g).
  Wirkt sofort, ohne Neu-Integration.
- Vektor-Toggles (Visualisierungs-Panel): F_G, v, F_N (Default an),
  F_res, a (Default aus). Legende entsprechend ergänzt (Farben:
  --c-fn Orange, --c-fr Mauve, --c-acc Rot — Okabe-Ito, colorblind-safe).

### Wiedergabe
- **Progressive Diagrammkurve** (analog Schräger Wurf / Kreisbewegung):
  die Kurve baut sich mit der Wiedergabe auf (nur bis zur aktuellen Zeit),
  der Wiedergabe-Marker markiert das Kurvenende.
- **Bugfix Abspielgeschwindigkeit:** der `change`-Handler der Tempo-Radios
  aktualisierte `store.speedFactor` nie → Tempo-Wahl wirkte nicht.
- **Info-Button/Modal entfernt** (Gestaltung wie die anderen Sims; die
  Formeln stehen bereits im Analyse-Panel).

## v1.1.0 — 2026-09-18

Abarbeitung des Review-Backlogs (kritisches Technik-/Physik-/UI-/UX-/Didaktik-
Review): numerische Präzision, Accessibility, didaktische Hinweise, Performance.

### Physik / Numerik
- **UI-justierbarer Zeitschritt Δt** (0,001–0,05 s, Default 0,01 s): neuer
  Slider im Panel „Visualisierung". Der Wert lebt im `store` (`store.DT`) —
  zentrale Stelle für alle mutablen Werte; `constants.js` exportiert nur noch
  den Default `DT_DEFAULT`. `precompute()`/RK4 lesen die aktuelle Schrittweite
  aus dem Store. Kleinere Schritte erhöhen die RK4-Genauigkeit bei großen
  Auslenkungen (φ₀ > 45°) ohne spürbaren Performance-Verlust.
- **Interpolation O(log n):** `interpolateAt()` sucht das Zeitintervall jetzt
  per Binary-Search statt `findIndex` (O(n)) — relevant für kleine Δt
  (bis 20 000 Punkte) in Animation, Wiedergabe-Markern und Hover.
- **Diagramm-Downsampling:** Kurven werden stride-verdünnt, wenn mehr Punkte
  als Diagramm-Pixelbreite vorliegen (Endpunkte bleiben erhalten) — visuelle
  Qualität unverändert, Polyline-Knoten bei kleinem Δt stark reduziert.

### UX
- **Instabilitäts-Overlay:** Achse unterhalb des Schwerpunkts (*s* ≤ 0) →
  roter Hinweis über der Szene, Play-Button gesperrt (vorher nur „— instabil"
  im Live-Panel).
- **φ₀-Warnung (didaktisch):** Im kleinen-Winkel-Modell ab φ₀ > 20° erscheint
  ein Hinweis unter dem Slider, dass die Näherung merkbar vom exakten
  Verhalten abweicht und „Exakt (nichtlinear)" gewählt werden sollte.
- **Info-Modal:** Button „❔ Info" (Topbar) öffnet ein `<dialog>` mit
  Modell-Zusammenfassung und Hinweis zum einstellbaren Zeitschritt.
- **Energie-Legende:** Beim Diagrammtyp „Energie" zeigt eine SVG-Legende
  (Farbswatch + Label) die Zuordnung *E*_kin/*E*_pot/*E*_ges.
- **Diagramm-Dropdown-Beschreibungen:** Je `<option>` ein `title`-Tooltip
  mit kurzer physikalischer Erläuterung des Verlaufs.
- **Responsive:** Unter 900 px brechen die drei Spalten (Steuerung / Szene /
  Analyse) gestapelt um; das SVG skaliert weiterhin per `preserveAspectRatio`.

### Accessibility
- ARIA-Labels für alle Slider (inkl. `aria-valuemin/max/now`, dynamisch
  synchronisiert), Buttons, Select; Hover-Tooltip mit `role="tooltip"` +
  `aria-live="polite"`; Warnhinweis mit `role="status"`.
- Globale `:focus-visible`-Fokusanzeige im Design-System; Tooltip-Hintergrund
  auf neue, kontraststarke Token `--tooltip-bg` (Light/Dark).

### Test
- Neue Vitest-Suite `test/physics.test.js` (9 Tests): abgeleitete Größen,
  Stabilitäts-Grenzfall, *store.DT*-Respekt, RK4-Energieerhaltung,
  Binary-Search-Interpolation (Gleichwertigkeit vs. Referenz-Scan).
- CI-Workflow `.github/workflows/ci.yml` (Node 20, `npm ci`, `npm test`).

## v1.0.0 — 2026-07-15

Erstfassung aus der Lineal-Aufgabe (→ `new_sim_input/Lineal/`):
„Bestimmen Sie die Periodendauer der Schwingung für kleine Auslenkungen"
eines handelsüblichen Plastiklineals als physikalisches Pendel.

### Physik
- **Physikalisches Pendel:** Lineal (Länge *l*, Breite *b*) schwingt reibungsfrei
  um eine Achse durch ein Loch im Abstand *a* vom oberen Rand.
  *I*_S = ⅟₁₂·*m*·(*l*²+*b*²), *I*_A = *I*_S + *m*·*s*² (Steiner, *s* = *l*/2−*a*),
  ω₀ = √(*g*·*s*/(⅟₁₂(*l*²+*b*²)+*s*²)), *T* = 2π/ω₀ (harmonisch).
  Die Masse kürzt in *T* heraus (didaktischer Hinweis in der Sidebar).
- **Zwei Modelle umschaltbar:** „Kleine Winkel" (geschlossene harmonische Lösung,
  *T* = 2π/ω₀) und „Exakt (nichtlinear)" (RK4-Integration von φ̈ = −ω₀²·sin φ,
  *T* = (4/ω₀)·K(sin(φ₀/2)) via AGM-berechnetem elliptischem Integral). Bei
  großen Auslenkungen wird die Abweichung der Näherung sichtbar.
- **Energie** (modellkonsistent, echte Invariante je Modell):
  *E*_kin = ½·*I*_A·ω², *E*_pot = ½·*m*·*g*·*s*·φ² (linear) bzw.
  *m*·*g*·*s*·(1−cos φ) (exakt), *E*_ges konstant. Nur hier wirkt die Masse.
- Sanity: *T* ≈ 0,902 s für die Aufgabenvorgabe (32 cm × 3,7 cm, Loch bei 1,9 cm);
  *E*_ges-Schwankung < 1·10⁻¹⁸ (linear) bzw. < 1·10⁻⁹ (RK4 über 6 Perioden).

### Simulation
- Slider: Lochposition *a* (1–14 cm), Lineallänge *l* (30–40 cm), Breite *b*
  (1–6 cm), Anfangsauslenkung φ₀ (5–90°), Masse *m* (1–50 g). Achse rutscht
  unter den Schwerpunkt (*s* ≤ 0) → „instabil", keine Schwingung.
- Animiertes Lineal ( Rotation um den Drehpunkt, Winkelbogen φ, Schwerpunkt,
  Schwerkraft- & Geschwindigkeitsvektor, Ruhelage-Bezugslinie, cm-Teilstriche).
- Diagramme (Picker, linke Sidebar): φ(t), ω(t), α(t) (jeweils Abszisse am
  Nulldurchgang, symmetrische Ordinate) und Energie (*E*_kin/*E*_pot/*E*_ges,
  drei Linien). Hover-Werte (→ BACKLOG I13.1) mit mehrreihigem Tooltip.
- Kanonische Topbar, einklappbare Analyse-Sidebar (Formeln + Live-Werte),
  Akkordeon-Steuerungs-Sidebar links, CSV-Export, Dark Mode über Tokens.