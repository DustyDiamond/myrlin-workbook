/**
 * Board store — kanban features, filtering, CRUD.
 */

import { api } from '../api.js';

const STATUSES = ['backlog', 'planned', 'in-progress', 'review', 'done'];

function createBoardStore() {
  let features = $state([]);
  let filterWorkspaceId = $state(null); // null = all workspaces
  let loading = $state(false);
  let subTab = $state('board'); // 'board' | 'dependencies'

  let filteredFeatures = $derived(
    filterWorkspaceId
      ? features.filter(f => f.workspaceId === filterWorkspaceId)
      : features
  );

  // Group by status column
  let columns = $derived(
    STATUSES.map(status => ({
      status,
      label: status.charAt(0).toUpperCase() + status.slice(1),
      features: filteredFeatures.filter(f => f.status === status),
    }))
  );

  return {
    STATUSES,

    get features() { return features; },
    get filteredFeatures() { return filteredFeatures; },
    get columns() { return columns; },
    get filterWorkspaceId() { return filterWorkspaceId; },
    get loading() { return loading; },
    get subTab() { return subTab; },

    setSubTab(tab) { subTab = tab; },
    setFilter(wsId) { filterWorkspaceId = wsId; },

    async load() {
      loading = true;
      try {
        const data = await api('GET', '/api/features');
        features = data.features || [];
      } finally {
        loading = false;
      }
    },

    async loadForWorkspace(wsId) {
      loading = true;
      try {
        const data = await api('GET', `/api/workspaces/${wsId}/features`);
        // Merge with existing features
        const newIds = new Set((data.features || []).map(f => f.id));
        features = [
          ...features.filter(f => !newIds.has(f.id)),
          ...(data.features || []),
        ];
      } finally {
        loading = false;
      }
    },

    async create(wsId, featureData) {
      const data = await api('POST', `/api/workspaces/${wsId}/features`, featureData);
      if (data.feature) {
        features = [...features, data.feature];
        return data.feature;
      }
    },

    async update(wsId, featureId, updates) {
      const data = await api('PUT', `/api/features/${featureId}`, updates);
      if (data.feature) {
        features = features.map(f => f.id === featureId ? data.feature : f);
        return data.feature;
      }
    },

    async remove(wsId, featureId) {
      await api('DELETE', `/api/features/${featureId}`);
      features = features.filter(f => f.id !== featureId);
    },

    async moveToStatus(featureId, newStatus) {
      const feature = features.find(f => f.id === featureId);
      if (!feature) return;
      const data = await api('PUT', `/api/features/${featureId}`, {
        status: newStatus,
      });
      if (data.feature) {
        features = features.map(f => f.id === featureId ? data.feature : f);
      }
    },

    async addManualNote(featureId, text) {
      const feature = features.find(f => f.id === featureId);
      if (!feature) return;
      const timestamp = new Date().toISOString();
      const note = `[${timestamp}] ${text}`;
      const updated = [...(feature.manualNotes || []), note];
      const data = await api('PUT', `/api/features/${featureId}`, {
        manualNotes: updated,
      });
      if (data.feature) {
        features = features.map(f => f.id === featureId ? data.feature : f);
      }
    },

    /**
     * Handle SSE feature events.
     */
    handleEvent(type, data) {
      if (type === 'feature:created' && data) {
        if (!features.find(f => f.id === data.id)) {
          features = [...features, data];
        }
      } else if (type === 'feature:updated' && data) {
        features = features.map(f => f.id === data.id ? { ...f, ...data } : f);
      } else if (type === 'feature:deleted' && data?.id) {
        features = features.filter(f => f.id !== data.id);
      }
    },
  };
}

export const boardStore = createBoardStore();
