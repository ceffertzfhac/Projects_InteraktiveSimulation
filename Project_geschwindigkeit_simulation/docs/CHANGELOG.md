# Changelog — Geschwindigkeit als Steigung der Ort-Zeit-Kurve

Alle nennenswerten Änderungen an dieser Simulation. Version folgt
[SemVer](https://semver.org/): patch = Bugfix/Style, minor = Feature,
major = brechende Änderung. Die Versionsnummer in `index.html` wird
mitgeführt.

## v1.0.0 — 2026-07-12

M10 — Migration von `AllAnimations/geschwindigkeit.html` (Prototyp) auf die
6-Modul-Architektur (`constants.js`/`state.js`/`physics.js`/`render.js`/
`ui.js`/`css/styles.css`), nach dem Vorbild `Project_ableitung_simulation/`
(konzeptionell identisches Sekante→Tangente-Werkzeug, hier mit Zeit *t* als
Abszisse und Ort *x*(*t*) als Ordinate statt eines abstrakten *y*=*f*(*x*)).

### Geändert (gegenüber dem Prototyp)
- **Geschwindigkeit jetzt analytisch statt numerisch**: der Prototyp berechnete
  die Geschwindigkeit per zentraler Differenz über ein festes
  10 000-Punkte-Array (`calculateDerivative()`). Jede Funktionsvariante liefert
  jetzt ihre Ableitung analytisch (Gerade `v=2`; Parabel `v=2(t−5)`; Komplex
  per Produktregel) — exakter, gleiches Muster wie bei der Ableitung-Sim.
  Numerisch gegen zentrale Differenzen verifiziert (Abweichung < 1e-8 über den
  vollen Definitionsbereich `t∈[0,20]`).
- **Δt-Regler-Grenzen korrigiert**: der Prototyp berechnete die
  Slider-Ober-/Untergrenze im Vorwärts-Modus abhängig vom **aktuellen
  Vorzeichen** von Δt und setzte dann eine symmetrische Grenze (`min=−limit,
  max=+limit`) — dadurch konnte nahe dem linken Rand ein Δt erlaubt sein, das
  `t₀+Δt` außerhalb `[0,20]` schickt (z. B. `t₀=2`, aktuell positives Δt →
  Grenze 18, aber `Δt=−18` ergibt `t₂=−16`). Jetzt werden Ober- und
  Untergrenze unabhängig ermittelt (`physics.js::deltaBounds()`).
- **Δt=0 bleibt ein gültiger, eigenständiger Zustand** (nur Tangente
  sinnvoll) — ergibt sich automatisch aus dem NaN-Guard der
  Sekantensteigung, kein gesonderter Sonderfall-Zweig mehr nötig (anders als
  im Prototyp mit explizitem `if (delta_index === 0)`-Zweig).
- **Layout**: kanonische Akkordeon-Steuerungs-Sidebar links (I8: Funktion &
  Parameter · Visualisierung · Legende), einklappbare Analyse-Sidebar rechts
  (Geschwindigkeitsanalyse · Mathematik, default eingeklappt). Legende mit
  Farbfeldern statt der bisherigen reinen Textliste im Diagramm.
- **Kein Play/Pause/Stoppuhr/CSV** — reaktives Werkzeug ohne Zeitverlauf,
  Topbar nur Theme-Toggle + Reset (wie Ableitung).
- `shared/js/svg-text.js::setAxisLabel` (Achsen `t / s`, `x / m`) und
  `shared/js/ticks.js::niceStepLE` statt lokaler Ad-hoc-Tick-Berechnung.

### Übernommen (unverändert aus dem Prototyp)
- 3 Funktionsvarianten: Gerade, Parabel, Komplex (identische Formeln).
- Δt vorzeichenbehaftet (nicht auf „nur positiv" vereinfacht) — im
  zentrierten Modus bedeutungslos (symmetrisches Intervall), im
  Vorwärts-Modus unterscheidet das Vorzeichen echte Vorwärts- von
  Rückwärts-Differenzenquotienten.
- Stützstellen-Regler *t₀* mit Step-Buttons (±0,01 s).
