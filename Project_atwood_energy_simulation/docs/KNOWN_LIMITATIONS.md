# Known Limitations — Atwood-Energie

Bewußt in Kauf genommene, lokale Einschränkungen / Modellgrenzen /
Won't-Scope dieser Simulation. Verlinkt via `→ <ID>` ins repo-weite
`BACKLOG.md`.

## Vereinfachtes Reibungsmodell → M7

Die Reibung ist ein **vereinfachtes skalares Coulomb-Modell**, kein
vollständiges Roll-/Gleitreibungsmodell:

- Reibungskraft \(F_R\) ist ein einzelner skalaler Regler-Wert (0–20 N),
  keine separate Haft- und Gleitreibungskoeffizienten, keine
  geschwindigkeits- oder normalkraftabhängige Reibung.
- Haftreibungs-Fall: bleibt \(a=0\), solange \(|(m_1-m_2)\,g| \le F_R\)
  (Haftreibung hält die Bewegung); darüber konstante Gleitreibung \(F_R\).
- Reibung wirkt ausschließlich an der Rolle (Rollenreibung); eine
  Luftreibung ist nicht modelliert.
- Reibungsarbeit \(E_V = F_R \cdot s\) mit \(s = \tfrac12 |a| t^2\)
  (Wegstrecke der bewegten Masse ab Start). Die Reibung wirkt als
  skalare Hemmkraft im translatorischen Kräftegleichgewicht; die
  Lagerreibung erzeugt eine Seilkraftdifferenz \(F_{S,1}-F_{S,2}\), wird
  aber nicht als separates Drehmoment am Rollenmodell geführt.
- Kollision ist ein harter Stopp (analytische \(t_{\text{koll}}\)), kein
  Stoß- oder Rückprallmodell; danach ruht die Simulation.

Didaktisch ausreichend, um Energieerhaltung (ohne F_R: \(E_{\text{ges}}\)
konstant) und Energieverlust (mit F_R: \(E_{\text{ges}}\) fällt, \(E_V\)
wächst, \(E_{\text{ges}}+E_V\) konstant) zu zeigen. Für quantitative
Reibungsanalyse ist das Modell zu grob. → M7

## E_pot-Nullpunkt wählbar → M7

Fünf wählbare Nullpunkte (je Masse eigene Starthöhe / Höhe von m₁-Start /
Höhe von m₂-Start / **Boden (h = 0)** / **Decke (oberes Ende)**). Die
startbezogenen Modi liefern \(E_{\text{ges}}(0)=0\) (v(0)=0 und E_pot am
Start = 0); Boden/Decke geben feste absolute Nullpunkte mit von 0
verschiedenem \(E_{\text{ges}}\). Die Erhaltungsaussage (\(E_{\text{ges}}+E_V\)
konstant) ist unabhängig vom Nullpunkt. → M7

## Massive Rolle — Modellannahmen → M7

Die Rolle hat eine wählbare Masse \(M_R\) (0–1 kg, 0 = masselos) und
Form (Vollzylinder \(I=\tfrac12 M_R R^2\) bzw. Hohlzylinder
\(I=\tfrac12 M_R (R^2+r^2)\) mit einstellbarem \(r/R\in[0{,}1;0{,}9]\),
Außenradius \(R\) fix). Modellannahmen:

- **Kein Seilschlupf**: \(\omega = v/R\), die Rotationsenergie
  \(E_{\text{rot}}=\tfrac12(I/R^2)v^2\) ist Teil von \(E_{\text{ges}}\)
  (\(E_{\text{ges}}=E_{\text{kin}}+E_{\text{rot}}+E_{\text{pot}}\));
  die Erhaltung \(E_{\text{ges}}+E_V=\text{konst.}\) bleibt erhalten —
  auch ohne Reibung ist \(E_{\text{ges}}\) exakt konstant, denn die Rolle
  ist Teil des Systems (Rotationsenergie ist mitgezählt).
- **Homogene Massenverteilung**: Voll/Hohlzylinder mit scharfem
  Innenrand, keine radial Dichte-verteilten Profile.
- **Default \(M_R=0\) kg** (masselos, klassische Atwood-Maschine):
  \(I/R^2=0\), keine Rotationsenergie, Seilkräfte gleich
  (\(F_{S,1}=F_{S,2}=m_1 m_2 g/(m_1+m_2)\)). Erst \(M_R>0\) oder dünne
  Ringe (hohl, \(r/R\to 0{,}9\)) machen die Rotationsenergie sichtbar und
  die Seilkräfte verschieden.
- Die Seilkräfte sind bei massiver Rolle **verschieden**
  (\(F_{S,1}=m_1(g-a)\), \(F_{S,2}=m_2(g+a)\)); der alte Einzelwert
  „Seilkraft \(F_S\)" entfällt zugunsten von \(F_{S,1}/F_{S,2}\). → M7

## Energieerhaltung ist exakt, nicht numerisch integriert

Die Energien werden aus der **geschlossenen kinematischen Lösung**
\(s=\tfrac12 a t^2\), \(v=a t\) berechnet, nicht aus einem
numerischen Integrator. Dadurch ist die Erhaltung analytisch exakt
(\(E_{\text{ges}}+E_V\equiv\text{konst}\)). Eine Überprüfung eines
numerischen Integrators (Euler/Runge-Kutta) auf Energieerhaltung ist
mit dieser Simulation **nicht** möglich — das ist bewußt nicht das
Ziel.