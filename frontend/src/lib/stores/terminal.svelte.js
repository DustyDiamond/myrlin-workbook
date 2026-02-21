/**
 * Terminal store — tracks terminal panes, groups, and active state.
 * Manages the xterm.js lifecycle from the Svelte side.
 */

function createTerminalStore() {
  let panes = $state(new Map());       // sessionId → { term, ws, container, ... }
  let groups = $state([]);             // Array of { id, name, sessionIds }
  let activeGroupId = $state(null);
  let gridLayout = $state('auto');     // 'auto' | '1x1' | '2x1' | '2x2' etc.
  let loading = $state(false);

  // Collapse state for groups
  let groupCollapseState = $state(
    (() => {
      try { return JSON.parse(localStorage.getItem('cwm_groupCollapseState') || '{}'); }
      catch { return {}; }
    })()
  );

  let activePanes = $derived(
    (() => {
      if (!activeGroupId) return [...panes.values()];
      const group = groups.find(g => g.id === activeGroupId);
      if (!group) return [...panes.values()];
      return group.sessionIds
        .map(id => panes.get(id))
        .filter(Boolean);
    })()
  );

  return {
    get panes() { return panes; },
    get groups() { return groups; },
    get activeGroupId() { return activeGroupId; },
    get activePanes() { return activePanes; },
    get gridLayout() { return gridLayout; },
    get loading() { return loading; },
    get groupCollapseState() { return groupCollapseState; },

    setGridLayout(layout) {
      gridLayout = layout;
      localStorage.setItem('cwm_gridLayout', layout);
    },

    setActiveGroup(id) {
      activeGroupId = id;
    },

    /**
     * Register a terminal pane.
     */
    registerPane(sessionId, paneData) {
      const next = new Map(panes);
      next.set(sessionId, paneData);
      panes = next;
    },

    /**
     * Unregister a terminal pane (cleanup).
     */
    unregisterPane(sessionId) {
      const next = new Map(panes);
      next.delete(sessionId);
      panes = next;
    },

    /**
     * Get a pane by session ID.
     */
    getPane(sessionId) {
      return panes.get(sessionId);
    },

    toggleGroupCollapse(groupId) {
      groupCollapseState = {
        ...groupCollapseState,
        [groupId]: !groupCollapseState[groupId],
      };
      localStorage.setItem('cwm_groupCollapseState', JSON.stringify(groupCollapseState));
    },
  };
}

export const terminalStore = createTerminalStore();
