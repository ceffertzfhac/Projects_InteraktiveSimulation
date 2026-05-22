# Projekt-Logbuch & Issue-Tracker (Blog-Stil)

## [2026-02-25 19:00] - Fix: Stabilität & Korrektes Koordinatensystem
**Status:** Abgeschlossen
- **Stabilisierung:** Behebung der Abstürze durch fehlerhafte SVG-Verschachtelung. Die Z-Ordnung wird nun sicher in `render.js` via `appendChild` am Ende des Render-Zyklus gesteuert.
- **Korrektur Rotation:** Das Koordinatensystem dreht sich nun korrekt mit der schiefen Ebene ($\alpha$).
- **Winkelanzeige:** Integration einer visuellen Darstellung des Winkels $\alpha$ inklusive Label direkt am Koordinatenursprung.
- **Spuren-Filter:** Punktspuren werden nun strikt nur für Punkte gezeichnet, die unter "Analyse Objekte" aktiviert sind.
- **UI-Sperre:** "im Vordergrund" ist nur noch anklickbar, wenn "Punktspuren anzeigen" aktiv ist.

## [2026-02-25 18:45] - Optimierung des Koordinatensystems (Fehlerhaft)
**Status:** Zurückgezogen/Fixiert
- Versuch der Z-Ordnung-Anpassung in `index.html` führte zu Instabilität.

## [2026-02-25 18:30] - Koordinatensystem & Erweiterte Analyse-Logik
**Status:** Abgeschlossen
- Neu: Bezugssystem wählbar.
- Neu: Permanentes Koordinatensystem.
