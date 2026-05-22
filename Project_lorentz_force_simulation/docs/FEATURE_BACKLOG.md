# Feature Backlog - Lorentzkraft Simulation

Dieser Backlog enthält geplante Erweiterungen und Verbesserungen für die Simulation, priorisiert nach didaktischem Mehrwert und technischer Umsetzbarkeit.

## Priorität 1: Wiedereinführung der Magnetfeld-Visualisierung
- **Ziel:** Didaktisch hochwertige Darstellung des Magnetfeldes.
- **Details:** Erneute Implementierung einer Visualisierung des Magnetfeldes (z.B. Feldvektoren oder konzentrische Feldlinien), um die Ursache der Lorentzkraft (Wechselwirkung von Strom und Magnetfeld) zu verdeutlichen. Die Darstellung soll physikalisch korrekt am Ort des betroffenen Leiters erfolgen.

## Priorität 2: Dynamische Einschaltvorgänge
- **Ziel:** Realistische Darstellung der Bewegung beim Einschalten des Stroms.
- **Details:** Implementierung einer gedämpften harmonischen Schwingung (DGL 2. Ordnung), statt des sofortigen Sprungs in das Gleichgewicht. Der Benutzer sieht, wie der Leiter in die neue Position "einschwingt".

## Priorität 2: Interaktive Kraft-Abstands-Diagramme
- **Ziel:** Verständnis der Stabilität des Gleichgewichts.
- **Details:** Ein Diagramm zeigt die Kurven von $F_L(d) \sim 1/d$ und $F_s(d) \sim (d_0 - d)$. Die Schnittpunkte markieren die Gleichgewichtslagen (stabil/instabil). Dies verdeutlicht, warum die Leiter bei zu hohem Strom kollidieren.

## Priorität 3: Perspektivische / 3D-Darstellung
- **Ziel:** Räumliches Verständnis der parallelen Leiteranordnung.
- **Details:** Umstellung der SVG-Grafik auf eine isometrische Ansicht, um die Leiterlänge und den Abstand in einer räumlichen Tiefe darzustellen.

## Priorität 4: Erweiterte Stromkonfiguration
- **Ziel:** Untersuchung abstoßender Kräfte.
- **Details:** Hinzufügen eines Toggles für die Stromrichtung in einem der Leiter. Ermöglicht die Visualisierung der Abstoßung und die daraus resultierende Stauchung der Federn.

## Priorität 5: Berücksichtigung der Massenträgheit
- **Ziel:** Höhere physikalische Genauigkeit.
- **Details:** Berechnung der Masse des Kupferleiters basierend auf Querschnitt und Länge ($ho \approx 8960 \, 	ext{kg/m}^3$). Einbeziehung der Gewichtskraft $F_g$ in die Initialdehnung $d_0$.

## Priorität 6: Experimenteller Modus (Sandbox)
- **Ziel:** Freies Experimentieren.
- **Details:** Eingabe beliebiger Materialien (Aluminium, Silber) und deren spezifische Widerstände.
