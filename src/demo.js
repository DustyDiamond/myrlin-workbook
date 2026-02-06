#!/usr/bin/env node
/**
 * Demo launcher - shortcut for `node src/index.js --demo`
 * Seeds sample data and launches the TUI for demonstration/screenshots.
 */

// Inject --demo into args if not already present
if (!process.argv.includes('--demo')) {
  process.argv.push('--demo');
}

require('./index');
