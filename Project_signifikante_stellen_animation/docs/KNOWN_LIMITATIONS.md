# Bekannte Einschränkungen – Signifikante Stellen

Bewußte lokale Einschränkungen und Scope-Entscheidungen. Offene Arbeit steht
zentral in `BACKLOG.md`.

- **Online-Abhängigkeit** — GSAP und MathJax kommen per CDN. Ohne Internet
  (Hörsaal-WLAN!) startet die Animation nicht. Für Vorlesungen vorher prüfen
  oder als Lernvideo aufzeichnen. → I19
- **Beispielwerte fest verdrahtet** (PO-Entscheidung 2026-10-01) — keine
  Eingabefelder; andere Werte = `js/constants.js` ändern.
- **Keine Diagramm-/CSV-/Hover-Funktionen** — bewußt, Projekttyp
  Schritt-Animation (Blueprint §10).
- **Rundungsregel als Faustregel** — „so viele signifikante Stellen wie der
  ungenaueste Faktor" ist eine Näherung: die letzte Stelle kann um mehr als
  ±½ unsicher sein (bei 3,000 · 2,000 liegt *A* zwischen 5,9975 und 6,0025).
  Die Folien zeigen deshalb immer den exakten Bereich mit an.
- **`formatSig` für Werte ≥ 1 ausgelegt** — Rundung großer Zahlen auf weniger
  Stellen als Vorkommastellen (z. B. 650 → 6,5·10²) ist nicht vorgesehen.
- **Kapitel „Division": idealisierte Zeitmessung** — Person B stoppt ohne Reaktionszeit
  (Folie sagt es), die Anzeige der Digitaluhr wird wie alle Messwerte als ±½ der
  letzten Stelle gelesen; reale Stoppuhren schneiden meist ab (1,42 s → [1,42 ; 1,43) s).
  Bewußt einheitliche Konvention mit Kapitel 1. Der Sekundenzeiger gleitet (echte Uhren
  springen; PO 2026-10-02: bleibt so, da sonst neue Fragen) — im Info-Knopf „Bekannte
  Vereinfachungen" der Animation erklärt. → FSS4
- **„Unsicher" nach Faustregel, nicht nach Schwellwert** — welche Ziffer als letzte
  (unsichere) gilt, bestimmt die Faustregel (Stellenzahl des ungenauesten Faktors). Das
  Intervall ist in dieser Stelle je nach Rechnung 0,5 bis 5 Einheiten breit (z. B.
  1 · 10¹ m/s: 0,5 Zehner; 6,686 m²: 5 Tausendstel), eine Stelle davor zehnmal weniger.
  Ein fester Schwellwert existiert nicht; die Folien sagen das ausdrücklich. → FSS5
- **Ziffernvergleich an Übertragsgrenzen** — „erste abweichende Ziffer von Minimum und
  Maximum" versagt, wenn das Intervall eine Übertragsgrenze überdeckt (9,98 / 10,03; auch
  Division Person A: 8,97 / 9,47 → schon die erste Ziffer verschieden, Faustregel sagt 9,2).
  Die Rechteck- und Kreisbeispiele sind so gewählt, daß Vergleich und Faustregel
  übereinstimmen (Vitest). Hinweis im Info-Knopf. → FSS6
- **Urteil der Lupe folgt der Faustregel, nicht einem Schwellwert** — dasselbe Verhältnis
  kann je nach Beispiel verschieden beurteilt werden: „6,69" (Klammer 2× breiter) heißt
  „verschenkt Wissen", „21 m" (Klammer 2× breiter) „letzte Ziffer unsicher ✓". Grund: Beim
  Rechteck ist die nächste Angabe 6,686 (Band 5×) noch vertretbar, beim Kreis 20,7 (Band 6×)
  nicht mehr. Siehe Eintrag „Unsicher nach Faustregel". → FSS6
- **Kapitel Multiplikation startet aus dem Endzustand der Grundlagen** — dessen Schritte
  werden beim Kapitelwechsel still vorab abgespielt (`ui.js multEngine`); Änderungen an
  den Grundlagen wirken sich daher auf den Startzustand der Multiplikation aus. → FSS5
- **Kapitel „Addition": „1,0-m-Maßband" als 0,1-m-Teilung gelesen** — Stab A wird auf
  eine Nachkommastelle abgelesen (0,4 m). Bei 1-m-Teilung bräuchte das Gegenbeispiel große
  Werte (z. B. 12 m + 0,047 m). Subtraktion (Verlust signifikanter Stellen) ist nicht
  enthalten — möglicher Ausbau. → FSS1
