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
const BEAT_HOLD = 1.8       // s bei 1× — Verweildauer nach einem Zwischenhalt (Präsentationsmodus)

// ── Zwischenhalte (Präsentationsmodus, → BACKLOG FSS25) ─────────────────────
// beat(tl) markiert im Drehbuch eines Schritts eine Stelle, an der der Präsentations-
// modus anhält (ein eigener Schritt). Der Animationsmodus spielt darüber hinweg.
// Ein Zwischenhalt liegt am Ende alles bisher Gebauten. Ein leerer Null-Tween am Halt sorgt
// dafür, daß sich '>' / '<' des nächsten Tweens auf den Halt beziehen (nicht auf den zuletzt
// eingefügten, evtl. früher endenden Tween). Nichts darf über einen Halt hinweglaufen —
// die Engine warnt sonst (negative Versätze wie '>-0.2' direkt nach einem Halt vermeiden).
let _beatN = 0
export const beat = tl => {
  const name = 'beat_' + (++_beatN)
  tl.addLabel(name)
  tl.set({}, {}, name)
  return name
}
export const MODES = ['anim', 'pres']

export function createStepEngine({ steps, scene, render, onChange = () => {}, onTick = () => {}, mode = 'anim' }) {
  const g = window.gsap
  const tl = g.timeline({ paused: true })
  tl.addLabel('s0', 0)
  // Haltepunkte je Modus: { t, title, hold } — Animationsmodus nur Schrittenden,
  // Präsentationsmodus zusätzlich die Zwischenhalte (beat) innerhalb der Schritte
  // step: zugehöriger Schritt (Nummer wie im Animationsmodus, FSS37) — Zähler und Leiste
  // zeigen in beiden Modi dieselben Schritte, die Zwischenhalte als Teilstriche darin
  const STOPS = { anim: [{ t: 0, title: 'Start', step: 0 }], pres: [{ t: 0, title: 'Start', step: 0 }] }
  const SUBS = []                                       // je Schritt: Anteile der Zwischenhalte (0…1)
  steps.forEach((step, i) => {
    const sub = g.timeline()
    step.build(sub, scene)
    if (sub.duration() < MIN_STEP) sub.to({}, { duration: MIN_STEP - sub.duration() })
    // 1 ms Abstand: ein set() am Schrittanfang liegt sonst exakt auf dem Label des
    // Vorschritts und bliebe beim Zurückspringen auf dieses Label angewendet.
    tl.add(sub, '+=0.001')
    tl.addLabel('s' + (i + 1))
    const t0 = sub.startTime(), end = tl.labels['s' + (i + 1)]
    const beats = Object.entries(sub.labels).filter(([k]) => k.startsWith('beat_'))
      .map(([, t]) => t).filter(t => t > 0.05 && t < sub.duration() - 0.05).sort((a, b) => a - b)
    // Prüfen: läuft ein Tween über einen Zwischenhalt hinweg? (Drehbuch-Fehler)
    const kids = sub.getChildren(true, true, false)
    for (const b of beats) {
      const k = kids.find(c => c.startTime() < b - 1e-4 && c.startTime() + c.totalDuration() > b + 1e-4)
      if (k) console.warn(`[step-engine] Zwischenhalt in „${step.title}" bei ${b.toFixed(2)} s überlappt einen Tween`
        + ` (${Object.keys(k.vars).filter(v => !['duration', 'ease'].includes(v)).join(', ')}:`
        + ` ${k.startTime().toFixed(2)}–${(k.startTime() + k.totalDuration()).toFixed(2)} s)`)
    }
    const m = beats.length + 1, n = i + 1, start = tl.labels['s' + i]
    beats.forEach((b, k) => STOPS.pres.push({ t: t0 + b, title: `${step.title} · ${k + 1}/${m}`, hold: BEAT_HOLD, step: n }))
    STOPS.pres.push({ t: end, title: m > 1 ? `${step.title} · ${m}/${m}` : step.title, hold: step.hold, step: n })
    STOPS.anim.push({ t: end, title: step.title, hold: step.hold, step: n })
    SUBS.push(beats.map(b => (t0 + b - start) / (end - start)))
  })
  let stops = STOPS[mode] ?? STOPS.anim
  let N = stops.length - 1

  let index = 0, target = 0, mover = null, moverRate = 1   // moverRate: Rate bei Erzeugung
  let playing = false, speed = 1, wait = null

  const labelTime = i => stops[i].t
  // Kontinuierliche Position in Schritt-Einheiten des Animationsmodus (2,4 = Schritt 3 zu
  // 40 % gelaufen) — in beiden Modi, damit die Leiste dieselben Schritte zeigt (FSS37)
  const A = STOPS.anim, NA = A.length - 1
  const posAt = t => {
    for (let j = 1; j <= NA; j++) {
      const a = A[j - 1].t, b = A[j].t
      if (t <= b + 1e-9) return j - 1 + Math.max(0, Math.min(1, (t - a) / (b - a)))
    }
    return NA
  }
  // Auto-Play-Countdown: heller Vorlauf im Segment des nächsten Wegstücks, vom aktuellen
  // Stand bis zum nächsten Halt (Präsentationsmodus: bis zum nächsten Teilstrich)
  const tick = (hold = 0) => {
    const pc = posAt(labelTime(index)), pn = index < N ? posAt(labelTime(index + 1)) : pc
    const seg = pn > pc ? Math.floor(pc + 1e-9) : -1
    onTick({ pos: posAt(tl.time()), hold: seg < 0 ? 0 : pc - seg + hold * (pn - pc), holdIndex: seg + 1 })
  }
  const emit = () => onChange({
    index: target, total: N, playing, busy: !!mover,
    title: stops[target].title, mode, step: stops[target].step, steps: NA, subs: SUBS,
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
    const hold = index === 0 ? START_HOLD : (stops[index].hold ?? DEFAULT_HOLD)
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
    title: i => stops[i]?.title ?? '',                       // Schritt-Titel (Druck, step-print.js)
    stepOf: i => stops[i]?.step ?? 0,                        // Schrittnummer des Animationsmodus (FSS37)
    get steps() { return NA },
    get mode() { return mode },
    get hasBeats() { return STOPS.pres.length > STOPS.anim.length },
    // Schritt n (Nummer des Animationsmodus) im aktiven Modus anspringen: dessen Ende
    gotoStep(n) { api.goto(stops.findIndex(s => s.step === n && s.t >= A[n].t - 1e-6)) },
    // Modus wechseln, ohne die Stelle zu verlieren: letzter Haltepunkt des neuen Modus
    // an oder vor der aktuellen Zeit (im Animationsmodus also der Anfang des Schritts)
    setMode(m) {
      if (!STOPS[m] || m === mode) return
      wait?.kill(); mover?.kill(); mover = null
      const t = tl.time()
      mode = m; stops = STOPS[m]; N = stops.length - 1
      let i = 0
      while (i < N && stops[i + 1].t <= t + 1e-6) i++
      api.goto(i)
    },
    refresh() { render(scene) },          // neu zeichnen ohne Zeitsprung (z. B. nach Schrift-Nachladen)
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
  // Modus: Animation (Schritte) oder Präsentation (feinere Schritte) — Taste A, gemerkt
  const MODE_KEY = 'fh_step_mode'
  let mode = 'anim'
  try { if (localStorage.getItem(MODE_KEY) === 'pres') mode = 'pres' } catch { /* ohne Speicher */ }

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
        <span class="tp-keys" title="← → Schritt · Leertaste weiter · P Auto-Play · Pos1 Anfang · F Vollbild · A Animations-/Präsentationsmodus · H Bedienung ausblenden">⌨</span>
      </div>
    </div>`
  // kurze Einblendung beim Umschalten des Modus (kein dauerhaft sichtbarer Schalter)
  const toast = document.createElement('div')
  toast.className = 'tp-toast'
  toast.setAttribute('aria-live', 'polite')
  document.body.append(toast)
  let toastTimer = null
  const showToast = text => {
    toast.textContent = text
    toast.classList.add('on')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => toast.classList.remove('on'), 1600)
  }

  const q = s => root.querySelector(s)
  const scrub = q('.tp-scrub')
  const btn = { reset: q('[data-act=reset]'), prev: q('[data-act=prev]'),
    next: q('[data-act=next]'), play: q('[data-act=play]') }
  const count = q('.tp-count')

  // Position in der Adresse (#kapitel/schritt): Neuladen bleibt an derselben Stelle,
  // Links auf einen Schritt sind möglich. replaceState → keine Verlaufs-Flut.
  let lastHash = ''
  function writeHash(index) {
    const h = `#${chapter.id}/${mode === 'pres' ? 'p' : ''}${index}`
    if (h === lastHash) return
    lastHash = h
    history.replaceState(null, '', h)
  }
  function readHash() {
    const m = location.hash.match(/^#([\w-]+)(?:\/(p?)(\d+))?$/)
    return m ? { id: m[1], mode: m[2] ? 'pres' : m[3] !== undefined ? 'anim' : null,
      index: m[3] === undefined ? 0 : +m[3] } : null
  }

  function update(st) {
    writeHash(st.index)
    btn.prev.disabled = st.index === 0
    btn.next.disabled = st.index === st.total && !st.busy
    btn.play.innerHTML = st.playing ? `${svgIcon('pause')}Pause` : `${svgIcon('play')}Auto-Play`
    btn.play.classList.toggle('active', st.playing)
    // Zähler und Leiste in Schritten des Animationsmodus (beide Modi gleich, FSS37); die
    // Zwischenhalte des Präsentationsmodus als Teilstriche im Segment, der Titel nennt „· 2/3"
    count.innerHTML = `<b>${st.step}</b> / ${st.steps}<span class="tp-title">${st.title}</span>`
    if (scrub.children.length !== st.steps || scrub._subs !== st.subs) {
      scrub._subs = st.subs
      scrub.innerHTML = st.subs.map((fr, i) =>
        `<button class="tp-seg" data-i="${i + 1}" aria-label="Schritt ${i + 1}">${fr.map(f =>
          `<i class="tp-sub" style="left:${(100 * f).toFixed(2)}%"></i>`).join('')}</button>`).join('')
    }
    ;[...scrub.children].forEach((seg, i) => seg.classList.toggle('current', i + 1 === st.step && st.step > 0))
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
    engine.setMode?.(mode)
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
    if (i) { engine.pause(); engine.gotoStep(+i) }
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
    else if (k === 'a' || k === 'A') setMode(mode === 'pres' ? 'anim' : 'pres', true)
    else return
    e.preventDefault()
    if (document.activeElement?.blur && document.activeElement !== document.body) document.activeElement.blur()
  })

  function setMode(m, announce) {
    if (m === mode) return
    mode = m
    try { localStorage.setItem(MODE_KEY, m) } catch { /* ohne Speicher */ }
    engine.pause()
    engine.setMode?.(m)
    document.body.classList.toggle('mode-pres', m === 'pres')
    if (announce) showToast(m === 'pres' ? 'Präsentationsmodus – kleinere Schritte' : 'Animationsmodus')
  }
  document.body.classList.toggle('mode-pres', mode === 'pres')

  // Start: Position aus der Adresse, sonst erstes Kapitel
  const go = h => {
    if (h?.mode && h.mode !== mode && engine) setMode(h.mode)
    else if (h?.mode) { mode = h.mode; document.body.classList.toggle('mode-pres', mode === 'pres') }
    const ok = h && chapters.some(c => c.id === h.id && !c.disabled)
    selectChapter(ok ? h.id : chapters.find(c => !c.disabled).id)
    if (ok && h.index) { engine.pause(); engine.goto(h.index) }
    lastHash = ''
    writeHash(engine.index)           // ungültige Adresse durch die tatsächliche Position ersetzen
  }
  go(readHash())
  // Textmaße (Kästen um Ziffern, Beschriftungsbreiten) hängen von der Schrift ab: sobald
  // eine Web-Schrift nachgeladen ist, die Bühne neu zeichnen — sonst bleiben Kästen an den
  // Maßen der Ersatzschrift hängen (BACKLOG B54)
  const refresh = () => engine?.refresh()
  document.fonts?.ready.then(refresh)
  document.fonts?.addEventListener?.('loadingdone', refresh)
  window.addEventListener('hashchange', () => {
    if (location.hash !== lastHash) go(readHash())
  })
  return {
    get engine() { return engine }, selectChapter,
    get chapter() { return chapter?.id },
    get mode() { return mode }, setMode,
    chapters: chapters.filter(c => !c.disabled).map(({ id, title }) => ({ id, title })),
  }
}
