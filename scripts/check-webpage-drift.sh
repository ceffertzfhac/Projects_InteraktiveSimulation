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
#
# Exit 0 = clean, Exit 1 = Drift (mit Auflistung). → BACKLOG I11.

set -uo pipefail
cd "$(dirname "$0")/.."

SIMS=(
  3massen_umlenkrollen ableitung atwood atwood_energy federpendel freier_fall
  geschwindigkeit grundbegriffe_kinematik kreis_spiralbewegung kreisbewegung
  lorentz_force rolling_bodies schraeger_wurf stoss wellen zykloide
)

status=0
drifts=()

for s in "${SIMS[@]}"; do
  src="Project_${s}_simulation"
  dst="Webpage/sim_${s}"
  if [ ! -d "$src" ] || [ ! -d "$dst" ]; then
    drifts+=("FEHLT: Paar $src / $dst unvollständig")
    status=1
    continue
  fi

  # js/ byte-identisch (Datei muß in beiden existieren).
  for f in "$src/js/"*.js; do
    b=$(basename "$f")
    if [ ! -f "$dst/js/$b" ]; then
      drifts+=("DRIFT js: $dst/js/$b fehlt")
      status=1
    elif ! cmp -s "$f" "$dst/js/$b"; then
      drifts+=("DRIFT js: $dst/js/$b ≠ $src/js/$b")
      status=1
    fi
  done
  # umgekehrt: im Webpage-Dst zusätzliche js-Dateien (würde sync nicht abdecken)
  for f in "$dst/js/"*.js; do
    b=$(basename "$f")
    if [ ! -f "$src/js/$b" ]; then
      drifts+=("DRIFT js: $dst/js/$b ohne Project_-Gegenstück")
      status=1
    fi
  done

  # css/styles.css byte-identisch.
  if ! cmp -s "$src/css/styles.css" "$dst/css/styles.css"; then
    drifts+=("DRIFT css: $dst/css/styles.css ≠ $src/css/styles.css")
    status=1
  fi

  # index.html: Erwartung = Project_-Version mit transformierter Back-Button-href.
  # Mehr als diese eine Zeile Abweichung = Drift.
  expected=$(mktemp)
  cp "$src/index.html" "$expected"
  sed -i 's|href="\.\./AllAnimations/index\.html"|href="../index.html"|g' "$expected"
  if ! cmp -s "$expected" "$dst/index.html"; then
    drifts+=("DRIFT index.html: $dst/index.html weicht über die Back-Button-Zeile hinaus ab:")
    diff -u "$expected" "$dst/index.html" | sed 's/^/    /' || true
    status=1
  fi
  rm -f "$expected"
done

# shared/ byte-identisch.
for f in shared/css/design-system.css shared/js/*.js; do
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
  echo "OK: Webpage/ mit Project_* synchron (${#SIMS[@]} Sims + shared)."
  exit 0
else
  echo "FEHLER: Webpage-Drift erkannt — bitte 'bash scripts/sync-webpage.sh' ausführen:" >&2
  printf '  %s\n' "${drifts[@]}" >&2
  exit 1
fi