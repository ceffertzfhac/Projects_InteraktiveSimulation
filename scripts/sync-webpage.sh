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

# Ausgeschlossene Sims dürfen im Deploy-Bundle gar nicht erst liegen. Nicht
# stillschweigend löschen — lieber laut abbrechen, als unbemerkt zu publizieren
# oder unbemerkt Arbeit wegzuwerfen.
# ${arr[@]+…}: leere Liste unter set -u auch mit macOS-Bash 3.2
for s in ${NICHT_OEFFENTLICH[@]+"${NICHT_OEFFENTLICH[@]}"}; do
  if [ -d "Webpage/sim_${s}" ]; then
    echo "FEHLER: Webpage/sim_${s}/ existiert, ist aber als NICHT_OEFFENTLICH geführt." >&2
    echo "        Verzeichnis entfernen (git rm -r Webpage/sim_${s}) oder den Namen" >&2
    echo "        aus NICHT_OEFFENTLICH nach SIMS verschieben." >&2
    exit 1
  fi
done

PAIRS=()
for s in "${SIMS[@]}"; do PAIRS+=("Project_${s}_simulation:Webpage/sim_${s}"); done
for a in "${ANIMS[@]}"; do PAIRS+=("Project_${a}_animation:Webpage/anim_${a}"); done

for pair in "${PAIRS[@]}"; do
  src="${pair%%:*}"
  dst="${pair#*:}"
  if [ ! -d "$src" ] || [ ! -d "$dst" ]; then
    echo "FEHLER: Paar unvollständig — $src oder $dst fehlt." >&2
    exit 1
  fi
  # js/ (inkl. Unterordner, z. B. js/division/) und css/styles.css byte-identisch spiegeln.
  (cd "$src/js" && find . -name '*.js') | while read -r f; do
    mkdir -p "$dst/js/$(dirname "$f")"
    cp "$src/js/$f" "$dst/js/$f"
  done
  cp "$src/css/styles.css" "$dst/css/styles.css"
  # index.html aus kanonischer Quelle + Back-Button-Transform.
  cp "$src/index.html" "$dst/index.html"
  sed -i.bak 's|href="\.\./AllAnimations/index\.html"|href="../index.html"|g' "$dst/index.html" && rm "$dst/index.html.bak"   # -i.bak: GNU- und BSD-sed
done

# shared/ spiegeln (Design-System + JS-Helper, von allen Webpage-Sims via
# ../shared/ referenziert).
cp shared/css/*.css Webpage/shared/css/
cp shared/js/*.js Webpage/shared/js/
mkdir -p Webpage/shared/img
cp shared/img/*.png Webpage/shared/img/

echo "Webpage/ aus Project_* gespiegelt (${#SIMS[@]} Sims + ${#ANIMS[@]} Animationen + shared; ${#NICHT_OEFFENTLICH[@]} nicht öffentlich: ${NICHT_OEFFENTLICH[*]-keine})."
echo "Drift prüfen:  bash scripts/check-webpage-drift.sh"