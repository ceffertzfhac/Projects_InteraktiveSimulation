# Known Limitations — Elastischer Stoß

Bewußt in Kauf genommene, lokale Einschränkungen / Modellgrenzen /
Won't-Scope dieser Simulation. Verlinkt via `→ <ID>` ins repo-weite
`BACKLOG.md`.

## Nur zentraler (1D) Stoß

Die Simulation deckt ausschließlich den zentralen elastischen Stoß auf
einer Luftkissenbahn (1D) ab. Der schiefe Stoß (2D, mit Impulserhaltung
in x/y) ist eine separate, größere Simulation → N3 in `BACKLOG.md`.

## Genau ein Stoßereignis

Es wird nur der **erste** Kontakt zwischen den Gleitern simuliert. Da bei
einem elastischen Stoß die Relativgeschwindigkeit nach dem Kontakt exakt
das Vorzeichen wechselt, entfernen sich die Gleiter danach permanent
voneinander — ein zweiter Stoß ist auf einer unendlich langen Bahn
physikalisch ausgeschlossen. Reflexionen an den Bahnenden (Prellböcke am
Rand) werden **nicht** simuliert; die Simulationsdauer ist so bemessen,
daß der Stoß und ein kurzes Nachlaufintervall sichtbar sind.

## Feste Gleiterlänge, keine Canvas-3D-Optik

Der migrierte Prototyp visualisierte die Masse durch gestapelte
„Gewichtsscheiben" auf dem Gleiter (Canvas-Zeichnung mit Farbverläufen,
Luftkissen-Partikeln). Die modulare SVG-Version zeigt stattdessen eine
feste Gleiterlänge mit Zahlenwert-Beschriftung (konsistent mit der
Massendarstellung in Atwood/Atwood-Energie) — physikalisch korrekter
(reale Luftkissenbahn-Gleiter ändern ihre Länge nicht durch
Zusatzgewichte), aber ohne die dekorative 3D-Optik des Prototyps.

## Vereinfachtes Feder-Kontaktmodell

Die Federkraft wirkt nur exakt entlang der Bewegungsachse, ideal-linear
(Hookesches Gesetz, kein Dämpfungsterm) — reibungsfrei, keine
Energiedissipation während des Kontakts (echte Elastizität). Für einen
inelastischen oder teilelastischen Stoß (Stoßzahl \(e<1\)) müßte das
Modell um einen Dämpfungsterm erweitert werden — nicht Teil dieser Sim.
