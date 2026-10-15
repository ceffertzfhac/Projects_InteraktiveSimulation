'use strict'
// Füllt die data-dyn-Spans der Folienkarten aus dem Modell (eine Quelle für jede Zahl).
import { fmt } from '../../shared/js/format.js'
import { store } from './state.js'
import { MU, G_TRUE } from './model.js'

export function fillCards(root = document) {
  const D = store.data
  const f = x => fmt(x, 2)
  const sum = n => D.values.slice(0, n).reduce((a, b) => a + b, 0)
  const t = D.tally
  const tallyText = t.inside >= 5 && t.inside <= 9
    ? 'Das passt zu etwa 68 %.'
    : 'Das weicht ab: Bei nur 10 Werten schwankt der Anteil stark. Erst viele Messungen nähern sich 68,3 %.'
  const v = {
    gE: f(MU), gTrue: f(G_TRUE),
    sum10: f(sum(10)), mean10: f(D.n10.mean), sigma10: f(D.n10.sigma),
    lo10: f(D.n10.mean - D.n10.sigma), hi10: f(D.n10.mean + D.n10.sigma),
    tIn: String(t.inside), tOut: String(t.outside), tallyText,
    mean20: f(D.n20.mean), sigma20: f(D.n20.sigma), u20: f(D.n20.u),
    mean40: f(D.n40.mean), sigma40: f(D.n40.sigma), u40: f(D.n40.u),
  }
  root.querySelectorAll('[data-dyn]').forEach(el => {
    const k = el.dataset.dyn
    if (k in v) el.textContent = v[k]
  })
}
