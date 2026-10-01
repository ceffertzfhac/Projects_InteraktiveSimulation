'use strict'
// Schritt-Engine für Lehr-Animationen (→ BACKLOG I19, Blueprint §10).
//
// Ersetzt den zeitkontinuierlichen rAF-Loop der interaktiven Sims durch eine
// GSAP-Master-Timeline mit einem Label pro Schritt ('s0' = Ausgangszustand,
// 's<i>' = Zustand nach Schritt i). Weiter/Zurück/Reset bewegen nur den
// Abspielkopf dieser Timeline — deshalb gilt die REVERSIBILITÄTS-REGEL:
// Schritte verändern ausschließlich per Tween/Set Zahlen im Szene-Objekt
// (bzw. CSS-Werte von DOM-Elementen), niemals per Callback mit Seiteneffekt.
// Nur dann ist der Zustand nach „Zurück" identisch mit dem Zustand davor.
//
// GSAP wird als klassisches <script> (CDN) VOR den Modulen geladen → window.gsap.

import './fullscreen.js'        // Taste F = Vollbild (gemeinsam mit den Simulationen)

const MIN_STEP = 0.3        // s — jeder Schritt hat eine echte Dauer (Label-Abstand > 0)
const DEFAULT_HOLD = 2.4    // s bei 1× — Verweildauer nach einem Schritt im Auto-Play
const START_HOLD = 0.5      // s — Auto-Play ab Schritt 0 beginnt fast sofort
const BACK_RATE = 2.5       // Zurückspulen sichtbar, aber zügig

export function createStepEngine({ steps, scene, render, onChange = () => {}, onTick = () => {} }) {
  const g = window.gsap
  const N = steps.length
  const tl = g.timeline({ paused: true })
  tl.addLabel('s0', 0)
  steps.forEach((step, i) => {
    const sub = g.timeline()
    step.build(sub, scene)
    if (sub.duration() < MIN_STEP) sub.to({}, { duration: MIN_STEP - sub.duration() })
    // 1 ms Abstand: ein set() am Schrittanfang liegt sonst exakt auf dem Label des
    // Vorschritts und bliebe beim Zurückspringen auf dieses Label angewendet.
    tl.add(sub, '+=0.001')
    tl.addLabel('s' + (i + 1))
  })

  let index = 0, target = 0, mover = null, moverRate = 1   // moverRate: Rate bei Erzeugung
  let playing = false, speed = 1, wait = null

  const labelTime = i => tl.labels['s' + i]
  // Kontinuierliche Position in Schritt-Einheiten (2,4 = Schritt 3 zu 40 % gelaufen)
  // und Countdown der Auto-Play-Wartezeit → Füllung der Fortschrittsleiste.
  const position = () => {
    const t = tl.time()
    for (let j = 1; j <= N; j++) {
      const a = labelTime(j - 1), b = labelTime(j)
      if (t <= b + 1e-9) return j - 1 + Math.max(0, Math.min(1, (t - a) / (b - a)))
    }
    return N
  }
  const tick = (hold = 0) => onTick({ pos: position(), hold, holdIndex: index + 1 })
  const emit = () => onChange({
    index: target, total: N, playing, busy: !!mover,
    title: target > 0 ? steps[target - 1].title : 'Start',
  })

  function snap() {
    if (!mover) return
    mover.kill()
    mover = null
    tl.seek(labelTime(target))
    index = target
    render(scene)
    tick()
  }

  function moveTo(i, rate) {
    i = Math.max(0, Math.min(N, i))
    if (i === index) { emit(); return }
    target = i
    moverRate = rate
    const dur = Math.abs(labelTime(i) - tl.time()) / rate
    mover = g.to(tl, {
      time: labelTime(i), duration: dur, ease: 'none',
      onUpdate: () => { render(scene); tick() },
      onComplete: () => {
        mover = null
        index = i
        render(scene)
        tick()
        emit()
        if (playing) scheduleNext()
      },
    })
    emit()
  }

  function scheduleNext() {
    wait?.kill()
    if (index >= N) { playing = false; emit(); return }
    const hold = index === 0 ? START_HOLD : (steps[index - 1].hold ?? DEFAULT_HOLD)
    const h = { v: 0 }
    wait = g.to(h, {
      v: 1, duration: hold / speed, ease: 'none',
      onUpdate: () => tick(h.v),
      onComplete: () => { wait = null; tick(0); moveTo(index + 1, speed) },
    })
  }

  const api = {
    get index() { return target },
    get total() { return N },
    get playing() { return playing },
    get busy() { return !!mover },
    next() {
      if (mover) { snap(); emit(); return }
      moveTo(index + 1, speed)
    },
    prev() {
      snap()
      moveTo(index - 1, speed * BACK_RATE)
    },
    goto(i) {
      wait?.kill()
      mover?.kill()
      mover = null
      index = target = Math.max(0, Math.min(N, i))
      tl.seek(labelTime(index))
      render(scene)
      tick()
      emit()
    },
    reset() { api.pause(); api.goto(0) },
    play() {
      if (playing) return
      if (index >= N && !mover) api.goto(0)
      playing = true
      emit()
      if (!mover) scheduleNext()
    },
    pause() {
      playing = false
      wait?.kill()
      wait = null
      tick()
      emit()
    },
    toggle() { playing ? api.pause() : api.play() },
    setSpeed(s) {
      speed = s
      if (mover && target > index) mover.timeScale(s / moverRate)
      if (wait) scheduleNext()
    },
    destroy() {
      api.pause()
      mover?.kill()
      tl.seek(0)          // DOM-Tweens (Folienkarten) auf ihre Ausgangswerte zurücksetzen
      tl.kill()
    },
  }

  render(scene)
  emit()
  tick()
  return api
}

// ── Presenter: Transportleiste, Kapitel-Tabs, Tastatur ───────────────────────
// chapters: [{ id, title, disabled?, create(onChange, onTick) → engine }]
const ICON = {
  reset: '<path d="M5 4v12"/><path d="M15 4 8 10l7 6"/>',
  prev:  '<path d="M12.5 4 6.5 10l6 6"/>',
  next:  '<path d="M7.5 4l6 6-6 6"/>',
  play:  '<path d="M6.5 4.5v11l9-5.5z" fill="currentColor"/>',
  pause: '<path d="M7 4.5v11M13 4.5v11"/>',
}
const svgIcon = name => `<svg viewBox="0 0 20 20" class="tp-ico" aria-hidden="true">${ICON[name]}</svg>`
const fmtSpeed = s => String(s).replace('.', ',') + '×'

export function createPresenter({ root, chapters, speeds = [0.5, 1, 2], onChapter = () => {} }) {
  let engine = null, chapter = null, speed = 1

  root.innerHTML = `
    <div class="tp-scrub" role="group" aria-label="Fortschritt"></div>
    <div class="tp-row">
      <div class="tp-chapters" role="tablist" aria-label="Kapitel">
        ${chapters.map(c => `<button class="tp-tab" role="tab" data-ch="${c.id}"
          ${c.disabled ? 'disabled title="In Vorbereitung"' : ''}>${c.title}${
          c.disabled ? ' <span class="tp-soon">bald</span>' : ''}</button>`).join('')}
      </div>
      <div class="tp-buttons">
        <button class="tp-btn icon" data-act="reset" title="Zurück an den Anfang (Pos1)"
          aria-label="Zurück an den Anfang">${svgIcon('reset')}</button>
        <button class="tp-btn" data-act="prev" title="Schritt zurück (←)">${svgIcon('prev')}Zurück</button>
        <button class="tp-btn primary" data-act="next" title="Nächster Schritt (→ / Leertaste)">Weiter${svgIcon('next')}</button>
        <button class="tp-btn" data-act="play" title="Auto-Play an/aus (P)"></button>
        <div class="tp-speeds speed-pills" role="radiogroup" aria-label="Tempo">
          ${speeds.map(s => `<label class="speed-pill${s === speed ? ' active' : ''}">
            <input type="radio" name="tp_speed" value="${s}" ${s === speed ? 'checked' : ''}>${fmtSpeed(s)}</label>`).join('')}
        </div>
      </div>
      <div class="tp-meta">
        <span class="tp-count" aria-live="polite"></span>
        <span class="tp-keys" title="← → Schritt · Leertaste weiter · P Auto-Play · Pos1 Anfang · F Vollbild · H Bedienung ausblenden">⌨</span>
      </div>
    </div>`

  const q = s => root.querySelector(s)
  const scrub = q('.tp-scrub')
  const btn = { reset: q('[data-act=reset]'), prev: q('[data-act=prev]'),
    next: q('[data-act=next]'), play: q('[data-act=play]') }
  const count = q('.tp-count')

  function update(st) {
    btn.prev.disabled = st.index === 0
    btn.next.disabled = st.index === st.total && !st.busy
    btn.play.innerHTML = st.playing ? `${svgIcon('pause')}Pause` : `${svgIcon('play')}Auto-Play`
    btn.play.classList.toggle('active', st.playing)
    count.innerHTML = `<b>${st.index}</b> / ${st.total}<span class="tp-title">${st.title}</span>`
    if (scrub.children.length !== st.total) {
      scrub.innerHTML = Array.from({ length: st.total }, (_, i) =>
        `<button class="tp-seg" data-i="${i + 1}" aria-label="Schritt ${i + 1}"></button>`).join('')
    }
    ;[...scrub.children].forEach((seg, i) => seg.classList.toggle('current', i + 1 === st.index))
  }

  // Füllung je Segment: Fortschritt des Schritts + Auto-Play-Countdown im nächsten
  function progress({ pos, hold, holdIndex }) {
    ;[...scrub.children].forEach((seg, i) => {
      seg.style.setProperty('--p', Math.max(0, Math.min(1, pos - i)).toFixed(4))
      seg.style.setProperty('--h', i + 1 === holdIndex ? hold.toFixed(4) : '0')
    })
  }

  function selectChapter(id) {
    const ch = chapters.find(c => c.id === id && !c.disabled)
    if (!ch || ch === chapter) return
    engine?.destroy()
    chapter = ch
    root.querySelectorAll('.tp-tab').forEach(t => {
      const on = t.dataset.ch === id
      t.classList.toggle('active', on)
      t.setAttribute('aria-selected', on)
    })
    onChapter(id)
    engine = ch.create(update, progress)
    engine.setSpeed(speed)
  }

  const manual = fn => () => { engine.pause(); fn() }
  const act = {
    reset: () => engine.reset(),
    prev: manual(() => engine.prev()),
    next: manual(() => engine.next()),
    play: () => engine.toggle(),
  }
  Object.entries(btn).forEach(([k, el]) => el.addEventListener('click', act[k]))
  scrub.addEventListener('click', e => {
    const i = e.target.closest('.tp-seg')?.dataset.i
    if (i) { engine.pause(); engine.goto(+i) }
  })
  q('.tp-chapters').addEventListener('click', e => {
    const id = e.target.closest('.tp-tab')?.dataset.ch
    if (id) selectChapter(id)
  })
  q('.tp-speeds').addEventListener('change', e => {
    speed = +e.target.value
    root.querySelectorAll('.tp-speeds .speed-pill').forEach(p =>
      p.classList.toggle('active', p.querySelector('input').checked))
    e.target.blur()
    engine.setSpeed(speed)
  })

  document.addEventListener('keydown', e => {
    // Nur Texteingaben ausnehmen — ein fokussierter Tempo-Radio darf die
    // Presenter-Tasten nicht schlucken (preventDefault verhindert dort auch
    // das native Pfeiltasten-Umschalten der Radios).
    const typing = e.target.closest('textarea, select, input:not([type=radio]):not([type=checkbox])')
    if (typing || e.altKey || e.ctrlKey || e.metaKey) return
    const k = e.key
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') act.next()
    else if (k === 'ArrowLeft' || k === 'PageUp') act.prev()
    else if (k === 'Home') act.reset()
    else if (k === 'End') { engine.pause(); engine.goto(engine.total) }
    else if (k === 'p' || k === 'P') act.play()
    else if (k === 'h' || k === 'H') document.body.classList.toggle('ui-hidden')
    else return
    e.preventDefault()
    if (document.activeElement?.blur && document.activeElement !== document.body) document.activeElement.blur()
  })

  selectChapter(chapters.find(c => !c.disabled).id)
  return { get engine() { return engine }, selectChapter }
}
