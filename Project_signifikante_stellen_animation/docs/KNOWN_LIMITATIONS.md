# Bekannte Einschränkungen – Signifikante Stellen

Bewußte lokale Einschränkungen und Scope-Entscheidungen. Offene Arbeit steht
zentral in `BACKLOG.md`.

- **Kapitel „Addition" fehlt noch** — Tab ist sichtbar, aber deaktiviert. → FSS1
- **Nicht öffentlich** — nur auf der internen Übersicht `AllAnimations/`; die
  Sync-/Drift-Skripte kennen den Ordnernamen `_animation` noch nicht. → FSS3
- **Kein Vorschaubild** — Karte nutzt den CSS-Platzhalter. → FSS2
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
