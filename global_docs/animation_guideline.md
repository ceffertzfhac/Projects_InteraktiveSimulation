# Leitlinie: Schritt-Animationen für Physik und Mathematik

> Design-, Didaktik- und Entwicklungsleitlinie für alle `Project_<name>_animation/`.
> Verdichtet aus den PO-Review-Runden zur Referenz-Animation **Signifikante Stellen**
> (→ BACKLOG FSS1–FSS29, B54, 2026-10-01 bis 2026-10-07). Technischer Bauplan:
> `global_docs/simulation_instruction.md` §10; Repo-Regeln: `CLAUDE.md`.
> Bei Konflikt gilt `CLAUDE.md`; diese Leitlinie ergänzt, sie ersetzt nichts.

Zielbild: Eine Animation, die ein Dozent **ohne Vorbereitung im Hörsaal** vorführen kann
und die Studierende **im Lernvideo ohne Ton** verstehen — fachlich exakt, ruhig, hochwertig,
jede Zahl nachrechenbar, jede Folie kollisionsfrei.

---

## 1. Didaktik — was gezeigt wird

### 1.1 Ein durchgehendes Beispiel, realistische Werte
- **Ein roter Faden pro Kapitel** (ein Stab, ein Auto, zwei Werkstücke). Neue Beispiele nur,
  wenn sie etwas Neues zeigen.
- **Keine runden Zahlen.** 3,1203 m statt 3 m: An runden Zahlen sieht man den Effekt nicht
  (bei „3,0“ ist unklar, welche Ziffer gesichert ist).
- **„Wahre“ Werte konsistent genau** angeben (z. B. alle mit 5 signifikanten Stellen) — als
  wären sie mit *einem* sehr genauen Gerät bestimmt. Gemischte Genauigkeit verwirrt.
- Jede angezeigte Zahl stammt aus einem **DOM-freien Modell** (`model.js`, Vitest) —
  nie Zahlen von Hand in Folientext oder Bühne tippen.

### 1.2 Den Vorgang zeigen, nicht nur das Ergebnis
- Physikalische Handlungen werden **inszeniert**: das Maßband rollt aus dem Gehäuse aus,
  die Lupe zeigt die Ablesung, das Etikett wird aufgeklebt, die Uhr läuft mit dem Auto.
- Objekte sind **als das erkennbar, was sie sind** (Metallstab zylindrisch mit Stirnfläche,
  Messstrich durch die Mitte der Stirnfläche).
- **Verschiedene Objekte sehen verschieden aus** (andere Metallfarbe) — derselbe Stab,
  nur verschoben, suggeriert etwas Falsches.
- Physische Bewegungen eher langsam (Tempo 0,75 gegenüber dem ersten Entwurf);
  errechnete Live-Werte mindestens 1 s stehen lassen.

### 1.3 Reihenfolge der Begriffe
- **Voraussetzungen zuerst.** Was später gebraucht wird (z. B. Einheiten umrechnen), steht
  in den Grundlagen — nicht erst dort, wo es zum ersten Mal stört.
- **Nichts vorwegnehmen.** Begriffe, die noch nicht eingeführt sind, tauchen nicht auf
  (keine „Auflösung 0,01 s“, bevor über Auflösung gesprochen wurde — die Anzeige zeigt es).
- **Zwischenstufen zeigen**, wo ein Sprung zu groß wäre (3,1 → *3,13* → seitlich 3,12 →
  3,120: erst zeigen, dass dieselbe Teilung andere Stäbe anders abliest).
- **Verallgemeinern**, sobald ein Prinzip an einem Fall verstanden ist („Das gilt für alle
  Messwerte – zum Beispiel für Zeiten“; „jeder Messwert – und damit fast jede physikalische
  Größe“).

### 1.4 Falsch → richtig, Vergleich statt Behauptung
- Typische Fehler **zuerst explizit zeigen und markieren** (✗), dann die richtige Form (✓):
  „0,8 m ≠ 800 mm“ vor „0,8 m = 0,8 · 10³ mm“; „310 cm“ mit vorgetäuschter Null.
- Regeln aus **Beobachtung** ableiten: erst rechnen (größtmöglich, kleinstmöglich,
  Taschenrechner), dann vergleichen, dann die Regel.
- **Taschenrechner-Wert** immer mit allen Stellen zeigen, dann sichtbar **runden**
  (Rechnerzeile „⟶ runden ⟶ Ergebnis“); das gerundete Ergebnis ist das Prominenteste.
- Listen von Varianten (alle Ecken, alle Kombinationen): **farbcodiert** (Farbe = Treffer
  im Bild), **nach Größe sortieren**, Extreme markieren, Uninteressantes **entfernen**.
- Bei offener Didaktik-Frage (z. B. 3 · 2 oder 3 · 2,1) **beide Varianten bauen** und den
  PO vergleichen lassen — nicht vorab entscheiden.

### 1.5 Sprache
- **Präzise Fachsprache, keine schiefen Metaphern.** Ersetzt wurden u. a. „Kette“ (→ „hintereinander“,
  „Gesamtlänge“), „ehrlich umrechnen“ (→ „die signifikanten Stellen bleiben erhalten“),
  „abgelesen“ (→ „abgelesener Messwert“).
- **Grafische Zeichen nicht doppeldeutig:** Eine Klammer liest sich wie ein Intervall —
  „unsicher“ ist ein **Pfeil** auf die Ziffer, „gesichert“ eine Klammer.
- **Regeln vollständig und mit Rechenart:** „Das Ergebnis *einer Multiplikation* hat so
  viele signifikante Stellen wie der Faktor mit den wenigsten *signifikanten Stellen*.“
- **Regeln kurz, merkbar, parallel gebaut** und fachdidaktisch belegt (Recherche vor dem
  Formulieren; Quelle im CHANGELOG): mal/geteilt → signifikante Stellen,
  plus/minus → Nachkommastellen (+ Voraussetzung „gleiche Einheit“).
- Neutrale Beschriftungen („Beispiel A / B“ statt „einfach / komplexer“).
- Bezug zur Prüfungspraxis herstellen („In den Übungen und in der Klausur: …“).

### 1.6 Kapitelaufbau
Jedes Kapitel endet gleich:
1. **Zusammenfassung — Vergleich** (Vollfolie): Tabelle aller Rechnungen, Zeilen erscheinen
   nacheinander, Gruppen per Klammer beschriftet (z. B. „Rechteck“ / „Kreis“) + **Beobachtung**.
2. **Zusammenfassung — Begründung und Regel** (gleiche Folie, zweiter Schritt).
3. **Merke** (eigene Vollfolie): nur die Regel als Überschrift + **ein** Kasten „Beispiele“.
   Keine Herleitung, keine Grenzen-Formeln, keine Vergleichstabellen mit anderen Kapiteln.

Ein Abschlusskapitel „Zusammenfassung“ wiederholt je Rechenart Regel + Beispiel A/B.

---

## 2. Gestaltung — wie es aussieht

### 2.1 Bühne und Karten
- Bühne 16:9 (1200 × 675), Folienkarten als HTML-Overlay, **rechts oben bündig** (gleiche
  Position in allen Kapiteln). Bühneninhalt reserviert die Kartenfläche — nichts Wichtiges
  darunter.
- Karten werden **nicht überladen**: Kommt eine Zeile (Rechner, Ergebnis) hinzu, Bühne
  anpassen statt Karte verlängern, bis sie eine Tafel verdeckt.
- **Jedes Ergebnis einmal je Folie** (FSS36): Zeigen Bühne/Tafel und Karte dasselbe (z. B.
  das gerundete Ergebnis), bleibt es dort, wo es *entsteht* (Tafel), und die Karte verzichtet
  darauf. Vor dem Vergrößern einer Karte oder Tafel erst Doppelungen streichen.
- **Wachsende Tafeln wachsen nach unten, nicht zur Seite:** ein Folgeschritt (Runden) bekommt
  eine eigene Zeile unter den Ziffernreihen, stellengenau ausgerichtet — rechts neben langen
  Ziffernreihen ist kein Platz.
- **Vollfolien** (Zusammenfassung, Merke) decken die Bühne **randlos** ab — kein Inhalt
  darf am Rand durchscheinen.
- Lange Rechnungen und Listen in **voller Kartenschrift** — lieber Karte breiter (bis 40 %
  der Bühne) als Schrift auf 84 %.

### 2.2 Kollisionsfreiheit (Prüfpflicht)
- Keine Beschriftung unter einer Karte, auf einem Pfeil, in einer Achse oder einer anderen
  Beschriftung. Achsenname („*l* / m“) frei vom Pfeilkopf.
- Text, der über Linien laufen kann, bekommt einen **Halo** (`paint-order: stroke` in
  Bühnenhintergrundfarbe).
- **Markierungen treffen exakt:** Kästen/Pfeile auf Ziffern werden aus Textmaßen berechnet —
  erst **nach dem Laden der Web-Schrift** (die Engine zeichnet bei `document.fonts`-Ereignissen
  neu). Prüfen, dass wirklich die gemeinte Ziffer markiert ist.
- Prüfen: **jeder Schritt-Endzustand** in beiden Modi, dazu kritische Zwischenzustände,
  hell **und** dunkel, Fensterbreiten 900 / 1100 / 1280 / 1600 px.

### 2.3 Typografie und Zahlen
- Größen kursiv, Einheiten aufrecht, Komma als Dezimaltrenner, „Größe / Einheit“ an jeder
  Achse und Zahlengeraden.
- **Echte Hochstellung** (10² als `10` + hochgestellte 2), keine breiten Mono-Glyphen.
- Unsichere Ziffer: bernsteinfarben (`--c-unc`), überall gleich; gesichert normal; „sinnlos“
  grau durchgestrichen. Gerundetes Ergebnis: Akzentfarbe, größer, als Plakette.
- Tabellen: Spalten bündig, Farben über Klassen (nicht über Spaltenposition), Legende
  **mittig** über der Tabelle.
- MathJax nur statisch (beim Laden), dynamische Zahlen über `data-dyn`-Spans.

### 2.4 Farbe
- Nur Design-Tokens (Dark Mode automatisch). Akzent = Ergebnis/Hervorhebung,
  Bernstein = Unsicherheit, Okabe-Ito-Blau/Zinnober für die beiden Größen,
  Kategorialfarben `--c-p1…p4` für aufgezählte Varianten (gleiche Farbe Bild ↔ Liste).
- Physische Objekte (Maßband gelb, Holz, Metall) in beiden Themes ähnlich.

---

## 3. Bedienung — wie man damit arbeitet

| Taste / Element | Funktion |
|---|---|
| → / Leertaste / ← | Schritt vor / zurück (Zurück spult sichtbar, 2,5-fach) |
| P | Auto-Play (Haltezeit je Schritt `hold`, Tempo 0,5× / 1× / 2×) |
| **A** | **Animations- ↔ Präsentationsmodus** (kein sichtbarer Schalter, kurze Einblendung) |
| F / H | Vollbild (im Animationsmodus ohne Topbar, Bühne größer) / Bedienung ausblenden (Aufnahme) |
| Pos1 / Ende | Anfang / Ende |
| Adresse `#kapitel/schritt` bzw. `#kapitel/p<schritt>` | Neuladen bleibt an der Stelle; Links auf Schritte |
| Druckersymbol | PDF mit dem Endzustand jedes Schritts (Kapitel oder alle, aktiver Modus) |

**Präsentationsmodus:** etwa 2,5–3-mal so viele Schritte. Halte an didaktischen Stellen:
vor jedem Messvorgang, je Objekt/Treffer, vor Intervall/Fehlerpfeilen, an der **ersten
abweichenden Ziffer** des Ziffernvergleichs, je Zeile/Beispiel in Zusammenfassungen.
Der Animationsmodus spielt dieselbe Timeline ohne diese Halte.

---

## 4. Technik — wie es gebaut wird

1. **Reversibilität:** `build(tl, S)` nur `to/fromTo/set` auf Zahlen bzw. DOM-Stile —
   keine Callbacks mit Seiteneffekten. Texte = Index in Tabellen.
2. **Zwischenhalte:** `beat(tl)` (aus `shared/js/step-engine.js`) am Ende des bisher Gebauten;
   der nächste Tween bezieht sich automatisch auf den Halt. Kein negativer Versatz direkt
   danach. Die Engine warnt bei Tweens, die über einen Halt laufen — Warnungen = Fehler.
3. **Kamera** über Weltkoordinaten (`viewOf`), nie über die `viewBox`; Zoom logarithmisch.
4. **Kapitel, die aufeinander aufbauen**, spielen den Vorgänger still als Vorspann ab.
5. **Bühnenplatz planen:** Geometrie-Konstanten so wählen, dass Karte, Tafeln, Achsen und
   Beschriftungen in **allen** Schritten getrennt bleiben (Plotbreite, Achsen-y, Tabellen-x).
6. Gemeinsame Bausteine wiederverwenden (`stellen.js`-artige Module: Vergleichstafel,
   Taschenrechner, Zusammenfassung) statt pro Kapitel neu.

---

## 5. Arbeitsweise mit dem Product Owner

1. **Feedback zuerst ins Backlog** (`BACKLOG.md`, eine ID je Punkt, Nachträge am Eintrag),
   gesammelt; Unklares mit konkretem Formulierungsvorschlag zurückfragen.
2. **Gebündelt umsetzen:** ein Commit je Punkt, Version +0.0.1 je Commit
   (Minor beim Abschluss einer Runde), CHANGELOG-Eintrag, `sync-webpage.sh` + Drift-Check.
3. **Schlusskontrolle** jeder Runde (Abschnitt 6), dann Bericht mit offenen PO-Entscheidungen.
4. Merge und Push **nur auf ausdrückliches Kommando**.

---

## 6. Abnahme-Checkliste (vor jedem Bericht)

- [ ] Jeder Schritt-Endzustand angesehen — Animations- **und** Präsentationsmodus, hell, Stichprobe dunkel
- [ ] Keine Kollision, kein Text unter Karten, keine abgeschnittene Beschriftung, Vollfolien randlos
- [ ] Jede Markierung trifft die gemeinte Ziffer (nach Schrift-Laden gemessen)
- [ ] Vorwärts = Rückwärts = Sprung (sichtbarer Zustand) in beiden Modi
- [ ] Auto-Play läuft durch alle Kapitel, keine Konsolenfehler, keine NaN-Attribute, keine Halt-Warnungen
- [ ] Druck: Seitenzahl = Schrittzahl des aktiven Modus
- [ ] Präsentationsmodus ≈ 2,5–3× Schritte, Halte didaktisch sinnvoll
- [ ] Regeln vollständig, mit Rechenart, kurz; keine vorweggenommenen Begriffe; keine schiefen Metaphern
- [ ] Fensterbreiten 900–1600 px (Transportleiste, Titel)
- [ ] Vitest grün, Version `index.html` = CHANGELOG, Webpage synchron

Werkzeuge: `.claude/skills/create-step-animation/scripts/` (headless Aufnahmen, Reversibilitäts-,
Modus- und Auto-Play-Prüfung).
