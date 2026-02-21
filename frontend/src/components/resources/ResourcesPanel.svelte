<script>
  import { api } from '$lib/api.js';
  import { formatBytes } from '$lib/utils.js';
  import { onMount, onDestroy } from 'svelte';

  let resources = $state(null);
  let loading = $state(false);
  let pollInterval = null;

  onMount(() => {
    load();
    pollInterval = setInterval(load, 30000);
  });

  onDestroy(() => {
    if (pollInterval) clearInterval(pollInterval);
  });

  async function load() {
    loading = true;
    try {
      resources = await api('GET', '/api/resources');
    } catch {
      resources = null;
    } finally {
      loading = false;
    }
  }

  function formatMB(mb) {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${Math.round(mb)} MB`;
  }
</script>

<div class="h-full p-4 overflow-y-auto">
  <h2 class="text-sm font-semibold text-text-primary mb-4">System Resources</h2>

  {#if loading && !resources}
    <div class="text-sm text-text-muted">Loading...</div>
  {:else if resources?.system}
    <!-- System overview cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <!-- CPU -->
      <div class="p-4 bg-bg-secondary rounded-lg border border-border-subtle">
        <div class="text-xs text-text-tertiary mb-1">CPU Usage ({resources.system.cpuCount} cores)</div>
        <div class="text-2xl font-semibold text-text-primary">{resources.system.cpuUsage || 0}%</div>
        <div class="mt-2 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
          <div class="h-full bg-th-blue rounded-full transition-all" style:width="{resources.system.cpuUsage || 0}%"></div>
        </div>
      </div>

      <!-- Memory -->
      <div class="p-4 bg-bg-secondary rounded-lg border border-border-subtle">
        <div class="text-xs text-text-tertiary mb-1">Memory</div>
        <div class="text-2xl font-semibold text-text-primary">
          {formatMB(resources.system.usedMemoryMB || 0)}
        </div>
        <div class="text-xs text-text-muted mt-1">of {formatMB(resources.system.totalMemoryMB || 0)}</div>
        <div class="mt-2 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
          <div
            class="h-full bg-th-green rounded-full transition-all"
            style:width="{resources.system.totalMemoryMB ? ((resources.system.usedMemoryMB / resources.system.totalMemoryMB) * 100) : 0}%"
          ></div>
        </div>
      </div>

      <!-- Uptime -->
      <div class="p-4 bg-bg-secondary rounded-lg border border-border-subtle">
        <div class="text-xs text-text-tertiary mb-1">Uptime</div>
        <div class="text-2xl font-semibold text-text-primary">
          {Math.floor((resources.system.uptimeSeconds || 0) / 3600)}h {Math.floor(((resources.system.uptimeSeconds || 0) % 3600) / 60)}m
        </div>
      </div>
    </div>

    <!-- Claude usage summary -->
    {#if resources.totalClaudeMemoryMB > 0 || resources.totalClaudeCpuPercent > 0}
      <div class="mb-4 p-3 bg-bg-secondary rounded-lg border border-border-subtle">
        <div class="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Claude Sessions Total</div>
        <div class="flex gap-6 text-sm">
          <span class="text-text-secondary">Memory: <span class="text-text-primary font-medium">{formatMB(resources.totalClaudeMemoryMB)}</span></span>
          <span class="text-text-secondary">CPU: <span class="text-text-primary font-medium">{resources.totalClaudeCpuPercent}%</span></span>
        </div>
      </div>
    {/if}

    <!-- Per-session resources -->
    {#if resources.claudeSessions?.length > 0}
      <h3 class="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Running Sessions</h3>
      <div class="flex flex-col gap-2">
        {#each resources.claudeSessions as session}
          <div class="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg border border-border-subtle">
            <div class="flex-1 min-w-0">
              <div class="text-sm text-text-primary truncate">{session.sessionName}</div>
              {#if session.workspaceName}
                <div class="text-xs text-text-muted">{session.workspaceName}</div>
              {/if}
            </div>
            <div class="flex gap-4 text-xs text-text-secondary shrink-0">
              <span>MEM {formatMB(session.memoryMB)}</span>
              {#if session.cpuPercent != null}
                <span>CPU {session.cpuPercent}%</span>
              {/if}
              {#if session.ports?.length > 0}
                <span>Ports: {session.ports.join(', ')}</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="text-sm text-text-muted">No running Claude sessions</div>
    {/if}
  {:else}
    <div class="text-sm text-text-muted">Resource monitoring not available</div>
  {/if}
</div>
