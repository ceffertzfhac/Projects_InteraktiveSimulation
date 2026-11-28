# Grill-Protokoll: Schritt-Animation Kreiskinematik und Vektorrechnung
Datum: 2026-11-28 · Status: abgeschlossen (Backlog: N12, I27, FKI1–FKI13 in BACKLOG.md)

## Ziel
Aus dem Ablaufskript `Project_Animation_Kreisbwegung/Ablaufskript Kreiskinematik und Vektorrechnung.md`
(5 Szenen: Normalform der Ebene → Kreisbahn in einer Ebene → ω-Vektor und v_T = ω × r →
Zentripetal-/Tangentialbeschleunigung mit α → schiefe Spiralbahn) eine klickbare Lehr-Animation
für das erste Semester bauen; Erklärung live bzw. über die Tonspur, Animation mit minimalem Text.

## Ausgangslage (recherchiert)
- Das Skript beschreibt eine schrittweise, klickbare Animation → Projekttyp **Schritt-Animation**
  (BACKLOG I19, Blueprint §10, `global_docs/animation_guideline.md`, Skill `create-step-animation`).
- Bisherige Schritt-Animationen (Signifikante Stellen, Messunsicherheit) sind reine 2D-SVG-Bühnen;
  `shared/js/step-kit.js` hat keine 3D-Funktionen.
- 3D im Repo bisher nur als feste ISO-Projektion in SVG (`projectISO` in der Kreis-/Spiralbewegung).
- Three.js wurde am 2026-10-01 für Schritt-Animationen geprüft und verworfen (CLAUDE.md, I19);
  GSAP 3.13 ist die einzige zugelassene Fremdbibliothek.
- Der neue Ordner `Project_Animation_Kreisbwegung/` weicht von der Namenskonvention
  `Project_<name>_animation/` ab und enthält einen Tippfehler („Kreisbwegung“).

## Entscheidungen
### E1 – 3D-Technik
- Frage: Wie werden die räumlichen Szenen (Koordinatensystem, Ebenen, Kreisbahnen, Vektoren) dargestellt?
- Entscheidung: **Three.js/WebGL** (Option B).
- Begründung: echte 3D-Verdeckung und Beleuchtung; User entscheidet bewusst gegen die
  eigene SVG-Projektion (Empfehlung A) und gegen eine feste ISO-Ansicht.
- Folgen: weicht von der PO-Entscheidung vom 2026-10-01 ab (Three.js für Schritt-Animationen
  verworfen) → Geltungsbereich klären (E2). Offen: Formeln als HTML-Overlay, Reversibilität
  der Timeline mit Three.js-Szenengraph, PDF-Druck (Canvas-Snapshot), Dark Mode.

### E2 – Geltungsbereich der Three.js-Freigabe
- Frage: Für welche Projekte wird Three.js als zweite Fremdbibliothek zugelassen?
- Entscheidung: **Generell für Schritt-Animationen mit 3D-Inhalt** (Option A); interaktive Sims
  ausgenommen (FR8 bleibt „Won't“).
- Begründung: 3D-Bausteine (Kamera, Pfeile, Ebenen, Formel-Overlay) als gemeinsames Modul unter
  `shared/js/`, wiederverwendbar für spätere 3D-Animationen; Freigabe bleibt überschaubar.
- Folgen: CLAUDE.md (I19-Abschnitt), Blueprint §10, `animation_guideline.md` und Skill
  `create-step-animation` anpassen; PO-Entscheidung 2026-10-01 wird insoweit revidiert.

### E3 – Bühnenaufteilung
- Frage: Wo stehen die Formeln im Verhältnis zur 3D-Szene?
- Entscheidung: **⅔ 3D-Szene | ⅓ Formelspalte** (wie Messunsicherheit).
- Begründung: Vektor und Formel sind bei den Herleitungen (Szenen 3, 4) gleichzeitig sichtbar;
  Formeln verdecken die Szene nie; Symbolfarben = Vektorfarben in der Szene.

### E4 – Achsenlage
- Frage: Welche Achse zeigt in welcher Szene nach oben?
- Entscheidung: **Durchgehend *y* vertikal, *x* horizontal, *z* schräg aus dem Bildschirm**
  (rechtshändig), in allen Szenen; kein Ansichtswechsel.
- Begründung: eine Lage entlastet Erstsemester; deckt den Wortlaut von Szene 3; Anschluss an die
  2D-Kreisbewegungs-Sims (x rechts, y oben). „Typische Lage“ in Szene 1 = Physik-/Grafiklage.
- Folge: Szene-1-Beispiel „Normalenvektor entlang z durch den Ursprung“ ist dann die
  (bildschirmnahe) *xy*-Ebene.

### E5 – Kapitelzuschnitt
- Frage: Wie werden die fünf Szenen auf Kapitel (Reiter) verteilt?
- Entscheidung: **5 Kapitel = 5 Szenen, ohne Zusammenfassungs- und Merke-Folien**; jedes Kapitel
  startet per stillem Vorspann aus dem Endzustand des Vorgängers.
- Begründung: nahtloser Ablauf laut Skript (Szene 1 → 2 ohne Zusammenfassung, Bahnspur bleibt
  sichtbar) bei gezielter Anspringbarkeit; Vorspann-Mechanismus erprobt (Signifikante Stellen,
  Multiplikation).
- Folge: Abweichung von `animation_guideline.md` §1.6 als begründete Ausnahme für
  Tonspur-Animationen in die Richtlinie eintragen. Offen: Logo auf der letzten Folie (§ Logo).

### E6 – Ordner- und Projektname
- Frage: Ordner `Project_Animation_Kreisbwegung/` umbenennen?
- Entscheidung: **Ja → `Project_kreiskinematik_animation/`**; Ablaufskript nach `docs/`;
  öffentliche Fassung später `Webpage/anim_kreiskinematik/`. Umbenennung erst bei der Umsetzung.
- Begründung: Namensschema der Sync-/Drift-Skripte (`ANIMS`); Abgrenzung zur Sim „Kreisbewegung“.

### E7 – Farbcodierung
- Frage: Farben für *r*, *n*, *ω*, *v*_T, *a*_Z, *a*_T, *α*, Bahn?
- Entscheidung: **Palette der Kreis-/Spiralbewegung (= Vorlesungsfolien)**: *r* Blaubeere,
  *v*_T Mandarine, *a*_Z Magenta, *a*_T Apfelrot, *ω* Mint, *α* Braun, Bahn Grau; dazu *n*
  neutral (Schiefergrau). Erscheint *ω* als Normalenvektor, wechselt dieser Grau → Mint.
  Dark-Mode-Varianten aus der Sim übernehmen.
- Begründung: Wiedererkennung Folien ↔ Sim ↔ Animation; Farbwechsel trägt die Kernaussage von Szene 3.

### E8 – Lage der Kreisbahnen für die Kreuzprodukt-Herleitung
- Frage: Wie liegen die Kreisbahnen, damit *v*_T = *ω* × *r* und *a*_Z = *ω* × (*ω* × *r*) stimmen?
- Befund (Claude): Die einfache Form mit Ortsvektor vom Ursprung gilt nur, wenn der Ursprung auf
  der Drehachse liegt; allgemein *v* = *ω* × (*r* − *r*_M). Die Skript-Ebene durch (1, 1, 1) mit
  *n* = (1, 1, −2) enthält den Ursprung (1 + 1 − 2 = 0).
- Entscheidung: **Alle Kreismittelpunkte auf der Achse durch den Ursprung** (*r*_M ∥ *ω*); Ebenen
  gehen trotzdem nicht durch den Ursprung. Schiefe Ebene: *n* = (1, 1, −2), verschoben, z. B.
  Mittelpunkt (1, 1, −2) → *x* + *y* − 2*z* = 6. Formelspalte zeigt einmal kurz die Bedingung
  „Ursprung auf der Drehachse“.
- Begründung: knappe, erstsemestertaugliche Herleitung, physikalisch korrekt; Mittelpunkt braucht
  keinen eigenen Ortsvektor (Szene 2).

### E9 – Ebenenfolge der Szenen 2–4
- Frage: Welche Ebenen/Kreisbahnen in welcher Reihenfolge (Skript in Szene 3 widersprüchlich)?
- Entscheidung (Radius überall *R* = 1, *y* oben):

  | # | Ebene | Mittelpunkt | *ω* entlang | Rolle |
  |---|---|---|---|---|
  | P1 | *z* = 2 | (0, 0, 2) | *z* | Szene 2; Szene 3 Periode ¼ T und 4 T |
  | P2 | *x* = 2 | (2, 0, 0) | *x* | andere Ebene, *ω* ∥ Achse |
  | P2′ | *x* = 3 | (3, 0, 0) | *x*, gleich lang | Parallelverschiebung, Ortsvektor-Winkel ändert sich |
  | P3 | *x* + *y* − 2*z* = 6 | (1, 1, −2) | (1, 1, −2) | schiefe Ebene (E8) |
  | P4 | *y* = 2 | (0, 2, 0) | *y* | „kippt zurück“; Herleitung *v*_T, Kontrolle an P2′ und P3 |
- Begründung: löst den Skript-Widerspruch, erhält alle drei Aussagen von Szene 3, erfüllt E8.

### E10 – Ebenen der Szene 1
- Frage: Demo-Ebene und drei Beispielebenen?
- Entscheidung: Demo-Ebene = P3 (*x* + *y* − 2*z* = 6, *n* = (1, 1, −2)); Beispiele: *z* = 0
  (*n* ∥ *z*, durch Ursprung), *x* = 2 (*n* ∥ *x*, = P2), *x* + *y* − 2*z* = 6 (Rückkehr zur Demo-Ebene
  mit Zahlen).
- Begründung: roter Faden (Richtlinie §1), Ebenen von Szene 3 und 5 bekannt; schiefe Ebene zeigt
  *n* ⟂ allen Richtungen in der Ebene besser.

### E11 – Formelkette der Normalform
- Frage: Wie weit baut sich die Normalform auf?
- Entscheidung: Normalform **als ausgeschriebene Vektorformel mit Spaltenvektoren**
  ((*r* − *r*₀) · *n* = 0 mit (x, y, z), (x₀, y₀, z₀), (n_x, n_y, n_z) als Spalten); die Kette **endet
  dort**. Die drei Beispiele erscheinen ebenfalls nur als Spaltenvektor-Gleichung mit Zahlen,
  keine Koordinatenform.
- Begründung: User-Vorgabe; Vektorform wird ab Szene 3 (*ω* × *r*) wieder gebraucht.
- Verworfen: Koordinatenform (ganz oder nur beim schiefen Beispiel), Hessesche Normalform.

### E12 – Kamerasteuerung
- Frage: Darf der User die 3D-Szene selbst drehen/zoomen?
- Entscheidung: **Freies Drehen/Zoomen mit der Maus nur bei pausierter Animation**; beim nächsten
  Schritt fährt die Kamera weich auf die Drehbuch-Lage zurück; auch der Knopf/die Taste zum
  Zurücksetzen fährt **weich (smooth)** zurück, nicht sprunghaft (User-Ergänzung).
- Begründung: spontane Erkundung im Hörsaal, Schritte bleiben reproduzierbar (Reversibilität,
  Video, PDF-Druck).
- Verworfen: nur Drehbuch-Kamera (keine spontane Antwort möglich); jederzeit frei (kollidiert
  mit Kamerafahrten innerhalb der Schritte).

### E13 – Vektorbeschriftung und Legende
- Frage: Wie werden die Pfeile in der Szene gekennzeichnet?
- Entscheidung: **Symbol an der Pfeilspitze nur beim ersten Erscheinen, danach ausblenden;
  dann übernimmt eine Legende** die Zuordnung Farbe ↔ Symbol. Legende **unten in der
  Formelspalte**, zeigt **nur die gerade sichtbaren Vektoren**: Eintrag erscheint beim Ausblenden
  des Labels und verschwindet mit dem Pfeil.
- Begründung: minimaler Text in der Szene, Szene bleibt frei (E3), Legende nimmt nichts vorweg,
  Zuordnung auch ohne Farbsehen/im s/w-Druck.

### E14 – Herleitung von *v*_T (Szene 3)
- Frage: Auf welchem Weg wird *v*_T = *ω* × *r* gezeigt?
- Entscheidung: **Geometrisch an allen Ebenen** (Richtung per animierter Rechte-Hand-Regel,
  Betrag |*ω* × *r*| = *ω r* sin *θ* mit *r* sin *θ* = *R* im Bild) **plus einmal komponentenweise
  an P4** mit Spaltenvektoren: (0, *ω*, 0) × (*R* cos *φ*, 2, −*R* sin *φ*) = (−*ωR* sin *φ*, 0, −*ωR* cos *φ*);
  die 2 fällt sichtbar heraus. P2′ und P3 nur geometrisch kontrolliert.
- Begründung: geometrische Stärke der 3D-Szene; *r* sin *θ* = *R* erklärt E8; kurze Rechnung an P4.

### E15 – Herleitung von *a*_Z (Szene 4)
- Frage: Wie wird *a*_Z = *ω* × (*ω* × *r*) gezeigt?
- Entscheidung: **Muster wie E14**: geometrisch über *ω* × *v*_T an allen Ebenen (zweimal
  Rechte-Hand-Regel, Ergebnis waagerecht zur Achse, Betrag *ω*²*R*), einmal komponentenweise an P4:
  (0, *ω*, 0) × (−*ωR* sin *φ*, 0, −*ωR* cos *φ*) = (−*ω*²*R* cos *φ*, 0, *ω*²*R* sin *φ*)
  = −*ω*² (*r* − *r*_M). Kontrolle an P2′ und P3 geometrisch.
- Begründung: wiedererkennbare Struktur, *v*_T aus Szene 3 wird weiterverwendet.

### E16 – Bremsfall *α* antiparallel (Szene 4)
- Frage: Wie weit läuft der Bremsfall?
- Entscheidung: **Abbremsen bis zum Stillstand und weiter mit Richtungsumkehr**: *ω* schrumpft
  auf null, klappt um, wächst wieder; danach ist *α* parallel zum neuen *ω*, Objekt wird in
  Gegenrichtung schneller. Demonstration an einer Ebene (Vorschlag P4).
- Begründung (User): zeigt, dass parallel/antiparallel eine Beziehung zwischen den Vektoren ist.
- Folge: Pfeile kürzer als ihre Spitze beim Nulldurchgang von *ω* ausblenden (Regel B23 sinngemäß
  in 3D).
- Verworfen: Abbremsen ohne Stillstand (Empfehlung), Stillstand ohne Umkehr.

### E17 – Herleitung von *a*_T (Szene 4)
- Frage: Wie wird *a*_T = *α* × *r* gezeigt?
- Entscheidung: **Muster wie E14/E15**: geometrisch an allen Ebenen (Rechte-Hand-Regel, Betrag
  *αR*), einmal komponentenweise an P4: (0, *α*, 0) × (*R* cos *φ*, 2, −*R* sin *φ*)
  = (−*αR* sin *φ*, 0, −*αR* cos *φ*), sichtbar ∥ *v*_T (bei *α* < 0 antiparallel). Kontrolle an P2′, P3.
- Begründung: drei gleich gebaute Herleitungen; Formgleichheit *a*_T ↔ *v*_T sichtbar.

### E18 – Gesamtbeschleunigung (Ende Szene 4)
- Frage: *a*_T und *a*_Z zur Gesamtbeschleunigung zusammensetzen?
- Entscheidung: **Ja**: *a* = *a*_T + *a*_Z = *α* × *r* + *ω* × (*ω* × *r*), in der Szene als
  Vektoraddition in der Kreisebene mit resultierendem *a*-Pfeil.
- Begründung: zeigt, dass *ω* und *α* die ganze Beschleunigung festlegen; Brücke zu Szene 5.

### E19 – Farbe der Gesamtbeschleunigung
- Frage: Farbe des Pfeils *a* = *a*_T + *a*_Z?
- Entscheidung: **Mischfarbe wie in der Kreis-/Spiralbewegung** (OKLCH zwischen Magenta = radial
  und Apfelrot = tangential, je nach Richtung von *a*); **nach der Addition treten *a*_Z und *a*_T
  zurück** (dünner oder gestrichelt).
- Begründung: einheitlich mit der Sim; *a* trotz ähnlicher Töne klar als Hauptpfeil; Farbe zeigt,
  welcher Anteil überwiegt.

### E20 – Spiralgesetz (Szene 5)
- Frage: Nach welchem Gesetz verlaufen *r*(*t*) und *φ*(*t*) in der Ebene P3?
- Entscheidung: **Archimedische Spirale mit gleichmäßig beschleunigter Drehung**:
  *r*(*t*) = *R*₀ + *v*_r *t*, *φ*(*t*) = *ω*₀ *t* + ½ *α t*², *α* ∥ *ω*; Mittelpunkt (1, 1, −2) (E8).
- Begründung: alle vier Größen aus Szene 5 nicht trivial; entspricht den Parametern der
  Kreis-/Spiralbewegungs-Sim (nachstellbar).

### E21 – „Ein Ortsvektor“ (Szene 5)
- Frage: Welcher Ortsvektor ergänzt *r*(*t*), *φ*(*t*), *ω*(*t*), *α*(*t*)?
- Entscheidung: **Ortsvektor des Startpunkts *r*(0)**; Mittelpunkt *r*_M = Projektion von *r*(0)
  auf die *ω*-Achse (E8), Bezugsrichtung *φ* = 0 = Richtung *r*_M → Startpunkt. Projektion wird
  kurz gezeigt.
- Begründung: Skript-Aufzählung bleibt wörtlich richtig; E8 trägt ein zweites Mal.
- Verworfen: *r*_M + Einheitsvektor *ê*₁ (eine Größe mehr, Mittelpunkt mit eigenem Ortsvektor).

### E22 – Form der Monsterformel (Szene 5)
- Frage: Wie werden *x*(*t*), *y*(*t*), *z*(*t*) angezeigt?
- Entscheidung: **Ausgeschrieben mit Wurzeln, *R*₀, *v*_r, *ω*₀, *α* als Symbolen** (drei lange
  Zeilen), Basis z. B. *ê*₁ = (1, −1, 0)/√2, *ê*₂ = −(1, 1, 1)/√3 (*ê*₁ × *ê*₂ = *n̂*). Beim
  Übergang werden *R*₀ + *v*_r *t* und *ω*₀ *t* + ½ *α t*² farbig markiert und schrumpfen zu *r*(*t*), *φ*(*t*).
- Begründung: maximaler Kontrast zur kompakten Beschreibung, Parameter bleiben erkennbar.

### E23 – Technischer Durchstich vorab
- Frage: Vor dem Szenenbau einen technischen Durchstich mit Abnahme?
- Entscheidung: **Ja**: Mini-Animation (3 Schritte: Koordinatensystem, Ebene mit *n*, ein Pfeil mit
  mitlaufendem Label, Kamerafahrt + weiche Rückfahrt (E12), PDF-Druck, Dark Mode); daraus erste
  Fassung des Shared-3D-Moduls (E2). Abnahme durch den User vor dem Szenenbau.
- Begründung (Pre-Mortem): Three.js + Step-Engine im Repo unerprobt (Reversibilität,
  MathJax-Overlay, PDF aus WebGL, Dark Mode); Risiko auf den Durchstich begrenzen.

### E24 – Veröffentlichung
- Frage: Wann kommt die Animation auf die öffentliche Seite?
- Entscheidung: **Erst nach Abnahme aller fünf Szenen durch den User**; bis dahin nur intern auf
  `AllAnimations/`. Freigabe (Eintrag in `ANIMS`, Karte in `Webpage/index.html`) = eigener Schritt.
- Begründung: Tonspur-Animation ohne vollständigen Ablauf kaum verständlich; 3D-Technik vorher im
  Hörsaal erprobt.
- Hinweis: das Shared-3D-Modul wird über `shared/` ohnehin mitgespiegelt (unschädlich).

### E25 – Logo
- Frage: Wo erscheint das große Physik-Logo?
- Entscheidung: **Nur einmal groß auf dem Endzustand von Szene 5**; sonst klein in der Topbar.
- Begründung: klarer Abschluss, nahtlose Übergänge (E5) bleiben; Abweichung zusammen mit E5 in
  der Richtlinie eintragen.

## Offene Punkte
Keine offenen Entscheidungen. Von Claude bei der Umsetzung festzulegen (Fachdetails, keine
User-Entscheidung): Objektform und Spurdarstellung, Dauer der Umläufe und Kamerafahrten,
Transparenz/Tiefensortierung der Ebenen, Pfeilgeometrie in 3D, Zahlenwerte *R*₀, *v*_r, *ω*₀, *α*,
Halte (`beat`) für den Präsentationsmodus, Three.js-Version (CDN, gepinnt), DOM-freies Modell
mit Vitest-Tests, Start mit v0.1.0.

## Verworfene Alternativen
- *v*_T = *ω* × (*r* − *r*_M) mit beliebigen Mittelpunkten (E8): längere Formeln, Mittelpunkt
  bräuchte eigenen Ortsvektor.
- Einfache und allgemeine Form nacheinander (E8): zu viel für das erste Semester.
- Eigene 3D→2D-Projektion in SVG (E1): verworfen zugunsten echter 3D-Darstellung.
- Feste ISO-Ansicht (E1): Kameradrehung und Kippen der Ebenen wären nicht darstellbar.
