# Rollende Körper - Interaktive Physik-Simulation

Diese Web-Applikation simuliert die Dynamik verschiedener geometrischer Körper (Zylinder, Kugeln, Hohlkörper) auf einer schiefen Ebene oder einer horizontalen Fläche. Sie ist primär für den Einsatz in der Physik-Lehre konzipiert.

## 🚀 Schnellstart

Da die App moderne JavaScript-Module (ESM) verwendet, ist ein lokaler Webserver erforderlich:

```bash
# Empfohlen:
npx serve .

# Alternativ (Python):
python3 -m http.server
```

Öffnen Sie anschließend `http://localhost:3000` (oder den entsprechenden Port) in Ihrem Browser.

## 🛠 Features

- **Verschiedene Körper:** Voll-/Hohlzylinder und Voll-/Hohlkugeln mit einstellbarem Innenradius.
- **Echtzeit-Physik:** Berechnung von Beschleunigung, Geschwindigkeit und Position basierend auf dem Trägheitsmoment (Formfaktor $k$).
- **Energiebilanz:** Visualisierung der Umwandlung von potentieller Energie in translatorische und rotatorische kinetische Energie.
- **Analyse-Tools:** 
  - Verfolgung von Punkten auf dem Körper (Zykloiden).
  - Dynamische Vektoren für Geschwindigkeiten, Beschleunigungen und Kräfte ($F_g, F_N, F_R$).
  - Interaktive Diagramme mit wissenschaftlicher Notation.
- **Daten-Export:** CSV-Export der Simulationsdaten (kompatibel mit Excel/LibreOffice).

## 🏗 Architektur

Das Projekt ist modular aufgebaut:

- `js/state.js`: Zentrales Zustandsmanagement (`store`) und DOM-Caching.
- `js/physics.js`: Analytische Lösung der Bewegungsgleichungen und Pfad-Vorausberechnung.
- `js/render.js`: SVG-basierte Grafik-Engine für die Simulation und die Graphen.
- `js/ui.js`: Event-Handling und Steuerung der Simulations-Loop.
- `js/constants.js`: Physikalische und technische Konstanten.

## 📐 Physikalische Grundlagen

### Beschleunigung
Die Beschleunigung $a$ des Schwerpunktes berechnet sich aus:
$$a = \frac{g \cdot \sin(\alpha)}{1 + k}$$
wobei $k = \frac{I}{mR^2}$ der Formfaktor des Körpers ist.

### Rollbedingung
Damit der Körper rein rollt (ohne zu gleiten), muss gelten:
$$\mu_s \geq \frac{\tan(\alpha)}{1 + \frac{1}{k}}$$

## 📜 Dokumentation
Weitere Details finden Sie im Verzeichnis `docs/`:
- `CHANGELOG.md`: Historie der Änderungen.
- `issues.md`: Aktuelle Probleme und gelöste Aufgaben im Blog-Stil.
- `ARCHITECTURE.md`: (Optional) Tiefergehende architektonische Details.

## ⚖️ Lizenz
MIT
