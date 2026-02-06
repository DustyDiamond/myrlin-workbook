/**
 * Workspace Panel - Left sidebar listing all workspaces
 * Shows workspaces with color dot, name, and session count.
 * Supports navigation, creation, deletion, and rename keybindings.
 */

const blessed = require('blessed');
const { EventEmitter } = require('events');
const theme = require('./theme');

/**
 * Create the workspace panel widget
 * @param {blessed.screen} parent - The parent screen
 * @returns {{ widget: blessed.list, events: EventEmitter }}
 */
function create(parent) {
  const events = new EventEmitter();

  const panel = blessed.list({
    parent,
    label: ' Workspaces ',
    top: 1,
    left: 0,
    width: '30%',
    height: '100%-4', // status bar (1) + notification bar (3)
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

  // ─── Keybindings ─────────────────────────────
  panel.key(['enter'], () => {
    const idx = panel.selected;
    if (idx !== undefined && panel._wsIds && panel._wsIds[idx]) {
      events.emit('select', panel._wsIds[idx]);
    }
  });

  panel.key(['n'], () => {
    events.emit('create');
  });

  panel.key(['d'], () => {
    const idx = panel.selected;
    if (idx !== undefined && panel._wsIds && panel._wsIds[idx]) {
      events.emit('delete', panel._wsIds[idx]);
    }
  });

  panel.key(['r'], () => {
    const idx = panel.selected;
    if (idx !== undefined && panel._wsIds && panel._wsIds[idx]) {
      events.emit('rename', panel._wsIds[idx]);
    }
  });

  // Track focus for styling
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
 * Update the workspace panel items from store state
 * @param {blessed.list} panel - The list widget
 * @param {object} store - The store instance
 */
function update(panel, store) {
  const workspaces = store.getAllWorkspacesList();
  const activeId = store.activeWorkspace;

  // Store IDs for keybinding lookups
  panel._wsIds = workspaces.map(ws => ws.id);

  const items = workspaces.map(ws => {
    const sessionCount = store.getWorkspaceSessions(ws.id).length;
    const isActive = ws.id === activeId;
    const dotColor = isActive ? theme.colors.primary : theme.colors.textTertiary;
    const nameColor = isActive ? theme.colors.text : theme.colors.textSecondary;

    return `{${dotColor}-fg}${theme.icons.running}{/} {${nameColor}-fg}${theme.truncate(ws.name, 20)}{/} {${theme.colors.textTertiary}-fg}(${sessionCount}){/}`;
  });

  panel.setItems(items.length > 0 ? items : ['{' + theme.colors.textTertiary + '-fg}  No workspaces{/}']);
}

module.exports = { create, update };
