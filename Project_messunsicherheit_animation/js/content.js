'use strict'
// Füllt die data-dyn-Spans der Folienkarten aus dem Modell (eine Quelle für jede Zahl).
import { fmt } from '../../shared/js/format.js'
import { store } from './state.js'

export function fillCards(root = document) {
  const D = store.data
  const sum = n => D.values.slice(0, n).reduce((a, b) => a + b, 0)
  const v = {
    sum10: fmt(sum(10), 2),
    mean10: fmt(D.n10.mean, 2),
  }
  root.querySelectorAll('[data-dyn]').forEach(el => {
    const k = el.dataset.dyn
    if (k in v) el.textContent = v[k]
  })
}
