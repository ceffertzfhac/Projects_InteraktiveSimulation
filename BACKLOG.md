# Projekt-Backlog: Interaktive Physik-Simulationen

Stand: 2026-07-04 | Priorisierung: MoSCoW (ausstehend)

---

## KONVENTIONEN

Diese Datei ist der **einzige zentrale Tracker** projektorweit für Bugs,
technische Schulden, Features und Migrationen. Pro Simulation pflegt nur
noch `docs/CHANGELOG.md` (shipped-Versionen) plus optionale
`docs/KNOWN_LIMITATIONS.md` (bewußte lokale Einschränkungen / Won't /
Scope-Entscheidungen, mit `→ <ID>`-Verweis auf hier).

**ID-Präfixe:** `B#` Bugs · `T#` Technische Schulden · `F<sim>#` sim-spezifische
Features · `I#` Infrastruktur & repo-weite Querschnitts-Features · `S#`
Standalone-Integration · `N#` Neue Simulationen · `M#` Migrationen · `W#`
Werkzeug-Schale · `R#` Rollout.

**Sim-Feature-Präfixe:** `FL` Lorentzkraft · `FR` Rollende Körper · `FA` Atwood · `FAE` Atwood-Energie
· `FF` Freier Fall · `FP` Federpendel · `F3` 3-Massen-Umlenkrollen · `FK`
Kreisbewegung · `FX` Kreis-/Spiralbewegung · `FW` Schräger Wurf · `FZ` Zykloide.

**Status-Marker:** `✅` erledigt (Originaltext in `~~Durchstreich~~` erhalten);
sonst *offen*. **Prio-Spalte** (MoSCoW): Must / Should / Could / Won't.

**Entry-Point-Regel:** Ein eingehender Bug-Report wird **immer** als neue `B#`
in `## BUGS` angelegt — nie nur in einer per-Sim-Datei. Features/Tech-Schulden
likewise zentral. Per-Sim `KNOWN_LIMITATIONS.md` verweist bei Bedarf mit
`→ B#`/`→ F#`/`→ I#`/`→ T#` auf den zentralen Eintrag.

---

## BUGS

| ID | Status | Titel | Projekt | Prio | Beschreibung |
|----|--------|-------|---------|------|--------------|
| B1 | ✅ | RHO_CU-Duplikat in ui.js | Lorentzkraft | — | **Erledigt (Session 2026-07-07):** `RHO_CU` in `ui.js` jetzt aus `constants.js` importiert statt als Magic Number `0.0178` hartkodiert (Zeile ~26, geschätzter Strom im Spannungsmodus zur Federhärte-Limit-Berechnung). `physics.js` nutzte die Konstante bereits korrekt — Slider-Limit und Physik laufen nicht mehr auseinander, wenn `RHO_CU` künftig geändert wird. Lorentz v1.5.6 → v1.5.7. Rein interne Konsistenz, keine Optikänderung. ~~ Ursprünglich: `0.0178` hart hineinkopiert statt importiert. ~~ |
| B2 | ✅ | SP-Spur unsichtbar | Rollende Körper | — | **Verifiziert — kein Code-Defekt (Session 2026-07-07):** Spur-Code (`render.js:146-177`) ist korrekt: `#traces_g` liegt als Kind von `#world_g` nach `#cylinder_g` (Spur über dem Zylinder), kein CSS blendet es aus, `clip-path` nur auf `vectors_g`/`forces_g` (nicht auf `traces_g`), `physToScreen`+`sp_y=R_m` ergeben stimmige Geometrie, `activeSubjects` enthält `'sp'` per Default. Eintrag vom 2026-07-04 ist veraltet (vor dem v2.0.7-`render.js`-Split). `tog_sp_trace` ist per Default **aus** (bewusst — Bahnkurven sind kein Vektor-Toggle i. S. der „standardmäßig sichtbar"-Konvention; Punktspuren analog). Bei eingeschaltetem Toggle wird die magenta SP-Bahn sichtbar gezeichnet. Kein Fix nötig. ~~ Ursprünglich: Schwerpunktspur trotz korrekter Implementierung nicht sichtbar (vermutlich Clipping/Z-Index). ~~ |
| B3 | ✅ | Timing-Sprung bei Pause→Play | Rollende Körper | — | **Verifiziert — Code seit jeher korrekt (Session 2026-07-07):** `startAnim()` (`ui.js:338`) setzt `state.store.lastTs = 0`; `animate()` (`ui.js:352`) guardiert `if (!state.store.lastTs) state.store.lastTs = now` → erste `dt = 0` beim Resume → kein `simTime`-Sprung. Code unverändert seit „Stunde Null". Backlog-Eintrag war übervorsichtig/veraltet. Kein Fix nötig. ~~ Ursprünglich: `lastTs` wird beim Pausieren nicht zurückgesetzt → großer Sprung nach Resume. ~~ |
| B4 | offen | Manuelle Zeitmessung: Pause→Play-Versatz | Federpendel | Should | Bei laufender manueller Zeitmessung und Pause→Play setzt Play `lastFrameTime=0`; der erste Frame danach macht einen (auf 0,1 s begrenzten) `deltaTime`-Sprung, die Sim-Zeit wird um die Pausendauer nicht korrekt versetzt. Pausen-Handling sauberer abbilden. *(aus `Project_federpendel_simulation/docs/issues.md`, migriert 2026-07-08)* |
| B5 | offen | Vertikaler Modus bei großer Masse — Skalierung | Federpendel | Could | Bei \(m=5{,}0\) kg und kleinem \(k\) wird \(\delta L=mg/k\) sehr groß; die Gleichgewichtslage kann in den unteren Animationsbereich rutschen und die Schwingung ragt knapp an den Rand. Skalierung prüfen. *(aus `Project_federpendel_simulation/docs/issues.md`, migriert 2026-07-08)* |
| B6 | ✅ erledigt (v1.2.4) | m₃-Default 1,1 kg vs. Anzeige „2,1 kg" — Abnahme offen | 3-Massen-Umlenkrollen | Should | **Erledigt (Session 2026-07-08, PO-Abnahme):** PO entschied den `m₃`-Default auf **1,2 kg** (statt Prototyp-Verhalten 1,1 kg oder suggeriertem 2,1 kg) — Gleichgewichtswinkel liegen sauber in der SVG-Szene. Geändert: `M3_DEFAULT` (`constants.js`), `store.m3` (`state.js`), `m3_slider`-`value` + statischer Anzeigetext (`index.html`). 3-Massen v1.2.3 → v1.2.4. ~~ Ursprünglich: v2-Prototyp trug `value="1.1"` bei stalem Display „2.1 kg"; Migration hatte 1,1 kg übernommen, wartete auf PO-Abnahme. ~~ *(aus `Project_3massen_umlenkrollen_simulation/docs/issues.md`, migriert 2026-07-08)* |
| B7 | ✅ erledigt (v1.1.0) | Regler-/Beschriftungs-Layout der Bewegungsparameter | Kreis-/Spiralbewegung | Should | Darstellung/Raumaufteilung der Regler und Beschriftungen der Bewegungsparameter überarbeiten: einige Beschriftungen nicht sichtbar; Regler nicht untereinander, unterschiedlich lang und sehr kurz — insgesamt unschön/unprofessionell. *(PO-Meldung 2026-07-08)* — behoben: jeder Parameter eigenständige `.param-row`, `display:none` der ganzen `v_r`-Zeile entfernt alle Zellen gemeinsam. |
| B8 | ✅ erledigt (v1.1.0) | Visualisierung-Sektion + Dropdown-Lesbarkeit | Kreis-/Spiralbewegung | Should | Bei „Visualisierung" Ansicht linksbündig ausrichten; Dropdown so gestalten, daß die Auswahl lesbar ist. *(PO-Meldung 2026-07-08)* — behoben: `.vis-control` Flex, Label linksbündig, Dropdown vollbreit + lesbar. |
| B9 | ✅ erledigt (v1.1.0) | Dynamische Achseneinteilung der Diagramme | Kreis-/Spiralbewegung | Should | Achseneinteilung soll sich dynamisch anpassen, analog zu anderen Simulationen, die das schon umsetzen (`niceStepLE`/`tAxisStep`). *(PO-Meldung 2026-07-08)* — behoben: Ordinate nutzt `niceStepLE` (1-2-4-5-Serie, ≥4/≥6 Teilstriche). |
| B10 | ✅ erledigt (v1.1.0) | Diagramm-Flächenausnutzung | Kreis-/Spiralbewegung | Should | Diagramme sollen die zur Verfügung stehende Fläche gut — aber optisch ansprechend — ausnutzen. *(PO-Meldung 2026-07-08)* — behoben: layout-abhängige `graphGeom()` (Portrait im Seitenmodus), `applyGraphLayout()`. |
| B11 | ✅ erledigt (v1.1.0) | Physik-Analyse-Tab dünn / reagiert nicht auf α | Kreis-/Spiralbewegung | Should | Der „Physik"-Teil der Analyse ist noch sehr dünn und reagiert nicht auf Anpassungen (z. B. α=0 vs. α≠0) — muß angepaßt werden. *(PO-Meldung 2026-07-08)* — behoben: dritte statische MathJax-Variante `formulas_kreis_acc`, live α-abhängige Umschaltung. |
| B12 | ✅ erledigt (v1.1.10) | Physik-Block im Analyse-Panel nicht voll les-/sichtbar | Kreis-/Spiralbewegung | Should | Im schmalen 270-px-Analyse-Panel ragen längere Display-Formeln (z. B. Coriolis-Zerlegung \(\vec a=-R\omega^2\hat e_r+R\alpha\hat e_t-2v_r\omega\hat e_t\), \(\lvert\vec a\rvert=R\sqrt{\omega^4+\alpha^2}\)) als festbreite MathJax-SVG über den rechten Rand und werden vom `.panel{overflow-x:hidden}` abgeschnitten → nicht sichtbar. *(PO-Meldung 2026-07-08)* — behoben: per-Sim-`.formula-box`-Override (kanonisch vgl. 3massen, dasselbe 270-px-Panel/gleicher SVG-Output): kleinere Schrift (0,72 rem) + `overflow-x:auto` als Scroll-Sicherheit statt Abschneiden; Display-Math linksbündig, damit bei Überlauf der Anfang erreichbar bleibt. |
| B13 | ✅ erledigt (v1.2.2) | Massive Rolle dreht in falsche Richtung | Atwood-Energie | Should | **(PO-Meldung 2026-07-10)** Die Rollen-Rotationsmarkierung (v1.2.0 „massive Rolle") drehte entgegengesetzt zur Physik. **Ursache (`render.js`):** `s_m = y1_start − y1_m` mit Kommentar „Verschiebung m1 (fällt ⇒ >0)". `y1_m` ist aber die **Apertur-Koordinate** (Abstand von der Rolle, wächst beim Fallen — vgl. `Y_MAX_CM - y1_m*CM_PER_M` = Höhe vom Boden). Somit war `s_m = start − aktuell` **negativ** beim Fallen, entgegen dem Kommentar. Daraus `phiDeg < 0` und `rotate(-phiDeg)` → positiver SVG-Winkel → **CW auf dem Bildschirm**. Physikalisch dreht die Rolle bei fallendem m₁ (linkes Seil unten) aber **CCW**. **Erledigt (v1.2.2):** `s_m = y1_m - y1_start` (aktuell − start) → `s_m > 0` beim Fallen wie dokumentiert, `rotate(-phiDeg)` ergibt korrekt CCW. Version `index.html`/`docs/CHANGELOG.md` synchron auf v1.2.2. |
| B14 | ✅ erledigt (Atwood-Energie v1.2.10, Atwood v2.2.4) | v₁/v₂/a₁/a₂ invertiertes Vorzeichen gegenüber y₁/y₂ | Atwood-Energie, Atwood | Must | **(kritische Physik-Review 2026-07-10)** `y1_data`/`y2_data` sind kanonisch als „Höhe vom Boden" gespeichert (wächst beim Steigen). `v1_data`/`a1_data` (`physics.js`) wurden dagegen direkt aus der **Apertur-Koordinate** übernommen (positiv wenn m₁ **fällt**), ohne die Umrechnung, die `yrel1_data`/`yrel2_data` bereits korrekt anwenden. Folge: Live-Panel, „v"/„a"-Diagramme und CSV-Export zeigten bei fallendem m₁ (y₁ sinkt) ein **positives, wachsendes** v₁ statt negativ — Ableitungsbeziehung dy/dt=v verletzt. Numerisch verifiziert (m₁=6/m₂=4 kg): y₁ 250,000→249,564 cm, v₁ zeigte +0,131 statt −0,131 m/s. Gleiche Vorzeichenverwechslung wie B13, dort gefixt, hier nicht. Identisches Pattern in beiden Atwood-Sims (gemeinsame Herkunft der Szene/Physik). **Erledigt:** in **beiden** Projekten `physics.js` `v1_data.push(-v)`/`v2_data.push(v)`/`a1_data.push(-accel)`/`a2_data.push(accel)`; `render.js` Live-Panel `liveA1`/`liveA2` (nutzte `accel` direkt statt Array) ebenfalls getauscht. Energieberechnung (quadriert v, nur Atwood-Energie) unverändert korrekt, Erhaltung weiterhin exakt (Drift ~1e-14). Versionen: Atwood-Energie v1.2.9→v1.2.10, Atwood v2.2.3→v2.2.4. |
| B15 | ✅ erledigt (v1.2.11) | „Energie (E_kin, E_pot, E_ges)"-Diagramm ignoriert Subjekt | Atwood-Energie | Must | **(PO-Meldung 2026-07-10)** Im Modus „Zwei Diagramme" mit Diagramm 1 = Subjekt „Nur m₁" und Diagramm 2 = Subjekt „Nur m₂" sahen beide Diagramme (Typ „Energie E_kin/E_pot/E_ges") **exakt gleich** aus, obwohl m₁ und m₂ völlig unterschiedliche Massen hatten (1 kg vs. 10 kg). **Ursache (`render.js`):** `GRAPH_CFG.ecomposite.lines` war `lines: () => […]` — plottete unabhängig vom übergebenen `subject` immer die System-Summen `ek_sum`/`ep_sum`/`etot`. Die Einzeltypen `ekin`/`epot`/`eges` waren nicht betroffen (nutzten bereits `sub =>`). **Erledigt (v1.2.11):** `ecomposite.lines` wählt jetzt wie die Einzeltypen `ek1/ep1/eges1` (m₁), `ek2/ep2/eges2` (m₂) bzw. `ek_sum/ep_sum/etot` (System). Zusätzlich Diagrammtitel aller vier Energie-Typen (`ecomposite`/`ekin`/`epot`/`eges`) subjektabhängig gemacht (zeigten vorher generischen Titel unabhängig vom Subjekt). Numerisch verifiziert (m₁=1 kg/m₂=10 kg): Diagramm 1 `E_kin≈1,75 J`, Diagramm 2 `E_kin≈17,54 J` statt zuvor identisch `≈19,29 J`. |
| B16 | ✅ erledigt (v1.2.12) | E_pot-Nulllinie m₂ doppelt beschriftet (links + rechts) | Atwood-Energie | Should | **(PO-Meldung 2026-07-10)** Die Nulllinie der rechten Masse (m₂) zeigte die Beschriftung „E_pot = 0" **zweimal** — einmal links und einmal rechts der gestrichelten Linie; nur rechts ist korrekt (die Linie liegt bei m₂-Höhe, links ist redundant/irreführend). **Ursache:** `drawZeroLines` (`render.js`, seit FAE7) zeichnete das Links-Label immer, unabhängig vom `right`-Flag, und ergänzte bei `right:true` zusätzlich ein Rechts-Label. **Erledigt (v1.2.12):** Links- und Rechts-Label sind jetzt exklusiv — bei `right:true` (m₂-Nulllinie in `separate`/`y2`-Modus) nur rechts, sonst nur links wie ursprünglich. |
| B17 | ✅ erledigt (v1.2.14) | E_pot-Nulllinie bei „Decke"-Modus hinter Blende verschwunden | Atwood-Energie | Should | **(PO-Meldung 2026-07-10)** Bei `epZeroMode = 'decke'` (Nullpunkt = oberes Ende) war die Nulllinie unsichtbar. **Ursache:** `zero_lines_group` stand im SVG (`index.html`) **vor** `aperture_path` (Blenden-Grafik, deckende Füllung `--aperture-fill`); die Nulllinie liegt in diesem Modus exakt auf Höhe der Blendenunterkante (SVG-y=107,5) und wurde von der später gezeichneten, deckenden Blende überdeckt. **Erledigt (v1.2.14):** `zero_lines_group` im Markup hinter `aperture_path` verschoben — rein deklarative Dokumentreihenfolge, keine JS-Änderung. |
| B18 | ✅ erledigt (v1.2.15) | Massen-Beschriftung nahe der Blende verschwindet dahinter | Atwood-Energie | Should | **(PO-Meldung 2026-07-10)** Fährt eine Masse nach oben bis fast an den Anschlag, verschwindet ihre Beschriftung (teilweise) hinter der Blende. **Ursache:** gleiches Muster wie B17 — `mass1_group`/`mass2_group` standen im SVG vor `aperture_path` (deckende Füllung). Da das Label 20 px über/unter die Box hinausragt (FAE4), reicht es am oberen Anschlag in den Blenden-Bereich hinein und wurde überdeckt (v. a. bei kleinen Massen). **Erledigt (v1.2.15):** `mass1_group`/`mass2_group` + Kraftvektoren + Reibungspfeil im Markup hinter `aperture_path` verschoben — Massen (inkl. Label und Vektoren) liegen jetzt immer sichtbar vor der Blende. |
| B19 | ✅ erledigt (v1.2.5) | Ball/Bahn/Vektoren bei hohen/steilen Würfen hinter Stoppuhr verdeckt | Schräger Wurf | Should | **(kritische Physik-Review 2026-07-10, I10)** Gleiches Muster wie B17/B18: `#stopwatch_circle` (deckende Füllung `--surface`) stand im SVG **nach** Flugbahn/Ball/Vektoren. Die auto-skalierte Wurfparabel kann durch denselben Bildschirmbereich wie die Stoppuhr (Zentrum ≈(250,47) px, r≈43 px) laufen. Rastersuche über \(h_0\)/\(v_0\)/α bestätigt: z. B. \(h_0=2{,}8\) m, \(v_0=22\) m/s, α=82,5° führt die Bahn bis auf 5 px an das Stoppuhr-Zentrum (weit innerhalb r≈43 px) — Ball/Vektoren wären für einen Teil des Flugs unsichtbar. **Erledigt (v1.2.5):** Stoppuhr-Gruppe im Markup vor `trajectory_line`/`ball`/Vektoren verschoben. |
| B20 | ✅ erledigt (v1.4.1) | Punkt/Bahn/Vektoren bei weiten Spiralradien hinter Stoppuhr verdeckt | Kreis-/Spiralbewegung | Must | **(kritische Physik-Review 2026-07-10, I10)** Gleiches Muster wie B17–B19, aber mit **Standardparametern** reproduzierbar: `#stopwatch_circle` stand im SVG nach Bahn/Vektoren/Punkt; die Zoom-Anpassung basiert nur auf `R0`, nicht auf dem im Spiralmodus wachsenden Radius. Numerisch verifiziert (\(R_0=1{,}5\) m, \(\omega_0=60\) °/s, \(v_r=1{,}0\) m/s, alles Standard-/Reglerbereich): Punkt kommt bei \(t≈1{,}15\) s bis auf 8 px an das Stoppuhr-Zentrum heran (r≈43 px) — komplett unsichtbar. **Erledigt (v1.4.1):** Stoppuhr-Gruppe im Markup vor `trajectory_path`/Vektoren/`point` verschoben. |

---

## TECHNISCHE SCHULDEN / REFACTORING

| ID | Titel | Projekt | Beschreibung |
|----|-------|---------|--------------|
| T1 | ✅ render.js aufteilen | Rollende Körper | **Erledigt (Session 2026-07-07):** `render.js` (1068 Zeilen) in 5 thematische Dateien aufgeteilt — `render-core.js` (gemeinsame Helfer: fmt/svgEl/physToScreen/shortenEnd/…), `render-scene.js` (Viewport/Hintergrund/Koordinatensystem/Zylinder/Stoppuhr), `render-vectors.js` (v/a/F-Vektoren + Legende), `render-analysis.js` (Live-Analyse/Renn-Bars/Vergleichsliste/Vergleichskörper), `render-graph.js` (Transform + updateGraph). `render.js` ist jetzt Aggregator: re-exportiert alle 24 öffentlichen Exporte (sodaß `import * as render` in `ui.js`/`main.js` unverändert greift) und enthält nur noch `updateScene` + privaten `douglasPeucker`. Zyklenfreier Graph: `render.js` → 4 Submodule → `render-core`/`constants`/`state`/`physics`. `shortenEnd` (bisher modul-privat) jetzt exportiert (shared von scene+vectors). Verhalten unverändert — verifiziert via `node --check` (alle 6 Dateien) + Diff der Funktionskörper (eindeutige Zeilen) Original-vs-Neu = leer. Rolling v2.0.7. ~~ Ursprünglich: monolithische render.js in thematische Teilmodule zerlegen. ~~ |
| T2 | ✅ Redundante Projektkopie entfernen | Repo | **Erledigt (Session 2026-07-07):** `Standalone Proto/rolling_bodies_simulation/` (modulare Vollkopie + `legacy_archive/zykloide v5/v6`) aus dem Repo-Baum entfernt. Die `legacy_archive/`-Dateien waren bytidentisch redundant (erhalten in `Project_rolling_bodies_simulation/legacy_archive/` **und** `Standalone Proto/Rollbewegung Schiefe Ebene/`). **Konservativ:** nicht gelöscht, sondern ins lokale, gitignore-te `_temp_archiv/` verschoben — endgültige Löschung erst nach Projekt-Abnahme + PO-Bestätigung (s. `_temp_archiv/README.md`). ~~ Ursprünglich: vollständige Kopie — Überbleibsel der Migration. ~~ |
| T3 | ✅ AGENTS.md und README.md aktualisieren | Repo | **Erledigt (Session 2026-07-07):** Beide neu geschrieben auf die aktuelle Repo-Struktur (9 `Project_*`-Sims, `AllAnimations/`, `Standalone Proto/`, `shared/`, `global_docs/`), veraltete Namen (`zykloide_schiefe_ebene/`, `lorentz_force_simulation/`, v1.0.0/v1.6.0) entfernt. AGENTS.md verweist auf CLAUDE.md als kanonische Quelle. ~~ Ursprünglich: referenzierten noch alte Verzeichnisnamen. ~~ |
| T4 | ✅ GEMINI.md aufräumen | Repo | **Erledigt (Session 2026-07-07):** `global_docs/GEMINI.md` war **nicht** „nahezu identisch" mit `CLAUDE.md` (Backlog-Beschreibung ungenau), sondern eine kleinere, rollende-Körper-spezifische, veraltete Doppelspur mit Fehlern („Syne"-Font — inzwischen abgeschafft; Behauptung `index.html` ließe sich per `file://` öffnen — ES-Module scheitern an CORS). Klar abgegrenzt: `GEMINI.md` ist jetzt eine dünne Zeiger-Datei analog `AGENTS.md` — identifiziert sich als Gemini-Assistenten-Kontext, verweist auf `CLAUDE.md` als kanonische Quelle und `BACKLOG.md` für Status/Aufgaben, dokumentiert die Konsolidierung. Keine eigene Inhaltsspur mehr → keine Drift. ~~ Ursprünglich: inhaltlich nahezu identisch mit CLAUDE.md — konsolidieren oder abgrenzen. ~~ |
| T6 | ✅ Einheitliche `fmt()`-Funktion | Beide | **Erledigt (Session 2026-07-07):** Repo-weit eine gemeinsame, robuste `fmt(value, decimals=2)` in `shared/js/format.js` (Komma-Dezimal via `toFixed().replace('.', ',')`, `Number.isFinite`-Guard → '—'). Alle 9 modularen Sims importieren sie statt einer lokalen Definition; die 7 Sims, die `fmt` in `ui.js` nutzen (Atwood, Zykloide, Freier Fall, Schräger Wurf, Rolling sowie Federpendel + Kreisbewegung via mehrzeiliger Import), re-exportieren sie aus `render.js`. **Regressions-Fix (gleiche Session):** Federpendel (v1.0.11→v1.0.12) und Kreisbewegung (v1.0.9→v1.0.10) waren zunächst dysfunktional, weil ihr mehrzeiliger `fmt`-Import in `ui.js` übersehen und das `export { fmt }` in `render.js` weggelassen worden war — nachgetragen. **Sichtbare Änderungen (bewußt):** Lorentz verlor den Tausenderpunkt (früher `toLocaleString`, z. B. „1.000,00 A" → „1000,00 A"; nur Slider-Maxima Strom 1000 A / Abstand 1000 mm); Rolling-Fallback '···' → '—' (Randfall) und 4 bare-Aufrufe bekommen explizit `, 3` (Default 3→2 sonst Präzisionsverlust). Atwood/Freier Fall/Lorentz bekamen den bisher fehlenden NaN-Guard (latenter Bugfix). Rollings `fmtTech` (Punkt-Dezimal, SVG-Attribute) und `fmtE` (Energie, ' J'-Suffix) bleiben Rolling-spezifisch lokal. ~~ Ursprünglich: Projekt 1 nutzt `toLocaleString('de-DE')`, Projekt 2 `toFixed().replace()`. Projekt 2 ist robuster (NaN-Check). Angleichen. ~~ |
| T7 | ✅ Magic Numbers in render.js | Lorentzkraft | **Erledigt (Session 2026-07-07):** Feder-Helix-Parameter (Windungen, Radius, Drahtbreite, Hook-Länge, Sample-Schritte, Layer-Strichbreiten/Farben) aus `render.js` in neues `SPRING`-Objekt in `constants.js` ausgelagert. Keine Verhaltensänderung (v1.5.5). ~~ Ursprünglich: Feder-Parameter hardcodiert. ~~ |
| T8 | ✅ Combining-Pfeil-Vektorlabels repo-weit angleichen | Alle (v/a/F-Sims) | **Erledigt (Session 2026-07-07):** PO-Entscheid — nur **bestehende** Labels angleichen, keine neuen an label-lose Sims. Rollende Körper (v2.0.4) + Lorentz (v1.5.4) auf `F⃗`+Index (Serif-Italic, `stroke:none`, Werte bewußt entfernt) gebracht; `--font-serif` in shared CSS zentralisiert. Nachbesserungen: Rolling v2.0.5 (Kräfte-Beträge im Analyse-Tab), 3-Massen v1.2.0 (Winkel α zur Horizontalen in Grafik + Analyse). 6 label-lose Sims (Freier Fall, Schräger Wurf, Zykloide, Atwood, Federpendel, Kreisbewegung) bewußt unangetastet — separates Feature. ~~ Ursprünglich: 3-Massen (v1.0.7+) setzt Vektor-Labels als Symbol mit Combining-Arrow U+20D7 (`F⃗`) in Serif-Italic + `stroke:none` (kein Faux-Bold, s. CLAUDE.md „SVG-Text-Labels nie stroke-tragende vec-Klasse"). Andere Sims beschriften ihre v/a/F-Vektoren uneinheitlich. Nur die Label-Notation angleichen — Pfeilspitzen-Geometrie (`refX=0`+`shortenEnd`) war bereits repo-weit gefixt (Session 2026-07-06). ~~ |
| T9 | `shared/js`-Helper konsolidieren | Alle (modular) | **Should** — `setAxisLabel`/`setGraphTitle`/`shortenEnd`/`tAxisStep`/`niceStepLE` bisher pro Sim lokal gehalten; in ein gemeinsames `shared/js/`-Modul überführen (I2-Folge). Reduziert Drift zwischen den Sims und vereinfacht künftige Migrationen. *(aus `Project_kreis_spiralbewegung_simulation/docs/FEATURE_BACKLOG.md`, migriert 2026-07-08)* |

---

## FEATURES

Einheitliche Tabelle aller sim-spezifischen Feature-Wünsche (Prefix `F<sim>#`).
Repo-weite Querschnitts-Features (Hover, PNG/SVG-Export, Energie-Diagramm) →
`## INFRASTRUKTUR & REPOSITORY` (`I5`/`I6`/`I7`), dort referenziert.

| ID | Projekt | Prio | Titel | Beschreibung |
|----|---------|------|-------|--------------|
| FL1 | Lorentzkraft | Should | Dynamische Einschwingung | Gedämpfte Schwingung beim Ein-/Ausschalten des Stroms (DGL 2. Ordnung lösen). Aktuell springt der Leiter sofort ins Gleichgewicht. Didaktisch der wichtigste fehlende Aspekt. |
| FL2 | Lorentzkraft | Should | Magnetfeld-Visualisierung | B-Feld-Linien/-vektoren zwischen den Leitern, physikalisch korrekt am Ort des betroffenen Leiters (war früher implementiert, dann entfernt). |
| FL3 | Lorentzkraft | Could | Kraft-Abstands-Diagramm | Interaktives Diagramm: F_L(d) und F_s(d) gemeinsam; Schnittpunkte markieren die Gleichgewichtslagen (stabil/instabil). |
| FL4 | Lorentzkraft | Could | Massenträgheit berücksichtigen | Eigengewicht des hängenden Leiters in die Ausgangslage einrechnen (aktuell vernachlässigt). |
| FL5 | Lorentzkraft | Could | Material-Auswahl | Verschiedene Leiter-Materialien (Kupfer, Aluminium, Gold) mit unterschiedlichem ρ. |
| FL6 | Lorentzkraft | Could | 3D / Iso-Darstellung | Umstellung der SVG-Grafik auf eine isometrische Ansicht für räumliches Verständnis der parallelen Leiteranordnung. |
| FL7 | Lorentzkraft | Could | Stromrichtung-Toggle | Umschalten der Stromrichtung in einem Leiter → Abstoßung und Federstauchung sichtbar machen. |
| FR1 | Rollende Körper | Should | Ghosting / Snapshots | Verblasste Körperkopien in festen Zeitintervallen (z. B. alle 0,5 s) zur visuellen Darstellung der Beschleunigung. |
| FR2 | Rollende Körper | — | ~~Interaktive Diagramme (Hover)~~ | → **I5** (retired; repo-weites Querschnitts-Feature). |
| FR3 | Rollende Körper | Could | Benutzerdefinierter k-Faktor | Texteingabe für beliebigen k-Wert, um experimentell die Rolle des Trägheitsmoments zu untersuchen. |
| FR4 | Rollende Körper | Could | Mehrere Rampenabschnitte | Simulation mehrerer aufeinanderfolgender Strecken (z. B. schiefe Ebene → horizontal → schiefe Ebene). |
| FR5 | Rollende Körper | Could | Dynamische Reibung / Gleiten | Übergang Haftreibung → Gleitreibung visualisieren, wenn die Rollbedingung manuell unterschritten wird. |
| FR6 | Rollende Körper | — | ~~Diagramm-Export (PNG/SVG)~~ | → **I6** (retired; repo-weites Querschnitts-Feature). |
| FR7 | Rollende Körper | Could | Exzentrischer Schwerpunkt | Körper mit ungleichmäßiger Massenverteilung (exzentrischer SP) simulieren. |
| FR8 | Rollende Körper | Won't | 3D-Visualisierung | Portierung auf Three.js für eine echte 3D-Ansicht der rollenden Körper (langfristig). |
| FR9 | Rollende Körper | Could | Vergleichsmodus-Erweiterung | Mehr als 5 Vergleichskörper gleichzeitig; automatisches „Ranking-Tableau" nach Zieleinlauf. |
| FA1 | Atwood | Could | Anfangsgeschwindigkeit v₀ | Massenstart mit vorgegebener Startgeschwindigkeit. |
| FA2 | Atwood | Could | Reibung | Lager-/Seilreibung als optionaler Slider (Dämpfung). |
| FA3 | Atwood | Could | Phase II / Nachprall | Weiterführung der Simulation nach Kollision (elastisch/inelastisch). |
| FA4 | Atwood | Should | Startpositionsgrenzen von Atwood-Energie übernehmen | `y1_slider`/`y2_slider` `min`/`max` (aktuell 70/330) auf die in Atwood-Energie korrigierten Werte 40/320 angleichen (→ FAE1/FAE6: bei max. Masse keine Kollision mit Boden/Oberkante). Diff-Modus-Klammer (falls vorhanden) analog anpassen. *(PO-Wunsch 2026-07-10)* |
| FA5 | Atwood | Should | \(F_G\)/\(F_{\text{ges}}\) je Masse in „Physik (konstant)" anzeigen | Die Live-Werte-Box „Physik (konstant)" zeigt aktuell nur \(a_1\), \(a_2\), \(F_S\). Zusätzlich \(F_{G,1}\), \(F_{G,2}\) (Schwerkraft je Masse, \(m_i g\)) und \(F_{\text{ges},1}\), \(F_{\text{ges},2}\) (resultierende Kraft je Masse, \(m_i a\)) ergänzen — analog zu den bereits vorhandenen SVG-Kraftvektoren/-Toggles („Kräfte \(F_G,F_S\)"/„Resultierende \(F_{\text{ges}}\)") in `index.html`, aber bisher nicht als Zahlenwert im Panel. *(PO-Wunsch 2026-07-10)* |
| FAE1 | ✅ erledigt (v1.2.3) · Atwood-Energie | Should | Startposition-Minimum 40 cm | Startpositions-Slider (y₁, y₂) unten von 70 cm auf 40 cm erweitern; diff-Modus-Klammer in `ui.js` ebenfalls anpassen. *(PO-Wunsch 2026-07-10)* — erledigt: `y1_slider`/`y2_slider` `min` 70→40 (`index.html`), Diff-Modus-Klammer `Math.max(40, …)` (`ui.js`). Bei max. 10 kg (Halbhöhe 27,5 cm) bleibt der Massenboden 12,5 cm über dem Boden. |
| FAE2 | ✅ erledigt (v1.2.3) · Atwood-Energie | Should | Rollenmasse-Maximum 2 kg | Rollenmassen-Slider oben von 1 kg auf 2 kg erweitern. *(PO-Wunsch 2026-07-10)* — erledigt: `pulley_mass_slider` `max` 1→2 (`index.html`). Physik ohne harte Obergrenze, unverändert. |
| FAE3 | ✅ erledigt (v1.2.3) · Atwood-Energie | Should | Reibungspfeil-Toggle bei \(F_R=0\) deaktivieren | Solange die Reibungskraft 0 ist, soll der „Reibungspfeil \(F_R\)"-Visualisierungs-Toggle samt Beschriftung ausgegraut und nicht aktivierbar sein (Pfeil ist ohnehin unsichtbar bei \(F_R=0\)). *(PO-Wunsch 2026-07-10)* — erledigt: `updateFrictionArrowToggle()` in `ui.js` (aufgerufen in `resetSim`) setzt `togFrictionArrow.disabled` + `.is-disabled`-Klasse auf Zeile `friction_arrow_row`; CSS `.vis-toggle-row.is-disabled` (Deckkraft 0,4, `cursor:not-allowed`) in `styles.css`. `checked`-Zustand bleibt erhalten → bei erneutem \(F_R>0\) greift die bisherige Wahl wieder. |
| FAE4 | ✅ erledigt (v1.2.4) · Atwood-Energie | Should | Massen-Label-Verschiebung (m₁ +20 px, m₂ −20 px) | Label der Masse \(m_1\) konstant 20 px nach unten, Label \(m_2\) konstant 20 px nach oben verschieben. *(PO-Wunsch 2026-07-10)* — erledigt: `render.js` `mass1Label` y `m1_hpx + 20`, `mass2Label` y `m2_hpx - 20`. |
| FAE5 | ✅ erledigt (v1.2.4) · Atwood-Energie | Should | Rolle als eigenes Balken-Objekt (1 Zeile) | Im Energie-Balkendiagramm eine eigene „Rolle"-Gruppe (analog „Masse \(m_1\)" / „Masse \(m_2\)") mit einer Zeile \(E_{\text{rot}}\) anlegen; \(E_{\text{rot}}\) dazu aus der „Gesamtsystem"-Gruppe herauslösen. *(PO-Wunsch 2026-07-10)* — erledigt: neue `ebar-group-label` „Rolle" + `ek_rot`-Zeile zwischen \(m_2\)- und Gesamtsystem-Gruppe; `ek_rot` aus Gesamtsystem entfernt (Label „\(E_{\text{rot}}\) (Rolle)" → „\(E_{\text{rot}}\)"). Bar-Update `data-key`-basiert → gruppenunabhängig. Gesamtsystem jetzt 4 Zeilen. |
| FAE6 | ✅ erledigt (v1.2.4) · Atwood-Energie | Should | max. Starthöhe korrigieren (keine Oberkanten-Kollision bei max. Masse) | Maximale Starthöhe so korrigieren, daß bei maximaler Masse (10 kg, Halbhöhe 27,5 cm) keine Kollision mit der Oberkante (350 cm) auftritt: Slider-`max` 330 → 320 (320 + 27,5 = 347,5 < 350). *(PO-Wunsch 2026-07-10)* — erledigt: `y1_slider`/`y2_slider` `max` 330→320 (`index.html`), Diff-Modus-Klammer `Math.min(320, …)` (`ui.js`). |
| FAE7 | ✅ erledigt (v1.2.5) · Atwood-Energie | Should | E_pot-Nulllinie der rechten Masse auch rechts beschriften | Die Nulllinie der potentiellen Energie der rechten Masse (\(m_2\)) soll zusätzlich auf der rechten Seite mit „E_pot = 0" beschriftet werden (bisher nur links). *(PO-Wunsch 2026-07-10)* — erledigt: `drawZeroLines` (`render.js`) arbeitet mit `{h, right}`-Objekten; `right:true` für \(m_2\)-Linie im `separate`-Modus (2. Linie) und `y2`-Modus → zusätzliches Label bei `x2 + 2`, `text-anchor:start`. Linksseitige Labels bleiben. |
| FAE8 | ✅ erledigt (v1.2.6) · Atwood-Energie | Should | Physik-Box auf Energiebetrachtung umstellen + Umbruch-Sicherheit | Die „Physik"-Box im Analyse-Panel ist übervoll. Seilkräfte (\(F_{S,1}/F_{S,2}\)) und Beschleunigung (\(a\)-Formel + Haftreibung) entfernen; Box auf reine Energiebetrachtung umstellen (Trägheitsmoment, \(E_{\text{kin}}/E_{\text{rot}}/E_{\text{pot}}/E_{\text{ges}}\), Reibungsarbeit, Energieerhaltung). Lange kombinierte Formeln (`\quad`) je auf eigene Zeile brechen, damit nichts aus dem 270-px-Panel herausragt (Panel `overflow-x:hidden` schneidet sonst ab); zusätzlich `overflow-x:auto` auf `.formula-box` als Sicherheit. *(PO-Wunsch 2026-07-10)* — erledigt: Beschleunigung + Seilkräfte entfernt; jede Formel eigene Zeile (`index.html`); `.formula-box { overflow-x: auto }` (`styles.css`). |
| FAE9 | ✅ erledigt (v1.2.7) · Atwood-Energie | Should | Diagrammsteuerung in den Center über das \(E_{\text{pot}}\)-Dropdown | Die Diagrammsteuerung (Modus-Pills Energie-Balken/Ein/Zwei + Diagramm-/Subjekt-Dropdowns) aus dem linken Sidebar in den Center-Bereich (`graph-wrapper`) ziehen, als neue Steuerleiste direkt über dem \(E_{\text{pot}}\)-Nullpunkt-Dropdown (`energy-zero-bar`) — immer sichtbar, nah am gesteuerten Diagramm. *(PO-Wunsch 2026-07-10, auf Branch ausprobiert)* — erledigt: „Diagramme"-Sektion aus Sidebar entfernt; neue `.diagram-controls-bar` als erstes Kind von `.graph-wrapper` vor `energy-zero-bar`; IDs/`name="diagram_mode"` erhalten → JS unverändert; `.diagram-opt`-Paare; CSS `.diagram-controls-bar`/`.diagram-line-opts`/`#graph_sel2_group`/`.diagram-opt` in `styles.css`. |
| FAE10 | ✅ erledigt (v1.2.7) · Atwood-Energie | Should | Zwei-Diagramme-Selects als konsistente 2×2-Einheit | Bei „Zwei Diagramme" sollen die 4 Dropdowns (Diagramm 1/2, Subjekt 1/2) als konsistente 2×2-Steuerheinheit stehen — exakt untereinander, gleich breit. *(PO-Wunsch 2026-07-10)* — erledigt: `.diagram-line-opts` + `#graph_sel2_group` von Flex auf CSS-Grid `1fr 1fr` umgestellt; `#graph_sel2_group` mit `grid-column:1/-1` spannt beide Spalten und ist intern 2-spaltig → D2 unter D1, S2 unter S1, gleiche Spaltenbreiten. |
| FAE11 | ✅ erledigt (v1.2.7) · Atwood-Energie | Won't (vorerst) | Layout-Umschalter ausgeblendet — nur Nebeneinander sinnvoll | In dieser Simulation macht nur das nebeneinander-Layout Sinn; der Umschalter-Button (Nebeneinander/Übereinander) wird ausgeblendet. Button + JS bleiben erhalten (null-sicher geguarded) zum Reaktivieren. *(PO-Wunsch 2026-07-10)* — erledigt: Button `#layout_toggle` in `index.html` auskommentiert (HTML-Kommentar); `applyLayout()` + Click-Listener in `ui.js` mit `if (DOM.layoutToggle)` geguarded; Init zwingt `layoutSplit=true` (Nebeneinander), savedLayout-Auswertung auskommentiert. |
| FAE12 | ✅ erledigt (v1.2.8) · Atwood-Energie | Should | \(E_{\text{pot}}\)-Nullpunkt-Dropdown in die Startpositionen verschieben | Das Dropdown für den Nullpunkt der potentiellen Energie aus dem Center (`energy-zero-bar` über der Energiebilanz) in den linken Block „Startpositionen" verschieben (thematisch bei den Höhen-Controls). *(PO-Wunsch 2026-07-10, experimentell erprobt, behalten)* — erledigt: `ep_zero_select` als `.slider-label`+`.select-field` ans Ende der Startpositionen-Sektion (`index.html`); `.energy-zero-bar` aus dem `graph-wrapper` entfernt + tote CSS-Regel in `styles.css` aufgeräumt. JS ID-basiert unverändert. |
| FAE13 | ✅ erledigt (v1.2.9) · Atwood-Energie | Should | Abszissenbreite der Diagramme ~20 % erhöhen | Die Abszissenbreite (Zeitachse) der Diagramme um ungefähr 20 % erhöhen, um den zur Verfügung stehenden Platz effizienter zu nutzen. *(PO-Wunsch 2026-07-10)* — erledigt: `LAND_W` 700→840, `PORT_W` 492→590 in `constants.js` (+20 % der Diagrammbreite; da Margins `P.left/P.right` fix, wächst die Abszisse `PLOT_W` sogar etwas überproportional). `graph_svg` skaliert via `xMidYMid meet` + `width:100%` → breiteres Portrait-`viewBox` füllt mehr horizontalen Platz aus. |
| FAE14 | ✅ erledigt (v1.2.13) · Atwood-Energie | Should | E_pot-Nulllinien im separate-Modus mit Index 1/2 beschriften | Bei zwei getrennten E_pot-Nullpunkten (je Masse eigene Starthöhe, `separate`-Modus) sollen die Nulllinien-Labels einen Index tragen, um sie eindeutig zuzuordnen — nicht nur über links/rechts unterscheidbar. *(PO-Wunsch 2026-07-10, im Zuge von B16)* — erledigt: `drawZeroLines` (`render.js`) trägt Linien jetzt mit `subj: 1\|2\|null`; im `separate`-Modus „E_pot,1 = 0" (m₁, links) / „E_pot,2 = 0" (m₂, rechts); in `y1`/`y2`/`boden`/`decke`-Modus bleibt „E_pot = 0" ohne Index (eine Referenzhöhe gilt dort für beide Massen). |
| FP1 | Federpendel | Should | Dämpfung | Dämpfungskoeffizient \(c\) (viskos) → gedämpfte Schwingung \(x(t)=x_0\,e^{-\delta t}\cos(\omega t)\), \(\delta=c/(2m)\); aperiodischer Grenzfall als Sonderfall. Neuer Slider + Hüllkurve im Diagramm. |
| FP2 | Federpendel | Should | Erzwungene Schwingung | Sinusförmige äußere Kraft einstellbarer Frequenz, Resonanzkurve, Phasenverschiebung. |
| FP3 | Federpendel | Could | Phasenraum-Diagramm | \(v\) gegen \(x\) (Ellipse bei ungedämpfter Schwingung) als weiterer Diagrammtyp. |
| FP4 | Federpendel | Could | Zwei Feder-Masse-Systeme nebeneinander | Vergleich unterschiedlicher \(k\)/\(m\)-Kombinationen in einer Szene. |
| F31 | 3-Massen-Umlenkrollen | Could | Werte-Export (CSV) | Einzelner Gleichgewichts-Datensatz (T1, T3, Winkel, Kraftkomponenten, Gleichgewichtsstatus) als CSV — aktuell kein Export (keine Zeitreihe, analog Lorentz). Bei Bedarf als „Werte (CSV)" in der Topbar. |
| F32 | 3-Massen-Umlenkrollen | Could | Kräftedreieck als Nebenansicht | Grafische Darstellung des Kräftedreiecks (T1, T3, Fg2) neben der Szene, um den Cosinus-Satz didaktisch zu belegen. |
| F33 | 3-Massen-Umlenkrollen | Could | Reibung / massebehaftetes Seil | Erweiterung über die ideales-Seil-Annahme (derzeit als Hinweis in der Sidebar dokumentiert). |
| FK1 | Kreisbewegung | Should | Geschwindigkeits-Regler-Richtung | Bei negativer \(\omega\) dreht sich die Masse gegen den Uhrzeigersinn — im Live-Panel klarmachen, daß \(\lvert\omega\rvert\) die Umlaufgeschwindigkeit ist und das Vorzeichen die Richtung. |
| FK2 | Kreisbewegung | Could | Vergleichsbahn / zweite Kreisbahn | Mit abweichendem \(R\) zum direkten Vergleich (analog Schräger-Wurf-Vergleichsbahn → FW2). |
| FK3 | Kreisbewegung | Could | Umlaufzähler | Wie viele Umläufe absolviert seit Start (\(\varphi/360°\)). |
| FK4 | Kreisbewegung | Could | Zentripetalkraft-Layer | \(F_Z = m\,\lvert\vec a\rvert\) als optionale Vektorgröße (zusätzliche Masse-Parameter nötig). |
| FK5 | Kreisbewegung | Could | \(\omega\) als rad/s im UI | Neben °/s auch rad/s anzeigen. |
| FX1 | ✅ erledigt (v1.2.1) · ~~Kreis-/Spiralbewegung~~ | Should | Okabe-Ito-Farbpalette | Vektorfarben (aktuell Violett/Orange/Grün aus der Quelldatei) auf farbblinden-sichere Okabe-Ito-Tokens angleichen (CLAUDE.md empfiehlt shared `--c-vel`/`--c-acc`). Beziehung zu Komponenten-Farben klären. *(Session 2026-07-08)* — umgesetzt: `--c-v`→`var(--c-vel)`, `--c-a`→`var(--c-acc)` (shared, deckungsgleich mit Kreisbewegung); `--c-r`→Bernstein, `--c-traj`→Grau (wie Kreisbewegung, Mint bleibt `ω` allein); `--c-alpha` Rot→Mauve `#cc79a7`, `--c-phi`→Blaugrün `#009e73` (Okabe); `--c-point` Rot→`--text` (löst Rot-Kollision a/α/Partikel). Komponenten-Vektoren erben weiter die Elternfarbe (Strichmuster x/y/r/t) — „Komponente = Elternfarbe" bewusst. Alle Farben über lokale Tokens, eine Stelle (`css/styles.css`). |
| FX2 | Kreis-/Spiralbewegung | Should | Kanonische Atwood-Subdial | Stoppuhr um Subdial (cy=25, r=13, 10 Marken, 1 U/s) ergänzen — Quelldatei hat nur Hauptzeiger. |
| FX3 | Kreis-/Spiralbewegung | Could | Polar-Zerlegung in ISO-Ansicht | Aktuell nur in 2D (in ISO deaktiviert). |
| FX4 | Kreis-/Spiralbewegung | Could | Weitere Szenarien-Presets | z. B. Spirale innen, gleichförmig mit \(\varphi_0\neq0\). |
| FX5 | Kreis-/Spiralbewegung | Should | nStop-Obergrenze dokumentieren oder cappen | Bei großen \(n\cdot90°\) kann das Auto-Stopp-Ziel jenseits des 120 s-Precompute-Horizonts liegen. |
| FX6 | ✅ erledigt (v1.1.0) · ~~Kreis-/Spiralbewegung~~ | Could | Umschalter Simulation/Diagramm nebeneinander/untereinander | Layout-Umschalter zwischen „Sim + Diagramm nebeneinander" und „untereinander" (vgl. Schräger-Wurf/Freier-Fall Single-vs-Stacked-Graph). *(PO-Wunsch 2026-07-08)* — umgesetzt als `#layout_mode_select` in der Diagramme-Sektion; Portrait-Graph-Geometrie im Seitenmodus. |
| FX7 | ✅ erledigt (v1.2.0) · ~~Kreis-/Spiralbewegung~~ | Should | Kartesische Komponenten \(v_x,v_y,a_x,a_y\) + \(\alpha(t)\) im Physik-Block | Die Physik-Formelbox zeigte nur \(x,y,\lvert\vec v\rvert,\lvert\vec a\rvert\) (Kreis) bzw. polare \(\vec v,\vec a\) (Spirale). *(PO-Wunsch 2026-07-08, nach B12-Pannel-Verbreiterung)* — ergänzt: \(v_x(t),v_y(t),a_x(t),a_y(t)\) (kartesisch, exakt wie `physics.js` berechnet, inkl. Coriolis-Term in der Spirale) sowie \(\alpha(t)\) in allen drei Varianten. Statisches MathJax (kein Laufzeit-Typeset); Überlauf via B12-Scroll-Sicherheit. |
| FW1 | Schräger Wurf | Could | Luftwiderstand-Modell | Stokes/Newton-Drag als optionaler Schalter — aktuell reine Vakuumkinematik. Didaktisch wertvoll für Realitätsvergleich. |
| FW2 | Schräger Wurf | Could | Vergleichende Würfe (mehrere Bahnen) | ~~Mehrere Flugbahnen gleichzeitig~~ **Teilweise ✅ (v1.2.0):** eine Vergleichsbahn läßt sich über den Umschalter „Vergleichsbahn" einfrieren und live vergleichen. Offen: ≥2 gespeicherte Referenzen + Vergleichsbahn auch im Bahnkurven-Diagramm \(y(x)\) als zweite Linie (aktuell nur Szenen-Overlay). |
| FW3 | Schräger Wurf | Could | Optimalwinkel-Anzeige | Numerisch berechneter \(\alpha_{\text{opt}}\) für maximale Reichweite bei gegebenem \(h_0\), \(v_0\) — bei \(h_0>0\) liegt er unter 45°. |
| FW4 | Schräger Wurf | Could | Höhenlinie / Reichweitenmarker | Markierung von \(x_{\text{max}}\) und \(y_{\text{max}}\) in der Szene. |
| FW5 | Schräger Wurf | Could | \(g\) als Regler | Erdbeschleunigung einstellbar (Mond/Mars/Venus) — aktuell fest 9,8. |
| FW6 | Schräger Wurf | Could | \(g=9{,}81\) angleichen | An Freier-Fall/Atwood-Standard anpassen (aktuell 9,8 für v47-Parität). Entscheidung didaktisch. |
| FW7 | Schräger Wurf | Could | Stoppuhr an Atwood-Standard | LCD-Easteregg ggf. als eigene Umschaltung im Panel statt Klick-auf-Uhr. |
| FZ1 | Zykloide | Could | Punktradius als Regler | \(r/R\) einstellbar (aktuell fest 0,9) — Übergang Zykloide (\(r=R\)) über Trochoiden zur Geraden (\(r=0\), SP). |
| FZ2 | Zykloide | Could | Gleiten mit Schlupf | \(\omega \neq v_c/R\) entkoppeln — Rollen vs. Gleiten vergleichbar machen. |
| FZ3 | Zykloide | Could | Vergleich mit reiner Zykloide | Sonderfall \(r=R\) als Referenzbahn einblendbar (Punkt auf der Lauffläche). |
| FZ4 | Zykloide | Could | Winkel \(\varphi(t)\) als Diagrammgröße | Zusätzlich zu x/y/v/a auch den Drehwinkel selbst anbieten. |
| FZ5 | Zykloide | Could | Einzelne Subjekt-CSVs | Export nur des ausgewählten Subjekts statt immer alle 5×8. |
| FZ6 | Zykloide | Could | Vektor-Skalierung adaptiv | `V_VECTOR_SCALE`/`A_VECTOR_SCALE` aktuell fest 50 — bei kleinen/großen \(v_c\) ggf. auto-fit. |
| FZ7 | Zykloide | Could | Kamera-Trigger sichtbar | Optionale Markierung des Kamera-Follow-Startpunkts. |
| FAG1 | ✅ erledigt (v1.1.0) · Ableitung/Grenzwert | Should | Umschaltbare Werte im Diagramm | Drei unabhängige Schalter („Werte im Diagramm"), ob \(\Delta x/\Delta y\), Sekantensteigung \(m_s\) und Tangentensteigung in der Simulationsumgebung angezeigt werden. *(PO-Wunsch 2026-07-08)* — Δx/Δy am Steigungsdreieck (Toggle, nur bei sichtbarem Dreieck); \(m_s\)/Tangentensteigung als Readout oben links im Plot, **unabhängig** von der Linien-Sichtbarkeit toggelbar; Werte zusätzlich weiterhin im Analyse-Panel. Dynamische Labels via `createStyledSvgText` (Symbol kursiv, eigene nicht-stroke-tragende Klasse). |
| FAG2 | ✅ erledigt (v1.2.0) · Ableitung/Grenzwert | Could | Kubisches Polynom als 4. Funktion | \(f(x)=0{,}02\,(x-12{,}5)^3-2\,(x-12{,}5)\), \(f'(x)=0{,}06\,(x-12{,}5)^2-2\). *(PO-Wunsch 2026-07-08)* — Wendepunkt bei \(x=12{,}5\), zwei Extrema (\(x\approx6{,}7/18{,}3\)) → Ableitung wechselt zweimal das Vorzeichen. Dropdown-Reihenfolge Gerade·Parabel·Kubisch·Komplex; statische MathJax-Varianten für Titel + Formelblock; Option automatisch aus `FUNCS`. |

**Hinweise zu Querschnitts-Features:** Hover-Werte mehrerer Sims → **I5**; PNG/SVG-Export → **I6**; Energie-Diagramm (Federpendel, Schräger Wurf, Zykloide) → **I7**; Atwood „Energiebilanz" via **M7** bzw. **I7**; Atwood „Vorschaubild" → **S3**.

---

## STANDALONE SIMULATIONEN — INTEGRATION & VERBESSERUNG

| ID | Titel | Simulation | Beschreibung |
|----|-------|-----------|--------------|
| S1 | Wellen-Simulation einpflegen | Interferenz zweier Punktquellen | Ist fertig implementiert (890 Zeilen), aber in keiner Index-Seite verlinkt. Kapitel "Wellen" fehlt in `AllAnimations/index.html` komplett. |
| S2 | ✅ Dark Mode für alle Standalone-Sims | Alle | **Erledigt (Sprint 3, R4–R6):** Alle 14 Standalone-Prototypen + Taschenrechner auf FH-Design-System umgestellt (shared-CSS-Link, Token-Mapping, Dark Mode via `body.dark`-Kaskade, Theme-Toggle mit einheitlichem `fh_theme`-localStorage-Key, Back-Button). |
| S3 | Vorschaubilder vervollständigen | AllAnimations | Einige Karten haben noch kein Vorschaubild (Platzhalter "Vorschau"). |
| S4 | Taschenrechner einordnen | Taschenrechner | Ist kein Physik-Thema im eigentlichen Sinne. Entweder als Hilfsmittel in Index aufnehmen oder aus Standalone herauslösen. |

---

## NEUE SIMULATIONEN (Lehrplan-Lücken)

| ID | Titel | Kapitel | Beschreibung |
|----|-------|---------|--------------|
| N1 | Schiefe Ebene (Gleiten) | 1.2 | Reine Gleitreibung auf schiefer Ebene ohne Rollbewegung — einfacher Einstieg vor den rollenden Körpern. |
| N2 | Fadenpendel | 1.4 | Pendel mit großen Auslenkungen (numerisch, nicht nur harmonische Näherung), Periodenformel. |
| N3 | Zweidimensionaler Stoß | 1.8 | Aktuell gibt es nur den zentralen (1D) elastischen Stoß. Schiefer Stoß mit Impulserhaltung in x/y fehlt. |
| N4 | Elektrisches Feld / Kondensator | 2.x | Feldlinien, Äquipotentiallinien, Plattenkondensator. Kapitel Elektrostatik fehlt komplett. |
| N5 | Magnetfeld eines geraden Leiters | 2.x | Biot-Savart-Visualisierung — sinnvoller Vorläufer zur Lorentzkraft-Simulation. |
| N6 | Gedämpfte / erzwungene Schwingung | 1.x | Erweiterung der Federschwingung um Dämpfung und Resonanz. |

---

## INFRASTRUKTUR & REPOSITORY

| ID | Titel | Beschreibung |
|----|-------|--------------|
| I1 | GitHub Pages Deployment | Automatische Veröffentlichung der Simulationen bei Push auf `main` (GitHub Actions). Studenten könnten direkt über eine URL darauf zugreifen. |
| I2 | ✅ Shared Design-System | **Erledigt (Sprint 3, R0/R7):** `shared/css/design-system.css` an CLAUDE.md/FF-Referenz angleichen (Tokens, Okabe-Ito-Kraftfarben, Grid 280/1fr/270, Klapp-Sidebar-CSS). Alle modularen Sims (Atwood/Rolling/Lorentz) und die Übersicht linken shared; Standalones via `<link>` vor Inline-`<style>`. `shared/js/format.js` (fmt-Helper) inzwischen erledigt (T6); weiteres `shared/js/` (Math/SVG-Helper) weiterhin offen. |
| I3 | Unit-Tests für Physik-Module | Vitest-Setup für `physics.js` beider Projekte. Kernformeln (k-Faktor, Gleichgewicht, Precompute) testbar machen. |
| I4 | ✅ Blueprint um Werkzeug-Schale + Migrations-Workflow erweitern | **Erledigt (Sprint 4a):** `global_docs/simulation_instruction.md` um §7 „Werkzeug-Schale" (diagrammatische Werkzeuge, keine Sim-Controls) und §8 „Migrations-Workflow: Standalone → Modular" (Schritt-für-Schritt incl. Konsolidierungs-Prüfung) ergänzt. |
| I5 | Hover-Werte repo-weit | **Should** — Mouseover über SVG-Diagramm zeigt exakte Werte zum Zeitpunkt t; Cursor folgt der Kurve. Querschnitts-Feature, betrifft: Rollende Körper (~~FR2~~ retired), Schräger Wurf, Zykloide, Kreis-/Spiralbewegung. *(konsolidiert 2026-07-08 aus mehreren per-Sim FEATURE_BACKLOGs)* |
| I6 | PNG/SVG-Export repo-weit | **Could** — Diagramme als Bilddatei exportieren (ergänzt den bestehenden CSV-Export). Querschnitts-Feature, betrifft: Rollende Körper (~~FR6~~ retired), Schräger Wurf, Zykloide, Kreis-/Spiralbewegung. *(konsolidiert 2026-07-08)* |
| I7 | Energie-Diagramm repo-weit | **Could** — \(E_{\text{kin}}/E_{\text{pot}}/E_{\text{ges}}\) vs. Zeit als zusätzlicher Diagrammtyp (Energieerhaltung visualisieren). Querschnitts-Feature, betrifft: Federpendel, Schräger Wurf, Zykloide (Atwood via M7). *(konsolidiert 2026-07-08)* **Kanonische Energie-Farben** (`--c-ekin/-epot/-etot/-eloss`, Okabe-Ito) mit M7 in `shared/css/design-system.css` aufgenommen — bei I7-Rollout für die anderen Sims wiederverwenden. |
| I8 | Akkordeon-Steuerungs-Sidebar repo-weit | **Should** — Überlange linke Steuerungs-Sidebar: statt ganzer Sidebar einklappen, die thematischen `.panel-section`-Cluster einzeln ein-/ausklappbar machen (Akkordeon: `.panel-label`→Button+Chevron `▾`, Inhalt per `~ * { display:none !important }` verbergen). Dazu **Cluster-Prinzipien** (verwandte kleine Cluster zusammenlegen, Single-Control-Sektionen integrieren, Legende direkt nach Visualisierung, ~4–6 Cluster, default eingeklappt = selten Genutztes). **Kanonisch dokumentiert (2026-07-08):** CLAUDE.md (Kurzeintrag) + `global_docs/simulation_instruction.md` § „Akkordeon-Steuerungs-Sidebar" (volles HTML/CSS/JS-Rezept + Gotchas). **Prototyp erledigt (Kreis-/Spiralbewegung v1.3.0):** 6 Cluster, default eingeklappt = Modus & Szenarien + Abspielgeschwindigkeit & Auto-Stopp; Abspielgeschw.+Auto-Stopp zusammengeführt, Winkeleinheit→Diagramme; Chevrons 1,4 rem. **Offen — Rollout auf andere Sims** (linke Cluster-Zahl): rolling_bodies 7 (Should, am längsten) · atwood 5 (Should) · kreisbewegung 5 (Should, Schwester-Sim) · federpendel 5 (Should) · freier_fall 5 (Should) · schraeger_wurf 5 (Should) · zykloide 5 (Could) · ableitung 5 (Could) · lorentz 4 (Could, nur falls überlang) · 3massen 3 (Won't — kurz genug). Pro Sim Cluster-Prinzipien neu bewerten, nicht Kreis-Spiral-Zustände starr übernehmen. |
| I10 | ✅ erledigt (Session 2026-07-10) · Kritische Physik-Review repo-weit (Sim für Sim) | Die kritische Physik-Review von Atwood-Energie fand 5 reale Bugs (B14–B18) in einer bereits „fertig polierten" Sim: invertiertes v/a-Vorzeichen gegenüber der Höhen-Konvention, Diagrammtyp ignorierte das Subjekt, doppelte/verschwundene Beschriftungen durch falsche SVG-Zeichenreihenfolge. **Reihenfolge geprüft:** 1. Freier Fall/Senkrechter Wurf → 2. Schräger Wurf → 3. Zykloide → 4. Kreis-/Spiralbewegung → 5. Rollende Körper. Methodik je Sim: `physics.js`/`state.js`/`render.js` gelesen, Energie-/Kinematik-Formeln analytisch per Hand nachdifferenziert **und** numerisch verifiziert (Node-Testskripte gegen `precompute()`), Vorzeichenkonventionen gegen die Höhen-/Achsenkonvention gegengeprüft, SVG-Dokumentreihenfolge auf deckende Elemente vor beweglichen/beschrifteten Objekten geprüft (inkl. Rastersuche über Reglerbereiche, wo eine Kollision plausibel schien). **Ergebnis:** Freier Fall, Zykloide, Rollende Körper → **kein Bug gefunden** (Stoppuhr-Kollisionsrisiko bei Rollende Körper explizit per Rastersuche ausgeschlossen). Schräger Wurf → **B19**: Stoppuhr (deckende Füllung) vor Ball/Bahn/Vektoren im SVG, bei steilen/hohen Würfen (z. B. α=82,5°) komplett verdeckt. Kreis-/Spiralbewegung → **B20**: dasselbe Muster, aber mit **Standardparametern** reproduzierbar (Zoom richtet sich im Spiralmodus nicht nach dem wachsenden Radius) — Punkt nach ~1,15 s unsichtbar. Beide sofort behoben (Stoppuhr im Markup vor die dynamischen Elemente verschoben). **Erkenntnis:** das „deckendes SVG-Element nach dynamischem Inhalt"-Muster (B17–B20) betrifft **jede Sim mit Stoppuhr**, nicht nur Atwood — Ursache ist die feste Stoppuhr-Position kombiniert mit auto-skalierender/rotierender Bewegungsgeometrie. **Folge-Check (gleiche Session):** Kreisbewegung und Federpendel zusätzlich per Rastersuche geprüft (Punkt- **und** Vektor-Spitzenposition gegen Stoppuhr-Kreis, über den vollen Reglerbereich) — **beide sicher**: Kreisbewegung begrenzt den Kreisradius durch ein Zoom-Clamp (`usable = … − 40`) auf max. 185 px, deutlich unter der nötigen Kollisionsdistanz (~240 px); der Geschwindigkeitsvektor kommt im Extremfall auf 37 px heran (Stoppuhr-Radius 30 px), aber keine Überlappung. Federpendel plaziert die Stoppuhr in beiden Modi (horizontal/vertikal) mit ausreichendem Abstand zur maximalen Auslenkung (≥24 px bzw. ≥118 px Lücke); im kritischen horizontalen Fall fällt die Geschwindigkeit ohnehin gegen 0, wenn die Masse nahe der Stoppuhr ist (SHM-Amplitudenumkehr), sodaß auch Vektor-Spitzen nicht hineinreichen. Damit ist das Stoppuhr-Verdeckungsmuster (B17–B20) für alle 7 geprüften Sims mit Stoppuhr abschließend bewertet — 4 betroffen und gefixt (Atwood, Atwood-Energie, Schräger Wurf, Kreis-/Spiralbewegung), 4 von Haus aus sicher (Freier Fall, Rollende Körper, Kreisbewegung, Federpendel). *(PO-Wunsch 2026-07-10)* |
| I9 | ✅ Zwei-Diagramm-Anordnung orthogonal zur Sim/Diagramm-Aufteilung | **Erledigt (Session 2026-07-09):** Bei Sims mit Nebeneinander-/Übereinander-Layout-Umschalter **und** Zweier-Diagramm-Modus liegen die beiden Diagramme **orthogonal zur Sim/Diagramm-Aufteilung** — Nebeneinander-Layout → Diagramme rechts **übereinander** gestapelt; Übereinander-Layout → Diagramme unten **nebeneinander**. Mittellinie (Sim/Diagramm-Trenner, Grid-Partition) unangetastet, nur Anordnung *innerhalb* der Diagrammzelle. Grund: gestapelte Teilgraphen in breit-flacher Zelle werden sehr flach/unleserlich, nebeneinander in hoher Zelle winzig. **Kanonisch dokumentiert:** CLAUDE.md (Kurzeintrag) + `global_docs/simulation_instruction.md` § „Zwei-Diagramm-Anordnung orthogonal" (Tabelle + Rezept). **Umgesetzt:** Kreis-/Spiralbewegung v1.3.0→v1.4.0 (`graphGeom()` liefert `cellW`/`cellH` + `off2`; Landscape-Dual → X-Versatz, Portrait-Dual → Y-Versatz; `LAND_SLOT_DUAL` entfernt) + Kreisbewegung v1.0.10→v1.1.0 (`stackedDualGeom()`; `graphSlotH` + `GRAPH_H_STACKED_STACK` entfallen). **Betroffen waren nur diese beiden Sims** — sie sind die einzigen mit Layout-Umschalter; kein offener Rollout. **Für künftige Sims:** verbindlich, sobald eine Sim sowohl den Umschalter als auch einen Zweier-Diagramm-Modus erhält. |

---

## MIGRATION: STANDALONE → MODULAR

| ID | Titel | Versionen | Beschreibung |
|----|-------|-----------|--------------|
| M1 | ✅ Schräger Wurf migrieren | 47 | **Erledigt (Sprint 4b):** `Project_schraeger_wurf_simulation/` v1.0.0 — precompute + interpolateAt, volle Feature-Parität zum v47-Prototyp. Fehlabgelegtes `AllAnimations/schräger_wurf.html` (Rollender-Zylinder-Dup) gelöscht. Commit `8880539`. |
| M4 | ✅ Zykloide migrieren | zykloide3 | **Erledigt (Sprint 4b):** `Project_zykloide_simulation/` v1.0.0 — gleicher Scaffold wie M1, Trochoiden-Physik (ω=Vc/R, r=0,9·R), Kamera-Follow, 5 Subjekte × 8 Größen, CSV. `AllAnimations/zykloide3.html` gelöscht. Commit `2378737`. |
| M5 | ✅ Federpendel migrieren | federpendel | **Erledigt (Sprint 4e):** `Project_federpendel_simulation/` v1.0.0 — 6-Modul, precompute + interpolateAt, kanonische Topbar-Buttonleiste, einklappbare Sidebar, gestapeltes Center-Layout, statisches MathJax, CSV (sep=;). `AllAnimations/federpendel.html` + `Standalone Proto/Federpendel/` stillgelegt. |
| M6 | ✅ Kreisbewegung migrieren | kreisbewegung | **Erledigt (Session 2026-07-08):** `Project_kreisbewegung_simulation/` existiert bereits als vollständige modulare Sim (v1.0.0→v1.0.10, nutzt `--bg` direkt → Dark Mode funktioniert); AllAnimations-Karte zeigt schon darauf. Nur im Backlog nicht markiert gewesen. Orphan-Standalone `AllAnimations/kreisbewegung.html` (69 KB, ungelinkt) ins `Project_kreisbewegung_simulation/legacy_archive/` verschoben (konservativ, wie T2). Konsolidierungs-Check: `kreiskinematik_v5` ist thematisch ein eigenes didaktisches Werkzeug (nicht-uniforme Winkelkinematik + Spirale + 3D-Iso) → **separat** migriert als M6b, nicht in Kreisbewegung konsolidiert. ~~ Ursprünglich: kreisbewegung (+kreiskinematik_v5), Konsolidierung prüfen. ~~ |
| M6b | ✅ Kreiskinematik / Dreh-Spiralbewegung migrieren | kreiskinematik_v5 | **Erledigt (Session 2026-07-08, v1.0.0):** `Project_kreis_spiralbewegung_simulation/` — 6-Module-Scaffold nach M1/M4. Nicht-uniforme Winkelkinematik (α, v_r Spirale, Coriolis), 3D-Iso, kartesische + polare Vektorzerlegung, Auto-Stopp (analytische Quadrat-Lösung), 4 Presets, deg/rad, Ein-/Zwei-Diagramm-Modus, 13 Größen, CSV (14 Spalten). Dark Mode via shared Tokens direkt (kein `:root`-Remap). Statisches MathJax (R/R₀ + Formelbox als display-Varianten). Kanonische Pfeilspitzen (`refX=0`+`shortenEnd`), Graph-Konventionen (`setAxisLabel`/`setGraphTitle`, Abszisse bei y=0, bg-Rect). Festes 120 s-Precompute (statt extend-on-the-fly), Spiral-R→0-Wächter. Quelldatei ins `legacy_archive/` verschoben; AllAnimations-Karte umgehängt + „Modular"-Badge. **Verifiziert:** Headless-Chrome (Playwright) — Console fehlerfrei, Auto-Stopp physikalisch korrekt (n=2 → Stopp t=2,00 s, φ=180,00 °), Dark Mode greift, alle Modi/Ansichten/Presets/Zerlegungen/Graphen. Farbpalette (Violett+Orange+Grün) bewusst nicht Okabe-Ito-normalisiert (Parität) → Folge-Aufgabe (issues.md). Plan: `.claude/plans/harmonic-drifting-peach.md`. |
| M7 | ✅ Atwood-Energie migrieren | atwood_energy | **Erledigt (Session 2026-07-09, v1.0.0):** `Project_atwood_energy_simulation/` — **eigenständige Sim** (bewußt nicht in `Project_atwood_simulation/` konsolidiert, PO-Entscheidung). 6-Modul-Scaffold nach Atwood (physikalisch identische Maschine, Szene/Stoppuhr/Lineal/Vektoren übernommen). Energie als **Default-Diagrammtyp** (Composite E_kin/E_pot/E_ges) + Einzel-Typen + Energieverlust E_V; Subjekt System/m₁/m₂. **Layout-Umschalter** nebeneinander↔übereinander aktiviert **I9** (Zweier-Diagramme orthogonal zur Sim/Diagramm-Aufteilung). **Vereinfachte Coulomb-Reibung** (skalar, Haftreibungs-Fall a=0) — Modellgrenzen in `docs/KNOWN_LIMITATIONS.md`. 3 wählbare E_pot-Nullpunkte (separate/y1/y2) + Nulllinien in der Szene; Reibungspfeil an der Rolle. Energie-Live-Panel + Bilanzzeilen (E_ges+E_V konstant). Neue shared Okabe-Ito-Energie-Tokens `--c-ekin/-epot/-etot/-eloss` in `shared/css/design-system.css`. Akkordeon-Steuerungs-Sidebar (I8, 2 Cluster default eingeklappt). Koordinatensystem Höhe vom Boden (kanonisch). Erhaltung analytisch exakt (Energien aus geschlossener Lösung, nicht numerisch integriert). Quelldatei ins `legacy_archive/`; AllAnimations-Karte umgehängt + „Modular"-Badge; Vorschaubild belassen. Plan: `.claude/plans/enchanted-snacking-boot.md`. |
| M8 | Elastischer Stoß migrieren | elastischerStoß | → `Project_stoss_simulation/`. **Größter Physik-Eingriff:** Per-Frame-Physik → `precompute()` umstellen. |
| M9 | ✅ 3-Massen-Umlenkrollen migrieren | 3massen_umlenkrollen_v2 | **Erledigt (Sprint 4):** `Project_3massen_umlenkrollen_simulation/` v1.0.0 — als **Sim-Schale** (analog Lorentz: Topbar Theme+Reset, kein Play/Pause/Stoppuhr/CSV) umgesetzt. `computeEquilibrium()` löst Winkel analytisch aus dem Kräftedreieck; SVG-`<text>`-Labels (kein HTML-Overlay), kanonische Pfeilspitzen, Okabe-Ito-Farben, einklappbare Analyse-Sidebar. Standalone-HTML ins `legacy_archive/` verschoben; Karte auf Modular umgehängt. |

## WERKZEUG-SCHALE (Diagrammatische Werkzeuge, in-place)

| ID | Titel | Datei | Beschreibung |
|----|-------|------|--------------|
| W1 | ✅ Ableitung → **modular migriert** (§8) | ableitung.html → `Project_ableitung_simulation/` | **Erledigt (Session 2026-07-08, migriert als v1.0.0, aktuell v1.2.2):** Auf ausdrücklichen PO-Wunsch **volle Modular-Migration** statt In-place-Werkzeug (§7). `Project_ableitung_simulation/` — 6-Modul-Scaffold als **Sim-Schale** (analog 3-Massen: Topbar Theme + Reset, **kein** Play/Pause/Stoppuhr/CSV, kein RAF-Loop). Analytische Ableitung `f'` je Funktion (statt numerischem Zentraldifferenzen-Array), Dark-Mode-taugliche Achsen/Gitter/Kurve über Tokens (war im Prototyp defekt), `setAxisLabel`, `niceStepLE`-Ticks (1-2-4-5, ≥4 inkl. 0 beide Achsen), Abszisse am Nulldurchgang, kanonische Pfeilspitzen (`refX=0`), farbblind-sichere Kategorialfarben (grau/blau/orange/mauve statt rot/grün/violett), `.legend-grid`, einklappbare Analyse-Sidebar, statisches MathJax (Titel + Differenzenquotient zentriert/vorwärts + f/f' je Funktion). Prototyp nach `legacy_archive/` verschoben (nicht gelöscht), AllAnimations-Karte auf **Modular** umgehängt. **Post-Migration-PO-Erweiterungen** (gleiche Session) → **FAG1** (umschaltbare Werte im Diagramm, v1.1.0), **FAG2** (kubisches Polynom, v1.2.0) sowie Titel-Typografie v1.2.1/1.2.2 (Wort „Funktion" via `\text{}` in-MathJax konsistent, Funktion als \(f(x)=y=\dots\), Titel über Plot zentriert). ~~ Erledigt 2026-07-07 als Werkzeug-Schale; ersetzt durch Modular-Migration. ~~ |
| W2 | ✅ Geschwindigkeit → Werkzeug-Schale | geschwindigkeit.html | **Erledigt (Session 2026-07-07, v1.0.0):** Wie W1. Step-Button-Widgets bleiben erhalten. **Statisches MathJax** (3 Funktions-Varianten statisch, `display`-Umschaltung), Graph-Titel letztes SVG-Kind, Achsenbeschriftung **kanonisch** via `setAxisLabel`-Helfer (Deskriptor upright, `t`/`x` italic, `s`/`m` upright). Version `v1.0.0`. ~~ Ursprünglich: wie W1, Step-Buttons bleiben, Achsenbeschriftung kanonisch. ~~ |
| W3 | ✅ Grundbegriffe Kinematik → Werkzeug-Schale | grundbegriffe_kin.html | **Erledigt (Session 2026-07-07, v1.0.0):** Viele Toggles bleiben, kein Sim-Loop. **Statisches MathJax**: Analyse-Box mit 8 Erklär-Varianten als statische `<div class="analysis-variant">`s (default + 7 Begriffe), `updateAnalysisBox` schaltet nur `display` — kein `typesetPromise`. Achsen-Labels `x-Position / m`/`y-Position / m` kanonisch (`x`/`y` italic via `setAxisLabel`-Helfer). Graph-Titel `Bahndiagramm / x-y-Diagramm` mit `id="graph_title"` und Re-Append am Ende von `updateVisualization` → **letztes SVG-Kind**. Namespace-Typo `www.w.org` → `www.w3.org` repariert. Version `v1.0.0`. Offen (bewusst nicht in W3): Vektor-Pfeilspitzen-Geometrie (`refX=markerWidth`) — separates Item, bei nächster Berührung gegen kanonische `refX=0`+`shortenEnd`-Regel abgleichen. Vorhandener Titel-Typo „Kinetmatik" (→ „Kinematik") bewusst nicht geändert (Out-of-Scope). ~~ Ursprünglich: wie W1, viele Toggles, kein Sim-Loop. ~~ |

> **Dark-Mode-Fix (Session 2026-07-08, W1–W3 nachgebessert):** Dark Mode funktionierte in allen drei Werkzeug-Dateien (und systemisch in **allen** R4/R5/R6-Standalones) nicht. Ursache: der Shared-Token-Remap stand auf `:root` (`--bg-color: var(--bg)` …). CSS-Variablen lösen **eager** am deklarierenden Element (W3C css-variables-1, CSSWG #2793) — da `body.dark` die Tokens aber auf `body` redefiniert, fror `var(--bg)` auf `:root` den **Light**-Wert ein. Fix: Remap auf `body` verschoben (dort greift die `body.dark`-Kaskade). CLAUDE.md-Anleitung entsprechend korrigiert (`:root` → `body`). Werkzeug-Dateien bleiben Einzeldatei (§7 Blueprint) und werden nicht migriert — daher in-place repariert. Die noch nicht migrierten Sim-Standalones (M6 kreisbewegung, M7 atwood_energy, M8 elastischerStoß) bekommen funktionierenden Dark Mode über die Migration zur modularen Architektur (diese nutzt `--bg` direkt). Taschenrechner (S4, bleibt Standalone) braucht denselben `body`-Remap-Fix bei Gelegenheit.

---

## ROLLOUT: Neue UI/UX & Design-System (Sprint 3)

Vollständiger Plan: `.claude/plans/crystalline-giggling-flamingo.md`.
Referenzimplementierung: `Project_freier_fall_simulation/` v2.2.x (einklappbare Sidebar, `--fh-mint`-Tokens, Dark Mode, Grid 280/1fr/270, Back-Button).
Blueprint: `global_docs/simulation_instruction.md` § „Einklappbare Analyse-Sidebar".
Adressiert bestehende Items **I2** (Shared Design-System linken) und **S2** (Dark Mode für Standalone-Sims) — **beide mit R0/R4/R5/R6/R7 geschlossen (Sprint 3).**

**Status (Sprint 3):** R0–R8 erledigt (R8 bewusst nicht umgesetzt — siehe unten); R9 = dieser Abschluss.

| ID | Prio | Titel | Abhängigkeit | Beschreibung |
|----|------|-------|--------------|--------------|
| R0 | Must | `shared/css/design-system.css` an CLAUDE.md angleichen | — | Tokens an FF-Referenz (Surface/Text/Border, `--fh-mint-dark`-Alias), Kraft-Vektorfarben auf Okabe-Ito (`#0072b2`/`#e69f00`/`#cc79a7`), Grid `280px 1fr 270px`, Klapp-Sidebar-CSS einlagern (off-screen Body, MathJax-Gotcha). Gate für R1–R3. Commit `refactor(repo)`. |
| R1 | Must | Atwood: einklappbare Sidebar + shared import | R0 | `<link>` shared; per-Sim Tokens bereinigen; Kollaps-HTML/JS laut Blueprint. v2.1.10 → v2.2.0. Hat schon Grid/Back-Button/Stopwatch/Legende/Okabe-Ito. Commit `feat(atwood)`. |
| R2 | Must | Rolling: Design-System + Sidebar + Legende + Stopwatch | R0 | `<link>` shared; Grid 255/295 → 280/270; Back-Button; `.legend-grid` für SP/P1–P4; kanonische Stopwatch (precompute-basiert); einklappbare Sidebar; Okabe-Ito-Kraftfarben. v1.9.5 → v2.0.0. Commit `feat(rolling)`. |
| R3 | Must | Lorentz: Gold-Reste & :root-Bugfix + Sidebar + Legende | R0 | Stale Gold-`rgba(232,197,71,…)` → Mint; doppeltes `:root`/`body.dark` am EOF entfernen; Grid → 280/270; Back-Button; `.legend-grid` (Strom + F_L/F_s); einklappbare Sidebar. **Keine Stopwatch** (statisches Gleichgewicht, keine Zeitanimation — bewusst). v1.4.1 → v1.5.0. Commit `fix(lorentz)`. |
| R4 | Should | 11 FH-blau-alt Standalone-Prototypen umstellen | R0 | `3massen_umlenkrollen_v2`, `ableitung`, `atwood`, `atwood_energy`, `elastischerStoß`, `federpendel`, `freier_fall_senkrechter_wurf`, `geschwindigkeit`, `grundbegriffe_kin`, `kreisbewegung`, `kreiskinematik_v5`: `<link>` shared, `--fh-blue`/`#005eb1` → Tokens, Font-Stacks → `--font-ui`/`--font-mono`, Dark Mode + Theme-Toggle, Back-Button. Pro Datei `style(standalone)`. |
| R5 | Could | 2 Bulma-Outlier umstellen | R0 | `schräger_wurf.html`, `zykloide3.html`: Bulma-Palette vollständig durch FH-Tokens ersetzen (größerer Eingriff, Layout/Funktion bleibt). |
| R6 | Could | Taschenrechner umstellen | R0 | `Standalone Proto/Taschenrechner/taschenrechner.html`: FH-blau-alt → FH-Design-System, Dark Mode, Back-Button. |
| R7 | Could | Übersicht linkt shared Design-CSS | R0 | `AllAnimations/index.html` nutzt aktuell inline duplizierte Tokens — auf `<link>` shared umstellen. |
| R8 | Could | ~~Freier Fall linkt shared~~ (bewusst nicht umgesetzt) | R0 | `Project_freier_fall_simulation/` ist die kanonische Referenz, aus der `shared` abgeleitet wurde — bereits voll konform. Ein `@import` würde eine Cleanup der per-Sim `styles.css` (Base-Tokens + Klapp-CSS) erfordern und die Referenz riskieren, für marginalen DRY-Nutzen. Entscheidung: FF bleibt selbstständig. |
| R9 | Must | Rollout abschließen: Doku & Backlog aktualisieren | R1–R8 | CLAUDE.md/BACKLOG: I2, S2 als erledigt markieren; Statistik; ggf. Konventionen um neu gewonnene Erkenntnisse ergänzen. Commit `docs(repo)`/`docs(global)`. |

---

## ERLEDIGT (Sprint 2 — 2026-06-15)

| ID | Titel | Version | Anmerkung |
|----|-------|---------|-----------|
| M2 | Freier Fall / Senkrechter Wurf migrieren | v2.1.9 | `Project_freier_fall_simulation/` — modular, Dark Mode, Precompute, CSV-Export |
| M3 | Atwood migrieren | v2.1.9 | `Project_atwood_simulation/` — inkl. Koordinatensystem-Fix, tAxisStep, yrel-Diagrammtyp |
| T5 | Zwei index.html konsolidieren | Sprint 3 | Veraltete `Standalone Proto/index.html` entfernt; `AllAnimations/` an Repo-Root gehoben — `AllAnimations/index.html` ist die einzige Übersichtsseite. Back-Buttons in Atwood/Freier Fall und Projekt-Links korrigiert. |

---

## ERLEDIGT (Sprint 3 — 2026-07-03): Rollout UI/UX & Design-System

Vollständiger Plan: `.claude/plans/crystalline-giggling-flamingo.md`. Referenz: `Project_freier_fall_simulation/` v2.2.x.

| ID | Titel | Commit / Version | Anmerkung |
|----|-------|------------------|-----------|
| R0 | `shared/css/design-system.css` an CLAUDE.md angleichen + Klapp-CSS | `refactor(repo)` 8a6614b | Tokens, Okabe-Ito-Kraftfarben, Grid 280/1fr/270, Klapp-Sidebar-CSS (off-screen Body). |
| R1 | Atwood: einklappbare Sidebar + shared import | `feat(atwood)` 9ad770d · v2.2.0 | Hat schon Grid/Back-Button/Stopwatch/Legende/Okabe-Ito. |
| R2 | Rolling: Design-System + Sidebar + Legende + Stopwatch | `feat(rolling)` 1116404 · v2.0.0 | Grid 255/295 → 280/270; kanonische Stopwatch (precompute-basiert); Legende SP/P1–P4. |
| R3 | Lorentz: Gold-Reste & `:root`-Bugfix + Sidebar + Legende | `fix(lorentz)` 1674c7b · v1.5.0 | Stale Gold → Mint; doppeltes `:root`/`body.dark` entfernt; Okabe-Ito F_L/F_S. Keine Stopwatch (statisches Gleichgewicht). |
| R4 | 11 FH-blau-alt Standalone-Prototypen umstellen | `style(standalone)` f432622 | `--fh-blue`/`#005eb1` → `var(--fh-mint)`/`#00B1AC`; Token-Mapping (auto Dark Mode); Font-Stacks → `--font-ui`/`--font-mono`; Back-Button + Theme-Toggle. |
| R5 | 2 Bulma-Outlier umstellen | `style(standalone)` a76292c | `schräger_wurf` & `zykloide3`: Bulma-Kategorialpalette → FH-Tokens `--c-p1..p4`/`--c-sp`/`--c-vel`/`--c-acc`. |
| R6 | Taschenrechner umstellen | `style(standalone)` 0517442 | `../../shared/`-Pfad; Equals-Button → Mint; Back-Button → `../AllAnimations/index.html`. |
| R7 | Übersicht linkt shared Design-CSS | `refactor(standalone)` fe5b098 | Token-DRY; `fh-theme` → `fh_theme` (Dark Mode persistiert übersicht↔sim). |
| R8 | Freier Fall linkt shared | — (bewusst nicht umgesetzt) | Siehe R8-Zeile oben; FF bleibt selbstständige Referenz. |
| R9 | Rollout abschließen: Doku & Backlog | `docs(repo)`/`docs(global)` (this) | I2/S2 als erledigt markiert; CLAUDE.md um Standalone-Konvertierungs-Konventionen ergänzt; Statistik aktualisiert. |

---

## SPRINT 4: Vereinheitlichung aller Sims auf den modularen Soll-Zustand

**Ziel:** Alle in `AllAnimations/index.html` verlinkten Simulationen auf
**EINEN** einheitlichen Standard bringen (Technik, Design, UX/UI), von dem
nur in gut begründeten Ausnahmefällen leicht abgewichen wird. Maßstab:
**echte Best-Practice = wartbar, verwaltbar, übersichtlich.**

**Sprint-3-Klarstellung:** R0–R9 haben die Standalone-Prototypen nur
**token- und chrome-seitig** vereinheitlicht (Farben/Schrift/Back-Button/
Theme-Toggle via R4/R5). Layout, UX-Struktur und Architektur wurden *nicht*
angefasst — die Prototypen bleiben Einzel-HTML mit je eigenem Layout.
Sprint 4 schließt diese Lücke.

**Strategische Entscheidungen (Sprint 4a):**
1. **Dubletten stilllegen:** `atwood.html` und `freier_fall_senkrechter_wurf.html`
   waren verwaiste Dubletten der modularen Projects (ungelinkt) — gelöscht.
2. **Hybrid als Standard:** Echte (animierte) Simulationen → volle 6-Modul-
   Architektur als neues `Project_<name>/` (Migrations-Workflow §8 Blueprint).
   Diagrammatische Werkzeuge → eigene leichte Werkzeug-Schale (§7 Blueprint),
   in-place, keine Sim-Controls.
3. **Konsolidierung prüfen** statt Doppelmigration (schräger_wurf↔zykloide3,
   kreisbewegung↔kreiskinematik_v5, atwood_energy↔Project_atwood).

**Sprint 4a (erledigt):** Dubletten gelöscht; Blueprint §7 + §8 ergänzt
(I4 erledigt); Roadmap als M4–M9 + W1–W3 ins Backlog eingetragen.
Die einzelnen Migrationen (M1, M4–M9) und Werkzeug-Umstellungen (W1–W3)
sind je eigene Folge-Iterationen mit eigenem Plan/Commit.

**Sprint 4b (erledigt):** M1 (Schräger Wurf) + M4 (Zykloide) als gepaarte
modulare Migration auf gemeinsamem Scaffold überführt (beide v1.0.0).
Beide Prototypen (`schräger_wurf.html`, `zykloide3.html`) aus `AllAnimations/`
entfernt, Karten auf die neuen `Project_*` geleitet. Plan:
`.claude/plans/jazzy-mixing-newell.md`. Offen: M5–M9, W1–W3.

---

## ERLEDIGT (Sprint 4b — 2026-07-04): M1 + M4 gepaarte Migration

Gemeinsamer Scaffold (Atwood-Muster: `precompute()` + `interpolateAt(t)`,
6-Modul-Architektur, shared Design-System, 3-Spalten-Layout, einklappbare
Analyse-Sidebar, Dark Mode via `fh_theme`). Plan:
`.claude/plans/jazzy-mixing-newell.md`.

| ID | Titel | Commit / Version | Anmerkung |
|----|-------|------------------|-----------|
| M1 | Schräger Wurf migrieren | `feat(standalone)` 8880539 · v1.0.0 | Aus `Standalone Proto/Schräger_Wurf/…v47.html` (1049 Zeilen). Volle Feature-Parität: Vektoren + Komponenten, Y-Achsen-Konfig, Strichmännchen, Stoppuhr + LCD-Easteregg, Zoom-Auto-Fit, Single/Stacked-Graph, CSV. Fehlabgelegtes `AllAnimations/schräger_wurf.html` (Rollender-Zylinder-Dup) gelöscht. |
| M4 | Zykloide / Rollender Zylinder migrieren | `feat(standalone)` 2378737 · v1.0.0 | Aus `AllAnimations/zykloide3.html` (863 Zeilen). Trochoiden-Physik (ω=Vc/R, r=0,9·R hardcoded), 5 Subjekte × 8 Größen, Kamera-Follow, Traces + Z-Order, Subjekt-Checkboxen (statisches HTML), CSV 5×8. `zykloide3.html` gelöscht. |

## ERLEDIGT (Session 2026-07-06): Vektor-Pfeilspitzen — kanonische Geometrie repo-weit

**Problem (vom PO gemeldet, Kreisbewegung):** Vektor-Pfeilspitze soll exakt auf
dem Zielpunkt sitzen (nicht zu lang/kurz), Schaft nicht aus der Spitze gucken.

**Ursachenanalyse (deterministisch, nicht per Augenmaß):** Die bisherige
CLAUDE.md-Regel „`refX = markerWidth` **und** Schaft kürzen" war **intern
widersprüchlich** = Doppelkompensation. `refX = markerWidth` setzt die Spitze
bereits ans Linien-Ende; die zusätzliche Schaft-Kürzung zog sie um eine
Marker-Länge **dahinter** → Pfeil endete zu kurz. Genau deshalb wurde der Bug in
mehreren Sims über Monate nur „halb" gefixt.

**Kanonische Lösung (eine konsistente Kombination):** Marker `refX = 0`
(Dreieck-**Basis** am Linien-Ende) **+** Schaft um Marker-Länge
`markerWidth · strokeWidth` kürzen (Helfer `shortenEnd()`). → Spitze exakt auf
dem Zielpunkt, Schaft an der Basis vom deckenden Dreieck überdeckt.

**Geänderte Dateien:**

| Bereich | Änderung |
|---|---|
| `CLAUDE.md` + `global_docs/simulation_instruction.md` | Widersprüchliche Pfeilspitzen-Regel durch die deterministische `refX=0`+Kürzungs-Regel ersetzt (inkl. „FALSCH"-Beispiel). Ausnahme Graph-Achsenpfeile (`#graph-arrowhead`, `refX=0` ohne Kürzung) unverändert. |
| Kreisbewegung → **v1.0.8** | 10 Animations-Marker `refX 5→0`; Kommentar in `render.js` korrigiert. `shortenEnd()` existierte bereits. Commit `08eafdb`. |
| Rollende Körper → **v2.0.3** | 5 Marker + dyn. Koordinatensystem-Marker `refX 6/5→0`; `shortenEnd()` neu; angewandt in `drawArrow` (sw 2,2), `drawAxis` (sw 2, mw 6) und Legende `addLeg`. |
| Lorentzkraft → **v1.5.3** | 4 Marker `refX 6→0`; `shortenEnd()` neu; angewandt auf Strom-Pfeile (`<path>`, sw 2) und Kraft-Pfeile `F_L`/`F_s` (Linien mit **dynamischer** Strichbreite → `by = 7 · dynamicWidth`). |

**Verifikation:** Alle drei Sims per Headless-Chrome-Screenshot geprüft (Server
**muss im Repo-Root** wurzeln, sonst 404 auf `../shared/css/design-system.css` →
kollabiertes Layout). Spitzen sitzen auf dem Endpunkt, kein Schaft-Überstand.

**Edge case in `shortenEnd()`:** Bei Vektoren kürzer als die Marker-Länge bleibt
ein 2px-Stub (damit `orient="auto"` eine Richtung hat); die Spitze überschießt
dann minimal — akzeptierter Grenzfall, betrifft nur sehr kurze Vektoren.

**Noch offen:** Weitere Sims mit Vektoren (Freier Fall, Atwood, Zykloide,
Schräger Wurf) wurden in **dieser** Session **nicht** geprüft — bei nächster
Berührung gegen die kanonische Regel abgleichen.

---

## STATISTIK

Stand: 2026-07-10 (nach kritischer Physik-Review + Bugfix-Session Atwood-Energie/Atwood).

- **Gesamt-Items (offen):** 69
- **Bugs:** 2 offen (B4, B5) — B1, B2, B3 erledigt (Session 2026-07-07); B7–B11 erledigt (Kreis-Spiral v1.1.0, 2026-07-08); B12 erledigt (Kreis-Spiral v1.1.10, 2026-07-08); B6 erledigt (3-Massen v1.2.4, 2026-07-08); B13 erledigt (Atwood-Energie v1.2.2, 2026-07-10); B14–B20 erledigt (Atwood-Energie/Atwood/Schräger Wurf/Kreis-Spiral, kritische Physik-Review I10, Session 2026-07-10)
- **Technische Schulden:** 1 offen (T9) — T1–T8 erledigt
- **Features sim-spezifisch:** 49 offen (FL 7 · FR 7 [FR2/FR6 → I5/I6 retired] · FA 5 [FA4/FA5 neu, PO-Wunsch 2026-07-10] · FP 4 · F3 3 · FK 5 · FX 4 [FX1 erledigt v1.2.1, FX6 erledigt v1.1.0, FX7 erledigt v1.2.0] · FW 7 · FZ 7) — FAE (Atwood-Energie) vollständig erledigt: 14/14 (FAE1–14, zuletzt FAE9–14 in v1.2.7–v1.2.13, Session 2026-07-09/10), daher nicht in der offen-Zählung
- **Infrastruktur & Querschnitts-Features:** 6 offen (I1, I3, I5, I6, I7, I8) — I2, I4, I9, I10 erledigt
- **Standalone-Verbesserungen:** 3 offen (S1, S3, S4) — S2 erledigt
- **Neue Simulationen:** 6 offen (N1–N6)
- **Migrationen:** 1 offen (M8) — M1, M2, M3, M4, M5, M6, M6b, M7, M9 + W1 (Ableitung, modular) erledigt
- **Werkzeug-Schale:** 0 offen — W2, W3 erledigt (W1 modular migriert → Migrationen)
- **Rollout UI/UX (Sprint 3):** 0 offen — R0–R9 erledigt (R8 bewußt als nicht umgesetzt dokumentiert)
- **Erledigt (historisch):** 59 (M2, M3 — Sprint 2; T5, I2, S2, R0–R9 — Sprint 3; I4 — Sprint 4a; M1, M4 — Sprint 4b; M5 — Sprint 4e; T8, T3, T7, T2, B1, B2, B3, T4, W1, W2, W3 — Session 2026-07-07; M6, M6b — Session 2026-07-08; B7, B8, B9, B10, B11, FX6 — Kreis-Spiral v1.1.0, 2026-07-08; B12 — Kreis-Spiral v1.1.10, 2026-07-08; FX7 — Kreis-Spiral v1.2.0, 2026-07-08; W1 modular migriert, FAG1, FAG2 — Ableitung v1.0.0–v1.2.2, 2026-07-08; B6 — 3-Massen v1.2.4, 2026-07-08; FX1 — Kreis-Spiral v1.2.1, 2026-07-08; FAE9–13, B13 — Atwood-Energie v1.2.7–v1.2.9/v1.2.2, Session 2026-07-09/10; FAE14, B14–B20 — Atwood-Energie/Atwood/Schräger Wurf/Kreis-Spiral, kritische Physik-Review I10, Session 2026-07-10)

> **Konsolidierung (Session 2026-07-08):** Per-Sim `issues.md`/`FEATURE_BACKLOG.md`
> wurden in diesen zentralen Backlog migriert; per-Sim verbleibt nur
> `docs/CHANGELOG.md` + optionale `docs/KNOWN_LIMITATIONS.md`. Siehe
> `## KONVENTIONEN` oben und `CLAUDE.md` (Dokumentations-Regel).

> **Kreis-Spiral v1.1.0 (2026-07-08):** 6 PO-Punkte umgesetzt (B7–B11 + FX6) —
> Regler-Layout, Visualisierung-Dropdown, Sim/Diagramm-Anordnung, dynamische
> Achseneinteilung, Diagramm-Flächenausnutzung, α-abhängige Physik-Formelbox.

> **Kreis-Spiral v1.1.10 (2026-07-08):** B12 — Physik-Block im Analyse-Panel
> voll les-/sichtbar gemacht (`.formula-box`-Override, kanonisch vgl. 3massen).

> **Atwood-Energie/Atwood — kritische Physik-Review (Session 2026-07-10):**
> Auf PO-Anfrage alle physikalischen Aspekte von Atwood-Energie kritisch
> geprüft (Energieerhaltung numerisch verifiziert, exakt bis auf
> Floating-Point-Rauschen). Ergebnis: **B14** (kritisch) — v₁/v₂/a₁/a₂
> hatten in **beiden** Atwood-Sims invertiertes Vorzeichen gegenüber der
> kanonischen Höhen-Konvention von y₁/y₂ (Live-Panel, v/a-Diagramme,
> CSV-Export betroffen; Energieberechnung selbst unberührt). Danach in
> PO-Review drei weitere, beim Testen entdeckte UI-Bugs: **B15** (Energie-
> Composite-Diagramm ignorierte das gewählte Subjekt m₁/m₂), **B16**
> (E_pot-Nulllinie m₂ doppelt beschriftet), **B17**/**B18** (E_pot-Nulllinie
> bzw. Massen-Beschriftung verschwanden hinter der Blende, da im SVG vor
> statt nach `aperture_path` gezeichnet). Plus **FAE14** (E_pot-Nulllinien
> im `separate`-Modus mit Index 1/2 beschriftet). Alle behoben und einzeln
> committed (Atwood-Energie v1.2.9→v1.2.15, Atwood v2.2.3→v2.2.4); Branch
> `feat/atwood-energy-diagrammsteuerung-rechts` per Fast-Forward in `main`
> gemergt und gepusht.
