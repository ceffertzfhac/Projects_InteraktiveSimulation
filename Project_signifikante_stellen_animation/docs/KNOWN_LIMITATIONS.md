# Bekannte Einschränkungen – Signifikante Stellen

Bewußte lokale Einschränkungen und Scope-Entscheidungen. Offene Arbeit steht
zentral in `BACKLOG.md`.

- **Kapitel „Addition" fehlt noch** — Tab ist sichtbar, aber deaktiviert. → FSS1
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
  Bewußt einheitliche Konvention mit Kapitel 1. → FSS4
- **„Unsicher" nach Faustregel, nicht nach Schwellwert** — welche Ziffer als letzte
  (unsichere) gilt, bestimmt die Faustregel (Stellenzahl des ungenauesten Faktors). Das
  Intervall ist in dieser Stelle je nach Rechnung 0,5 bis 5 Einheiten breit (z. B.
  1 · 10¹ m/s: 0,5 Zehner; 6,000 m²: 5 Tausendstel), eine Stelle davor zehnmal weniger.
  Ein fester Schwellwert existiert nicht; die Folien sagen das ausdrücklich. → FSS5
- **Kapitel Multiplikation startet aus dem Endzustand der Grundlagen** — dessen Schritte
  werden beim Kapitelwechsel still vorab abgespielt (`ui.js multEngine`); Änderungen an
  den Grundlagen wirken sich daher auf den Startzustand der Multiplikation aus. → FSS5
