'use strict'
// Druck/PDF für Schritt-Animationen (→ BACKLOG FSS9 z): je Schritt eine Seite mit dem
// Endzustand — Bühne samt sichtbarer Folienkarte —, für das aktuelle Kapitel oder alle.
// Ablauf: Engine springt Schritt für Schritt (goto = Endzustand), Bühne und Kartenebene
// werden geklont, danach window.print() (im Dialog „Als PDF sichern"). Die Klone verlieren
// ihre ids (keine Dubletten); Verläufe/Clips beziehen sich weiter auf die Originale, die
// beim Drucken unsichtbar, aber gerendert bleiben. Gedruckt wird immer im hellen Thema.

const PRINT_ICON = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"
  stroke-linejoin="round" aria-hidden="true"><path d="M5.5 7V2.8h9V7"/>
  <rect x="2.5" y="7" width="15" height="7" rx="1.6"/><rect x="5.5" y="11.5" width="9" height="5.7" rx=".6"
  fill="var(--surface)"/><circle cx="14.6" cy="9.3" r=".7" fill="currentColor" stroke="none"/></svg>`

export function createPrint({ presenter, button, popover, stage, docTitle }) {
  button.innerHTML = PRINT_ICON
  const cur = popover.querySelector('[data-print="chapter"]')
  button.addEventListener('click', () => {
    const ch = presenter.chapters.find(c => c.id === presenter.chapter)
    cur.textContent = `Aktuelles Kapitel (${ch.title})`
  })
  popover.addEventListener('click', e => {
    const which = e.target.closest('[data-print]')?.dataset.print
    if (!which) return
    popover.hidePopover?.()
    run(which === 'all' ? presenter.chapters.map(c => c.id) : [presenter.chapter])
  })

  function capture(ch, i, n) {
    const E = presenter.engine
    const page = document.createElement('section')
    page.className = 'print-page'
    const st = document.createElement('div')
    st.className = 'stage print-stage'
    const svg = stage.querySelector('svg').cloneNode(true)
    const layer = stage.querySelector('.slide-layer').cloneNode(true)
    // nur sichtbare Karten behalten (GSAP-autoAlpha setzt inline visibility „inherit"/„hidden")
    layer.querySelectorAll('.slide-card').forEach(c => {
      if (!c.style.visibility || c.style.visibility === 'hidden' || Number(c.style.opacity || 0) < 0.05) c.remove()
    })
    ;[svg, layer].forEach(r => { r.removeAttribute('id'); r.querySelectorAll('[id]').forEach(el => el.removeAttribute('id')) })
    st.append(svg, layer)
    const cap = document.createElement('div')
    cap.className = 'print-cap'
    cap.innerHTML = `<span><b>${docTitle}</b> · ${ch.title} · Schritt ${i} / ${n}</span><span>${E.title(i)}</span>`
    page.append(st, cap)
    return page
  }

  function run(ids) {
    const back = { chapter: presenter.chapter, index: presenter.engine.index }
    const theme = document.body.classList.contains('dark')
    document.body.classList.replace('dark', 'light')
    const box = document.createElement('div')
    box.id = 'print_pages'
    for (const id of ids) {
      presenter.selectChapter(id)
      const E = presenter.engine, ch = presenter.chapters.find(c => c.id === id)
      E.pause()
      for (let i = 1; i <= E.total; i++) {
        E.goto(i)
        box.append(capture(ch, i, E.total))
      }
    }
    presenter.selectChapter(back.chapter)
    presenter.engine.goto(back.index)
    document.body.append(box)
    const done = () => {
      box.remove()
      if (theme) document.body.classList.replace('light', 'dark')
      window.removeEventListener('afterprint', done)
    }
    window.addEventListener('afterprint', done)
    // MathJax-SVGs und Schriften sind schon da — kurz Layout abwarten, dann drucken
    requestAnimationFrame(() => setTimeout(() => window.print(), 50))
  }
  return { run }
}
