#!/usr/bin/env bash
# check-webpage-drift.sh — nicht-mutierender Guard gegen Webpage-Drift.
# Wird im GitHub-Pages-Deploy-Workflow nach checkout aufgerufen und schlägt
# bei Drift fehl (Exit 1), sodaß keine stehengebliebene Webpage/ live geht.
# Lokal vor dem Commit nach scripts/sync-webpage.sh lauffähig.
#
# Vergleicht pro Sim:
#   - js/*.js            byte-identisch  Project_* vs Webpage/sim_*
#   - css/styles.css     byte-identisch
#   - index.html         darf nur um die Back-Button-href-Zeile abweichen
#                        (Erwartung = Project_-Version mit transformierter href)
#   - shared/**          byte-identisch  shared/ vs Webpage/shared/
# Ebenso je Schritt-Animation: Project_<name>_animation vs Webpage/anim_<name>.
#
# Exit 0 = clean, Exit 1 = Drift (mit Auflistung). → BACKLOG I11.

set -uo pipefail
cd "$(dirname "$0")/.."

# Öffentlich: wird nach Webpage/sim_*/ gespiegelt und mit Pages deployt.
SIMS=(
  3massen_umlenkrollen ableitung atwood atwood_energy federpendel freier_fall
  geschwindigkeit grundbegriffe_kinematik integration kreis_spiralbewegung kreisbewegung lineal
  lorentz_force rolling_bodies schraeger_wurf stoss wellen zykloide
)

# Schritt-Animationen (→ BACKLOG I19): Project_<name>_animation/ → Webpage/anim_<name>/,
# gleiche Spiegel-Regeln wie bei den Sims.
ANIMS=( signifikante_stellen )

# NICHT öffentlich (PO-Entscheidung): bleibt als Project_*_simulation/ im Repo
# und auf der internen Übersicht AllAnimations/, wird aber NICHT nach Webpage/
# gespiegelt und geht damit nicht auf die Pages-Site. Zum Freigeben: Namen hier
# entfernen, oben in SIMS aufnehmen, Webpage/sim_<name>/ anlegen, Karte in
# Webpage/index.html ergänzen, sync + Drift-Check. → BACKLOG I15.
NICHT_OEFFENTLICH=( busfahrt )

status=0
drifts=()

# Harter Publikations-Guard: Eine als NICHT_OEFFENTLICH geführte Sim darf weder
# als Verzeichnis im Deploy-Bundle liegen noch von Webpage/index.html verlinkt
# sein. Dieser Check läuft im Deploy-Workflow VOR dem Upload — schlägt er fehl,
# gibt es keinen Deploy. Damit kann die Sim nicht versehentlich live gehen.
# ${arr[@]+…}: leere Liste unter set -u auch mit macOS-Bash 3.2
for s in ${NICHT_OEFFENTLICH[@]+"${NICHT_OEFFENTLICH[@]}"}; do
  if [ -d "Webpage/sim_${s}" ]; then
    drifts+=("NICHT ÖFFENTLICH: Webpage/sim_${s}/ darf nicht im Deploy-Bundle liegen")
    status=1
  fi
  if grep -q "sim_${s}/" Webpage/index.html 2>/dev/null; then
    drifts+=("NICHT ÖFFENTLICH: Webpage/index.html verlinkt sim_${s}/")
    status=1
  fi
done

PAIRS=()
for s in "${SIMS[@]}"; do PAIRS+=("Project_${s}_simulation:Webpage/sim_${s}"); done
for a in "${ANIMS[@]}"; do PAIRS+=("Project_${a}_animation:Webpage/anim_${a}"); done

for pair in "${PAIRS[@]}"; do
  src="${pair%%:*}"
  dst="${pair#*:}"
  if [ ! -d "$src" ] || [ ! -d "$dst" ]; then
    drifts+=("FEHLT: Paar $src / $dst unvollständig")
    status=1
    continue
  fi

  # js/ byte-identisch inkl. Unterordner (Datei muß in beiden existieren).
  while read -r f; do
    if [ ! -f "$dst/js/$f" ]; then
      drifts+=("DRIFT js: $dst/js/$f fehlt")
      status=1
    elif ! cmp -s "$src/js/$f" "$dst/js/$f"; then
      drifts+=("DRIFT js: $dst/js/$f ≠ $src/js/$f")
      status=1
    fi
  done < <(cd "$src/js" && find . -name '*.js' | sed 's|^\./||')
  # umgekehrt: im Webpage-Dst zusätzliche js-Dateien (würde sync nicht abdecken)
  while read -r f; do
    if [ ! -f "$src/js/$f" ]; then
      drifts+=("DRIFT js: $dst/js/$f ohne Project_-Gegenstück")
      status=1
    fi
  done < <(cd "$dst/js" && find . -name '*.js' | sed 's|^\./||')

  # css/styles.css byte-identisch.
  if ! cmp -s "$src/css/styles.css" "$dst/css/styles.css"; then
    drifts+=("DRIFT css: $dst/css/styles.css ≠ $src/css/styles.css")
    status=1
  fi

  # index.html: Erwartung = Project_-Version mit transformierter Back-Button-href.
  # Mehr als diese eine Zeile Abweichung = Drift.
  expected=$(mktemp)
  cp "$src/index.html" "$expected"
  sed -i.bak 's|href="\.\./AllAnimations/index\.html"|href="../index.html"|g' "$expected" && rm "$expected.bak"   # -i.bak: GNU- und BSD-sed
  if ! cmp -s "$expected" "$dst/index.html"; then
    drifts+=("DRIFT index.html: $dst/index.html weicht über die Back-Button-Zeile hinaus ab:")
    diff -u "$expected" "$dst/index.html" | sed 's/^/    /' || true
    status=1
  fi
  rm -f "$expected"
done

# shared/ byte-identisch.
for f in shared/css/*.css shared/js/*.js shared/img/*.png; do
  b="${f#shared/}"
  if [ ! -f "Webpage/shared/$b" ]; then
    drifts+=("DRIFT shared: Webpage/shared/$b fehlt")
    status=1
  elif ! cmp -s "$f" "Webpage/shared/$b"; then
    drifts+=("DRIFT shared: Webpage/shared/$b ≠ $f")
    status=1
  fi
done

if [ $status -eq 0 ]; then
  echo "OK: Webpage/ mit Project_* synchron (${#SIMS[@]} Sims + ${#ANIMS[@]} Animationen + shared; ${#NICHT_OEFFENTLICH[@]} nicht öffentlich: ${NICHT_OEFFENTLICH[*]-keine})."
  exit 0
else
  echo "FEHLER: Webpage-Drift bzw. Publikations-Verstoß erkannt:" >&2
  printf '  %s\n' "${drifts[@]}" >&2
  exit 1
fi