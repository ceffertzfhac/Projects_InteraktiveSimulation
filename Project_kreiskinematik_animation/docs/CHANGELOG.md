# Changelog – Kreiskinematik und Vektorrechnung (Schritt-Animation)

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
