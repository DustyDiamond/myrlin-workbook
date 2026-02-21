/**
 * Workspaces store — workspace list, active workspace, CRUD operations.
 */

import { api } from '../api.js';

function createWorkspacesStore() {
  let workspaces = $state([]);
  let activeWorkspaceId = $state(localStorage.getItem('cwm_activeWorkspace') || null);
  let loading = $state(false);

  let activeWorkspace = $derived(
    workspaces.find(ws => ws.id === activeWorkspaceId) || null
  );

  return {
    get workspaces() { return workspaces; },
    get activeWorkspace() { return activeWorkspace; },
    get activeWorkspaceId() { return activeWorkspaceId; },
    get loading() { return loading; },

    async load() {
      loading = true;
      try {
        const data = await api('GET', '/api/workspaces');
        workspaces = data.workspaces || [];

        // Validate saved active workspace still exists
        if (activeWorkspaceId && !workspaces.find(ws => ws.id === activeWorkspaceId)) {
          activeWorkspaceId = workspaces.length > 0 ? workspaces[0].id : null;
        }
        // Auto-select first if none selected
        if (!activeWorkspaceId && workspaces.length > 0) {
          activeWorkspaceId = workspaces[0].id;
        }
        if (activeWorkspaceId) {
          localStorage.setItem('cwm_activeWorkspace', activeWorkspaceId);
        }
      } finally {
        loading = false;
      }
    },

    setActive(id) {
      activeWorkspaceId = id;
      if (id) {
        localStorage.setItem('cwm_activeWorkspace', id);
      } else {
        localStorage.removeItem('cwm_activeWorkspace');
      }
    },

    async create(name, description, color) {
      const data = await api('POST', '/api/workspaces', { name, description, color });
      if (data.workspace) {
        workspaces = [...workspaces, data.workspace];
        return data.workspace;
      }
    },

    async update(id, updates) {
      const data = await api('PUT', `/api/workspaces/${id}`, updates);
      if (data.workspace) {
        workspaces = workspaces.map(ws => ws.id === id ? data.workspace : ws);
        return data.workspace;
      }
    },

    async remove(id) {
      await api('DELETE', `/api/workspaces/${id}`);
      workspaces = workspaces.filter(ws => ws.id !== id);
      if (activeWorkspaceId === id) {
        activeWorkspaceId = workspaces.length > 0 ? workspaces[0].id : null;
        if (activeWorkspaceId) {
          localStorage.setItem('cwm_activeWorkspace', activeWorkspaceId);
        } else {
          localStorage.removeItem('cwm_activeWorkspace');
        }
      }
    },

    /**
     * Handle SSE workspace events.
     */
    handleEvent(type, data) {
      if (type === 'workspace:created' && data) {
        if (!workspaces.find(ws => ws.id === data.id)) {
          workspaces = [...workspaces, data];
        }
      } else if (type === 'workspace:updated' && data) {
        workspaces = workspaces.map(ws => ws.id === data.id ? { ...ws, ...data } : ws);
      } else if (type === 'workspace:deleted' && data?.id) {
        workspaces = workspaces.filter(ws => ws.id !== data.id);
      }
    },
  };
}

export const workspacesStore = createWorkspacesStore();
