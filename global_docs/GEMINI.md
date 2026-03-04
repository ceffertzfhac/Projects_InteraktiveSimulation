# GEMINI.md - Rollende Körper Simulation

Dieses Projekt ist eine interaktive Physik-Simulation zur Untersuchung der Dynamik von rollenden Körpern auf einer schiefen Ebene. Es wurde für den Einsatz in Physik-Kursen entwickelt und ermöglicht den Vergleich verschiedener Körperformen und physikalischer Parameter.

## Projektübersicht

*   **Zweck:** Visualisierung und Analyse der Rollbewegung (Beschleunigung, Energie, Kräfte) unter Berücksichtigung des Trägheitsmoments.
*   **Technologien:** 
    *   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES Modules).
    *   **Grafik:** SVG für die Hauptsimulation und Diagramme.
    *   **Mathematik:** MathJax für die Darstellung physikalischer Formeln.
    *   **Physik-Engine:** Eigenimplementierung basierend auf analytischen Lösungen der Bewegungsgleichungen (Vorausberechnung der Pfade).

## Architektur & Dateistruktur

Das Projekt folgt einer modularen Struktur in JavaScript (ES Modules):

*   `index.html`: Der zentrale Einstiegspunkt, definiert das UI-Layout (Sidebar für Steuerung, Hauptbereich für SVG-Simulation und Graphen).
*   `js/`:
    *   `main.js`: Initialisierung und globales Error-Handling.
    *   `state.js`: Zentrales State-Management und Cache für DOM-Elemente.
    *   `physics.js`: Physikalische Berechnungen (k-Faktoren, Rollbedingung, Trajektorien-Vorausberechnung).
    *   `render.js`: Komplette SVG-Rendering-Logik (Simulation, Vektoren, Graphen, Energiebalken).
    *   `ui.js`: Event-Handler für Slider, Buttons und Toggles; Steuerung der Simulations-Loop.
    *   `constants.js`: Physikalische Konstanten (G, Massen) und UI-Konfigurationen (Farben, Skalierungen).
*   `css/styles.css`: Definition des modernen Dark/Light-Designs (JetBrains Mono & Syne Fonts).
*   `docs/`: Enthält `README.md` und weitere Dokumentationen.

## Entwicklung & Betrieb

### Starten der Simulation
Da das Projekt ES-Module verwendet, muss es über einen lokalen Webserver gestartet werden:

```bash
# Mit Node.js/npm (empfohlen)
npx serve .

# Mit Python
python3 -m http.server
```

Alternativ kann die `index.html` in modernen Browsern direkt geöffnet werden, sofern diese lokale Module unterstützen.

### Testen
Es gibt derzeit keine automatisierten Unit-Tests. Manuelle Tests sollten folgende Szenarien abdecken:
1.  **Rollbedingung:** Wechsel zwischen "Ebene" und "Schiefe Ebene" sowie Anpassung von $\alpha$ und $\mu_s$.
2.  **Vergleichsmodus:** Aktivieren mehrerer Körper in der Sidebar und Prüfung des "Rennens".
3.  **Visualisierung:** Togglen der Vektoren ($v, a, F_g, F_N, F_R$) und der Punktspuren.
4.  **CSV-Export:** Validierung der exportierten Daten in Excel/LibreOffice.

## Entwicklungskonventionen

*   **Sprache:** UI und Kommentare sind primär in Deutsch verfasst (Zielgruppe: FH-Physik-Kurse).
*   **Dokumentationspflicht:** Nach jeder Code-Änderung MÜSSEN die Dokumentationsdateien (`docs/CHANGELOG.md`, `docs/FEATURE_BACKLOG.md` oder der Issue-Tracker in `docs/issues.md`) aktualisiert werden, um den Fortschritt lückenlos zu dokumentieren.
*   **Physik-Logik:** Änderungen an der Mechanik müssen in `js/physics.js` erfolgen. Alle Berechnungen sind analytisch und werden vor dem Start der Animation in `precompute()` durchgeführt.
*   **Rendering:** Neue Visualisierungen (z.B. neue Vektoren) werden in `js/render.js` implementiert. Koordinatentransformationen (`physToScreen`) müssen strikt eingehalten werden.
*   **State:** Globale Variablen befinden sich ausschließlich in `js/state.js`.
*   **Stil:** Saubere Trennung von Logik (Physik), Darstellung (Render) und Interaktion (UI).

## Wichtige Konstanten (Auszug aus `constants.js`)

*   `G = 9.81` (Erdbeschleunigung)
*   `X_STOP = 5.0` (Länge der Rampe in Metern)
*   `DT = 1/240` (Simulations-Zeitschritt für hohe Präzision)
*   `SUBJECTS`: `sp` (Schwerpunkt), `p1-p4` (Punkte auf dem Körper).
