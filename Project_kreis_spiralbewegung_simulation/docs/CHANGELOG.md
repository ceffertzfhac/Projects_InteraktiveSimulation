# Changelog — Kreis- und Spiralbewegung

Versionierung: patch = Bugfix/Style, minor = neues Feature, major = brechende Änderung.
Die Version in `index.html` ist mit der neuesten Changelog-Version synchron gehalten.

## [1.8.0] — 2026-07-15

Feature (→ BACKLOG I14): synchronisierter Hover zwischen Diagramm 1/2 im
Zwei-Diagramm-Modus (Hover existierte bereits seit v1.5.0, aber unabhängig
pro Slot).

### Geändert
- **I14: synchronisierter Dual-Hover.** Beide Diagramm-Slots sind hier stets
  Zeitreihen (keine Bahnkurve) und teilen sich im Zwei-Diagramm-Modus daher
  immer dieselbe Zeitachse — Hover über Diagramm 1 zeigt jetzt automatisch
  denselben Zeitpunkt auch als Cursor/Punkt/Tooltip in Diagramm 2 (und
  umgekehrt). Neu: `store.hoverSourceSlot`/`hoverT` + `refreshHover()`, analog
  zum in dieser Session etablierten Muster (Kreisbewegung v1.4.0, Freier Fall
  v2.5.0, Atwood v2.4.0, Atwood-Energie v1.4.0, Schräger Wurf v1.6.0).
- **Hover-Refresh verschoben:** der Redraw des offenen Hover-Cursors passiert
  jetzt einmalig am Ende von `drawGraphs()` (nach beiden Slots), nicht mehr
  inline in `drawGraph()` pro Slot — sonst würde der synchronisierte andere
  Slot noch mit der Skala vom Vorframe gezeichnet.

## [1.7.1] — 2026-07-13

B23 — Vektor-Pfeilspitzen bei zu kurzem Vektor (repo-weiter Fix des shared-Helpers `shortenEnd`).

### Behoben (B23)
- **Vektor-Pfeillänge/Spitze:** Der shared-Helper `shortenEnd` erzwang bei
  Vektorlängen ≤ Marker-Länge einen 2-px-Schaft-Stub, sodaß die refX=0-Spitze
  über das Ziel hinausschoß. `shortenEnd` gibt jetzt `null` zurück, wenn der
  Vektor kürzer als die Pfeilspitze ist; `setMain` verbirgt zu kurze
  Hauptvektoren (Ort/Geschw./Beschl.) statt sie mit Überschieß-Spitze zu zeichnen.

## [1.7.0] — 2026-07-13

I6 — Diagramm-Export als SVG- bzw. PNG-Datei. Ergänzt den bestehenden CSV-Export
um eine visuelle Bilddatei (kanonische Topbar-Buttonleiste).

### Hinzugefügt
- **Topbar:** zwei neue Buttons „Diagramm (SVG)" + „Diagramm (PNG)" nach den
  CSV-Buttons. Nutzen den shared-Helper `shared/js/export-image.js` (Computed-Style-
  Inlining für losgelöste SVG-Datei); Exportziel ist das separate `#graph_svg`.
- **`js/state.js`:** DOM-Cache `exportSvg`/`exportPng` ergänzt (`graphSvg` bestand
  bereits). → BACKLOG I6.

## [1.6.1] — 2026-07-13

Copyright-Marke + Disclaimer-Verweis (repo-weit, Vorbereitung I1/ILIAS-Veröffentlichung).

### Geändert
- **Topbar:** Copyright-Marke „© 2026 FH Aachen, FB 8 · Alle Rechte vorbehalten" neben
  dem Institutions-Span ergänzt. Keine Verhaltensänderung — rein rechtlicher Hinweis
  (volle Fassung in repo-root `NOTICE.md` und auf der Übersichtsseite).

## [1.6.0] — 2026-07-12

FX2 — Kanonischer Stoppuhr-Subdial nachgerüstet. FX5 — Auto-Stopp-
Zielverfehlung jenseits des Precompute-Horizonts sichtbar gemacht.

### Hinzugefügt
- **Stoppuhr-Subdial** (10 Marken, Sub-Zeiger 1 U/s) — proportional zum
  bestehenden, größeren Zifferblatt skaliert (`WATCH_SUBDIAL_R = WATCH_R ·
  13/60`, `WATCH_SUBDIAL_OFFSET = WATCH_R · 25/60`, aus dem Atwood-Vorbild
  mit `WATCH_R=60` hergeleitet). Kein Eingriff in den bestehenden Hauptzeiger.
- **Auto-Stopp-Warnhinweis**: liegt das Ziel `n·90°` jenseits des
  120 s-Precompute-Horizonts (bzw. des früheren Spiral-Kollaps-Endes), stoppte
  die Animation bisher still am regulären Sim-Ende, ohne daß der Nutzer
  erfuhr, daß das Ziel nie erreicht wurde. Neuer Warnhinweis unter dem
  Auto-Stopp-Regler („⚠ Ziel (n·90°) nicht erreicht — Simulationsdauer
  (120 s) zu kurz."), erscheint nur wenn `isAutoStopping` beim Sim-Ende noch
  aktiv war; verschwindet automatisch bei Reset/neuem Start. Kein Cap auf
  `nStop` (würde die quadratische Kreuzungszeit für jede Parameterkombination
  vorab lösen müssen — unverhältnismäßig für den Nutzen).

## [1.5.0] — 2026-07-12

I5 — Hover-Werte am Zeit-Diagramm (Rollout, letzte Sim, Abschluss des I5-Rollouts).

### Hinzugefügt
- **Hover-Cursor + Tooltip auf dem Diagramm**: Mouseover über die Kurve zeigt
  eine gestrichelte vertikale Führungslinie, einen hohlen Ring-Punkt und ein
  Tooltip mit Zeitpunkt *t* und Symbol/Wert/Einheit der geplotteten Größe.
  Funktioniert unabhängig in beiden Diagramm-Slots (Dual-Graph-Modus, I9).
  **Strukturelle Besonderheit dieser Sim:** `drawGraph()` leert die gesamte
  `graph_group_1`/`graph_group_2` per `innerHTML=''` bei jedem Aufruf (nicht
  nur eine Unter-Gitter-Gruppe wie bei Zykloide/Rolling/Schräger Wurf) — das
  Hit-Rect + Hover-Overlay lebt deshalb in eigenen Geschwister-Gruppen
  (`graph_hover_group_1`/`_2`), deren Transform in `drawGraphs()` synchron
  zu `graph_group_1`/`_2` gesetzt wird (inkl. Dual-Layout-Versatz `off2`).
  `shared/js/hover.js` unverändert wiederverwendet. Selbstkorrektur greift
  auch bei Format-Wechsel (Portrait/Landscape via `graphGeom()`), da die
  Hit-Rect-Geometrie bei jedem `drawGraph()`-Aufruf neu synchronisiert wird.
  Per Playwright verifiziert: Single- und Dual-Modus (unabhängige Slots),
  Moduswechsel räumt den jeweils inaktiven Slot auf, Layout-Toggle bei
  aktivem Hover (Selbstkorrektur) — keine Console-Errors.

## [1.4.2] — 2026-07-11
### Geändert (T9 — shared/js-Helper konsolidieren)
- **`shortenEnd`/`setAxisLabel`/`setGraphTitle`/`tAxisStep`/`niceStepLE`**
  nutzen jetzt `shared/js/vectors.js`, `shared/js/svg-text.js` bzw.
  `shared/js/ticks.js` statt lokaler Kopien (bisher teils in `physics.js`,
  teils in `render.js`). **`shortenEnd`**: Algorithmus von hartem Cutoff auf
  garantierten 2px-Mindest-Schaft umgestellt (Mehrheits-Variante,
  konsistent mit Stoß/Rolling/3-Massen/Lorentz) — sichtbar nur bei
  Vektorlänge nahe 0 (z. B. \(v≈0\)); per Playwright verifiziert
  (omega0=0/5°/s: Nullvektor unverändert, bei 5°/s jetzt exakt 2px
  Mindest-Schaft statt vorherigem Cutoff-Wert).

## [1.4.1] — 2026-07-10
### Behoben
- **Punkt/Bahn/Vektoren bei weiten Spiralradien hinter Stoppuhr verdeckt
  (B20, kritisch)**: `#stopwatch_circle` (deckende Füllung) stand im SVG
  (`index.html`) **nach** Bahn/Vektoren/Punkt. Da die Zoom-Anpassung
  (`store.currentPixelsPerMeter`) beim Reset nur auf `R0` basiert, nicht
  auf den während der Spiralbewegung maximal erreichten Radius, wächst der
  Bildschirmradius des Punkts im Spiralmodus kontinuierlich über die
  Stoppuhr-Position hinweg. Numerisch verifiziert mit Standardwerten
  (\(R_0=1{,}5\) m, \(\omega_0=60\) °/s, Spiralmodus \(v_r=1{,}0\) m/s —
  alles im normalen Reglerbereich): der Punkt kommt bei \(t≈1{,}15\) s bis
  auf 8 px an das Stoppuhr-Zentrum heran (Stoppuhr-Radius ≈43 px) — Punkt
  und Vektoren wären komplett unsichtbar. Gleiches Muster wie B17–B19.
  **Korrigiert:** Stoppuhr-Gruppe (+ Zoom-Text-Anzeige) im Markup vor
  `trajectory_path`/Vektoren/`point` verschoben. Rein deklarative
  Dokumentreihenfolge, keine JS-Änderung nötig. *(Session 2026-07-10, I10)*

## [1.4.0] — 2026-07-09
### Geändert (Dual-Diagramme orthogonal zur Sim/Diagramm-Aufteilung)
- Im Zweier-Diagramm-Modus liegen die beiden Diagramme nun **orthogonal zur
  Sim/Diagramm-Aufteilung**: im **Übereinander-Modus** (Sim oben, Diagramm unten,
  breite Diagrammzelle) werden die beiden Diagramme **nebeneinander** angeordnet
  (statt wie bisher übereinander gestapelt — die Stapelung in der breit-flachen
  Zelle erzeugte sehr flache, schlecht lesbare Teilgraphen); im **Nebeneinander-Modus**
  (Sim links, Diagramm rechts, hohe Zelle) bleiben sie **übereinander gestapelt**
  (unverändert). Die **Mittellinie** (Sim/Diagramm-Trenner, Grid-Partition) verschiebt
  sich nicht — nur die Anordnung *innerhalb* der Diagrammzelle ändert sich.
- Technisch: `graphGeom()` liefert nun pro Diagramm `cellW`/`cellH` + `off2`-Versatz
  für `graphGroup2`; Landscape-Dual → viewBox-Breite `2·LAND_W+DUAL_GAP` + X-Versatz,
  Portrait-Dual → viewBox-Höhe `2·PORT_SLOT_DUAL+DUAL_GAP` + Y-Versatz (wie gehabt).
  Ungenutztes `LAND_SLOT_DUAL` entfernt. Kanonische Regel in `simulation_instruction.md`
  / `CLAUDE.md` hinterlegt (Rollout s. `BACKLOG.md`).

## [1.3.0] — 2026-07-08
### Neu (Akkordeon-Steuerungs-Sidebar — Prototyp I8)
- Die linke Steuerungs-Sidebar war überlang und reichte über den unteren Rand.
  Statt sie als Ganzes einzuklappen (wie das rechte Analyse-Panel), werden die
  vorhandenen thematischen `.panel-section`-Cluster nun **einzelnen ein-/ausklappbar**
  gemacht (Akkordeon): jeder `.panel-label`-Header wird zum klickbaren Button mit
  Chevron `▾` (rotiert bei eingeklappt → `▸`), Inhalt darunter per CSS verbergt.
- **Cluster-Reihenfolge (6)** nach Zusammenführung + Sortierung:
  Bewegungsparameter · Visualisierung · Legende · Diagramme (incl. Winkeleinheit) ·
  Modus & Szenarien · Abspielgeschwindigkeit & Auto-Stopp.
  Zusammengeführt: Abspielgeschwindigkeit + Auto-Stopp → ein Cluster; Winkeleinheit
  in den Diagramme-Cluster integriert (Label „Winkeleinheit" statt „Einheit").
  Legende unter Visualisierung, Diagramme unter Legende (über Modus & Szenarien).
- **Default eingeklappt:** Modus & Szenarien, Abspielgeschwindigkeit & Auto-Stopp.
  Offen: Bewegungsparameter, Visualisierung, Legende, Diagramme.
- Implementiert in `css/styles.css` (`.panel-section.collapsible`, Chevron-Geometrie,
  `~ * { display:none !important }` — dominiert JS-gesteuerte `display:block`-Kinder
  wie `#n_control_group`/`#dual_graph_control`, kein „Durchblitzen" im eingeklappten
  Zustand) + `js/ui.js` (Toggle-Handler, `aria-expanded`; Button → Enter/Space nativ).
  Statische MathJax-Labels → `display:none` hier unbedenklich (kein Laufzeit-Typeset
  nötig, anders als beim rechten Analyse-Panel).
- **Chevrons doppelt groß** (`1.4 rem`) für gute Sichtbarkeit/Klickbarkeit.
- Prototyp zunächst nur diese Sim; Greift es, als kanonisches Muster
  (`simulation_instruction.md` § „Akkordeon-Steuerungs-Sidebar") dokumentieren +
  auf andere Sims übertragen → BACKLOG I8.
### Stil (Nebeneinander-Modus: Diagramm 20 % breiter, weniger Rand)
- Das Diagramm **selbst** (nicht die Zelle / Center-Partition) wird im Split-Modus
  breiter: Portrait-ViewBox `PORT_W` 410 → 492 (×1,2) in `render.js`. Die Center-
  Spalten bleiben 50/50 (`1fr 1fr`), die Sim-Zelle unangetastet — nur der Plot
  wächst, seitliche Ränder werden kleiner. Format-lokal (Landscape/Gestapelt über
  `LAND_W`-Zweig unberührt); ≤1100-px-Fallback weiterhin gestapelt.

## [1.2.1] — 2026-07-08
### Stil (FX1 — Okabe-Ito-Farbpalette)
- Vektorfarben von der Quelldatei-Palette (Violett/Orange/Grün) auf
  farbblinden-sichere Okabe-Ito-Tokens umgestellt. Auflösung bisheriger
  Kollisionen: `a`/`α`/Partikel waren alle Rot, `ω`/Bahnkurve beide Mint.
- **Zuweisung** (Light/Dark):
  - `--c-v` → `var(--c-vel)` (Blau), `--c-a` → `var(--c-acc)` (Rot) — shared
    Tokens gemäß CLAUDE.md, deckungsgleich mit Schwester-Sim Kreisbewegung.
  - `--c-r` Grau → Bernstein `#b08010`/`#ffcc33` (wie Kreisbewegung).
  - `--c-traj` Mint → Grau `#7f7f7f`/`#9aa3b8` (wie Kreisbewegung; Mint bleibt
    `ω` allein).
  - `--c-alpha` Rot → Mauve `#cc79a7`/`#e078c3` (Okabe reddish-purple).
  - `--c-phi` `#2ca02c` → Blaugrün `#009e73`/`#55ee99` (Okabe bluish-green).
  - `--c-point` Rot → `--text` (`#1a1e2e`/`#e6eaf5`); Partikel frei von
    Vektorfarben, max. Kontrast auf Disk/Graph.
- `--c-omega` (Mint) unverändert. Komponenten-Vektoren (x/y/r/t) erben weiter
  die Elternfarbe, unterschieden via Strichmuster (dashed/dotted) —
  „Komponente = Elternfarbe" bewusst beibehalten.
- Alle Farben laufen über die lokalen Tokens (`--c-r … --c-point`), die
  Legenden-Swatches, Sidebar-Labels, Vektor-Klassen und Graphlinien speisen —
  eine Stelle (`css/styles.css`), keine weiteren Eingriffe nötig. Keine
  hartkodierten Alt-Hex-Werte in `index.html`/`js/`.

## [1.2.0] — 2026-07-08
### Neu (FX7 — kartesische Komponenten + α(t) im Physik-Block)
- Nach der B12-Panel-Verbreiterung (405 px) ist Platz für mehr Formeln. Die
  Physik-Formelbox zeigte bisher nur \(x,y,\lvert\vec v\rvert,\lvert\vec a\rvert\)
  (Kreis) bzw. die polaren \(\vec v,\vec a\) (Spirale).
- **Ergänzt in allen drei Varianten:**
  - **Kreis gleichförmig** (\(\alpha=0\)): \(v_x(t),v_y(t),a_x(t),a_y(t)\)
    (rein Zentripetal, \(-R\omega^2\cos\varphi\) / \(-R\omega^2\sin\varphi\)) und
    \(\alpha(t)=0\).
  - **Kreis ungleichförmig** (\(\alpha\neq0\)): \(v_x(t),v_y(t)\) sowie
    \(a_x(t)=-R\omega^2\cos\varphi-R\alpha\sin\varphi\),
    \(a_y(t)=-R\omega^2\sin\varphi+R\alpha\cos\varphi\); \(\alpha(t)=\alpha\).
  - **Spirale** (\(v_r\neq0\)): volle kartesische Form inkl. Coriolis-Term
    \(-2v_r\omega\sin\varphi\) / \(+2v_r\omega\cos\varphi\) — exakt wie `physics.js`
    berechnet; \(\alpha(t)=\alpha\); \(R=R(t)\) im Kleingedruckten klargestellt.
- Die Formeln sind konsistent mit `physics.js` (`vx=vr·cosφ−R·ω·sinφ` usw.),
  statisches MathJax (kein Laufzeit-Typeset), Überlauf via B12-Scroll-Sicherheit.
- **Durchgängige \((t)\)-Notation** für alle zeitabhängigen Größen (\(\varphi(t)\),
  \(\omega(t)\), \(\alpha(t)\), \(R(t)\) in der Spirale) — auch auf der RHS der
  Komponentenformeln und den LHS-Beträgen (\(|\vec v(t)|\), \(a_r(t)\), …).
  Konstante Parameter (\(R\) im Kreis, \(v_r\), \(\varphi_0\), \(\omega_0\))
  bewußt ohne \((t)\).
- IDs (`formulas_kreis`/`_kreis_acc`/`_spiral`) und die B11-Umschaltlogik
  (modus-/α-abhängig) unverändert — nur mehr Zeilen pro Box.

## [1.1.11] — 2026-07-08
### Geändert (Analyse-Panel nur diese Sim 1,5× breiter)
- Das rechte Analyse-Panel ist im shared Design-System einheitlich 270 px breit.
  Diese Sim trägt viele Vektoren/Größen (r, v, a je mit kartesisch + polarer
  Zerlegung, ω, α, φ) und den Physik-Formelblock → 270 px sind eng.
- **Per-Sim-Override** (nur kreis_spiral, andere Sims unberührt): rechte Spalte
  270 → **405 px** (\(\tfrac32\times\)). Eingeklappt bleibt die 44-px-Schiene.
  Die abseitige `panel-body`-Typeset-Breite (MathJax im Hintergrund) ebenfalls
  auf 405 gesetzt → kein Reflow beim Aufklappen.
- **Synergie mit B12:** Der breitere Physik-Formelblock braucht seltener
  horizontal zu scrollen (längere Display-Formeln passen eher ins Feld).

## [1.1.10] — 2026-07-08
### Behoben (B12 — Physik-Block im Analyse-Panel voll les-/sichtbar)
- **Bisher abgeschnitten:** Im schmalen 270-px-Analyse-Panel ragen längere
  Display-Formeln (z. B. die Coriolis-Zerlegung
  \(\vec a=-R\omega^2\hat e_r+R\alpha\hat e_t-2v_r\omega\hat e_t\) bzw.
  \(\lvert\vec a\rvert=R\sqrt{\omega^4+\alpha^2}\)) als festbreite MathJax-SVG
  über den rechten Rand und werden vom `.panel{overflow-x:hidden}`
  abgeschnitten → nicht sichtbar.
- **Behoben per `.formula-box`-Override** (kanonisch vgl. 3massen — dasselbe
  270-px-Panel, gleicher SVG-Output, gleiche `\[…\]`-Display-Math): kleinere
  Schrift (0,72 rem statt 0,75 rem, paßt mehr), `overflow-x:auto` als
  Scroll-Sicherheit statt Abschneiden, `overflow-wrap:break-word` für die
  Intro-Zeilen. Display-Math linksbündig (`mjx-container[display=true]`), sodaß
  bei Überlauf der **Anfang** erreichbar bleibt und nicht — wie bei zentriertem
  Überlauf — links weggeschnitten wird. Inhalte/Formeln unverändert.
- **Warum nicht global in shared CSS:** 3massen hat denselben Override bewußt
  per-Sim, weil nicht jedes Panel-Format so schmal ist (z. B. breitere Seiten).
  Bei T9-Konsolidierung prüfen, ob das als shared Helper zentralisiert wird.

## [1.1.9] — 2026-07-08
### Geändert (B8 — Diagrammmodus-Umschalter einheitlich als Pillen)
- **Bislang „komisch":** „Ein Diagramm / Zwei Diagramme" war ein plain
  `.radio-row`-Text-Radio — ungleichmäßig mit den hübschen Speed-Pillen im
  selben Sim und mit Atwoods `.radio-pill`-Diagramm-Umschalter.
- **Jetzt das shared `.speed-pill`-Muster** (shared/css/design-system.css, das
  im selben Sim schon für Abspielgeschwindigkeit genutzt wird): zwei Pillen mit
  `flex:1` in einer `.speed-pills`-Gruppe. Einheitlich mit der Speed-Pille im
  selben Sim, kein neues CSS nötig.
- **Active-Highlight per JS** (kanonisch vgl. Atwood): `syncPills()` setzt die
  `.active`-Klasse auf die gewählte Pille (das Radio ist via `opacity:0`
  ausgeblendet). War bei kreis_spiral bisher gar nicht gesetzt → die gewählte
  Speed-Pille highlightete nicht. Jetzt wird sie (und die Diagramm-Pille) beim
  Start und bei jedem Wechsel korrekt markiert.

## [1.1.8] — 2026-07-08
### Geändert (B9 — Vorschauphase für weichen Start der dynamischen Skalierung)
- **v1.1.7 startete zu abrupt** und zeigte vorm Start die gesamte Range: Am
  \(t=0\)-Ruhezustand fiel der Graph auf die vorausberechnete Vollspanne
  (\(\varphi\approx 6000°\)) zurück, und der erste gespielte Frame war ein winziges
  \(0\ldots0{,}05\,\text{s}\)-Fenster — beides unschön.
- **Jetzt Vorschauphase (feste Start-Spanne):** Solange die Kurve \(T_{\text{PREVIEW}}=3\,\text{s}\)
  noch nicht erreicht hat (auch am Ruhe-Start), zeigt der Graph ein festes Fenster
  \(0\ldots 3\,\text{s}\) × (Wertebereich bis \(3\,\text{s}\)). Die Kurve wächst
  stabil bis zur \(3\)-s-Ecke, und erst wenn sie dort ankommt, beginnt der
  dynamische Auto-Range (Achsen wachsen mit) — am Übergang kein Sprung, weil
  dieselben Daten dieselbe Skala ergeben. Bei kurzen Läufen
  (\(T_{\text{PREVIEW}}\geq t_{\text{End}}\)) bleibt die ganze Spanne fest.
- \(T_{\text{PREVIEW}}\) als Konstante (`GRAPH_T_PREVIEW = 3`) im render.js, an
  PO-Vorgabe „sagen wir 3 s" angelehnt; bei Bedarf einstellbar.

## [1.1.7] — 2026-07-08
### Neu (B9 — dynamische Achsenskalierung, Auto-Range auf den geplotteten Bereich)
- **Bisher:** Achsen waren auf die *vorausberechnete Volllspanne* (min/max über
  den gesamten Lauf) vorskaliert. Bei monoton wachsenden Größen (z. B. \(\varphi\)
  bis \(\approx 6000°\)) blieb der Graph lange fast leer — man sah erst spät, daß
  etwas passiert, und erst am Ende war er voll. Beides nicht sinnvoll.
- **Jetzt Auto-Range auf den bisher geplotteten Bereich** (beide Achsen, wie vom
  PO gewählt): X (Zeit) läuft bis zur aktuellen Sim-Zeit, Y (Wert) nimmt min/max
  über die schon geplotteten Daten — beides auf Nice-Steps gerundet (\(1\)-\(2\)-\(4\)-\(5\)
  bzw. `tAxisStep`). Der Graph füllt sofort die Fläche, aktuelle Werte stehen in
  lesbarer Skala; beide Achsen wachsen mit. Für Schwingungsgrößen (x/y/v/a) hält
  die typspezifische Padding 0 im Sichtbereich (Abszisse am Nulldurchgang); für
  konstante Werte (\(\omega\) bei \(\alpha=0\)) bleibt der kleine Bereich um den
  Wert. Am Laufende (volle Spanne) identisch zur Vorausberechnung.
- **Vorschau am Start:** Solange noch nichts geplottet ist (\(t\approx 0\)), zeigt
  der Graph die volle Spanne (Vorausberechnung); mit dem ersten gespielten Sample
  greift Auto-Range. `plottedValueRange()` nutzt dieselbe typspezifische Logik
  wie `computeAxisLimits()`.

## [1.1.6] — 2026-07-08
### Behoben (B10 — Diagramm füllt die Fläche auch im untereinander-Modus)
- **v1.1.5 war zu quadratisch:** Die Landscape-Maße `480×430` (Aspect 1,12, fast
  quadratisch) ließen den Graph im **untereinander-Modus** (breite, flache Zelle)
  via `preserveAspectRatio=meet` auf Höhe skalieren → er wirkte „ca. 3:4"-artig
  und füllte die viel breitere Zelle nicht aus (seitliche Leerflächen).
- **Maße übernommen aus Kreisbewegung v1.0.10** (was sich dort bewährt und die
  Zelle füllt): **Landscape 700×410** (gestapelt) bzw. **Portrait 410×700**
  (nebeneinander). Das breite Landscape (Aspect 1,71) füllt die gestapelte Zelle,
  das Portrait die hohe Split-Zelle. Dual teilt die Gesamthöhe in 2 Slots + Gap
  (`200+10+200` gestapelt / `345+10+345` Split) wie Kreisbewegung; Gruppe 2 per
  `transform(0, hEach+gap)` geschoben.
- Orientierung (Landscape/Portrait) weiterhin aus der tatsächlichen Zell-Form
  (`getBoundingClientRect`) → `@media`-Fallback und Resize greifen automatisch.

## [1.1.5] — 2026-07-08
### Behoben (B9/B10 — Achsenskalierung paßt sich ans Format an, auch im übereinander-Modus)
- **Bislang konstant Landscape:** Der Graph hatte eine fixe viewBox `480×430`
  (Landscape) in *jedem* Layout. Im **übereinander-Modus** (breite, flache Zelle)
  letterboxte der Landscape-Graph via `preserveAspectRatio=meet` klein in die
  Breite — die Achsenskalierung nutzte die Fläche nicht (B10), Ticks wirkten
  gequetscht. Im nebeneinander-Modus verschwendete Landscape die hohe Zelle.
- **Graph-Format jetzt layout-abhängig** (CLAUDE.md „Diagramm-Format pro Layout",
  kanonisch vgl. Atwood: viewBox dynamisch, Ticks rechnen pro Format neu):
  - **übereinander (gestapelt) → Landscape** (`480×430` Single / `215` Dual-je)
    — füllt die breite, flache Zelle.
  - **nebeneinander (split) → Portrait** (`400×620` Single / `310` Dual-je)
    — füllt die hohe, schmale Zelle.
  - `graphGeom()` leitet Portrait/Landscape aus der **tatsächlichen Zell-Form**
    (`getBoundingClientRect`) ab, nicht nur aus `store.layoutSplit` → der
    `@media`-Fallback (Viewport ≤1100 px erzwingt gestapelt = breite Zelle)
    schaltet automatisch zu Landscape; ein Fenster-Resize paßt live nach.
  - `drawGraph` rechnet Nice-Step/Ticks pro Format neu; die SVG-`viewBox` wird
    in `drawGraphs` pro Render gesetzt, Gruppe 2 per `transform` an `hEach`
    geschoben.
- **Live-Anpassung:** Resize-Listener (rAF-gedrosselt) und das Analyse-Sidebar-
  Umschalten triggern `updateScene` → Graph-Format/Achsen rechnen live nach.
- Aufgeräumt: `GRAPH_W`/`GRAPH_H_*`/`GRAPH_GAP` aus `constants.js` entfernt
  (jetzt `LAND_*`/`PORT_*` in `render.js`); `graphHeight()` durch `graphGeom()`
  ersetzt; `DOM.graphSvg`-Ref wiederaufgenommen.

## [1.1.4] — 2026-07-08
### Geändert (FX6 — Layout-Umschalter EINHEITLICH mit Kreisbewegung)
- **Bislang nicht-kanonisch:** Der Umschalter „Simulation & Diagramm
  nebeneinander / übereinander" war ein eigenes Select-Feld (`#layout_mode_select`)
  in der Sidebar-Sektion „Diagramme" — nur in dieser Sim so, nirgendwo anders.
  Auf das **kanonische Kreisbewegung-Muster** umgestellt (Generelle Regel:
  erst schauen, woanders umgesetzt, dann EINHEITLICH nachbauen):
  - Topbar-Button `#layout_toggle` (`.btn.layout-toggle-btn`) direkt neben
    Back-Button, Text swap `▦ Nebeneinander` ↔ `⊟ Übereinander`.
  - `.layout-split`-Klasse am `#center_area` (statt `.layout-side`), gleiche
    Grid-Regeln wie Kreisbewegung (`1fr 1fr` Spalten, Trennlinie rechts,
    `@media (max-width: 1100px)`-Fallback auf übereinander).
  - Persistenz via `localStorage`-Key `ks_layout` (analog `kb_layout`).
  - Wechsel ist reiner Redraw, die Sim-Zeit wird nicht zurückgesetzt.
- **Graph-Geometrie konsistent gehalten:** Die für v1.1.0 kurz probierte
  Portrait-Geometrie im Split-Modus (`graphGeom()`/`applyGraphLayout()`)
  ist wieder entfernt — der Graph bleibt wie bei Kreisbewegung durchgehend
  Landscape (`graphHeight()` konstant), sodaß die Anzeige beim Umschalten
  nicht springt und die Sim-Konfiguration einheitlich bleibt.

## [1.1.3] — 2026-07-08
### Behoben (B9/B10 — Achsenanpassung wirklich sichtbar)
- **Konstante Größen aufgebläht:** Bei `range=0` (z. B. \(\omega=60°/s\) mit
  \(\alpha=0\)) setzte `pad=1` und das erzwungene `min=-pad` die untere Grenze
  auf −1 → die Kurve lag als flache Linie ganz oben, ~98 % leer.
  `computeAxisLimits` nutzt jetzt `pad = max(|max|·0.1, 1)` und behandelt
  Beträge / vorzeichenbehaftete Kartesische / Winkelgrößen getrennt: konstante
  Werte bekommen einen sinnvollen kleinen Bereich um den Wert, positive
  Winkelgrößen (φ 0→360°) keine künstliche Negativ-Spanne mehr.
- **Abszisse ins Leere:** Die X-Achse wurde immer bei \(y=0\) gezeichnet, auch
  wenn 0 außerhalb des Wertebereichs lag (dann stand sie unterhalb des Plots).
  Jetzt: 0 im Bereich → Abszisse am Nulldurchgang; sonst am unteren Rand
  (CLAUDE.md „Abszisse am Nulldurchgang").

## [1.1.2] — 2026-07-08
### Behoben
- **B7 — Regler zu kurz (Korrektur der v1.1.0-Variante):** Die v1.1.0-Umsetzung
  mit fester 3-Spalten-Zelle (120 px Label · 1fr · 72 px Wert) ließ in der
280-px-Sidebar nur ~36 px für den Regler — genauso kurz wie zuvor. Auf das
  **kanonische Muster** (vgl. Freier Fall) umgestellt: Label eigene Zeile
  drüber (`.slider-label`), darunter `.slider-row` (`grid 1fr auto`) =
  Regler (füllt) + Wert (auto) → Regler ~180 px breit, alle untereinander
  gleich lang. `#vr_control_wrapper` umschließt Label+Reglerzeile der v_r-
  Zeile, sodaß `display:none` im Kreis-Modus die ganze Zeile entfernt.

## [1.1.1] — 2026-07-08
### Behoben
- **B11 — α-Formelbox hinkte hinterher:** Die Umschaltung der Physik-Formelbox
  (gleichförmig ↔ ungleichförmig) wertete `store.alpha_rad` aus, das erst
  *nach* dem Umschalt-Block gesetzt wurde → die Box reagierte immer einen
  α-Wert verspätet. Nutzt jetzt den frisch gelesenen `alphaDeg`.

## [1.1.0] — 2026-07-08
### Neu / Behoben (6 Kreis-Spiral-Punkte → BACKLOG B7–B11, FX6)
- **B7 — Bewegungsparameter-Layout:** Kanonisches Muster (Label drüber,
  Regler + Wert darunter) statt 3-Spalten-Zelle; `display:none` auf der
  ganzen `v_r`-Zeile (Kreis-Modus) entfernt Label+Regler gemeinsam — das
  bisherige Verschieben ist behoben. *(v1.1.0 noch mit zu schmaler 3-Spalten-
  Variante; in v1.1.2 auf vollbreite Regler korrigiert.)*
- **B8 — Visualisierung-Anordnung:** `.vis-control` ist jetzt Flex mit
  linksbündigem Label (min-width 84 px) und vollbreitem, lesbarer Dropdown
  (`font-size .82rem`, padding angepaßt). Betrifft Ansicht/Modus/Szenario/
  Winkeleinheit/Diagramm/Anordnung einheitlich.
- **FX6 — Anordnung Sim/Diagramm:** Umschalter „untereinander / nebeneinander"
  (`#layout_mode_select`) in der Diagramme-Sektion. Nebeneinander schaltet
  `.center-area` auf `grid-template-columns: 1fr 1fr` (mit Trennlinie rechts);
  der Graph bekommt Portrait-Geometrie (`graphGeom()`, 460×560/280), um die
  hohe schmale Zelle auszufüllen. Wechsel ist reiner Redraw (kein Reset).
- **B9 — Dynamische Achseneinteilung:** Ordinante nutzt `niceStepLE(range,
  minDivs)` (1-2-4-5-Serie, ≥4 Teilstriche dual / ≥6 single) statt der
  1-2-5-`getNiceTickStep`-Variante; schließt die Lücke zwischen 2 und 5.
- **B10 — Diagramm-Flächenausnutzung:** Plot-Breite/-Höhe und viewBox werden
  aus der layout-abhängigen Geometrie berechnet (Portrait im Seitenmodus),
  `applyGraphLayout()` setzt viewBox + Gruppe-2-Transform pro Zeichnung.
- **B11 — Physik-Analyse-Tab:** Dritte statische MathJax-Variante
  `#formulas_kreis_acc` für Kreis mit \(\alpha\neq0\) (\(\varphi(t)\) mit
  \(\tfrac12\alpha t^2\), Tangentialbeschl. \(a_t=R|\alpha|\),
  \(|\vec a|=R\sqrt{\omega^4+\alpha^2}\)). Umschaltung reagiert live auf den
  \(\alpha\)-Regler (gleichförmig ↔ ungleichförmig), kein Laufzeit-Typeset.

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