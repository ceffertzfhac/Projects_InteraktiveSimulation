# Changelog – Vorlage: Schritt-Animation

## v0.1.0 — 2026-10-01

Minimal lauffähige Vorlage für den Projekttyp **Schritt-Animation** (→ BACKLOG
I19, Blueprint §10). Beispiel in 4 Schritten: Zahlengerade zeichnet sich ein,
Messpunkt „2", Rundungsintervall, Zoom ×10 auf „2,0".

Demonstriert die verbindlichen Muster:
- Modulsplit `constants` · `state` (Szene aus Zahlen) · `model` (DOM-frei) ·
  `steps` (Drehbuch) · `render` · `ui` (Einstieg)
- `shared/js/step-engine.js`: Engine (Timeline mit Schritt-Labels) + Presenter
  (Transportleiste, Kapitel-Tabs, Tastatur, Vollbild, Bedienung ausblenden)
- `shared/js/step-kit.js`: Kamera (`createCamera`, Anker-Zoom), Achse mit
  Zoom-Ticks (`createAxis`), Folienkarten (`createCardDeck`), überblendende
  Label-Slots (`createSlots`)
- Reversibilitäts-Regel: nur Tweens/Sets auf Zahlen → Zurück exakt
- statische MathJax-Folienkarten, Dark Mode über Tokens, Physik-Logo
