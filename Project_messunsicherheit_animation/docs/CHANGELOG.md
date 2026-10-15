# Changelog – Bestwert, Standardabweichung, Messunsicherheit

## v0.3.1 — 2026-10-15

- Messunsicherheit 6/7: Diagramm ḡ(n) läuft ab dem 2. Messwert bis n = 20, dann 30, 40, 100; die Karte ist eine
  Tabelle (n · ḡ · μ_g · dezent σ_g), deren Zeilen nacheinander dazukommen (n = 20, 30, 40, 100).
- Zoom mäßiger (Messwerte bis ≈ ±3 σ bleiben im Bild); n = 100 als große Übersicht, der letzte Zoom folgt
  im Schritt „Grenze eines Experiments“.
- Keine Karten-Kommentare zur Bühnenoptik, keine Zeilenumbrüche innerhalb logischer Einheiten (FMU21, FMU22).

## v0.3.0 — 2026-10-15 (PO-Review Runde 1, FMU1–FMU18)

- Nomenklatur: Messunsicherheit μ_g (Typ A), Erwartungswert *g*_E; σ = 0,74 m/s², *g*_E = 9,13 m/s².
- Bestwert: Text „Wir versuchen, uns ihm durch Messungen zu nähern“, Strichmarkierungen auf dem Zahlenstrahl
  (oben und unten, Punktfarbe), erster Messwert mit Zahlenwert, neue Formulierung der Merke-Folie.
- Standardabweichung: zehn Werte in einem Zug, Bestwert und Intervallbreite nacheinander, Diagramm mit
  Achsenpfeilen und sichtbarem Endpunkt.
- Messunsicherheit: ausführlichere Erklärung des Erwartungswerts, neuer Zwischenschritt „Bedeutung von ḡ ± μ_g“
  (68,3 % innen / 31,7 % außen), Diagramm-Legende, Karte mit n = 20 → 30 → 40, neuer Schritt n = 100,
  Zusammenfassung „Drei Größen mit unterschiedlicher Bedeutung“, neue Folie „Gesamtergebnis“ (± und Intervall).
  Schlussbeispiele mit n = 100 und 2 signifikanten Stellen der Unsicherheit.
- Modell: 100 Werte je Durchlauf.
- Rundung (FMU20): ḡ und μ_g mit 2 Nachkommastellen wie die Messwerte, nur bei weiter hinten liegender
  erster signifikanter Stelle von μ_g erweitert (`uncertaintyDecimals`). Diagramm blendet vor der Klammer „systematischer Fehler“ aus (FMU19).

## v0.2.1 — 2026-10-15

Druckknopf (PDF mit dem Endzustand jedes Schritts), Textanker der Diagrammbeschriftungen, zusätzliche
Zwischenhalte im Präsentationsmodus (Strichliste je Spalte, „wahrer Wert“, Unbekannt). Prüfung:
Vorwärts = Rückwärts = Sprung in beiden Modi, keine Warnungen.

## v0.2.0 — 2026-10-15

Kapitel 2 „Standardabweichung“ (8 Schritte) und Kapitel 3 „Messunsicherheit“ (10 Schritte):
σ_g mit 1/(n−1), Intervall ḡ ± σ_g (± und Band), zehn weitere Werte innerhalb/außerhalb,
Strichliste mit angepasstem Text, σ_g(n)-Diagramm; u_g = σ_g/√n, Erwartungswert μ_g,
systematischer Fehler, Konvergenz ḡ(n) mit u_g-Band bis n = 40 samt Zoom, Zusammenfassung
(Tabelle + Abgrenzung), Merke-Folien. Kapitel bauen über stille Vorspänne aufeinander auf.

## v0.1.0 — 2026-10-15

Kapitel 1 „Bestwert“ (6 Schritte, Drehbuch `docs/DREHBUCH.md`). Layout ⅔ Bühne | ⅓ Erläuterungsspalte,
Spaltenschrift ≈ 1,2× „Signifikante Stellen“ (Beamer; bewusste Abweichung vom Karten-Layout oben rechts).
Messwerte je Durchlauf zufällig (Seed in `?s=`, Knopf „Neuer Durchlauf“); μ_g = 9,32 und σ = 1,23 fest,
„wahrer Wert“ 9,81 m/s². Punktdiagramm mit nummerierten Messwerten, Bestwert-Marker aus dem Modell.
MathJax setzt erst nach Layout und Schrift (cqw-Schrift bei Bühnenbreite 0 ergab „Infinity“-Breiten).

## v0.0.1 — 2026-10-15

Gerüst (Kopie von `_scaffold_schritt_animation/`, Schritt-Animation → BACKLOG I19).
Noch ohne Fachinhalt: das Beispiel der Vorlage (Zahlengerade, Rundungsintervall)
dient als Platzhalter. Geplante Kapitel (Tabs, noch deaktiviert): Bestwert,
Standardabweichung, Messunsicherheit. Drehbuch und Fachmodell stehen aus.
Optisch/strukturell angelehnt an `Project_signifikante_stellen_animation`.
