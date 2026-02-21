<script>
  import { workspacesStore } from '$lib/stores/workspaces.svelte.js';
  import { sessionsStore } from '$lib/stores/sessions.svelte.js';

  let { onclose, onSelectWorkspace, onSelectSession } = $props();

  let query = $state('');
  let selectedIndex = $state(0);

  let results = $derived(computeResults(query));

  function computeResults(q) {
    const items = [];
    const lowerQ = q.toLowerCase();

    // Workspaces
    for (const ws of workspacesStore.workspaces) {
      if (!q || ws.name.toLowerCase().includes(lowerQ)) {
        items.push({ type: 'workspace', id: ws.id, name: ws.name, description: ws.description });
      }
    }

    // Sessions
    for (const s of sessionsStore.sessions) {
      if (!q || s.name.toLowerCase().includes(lowerQ) || (s.topic && s.topic.toLowerCase().includes(lowerQ))) {
        items.push({ type: 'session', id: s.id, name: s.name, description: s.topic || '' });
      }
    }

    return items.slice(0, 20);
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      onclose?.();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      select(results[selectedIndex]);
    }
  }

  function select(item) {
    if (!item) return;
    if (item.type === 'workspace') {
      onSelectWorkspace?.(item.id);
    } else {
      onSelectSession?.(item.id);
    }
    onclose?.();
  }

  // Reset selection when query changes
  $effect(() => {
    query; // track
    selectedIndex = 0;
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 bg-crust/60 backdrop-blur-sm flex items-start justify-center z-50 pt-[15vh]"
  onclick={onclose}
>
  <div
    class="w-full max-w-lg bg-bg-secondary rounded-xl border border-border-default shadow-xl overflow-hidden"
    onclick={(e) => e.stopPropagation()}
  >
    <!-- Search Input -->
    <div class="p-3 border-b border-border-subtle">
      <!-- svelte-ignore a11y_autofocus -->
      <input
        type="text"
        bind:value={query}
        placeholder="Search workspaces and sessions..."
        class="w-full px-3 py-2 bg-bg-elevated text-text-primary border border-border-default rounded-md
               placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent text-sm"
        autofocus
      />
    </div>

    <!-- Results -->
    <div class="max-h-[300px] overflow-y-auto">
      {#each results as item, i (item.type + item.id)}
        <button
          onclick={() => select(item)}
          onmouseenter={() => selectedIndex = i}
          class="w-full px-4 py-2 flex items-center gap-3 text-left text-sm transition-colors
                 {i === selectedIndex ? 'bg-bg-elevated' : 'hover:bg-bg-elevated/50'}"
        >
          <span class="text-xs text-text-muted w-6">
            {item.type === 'workspace' ? 'WS' : 'SS'}
          </span>
          <span class="text-text-primary truncate">{item.name}</span>
          {#if item.description}
            <span class="text-xs text-text-muted truncate ml-auto">{item.description}</span>
          {/if}
        </button>
      {/each}

      {#if results.length === 0}
        <div class="px-4 py-6 text-sm text-text-muted text-center">No results</div>
      {/if}
    </div>

    <!-- Footer -->
    <div class="px-4 py-2 border-t border-border-subtle flex gap-3 text-[10px] text-text-muted">
      <span><kbd class="px-1 py-0.5 bg-bg-elevated rounded text-text-tertiary">Enter</kbd> select</span>
      <span><kbd class="px-1 py-0.5 bg-bg-elevated rounded text-text-tertiary">Esc</kbd> close</span>
    </div>
  </div>
</div>
