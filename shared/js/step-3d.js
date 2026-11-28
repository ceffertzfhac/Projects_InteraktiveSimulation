'use strict'
// 3D-Bühne für Schritt-Animationen (→ BACKLOG I27, Blueprint §10.7). Three.js per CDN, gepinnt.
//
// Grundsatz wie in der 2D-Engine: Die Szene ist ein flaches Objekt aus ZAHLEN. Die Animation
// erzeugt alle Three.js-Objekte EINMAL (Bausteine unten) und setzt in render(S) nur deren Lage,
// Länge, Deckkraft und Farbe aus den Szenen-Zahlen — kein Tween auf Three.js-Objekten, kein
// Hinzufügen/Entfernen im Drehbuch. Dadurch bleibt Weiter/Zurück/Sprung exakt (Blueprint §10.3).
//
// Koordinaten: Physik = Three.js-Welt (rechtshändig, y oben, z zum Betrachter).
// Kamera: Kugelkoordinaten um einen Zielpunkt — Azimut (Grad, ab +z Richtung +x), Elevation
// (Grad), Abstand. Dazu ein NUTZER-VERSATZ (freies Drehen/Zoomen bei Pause), der nicht zur Szene
// gehört und weich auf null zurückfährt (resetUser).
//
// Beschriftungen: statisches HTML (MathJax) in einem Overlay über der Leinwand; label() projiziert
// einen 3D-Punkt und setzt nur Lage und Deckkraft. Druck: Container trägt data-print-snapshot,
// step-print.js ersetzt die Leinwand im Ausdruck durch ein Bild (preserveDrawingBuffer).

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js'

export { THREE }
export const THREE_VERSION = '0.170.0'

const UP = new THREE.Vector3(0, 1, 0)
const DEG = Math.PI / 180
const V = (a) => (a instanceof THREE.Vector3 ? a : new THREE.Vector3(a[0], a[1], a[2]))

// ── Farben aus CSS-Tokens, je Thema zwischengespeichert ─────────────────────
function createPalette() {
  let theme = null, cache = new Map()
  const check = () => {
    const t = document.body.classList.contains('dark') ? 'dark' : 'light'
    if (t !== theme) { theme = t; cache = new Map() }
  }
  return {
    // Token oder CSS-Farbe → THREE.Color (Kopie nicht nötig: nur lesen)
    get(token) {
      check()
      if (!cache.has(token)) {
        const raw = token.startsWith('--')
          ? getComputedStyle(document.body).getPropertyValue(token).trim() : token
        cache.set(token, new THREE.Color(raw || '#888'))
      }
      return cache.get(token)
    },
    // Mischfarbe zweier Tokens (t = 0 … 1)
    mix(a, b, t) { return this.get(a).clone().lerp(this.get(b), Math.max(0, Math.min(1, t))) },
    get theme() { check(); return theme },
  }
}

export function createStage3D({ container, fov = 30, maxDpr = 2 } = {}) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  } catch (err) {
    const note = document.createElement('div')
    note.className = 'stage-3d-nogl'
    note.textContent = 'Die 3D-Darstellung braucht WebGL – bitte Hardwarebeschleunigung im Browser einschalten.'
    container.appendChild(note)
    throw err
  }
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr))
  const canvas = renderer.domElement
  canvas.className = 'stage-3d-canvas'
  container.appendChild(canvas)
  const labelLayer = document.createElement('div')
  labelLayer.className = 'stage-3d-labels'
  container.appendChild(labelLayer)
  container.dataset.printSnapshot = ''

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(fov, 16 / 9, 0.1, 200)
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8bcc8, 1.9))
  const sun = new THREE.DirectionalLight(0xffffff, 1.1)
  sun.position.set(4, 9, 6)
  scene.add(sun)

  const palette = createPalette()
  const user = { az: 0, el: 0, zoom: 0 }        // Nutzer-Versatz (Grad, Grad, log2 des Abstands)
  let cam = { az: 0, el: 0, d: 10, tx: 0, ty: 0, tz: 0 }
  let redraw = () => api.render()
  const labels = []

  function applyCamera() {
    const az = (cam.az + user.az) * DEG
    const el = Math.max(-88, Math.min(88, cam.el + user.el)) * DEG
    const d = cam.d * 2 ** user.zoom
    const t = new THREE.Vector3(cam.tx, cam.ty, cam.tz)
    const ce = Math.cos(el)
    camera.position.set(t.x + d * Math.sin(az) * ce, t.y + d * Math.sin(el), t.z + d * Math.cos(az) * ce)
    camera.up.copy(UP)
    camera.lookAt(t)
    camera.updateMatrixWorld()
  }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    redraw()
  }
  new ResizeObserver(resize).observe(container)

  // ── Freies Drehen/Zoomen (nur wenn allowed() true liefert, d. h. bei Pause) ──
  let allowed = () => true, drag = null, resetTween = null
  const changed = () => { redraw(); api.onUser?.(api.userActive) }
  canvas.addEventListener('pointerdown', e => {
    if (!allowed() || e.button !== 0) return
    resetTween?.kill()
    drag = { x: e.clientX, y: e.clientY }
    canvas.setPointerCapture(e.pointerId)
    canvas.classList.add('dragging')
  })
  canvas.addEventListener('pointermove', e => {
    if (!drag) return
    if (!allowed()) { drag = null; return }
    user.az -= (e.clientX - drag.x) * 0.35
    user.el = Math.max(-80 - cam.el, Math.min(80 - cam.el, user.el + (e.clientY - drag.y) * 0.35))
    drag = { x: e.clientX, y: e.clientY }
    changed()
  })
  const endDrag = () => { drag = null; canvas.classList.remove('dragging') }
  canvas.addEventListener('pointerup', endDrag)
  canvas.addEventListener('pointercancel', endDrag)
  canvas.addEventListener('wheel', e => {
    if (!allowed()) return
    e.preventDefault()
    resetTween?.kill()
    user.zoom = Math.max(-1.5, Math.min(1.5, user.zoom + e.deltaY * 0.0015))
    changed()
  }, { passive: false })

  // ── Bausteine ───────────────────────────────────────────────────────────────
  const matOf = (opts = {}) => new THREE.MeshLambertMaterial({ transparent: true, ...opts })

  // Pfeil: Schaft (Zylinder) + Spitze (Kegel); die Spitze endet exakt am Zielpunkt.
  // Ist der Pfeil nicht länger als die Spitze, wird er ausgeblendet (B23 sinngemäß).
  function arrow({ radius = 0.035, head = 0.22, headR = 0.085, order = 3 } = {}) {
    const g = new THREE.Group()
    const mat = matOf()
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 20).translate(0, 0.5, 0), mat)
    const tip = new THREE.Mesh(new THREE.ConeGeometry(headR, head, 28).translate(0, -head / 2, 0), mat)
    shaft.renderOrder = tip.renderOrder = order
    g.add(shaft, tip)
    scene.add(g)
    const dir = new THREE.Vector3()
    return {
      obj: g,
      // from/to: [x,y,z]; opacity 0 → unsichtbar; color: THREE.Color
      set(from, to, { opacity = 1, color } = {}) {
        const a = V(from), b = V(to)
        dir.subVectors(b, a)
        const len = dir.length()
        g.visible = opacity > 0.002 && len > head + 1e-6
        if (!g.visible) return
        dir.divideScalar(len)
        g.position.copy(a)
        g.quaternion.setFromUnitVectors(UP, dir)
        shaft.scale.set(1, len - head, 1)
        tip.position.set(0, len, 0)
        mat.opacity = opacity
        mat.depthWrite = opacity > 0.98
        if (color) mat.color.copy(color)
      },
    }
  }

  // Ebenenstück: Quadrat der Kantenlänge size um c in der Basis e1, e2 (halbtransparent) + Rand.
  function plane({ order = 10 } = {}) {
    const g = new THREE.Group()
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide, depthWrite: false }))
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)),
      new THREE.LineBasicMaterial({ transparent: true }))
    fill.renderOrder = order; edge.renderOrder = order
    g.add(fill, edge)
    scene.add(g)
    const m = new THREE.Matrix4()
    return {
      obj: g,
      set({ c, e1, e2, size = 3, opacity = 1, fillAlpha = 0.22, color, edgeColor }) {
        g.visible = opacity > 0.002
        if (!g.visible) return
        const n = new THREE.Vector3().crossVectors(V(e1), V(e2))
        m.makeBasis(V(e1).multiplyScalar(size), V(e2).multiplyScalar(size), n)
        m.setPosition(V(c))
        g.matrixAutoUpdate = false
        g.matrix.copy(m)
        fill.material.opacity = opacity * fillAlpha
        edge.material.opacity = opacity * 0.75
        if (color) fill.material.color.copy(color)
        if (edgeColor || color) edge.material.color.copy(edgeColor || color)
      },
    }
  }

  // Kugel (Objekt, Punkt)
  function sphere({ r = 0.08, order = 4 } = {}) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 18), matOf())
    mesh.renderOrder = order
    scene.add(mesh)
    return {
      obj: mesh,
      set(pos, { opacity = 1, scale = 1, color } = {}) {
        mesh.visible = opacity > 0.002 && scale > 0.002
        if (!mesh.visible) return
        mesh.position.copy(V(pos))
        mesh.scale.setScalar(scale)
        mesh.material.opacity = opacity
        mesh.material.depthWrite = opacity > 0.98
        if (color) mesh.material.color.copy(color)
      },
    }
  }

  // Röhre entlang fester Stützpunkte (Bahn, Spur); sichtbarer Anteil über frac (0 … 1).
  function tube(points, { radius = 0.018, order = 2, closed = false } = {}) {
    const curve = new THREE.CatmullRomCurve3(points.map(V), closed)
    const seg = Math.max(8, points.length * 2)
    const geo = new THREE.TubeGeometry(curve, seg, radius, 10, closed)
    const mesh = new THREE.Mesh(geo, matOf())
    mesh.renderOrder = order
    scene.add(mesh)
    const per = geo.index.count / seg
    return {
      obj: mesh,
      set({ frac = 1, from = 0, opacity = 1, color } = {}) {
        const a = Math.max(0, Math.min(1, from)), b = Math.max(0, Math.min(1, frac))
        mesh.visible = opacity > 0.002 && b > a
        if (!mesh.visible) return
        const s0 = Math.floor(a * seg), s1 = Math.ceil(b * seg)
        geo.setDrawRange(s0 * per, (s1 - s0) * per)
        mesh.material.opacity = opacity
        mesh.material.depthWrite = opacity > 0.98
        if (color) mesh.material.color.copy(color)
      },
    }
  }

  // Beschriftung: HTML-Element (statisch, MathJax) folgt einem 3D-Punkt.
  // offset: Versatz in Bildschirmpixeln der Bühne (bei 800 px Breite); Element wird mittig gesetzt.
  function label(el) {
    labelLayer.appendChild(el)
    el.classList.add('label-3d')
    const p = new THREE.Vector3()
    const L = {
      el,
      set(pos, { opacity = 1, dx = 0, dy = 0 } = {}) {
        L.state = { pos, opacity, dx, dy }
        if (opacity < 0.002) { el.style.visibility = 'hidden'; return }
        p.copy(V(pos)).project(camera)
        const w = container.clientWidth || 1, k = w / 800
        el.style.visibility = p.z < 1 ? 'visible' : 'hidden'
        el.style.opacity = opacity
        el.style.left = (((p.x + 1) / 2) * 100 + (dx * k / w) * 100).toFixed(3) + '%'
        el.style.top = (((1 - p.y) / 2) * 100 + (dy * k / (container.clientHeight || 1)) * 100).toFixed(3) + '%'
      },
    }
    labels.push(L)
    return L
  }

  const api = {
    THREE, scene, camera, renderer, canvas, palette, labelLayer,
    arrow, plane, sphere, tube, label,
    // Kamera aus Szenen-Zahlen: { az, el, d, tx, ty, tz }
    setCamera(c) { cam = { ...cam, ...c } },
    // Punkt in der Welt → Bildschirm (0 … 1 in der Leinwand)
    project(pos) { const p = V(pos).clone().project(camera); return { x: (p.x + 1) / 2, y: (1 - p.y) / 2 } },
    render() {
      applyCamera()
      renderer.render(scene, camera)
      for (const L of labels) if (L.state) L.set(L.state.pos, L.state)
    },
    // Neuzeichnen von außen (Szene wird von der Animation gehalten)
    setRedraw(fn) { redraw = fn },
    setAllowed(fn) { allowed = fn },
    onUser: null,
    get userActive() { return Math.abs(user.az) + Math.abs(user.el) + Math.abs(user.zoom) > 1e-3 },
    // Nutzer-Versatz weich auf null (nächster Schritt, Auto-Play, Taste R)
    resetUser(duration = 0.8) {
      if (!api.userActive) return
      resetTween?.kill()
      resetTween = window.gsap.to(user, { az: 0, el: 0, zoom: 0, duration, ease: 'power2.inOut',
        onUpdate: changed, onComplete: () => { resetTween = null; changed() } })
    },
    // sofort auf null (Druck)
    clearUser() { resetTween?.kill(); user.az = user.el = user.zoom = 0; api.onUser?.(false) },
  }
  return api
}
