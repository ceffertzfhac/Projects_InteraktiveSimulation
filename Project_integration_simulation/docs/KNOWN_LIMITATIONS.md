# Known Limitations — Die Integration als Grenzwert

Bewußte lokale Einschränkungen, Won't-/Scope-Entscheidungen und Housekeeping.
Bugs, Features und Tech-Schulden werden zentral in `../../BACKLOG.md` getrackt
(siehe `## KONVENTIONEN` dort).

## Bewußte Scope-Entscheidungen

- **Keine Vorzeichenfläche (PO-Entscheidung 2026-09-17).** Bei der Klärung
  standen „Ober-/Untersumme (Einschachtelung)", „Vorzeichenfläche zur x-Achse"
  und „beides" zur Wahl; gewählt wurde die **Einschachtelung**. Alle vier
  Funktionen sind deshalb auf \(x \in [0, 10]\) strikt positiv, damit „Fläche
  unter der Kurve" wörtlich gilt und keine Vorzeichendiskussion nötig ist
  (per Vitest-Test abgesichert). Der Code rechnet trotzdem **vorzeichenrichtig**
  (kein `Math.abs` auf Funktionswerten, Rechtecke über `Math.min`/`Math.abs`
  gegen die Nulllinie) — eine Funktion mit Nulldurchgang ließe sich ohne
  Änderung an Physik oder Zeichnung ergänzen.

- **Nur drei Verfahren: Unter-, Obersumme, Mittelpunktsregel** (PO-Auswahl
  2026-09-17). Bewußt **nicht** aufgenommen: linke/rechte Rechtecksumme
  (bei monotonen Funktionen identisch mit Unter-/Obersumme, didaktisch
  redundant) und die Trapezregel (verschiebt den Fokus von der Einschachtelung
  auf die Fehlerordnung).

- **Fester Definitionsbereich \(x \in [0, 10]\)** mit vier fest hinterlegten
  Funktionen. Keine freie Funktionseingabe — bewußt didaktisch reduziert,
  analog zur Schwester-Sim „Die Ableitung als Grenzwert". Jede Funktion bringt
  eine analytische Stammfunktion **und** ihre kritischen Stellen mit; darauf
  beruhen der exakte Integralwert (Hauptsatz) und die exakten Infima/Suprema.

- **Kein synchronisierter Dual-Hover (→ BACKLOG I14, außerhalb des Scopes).**
  Der Hover-Cursor wirkt pro Diagramm-Slot einzeln. I14 gilt ausdrücklich nur
  für Slots mit **gemeinsamer Abszisse**; hier ist die Abszisse in Slot 1 die
  Streifenzahl \(n\) und in Slot 2 die Ortskoordinate \(x\) — ein gemeinsamer
  Cursorwert hätte keine Bedeutung. Das Hauptbild (Kurve mit Streifen) hat
  bewußt **keinen** Hover: es ist die Darstellung selbst, kein Wert-Diagramm.

- **Abweichungen von der Tick-Regel „≥ 4 Ticks inkl. 0" — begründet:**
  - *Konvergenzdiagramm, Ordinate:* der Wertebereich ist das Konvergenzband um
    den exakten Wert (z. B. 7 … 20,4). Würde 0 erzwungen, schrumpfte genau der
    Effekt, den das Diagramm zeigen soll, auf ein paar Pixel. Der Bereich wird
    daher aus den geplotteten Daten abgeleitet (≥ 4 Ticks via `niceStepLE`),
    ohne 0 zu erzwingen — dasselbe Vorgehen wie bei den Winkelgrößen der
    Kreis-/Spiralbewegung.
  - *Integralfunktionsdiagramm, Abszisse:* die Abszisse ist die
    Integrationsvariable und läuft per Definition von \(a\) bis \(b\); 0 liegt
    nur dann darin, wenn der Nutzer \(a = 0\) wählt. ≥ 4 Ticks sind stets
    erfüllt.

- **Kein Stoppuhr-Widget.** Die Animation verfeinert die Zerlegung, sie läuft
  nicht in physikalischer Zeit — eine Stoppuhr hätte hier keine Bedeutung.
  Statt einer Zeitanzeige steht das Werte-Overlay (\(n\), \(\Delta x\),
  Einschachtelungskette) unten links am Bild.

- **\(\Delta x\)-Maßstrich und Mittelpunkt-Marker nur bis \(n = 16\) bzw.
  \(n = 40\).** Darüber liefen die Beschriftungen ineinander; die Zahlen stehen
  weiterhin im Werte-Overlay und im Analyse-Panel.

- **Streifenzahl gedeckelt auf \(n = 200\).** `precompute()` berechnet die
  Näherungsfolge für alle \(n\) von 1 bis 200 (≈ 20 000 Teilintervalle) — das
  läuft in wenigen Millisekunden. Höhere \(n\) wären zeichnerisch ohnehin nicht
  mehr auflösbar (Streifenbreite unter einem Pixel).
