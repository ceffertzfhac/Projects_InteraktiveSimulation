# Known Limitations — Die Ableitung als Grenzwert

Bewußte lokale Einschränkungen, Won't-/Scope-Entscheidungen und Housekeeping.
Bugs, Features und Tech-Schulden werden zentral in `../../BACKLOG.md` getrackt
(siehe `## KONVENTIONEN` dort).

## Bewußte Scope-Entscheidungen
- **Kein Play/Pause/Stoppuhr/CSV-Export:** Dies ist ein diagrammatisches Werkzeug
  ohne Zeit-Animation (§7 des Blueprints). Es gibt keinen Zeitverlauf zum
  Abspielen und keinen Datensatz zum Exportieren. Die Topbar führt daher nur
  Theme-Toggle + Reset (Sim-Schale analog Lorentz / 3-Massen-Umlenkrollen).
  Die Umsetzung erfolgte auf ausdrücklichen Wunsch trotzdem als **volle modulare
  Migration** (§8) statt als In-place-Werkzeug (§7).
- **Kein Diagramm-Hover (→ BACKLOG I13.2 — Won't):** Diese Werkzeug-Sim
  bekommt **bewusst keinen** Cursor-Hover am Diagramm (gestrichelte
  Führungslinie + hohle Ring-Punkte + Tooltip mit exakten Werten), wie er an
  den Zeit-Achsen-Sims dieser Repo existiert (→ `shared/js/hover.js`,
  BACKLOG I5/I13.1). Grund: reaktives Diagramm ohne Zeitverlauf — ein
  Hover-at-x mit adaptiertem Tooltip (f(x)/f'(x) bzw. Sekanten-Anstieg statt
  „Wert bei t") wurde im Rahmen von I13.2 erwogen und auf ausdrückliche
  Nutzer-Entscheidung (2026-07-15) verworfen. Dies ist eine bewusste
  Scope-Entscheidung, keine Lücke.
- **Fester Definitionsbereich \(x \in [0, 25]\)** mit vier fest hinterlegten
  Funktionen (Gerade, Parabel, Kubisch, Komplex). Keine freie Funktionseingabe —
  bewußt didaktisch reduziert. Der Prototyp hatte drei Funktionen; das kubische
  Polynom (v1.2.0) wurde auf PO-Wunsch nach der Migration ergänzt (keine strikte
  Prototyp-Parität mehr — bewußte Erweiterung).
- **\(\delta \neq 0\)-Guard:** Da der Differenzenquotient bei \(\delta = 0\)
  undefiniert ist (Division durch \(\Delta x = 0\)), wird \(\delta\) auf den
  kleinsten Schritt (0,05) gehoben, sobald es 0 erreicht. Der Grenzwert wird
  also angenähert, nicht exakt bei 0 ausgewertet — was genau der Punkt der
  Visualisierung ist.

## Housekeeping
- Prototyp-Quelle liegt unter `legacy_archive/ableitung.html` (verschoben, nicht
  gelöscht — Abnahme). Kann nach Freigabe entfernt werden.
- Der frühere In-place-Werkzeug-Eintrag `W1` in `BACKLOG.md` wird durch diese
  Migration ersetzt.
