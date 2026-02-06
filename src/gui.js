#!/usr/bin/env node
/**
 * Claude Workspace Manager - GUI Entry Point
 *
 * Starts the Express web server and opens the browser.
 * Use --demo to seed sample workspaces and sessions on first run.
 *
 * Usage:
 *   node src/gui.js           Launch the web GUI
 *   node src/gui.js --demo    Launch with demo data (if store is empty)
 *
 * Environment:
 *   PORT=3456                 Override the default port
 */

const { getStore } = require('./state/store');
const { startServer, getPtyManager } = require('./web/server');

// ─── Initialize Store ──────────────────────────────────────

const store = getStore();

// ─── Demo Data Seeding ─────────────────────────────────────

if (process.argv.includes('--demo')) {
  // Only seed if there are no existing workspaces
  if (store.getAllWorkspacesList().length === 0) {
    const ws1 = store.createWorkspace({
      name: 'SignalSentry',
      description: 'IoT sensor network',
    });
    const ws2 = store.createWorkspace({
      name: 'Pantex API',
      description: 'Backend services',
    });
    const ws3 = store.createWorkspace({
      name: 'Documentation',
      description: 'Docs & guides',
    });

    store.createSession({
      name: 'firmware-dev',
      workspaceId: ws1.id,
      workingDir: 'C:\\Projects\\signal-sentry',
      topic: 'ESP32 firmware',
    });
    store.createSession({
      name: 'ble-scanner',
      workspaceId: ws1.id,
      workingDir: 'C:\\Projects\\signal-sentry\\ble',
      topic: 'BLE scanning module',
    });
    store.createSession({
      name: 'api-routes',
      workspaceId: ws2.id,
      workingDir: 'C:\\Projects\\pantex-api',
      topic: 'REST endpoints',
    });
    store.createSession({
      name: 'db-migrations',
      workspaceId: ws2.id,
      workingDir: 'C:\\Projects\\pantex-api\\db',
      topic: 'Database schema',
    });
    store.createSession({
      name: 'readme-update',
      workspaceId: ws3.id,
      workingDir: 'C:\\Projects\\docs',
      topic: 'README overhaul',
    });
    store.createSession({
      name: 'api-docs',
      workspaceId: ws3.id,
      workingDir: 'C:\\Projects\\docs\\api',
      topic: 'API reference',
    });

    store.save();
    console.log('Demo data seeded.');
  }
}

// ─── Start Server ──────────────────────────────────────────

const port = parseInt(process.env.PORT, 10) || 3456;
const server = startServer(port);

console.log(`CWM GUI running at http://localhost:${port}`);
console.log('Press Ctrl+C to stop.');

// ─── Open Browser (Windows) ────────────────────────────────

const { exec } = require('child_process');
exec(`start http://localhost:${port}`);

// ─── Graceful Shutdown ─────────────────────────────────────

process.on('SIGINT', () => {
  const ptyManager = getPtyManager();
  if (ptyManager) ptyManager.destroyAll();
  store.save();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  const ptyManager = getPtyManager();
  if (ptyManager) ptyManager.destroyAll();
  store.save();
  server.close();
  process.exit(0);
});
