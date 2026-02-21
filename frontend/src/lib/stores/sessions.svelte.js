/**
 * Sessions store — session list, create/destroy, visibility management.
 */

import { api } from '../api.js';
import { workspacesStore } from './workspaces.svelte.js';

function createSessionsStore() {
  let sessions = $state([]);
  let loading = $state(false);
  let hiddenSessions = $state(new Set(
    JSON.parse(localStorage.getItem('cwm_hiddenSessions') || '[]')
  ));

  // Sessions for the active workspace
  let activeSessions = $derived(
    sessions.filter(s => s.workspaceId === workspacesStore.activeWorkspaceId)
  );

  // Visible sessions (not hidden by user)
  let visibleSessions = $derived(
    activeSessions.filter(s => !hiddenSessions.has(s.id))
  );

  function persistHidden() {
    localStorage.setItem('cwm_hiddenSessions', JSON.stringify([...hiddenSessions]));
  }

  return {
    get sessions() { return sessions; },
    get activeSessions() { return activeSessions; },
    get visibleSessions() { return visibleSessions; },
    get loading() { return loading; },
    get hiddenSessions() { return hiddenSessions; },

    async load() {
      loading = true;
      try {
        const wsId = workspacesStore.activeWorkspaceId;
        if (!wsId) {
          sessions = [];
          return;
        }
        const data = await api('GET', `/api/workspaces/${wsId}`);
        sessions = data.workspace?.sessionObjects || [];
      } finally {
        loading = false;
      }
    },

    async loadAll() {
      loading = true;
      try {
        // Load sessions for all workspaces
        const allSessions = [];
        for (const ws of workspacesStore.workspaces) {
          try {
            const data = await api('GET', `/api/workspaces/${ws.id}`);
            const wsSessions = data.workspace?.sessionObjects || [];
            allSessions.push(...wsSessions);
          } catch { /* skip failed workspace */ }
        }
        sessions = allSessions;
      } finally {
        loading = false;
      }
    },

    async create(opts) {
      const data = await api('POST', '/api/sessions', opts);
      if (data.session) {
        sessions = [...sessions, data.session];
        return data.session;
      }
    },

    async destroy(id) {
      await api('DELETE', `/api/sessions/${id}`);
      sessions = sessions.filter(s => s.id !== id);
    },

    async start(id) {
      const data = await api('POST', `/api/sessions/${id}/start`);
      if (data.success) {
        // Server returns { success }, update status optimistically
        // SSE session:updated event will provide the full object
        sessions = sessions.map(s => s.id === id ? { ...s, status: 'running' } : s);
      }
    },

    async stop(id) {
      const data = await api('POST', `/api/sessions/${id}/stop`);
      if (data.success) {
        sessions = sessions.map(s => s.id === id ? { ...s, status: 'stopped' } : s);
      }
    },

    hide(id) {
      hiddenSessions = new Set([...hiddenSessions, id]);
      persistHidden();
    },

    unhide(id) {
      const next = new Set(hiddenSessions);
      next.delete(id);
      hiddenSessions = next;
      persistHidden();
    },

    /**
     * Handle SSE session events.
     */
    handleEvent(type, data) {
      if (type === 'session:created' && data) {
        if (!sessions.find(s => s.id === data.id)) {
          sessions = [...sessions, data];
        }
      } else if (type === 'session:updated' && data) {
        // session:updated covers status changes (start/stop) too
        sessions = sessions.map(s => s.id === data.id ? { ...s, ...data } : s);
      } else if (type === 'session:deleted' && data?.id) {
        sessions = sessions.filter(s => s.id !== data.id);
      }
    },
  };
}

export const sessionsStore = createSessionsStore();
