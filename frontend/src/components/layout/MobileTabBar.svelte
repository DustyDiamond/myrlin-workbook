<script>
  let { activeTab, onTabChange } = $props();

  const tabs = [
    { id: 'terminal', label: 'Terminal', icon: '>' },
    { id: 'board', label: 'Board', icon: '#' },
    { id: 'resources', label: 'Resources', icon: '~' },
  ];
</script>

<nav class="flex sm:hidden border-t border-border-subtle bg-bg-secondary shrink-0">
  {#each tabs as tab}
    <button
      onclick={() => onTabChange(tab.id)}
      class="flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors
             {activeTab === tab.id
               ? 'text-accent'
               : 'text-text-muted'}"
    >
      <span class="text-base">{tab.icon}</span>
      <span>{tab.label}</span>
    </button>
  {/each}
</nav>
