# Changelog – Freier Fall / Senkrechter Wurf

## v2.2.5 — 2026-07-07
### Refaktoriert (T6 — einheitliches fmt() via shared/js)
- **Lokale `fmt()`-Definition durch Import aus `shared/js/format.js` ersetzt**
  (in `render.js` re-exportiert). **Neu:** `Number.isFinite`-Guard → '—' statt
  bisherigem 'NaN'-String (latenter Bugfix; Freier Fall hatte keinen Guard).
  Komma-Dezimal unverändert — keine sichtbare Änderung im Normalbetrieb.

## v2.2.4 — 2026-07-05
### Geändert (UI-Konsistenz)
- **Topbar-Buttonleiste (kanonisch):** Play/Pause/Reset aus der linken Sidebar in die Topbar (`topbar-right`) verschoben — immer erreichbar. Reihenfolge: Theme-Toggle · ▶ Play · ⏸ Pause · ↺ Reset · Diagramm (CSV) · Alle Daten (CSV). Alte `btn-row`-Sektion links entfernt.
- **Datenexport in Topbar:** Beide Export-Buttons aus rechter Sidebar in Topbar verschoben. Rechte „Datenexport"-Sektion entfernt. Wiring unverändert (DOM-IDs beibehalten).

## v2.2.3 — 2026-07-03
### Behoben (Fixed)
- **Dark-Mode-Persistenz vereinheitlicht:** Theme-Key `ff_theme` → `fh_theme` (CLAUDE.md-Konvention). Der Dark Mode bleibt jetzt beim Navigieren Übersicht↔Sim erhalten und startet in jeder Sim im zuletzt gewählten Modus.

## v2.2.2 — 2026-07-03
### Geändert (UX)
- **Default eingeklappt:** Die rechte Live-Analyse startet nun eingeklappt (44-px-Schiene); die Simulations-/Diagrammfläche hat beim Laden maximal Platz. Aufklappen per Klick auf den Panel-Header. Body ist eingeklappt off-screen positioniert (`position:fixed; left:-10000px`) statt `display:none`, damit MathJax die Formeln im Hintergrund trotzdem typesetten kann.

## v2.2.1 — 2026-07-03
### Geändert (UX)
- **Klapp-Button überarbeitet:** Topbar-Toggle mit irreführendem Einzelpfeil entfernt. Steuerung sitzt jetzt als Header direkt am rechten Panel (Nähe → klarer Bezug). Double-Chevron-Icon (»/«) statt Navigationspfeil, rotiert beim Zustandswechsel. Eingeklappt bleibt ein 44-px-Schienen-Streifen mit vertikalem „Analyse"-Label sichtbar — offensichtlich, dass das Panel existiert und wieder aufklappbar ist. `aria-expanded`/`aria-controls`, Fokus-Ring.

## v2.2.0 — 2026-07-03
### Hinzugefügt (Feature)
- **Einklappbare Live-Analyse:** Toggle-Button „Analyse" in der Topbar blendet die komplette rechte Sidebar (Live-Analyse, Fallkennwerte, Datenexport, Physik) ein/aus. Eingeklappt gibt das Panel seine Grid-Spalte frei, die Simulation/das Diagramm wird breiter. Chevron-Indikator wechselt zwischen ► (eingeklappt möglich) und ◄ (ausgeklappt möglich), plus `aria-expanded`/`aria-controls` für Barrierefreiheit.

## v2.1.10 — 2026-07-03
### Behoben (Fixed)
- **Back-Button:** Übersicht-Link nach Move des Übersichtsordners an den Repo-Root korrigiert (`../Standalone%20Proto/AllAnimations/…` → `../AllAnimations/…`).

## v2.1.9 — 2026-06-15
**Bugfix: t-Achse mindestens 3 Marken + Titel klar über weißem Bereich**

- Graphtitel: `y="-8"` → `y="-22"` (group-relativ) — liegt jetzt klar oberhalb des weißen Hintergrunds (rect startet bei y=-15)
- t-Achse: `getNiceTick(tMax,6)` → `tAxisStep(tMax)` — garantiert ≥3 Zeitmarken außer 0 (war bei bestimmten t_max-Werten nur 2)

## v2.1.8 — 2026-06-15
**Bugfix: Graphtitel-Z-Order**

- `<text id="graph_title">` ans Ende des SVG verschoben (nach Polyline + Circle) — Titel liegt jetzt immer im Vordergrund, nicht mehr hinter der Graphlinie

## v2.1.7 — 2026-06-15
**Bugfix: Diagrammtitel-Position**

- Graphtitel nach oben verschoben: `y=18` → `y=5` (analog Atwood-Positionierung oberhalb des Plotbereichs)

## v2.1.6 — 2026-06-15
**Feature: Diagramm-Überschriften**

- Diagrammtitel jetzt sichtbar: `<text id="graph_title">` in SVG-DOM nach `<g id="grid_group">` verschoben — weiße graph-bg Rect hat den Titel davor verdeckt (Z-Order-Bug)
- `setGraphTitle()` zu render.js hinzugefügt (analog Atwood): letztes Wort kursiv
- Titel zeigen physikalisches Symbol kursiv: „Weg-Zeit *y(t)*", „Geschw.-Zeit *v(t)*", „Beschl.-Zeit *a(t)*"; bei Ursprung=Start: „Weg-Zeit *s(t)*"

## v2.1.5 — 2026-06-15
**Bugfix: Vektoren + Physikformeln + Sidebar-Breite**

- Sidebar-Breite korrigiert: `255px` → `280px` (Play/Pause/Reset passen nun in eine Zeile, Legende sieht wie bei Atwood aus)
- Vektoren standardmäßig aktiviert (`checked` auf beiden Toggles) und sichtbar bereits bei Programmstart/Reset — `updateScene(0, h0, v0, -G)` in `resetSim()` ersetzt explizites Hide und setzt Stoppuhr + Vektoren korrekt
- Physikformeln: alle 4 Varianten werden per `MathJax.typesetPromise` vorgerendert (auch die initial versteckten), danach show/hide — löst MathJax-Rendering-Lücke für `display:none`-Elemente

## v2.1.4 — 2026-06-15
**Feature: Legende Vektoren**

- Neue Sektion „Legende Vektoren" in der linken Sidebar (nach „Visualisierung")
- Farbige Swatches für Geschwindigkeit (`--c-vel`) und Beschleunigung (`--c-acc`) mit MathJax-Labels \(\vec{v}\) / \(\vec{a}\)
- CSS-Klassen `.legend-grid`, `.legend-swatch`, `.legend-label` ergänzt (analog Atwood-Maschine)

## v2.1.3 — 2026-06-15
**Bugfix: Physikformeln zuverlässig sichtbar**

- Dynamisches `innerHTML` + `MathJax.typesetPromise()` durch statisches HTML ersetzt: alle 4 Formel-Varianten stehen fest im DOM, MathJax rendert sie beim Seitenstart
- JS (render.js `updatePhysicsFormulas()`) macht nur noch show/hide per `style.display` — kein MathJax-Aufruf mehr zur Laufzeit nötig
- `DOM.physicsFormulas` aus state.js entfernt (nicht mehr verwendet)

## v2.1.2 — 2026-06-15
**Bugfix: Physikformeln + Export-Position**

- Physikformeln im Physik-Block werden jetzt korrekt gerendert: MathJax-Timing-Problem behoben (`startup.promise.then(typesetPromise)` als Fallback wenn MathJax noch lädt)
- Datenexport-Buttons in die rechte Sidebar verschoben (nach „Fallkennwerte", vor „Physik") — gleiche Position wie bei der Atwood-Maschine für Wiedererkennbarkeit

## v2.1.1 — 2026-06-15
**Feature: Adaptive Physikformeln + t-Achse**

- Kinematische Gleichungen im Physik-Block dynamisch — passen sich der Achsenauswahl an:
  - `direction='up', origin='ground'`: `y(t) = h₀ + v₀t − ½gt²`, `a = −g`
  - `direction='up', origin='start'`: `s(t) = v₀t − ½gt²`, `a = −g`
  - `direction='down', origin='ground'`: `y(t) = −h₀ − v₀t + ½gt²`, `a = +g`
  - `direction='down', origin='start'`: `s(t) = −v₀t + ½gt²`, `a = +g`
  - `t_fall` und `|v_imp|` bleiben immer gleich (physikalische Größen)
  - MathJax wird per `typesetPromise()` bei jeder Konfigurationsänderung neu gerendert
- t-Achse Graph: adaptiver Takt via `getNiceTick()` statt fixer 10-Teilung — korrekte Anzahl Nachkommastellen (1–3) je nach Wertebereich

## v2.1.0 — 2026-06-15
**Feature: Datenexport (CSV)**

- Neue Sektion „Datenexport" in der linken Sidebar mit zwei Buttons:
  - **Diagramm (CSV)**: exportiert nur die aktuell angezeigte Größe (y, v oder a) vs. t
  - **Alle Daten (CSV)**: exportiert alle 4 Spalten (t, y/s, v, a)
- Format: Semikolon-Trenner, Komma als Dezimaltrennzeichen, `sep=;`-Kopfzeile
- Spaltentitel folgen der `Größe / Einheit`-Konvention; bei Weg-Ursprung „start" wird `s / m` statt `y / m` verwendet
- Daten entsprechen der eingestellten Achsenrichtung (getDisplayY/V/A bereits in store.y_data etc.)
- CSS: `.btn.small` ergänzt; state.js: DOM-Cache für beide Export-Buttons

## v2.0.7 — 2026-06-15
**PO-Review-Korrekturen VI**

- Physikalische Größen korrekt kursiv:
  - Zeitlabel: `<i>t</i> = 0,00 s` (HTML innerHTML)
  - Achsenbeschriftung und y-Achsen-Display: setAxisLabel() (war bereits v2.0.6)

## v2.0.6 — 2026-06-15
**PO-Review-Korrekturen V**

- Achsenbeschriftung: physikalische Größe kursiv (italic tspan), Einheit aufrecht — via setAxisLabel()
- Achsenlabels auf Kurzform vereinfacht: `t / s`, `y / m`, `s / m`, `v / (m/s)`, `a / (m/s²)` (Konvention: Physik. Größe / Einheit)
- Titel-Label im y-Achsen-Display ebenfalls italic

## v2.0.5 — 2026-06-15
**Konsistenz-Anpassung**

- Linke Seitenleiste auf 280px verbreitert (wie Atwood-Maschine v2.0.7)

## v2.0.4 — 2026-06-15
**PO-Review-Korrekturen IV**

- SVG-Z-Order: `#ground-line` nach `#building` verschoben — Bodenlinie liegt nun über dem Gebäude-Rect

## v2.0.3 — 2026-06-15
**PO-Review-Korrekturen III**

- Diagramm-Zeichenfläche um 15px nach rechts und oben erweitert (10px Luft nach Pfeilspitze)
- Icons ↺ und ⏸ auf 1,8-fache Größe skaliert
- Auftreffgeschwindigkeit berücksichtigt jetzt Vorzeichen der Achsenrichtung (`getDisplayV` statt `Math.abs`)

## v2.0.2 — 2026-06-15
**PO-Review-Korrekturen II**

- MathJax-Subscripts mit Text-Abkürzungen in `\text{}` gewrapped (`t_{\text{fall}}`, `y_{\text{max}}`, `v_{\text{imp}}`)
- Icons ↺ und ⏸ in Buttons auf 1,8-fache Größe skaliert

## v2.0.1 — 2026-06-15
**PO-Review-Korrekturen I**

- SVG-Hintergrundrect (`#anim-bg`) entfernt — Simulation transparent auf Seiten-BG
- Reset-Button aus Header in `btn-row` neben Play/Pause verschoben

## v2.0.0 — 2026-06-12
**Migration auf modulare 6-Datei-Architektur (Sprint 2)**

- Aufgeteilt in: index.html, css/styles.css, js/(constants|state|physics|render|ui).js
- FH Aachen Corporate Design: Mint #00B1AC, DM Sans, JetBrains Mono
- Dark/Light-Mode mit localStorage-Persistenz
- 3-Spalten-Layout: Sidebar | Simulation | Analyse
- Live-Analyse-Panel: t, y(t), v(t), a – Echtzeit-Update
- Fallkennwerte-Panel: t_fall, y_max, v_impact
- MathJax-Formeln im Analyse-Panel
- Speed Pills für Abspielgeschwindigkeit (1×, ½×, ¼×, ⅛×)
- Toggle-Switches für Geschwindigkeits- und Beschleunigungsvektor
- SVG-Farben vollständig über CSS Custom Properties (Dark-Mode-kompatibel)
- In AllAnimations/index.html integriert (Kap. 1.1)

## v1.x — 2025 (Standalone-Prototyp)
Ursprünglicher Standalone-Prototyp in `freier_fall_senkrechter_wurf.html`.
Single-file, altes Design (#005eb1, system-ui), kein Dark Mode.
