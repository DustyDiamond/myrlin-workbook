<script>
  import { sessionsStore } from '$lib/stores/sessions.svelte.js';
  import { terminalStore } from '$lib/stores/terminal.svelte.js';
  import { auth } from '$lib/stores/auth.svelte.js';
  import TerminalPane from './TerminalPane.svelte';

  let runningSessions = $derived(
    sessionsStore.visibleSessions.filter(s => s.status === 'running')
  );

  // Grid layout calculation
  let gridClass = $derived.by(() => {
    const count = runningSessions.length;
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2 grid-rows-2';
    return 'grid-cols-3 grid-rows-2';
  });
</script>

<div class="h-full flex flex-col bg-bg-primary">
  {#if runningSessions.length === 0}
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center text-text-muted">
        <p class="text-lg mb-2">No running sessions</p>
        <p class="text-sm">Start a session from the sidebar to open a terminal</p>
      </div>
    </div>
  {:else}
    <div class="flex-1 grid {gridClass} gap-px bg-border-subtle overflow-hidden">
      {#each runningSessions as session (session.id)}
        <TerminalPane {session} token={auth.token} />
      {/each}
    </div>
  {/if}
</div>
