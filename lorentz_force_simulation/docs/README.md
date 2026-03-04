# Lorentz-Kraft Simulation: Parallele Leiter

Diese Simulation visualisiert die Kraftwirkung zwischen zwei parallelen, stromdurchflossenen Leitern. Ein Leiter liegt fest auf einem Tisch, der andere hängt an zwei Federn von der Decke.

## Physikalisches Modell

### 1. Elektrischer Widerstand
Der Widerstand $R$ eines Kupferleiters mit Querschnitt $A$ und Länge $L$ berechnet sich zu:
\[R = ho_{Cu} \cdot \frac{L}{A}\]
mit $ho_{Cu} = 0,0178 \, \Omega\cdot	ext{mm}^2/	ext{m}$.

### 2. Stromstärke
Bei anliegender Spannung $U$ fließt der Strom:
\[I = \frac{U}{R}\]

### 3. Lorentzkraft
Zwischen zwei parallelen Leitern im Abstand $d$ wirkt die Kraft:
\[F_L = \frac{\mu_0 \cdot I^2 \cdot L}{2\pi d}\]
Sind die Ströme gleichgerichtet, ist die Kraft anziehend.

### 4. Gleichgewichtszustand
Der hängende Leiter (Leiter 2) befindet sich im Gleichgewicht, wenn die Lorentzkraft der Federkraft $F_s$ entspricht (unter Vernachlässigung der Gewichtskraft, da diese bereits im stromlosen Zustand kompensiert ist):
\[F_L = F_s = 2 \cdot D \cdot \Delta y\]
Dabei ist $D$ die Federkonstante einer einzelnen Feder und $\Delta y = d_0 - d$ die zusätzliche Dehnung durch die Lorentzkraft.

Die Simulation löst die quadratische Gleichung für $d$, um die stabile Gleichgewichtslage zu finden:
\[d = \frac{d_0 + \sqrt{d_0^2 - \frac{\mu_0 I^2 L}{\pi D}}}{2}\]

## Bedienung
- **Sidebar (Links):** Hier können die Spannung $U$, die Leitergeometrie ($L, A$) sowie die mechanischen Parameter ($D, d_0$) eingestellt werden.
- **SVG-Simulation (Mitte):** Visualisiert die Leiter, Federn, das Magnetfeld und die wirkenden Kräfte.
- **Live-Analyse (Rechts):** Zeigt die aktuell berechneten physikalischen Werte und die zugrundeliegenden Formeln.

## Referenzaufgabe (WS 2025/26)
Die Standardeinstellungen der Simulation entsprechen der Aufgabe "Leiter an der Decke":
- $A = 4,00 \, 	ext{mm}^2$
- $L = 2,00 \, 	ext{m}$
- $U = 0,590 \, 	ext{V}$
- $d = 50,0 \, 	ext{mm}$
- $\Delta y = 2,00 \, 	ext{mm}$
- **Gesucht:** $D \approx 8,79 \, 	ext{N/m}$
