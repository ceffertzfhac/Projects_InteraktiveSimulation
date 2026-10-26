# Known Limitations — Schräger Wurf

Bewußte lokale Einschränkungen. Bugs, Features und Tech-Schulden werden zentral
in `../../BACKLOG.md` getrackt (siehe `## KONVENTIONEN` dort). Sim-spezifische
Feature-Wünsche: → **FW1**–**FW7**; Querschnitts-Features → **I5**/**I6**/**I7**.

## Bekannte Einschränkungen
- **LCD-Digitaluhr-Easteregg** wird per Klick auf die Stoppuhr umgeschaltet
  (wie v47); bei eingeklappter Analyse-Sidebar nicht sichtbar (in der SVG-Szene,
  nicht im Panel). → **FW7**.
- **Hover-Cursor (I5) bleibt auf den bereits gezeichneten Kurvenabschnitt
  geklammert** (konsistent mit der Zykloide-Referenz), auch bei der Bahnkurve
  y(x)/x(y). Die Bahnkurve nutzt seit v1.10.0 eine Nearest-Point-Suche statt der
  Pixel→Zeit-Umkehrung, zeigt deshalb keine senkrechte Führungslinie und
  synchronisiert nicht mit einem zweiten Diagramm (die Bahnkurve gibt es nur im
  Ein-Diagramm-Modus). → **I5**, **B56**.
- **Kein Energie-Diagramm (bewußt)**: Der Schräge Wurf ist eine *Kinematik*-Simulation
  (Bahn-, Geschwindigkeits- und Beschleunigungsverlauf unter konstanter Erdbeschleunigung);
  eine Energiebilanz wäre eine *Dynamik*-Größe und paßt thematisch nicht zum
  Schwerpunkt dieser Sim. Energie-Diagramme daher bewußt nicht angeboten. → **I7**.