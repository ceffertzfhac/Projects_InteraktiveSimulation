# Known Limitations — Rollende Körper

Bewußte lokale Einschränkungen und Scope-Entscheidungen. Bugs, Features und
Tech-Schulden werden zentral in `../../BACKLOG.md` getrackt (siehe
`## KONVENTIONEN` dort). Sim-spezifische Feature-Wünsche: → **FR1**, **FR3**–
**FR5**, **FR7**–**FR9** (FR2/FR6 → **I5**/**I6** retired).

## Bekannte Einschränkungen (bewußt)
- **`tog_sp_trace` per Default aus:** Bahnkurven/Spuren sind kein Vektor-Toggle
  i. S. der „standardmäßig sichtbar"-Konvention; Punktspuren analog. Bei
  eingeschaltetem Toggle wird die magenta SP-Bahn sichtbar gezeichnet.
  (Die frühere Meldung „SP-Spur unsichtbar" war *kein* Code-Defekt → **B2 ✅**
  in `BACKLOG.md`, verifiziert 2026-07-07.)

## Historie
- Das frühere blog-stilige `issues.md`-Log (Zeitstempel-Einträge 2026-02-25,
  v1.8.0/1.9.2/1.9.3 etc.) wurde zurückgezogen — die Inhalte sind im
  `docs/CHANGELOG.md` erfaßt (kein Informationsverlust).