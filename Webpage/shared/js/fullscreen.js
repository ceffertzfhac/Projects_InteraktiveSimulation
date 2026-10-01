'use strict'
// Vollbild per Taste F — für alle Simulationen und Schritt-Animationen.
// Je Seite nur eine Zeile vor dem Haupt-Script:
//   <script type="module" src="../shared/js/fullscreen.js"></script>
// Esc beendet das Vollbild (Browser-Standard). In Texteingaben wird F ignoriert.

export function toggleFullscreen(doc = document) {
  const el = doc.documentElement
  const active = doc.fullscreenElement ?? doc.webkitFullscreenElement
  if (active) (doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc)
  else (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el)
}

const isTyping = t => t?.closest?.(
  'textarea, select, [contenteditable], input:not([type=range]):not([type=radio]):not([type=checkbox]):not([type=button])')

export function initFullscreenKey(doc = document) {
  if (doc.documentElement.dataset.fullscreenKey) return
  doc.documentElement.dataset.fullscreenKey = '1'
  doc.addEventListener('keydown', e => {
    if (e.key !== 'f' && e.key !== 'F') return
    if (e.altKey || e.ctrlKey || e.metaKey || e.repeat || isTyping(e.target)) return
    e.preventDefault()
    toggleFullscreen(doc)
  })
}

initFullscreenKey()
