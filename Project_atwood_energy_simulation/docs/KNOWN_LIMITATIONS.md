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
  (Wegstrecke der bewegten Masse ab Start); die Drehung der Rolle
  selbst (Trägheitsmoment) ist nicht modelliert — die Rolle ist
  masselos/ideal.
- Kollision ist ein harter Stopp (analytische \(t_{\text{koll}}\)), kein
  Stoß- oder Rückprallmodell; danach ruht die Simulation.

Didaktisch ausreichend, um Energieerhaltung (ohne F_R: \(E_{\text{ges}}\)
konstant) und Energieverlust (mit F_R: \(E_{\text{ges}}\) fällt, \(E_V\)
wächst, \(E_{\text{ges}}+E_V\) konstant) zu zeigen. Für quantitative
Reibungsanalyse ist das Modell zu grob. → M7

## E_pot-Nullpunkt nur startbezogen → M7

Drei wählbare Nullpunkte (je Masse eigene Starthöhe / Höhe von m₁-Start /
Höhe von m₂-Start) — alle auf eine **Start­höhe** bezogen. Damit ist
\(E_{\text{ges}}(0)=0\) (v(0)=0 und E_pot am Start = 0). Ein fester
absoluter Nullpunkt (Boden, h=0) ist bewußt nicht angeboten; die
Erhaltungsaussage (Linie konstant) ist unabhängig vom Nullpunkt. → M7

## Kein Trägheitsmoment der Rolle

Die Rolle wird als ideal/masselos behandelt; Rotationsenergie der Rolle
ist nicht Teil von \(E_{\text{ges}}\). Bei realen Rollen trägt
\(\tfrac12 I \omega^2\) zur Gesamtenergie bei. → M7

## Energieerhaltung ist exakt, nicht numerisch integriert

Die Energien werden aus der **geschlossenen kinematischen Lösung**
\(s=\tfrac12 a t^2\), \(v=a t\) berechnet, nicht aus einem
numerischen Integrator. Dadurch ist die Erhaltung analytisch exakt
(\(E_{\text{ges}}+E_V\equiv\text{konst}\)). Eine Überprüfung eines
numerischen Integrators (Euler/Runge-Kutta) auf Energieerhaltung ist
mit dieser Simulation **nicht** möglich — das ist bewußt nicht das
Ziel.