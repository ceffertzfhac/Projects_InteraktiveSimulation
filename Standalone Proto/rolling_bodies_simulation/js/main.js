/**
 * Main entry point
 * @module main
 */

import * as state from './state.js';
import * as render from './render.js';
import * as ui from './ui.js';
import { INIT_DELAY_MS } from './constants.js';

// ══════════════════════════════════════════════════════════════════
//  GLOBAL ERROR HANDLER
// ══════════════════════════════════════════════════════════════════
window.addEventListener('error', (e) => {
  console.error('Uncaught error:', e.error || e.message);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

// ══════════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════════
window.addEventListener('load', () => {
  try {
    // Initialize DOM cache
    state.initDOMCache();
    
    // Setup UI event handlers
    ui.setupUI();
    
    // Initialize simulation after a short delay
    setTimeout(() => ui.resetSim(), INIT_DELAY_MS);
    
    console.log('Simulation initialized successfully');
  } catch (err) {
    console.error('Initialization failed:', err);
  }
});
