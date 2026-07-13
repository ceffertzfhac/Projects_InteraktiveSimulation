// Vitest-Konfiguration — dev-only, beeinflußt die Simulationen nicht.
// → BACKLOG I3. Die Physics-Module sind reine ES-Module (relative Imports,
// kein Transform) und importieren transitiv nur constants.js + state.js.
// state.js hält jegliches document.* in initDOM()-Body → importierbar ohne DOM
// (environment: node). → CLAUDE.md „kein Build, kein npm" gilt für die *Sims*.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    globals: false,
  },
})