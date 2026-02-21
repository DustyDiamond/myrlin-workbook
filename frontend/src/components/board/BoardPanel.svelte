<script>
  import { boardStore } from '$lib/stores/board.svelte.js';
  import { workspacesStore } from '$lib/stores/workspaces.svelte.js';
  import KanbanColumn from './KanbanColumn.svelte';
  import DependencyView from './DependencyView.svelte';
  import FeatureDialog from './FeatureDialog.svelte';
  import FeatureDetail from './FeatureDetail.svelte';
  import ConfirmDialog from '../shared/ConfirmDialog.svelte';
  import { stringToColor } from '$lib/utils.js';

  let showCreateDialog = $state(false);
  let editingFeature = $state(null);
  let deletingFeature = $state(null);
  let selectedFeature = $state(null);

  function handleSelect(feature) {
    selectedFeature = feature;
  }

  function handleDrop(featureId, newStatus) {
    boardStore.moveToStatus(featureId, newStatus);
  }

  function handleEdit(feature) {
    editingFeature = feature;
    showCreateDialog = true;
  }

  function handleCreate() {
    editingFeature = null;
    showCreateDialog = true;
  }

  function handleDelete(feature) {
    deletingFeature = feature;
  }

  function confirmDelete() {
    if (deletingFeature) {
      boardStore.remove(deletingFeature.workspaceId, deletingFeature.id);
      deletingFeature = null;
    }
  }
</script>

<div class="flex flex-col h-full bg-bg-primary overflow-hidden">
  <!-- Board Toolbar -->
  <div class="flex items-center gap-3 px-4 py-2 border-b border-border-subtle shrink-0">
    <!-- Sub-tabs -->
    <div class="flex gap-1">
      <button
        onclick={() => boardStore.setSubTab('board')}
        class="px-2 py-1 text-xs rounded transition-colors
               {boardStore.subTab === 'board' ? 'bg-bg-elevated text-accent' : 'text-text-muted hover:text-text-primary'}"
      >Board</button>
      <button
        onclick={() => boardStore.setSubTab('dependencies')}
        class="px-2 py-1 text-xs rounded transition-colors
               {boardStore.subTab === 'dependencies' ? 'bg-bg-elevated text-accent' : 'text-text-muted hover:text-text-primary'}"
      >Dependencies</button>
    </div>

    <div class="flex-1"></div>

    <!-- Workspace Filter -->
    <select
      onchange={(e) => boardStore.setFilter(e.target.value || null)}
      class="px-2 py-1 text-xs bg-bg-elevated text-text-primary border border-border-default rounded
             focus:outline-none focus:ring-1 focus:ring-accent"
    >
      <option value="">All Workspaces</option>
      {#each workspacesStore.workspaces as ws}
        <option value={ws.id}>{ws.name}</option>
      {/each}
    </select>

    <!-- Create Feature -->
    <button
      onclick={handleCreate}
      class="px-3 py-1 text-xs bg-accent text-crust rounded hover:opacity-90 transition-opacity"
    >
      + Feature
    </button>
  </div>

  <!-- Board Content -->
  {#if boardStore.subTab === 'board'}
    <div class="flex-1 flex gap-3 p-4 overflow-x-auto">
      {#each boardStore.columns as column}
        <KanbanColumn
          {column}
          onDrop={handleDrop}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSelect={handleSelect}
        />
      {/each}
    </div>
  {:else}
    <DependencyView features={boardStore.filteredFeatures} />
  {/if}

  {#if showCreateDialog}
    <FeatureDialog
      feature={editingFeature}
      onclose={() => { showCreateDialog = false; editingFeature = null; }}
    />
  {/if}

  {#if deletingFeature}
    <ConfirmDialog
      title="Delete Feature"
      message="Delete &quot;{deletingFeature.name}&quot;? This cannot be undone."
      confirmText="Delete"
      onconfirm={confirmDelete}
      oncancel={() => deletingFeature = null}
    />
  {/if}

  {#if selectedFeature}
    <FeatureDetail
      feature={selectedFeature}
      onclose={() => selectedFeature = null}
      onEdit={(f) => { selectedFeature = null; handleEdit(f); }}
    />
  {/if}
</div>
