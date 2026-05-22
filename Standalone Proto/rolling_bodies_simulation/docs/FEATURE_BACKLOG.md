# Feature-Backlog & Prioritäten

Diese Datei enthält geplante Verbesserungen und Änderungswünsche für die Simulation „Rollende Körper“. Diese Punkte haben bei einer Weiterentwicklung des Projekts oberste Priorität.

## 🔴 Höchste Priorität (Sofort fällig bei Fortsetzung)

1.  **Erweiterte Spuren-Logik:**
    - Auch der Schwerpunkt (**SP**) soll eine optionale Spur erhalten können (analog zu P1-P4).
    - Die Spur muss unabhängig an- und abwählbar sein.

2.  **Bezugssystem-Einfluss auf Diagramme:**
    - Die Wahl des Koordinatensystems (Ebene vs. Boden) soll sich konsistent auf alle Diagramme auswirken.
    - Betrifft insbesondere die Positionen ($x, y$), aber auch die Geschwindigkeits- und Beschleunigungskomponenten ($v_x, v_y, a_x, a_y$).

## 🟢 Hohe Priorität

1.  **Ghosting / Snapshots:**
    - Option, in festen Zeitintervallen (z. B. jede Sekunde) verblasste Kopien des Körpers anzuzeigen, um die Beschleunigung visuell besser erfassbar zu machen.

2.  **Interaktive Diagramme:**
    - Hover-Effekt für exakte Werte im SVG-Diagramm zum Zeitpunkt $t$.
    - Export-Funktion für das Diagramm als Bild (PNG/SVG).

## 🟡 Mittlere Priorität

1.  **Erweiterte Körper-Geometrien:**
    - Unterstützung für benutzerdefinierte Trägheitsmomente (Eingabe des $k$-Faktors via Textfeld).
    - Simulation von Körpern mit ungleichmäßiger Massenverteilung (exzentrischer Schwerpunkt).

2.  **Mehrere Rampenabschnitte:**
    - Kombination verschiedener Neigungswinkel nacheinander (z. B. Übergang von schiefer Ebene in die Horizontale).

## ⚪ Langfristige Ideen

1.  **Dynamische Reibung (Gleiten):** 
    - Implementierung des Übergangs von Haftreibung zu Gleitreibung, falls die physikalische Rollbedingung manuell unterschritten wird.
    - Visualisierung des "Slip"-Effekts.

2.  **3D-Visualisierung:** Portierung auf Three.js für eine echte 3D-Ansicht der rollenden Körper.

3.  **Vergleichsmodus-Erweiterung:** 
    - Mehr als 5 Vergleichskörper gleichzeitig ermöglichen.
    - Automatisches "Ranking-Tableau" nach dem Zieleinlauf.

---
*Zuletzt aktualisiert am: 2026-02-25*
