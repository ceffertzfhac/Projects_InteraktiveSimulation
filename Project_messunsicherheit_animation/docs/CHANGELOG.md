# Changelog – Bestwert, Standardabweichung, Messunsicherheit

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
