# Testplan — Abnahme „Rollout UI/UX & Design-System" (Sprint 3)

Stand: 2026-07-03 · Referenz: `Project_freier_fall_simulation/` v2.2.x ·
Plan: `.claude/plans/crystalline-giggling-flamingo.md`

Dieses Dokument strukturiert die Abnahme des Rollouts (R0–R9). Bitte
Schritt für Schritt durchgehen und pro Schritt Feedback geben
(„ok"/„fällt auf"/konkreter Befund). Erst wenn alle Schritte ok sind,
gilt der Rollout als abgenommen.

---

## 0. Vorbereitung

```bash
cd /Users/ce4714e/Documents/VM_Exchange/Projects_InteraktiveSimulation
python3 -m http.server 8000
```
- Browser öffnen auf `http://localhost:8000/AllAnimations/index.html`.
- **Wichtig:** Dark-Mode-Status einmal zurücksetzen — in den
  DevTools unter Application → Local Storage den Key `fh_theme`
  löschen (und ggf. veralteten `fh-theme`), sodass alle Seiten im
  Light-Modus starten. Hard-Reload pro Seite (`Cmd+Shift+R`).
- DevTools-Konsole offen halten (keine roten Fehler erwarten).

**S0.1** Server startet, Übersicht lädt (200), Konsole fehlerfrei. ✔/✗

---

## 1. Übergreifende Checks (auf allen Seiten prüfen)

**S1.1 Keine verbotenen Farben:** Sichtbar keine alten FH-Blau-Töne
(`#005eb1`), kein Gold (`#c49b10`), keine Bulma-Palette
(`#485fc7`/`#48c78e`/`#f14668`/`#ffae42`) im UI-Chrome.
Akzent überall FH-Mint `#00B1AC`.

**S1.2 Schrift:** UI-Text in *DM Sans*, Zahlenwerte (Slider-Values,
Live-Panel, Stoppuhr-Display) in *JetBrains Mono*. Kein Syne, kein
System-Font-Fallback sichtbar.

**S1.3 Dark Mode pro Seite:** Theme-Toggle klicken → alle Oberflächen,
Texte, Rahmen, Slider, Buttons schalten sauber auf dunkel; keine
verbleibenden weißen Kasten/Hell-Reste im Chrome (SVG-Plotfarben dürfen
bleiben — siehe S1.5). Nochmal klicken → zurück Light.

**S1.4 Dark Mode persistiert über Navigation:** Auf Übersicht Dark
einschalten → Sim öffnen → Sim ist ebenfalls Dark. Zurück → Übersicht
immer noch Dark. (Einheitlicher Key `fh_theme`.)

**S1.5 Bewusst belassene Hex:** In Diagrammen/SVG-Szenen dürfen
Plot-/Vektor-/Körperfarben (rot/orange/lila/grün etc.) als lokale Hex
bleiben — das ist kein Befund. Nur das *UI-Chrome* (Hintergrund, Panels,
Text, Rahmen, Buttons, Slider) muss via Tokens schalten.

**S1.6 Back-Button:** `← Übersicht` sichtbar (oben links, fixed),
Klick führt zur `AllAnimations/index.html`. Beim Taschenrechner analog.

---

## 2. Übersichtsseite (`AllAnimations/index.html`, R7)

**S2.1** Header, Karten-Grid, Kapitelstruktur optisch intakt
(Token-DRY hat Layout nicht verändert).
**S2.2** Theme-Toggle im Header funktioniert, Mint-Akzent im Header-Balken.
**S2.3** Karten-Vorschaubilder laden; Platzhalter-Gradient (Mint) bei
Karten ohne Bild korrekt.
**S2.4** Alle Sim-Links öffnen im selben Tab (kein `target="_blank"`
mehr — Ein-Tab-Fluss Übersicht↔Sim); keine 404.

---

## 3. Modulare Simulationen (R1–R3)

### 3a. Atwood (`Project_atwood_simulation/`, v2.2.0, R1)
**S3a.1** Dreispaltiges Layout `280px 1fr 270px`; Play/Pause/Reset in
einer `.btn-row` ohne Umbruch.
**S3a.2** **Einklappbare rechte Sidebar:** Default eingeklappt
(44-px-Schiene, vertikales „Analyse"-Label). Klick auf Panel-Header
(Double-Chevron) klappt auf; **Formeln nach Aufklappen korrekt
gerendert** (kein MathJax-Rohcode). Wieder Einklappen funktioniert.
**S3a.3** Stoppuhr (kanonisch): Hauptzifferblatt + Subdial, läuft
synchron zur Sim, Subhand 1 Umdr./s.
**S3a.4** Legende (Massen/Strücke) in linker Sidebar vorhanden.
**S3a.5** Koordinatensystem-Konsistenz: Lineal = Diagramm = Regler =
Live-Panel („Höhe vom Boden in cm").
**S3a.6** CSV-Export (rechte Sidebar) funktioniert (`;`/`,`).

### 3b. Rollende Körper (`Project_rolling_bodies_simulation/`, v2.0.0, R2)
**S3b.1** Grid 280/1fr/270; sim über diagramm gestapelt (Center-Zeilen
bleiben `1fr 1fr`).
**S3b.2** Einklappbare Sidebar wie S3a.2.
**S3b.3** Stoppuhr wie S3a.3.
**S3b.4** Legende für SP + P1–P4 (Mint-konsistente Kategorialfarben)
in linker Sidebar.
**S3b.5** Kraftvektoren Okabe-Ito (Blau/Orange/Mauve); beim Start
(t=0) sichtbar.
**S3b.6** Back-Button in Topbar.

### 3c. Lorentzkraft (`Project_lorentz_force_simulation/`, v1.5.0, R3)
**S3c.1** **Kein Gold** mehr sichtbar (`.obj-btn.active`, speed-pills,
Formelbox, Vektor-Skalen-Button alle Mint/Akzent).
**S3c.2** Einklappbare Sidebar wie S3a.2 (rechtes Panel schmaler, aber
klappbar).
**S3c.3** Legende: Strom (technisch/physikalisch), F_L, F_S in linker
Sidebar; Kraftfarben Okabe-Ito (Blau/Orange).
**S3c.4** **Bewusst keine Stoppuhr** (statisches Gleichgewicht) —
Fehlen ist korrekt, kein Befund.
**S3c.5** Spannungs-/Strommodus, Parallel/Antiparallel, Feder-Slider-
Limit funktionieren wie vorher.

---

## 4. Standalone-Prototypen (R4: 11 FH-blau-alt, R5: 2 Bulma-Outlier)

Pro Datei: über Übersicht öffnen, dann prüfen:
- shared-CSS geladen (UI-Chrome schaltet im Dark Mode sauber),
- Back-Button + Theme-Toggle vorhanden und funktionieren,
- Layout/Funktionalität unangetastet (Simulation läuft wie vorher),
- keine `#005eb1`-Reste im Chrome.

**R4 (11):** `3massen_umlenkrollen_v2`, `ableitung`, `atwood`,
`atwood_energy`, `elastischerStoß`, `federpendel`,
`freier_fall_senkrechter_wurf`, `geschwindigkeit`, `grundbegriffe_kin`,
`kreisbewegung`, `kreiskinematik_v5`.
**R5 (2, zusätzlich Bulma→FH-Tokens):** `schräger_wurf`, `zykloide3` —
hier speziell prüfen, dass die P1–P4-Punkte/SP sowie v/a-Vektoren in den
kanonischen FH-Kategorialfarben (`--c-p1..p4`/`--c-sp`/`--c-vel`/`--c-acc`)
erscheinen und im Dark Mode sauber schalten.

**S4.1** Jede der 13 Datei lädt fehlerfrei, Simulation lauffähig.
**S4.2** Dark Mode schaltet UI-Chrome sauber (S1.3/S1.5).
**S4.3** Back-Button + Toggle funktionieren (S1.6, S1.4).
**S4.4** Schräger Wurf & Zykloide: Kategorialfarben kanonisch (S4-R5).
**S4.5** Keine Layout-Verschiebung durch das fixed Back-Button/Toggle-
Overlay (keine Überdeckung wichtiger Inhalte).

---

## 5. Taschenrechner (`Standalone Proto/Taschenrechner/`, R6)

**S5.1** shared-CSS geladen (Pfad `../../shared/`), UI-Chrome schaltet
im Dark Mode.
**S5.2** Equals-Taste ist Mint (`var(--fh-mint)`), Hover dunkler Mint
(`--fh-mint-dark`) — kein altes FH-Blau mehr.
**S5.3** Back-Button → `../AllAnimations/index.html`.
**S5.4** Rechner-Funktion (Signifikante Stellen / Intervall-Arithmetik)
unbeeinträchtigt.

---

## 6. Bewusst nicht umgesetzt / Known Limitations

- **R8 — Freier Fall linkt shared:** bewusst weggelassen. FF ist die
  kanonische Referenz, aus der `shared` abgeleitet wurde; ein Import
  würde die Referenz riskieren. FF bleibt selbstständig (und voll
  konform). Kein Befund.
- **Standalone SVG-Plotfarben:** lokale Hex bewusst belassen (nur
  UI-Chrome via Tokens). Kein Befund.
- **`Standalone Proto/Schräger_Wurf/` NFD/NFC-Dubletten:** im Repo
  vorhanden, aber mit identischen Blobs (harmlos, kein status-Flag).
  Außerhalb des Rollout-Scopes; ggf. separates Repo-Hygiene-Ticket.
- **B2/B3 Rolling (SP-Spur, Timing-Sprung):** aus BACKLOG, nicht Teil
  dieses Rollouts.

---

## 7. Abnahme-Checkliste (Zusammenfassung)

- [ ] S0.1 Server/Übersicht ok
- [ ] S1.1–S1.6 übergreifend ok (Farben, Schrift, Dark Mode, Persistenz,
      Back-Button)
- [ ] S2.1–S2.4 Übersicht ok
- [ ] S3a Atwood ok (Sidebar/Aufklappen+MathJax, Stoppuhr, Legende, Koord.)
- [ ] S3b Rolling ok (Sidebar, Stoppuhr, Legende SP/P1–P4, Okabe-Ito)
- [ ] S3c Lorentz ok (kein Gold, Sidebar, Legende, keine Stoppuhr = ok)
- [ ] S4.1–S4.5 alle 13 Standalones ok (inkl. R5 Kategorialfarben)
- [ ] S5.1–S5.4 Taschenrechner ok
- [ ] Known Limitations (§6) zur Kenntnis genommen

Wenn alle Haken gesetzt sind: **Abnahme erteilt.** Andernfalls pro
Schritt konkreten Befund melden; ich behebe iterativ.