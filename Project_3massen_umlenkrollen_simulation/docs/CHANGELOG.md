# CHANGELOG — Statisches Kräftegleichgewicht (3-Massen-Umlenkrollen)

## [1.3.0] — 2026-09-26

### Neu
- **Bedien-Sidebar einklappbar (→ BACKLOG I17).** Kopfleiste „Bedienung“ mit
  Doppel-Chevron oben in der linken Sidebar; eingeklappt eine 44-px-Schiene wie
  die Analyse rechts. Vorgabe: ausgeklappt. Gemeinsames Modul
  `shared/js/panel-toggle.js`, Layout in `shared/css/design-system.css`.

## [1.2.12] — 2026-09-26

Die Szene füllt jetzt die verfügbare Fläche, statt von der Dekoration klein gehalten zu
werden (PO-Auftrag, → BACKLOG F34).

### Geändert
- **Dekoration folgt der Ansicht, statt sie zu bestimmen.** Die Ansicht umschloß bisher
  immer mindestens den nominalen 900×500-Rahmen. Dessen Breite kam aber ausschließlich
  von der **Decke**, die über alle 900 Einheiten spannt — der eigentliche Inhalt ist nur
  ~460 Einheiten breit. Im breiten Fenster blieb die Szene dadurch rund 20 % kleiner als
  nötig. Decke und Achsen-Legende werden jetzt in `layoutDecor()` (`render.js`) auf die
  jeweils gültige viewBox gesetzt und sind — wie das Raster — aus der Auto-Zoom-Messung
  ausgenommen (sonst Rückkopplung wie B47). Die Ansicht umschließt nur noch den Inhalt,
  bei Mindesthöhe `SVG_H` und oben bei y=0 verankert.
- **Aufziehen auf das Feld-Seitenverhältnis — aber nicht für die Größe.** Die naheliegende
  Idee, die viewBox auf das Seitenverhältnis des Sim-Feldes aufzuziehen, ändert die
  Darstellungsgröße **nicht**: `preserveAspectRatio="… meet"` nimmt ohnehin
  `min(cw/w, ch/h)`, und genau dieses Minimum bleibt dabei gleich (gemessen: Szene vorher
  wie nachher 610×471 px). Es bleibt trotzdem drin, weil es den bisher ungenutzten
  Letterbox-Rand in Fläche *innerhalb* der viewBox verwandelt — dort sitzt die
  Achsen-Legende, ohne der Szene in die Quere zu kommen. Reicht dieser Rand nicht, wird
  gezielt nachgelegt (`DECOR_LEGEND_W`/`DECOR_LEGEND_H`). Die Legende rückt höchstens
  100 Einheiten unter den Inhalt, damit sie im schmalen Fenster nicht verloren tief steht.
- **Neuer `resize`-Listener** (debounced), da das Seitenverhältnis des Sim-Feldes jetzt in
  die Ansicht eingeht.
- **Bezug für „Zoom: 1,00×" ist die Standardansicht.** Beim Reset werden die Maße der
  dann gültigen Ansicht erfaßt und als Bezug gehalten (Maße statt Skala — bleibt bei
  Fenstergrößenänderung korrekt). Reset zeigt damit weiterhin exakt 1,00×.

### Verifikation (Playwright/Chromium)
- Szene im breiten Fenster (Sim-Feld 1276×848 px): **729×564 px statt 610×471 px (+19 %)**;
  im schmalen Fenster unverändert breitenbegrenzt (dort ist rechnerisch nichts zu gewinnen).
- Achsen-Legende in beiden Fenstergrößen frei von der Szene (vorher lag sie nach dem
  Umbau kurzzeitig unter m₁).
- Unverändert stabil: keine Zoom-Drift über drei Hin-und-Zurück-Runden, Reset und der
  Zustand ohne Gleichgewicht bleiben bei 1,00×; ungünstigste von 81 Sweep-Konfigurationen
  32 px Rand-Abstand; während des Ziehens kein Überstand. Keine JS-Fehler.

## [1.2.11] — 2026-09-25

PO-Meldung direkt nach v1.2.10: „untere Massen wandern aus dem Bild bzw. sind zu nah
am Rand" — drei unabhängige Ursachen, → BACKLOG B53.

### Behoben (B53)
- **(a) Regression aus v1.2.10 — Massen fehlten in der Zoom-Messung.** `contentBBox()`
  unionierte `el.getBBox()` über die Kinder der Szene. `getBBox()` liefert die Box im
  *eigenen* Koordinatensystem, also **ohne** das eigene `transform` — und die Massen
  tragen ihre Position genau dort (`translate` in `placeMass`). Gemessen wurde damit
  nur bis zum Seilende, also bis zur **Oberkante** der Masse; die Masse ragte um ihre
  volle Höhe (bis 60 px) nach unten heraus. Die vorige Root-bbox hatte Kind-Transforms
  korrekt eingerechnet — genau deshalb zeigte B48 `bb.x = -1000`. **Fix:** wieder
  `DOM.mainSvg.getBBox()`, aber mit für die Dauer der Messung auf `display:none`
  gesetztem Raster: das schließt das Raster aus (B47 bleibt gefixt) und behält die
  transform-korrekte Vereinigung. Der Vektor-Zuschlag (B50) kommt separat aus
  `#force_vectors_group`.
- **(b) Getweente viewBox hinkt beim Reglerziehen hinter dem Inhalt her.** Alle ~15 ms
  (Debounce) kommt ein neues Ziel, die über 220 ms geeaste Anpassung holt nie auf.
  Gemessen beim Ziehen des Seillängen-Reglers: Inhalt bis **323 SVG-Einheiten (358
  Bildschirm-px) außerhalb** der gerade dargestellten viewBox, bei langsamem Ziehen
  (100 ms/Schritt) immer noch 78 px. Bestand schon vor v1.2.10 und war dort nur durch
  die Drift (B47) maskiert, die die viewBox systematisch zu groß hielt. **Fix:**
  Herauszoomen greift sofort, nur das Hereinzoomen (Inhalt wird kleiner, nichts kann
  abgeschnitten werden) wird weiterhin smooth getweent.
- **(c) Rand-Puffer schrumpfte beim Herauszoomen.** `AUTOZOOM_MARGIN` ist in
  viewBox-Einheiten fix und damit auf dem Bildschirm umgekehrt proportional zum Zoom —
  bei 0,34× nur noch ~13 px, der Inhalt klebte am Rand. **Fix:** Puffer mit dem
  Zoom-Faktor skaliert (`M = AUTOZOOM_MARGIN · k`, `k` aus der Inhalts-Ausdehnung, nicht
  aus der vorigen viewBox — kein Rückkopplungsrisiko), bleibt dadurch optisch konstant.

### Verifikation (Playwright/Chromium, Bildschirm-Messung gegen `.sim-wrapper`)
- Abstand des untersten Inhalts zum unteren Bildrand jetzt konstant ~26 px (ohne
  Vektoren) bzw. ~35 px (mit Vektoren) über den ganzen Seillängenbereich — vorher
  12–20 px und mit zunehmendem Zoom-Out fallend.
- Parameter-Sweep über 81 Konfigurationen (m₁ × m₃ × Rollenabstand × Seillänge, jeweils
  3 Stufen, Vektoren an): ungünstigster Fall 32 px Rand, kein Überstand.
- Während des schnellen Ziehens (25 ms/Schritt) kein Überstand mehr (vorher 358 px).
- Unverändert stabil: keine Zoom-Drift über drei Hin-und-Zurück-Runden, Reset und der
  Zustand ohne Gleichgewicht bleiben bei 900×500 / 1,00×. Keine JS-Fehler.

## [1.2.10] — 2026-09-25

Kritische Untersuchung des Auto-Zooms (Headless-Chromium-Messung über den
Parameterraum) — fünf Defekte, → BACKLOG B47–B51.

### Behoben
- **B47 (Must): Auto-Zoom driftete unbegrenzt heraus (Raster-Rückkopplung).**
  `applyAutoZoom()` zeichnete das Hintergrundraster auf die *Ziel*-viewBox, und
  `targetViewBox()` maß anschließend mit `DOM.mainSvg.getBBox()`. `getBBox()`
  schließt `visibility:hidden`-Kinder ein — das Raster war also Teil seiner eigenen
  Messgrundlage. Da die Rasterlinien exakt bis `y1 = t.h` laufen, war `bb.bottom`
  immer die vorige Zielhöhe → jede Parameteränderung (auch jeder Debounce-Tick beim
  Reglerziehen) +16 px, unbegrenzt, und der Zoom fuhr nie wieder herein. Gemessen:
  Regler „Seilsegmente" 50→120→50 cm ließ die Ansicht auf 900×2651 (0,19×)
  anwachsen — bei Default-Parametern; Reset half nicht, nach zwei weiteren Runden
  0,07×. **Fix:** neue `contentBBox()` in `ui.js` mißt die Vereinigung der
  gezeichneten Szenen-Kinder (Raster und `<defs>` explizit ausgenommen); das Raster
  wird erst *nach* der Messung gezeichnet (`syncGrid()`) und nur bei eingeschaltetem
  Toggle. Raster-Toggle jetzt über `display` statt `visibility`.
- **B48 (Should): Geparkte Massen rissen die Ansicht auf.** `hideMasses()` schob die
  Massen bei fehlendem Gleichgewicht nach `translate(-1000,-1000)` — unsichtbar, aber
  geometrisch voll in der Zoom-Messung (viewBox `-1016 0 1916 500`, 0,47×). Jetzt
  `display:none`; `contentBBox()` überspringt ausgeblendete Kinder generell.
- **B49 (Should): Zoom-Anzeige maß nicht die tatsächliche Skalierung.** Der Vergleich
  der viewBox-Maße mit dem nominalen 900×500-Rahmen ignorierte, daß bei
  `preserveAspectRatio="… meet"` je nach Container-Seitenverhältnis die andere Achse
  bindet. Gemessen (Viewport 760×1100): Anzeige sprang auf 0,59×, während die reale
  Darstellungsskala unverändert 0,484 blieb. Jetzt Verhältnis der echten
  Darstellungsskalen aus `getBoundingClientRect()`.
- **B50 (Should): Pfeilspitzen und Strichbreite wurden nicht erfasst.** `getBBox()`
  mißt reine Geometrie — Marker und `stroke-width` fehlen (verifiziert: Linie bis
  x=899 mit 50-px-Marker ließ die bbox bei 900). Ein Vektor, dessen Linienende innen,
  dessen Spitze aber außen lag, löste kein Herauszoomen aus. Neue Konstante
  `AUTOZOOM_VEC_PAD = 12` (Marker-Länge + halbe Strichbreite) bläst gezielt die bbox
  der Vektor-Gruppe auf — nicht pauschal alle Elemente, sonst löst die über die volle
  Breite laufende Decke ein Dauer-Herauszoomen aus. Der Kommentar in `ui.js`, der die
  Pfeilspitzen fälschlich als erfasst beschrieb, ist korrigiert.
- **B51 (Could): Laufender Tween wurde im `near`-Pfad nicht abgebrochen** und
  überschrieb danach den eben gesetzten viewBox-Wert mit seinem alten Ziel (Flackern
  bei schnellem Heraus-/Hereinzoomen). `cancelAnimationFrame` jetzt in beiden Pfaden.

### Verifikation (Playwright/Chromium, nach dem Fix)
- Seillänge 50→120→50 cm, zweimal wiederholt: Ansicht kehrt jedesmal auf exakt
  900×500 / 1,00× zurück; Reset ebenso.
- Raster **eingeschaltet**: Höhe pendelt sauber 1105 ↔ 1218 (ohne/mit
  Gewichtskräften), keine Drift; Raster deckt weiterhin die volle viewBox.
- Kein Gleichgewicht (m₁=m₃=1 kg, m₂=2 kg): Ansicht bleibt 900×500 / 1,00×, Massen
  nach Rückkehr ins Gleichgewicht wieder sichtbar.
- Pfeilspitzen-Puffer über `ropeLen` 70/85/95/105/120 cm: unterer viewBox-Rand liegt
  durchweg exakt 28 px (12 + 16) unter der Vektor-Geometrie.
- Schmaler Viewport (760×1100): Anzeige bleibt korrekt bei 1,00×, solange die Breite
  bindet. Keine JS-Fehler in allen Szenarien.

### Offen
- **B52 (Could):** `targetViewBox()` pinnt `y = 0` und zoomt nach **oben** nie heraus;
  nach oben geschobene Kraft-Labels können stumm abgeschnitten werden. Entweder fixen
  oder als bewußte Entscheidung in `docs/KNOWN_LIMITATIONS.md` festhalten.

## [1.2.9] — 2026-09-22

### Style
- **Header zweizeilig für schmale Bildschirme.** Das Copyright steht jetzt
  kleiner in einer eigenen Zeile unter „Titel · Version · FH Aachen – FB 8 –
  Physik"; das Physik-Logo sitzt rechts daneben über beide Zeilen. Styling
  zentral in `shared/css/design-system.css` (kein Inline-Style mehr).

## [1.2.8] — 2026-09-22

### Style
- **Physik-Logo in der Topbar.** Das Logo „Lehr- und Forschungsgebiet
  Physik – FB 8" sitzt dezent im Header rechts neben „FH Aachen – FB 8 –
  Physik" (zentrale Klasse `.topbar-logo`, Bild in `shared/img/`).

## [1.2.7] — 2026-07-13

B23 — Vektor-Pfeilspitzen bei zu kurzem Vektor (repo-weiter Fix des shared-Helpers `shortenEnd`).

### Behoben (B23)
- **Vektor-Pfeillänge/Spitze:** Der shared-Helper `shortenEnd` erzwang bei
  Vektorlängen ≤ Marker-Länge einen 2-px-Schaft-Stub, sodaß die refX=0-Spitze
  über das Ziel hinausschoß. `shortenEnd` gibt jetzt `null` zurück, wenn der
  Vektor kürzer als die Pfeilspitze ist; `createForceVector` verbirgt zu kurze
  Kraftvektoren dann statt sie mit Überschieß-Spitze zu zeichnen.

## [1.2.6] — 2026-07-13

Copyright-Marke + Disclaimer-Verweis (repo-weit, Vorbereitung I1/ILIAS-Veröffentlichung).

### Geändert
- **Topbar:** Copyright-Marke „© 2026 FH Aachen, FB 8 · Alle Rechte vorbehalten" neben
  dem Institutions-Span ergänzt. Keine Verhaltensänderung — rein rechtlicher Hinweis
  (volle Fassung in repo-root `NOTICE.md` und auf der Übersichtsseite).

## [1.2.5] — 2026-07-11
### Geändert (T9 — shared/js-Helper konsolidieren)
- **`shortenEnd`** nutzt jetzt `shared/js/vectors.js` statt einer lokalen
  Kopie. Rückgabe-Keys von `{x,y}` auf `{x2,y2}` umgestellt (kanonisch,
  Mehrheit der Sims); Call-Site angepasst. Keine sichtbare Änderung —
  Algorithmus war bereits identisch mit der neuen shared Funktion.

## [1.2.4] — 2026-07-08
### Behoben (B6 — m₃-Default nach PO-Abnahme)
- **`m₃`-Default 1,1 kg → 1,2 kg** (PO-Entscheidung 2026-07-08). Der v2-Prototyp
  trug `value="1.1"` bei stalem Display „2.1 kg"; die Migration (M9) hatte
  zunächst das Prototyp-Verhalten (1,1 kg) übernommen. PO entschied 1,2 kg —
  Gleichgewichtswinkel liegen sauber in der SVG-Szene.
  Geändert: `M3_DEFAULT` (`constants.js`), `store.m3` (`state.js`),
  `m3_slider`-`value` + statischer Anzeigetext (`index.html`). B6 geschlossen.

## [1.2.3] — 2026-07-07
### Refaktoriert (T6 — einheitliches fmt() via shared/js)
- **Lokale `fmt()`-Definition durch Import aus `shared/js/format.js` ersetzt.**
  Identische Logik (Komma-Dezimal, `Number.isFinite`-Guard → '—') — keine
  Verhaltensänderung, nur DRY: eine repo-weite Hilfsfunktion statt neun lokaler.

## [1.2.2] — 2026-07-07
### Behoben (PO-Korrektur: Komponenten-Einfärbung nur an m₂)
- **Komponenten-Farbkodierung (vx → H, vy → V) jetzt nur für die Seilkräfte an m₂**
  (`F_S,li`/`F_S,re`) — dort werden die gestrichelten Komponenten gezeichnet. Bei den
  übrigen Kraft-Labels (Schwerkraft `F_G,1/2/3`, Seilkräfte an `m₁`/`m₃`) trägt die
  Wertzeile wieder die **Vektor-/Kraftfarbe** (vorher [1.2.1] waren dort ebenfalls
  H/V-Farben gesetzt). Neuer Schalter `compColored` an `addForceLabel()`.

## [1.2.1] — 2026-07-07
### Geändert (PO-Vorgabe: Komponentenwerte & gestrichelte Komponenten)
- **Komponenten-Zahlenwerte eingefärbt wie die jeweilige gestrichelte Komponente:**
  In der Wertzeile `(vx, vy) N` (sichtbar bei „Komponentenwerte anzeigen") ist `vx`
  jetzt in der Farbe der Horizontalkomponente (`--c-comp-h`, Vermilion), `vy` in der
  der Vertikalkomponente (`--c-comp-v`, Sky-Blue). Strukturzeichen (Klammern, Komma,
  Einheit) erben weiterhin die Kraftfarbe. Färbung via CSS-Klassen `.comp-val-h/v`
  (var() als SVG-Fill-Attribut würde nicht aufgelöst; so greift Dark Mode automatisch).
- **Gestrichelte Komponenten 0,8 dünnere Strichdicke:** `VEC_STROKE` (2,1) für
  gestrichelte Komponenten auf 1,3 reduziert. Da der Marker über `markerUnits=
  strokeWidth` skaliert, kürzt `shortenEnd` jetzt um die *tatsächliche* Marker-Länge
  (5·sw) — sonst endet die dünnere gestrichelte Spitze zu kurz (kanonische Geometrie).

## [1.2.0] — 2026-07-07
### Geändert (PO-Vorgabe: Winkel zur Horizontalen)
- **Winkel jetzt zur Horizontalen (α) statt zur Senkrechten (γ).** Die Analyse-
  Zellen zeigen `α₁`/`α₃` (zur Horiz.) mit den Werten `α = 90° − γ` (vorher
  `γ₁`/`γ₃` zur Senkrechten). γ bleibt die kosinussatz-native Größe — die Formel-
  Box erklärt zusätzlich die Beziehung `α = 90° − γ` und daß γ der Seil-Neigungswinkel
  zur Senkrechten ist.
- **Winkel in der Graphik sichtbar:** An `m₂` wird der Seil-Neigungswinkel zur
  Horizontalen als gestrichelte Horizontale (Bezugslinie) + Bögen zwischen
  Horizontale und jeweiliger Seilstrecke + `α₁`/`α₃`-Bezeichnung eingetragen —
  **nur die Bezeichnung, kein Wert** (PO-Vorgabe). Eigene Gruppe `#angle_group`,
  Serif-Italic-Label (wie Kraft-Labels), Bogenradius adaptiv außerhalb der m₂-
  Masse. Neu: `drawAngleAtM2()` in `render.js`; CSS `.angle-ref`/`.angle-arc`/
  `.angle-label`.

## [1.1.0] — 2026-07-06
Sammel-Release: Seillängen-Regler repariert & erweitert, Auto-Zoom, Einheiten, Raster,
Koordinaten-Feinschliff, Default-Toggles. Verifiziert per headless-Chrome-Screenshots
(CDP-Harness) über den Parameterraum.

### Behoben
- **Seillängen-Regler wirkte nie (Reihenfolge-Bug in `readInputs`):** `applyRopeLenBounds()`
  wurde *vor* dem Auslesen des Reglers aufgerufen und schrieb dabei `slider.value =
  store.ropeLenCm` (den **alten** Wert) zurück; danach las `readInputs` genau diesen
  alten Wert wieder ein → jede Reglerbewegung wurde verworfen. Fix: erst den aktuellen
  Reglerwert lesen, **dann** klemmen. Die Seilsegmentlänge verändert jetzt sichtbar, wie
  tief m₁/m₃ hängen.
- **Reset zoomte heraus:** Der Auto-Zoom-Rand-Puffer schob den Inhalt im Default knapp
  über die Standardhöhe → 0,97× statt 1,00×. Der Puffer greift jetzt nur, wenn der Inhalt
  den Standardrahmen **wirklich** verlässt; sonst exakt 1,00×.

### Geändert / Neu
- **Seillänge sinnvoll verlängerbar:** Obergrenze der Kopplung von Rollenabstand·1,6 auf
  **·3,0** angehoben (`ROPE_LEN_MAX_FACTOR`, `ROPE_LEN_MIN_FACTOR` in `constants.js`).
- **Auto-Zoom (viewBox-basiert, smooth):** Die Ansicht zoomt automatisch heraus, sobald
  gezeichneter Inhalt — inkl. Vektor-Pfeilspitzen (Rand-Puffer 16 > Marker-Länge 10,5) —
  den Rand erreicht, und wieder herein, wenn Platz frei wird. Oben verankert
  (`preserveAspectRatio="xMidYMin"`), horizontal zentriert, easeInOutQuad über 220 ms
  (`applyAutoZoom`/`targetViewBox` in `ui.js`). Kein manueller Regler (bewusst verworfen).
- **Zoomfaktor-Anzeige:** schlichter Mono-Text „Zoom: x,xx×" oben links im Sim-Feld
  (HTML-Overlay `#zoom_readout`, skaliert nicht mit; Analogie zum schrägen Wurf). <1 =
  herausgezoomt.
- **Komponentenwerte mit Einheit:** Anzeige jetzt physikalisch korrekt `(x, y) N`.
- **Hintergrundraster:** doppelte Dichte (2,5-cm-Raster statt 5 cm) und deckt beim
  Herauszoomen die **ganze** sichtbare Fläche ab (`drawGrid` bekommt die aktuelle
  viewBox-Ausdehnung; wird bei jedem Auto-Zoom neu gezeichnet).
- **Koordinatensystem-Labels:** 10 px Abstand zwischen Achsenpfeilspitze und Beschriftung
  (x rechts der Abszissen-Spitze, y über der Ordinaten-Spitze).
- **Default: alle Visualisierungs-Toggles aus** (Gewichts-, Seilkräfte, Komponenten­zerlegung,
  Vektorkomponenten, Raster) — sauberer Start, Nutzer schaltet gezielt zu. (Ersetzt die
  in 1.0.9 eingeführten „Komponenten standardmäßig an".)

## [1.0.9] — 2026-07-06
### Behoben (Kollisionsfreiheit im „alles an"-Modus, über den ganzen Parameterraum)
- **Label + Komponentenwert = eine Einheit:** Kraft-Label (`F⃗_…`) und zugehöriger Komponentenwert `(x, y)` werden jetzt als ein gemeinsames `<text>` (zwei Zeilen) gerendert statt als zwei unabhängig platzierte Elemente. Damit können Label und sein Wert prinzipiell nie mehr aufeinanderfallen (behob die Überlappungen bei F_G,1/F_S,li/F_S,re/F_G,3).
- **m₂-Seilkraft-Labels an die Vektorspitze:** `F⃗_S,li`/`F⃗_S,re` sitzen jetzt an der Spitze der jeweiligen Seilkraft + äußere Normale (Text wächst von m₂ weg), statt am Mittelpunkt — klarer getrennt.
- **Automatische Kollisionsauflösung (`resolveLabelCollisions`):** Nachbearbeitung, die überlappende Label-Boxen entlang der Achse geringster Durchdringung (MTV) auseinanderschiebt; die Massen sind feste Hindernisse, damit kein Label auf eine Masse rutscht. Fängt konfigurationsabhängige Restüberlappungen ab (z. B. `F⃗_G,2` ↔ `F⃗_S,3` bei kleinem Rollenabstand). Verifiziert über Massen/Abstand/Seillängen-Extremwerte.
- **Komponenten standardmäßig an:** `resetSim` aktiviert jetzt auch „Komponentenzerlegung" und „Vektorkomponenten anzeigen" (vorher nur im HTML `checked`, per Reset wieder aus).

## [1.0.8] — 2026-07-06
### Behoben (Abnahme-Feedback: „Schrift fett / doppelt gezeichnet")
- **Kontur an Text-Labels entfernt (Ursache der Fett-Optik):** Kraft- und Komponenten-Labels tragen `class="force-label vec-tension"` (bzw. `vec-gravity` …). Die Klasse `vec-tension` ist für die Vektor-**Linien** gedacht und setzt `stroke: var(--c-fn)`. Da das `<text>`-Element dieselbe Klasse teilt, malte SVG eine 1-px-Kontur in Füllfarbe um jeden Glyphen → Buchstaben wirkten verdickt / „zweimal übereinander". Deshalb sah das klassenlose Test-„Sample" dünn/sauber aus, das echte Label aber fett. Fix: `stroke: none` in `.force-label` und `.comp-val`. Font-Setzung (Serif-Italic 13 px/400, Variante 23) unverändert.

## [1.0.7] — 2026-07-06
### Geändert (Schriftsetzung finalisiert)
- **Schrift-Test-Gerüst entfernt:** Das temporäre „Schrift-Test 23 + 24"-Overlay-Panel samt `FONT_TEST`/`FONT_VARIANTS`/`drawFontTest()`/`addVariantSample()` ist raus. Die Kraft-Labels stehen wieder als reguläre `F⃗`-Labels in der Sim (auch `F_S,re`, das während des Tests durch eine „F⃗ test"-Probe ersetzt war).
- **Variante 23 fest verankert:** Kraft-Labels verwenden den Combining-Vektorpfeil `F⃗` (U+20D7) in Serif-Italic 13 px/400 — genau Variante 23 aus dem Test. Diese Setzung kommt vollständig aus der CSS-Regel `.force-label` (`--font-serif`, 13 px, 400) plus dem kursiven Symbol-tspan; der überflüssige `fontCfg`-Parameter in `addForceLabel` entfällt. Symbol kursiv, Index aufrecht (Konvention).
### Geändert
- **Komponenten standardmäßig sichtbar:** Toggles „Komponentenzerlegung" und „Vektorkomponenten anzeigen" starten aktiviert (`checked`), passend zur Regel „Vektoren beim Start sichtbar".

## [1.0.6] — 2026-07-06
### Behoben (Abnahme-Feedback: „Buchstabe doppelt gezeichnet")
- **Vektor-Pfeil via Unicode statt Pfad:** Der hand-positionierte Pfeil-Pfad lag so nah am F-Glyphen, daß er mit diesem verschmolz und wie ein gedoppeltes F aussah. Jetzt wird der Vektor-Pfeil als **Combining Arrow U+20D7** (`F⃗`) direkt in den Text eingesetzt — die Serifenschrift plaziert ihn selbst korrekt über dem F (wie in LaTeX/MathJax). Manuelles Positioning (`getStartPositionOfChar`/BBox) und die `.vec-arrow`-CSS-Regeln entfallen.

## [1.0.5] — 2026-07-06
### Geändert (Abnahme-Feedback: Schrift + Label-Platzierung)
- **Serifenschrift für Variablensymbole:** Kraft-Labels (F⃗) und Massen-Labels (m₁/m₂/m₃) verwenden jetzt eine Serif-Italic (`--font-serif`: Times New Roman/STIX/Cambria …) statt DM Sans. Grund: DM Sans italic ist nur in Weight 400 verfügbar und wirkt schwer („dick"); Serif-Italic ist die math-Konvention (wie LaTeX/MathJax in der Analyse-Sidebar) und naturally leichter. Kraft-Label 13 px, Massen-Label 12 px.
- **Vektor-Pfeil-Länge korrigiert:** `sym.getBBox()` lieferte in einigen Browsern die BBox des Gesamttextes (F + Subscript) → Pfeil war „viel zu lang". Umstellung auf `getStartPositionOfChar(0)`/`getEndPositionOfChar(0)` → Pfeil spannt exakt die F-Glyphenbreite (×0,82, am F-Stamm linksbündig), sitzt am Cap-Top (oberer Balken des F).
- **Label-Platzierung überarbeitet (Kollisionen vermeiden):**
  - m₁/m₃: Schwerkraft- und Seilkraft-Label standen bisher auf derselben Seite → jetzt entgegengesetzt (Schwerkraft außen: m₁ links / m₃ rechts, Seilkraft innen: m₁ rechts / m₃ links).
  - m₂-Seilkräfte: `F_S,li` nutzte die **innere** Normale (zwischen den Seilen → Kollision mit `F_S,re`/`F_G,2`); korrigiert auf **äußere** Normale beider Seilstrecken, Offset 35→42 px.
  - `F_G,2` nach rechts des Schwere-Pfeils (weg von den Seilkräften oben). Komponenten-Wert-Anzeigen entsprechend nach außen verschoben.

## [1.0.4] — 2026-07-06
### Behoben (Abnahme-Feedback)
- **Vektor-Pfeil sitzt über dem F (nicht über dem Subscript):** Pfeil-Lage/Breite wird jetzt aus der tatsächlichen F-Glyphen-BBox (`getBBox()` auf dem F-tspan) gemessen → robust gegenüber `text-anchor`; previously landete der Pfeil bei `end`/`middle`-Ankern über dem Subscript (Mitte von F_{xyz}).
- **Label-Schrift 13 px:** 11 px war noch schwer lesbar → 13 px (mit den dünnen 0,7×-Vektorpfeilen nicht mehr „fett"). Komponenten-Werte 8→9 px.
- **1. Newton richtig herum:** „Ist m₂ in Ruhe, so ist die Summe aller Kräfte auf m₂ null" (Ruhe → ΣF=0) — vorher verdreht (ΣF=0 → Ruhe).

## [1.0.3] — 2026-07-06
### Behoben (Abnahme-Feedback)
- **Vektor-Pfeil über dem F:** Kraft-Labels zeigen jetzt die Vektor-Notation F⃗ (kleiner Pfeil-Pfad über dem kursiven F, in Vektorfarbe gestrichelt ausgeführt als Linie + Chevron-Spitze). Bisher fehlte der Pfeil, es stand nur „F".
- **Schrift-Lesbarkeit:** Label-Schrift von 9 px (0,7×-Skalierung aus v1.0.2 — zu klein/schwer lesbar) auf **11 px** zurückgenommen. font-weight bleibt 400 (nicht fett) — 11 px ist die Mitte zwischen 9 (zu klein) und 13 (zu dick). Massen-Labels 9→11 px, Komponenten-Werte 7→8 px.

## [1.0.2] — 2026-07-06
### Behoben (Abnahme-Feedback)
- **Vektorpfeile & Sim-Schrift auf 0,7× skaliert:** `VEC_STROKE` 3→2,1 (Marker skaliert via `markerUnits=strokeWidth` automatisch mit), Massen-Labels 13→9 px, Kraft-Labels 13→9 px, Komponenten-Werte 10→7 px — Pfeile und Beschriftungen erscheinen jetzt dezent, nicht mehr „fett".
- **Winkel eindeutig als „zur Senkrechten":** Seilkraft und Winkel in der Analyse aufgeteilt (eigene Zellen); Winkel γ jetzt explizit als Winkel **zur Senkrechten (Vertikalen)** ausgewiesen — `γ₁ = angle₁ − π/2`, `γ₃ = π/2 − angle₃` (Horizontalkomponente = T·sin γ, Vertikalkomponente = T·cos γ, in Node verifiziert).
- **Newton-Erklärung in der Analyse:** Formel-Box beginnt jetzt mit dem 1. Newtonschen Gesetz (Summe aller Kräfte = 0 → m₂ bleibt in Ruhe) und `\(\sum\vec{F}=0=...\)`.

## [1.0.1] — 2026-07-06
### Behoben
- **Vektorzerlegung funktionsfähig:** die Komponenten-Vektoren referenzierten `url(#arrowhead-horizontal)`/`-vertical`, aber die Marker-IDs heißen `arrowhead-comp-h`/`-comp-v` → Pfeilspitzen fehlten. Zentrale `MARKER_ID`-Map in `render.js` bindet jeden Vektortyp an den korrekten Marker.
- **Formel-Überlauf in der Analyse-Sidebar (270 px):** lange `\qquad`-Mehrfachgleichungen aufgeteilt (eine Seilkraft-Gleichung je Zeile), Cosinus-Satz als kompakter `\tfrac`-Bruch, MathJax `svg.scale: 0.9`, `.formula-box` mit `overflow-x:auto` als Sicherheit.
- **Colon-Umbruch:** Intro-Zeilen vor den Formeln gekürzt (z. B. „Winkel (Cosinus-Satz):" statt „Winkel aus dem Kräftedreieck (Cosinus-Satz):"), damit das „:" nicht mehr allein auf die nächste Zeile rutscht.
- **Schrift in der Simulation zu dick:** Massen-Labels 16→13 px (`font-weight:400`), Kraft-Labels 15→13 px, Komponenten-Werte 11→10 px.

## [1.0.0] — 2026-07-06
### Migration (Standalone `3massen_umlenkrollen_v2.html` → modular)
- **Scaffold:** `Project_3massen_umlenkrollen_simulation/` in kanonischer 6-Modul-Struktur (`constants/state/physics/render/ui`, kein `main.js`, `js/ui.js` als Einstieg).
- **Sim- vs. Werkzeug-Schale:** als **Sim-Schale** umgesetzt (analog Lorentz): Topbar mit Back · Titel · Theme-Toggle · **Reset**; bewußt **kein** Play/Pause, keine Stoppuhr, kein CSV-Export (statisches Gleichgewicht, keine Zeitreihe).
- **Physik (`physics.js`):** `computeEquilibrium()` löst Winkel analytisch aus dem Kräftedreieck (Cosinus-Satz), berechnet die m₂-Position als Tangentenschnittpunkt, Seil-/Bogenlängen mit Kollisionsprüfung. Liefert Zustandsobjekt oder Fehlstatus (`no-equilibrium` / `collision`).
- **Render (`render.js`):** `drawBackground()` (Decke, Koordinatensystem, Raster) + `updateScene()` (Rollen, Seilpfad, Massen, Kraftvektoren). SVG-`<text>`-Labels mit italic-tspan ersetzen das HTML-Overlay + Laufzeit-`MathJax.typesetPromise()` des Prototyps (MathJax nun rein statisch).
- **Vektor-Pfeilspitzen:** kanonische Geometrie (CLAUDE.md) — `refX=0` + Schaft-Kürzung um `markerWidth·strokeWidth` via `shortenEnd`; Spitze landet exakt auf dem Zielpunkt.
- **Kraftfarben (Okabe-Ito, colorblind-safe):** Prototyp-Farben (BlueViolet/Rot/Cyan/Orange) ersetzt — Schwerkraft `--c-fg`, Seilkraft `--c-fn`, Horizontalkomponente `--c-comp-h` (Vermilion), Vertikalkomponente `--c-comp-v` (Sky-Blue); Komponenten zusätzlich gestrichelt + perpendicular. Massen kategorial via `--c-p1/p2/p3`.
- **Layout:** 3-Spalten-App `280px 1fr 270px`, linke Sidebar (Parameter · Visualisierung · Legende), einklappbare rechte Analyse-Sidebar (Default eingeklappt) mit statischer Formel-Herleitung.
- **Feature-Parität erhalten:** m₂-Stepper (± in 0,1-Schritten), dynamische Seillängen-Slider-Kopplung (min/max = pulleyDist·0,8/1,6), Komponentenzerlegung + Werteanzeige, Hintergrundraster, Gleichgewichtswarnung.
- **Übernommener Default:** \(m_3 = 1{,}1\) kg (Sliderwert des Prototyps; das HTML-Display „2,1 kg" war Stale-Text — siehe `issues.md`).
- **Verlinkung:** Karte in `AllAnimations/index.html` auf die modulare Sim umgehängt, Badge „Prototyp" → „Modular"; Vorschaubild bleibt. Standalone-HTML ins `legacy_archive/` verschoben.