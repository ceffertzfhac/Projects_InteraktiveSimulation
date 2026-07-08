# Known Limitations — Schräger Wurf

Bewußte lokale Einschränkungen. Bugs, Features und Tech-Schulden werden zentral
in `../../BACKLOG.md` getrackt (siehe `## KONVENTIONEN` dort). Sim-spezifische
Feature-Wünsche: → **FW1**–**FW7**; Querschnitts-Features → **I5**/**I6**/**I7**.

## Bekannte Einschränkungen
- **LCD-Digitaluhr-Easteregg** wird per Klick auf die Stoppuhr umgeschaltet
  (wie v47); bei eingeklappter Analyse-Sidebar nicht sichtbar (in der SVG-Szene,
  nicht im Panel). → **FW7**.
- **Graph-Titel als `textContent`** gesetzt (kein kursiver Tspan-Symbol); die
  Achsenlabels verwenden `createStyledSvgText` (kursiv). Didaktisch ausreichend.