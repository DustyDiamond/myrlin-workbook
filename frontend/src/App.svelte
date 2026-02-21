<script>
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/auth.svelte.js';
  import { settings } from '$lib/stores/settings.svelte.js';
  import LoginForm from './components/auth/LoginForm.svelte';
  import Header from './components/layout/Header.svelte';
  import Sidebar from './components/layout/Sidebar.svelte';
  import Toast from './components/layout/Toast.svelte';
  import TerminalGrid from './components/terminal/TerminalGrid.svelte';
  import BoardPanel from './components/board/BoardPanel.svelte';
  import ResourcesPanel from './components/resources/ResourcesPanel.svelte';
  import MobileTabBar from './components/layout/MobileTabBar.svelte';
  import QuickSwitcher from './components/shared/QuickSwitcher.svelte';
  import { connect, disconnect } from '$lib/sse.js';
  import { workspacesStore } from '$lib/stores/workspaces.svelte.js';
  import { sessionsStore } from '$lib/stores/sessions.svelte.js';
  import { boardStore } from '$lib/stores/board.svelte.js';
  import * as sse from '$lib/sse.js';

  let activeTab = $state(localStorage.getItem('cwm_viewMode') || 'terminal');
  let showQuickSwitcher = $state(false);
  let sseWired = false;

  // Check auth once on mount (not reactively)
  onMount(() => {
    if (auth.token) {
      auth.check().then(valid => {
        if (valid) {
          onAuthenticated();
        }
      });
    }
  });

  function onAuthenticated() {
    connect();
    workspacesStore.load();
    sessionsStore.load();
    boardStore.load();

    // Wire SSE events to stores (only once)
    if (!sseWired) {
      sseWired = true;
      sse.on('workspace:created', (data) => workspacesStore.handleEvent('workspace:created', data));
      sse.on('workspace:updated', (data) => workspacesStore.handleEvent('workspace:updated', data));
      sse.on('workspace:deleted', (data) => workspacesStore.handleEvent('workspace:deleted', data));
      sse.on('session:created', (data) => sessionsStore.handleEvent('session:created', data));
      sse.on('session:updated', (data) => sessionsStore.handleEvent('session:updated', data));
      sse.on('session:deleted', (data) => sessionsStore.handleEvent('session:deleted', data));
      sse.on('feature:created', (data) => boardStore.handleEvent('feature:created', data));
      sse.on('feature:updated', (data) => boardStore.handleEvent('feature:updated', data));
      sse.on('feature:deleted', (data) => boardStore.handleEvent('feature:deleted', data));
    }
  }

  function handleLogin() {
    onAuthenticated();
  }

  function setTab(tab) {
    activeTab = tab;
    localStorage.setItem('cwm_viewMode', tab);
  }

  function handleLogout() {
    sseWired = false;
    disconnect();
    auth.logout();
  }

  function handleKeydown(e) {
    // Don't handle shortcuts when typing in inputs
    const tag = e.target?.tagName;
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    // Ctrl+K / Cmd+K for quick switcher (works even in inputs)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      showQuickSwitcher = !showQuickSwitcher;
      return;
    }

    // Skip remaining shortcuts when focused on input elements
    if (isInput) return;

    // Ctrl+B — toggle sidebar
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      settings.toggleSidebar();
      return;
    }

    // Alt+1/2/3 — switch tabs
    if (e.altKey && e.key === '1') { e.preventDefault(); setTab('terminal'); }
    if (e.altKey && e.key === '2') { e.preventDefault(); setTab('board'); }
    if (e.altKey && e.key === '3') { e.preventDefault(); setTab('resources'); }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if !auth.isAuthenticated}
  <LoginForm onlogin={handleLogin} />
{:else}
  <div class="flex flex-col h-full bg-bg-primary text-text-primary">
    <Header {activeTab} onTabChange={setTab} onLogout={handleLogout} />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar />

      {#if settings.sidebarCollapsed}
        <button
          onclick={() => settings.toggleSidebar()}
          class="flex items-center justify-center w-6 h-full bg-bg-secondary border-r border-border-subtle text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors shrink-0"
          title="Expand sidebar (Ctrl+B)"
        >
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      {/if}

      <main class="flex-1 overflow-hidden">
        {#if activeTab === 'terminal'}
          <TerminalGrid />
        {:else if activeTab === 'board'}
          <BoardPanel />
        {:else if activeTab === 'resources'}
          <ResourcesPanel />
        {/if}
      </main>
    </div>

    <MobileTabBar {activeTab} onTabChange={setTab} />
    <Toast />

    {#if showQuickSwitcher}
      <QuickSwitcher
        onclose={() => showQuickSwitcher = false}
        onSelectWorkspace={(id) => { workspacesStore.setActive(id); sessionsStore.load(); }}
        onSelectSession={(id) => { /* TODO: focus session terminal */ }}
      />
    {/if}
  </div>
{/if}
