/**
 * Session List - Right panel showing sessions
 * Supports three view modes:
 *   - 'workspace': Sessions for the active workspace (default)
 *   - 'all': All sessions across all workspaces
 *   - 'recent': Recently interacted sessions
 */

const blessed = require('blessed');
const { EventEmitter } = require('events');
const theme = require('./theme');

/**
 * Create the session list widget
 * @param {blessed.screen} parent - The parent screen
 * @returns {{ widget: blessed.list, events: EventEmitter }}
 */
function create(parent) {
  const events = new EventEmitter();

  const panel = blessed.list({
    parent,
    label: ' Sessions ',
    top: 1,
    left: '30%',
    width: '70%',
    height: '50%-1',
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    scrollbar: {
      ch: ' ',
      style: { bg: theme.colors.primaryDim },
    },
    border: theme.panel.border,
    style: theme.list.style,
  });

  // Track current view mode
  panel._viewMode = 'workspace'; // 'workspace' | 'all' | 'recent'

  // ─── Keybindings ─────────────────────────────
  panel.key(['enter'], () => {
    const idx = panel.selected;
    if (idx !== undefined && panel._sessionIds && panel._sessionIds[idx]) {
      events.emit('select', panel._sessionIds[idx]);
    }
  });

  panel.key(['n'], () => {
    events.emit('create');
  });

  panel.key(['s'], () => {
    const idx = panel.selected;
    if (idx !== undefined && panel._sessionIds && panel._sessionIds[idx]) {
      events.emit('start', panel._sessionIds[idx]);
    }
  });

  panel.key(['x'], () => {
    const idx = panel.selected;
    if (idx !== undefined && panel._sessionIds && panel._sessionIds[idx]) {
      events.emit('stop', panel._sessionIds[idx]);
    }
  });

  panel.key(['d'], () => {
    const idx = panel.selected;
    if (idx !== undefined && panel._sessionIds && panel._sessionIds[idx]) {
      events.emit('delete', panel._sessionIds[idx]);
    }
  });

  // Focus styling
  panel.on('focus', () => {
    panel.border = theme.panelFocused.border;
    panel.style = theme.listFocused.style;
    panel.style.border = theme.panelFocused.style.border;
    panel.style.label = theme.panelFocused.style.label;
    panel.screen.render();
  });

  panel.on('blur', () => {
    panel.border = theme.panel.border;
    panel.style = theme.list.style;
    panel.style.border = theme.panel.style.border;
    panel.style.label = theme.panel.style.label;
    panel.screen.render();
  });

  return { widget: panel, events };
}

/**
 * Set the view mode and update the label
 */
function setViewMode(panel, mode) {
  panel._viewMode = mode;
  const vm = theme.viewModes[mode] || theme.viewModes.workspace;
  const modeColor = vm.color;
  panel.setLabel(` {${modeColor}-fg}${vm.label}{/} Sessions `);
}

/**
 * Get the current view mode
 */
function getViewMode(panel) {
  return panel._viewMode || 'workspace';
}

/**
 * Update session list based on current view mode
 * @param {blessed.list} panel - The list widget
 * @param {object} store - The store instance
 * @param {string|null} workspaceId - Active workspace ID (for 'workspace' mode)
 */
function update(panel, store, workspaceId) {
  const mode = panel._viewMode || 'workspace';
  let sessions = [];

  if (mode === 'all') {
    sessions = store.getAllSessionsList();
  } else if (mode === 'recent') {
    sessions = store.getRecentSessions(10);
  } else {
    // workspace mode
    if (!workspaceId) {
      panel._sessionIds = [];
      panel.setItems([`{${theme.colors.textTertiary}-fg}  No workspace selected{/}`]);
      return;
    }
    sessions = store.getWorkspaceSessions(workspaceId);
  }

  panel._sessionIds = sessions.map(s => s.id);

  const items = sessions.map(s => {
    const { icon, color } = theme.formatStatus(s.status);
    const timeAgo = theme.formatTimestamp(s.lastActive);
    const name = theme.truncate(s.name, 16);

    // In 'all' and 'recent' modes, show workspace name as prefix
    let wsTag = '';
    if (mode === 'all' || mode === 'recent') {
      const ws = store.getWorkspace(s.workspaceId);
      const wsName = ws ? theme.truncate(ws.name, 12) : '?';
      wsTag = `{${theme.colors.accent}-fg}[${wsName}]{/} `;
    }

    const dir = theme.truncate(s.workingDir || '', mode === 'workspace' ? 24 : 18);

    return ` {${color}-fg}${icon}{/} ${wsTag}{${theme.colors.text}-fg}${name}{/}` +
      `   {${theme.colors.textTertiary}-fg}${dir}{/}` +
      `   {${theme.colors.textSecondary}-fg}${timeAgo}{/}`;
  });

  const emptyMsg = mode === 'all' ? 'No sessions' :
    mode === 'recent' ? 'No recent sessions' : 'No sessions';

  panel.setItems(items.length > 0 ? items : [`{${theme.colors.textTertiary}-fg}  ${emptyMsg}{/}`]);
}

module.exports = { create, update, setViewMode, getViewMode };
