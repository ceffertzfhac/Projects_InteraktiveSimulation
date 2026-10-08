# Bekannte Einschränkungen – Busfahrt

- **Fester Fahrplan, keine Regler für Physik-Parameter.** Die Sim ist wie die
  Vorlage im Interaktiven Skript ein Lese-Werkzeug: Ort und Zeitpunkt aus dem
  Diagramm ablesen. Reset setzt nur die Zeit zurück. Ein Fahrplan-Editor
  (Haltedauern, Fahrtdauern, Profilanteil r) wäre ein eigenes Feature
  (→ BACKLOG FBF3).
- **Hover über die ganze Fahrt.** Weil die Kurve von Anfang an vollständig
  gezeichnet ist, läuft der Hover-Cursor über 0 … 400 s und ist nicht auf die
  bisher abgespielte Zeit beschränkt. Das entspricht der Regel „Cursor auf dem
  gezeichneten Kurvenabschnitt" (→ I13.1).
- **Haltestellen-Linien nur im Ort-Zeit-Diagramm.** In v(t)/a(t) haben die
  Haltestellen keine eigene Ordinate, daher ist der Schalter dort ausgegraut.
- **Straße und Ordinate liegen nur bei x(t) auf demselben Maßstab.** Bei v(t)/a(t)
  bleibt die Straße unverändert und zeigt weiter den Ort.
