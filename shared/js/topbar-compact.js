'use strict'

/**
 * Kompakte Topbar-Buttons bei knappem Platz (→ BACKLOG I25).
 *
 * Die kanonische Buttonleiste (Play · Pause · Reset · CSV …) wird bei schmalen
 * Fenstern eng: Titelblock und Logo werden gequetscht. Reicht der Platz nicht,
 * schaltet dieses Modul `.topbar-right` auf `.compact` — jeder `.btn` zeigt
 * dann nur noch ein Symbol; der volle Name steht als Hover-Tooltip
 * (`data-tip`, CSS in shared/css/design-system.css) und als `aria-label`.
 *
 * Gemessen statt per Media-Query: Die Breite der Leiste hängt je Sim von
 * Titel und Button-Anzahl ab. Es wird erst expandiert gemessen und dann
 * synchron entschieden (kein Flackern, keine Hysterese-Schleife).
 */
const SHORT = {
  play_btn: '▶',
  pause_btn: '⏸',
  reset_btn: '↺',
  new_run: '↻',
  export_diagram_btn: '📈',
  export_all_btn: '📋',
  export_svg_btn: 'SVG',
  export_png_btn: 'PNG'
}

const label = (btn) => btn.textContent.replace(/\s+/g, ' ').trim()

function shortOf(btn) {
  if (SHORT[btn.id]) return SHORT[btn.id]
  const m = label(btn).match(/^\S/u)
  return m ? m[0] : '…'
}

export function initTopbarCompact(doc = document) {
  const bar = doc.querySelector('.topbar')
  const right = doc.querySelector('.topbar-right')
  if (!bar || !right) return null
  const btns = [...right.querySelectorAll('.btn')]
  if (!btns.length) return null

  // Beide Varianten bleiben dauerhaft im DOM; umgeschaltet wird nur per Klasse
  // (kein innerHTML-Tausch bei jedem Resize — vermeidet Neuaufbau/Flackern,
  // z. B. beim Verschieben des Fensters zwischen Bildschirmen in Safari).
  btns.forEach((b) => {
    const tip = label(b)
    const short = shortOf(b)
    b.dataset.tip = tip
    if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', tip)
    b.innerHTML = `<span class="btn-full">${b.innerHTML}</span>` +
      `<span class="btn-short" aria-hidden="true">${short}</span>`
  })

  // Linke Elemente („← Übersicht“, Layout-Umschalter): ihr Text wird teils von der
  // Sim selbst neu gesetzt (Nebeneinander ↔ Übereinander) — deshalb kein DOM-Umbau,
  // sondern nur Attribute; das CSS blendet den Text aus und zeigt data-short.
  const left = doc.querySelector('.topbar-left')
  const lefts = left ? [...left.querySelectorAll('.back-btn, .btn')] : []
  const syncLeft = (el) => {
    if (el.classList.contains('layout-toggle-btn')) {
      // Text = Ziel-Layout (Aktion); das Piktogramm (CSS, data-layout) zeigt dasselbe.
      const side = /Nebeneinander/.test(label(el))
      el.dataset.layout = side ? 'side' : 'stack'
      el.dataset.tip = `Wechseln zu: ${side ? 'Nebeneinander' : 'Übereinander'}`
      el.dataset.short = ''
      return
    }
    el.dataset.tip = label(el)
    el.dataset.short = shortOf(el)
  }
  lefts.forEach((el) => {
    syncLeft(el)
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.dataset.tip)
    new MutationObserver(() => syncLeft(el))
      .observe(el, { childList: true, characterData: true, subtree: true })
  })

  const apply = (compact) => {
    right.classList.toggle('compact', compact)
    left?.classList.toggle('compact', compact)
  }
  const tight = () => {
    const title = bar.querySelector('.topbar-title-text')
    const t = bar.querySelector('.topbar-title')
    return bar.scrollWidth > bar.clientWidth + 1 ||
      (title && t && title.scrollWidth > t.clientWidth + 1) ||
      (title && title.getBoundingClientRect().width < title.scrollWidth - 1)
  }
  let raf = 0
  const update = () => {
    raf = 0
    apply(false)
    apply(tight())
  }
  const schedule = () => { if (!raf) raf = setTimeout(update, 0) }
  new ResizeObserver(schedule).observe(bar)
  doc.fonts?.ready.then(schedule)
  // Fenster auf anderen Bildschirm gezogen / wieder sichtbar: neu bewerten.
  window.addEventListener('resize', schedule)
  doc.addEventListener('visibilitychange', schedule)
  schedule()
  return { update }
}

if (typeof document !== 'undefined') initTopbarCompact()
