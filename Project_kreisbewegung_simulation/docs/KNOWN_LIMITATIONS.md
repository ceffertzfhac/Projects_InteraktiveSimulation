# Known Limitations — Kreisbewegung

Bewußte lokale Einschränkungen und Won't-Entscheidungen. Bugs, Features und
Tech-Schulden werden zentral in `../../BACKLOG.md` getrackt (siehe
`## KONVENTIONEN` dort). Sim-spezifische Feature-Wünsche: → **FK1**–**FK5**.

## Won't (bewußt nicht)
- Ungleichförmige Kreisbewegung (variabler ω-Verlauf) — eigener Sim-Typ
  (→ `Project_kreis_spiralbewegung_simulation/`, M6b).

## Hover-Cursor
- **Bahnkurve: *t* des ersten Umlaufs.** Die Spur im Diagramm \(y(x)\)/\(x(y)\)
  wird nur bis *T* gezeichnet; jeder Punkt wird danach periodisch erneut
  durchlaufen. Der Hover (Nearest-Point-Suche, B57) zeigt den Zeitpunkt des
  ersten Durchgangs, ohne senkrechte Führungslinie. → **I13.4**, **B57**.
