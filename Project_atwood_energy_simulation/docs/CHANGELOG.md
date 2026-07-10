# Changelog — Atwood-Energie

Alle nennenswerten Änderungen an dieser Simulation. Version folgt
[SemVer](https://semver.org): patch = Bugfix/Style, minor = Feature,
major = brechende Änderung. Die Versionsnummer in `index.html` wird
mitgeführt.

## v1.2.12 — 2026-07-10

E_pot-Nulllinie der rechten Masse (m₂) war doppelt beschriftet. Bugfix B16.

### Fixes
- **E_pot-Nulllinie m₂ zeigte „E_pot = 0" links UND rechts (B16)**:
  `drawZeroLines` (`render.js`) zeichnete das Links-Label unbedingt und
  ergänzte bei `right:true` (m₂-Nulllinie) zusätzlich ein Rechts-Label —
  seit FAE7 (v1.2.5) also zwei Beschriftungen für dieselbe Linie. Nur
  rechts ist korrekt. PO-Meldung 2026-07-10. **Korrigiert:** Links-/
  Rechts-Label jetzt exklusiv (`if (right) … else …`).

## v1.2.11 — 2026-07-10

Diagrammtyp „Energie (E_kin, E_pot, E_ges)" ignorierte das gewählte Subjekt. Bugfix B15.

### Fixes
- **„Energie (E_kin, E_pot, E_ges)"-Diagramm subjekt-blind (B15, kritisch)**:
  `GRAPH_CFG.ecomposite.lines` (`render.js`) war als `lines: () => [...]`
  definiert — unabhängig vom übergebenen `subject` ('system'/'m1'/'m2')
  wurden immer die System-Summen `ek_sum`/`ep_sum`/`etot` geplottet. Im
  Modus „Zwei Diagramme" mit Diagramm 1 = Subjekt „Nur m₁" und Diagramm 2 =
  Subjekt „Nur m₂" zeigten beide Diagramme dieselben (System-)Kurven —
  auch bei völlig unterschiedlichen Massen (z. B. 1 kg vs. 10 kg). Die
  Einzeltypen `ekin`/`epot`/`eges` waren **nicht** betroffen (nutzten
  bereits `lines: sub => …`). PO-Meldung 2026-07-10 (Beobachtung: „beide
  Diagramme sehen exakt gleich aus"). **Korrigiert:** `ecomposite.lines`
  wählt jetzt wie die Einzeltypen `ek1/ep1/eges1` (m₁), `ek2/ep2/eges2`
  (m₂) bzw. `ek_sum/ep_sum/etot` (System). Numerisch verifiziert (m₁=1 kg,
  m₂=10 kg): Diagramm 1 zeigt `E_kin≈1,75 J`, Diagramm 2 `E_kin≈17,54 J`
  statt zuvor identisch `E_kin,ges≈19,29 J` in beiden.
- **Diagrammtitel aller vier Energie-Diagrammtypen jetzt subjektabhängig**:
  `ecomposite`/`ekin`/`epot`/`eges` zeigten unabhängig vom Subjekt einen
  generischen Titel (z. B. immer „Kinetische Energie E_kin(t)"), obwohl
  bei `ekin`/`epot`/`eges` die Daten korrekt subjektabhängig waren — bei
  zwei Diagrammen mit unterschiedlichem Subjekt aber gleichem Typ sahen
  die Titel identisch aus. Titel zeigen jetzt „… System/m₁/m₂ …" (analog
  zum bestehenden Muster der `y`/`v`/`a`-Diagramme).

## v1.2.10 — 2026-07-10

Vorzeichen von v₁/v₂/a₁/a₂ auf die Höhen-Konvention korrigiert. Bugfix B14.

### Fixes
- **v₁/v₂/a₁/a₂ hatten invertiertes Vorzeichen gegenüber y₁/y₂ (B14,
  kritisch)**: `y1_data`/`y2_data` sind kanonisch als „Höhe vom Boden"
  gespeichert (`Y_MAX_CM − y·100`, wächst beim Steigen). `v1_data`/`a1_data`
  wurden dagegen direkt aus der **Apertur-Koordinate** übernommen
  (`v`/`accel`, positiv wenn m₁ **fällt** — Apertur-Abstand wächst), ohne
  die Umrechnung auf die Höhen-Konvention, die `yrel1_data`/`yrel2_data`
  bereits korrekt anwenden (`-s`/`+s`). Folge: Live-Panel, „Geschwindigkeit
  v"/„Beschleunigung a"-Diagramme und CSV-Export zeigten z. B. bei
  fallendem m₁ (Höhe y₁ sinkt) ein **positives, wachsendes** v₁ statt des
  erwarteten negativen Werts — Vorzeichen von Position und Geschwindigkeit
  widersprachen sich direkt (Ableitungsbeziehung dy/dt=v verletzt).
  Numerisch verifiziert (m₁=6 kg, m₂=4 kg): y₁ fällt von 250,000 auf
  249,564 cm, v₁ zeigte vorher +0,131 m/s statt der erwarteten −0,131 m/s.
  Dieselbe Vorzeichenverwechslung (Apertur- vs. Höhen-Koordinate) war
  bereits Ursache von B13 (Rollenrotation) — dort gefixt, hier nicht.
  **Korrigiert:** `physics.js` `v1_data.push(-v)`, `v2_data.push(v)`,
  `a1_data.push(-accel)`, `a2_data.push(accel)`; `render.js`
  Live-Panel-Beschleunigung `liveA1`/`liveA2` ebenfalls getauscht (nutzte
  `accel`/`-accel` direkt statt der Arrays). Energieberechnung unverändert
  korrekt (nutzt `v*v`, quadriert — vorzeichenunabhängig); Energieerhaltung
  weiterhin exakt (Drift ~1e-14). PO-Meldung 2026-07-10.

## v1.2.9 — 2026-07-10

Abszissenbreite der Diagramme ~20 % erhöht. FAE13.

### Features
- **Abszissenbreite ~20 % breiter (FAE13)**: `LAND_W` 700→840,
  `PORT_W` 492→590 in `constants.js` (+20 % Diagrammbreite). Da die
  Margins `P.left`/`P.right` (58/25) fix bleiben, wächst die
  Abszissenbreite `PLOT_W = cellW − 83` leicht überproportional
  (Portrait 409→507, +24 %). `graph_svg` skaliert via
  `preserveAspectRatio="xMidYMid meet"` + `width:100%`, sodaß das
  breitere Portrait-`viewBox` den zur Verfügung stehenden horizontalen
  Platz effizienter ausfüllt. Gilt für Einzel- und Zwei-Diagramme
  (Hochformat).

## v1.2.8 — 2026-07-10

\(E_{\text{pot}}\)-Nullpunkt-Dropdown in die Startpositionen verschoben.
FAE12 (experimentell erprobt, behalten).

### Features
- **\(E_{\text{pot}}\)-Nullpunkt in Startpositionen (FAE12)**: das
  Dropdown für den Nullpunkt der potentiellen Energie aus dem Center
  (`energy-zero-bar` über der Energiebilanz) in den linken Block
  „Startpositionen" verschoben — thematisch bei den Höhen-Controls
  (nach \(y_1\)/\(y_2\)/\(\Delta y\)), im Sidebar-Stil
  (`.slider-label` + `.select-field`). `.energy-zero-bar` aus dem
  `graph-wrapper` entfernt; tote CSS-Regel `.energy-zero-bar`/`.ez-label`
  in `styles.css` aufgeräumt. JS ID-basiert (`epZeroSelect`,
  `change`→`resetSim`, `drawZeroLines`) unverändert — funktioniert vom
  neuen Ort. Center oben führt jetzt direkt die Diagrammsteuerung und
  darunter das Balkendiagramm.

## v1.2.7 — 2026-07-10

Diagrammsteuerung vom linken Sidebar in den Center über das
\(E_{\text{pot}}\)-Dropdown gezogen + Layout-Umschalter ausgeblendet.
FAE9–FAE11 (auf Branch ausprobiert).

### Features
- **Diagrammsteuerung in den Center (FAE9)**: die „Diagramme"-Sektion
  (Modus-Pills Energie-Balken/Ein/Zwei + Diagramm-/Subjekt-Dropdowns)
  aus dem linken Sidebar entfernt und als neue `.diagram-controls-bar`
  im `graph-wrapper` platziert — direkt über dem
  \(E_{\text{pot}}\)-Nullpunkt-Dropdown (`energy-zero-bar`). So sitzt
  die Steuerung immer sichtbar direkt über dem gesteuerten Diagramm
  und entlastet den linken Sidebar. IDs/`name="diagram_mode"`
  unverändert → JS (`state.js`/`ui.js`/`render.js`) panel-agnostisch,
  keine Code-Änderung nötig; `setupAccordion()` (`.left-panel`-scoped)
  betrifft die entfernte Sektion nicht mehr. Label+Select zu
  `.diagram-opt`-Paaren umgebaut. Neue CSS-Regeln in `styles.css`.
- **Zwei-Diagramme-Selects als 2×2-Einheit (FAE10)**: bei „Zwei
  Diagramme" stehen die 4 Dropdowns als konsistente 2×2-Steuerheinheit
  — Diagramm 1 / Subjekt 1 in Zeile 1, Diagramm 2 / Subjekt 2 in
  Zeile 2, exakt untereinander, gleiche Spaltenbreiten. `.diagram-line-opts`
  + `#graph_sel2_group` von Flex auf CSS-Grid `1fr 1fr`; `#graph_sel2_group`
  mit `grid-column:1/-1` spannt beide Spalten und ist intern 2-spaltig.
- **Layout-Umschalter ausgeblendet (FAE11)**: in dieser Sim macht nur
  Nebeneinander Sinn → der Umschalter-Button (`#layout_toggle`) im
  Topbar wird ausgeblendet (HTML-Kommentar, Code behalten).
  `applyLayout()` und der Click-Listener in `ui.js` sind null-sicher
  geguarded (`if (DOM.layoutToggle)`); Init zwingt `layoutSplit=true`
  (Nebeneinander), die savedLayout-Auswertung ist auskommentiert.
  Zum Reaktivieren nur den HTML-Kommentar um den Button entfernen.

## v1.2.6 — 2026-07-10

Physik-Box im Analyse-Panel auf Energiebetrachtung umgestellt +
Umbruch-Sicherheit. FAE8.

### Features
- **Physik-Box auf Energiebetrachtung umgestellt (FAE8)**: Seilkräfte
  (\(F_{S,1}/F_{S,2}\)) und Beschleunigung (\(a\)-Formel +
  Haftreibung-Hinweis) entfernt. Verbleibt eine reine Energie-Sicht:
  Trägheitsmoment der Rolle (\(I_{\text{voll}}/I_{\text{hohl}}\)),
  \(E_{\text{kin}}/E_{\text{rot}}/E_{\text{pot}}/E_{\text{ges}}\),
  Reibungsarbeit \(E_V\), Energieerhaltung.
- **Umbruch-Sicherheit**: jede Formel steht auf eigener Zeile
  (keine `\quad`-Kombinationen mehr), sodaß keine Display-Gleichung
  den 270-px-Panelrand übersteigt. Zusätzlich `overflow-x:auto` auf
  `.formula-box` (`styles.css`) als Sicherheit — das Panel selbst hat
  `overflow-x:hidden` und würde zu breite Formeln sonst abschneiden;
   die Box wird nun scrollbar statt unsichtbar.

## v1.2.5 — 2026-07-10

E_pot-Nulllinie der rechten Masse zusätzlich rechts beschriften. FAE7.

### Features
- **E_pot-Nulllinie der \(m_2\) auch rechts beschriften (FAE7)**: die
  Nulllinie der potentiellen Energie der rechten Masse trägt jetzt
  zusätzlich ein rechtsseitiges Label „E_pot = 0" (an `x2 + 2`,
  `text-anchor:start`), bisher nur links. `drawZeroLines` (`render.js`)
  arbeitet jetzt mit `{h, right}`-Objekten; `right:true` für die
  \(m_2\)-Linie im `separate`-Modus (2. Linie) und im `y2`-Modus
  (einzige Linie = rechte Masse). Linksseitige Labels bleiben
  unverändert erhalten.

## v1.2.4 — 2026-07-10

Drei weitere PO-Wünsche: Massen-Label-Verschiebung, Rolle als eigenes
Balken-Objekt, max. Starthöhe korrigiert. FAE4–FAE6.

### Features
- **Massen-Label-Verschiebung (FAE4)**: Label \(m_1\) konstant 20 px
  nach unten (`m1_hpx + 20`), Label \(m_2\) konstant 20 px nach oben
  (`m2_hpx - 20`) in `render.js`.
- **Rolle als eigenes Balken-Objekt (FAE5)**: Im Energie-Balkendiagramm
  eine eigene „Rolle"-Gruppe (analog „Masse \(m_1\)" / „Masse \(m_2\)")
  mit einer Zeile \(E_{\text{rot}}\) — aus der „Gesamtsystem"-Gruppe
  herausgelöst und zwischen \(m_2\)- und Gesamtsystem-Gruppe platziert.
  Label von „\(E_{\text{rot}}\) (Rolle)" → „\(E_{\text{rot}}\)"
  (Gruppenname macht Zusatz überflüssig). Bar-Update erfolgt
  `data-key`-basiert, daher gruppenunabhängig unverändert funktionstüchtig.
  Gesamtsystem jetzt 4 Zeilen (E_k,ges · E_p,ges · E_ges · E_V).
- **max. Starthöhe korrigiert (FAE6)**: Slider-`max` 330 → 320 für
  \(y_1\)/\(y_2\) sowie Diff-Modus-Klammer `Math.min(320, …)` in
  `ui.js`. Bei maximaler Masse (10 kg, Halbhöhe 27,5 cm) reicht die
  Massenoberkante bei 320 cm Starthöhe bis 347,5 cm < 350 cm — keine
  Kollision mit der Oberkante/Blende mehr (vorher 330 + 27,5 = 357,5).

## v1.2.3 — 2026-07-10

Drei kleine PO-Wünsche: Startposition min 40 cm, Rollenmasse max 2 kg,
Reibungspfeil-Toggle bei \(F_R=0\) deaktiviert. FAE1–FAE3.

### Features
- **Startposition-Minimum 40 cm (FAE1)**: die Slider für \(y_1\)- und
  \(y_2\)-Startposition (`min` 70 → 40 cm) sowie die Klammer im
  Diff-Modus (`Math.max(40, …)` in `ui.js`) erweitert — Massen können
  nun tiefer (näher am Boden) starten. Auch bei max. 10 kg-Masse
  (Halbhöhe 27,5 cm) bleibt der Massenboden 12,5 cm über dem Boden.
- **Rollenmasse-Maximum 2 kg (FAE2)**: Rollenmassen-Slider `max` 1 → 2
  kg. Physik (`pulleyEffMass`, `getAccel`) ohne harte Obergrenze,
  unverändert.
- **Reibungspfeil-Toggle bei \(F_R=0\) deaktiviert (FAE3)**: solange
  die Reibungskraft 0 ist, ist der „Reibungspfeil \(F_R\)"-Toggle samt
  Beschriftung ausgegraut (`.is-disabled`, Deckkraft 0,4) und nicht
  aktivierbar (Checkbox `disabled`). Der Pfeil ist bei \(F_R=0\)
  ohnehin unsichtbar. `updateFrictionArrowToggle()` in `ui.js` wird in
  `resetSim` nach der Reibungskraft-Übernahme aufgerufen; der
  `checked`-Zustand bleibt erhalten, sodaß bei erneutem \(F_R>0\) die
  bisherige Wahl wieder greift. Neue Zeilen-ID
  `friction_arrow_row` + DOM-Cache.

## v1.2.2 — 2026-07-10

Rollen-Rotationsmarkierung drehte in falsche Richtung. Bugfix B13.

### Fixes
- **Rolle drehte falschherum (B13)**: die
  Rotationsmarkierung der massiven Rolle (eingeführt v1.2.0) drehte
  **CW**, obwohl die Physik bei fallendem \(m_1\) (linkes Seil unten)
  **CCW** verlangt. Ursache `render.js`: die Verschiebung war als
  `s_m = y1_start − y1_m` berechnet — `y1_m` ist aber die
  **Apertur-Koordinate** (Abstand von der Rolle, wächst beim Fallen),
  sodaß `s_m` beim Fallen **negativ** war, entgegen dem
  Dokumentationskommentar „fällt ⇒ >0". Das kippte das Vorzeichen von
  `phiDeg` und `rotate(-phiDeg)` lieferte CW statt CCW. Korrigiert auf
  `s_m = y1_m − y1_start` (aktuell − start) → `s_m > 0` beim Fallen,
  `rotate(-phiDeg)` ergibt korrekt CCW. PO-Meldung 2026-07-10.

## v1.2.1 — 2026-07-09

Korrektur der System-Gesamtenergie + Rollenmassen-Bereich erweitert +
Subjekt-Wahl pro Diagramm + Sektions-Umstrukturierung. PO-Abnahme-Feedback.

### Fixes
- **\(E_{\text{ges}}\)-Berechnung korrigiert (Kritisch)**: bisher war
  `etot = eges1 + eges2 = ek1+ek2+ep1+ep2` — die Rotationsenergie der
  Rolle fehlte in der System-Gesamtenergie. Ohne Reibung fiel
  \(E_{\text{ges}}\) (angezeigt) während die Rolle Rotationsenergie
  aufnahm → **nicht** konstant, entgegen der Erwartung. Die Rolle ist
  Teil des Systems, also muß \(E_{\text{rot}}\) in \(E_{\text{ges}}\):
  `etot = ek_sum + ep_sum = ek1+ek2+ek_rot+ep1+ep2`. Die Einzelmassen-Energien
  \(E_{\text{ges},1}/E_{\text{ges},2}\) bleiben ohne \(E_{\text{rot}}\)
  (die Rotation gehört zur Rolle, nicht zur Einzelmasse). Numerisch
  verifiziert: ohne Reibung \(E_{\text{ges}}\)-Drift < 2e-14 über alle
  \(M_R\)/Form-Kombinationen; mit Reibung \(E_{\text{ges}}+E_V\)-Drift
  < 6e-14 (konstant). Die alte Formel hatte ohne massige Rolle gepaßt
  (kein \(E_{\text{rot}}\)), daher trat der Fehler erst mit v1.2.0 auf.

### Features
- **Rollenmasse 0–1 kg**: Slider `min` von 0,1 auf 0 gesetzt — die
  **masselose Rolle** (klassische Atwood-Maschine) ist wählbar. Default
  \(M_R=0\) kg (masselos): \(I/R^2=0\), keine Rotationsenergie, Seilkräfte
  gleich — das klassische Verhalten ist der Ausgangszustand; erst
  \(M_R>0\) aktiviert Rotation und ungleiche Seilkräfte. `pulleyEffMass`
  liefert für \(M_R=0\) bereits 0; das Rollen-Mark (kinematische Drehung
  \(\varphi=s/R\)) dreht sich auch bei masseloser Rolle weiter.
- **Subjekt pro Diagramm unabhängig**: im Modus „Zwei Diagramme" hat
  jedes Diagramm seinen eigenen Subjekt-Wähler (System / Nur m₁ /
  Nur m₂) — statt eines einzelnen, für beide geltenden Subjekts.
  `subject` (einfach) → `subject1`/`subject2` in `state`/`DOM`;
  `render.updateGraphs` verwendet `subject1` für Diagramm 1 und
  `subject2` für Diagramm 2; CSV-Export entsprechend. Subjekt 2-Select
  nur im Modus „Zwei Diagramme" sichtbar.

### Changed
- **Sektion „Massen & Rolle"**: Rollen-Steuerung (Masse, Form,
  Innenradius) in die „Massen"-Sektion integriert und diese in
  „Massen & Rolle" umbenannt; die eigenständige „Rolle"-Sektion
  entfällt. Options-Text der Subjekt-Selects auf Unicode-Subskripte
  (m₁/m₂) umgestellt (MathJax rendert in `<option>` nativ nicht).

## v1.2.0 — 2026-07-09

Massive Rolle mit Rotationsenergie. Die Rolle bekommt eine wählbare Masse
und Form (Voll-/Hohlzylinder); ihre Rotationsenergie wird Teil der
Energiebilanz, die Beschleunigung und die Seilkräfte ändern sich entsprechend.

### Features
- **Rollenmasse \(M_R\)** (Slider 0,1–1 kg, Default 0,1 kg = nahezu masselos)
  und **Form** (Vollzylinder / Hohlzylinder, Select) in neuer linker
  Sektion „Rolle". Außenradius \(R\) fix (0,4 m).
- **Innenradius \(r/R\)** (Slider 0,1–0,9, nur bei Hohlzylinder sichtbar):
  Trägheitsmoment \(I_{\text{voll}}=\tfrac12 M_R R^2\) bzw.
  \(I_{\text{hohl}}=\tfrac12 M_R(R^2+r^2)\).
- **Physik**: effektive Rollenmasse \(I/R^2\) im Beschleunigungs-Nenner
  \(a=((m_1-m_2)g-\operatorname{sign}\cdot F_R)/(m_1+m_2+I/R^2)\).
  Rotationsenergie \(E_{\text{rot}}=\tfrac12(I/R^2)v^2\) in
  \(E_{k,\text{ges}}\) und \(E_{\text{ges}}\) aufgenommen — Erhaltung
  \(E_{\text{ges}}+E_V=\text{konst.}\) bleibt erhalten (numerisch über alle
  \(M_R\)/Form/\(\eta\)-Kombinationen verifiziert, Drift < 1e-13).
- **Seilkräfte verschieden**: \(F_{S,1}=m_1(g-a)\), \(F_{S,2}=m_2(g+a)\)
  (bei massiver Rolle und/oder Reibung). Live-Panel: einzelne „Seilkraft
  \(F_S\)" → \(F_{S,1}\)/\(F_{S,2}\); Legenden-Eintrag entsprechend.
- **E_rot sichtbar**: neuer Balken „\(E_{\text{rot}}\) (Rolle)" im
  System-Block des Energie-Balkendiagramms (gleiche Kinetik-Farbe);
  Live-Wert „Rotation \(E_{\text{rot}}\)"; CSV-Spalte `E_rot`;
  Liniendiagrammtyp „Rotationsenergie E_rot".
- **Rollen-Visual**: Hohlzylinder-Loch (Kreis mit \(r=\eta R\), nur hohl)
  + Rotations-Markierung (Mint-Speiche, dreht mit Winkel \(\varphi=s/R\),
  Schlupf-frei) — die massive Rolle wird als drehende Scheibe sichtbar.
- **Formel-Box** aktualisiert: neue \(a\)-Formel mit \(I/R^2\),
  Trägheitsmomente, \(F_{S,1}/F_{S,2}\), \(E_{\text{rot}}\),
  \(E_{\text{ges}}=E_{\text{kin}}+E_{\text{rot}}+E_{\text{pot}}\).
- **KNOWN_LIMITATIONS.md**: veralteten Eintrag „Kein Trägheitsmoment der
  Rolle" durch die neuen Modellannahmen ersetzt.

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