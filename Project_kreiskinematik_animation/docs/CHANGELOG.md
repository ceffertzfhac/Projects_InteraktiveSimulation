# Changelog – Kreiskinematik und Vektorrechnung (Schritt-Animation)

## v0.2.1 — 2026-11-28

Code-Stil: Zeilen über ~100 Zeichen umbrochen (constants, ui; shared/js/step-3d.js). Keine Verhaltensänderung.

## v0.2.0 — 2026-11-28

Technischer Durchstich (→ FKI2, FKI3.1–3.3, E23) als Kapitel „Durchstich 3D“ (4 Schritte,
Präsentationsmodus 10 Halte; kein Vorspann für die übrigen Kapitel):
- 3D-Bühne über das neue Shared-Modul `shared/js/step-3d.js` (Three.js 0.170.0, CDN gepinnt):
  Kamera aus Szenen-Zahlen (Azimut, Elevation, Abstand, Zielpunkt), Pfeile (Spitze endet am Ziel,
  zu kurze Pfeile ausgeblendet), halbtransparente Ebene (zuletzt gezeichnet → verdeckte Teile
  getönt), Kugeln, Röhren
- Koordinatensystem rechtshändig, *y* oben, *z* aus dem Bildschirm (E4); baut sich in der
  Frontansicht auf und dreht per Kamerafahrt in die typische Lage
- freies Drehen (Ziehen) und Zoomen (Mausrad) nur bei Pause; nächster Schritt, Auto-Play,
  Taste R und Knopf „⟲ Ansicht“ fahren weich zur Drehbuch-Kamera zurück (E12)
- MathJax-Beschriftung folgt der Pfeilspitze (HTML-Overlay), auch beim Drehen; nur beim ersten
  Erscheinen, danach Legende unten in der Formelspalte mit nur den sichtbaren Vektoren (E13)
- Vorlesungspalette hell/dunkel (I26, E7); *n* Grau → Mint beim Wechsel zu *ω*
- Druck/PDF: Endzustand je Schritt mit WebGL-Bild und Beschriftungen

## v0.1.1 — 2026-11-28

DOM-freies Modell `js/model.js` (→ FKI4): Vektorrechnung; Ebenen P0 (*z* = 0), P1 (*z* = 2),
P2 (*x* = 2), P2′ (*x* = 3), P3 (*x* + *y* − 2*z* = 6), P4 (*y* = 2) mit Mittelpunkten auf der Achse
durch den Ursprung und rechtshändiger Basis (E8–E10); *v*_T = *ω* × *r*, *a*_Z = *ω* × (*ω* × *r*),
*a*_T = *α* × *r*, *a* = *a*_T + *a*_Z, Bremsfall mit Umkehr (E14–E18); archimedische Spirale in P3
mit Mittelpunkt als Projektion von *r*(0) (E20, E21). Vitest `test/kreiskinematik.model.test.js`
(11 Tests: Kreuzprodukte = Ableitungen, |*v*| = *ωR*, *a*_Z ∥ −(*r* − *r*_M), Ebenengleichungen).

## v0.1.0 — 2026-11-28

Projektgerüst aus `_scaffold_schritt_animation/` (→ BACKLOG N12, FKI1).
- Ordner `Project_Animation_Kreisbwegung/` → `Project_kreiskinematik_animation/` (E6),
  Ablaufskript nach `docs/ABLAUFSKRIPT.md`
- fünf Kapitel-Reiter = Szenen 1–5 (Normalform der Ebene, Kreisbahn, Winkelgeschwindigkeit,
  Beschleunigung, Spiralbahn); Kapitel 2–5 noch „bald“
- Layout ⅔ 3D-Bühne | ⅓ Formelspalte (E3, wie Messunsicherheit), Druckknopf
- intern auf `AllAnimations/` (Kap. 1.4), nicht öffentlich (E24)
- **Begründete Ausnahme** (Leitlinie §1.6): Tonspur-Animation ohne Zusammenfassungs- und
  Merke-Folien, Logo groß nur am Schluss von Kapitel 5 (E5, E25)
