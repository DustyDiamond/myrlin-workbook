<script>
  import { settings } from '$lib/stores/settings.svelte.js';
  import { auth } from '$lib/stores/auth.svelte.js';
  import { api } from '$lib/api.js';
  import { formatCost } from '$lib/utils.js';

  let { activeTab, onTabChange, onLogout } = $props();

  let dailyCost = $state(0);
  let runningSessions = $state(0);
  let totalSessions = $state(0);
  let showThemeDropdown = $state(false);

  const tabs = [
    { id: 'terminal', label: 'Terminal', icon: '>' },
    { id: 'board', label: 'Board', icon: '#' },
    { id: 'resources', label: 'Resources', icon: '~' },
  ];

  // Poll stats + cost
  $effect(() => {
    loadStats();
    loadCost();
    const statsInterval = setInterval(loadStats, 15000);
    const costInterval = setInterval(loadCost, 60000);
    return () => { clearInterval(statsInterval); clearInterval(costInterval); };
  });

  async function loadStats() {
    if (!auth.token) return;
    try {
      const data = await api('GET', '/api/stats');
      runningSessions = data.runningSessions || 0;
      totalSessions = data.totalSessions || 0;
    } catch { /* api() handles 401 → logout */ }
  }

  async function loadCost() {
    if (!auth.token) return;
    try {
      const data = await api('GET', '/api/cost/dashboard?period=day');
      dailyCost = data.totalCost || 0;
    } catch { /* api() handles 401 → logout */ }
  }

  function handleThemeClick(themeId) {
    settings.setTheme(themeId);
    showThemeDropdown = false;
  }

  function handleWindowClick() {
    if (showThemeDropdown) showThemeDropdown = false;
  }
</script>

<svelte:window onclick={handleWindowClick} />

<header class="flex items-center h-12 px-4 bg-bg-secondary border-b border-border-subtle shrink-0">
  <!-- Logo -->
  <div class="flex items-center gap-2 mr-4">
    <img src="/logo-cropped.png" alt="Myrlin" class="w-6 h-6" />
    <span class="text-sm font-semibold text-text-primary hidden sm:block">Myrlin</span>
  </div>

  <!-- Tabs -->
  <nav class="flex gap-1 mr-auto">
    {#each tabs as tab}
      <button
        onclick={() => onTabChange(tab.id)}
        class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors
               {activeTab === tab.id
                 ? 'bg-bg-elevated text-accent'
                 : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50'}"
      >
        {tab.label}
      </button>
    {/each}
  </nav>

  <!-- Stats -->
  <div class="flex items-center gap-3 text-xs text-text-secondary">
    <span class="flex items-center gap-1.5">
      <span class="w-1.5 h-1.5 rounded-full {runningSessions > 0 ? 'bg-th-green' : 'bg-surface-2'}"></span>
      {runningSessions}
    </span>
    <span>{totalSessions} sessions</span>
    {#if dailyCost > 0}
      <span class="px-1.5 py-0.5 bg-bg-elevated rounded text-text-tertiary font-mono">
        {formatCost(dailyCost)}
      </span>
    {/if}
  </div>

  <!-- Theme Picker -->
  <div class="relative ml-3">
    <button
      onclick={(e) => { e.stopPropagation(); showThemeDropdown = !showThemeDropdown; }}
      class="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
      title="Theme"
    >
      {#if settings.isLightTheme}
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      {:else}
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      {/if}
    </button>

    {#if showThemeDropdown}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="absolute right-0 top-full mt-1 w-48 py-1 bg-bg-secondary border border-border-default rounded-lg shadow-lg z-50"
        onclick={(e) => e.stopPropagation()}
      >
        {#each settings.themes as theme}
          <button
            onclick={() => handleThemeClick(theme.id)}
            class="w-full px-3 py-1.5 text-left text-xs hover:bg-bg-elevated transition-colors flex items-center gap-2
                   {settings.theme === theme.id ? 'text-accent font-medium' : 'text-text-secondary'}"
          >
            <span class="w-2 h-2 rounded-full" style:background={theme.type === 'light' ? '#f9e2af' : '#313244'}></span>
            {theme.name}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Settings / Logout -->
  <button
    onclick={onLogout}
    class="ml-2 p-1.5 rounded-md text-text-secondary hover:text-th-red hover:bg-bg-elevated transition-colors"
    title="Logout"
  >
    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14l5-5-5-5m5 5H9"/>
    </svg>
  </button>
</header>
