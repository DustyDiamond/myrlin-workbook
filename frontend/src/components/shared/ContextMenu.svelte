<script>
  let { items = [], x = 0, y = 0, onclose } = $props();

  let menuEl;

  // Position clamping
  let posStyle = $derived.by(() => {
    const maxX = (typeof window !== 'undefined' ? window.innerWidth : 800) - 200;
    const maxY = (typeof window !== 'undefined' ? window.innerHeight : 600) - (items.length * 32 + 16);
    return `left: ${Math.min(x, maxX)}px; top: ${Math.min(y, maxY)}px;`;
  });

  function handleClick(item) {
    if (item.disabled) return;
    item.action?.();
    onclose?.();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') onclose?.();
  }
</script>

<svelte:window onkeydown={handleKeydown} onclick={onclose} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={menuEl}
  class="fixed z-[9999] min-w-[180px] py-1 bg-bg-secondary border border-border-default rounded-lg shadow-lg
         animate-[scaleIn_0.1s_ease-out]"
  style={posStyle}
  onclick={(e) => e.stopPropagation()}
>
  {#each items as item, i}
    {#if item.type === 'sep'}
      <div class="my-1 border-t border-border-subtle"></div>
    {:else}
      <button
        onclick={() => handleClick(item)}
        disabled={item.disabled}
        class="w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 transition-colors
               {item.disabled
                 ? 'text-text-muted cursor-not-allowed'
                 : item.danger
                   ? 'text-th-red hover:bg-bg-elevated'
                   : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'}"
      >
        {#if item.icon}
          <span class="w-4 text-center">{item.icon}</span>
        {/if}
        <span>{item.label}</span>
        {#if item.shortcut}
          <span class="ml-auto text-[10px] text-text-muted">{item.shortcut}</span>
        {/if}
      </button>
    {/if}
  {/each}
</div>

<style>
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
</style>
