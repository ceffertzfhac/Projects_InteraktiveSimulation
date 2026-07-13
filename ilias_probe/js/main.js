import { probeValue } from './mod.js'

// Erscheint nur, wenn der ES-Modul-Import über ILIAS funktioniert hat.
const el = document.getElementById('mod-result')
if (el) el.textContent = probeValue