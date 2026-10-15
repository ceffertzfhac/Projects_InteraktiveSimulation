# Drehbuch: Bestwert, Standardabweichung, Messunsicherheit (N11)

Entwurf 2026-10-15, nach PO-Diktat. Status: **zur Freigabe**.

## Rahmen

- **Zielgruppe:** Erstsemester Ingenieurwissenschaften, Einführung ins physikalische Praktikum.
- **Lernziel:** Bestwert ḡ, Standardabweichung σ_g und Messunsicherheit u_g (Typ A) unterscheiden –
  was sie bedeuten und was nicht. Bestwert ↔ Erwartungswert μ_g ↔ „wahrer Wert“ trennen.
- **Beispiel:** Messung der Fallbeschleunigung *g*. „Wahrer Wert“ 9,81 m/s² (immer in Anführungszeichen),
  Erwartungswert des Messaufbaus μ_g = 9,32 m/s² (systematischer Fehler), σ der Verteilung = 1,23 m/s².
- **Zufall:** μ_g und σ fest, nur die Messwerte sind pro Durchlauf zufällig (Seed im URL-Hash,
  Knopf „Neuer Durchlauf“). 40 Werte werden einmal erzeugt; Schritte nutzen die ersten 10 / 20 / 30 / 40.
  Alle Texte mit Zahlen laufen über `data-dyn`; Strichlisten-Text passt sich dem Ergebnis an.
- **Layout:** Zwei Spalten, ⅔ Bühne (Visual) | ⅓ Erläuterung; Schrift ≈ 1,2× „Signifikante Stellen“.
- **Nomenklatur:** `\bar g`, `\sigma_g`, `u_g = \sigma_g/\sqrt n`, `\mu_g`. σ_g mit 1/(n−1).
- **Tonspur:** Mechanismus („Angenommen, wir würden die Messung unendlich oft wiederholen …“)
  wird gesprochen; die Folie zeigt nur, was ist.
- **Kapitelenden:** K1 und K2 je Merke-Vollfolie; K3 Zusammenfassung (2 Schritte) + Merke.

## Kapitel 1 – Bestwert

| # | Titel | Karte | Bühne | Halte |
|---|---|---|---|---|
| 1 | Messgröße | Wir wollen *g* messen | Zahlengerade *g* / (m/s²) wird gezeichnet | – |
| 2 | „Wahrer Wert“ | „Wahrer Wert“ der Messgröße: 9,81 m/s² | breiter Strich bei 9,81 | nach dem Strich |
| 3 | Unbekannt | Dieser Wert ist uns unbekannt | Strich wird blass, bleibt sichtbar | – |
| 4 | Messreihe | Wir messen *n* = 10 mal | zehn Punkte erscheinen nacheinander, nummeriert *g*₁…*g*₁₀ | nach 1. Punkt (jeder Wert anders), nach 10. |
| 5 | Bestwert | ḡ = (1/n) Σ *g*ᵢ, Rechnerzeile | Nummern blenden aus, Marker ḡ | vor Formel, vor Ergebnis |
| 6 | Merke 1 | Bestwert = Mittelwert der Messreihe, beste Schätzung aus dieser Serie | Vollfolie | – |

## Kapitel 2 – Standardabweichung

| # | Titel | Karte | Bühne | Halte |
|---|---|---|---|---|
| 1 | Streuung | σ_g = √(Σ(gᵢ−ḡ)²/(n−1)), Rechnerzeile | Abstände der Punkte zu ḡ kurz markiert | vor Formel, vor Ergebnis |
| 2 | Intervall ḡ ± σ_g | ≈ 68,3 % der nächsten Messwerte liegen in ḡ ± σ_g (normalverteilt) | ± -Darstellung + Intervallband auf der Geraden (wie Rundungsintervalle) | vor Band |
| 3 | Zehn weitere Werte | Liegen die neuen Werte im Intervall? | Punkte erscheinen, innen / außen eingefärbt | je 5 Punkte |
| 4 | Strichliste | Strichliste innen / außen, Vergleich mit 68 % (Text dynamisch, bei 10 Werten schwankt der Anteil stark) | Strichliste | vor Vergleich |
| 5 | Neue Auswertung | n = 20: ḡ und σ_g neu | alter Marker wandert auf neuen ḡ, Intervall passt sich an | vor Verschiebung |
| 6 | σ_g konvergiert | Mehr Messungen verkleinern σ_g nicht systematisch | Diagramm σ_g(n), n = 2…40: schwankt am Anfang, dann konstant | vor Diagramm, am Ende |
| 7 | Was σ_g beschreibt | Maß für Messaufbau, Messumstände, Messmittel (mittlerer Fehler der Einzelwerte) | Karte | – |
| 8 | Merke 2 | σ_g beschreibt die Streuung der Einzelwerte, nicht die Güte des Bestwerts | Vollfolie | – |

## Kapitel 3 – Messunsicherheit

Startet still im Endzustand von K2 (n = 20).

| # | Titel | Karte | Bühne | Halte |
|---|---|---|---|---|
| 1 | Messunsicherheit | u_g = σ_g/√n, Rechnerzeile | Formel, Wert; Marker mit Band ḡ ± u_g | vor Ergebnis |
| 2 | Maß für die Serie | u_g bewertet die ganze Messserie; durch √n wird sie mit mehr Messungen kleiner | Karte, Band | – |
| 3 | Erwartungswert | μ_g: Wert des Bestwerts bei unendlich oft wiederholter Messserie (Text: nur was ist) | Marker μ_g = 9,32 erscheint | vor Marker |
| 4 | μ_g ≠ „wahrer Wert“ | Der Abstand ist der systematische Fehler | „wahrer Wert“ 9,81 wieder kräftig, Klammer μ_g ↔ 9,81 | vor Klammer |
| 5 | Konvergenz | ḡ nähert sich μ_g, u_g sinkt | n = 20 → 30 → 40, Zoom auf u_g-Band, Diagramm ḡ(n), u_g(n) | je Zehnerschritt |
| 6 | Bedeutung von ḡ ± u_g | μ_g liegt mit ≈ 68,3 % in ḡ ± u_g, nicht der „wahre Wert“ | Intervall auf Gerade, μ_g darin | vor Intervall |
| 7 | Grenze eines Experiments | Ein Experiment nähert μ_g, nicht automatisch *g*; Abhilfe: rigorose Betrachtung der Systematik oder mehrere unabhängige Messaufbauten | Karte | – |
| 8 | Zusammenfassung – Vergleich | Tabelle ḡ / σ_g / u_g: Formel, beschreibt, beschreibt nicht | Vollfolie, Zeilen nacheinander | je Zeile |
| 9 | Zusammenfassung – Abgrenzung | ḡ ↔ μ_g ↔ „wahrer Wert“ | gleiche Folie | je Zeile |
| 10 | Merke 3 | u_g = σ_g/√n; ḡ ± u_g grenzt μ_g ein | Vollfolie + Logo | – |

Summe: 6 + 8 + 10 = 24 Schritte, Präsentationsmodus ≈ 60 Halte.

## Technische Folgen

- `model.js`: Seed-RNG (mulberry32 + Box-Muller), `draw(seed, n)`, `bestwert`, `stabw(n−1)`, `unsicherheit`,
  `innen/außen`, Reihen ḡ(n), σ_g(n), u_g(n) für n = 2…40. Vitest.
- Engine: Zwei-Spalten-Layout (⅔|⅓) statt Karte oben rechts, Schrift ×1,2 → Abweichung vom Standard,
  in CHANGELOG und Leitlinie festhalten.
- Rundung: u_g auf 2 signifikante Stellen, ḡ und σ_g auf dieselbe Nachkommastelle (Bezug „Signifikante Stellen“).
