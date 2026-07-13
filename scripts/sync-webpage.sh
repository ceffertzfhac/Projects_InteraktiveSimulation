#!/usr/bin/env bash
# sync-webpage.sh — Spiegelt die kanonischen Project_*_simulation/-Quellen
# in das deploybare Webpage/sim_*/-Bundle (GitHub-Pages-Target).
#
# Einzige Transformation: die Back-Button-href in jedem index.html
#   ../AllAnimations/index.html  →  ../index.html
# (im Project_-Universum zeigt der Back-Button auf AllAnimations/ als Übersicht,
#  im Webpage/-Universum auf Webpage/index.html — derselbe relative Pfad
#  ../index.html von sim_*/ aus).
#
# Wann ausführen: nach jeder Änderung an Project_*_simulation/ oder shared/,
# VOR dem Commit, damit Webpage/ nicht stumm driftet. Idempotent.
# Anschließend Drift-Check: scripts/check-webpage-drift.sh
#
# → BACKLOG I11.

set -euo pipefail
cd "$(dirname "$0")/.."

SIMS=(
  3massen_umlenkrollen ableitung atwood atwood_energy federpendel freier_fall
  geschwindigkeit grundbegriffe_kinematik kreis_spiralbewegung kreisbewegung
  lorentz_force rolling_bodies schraeger_wurf stoss wellen zykloide
)

for s in "${SIMS[@]}"; do
  src="Project_${s}_simulation"
  dst="Webpage/sim_${s}"
  if [ ! -d "$src" ] || [ ! -d "$dst" ]; then
    echo "FEHLER: Paar unvollständig — $src oder $dst fehlt." >&2
    exit 1
  fi
  # js/ und css/styles.css byte-identisch spiegeln.
  cp "$src/js/"*.js "$dst/js/"
  cp "$src/css/styles.css" "$dst/css/styles.css"
  # index.html aus kanonischer Quelle + Back-Button-Transform.
  cp "$src/index.html" "$dst/index.html"
  sed -i 's|href="\.\./AllAnimations/index\.html"|href="../index.html"|g' "$dst/index.html"
done

# shared/ spiegeln (Design-System + JS-Helper, von allen Webpage-Sims via
# ../shared/ referenziert).
cp shared/css/design-system.css Webpage/shared/css/design-system.css
cp shared/js/*.js Webpage/shared/js/

echo "Webpage/ aus Project_* gespiegelt (${#SIMS[@]} Sims + shared)."
echo "Drift prüfen:  bash scripts/check-webpage-drift.sh"