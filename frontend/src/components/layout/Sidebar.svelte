<script>
  import { onMount } from 'svelte';
  import { workspacesStore } from '$lib/stores/workspaces.svelte.js';
  import { sessionsStore } from '$lib/stores/sessions.svelte.js';
  import { settings } from '$lib/stores/settings.svelte.js';
  import { stringToColor, timeAgo } from '$lib/utils.js';
  import ConfirmDialog from '../shared/ConfirmDialog.svelte';
  import ContextMenu from '../shared/ContextMenu.svelte';

  onMount(() => {
    if (window.innerWidth < 768 && !settings.sidebarCollapsed) {
      settings.toggleSidebar();
    }
  });

  let showCreateWorkspace = $state(false);
  let newWorkspaceName = $state('');
  let showCreateSession = $state(false);
  let newSessionName = $state('');
  let contextMenu = $state(null);
  let confirmDialog = $state(null);

  async function createWorkspace() {
    if (!newWorkspaceName.trim()) return;
    await workspacesStore.create(newWorkspaceName.trim());
    newWorkspaceName = '';
    showCreateWorkspace = false;
  }

  function selectWorkspace(id) {
    workspacesStore.setActive(id);
    sessionsStore.load();
  }

  async function createSession() {
    if (!newSessionName.trim() || !workspacesStore.activeWorkspaceId) return;
    try {
      await sessionsStore.create({
        name: newSessionName.trim(),
        workspaceId: workspacesStore.activeWorkspaceId,
      });
      newSessionName = '';
      showCreateSession = false;
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  }

  async function startSession(id) {
    try { await sessionsStore.start(id); }
    catch (err) { console.error('Failed to start session:', err); }
  }

  async function stopSession(id) {
    try { await sessionsStore.stop(id); }
    catch (err) { console.error('Failed to stop session:', err); }
  }

  function confirmDeleteSession(session) {
    confirmDialog = {
      title: 'Delete Session',
      message: `Delete session "${session.name}"? This cannot be undone.`,
      onconfirm: async () => {
        try { await sessionsStore.destroy(session.id); }
        catch (err) { console.error('Failed to delete session:', err); }
        confirmDialog = null;
      },
      oncancel: () => { confirmDialog = null; },
    };
  }

  function showSessionContextMenu(e, session) {
    e.preventDefault();
    const items = [];
    if (session.status === 'running') {
      items.push({ label: 'Stop Session', icon: '⏹', action: () => stopSession(session.id) });
    } else {
      items.push({ label: 'Start Session', icon: '▶', action: () => startSession(session.id) });
    }
    items.push({ type: 'sep' });
    items.push({ label: 'Hide from list', icon: '👁', action: () => sessionsStore.hide(session.id) });
    items.push({ type: 'sep' });
    items.push({
      label: 'Delete Session',
      icon: '🗑',
      danger: true,
      action: () => confirmDeleteSession(session),
    });
    contextMenu = { items, x: e.clientX, y: e.clientY };
  }
</script>

<aside
  class="flex flex-col h-full bg-bg-secondary border-r border-border-subtle overflow-hidden shrink-0 transition-all
         {settings.sidebarCollapsed ? 'w-0' : ''}"
  style:width={settings.sidebarCollapsed ? '0px' : `${settings.sidebarWidth}px`}
>
  <!-- Workspaces Section -->
  <div class="flex items-center justify-between px-3 py-2 border-b border-border-subtle">
    <span class="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Workspaces</span>
    <button
      onclick={() => showCreateWorkspace = !showCreateWorkspace}
      class="text-text-muted hover:text-accent text-sm transition-colors"
      title="New workspace"
    >+</button>
  </div>

  {#if showCreateWorkspace}
    <div class="px-3 py-2 border-b border-border-subtle">
      <form onsubmit={(e) => { e.preventDefault(); createWorkspace(); }} class="flex gap-2">
        <input
          type="text"
          bind:value={newWorkspaceName}
          placeholder="Workspace name"
          class="flex-1 px-2 py-1 text-xs bg-bg-elevated text-text-primary border border-border-default rounded
                 placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button type="submit" class="px-2 py-1 text-xs bg-accent text-crust rounded hover:opacity-90">Add</button>
      </form>
    </div>
  {/if}

  <!-- Workspace List -->
  <div class="flex-1 overflow-y-auto">
    <div class="py-1">
      {#each workspacesStore.workspaces as ws}
        <button
          onclick={() => selectWorkspace(ws.id)}
          class="w-full px-3 py-2 text-left flex items-center gap-2 text-sm transition-colors
                 {ws.id === workspacesStore.activeWorkspaceId
                   ? 'bg-bg-elevated text-text-primary'
                   : 'text-text-secondary hover:bg-bg-elevated/50 hover:text-text-primary'}"
        >
          <span
            class="w-2.5 h-2.5 rounded-sm shrink-0"
            style:background={ws.color || stringToColor(ws.name)}
          ></span>
          <span class="truncate">{ws.name}</span>
          {#if ws.sessionCount}
            <span class="ml-auto text-xs text-text-muted">{ws.sessionCount}</span>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Sessions Section -->
    {#if workspacesStore.activeWorkspace}
      <div class="border-t border-border-subtle">
        <div class="flex items-center justify-between px-3 py-2">
          <span class="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Sessions</span>
          <button
            onclick={() => showCreateSession = !showCreateSession}
            class="text-text-muted hover:text-accent text-sm transition-colors"
            title="New session"
          >+</button>
        </div>

        {#if showCreateSession}
          <div class="px-3 py-2 border-b border-border-subtle">
            <form onsubmit={(e) => { e.preventDefault(); createSession(); }} class="flex gap-2">
              <input
                type="text"
                bind:value={newSessionName}
                placeholder="Session name"
                class="flex-1 px-2 py-1 text-xs bg-bg-elevated text-text-primary border border-border-default rounded
                       placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button type="submit" class="px-2 py-1 text-xs bg-accent text-crust rounded hover:opacity-90">Add</button>
            </form>
          </div>
        {/if}

        <div class="py-1">
          {#each sessionsStore.visibleSessions as session}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="px-3 py-1.5 flex items-center gap-2 text-sm text-text-secondary hover:bg-bg-elevated/50 cursor-pointer group"
              oncontextmenu={(e) => showSessionContextMenu(e, session)}
            >
              <span class="w-1.5 h-1.5 rounded-full shrink-0
                {session.status === 'running' ? 'bg-th-green' : 'bg-surface-2'}"></span>
              <span class="truncate flex-1">{session.name}</span>
              <!-- Quick start/stop button -->
              <button
                onclick={(e) => { e.stopPropagation(); session.status === 'running' ? stopSession(session.id) : startSession(session.id); }}
                class="opacity-0 group-hover:opacity-100 text-xs text-text-muted hover:text-text-primary transition-opacity"
                title={session.status === 'running' ? 'Stop' : 'Start'}
              >
                {session.status === 'running' ? '⏹' : '▶'}
              </button>
              <span class="text-xs text-text-muted shrink-0">{timeAgo(session.updatedAt || session.createdAt)}</span>
            </div>
          {/each}

          {#if sessionsStore.visibleSessions.length === 0}
            <div class="px-3 py-4 text-xs text-text-muted text-center">No sessions</div>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Sidebar Toggle -->
  <button
    onclick={() => settings.toggleSidebar()}
    class="px-3 py-2 border-t border-border-subtle text-xs text-text-muted hover:text-text-primary transition-colors"
  >
    Collapse
  </button>
</aside>

{#if contextMenu}
  <ContextMenu
    items={contextMenu.items}
    x={contextMenu.x}
    y={contextMenu.y}
    onclose={() => contextMenu = null}
  />
{/if}

{#if confirmDialog}
  <ConfirmDialog
    title={confirmDialog.title}
    message={confirmDialog.message}
    confirmText="Delete"
    confirmClass="bg-th-red"
    onconfirm={confirmDialog.onconfirm}
    oncancel={confirmDialog.oncancel}
  />
{/if}
