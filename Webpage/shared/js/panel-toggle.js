'use strict'

/**
 * Bedien-Sidebar links als Ganzes ein-/ausklappbar (→ BACKLOG I17).
 *
 * Spiegelbild der rechten Analyse-Sidebar (`.analysis-collapsed`): eine
 * Kopfleiste „Bedienung" mit Doppel-Chevron oben in `.left-panel`; ein Klick
 * setzt `.controls-collapsed` auf `.app-layout`, die Sidebar schrumpft auf
 * eine 44-px-Schiene mit gedrehtem Label. **Vorgabe: ausgeklappt** (PO-Wunsch
 * 2026-09-26, Vorbild: die Aspekt-Figuren im InteraktivesSkript).
 *
 * Die Kopfleiste wird hier erzeugt, nicht in jede index.html geschrieben —
 * jede Sim bindet nur dieses Modul ein (eine Zeile). Das Akkordeon je
 * `.panel-section` (I8) bleibt davon unberührt und funktioniert weiter.
 * Layout-Regeln: shared/css/design-system.css, Abschnitt „Einklappbare
 * Bedien-Sidebar".
 */
export function initControlsToggle(doc = document) {
  const layout = doc.querySelector('.app-layout')
  const panel = doc.querySelector('.left-panel')
  if (!layout || !panel || panel.querySelector('.controls-header')) return null

  const btn = doc.createElement('button')
  btn.type = 'button'
  btn.id = 'controls_toggle'
  btn.className = 'panel-header controls-header'
  btn.title = 'Bedienung ein-/ausklappen'
  btn.setAttribute('aria-expanded', 'true')
  btn.innerHTML =
    '<span class="ph-label">Bedienung</span>' +
    '<svg class="ph-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M3 4 L8 8 L3 12"/><path d="M8 4 L13 8 L8 12"/></svg>'
  panel.prepend(btn)

  btn.addEventListener('click', () => {
    const collapsed = layout.classList.toggle('controls-collapsed')
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
  })
  return btn
}

initControlsToggle()
