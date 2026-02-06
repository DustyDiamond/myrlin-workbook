/**
 * Main Application Screen - Entry point for the Claude Workspace Manager UI
 * Orchestrates all panels: status bar, workspace panel, session list,
 * session detail, notification bar, and dialogs.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────┐
 *   │ Status Bar (1 row)                            │
 *   ├──────────────┬───────────────────────────────┤
 *   │              │ Session List (~50% right)      │
 *   │ Workspaces   ├───────────────────────────────┤
 *   │ (~30% left)  │ Session Detail (~50% right)   │
 *   ├──────────────┴───────────────────────────────┤
 *   │ Notification Bar (3 rows)                     │
 *   └──────────────────────────────────────────────┘
 */

const blessed = require('blessed');
const theme = require('./theme');
const statusBar = require('./status-bar');
const workspacePanel = require('./workspace-panel');
const sessionList = require('./session-list');
const sessionDetail = require('./session-detail');
const notificationBar = require('./notification-bar');
const dialogs = require('./dialogs');
const { launchSession, stopSession } = require('../core/session-manager');

/**
 * Create the full application UI
 * @param {object} store - The initialized store instance
 * @param {Array} [notifications=[]] - Initial notifications array
 * @returns {{ screen, refresh, destroy }}
 */
function createApp(store, notifications = []) {
  // ─── Screen ────────────────────────────────────
  const screen = blessed.screen({
    title: 'Claude Workspace Manager',
    smartCSR: true,
    fullUnicode: true,
    autoPadding: false,
    style: {
      bg: theme.colors.bg,
    },
  });

  // ─── Widgets ───────────────────────────────────
  const bar = statusBar.create(screen);
  const wsPanel = workspacePanel.create(screen);
  const sessList = sessionList.create(screen);
  const sessDetail = sessionDetail.create(screen);
  const notifBar = notificationBar.create(screen);

  // Track state
  let selectedSessionId = null;
  let viewMode = 'workspace'; // 'workspace' | 'all' | 'recent'

  // Focusable panels in tab order
  const focusOrder = [wsPanel.widget, sessList.widget, sessDetail];
  let focusIndex = 0;

  // ─── View Mode Management ────────────────────
  function setViewMode(mode) {
    viewMode = mode;
    sessionList.setViewMode(sessList.widget, mode);
    selectedSessionId = null;
    refresh();
  }

  // ─── Refresh all panels from store ─────────────
  function refresh() {
    statusBar.update(bar, store, viewMode);
    workspacePanel.update(wsPanel.widget, store);

    const activeWs = store.getActiveWorkspace();
    sessionList.update(sessList.widget, store, activeWs ? activeWs.id : null);

    if (selectedSessionId) {
      const sess = store.getSession(selectedSessionId);
      sessionDetail.update(sessDetail, sess);
    } else {
      sessionDetail.update(sessDetail, null);
    }

    screen.render();
  }

  // ─── Workspace Panel Events ────────────────────
  wsPanel.events.on('select', (wsId) => {
    store.setActiveWorkspace(wsId);
    selectedSessionId = null;
    // Switch to workspace mode when selecting a workspace
    if (viewMode !== 'workspace') {
      viewMode = 'workspace';
      sessionList.setViewMode(sessList.widget, 'workspace');
    }
    refresh();
  });

  wsPanel.events.on('create', () => {
    dialogs.promptInput(screen, 'New Workspace Name', (name) => {
      if (name) {
        const ws = store.createWorkspace({ name });
        notificationBar.push(notifBar, {
          level: 'success',
          message: `Workspace "${ws.name}" created`,
        });
        refresh();
      }
      wsPanel.widget.focus();
    });
  });

  wsPanel.events.on('delete', (wsId) => {
    const ws = store.getWorkspace(wsId);
    if (!ws) return;
    dialogs.confirmDialog(screen, `Delete workspace "${ws.name}" and all its sessions?`, (yes) => {
      if (yes) {
        store.deleteWorkspace(wsId);
        selectedSessionId = null;
        notificationBar.push(notifBar, {
          level: 'warning',
          message: `Workspace "${ws.name}" deleted`,
        });
        refresh();
      }
      wsPanel.widget.focus();
    });
  });

  wsPanel.events.on('rename', (wsId) => {
    const ws = store.getWorkspace(wsId);
    if (!ws) return;
    dialogs.promptInput(screen, `Rename "${ws.name}" to:`, (newName) => {
      if (newName) {
        store.updateWorkspace(wsId, { name: newName });
        notificationBar.push(notifBar, {
          level: 'info',
          message: `Workspace renamed to "${newName}"`,
        });
        refresh();
      }
      wsPanel.widget.focus();
    });
  });

  // ─── Session List Events ───────────────────────
  sessList.events.on('select', (sessId) => {
    selectedSessionId = sessId;
    store.touchRecent(sessId);
    refresh();
  });

  sessList.events.on('create', () => {
    const activeWs = store.getActiveWorkspace();
    if (!activeWs) {
      notificationBar.push(notifBar, {
        level: 'warning',
        message: 'Create a workspace first',
      });
      refresh();
      return;
    }
    dialogs.promptInput(screen, 'New Session Name', (name) => {
      if (name) {
        const sess = store.createSession({
          name,
          workspaceId: activeWs.id,
          workingDir: process.cwd(),
        });
        if (sess) {
          store.touchRecent(sess.id);
          notificationBar.push(notifBar, {
            level: 'success',
            message: `Session "${sess.name}" created`,
          });
        }
        refresh();
      }
      sessList.widget.focus();
    });
  });

  sessList.events.on('start', (sessId) => {
    store.touchRecent(sessId);
    const result = launchSession(sessId);
    const sess = store.getSession(sessId);
    if (result.success) {
      notificationBar.push(notifBar, {
        level: 'success',
        message: `Session "${sess ? sess.name : sessId}" started (PID: ${result.pid})`,
      });
    } else {
      notificationBar.push(notifBar, {
        level: 'error',
        message: `Failed to start: ${result.error}`,
      });
    }
    refresh();
  });

  sessList.events.on('stop', (sessId) => {
    const sess = store.getSession(sessId);
    const result = stopSession(sessId);
    if (result.success) {
      notificationBar.push(notifBar, {
        level: 'info',
        message: `Session "${sess ? sess.name : sessId}" stopped`,
      });
    }
    refresh();
  });

  sessList.events.on('delete', (sessId) => {
    const sess = store.getSession(sessId);
    if (!sess) return;
    dialogs.confirmDialog(screen, `Delete session "${sess.name}"?`, (yes) => {
      if (yes) {
        if (selectedSessionId === sessId) {
          selectedSessionId = null;
        }
        store.deleteSession(sessId);
        notificationBar.push(notifBar, {
          level: 'warning',
          message: `Session "${sess.name}" deleted`,
        });
        refresh();
      }
      sessList.widget.focus();
    });
  });

  // ─── Global Keybindings ────────────────────────

  // Tab cycling
  screen.key(['tab'], () => {
    focusIndex = (focusIndex + 1) % focusOrder.length;
    focusOrder[focusIndex].focus();
    screen.render();
  });

  screen.key(['S-tab'], () => {
    focusIndex = (focusIndex - 1 + focusOrder.length) % focusOrder.length;
    focusOrder[focusIndex].focus();
    screen.render();
  });

  // View mode switches
  screen.key(['w'], () => setViewMode('workspace'));
  screen.key(['a'], () => setViewMode('all'));
  screen.key(['e'], () => setViewMode('recent'));

  // Quick switcher
  screen.key(['C-k'], () => {
    dialogs.quickSwitcher(screen, store, (result) => {
      if (result) {
        if (result.type === 'workspace') {
          store.setActiveWorkspace(result.id);
          viewMode = 'workspace';
          sessionList.setViewMode(sessList.widget, 'workspace');
          selectedSessionId = null;
        } else if (result.type === 'session') {
          // Navigate to the session's workspace and select it
          if (result.workspaceId) {
            store.setActiveWorkspace(result.workspaceId);
          }
          viewMode = 'workspace';
          sessionList.setViewMode(sessList.widget, 'workspace');
          selectedSessionId = result.id;
          store.touchRecent(result.id);
        }
        refresh();
      }
      wsPanel.widget.focus();
    });
  });

  // Help
  screen.key(['?'], () => {
    dialogs.helpDialog(screen);
  });

  // Quit
  screen.key(['q', 'C-c'], () => {
    store.save();
    screen.destroy();
    process.exit(0);
  });

  // ─── Store Events for Live Updates ─────────────
  store.on('session:updated', () => refresh());
  store.on('workspace:created', () => refresh());
  store.on('workspace:updated', () => refresh());
  store.on('workspace:deleted', () => refresh());
  store.on('session:created', () => refresh());
  store.on('session:deleted', () => refresh());

  // ─── Timer for Clock in Status Bar ─────────────
  const clockTimer = setInterval(() => {
    statusBar.update(bar, store, viewMode);
    screen.render();
  }, 30000);

  // ─── Initial Load ──────────────────────────────
  if (notifications.length > 0) {
    notificationBar.update(notifBar, notifications);
  }

  // Set initial view mode label
  sessionList.setViewMode(sessList.widget, 'workspace');

  // Focus workspace panel initially
  wsPanel.widget.focus();
  refresh();

  // ─── Public API ────────────────────────────────
  return {
    screen,
    refresh,
    destroy() {
      clearInterval(clockTimer);
      store.save();
      screen.destroy();
    },
  };
}

module.exports = { createApp };
