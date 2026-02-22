<script>
  import { untrack } from 'svelte';
  import { boardStore } from '$lib/stores/board.svelte.js';
  import { workspacesStore } from '$lib/stores/workspaces.svelte.js';

  let { feature = null, onclose } = $props();

  // Snapshot prop without reactive tracking (form uses local state)
  const init = untrack(() => feature);
  let name = $state(init?.name || '');
  let description = $state(init?.description || '');
  let priority = $state(init?.priority || 'normal');
  let complexity = $state(init?.complexity || '');
  let workspaceId = $state(init?.workspaceId || workspacesStore.activeWorkspaceId || '');
  let status = $state(init?.status || 'backlog');
  let saving = $state(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !workspaceId) return;

    saving = true;
    try {
      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        priority,
        complexity: complexity || undefined,
        status,
      };

      if (feature) {
        await boardStore.update(workspaceId, feature.id, data);
      } else {
        await boardStore.create(workspaceId, data);
      }
      onclose?.();
    } finally {
      saving = false;
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 bg-crust/60 backdrop-blur-sm flex items-center justify-center z-50"
  onclick={onclose}
>
  <div
    class="w-full max-w-2xl bg-bg-secondary rounded-xl border border-border-default shadow-xl p-6"
    onclick={(e) => e.stopPropagation()}
  >
    <h2 class="text-base font-semibold text-text-primary mb-4">
      {feature ? 'Edit Feature' : 'New Feature'}
    </h2>

    <form onsubmit={handleSubmit} class="flex flex-col gap-3">
      <div>
        <label for="feat-name" class="block text-xs text-text-secondary mb-1">Name</label>
        <input
          id="feat-name"
          type="text"
          bind:value={name}
          class="w-full px-3 py-2 text-sm bg-bg-elevated text-text-primary border border-border-default rounded-md
                 placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Feature name"
        />
      </div>

      <div>
        <label for="feat-desc" class="block text-xs text-text-secondary mb-1">Description</label>
        <textarea
          id="feat-desc"
          bind:value={description}
          rows="6"
          class="w-full px-3 py-2 text-sm bg-bg-elevated text-text-primary border border-border-default rounded-md
                 placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent resize-y"
          placeholder="Optional description"
        ></textarea>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label for="feat-ws" class="block text-xs text-text-secondary mb-1">Workspace</label>
          <select
            id="feat-ws"
            bind:value={workspaceId}
            class="w-full px-3 py-2 text-sm bg-bg-elevated text-text-primary border border-border-default rounded-md
                   focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {#each workspacesStore.workspaces as ws}
              <option value={ws.id}>{ws.name}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="feat-priority" class="block text-xs text-text-secondary mb-1">Priority</label>
          <select
            id="feat-priority"
            bind:value={priority}
            class="w-full px-3 py-2 text-sm bg-bg-elevated text-text-primary border border-border-default rounded-md
                   focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onclick={onclose}
          class="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !name.trim() || !workspaceId}
          class="px-4 py-1.5 text-sm bg-accent text-crust rounded-md hover:opacity-90
                 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {saving ? 'Saving...' : feature ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  </div>
</div>
