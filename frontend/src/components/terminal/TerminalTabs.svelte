<script>
  import { terminalStore } from '$lib/stores/terminal.svelte.js';

  let { groups = [], activeGroupId = null, onSelectGroup } = $props();
</script>

{#if groups.length > 0}
  <div class="flex items-center gap-1 px-2 py-1 bg-bg-secondary border-b border-border-subtle overflow-x-auto">
    <button
      onclick={() => onSelectGroup?.(null)}
      class="px-2 py-1 text-xs rounded transition-colors shrink-0
             {activeGroupId === null ? 'bg-bg-elevated text-accent' : 'text-text-muted hover:text-text-primary'}"
    >
      All
    </button>
    {#each groups as group}
      <button
        onclick={() => onSelectGroup?.(group.id)}
        class="px-2 py-1 text-xs rounded transition-colors shrink-0
               {activeGroupId === group.id ? 'bg-bg-elevated text-accent' : 'text-text-muted hover:text-text-primary'}"
      >
        {group.name}
      </button>
    {/each}
  </div>
{/if}
