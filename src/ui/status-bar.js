/**
 * Status Bar - Top row of the terminal UI
 * Shows app branding, view mode, active workspace, session counts, and clock.
 */

const blessed = require('blessed');
const theme = require('./theme');

/**
 * Create the status bar widget
 * @param {blessed.screen} parent - The parent screen
 * @returns {blessed.box} The status bar widget
 */
function create(parent) {
  const bar = blessed.box({
    parent,
    top: 0,
    left: 0,
    width: '100%',
    height: 1,
    tags: true,
    style: theme.statusBar.style,
  });

  return bar;
}

/**
 * Update the status bar content from current store state
 * @param {blessed.box} bar - The status bar widget
 * @param {object} store - The store instance
 * @param {string} [viewMode='workspace'] - Current view mode
 */
function update(bar, store, viewMode = 'workspace') {
  const activeWs = store.getActiveWorkspace();
  const wsName = activeWs ? activeWs.name : 'No Workspace';

  // Count sessions across all workspaces
  const allSessions = store.getAllSessionsList();
  const totalAll = allSessions.length;
  const runningAll = allSessions.filter(s => s.status === 'running').length;

  // Count sessions in active workspace
  let running = 0;
  let total = 0;
  if (activeWs) {
    const sessions = store.getWorkspaceSessions(activeWs.id);
    total = sessions.length;
    running = sessions.filter(s => s.status === 'running').length;
  }

  // Current time HH:MM
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${mins}`;

  const sep = ` {${theme.colors.textTertiary}-fg}${theme.icons.bar}{/} `;

  // View mode indicator
  const vm = theme.viewModes[viewMode] || theme.viewModes.workspace;
  const modeIndicator = `{${vm.color}-fg}${vm.label}{/}`;

  // Session count string depends on mode
  const sessStr = viewMode === 'workspace'
    ? `${running}/${total} sessions`
    : `${runningAll}/${totalAll} total`;

  const content = ` {${theme.colors.primary}-fg}{bold}CWM{/bold}{/}` +
    sep +
    modeIndicator +
    sep +
    `{${theme.colors.text}-fg}${theme.truncate(wsName, 24)}{/}` +
    sep +
    `{${theme.colors.textSecondary}-fg}${sessStr}{/}` +
    sep +
    `{${theme.colors.textSecondary}-fg}${theme.icons.clock} ${timeStr}{/}` +
    sep +
    `{${theme.colors.textTertiary}-fg}? help{/}`;

  bar.setContent(content);
}

module.exports = { create, update };
