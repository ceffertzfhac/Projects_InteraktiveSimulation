# Projekt-Logbuch & Issue-Tracker (Blog-Stil)

## [2026-02-25 21:45] - Fix: Omega und Alpha_w Diagramme
**Status:** Abgeschlossen
- Fehler in der Datenabfrage für Körper-Eigenschaften behoben.
- Primärlinien werden nun korrekt gezeichnet.
- Version 1.9.3

## [2026-02-25 21:30] - Refactoring: CSV-Export & Dateiname
**Status:** Abgeschlossen
- Metadaten in den Dateinamen verschoben.
- Dateiinhalt auf Header + Daten reduziert.
- Physikalische Header-Konvention eingeführt.
- Version 1.9.2

## [2026-02-25 21:00] - Bug: SP-Spur trotz massiver Rendering-Eingriffe unsichtbar
**Status:** Offen / Bekanntes Problem
- Trotz Umstellung auf Magenta, 6px Breite, Deaktivierung der Pfad-Vereinfachung und Z-Index-Priorisierung bleibt die SP-Spur im Animationsbereich unsichtbar.
- Diagramme zeigen korrekte Daten, d.h. die Physik-Daten sind vorhanden.
- Vermutung: Problem bei der Koordinatentransformation spezifisch für den SP oder Clipping-Fehler im SVG.
- Vorläufiger Workaround: Fokus auf andere Features, Problem bleibt im Backlog.

## [2026-02-25 20:30] - Feature: Bezugssystem-Einfluss auf Diagramme
**Status:** Abgeschlossen
- Diagramme zeigen nun Daten konsistent zum gewählten Koordinatensystem (Ebene/Boden).
- Betrifft Positionen (x, y), Geschwindigkeiten (vx, vy) und Beschleunigungen (ax, ay).
- Version 1.8.0

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
