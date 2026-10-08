# Changelog – Busfahrt (Weg-Zeit-Diagramm)

## v1.1.0 — 2026-10-08

PO-Wunsch: Der betrachtete Punkt des Busses ist jetzt sein **Schwerpunkt**
(Busmitte) statt der Front, markiert durch ein kleines diagonales Kreuz (✕) in
Gelb auf dunklem Halo, farblich klar vom roten Bus abgesetzt. Der Schwerpunkt liegt pixelgenau auf der Höhe des
Kurvenpunkts x(t) und hält genau an den Haltestellen — das passt zur
Massepunkt-Näherung im Skript direkt vor der Abbildung. Das Straßenband reicht
dafür um eine halbe Buslänge über H4 und unter H1 hinaus; das mittlere Fenster
entfällt, damit das Kreuz frei steht. Legende um das Kreuz ergänzt.

## v1.0.0 — 2026-10-08

Neue Simulation (→ BACKLOG N10): eigenständige Fassung der Aspekt-Figur
„Busfahrt der Linie 42" (Abb. 1.2, Abschnitt 1.1.7 „Die Strecke") aus dem
Interaktiven Skript (`InteraktivesSkript_WIP/src/figures/aspekt_bus_weg_zeit.js`
+ `bus_weg_zeit/`), auf den Sim-Blueprint gebracht (6 Module, Scaffold v0.3.0).

**Übernommen aus der Skript-Figur**
- Fahrplan wie dort angepinnt: Haltestellen H1–H4 bei 0/500/1000/1500 m,
  Halte 30/35/35/30 s, Fahrten 90/85/95 s, Summe 400 s.
- Trapez-Geschwindigkeitsprofil je Fahrt (30 % anfahren, 40 % gleichförmig,
  30 % bremsen); die Werte stimmen mit der Figur überein (x(75 s) = 250 m;
  v_max = 7,94/8,40/7,52 m/s; |a| = 0,294/0,330/0,264 m/s²).
- Senkrecht gestellte Straße links mit dem Bus (Front = Ort), im selben
  Maßstab und auf derselben Höhe wie die Ordinate des Ort-Zeit-Diagramms.
  Beide liegen jetzt in **einer** SVG, daher entfällt die
  ResizeObserver-Höhenangleichung der Figur.
- Anzeige-Schalter (beim Start aus): Haltestellen, Ankunft/Abfahrt,
  Ableselinien, Einfärbung. Tempo 4×/12×/60× (Standard 12×).

**Neu gegenüber der Figur**
- Diagramm-Picker (linke Sidebar, I12): Ort-Zeit x(t), Geschwindigkeit-Zeit
  v(t), Beschleunigung-Zeit a(t). Die a(t)-Abszisse liegt bei a = 0
  (Nulldurchgang), Ticks via `niceStepLE`.
- Statt nur „Halt/Fahrt" wird nach vier Bewegungsphasen eingefärbt: Halt,
  Anfahren, gleichförmig, Bremsen (Okabe-Ito-Farben).
- `precompute()` tastet jede Phase einzeln ab und legt jede Phasengrenze
  doppelt ab, damit die Sprünge von a(t) scharf bleiben.
- Zeitregler, kanonische Topbar (Play/Pause/Reset/CSV), Hover-Werte (I13.1),
  Live-Analyse (t, x, v, a, Phase, Haltestelle), Formeln und Fahrplantabelle
  im Analyse-Panel, CSV-Export, Dark Mode, Vollbild (F).
- Vitest: `test/busfahrt.physics.test.js`.
