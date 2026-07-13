# Known Limitations — Schräger Wurf

Bewußte lokale Einschränkungen. Bugs, Features und Tech-Schulden werden zentral
in `../../BACKLOG.md` getrackt (siehe `## KONVENTIONEN` dort). Sim-spezifische
Feature-Wünsche: → **FW1**–**FW7**; Querschnitts-Features → **I5**/**I6**/**I7**.

## Bekannte Einschränkungen
- **LCD-Digitaluhr-Easteregg** wird per Klick auf die Stoppuhr umgeschaltet
  (wie v47); bei eingeklappter Analyse-Sidebar nicht sichtbar (in der SVG-Szene,
  nicht im Panel). → **FW7**.
- **Hover-Cursor (I5) nur bei Zeit-Achsen-Diagrammen** (Wert vs. *t*), nicht
  bei der Bahnkurve y(x)/x(y) im Single-Modus — die x-Achse ist dort räumlich
  und bei x(y) nicht-monoton (gleiche Höhe in Steig- und Fallphase), bräuchte
  eine Nearest-Point-Suche statt der einfachen Pixel→Zeit-Umkehrung. Separates
  Folge-Feature. Cursor bleibt zudem auf den bereits gezeichneten
  Kurvenabschnitt geklammert (konsistent mit der Zykloide-Referenz). → **I5**.
- **Kein Energie-Diagramm (bewußt)**: Der Schräge Wurf ist eine *Kinematik*-Simulation
  (Bahn-, Geschwindigkeits- und Beschleunigungsverlauf unter konstanter Erdbeschleunigung);
  eine Energiebilanz wäre eine *Dynamik*-Größe und paßt thematisch nicht zum
  Schwerpunkt dieser Sim. Energie-Diagramme daher bewußt nicht angeboten. → **I7**.