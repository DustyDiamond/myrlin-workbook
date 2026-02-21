<script>
  let { title = '', onclose, children } = $props();

  function handleKeydown(e) {
    if (e.key === 'Escape') onclose?.();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 bg-crust/60 backdrop-blur-sm flex items-center justify-center z-50
         animate-[fadeIn_0.15s_ease-out]"
  onclick={onclose}
>
  <div
    class="w-full max-w-md bg-bg-secondary rounded-xl border border-border-default shadow-xl
           animate-[slideUp_0.2s_cubic-bezier(0.16,1,0.3,1)]"
    onclick={(e) => e.stopPropagation()}
  >
    {#if title}
      <div class="flex items-center justify-between px-5 py-3 border-b border-border-subtle">
        <h2 class="text-sm font-semibold text-text-primary">{title}</h2>
        <button
          onclick={onclose}
          class="text-text-muted hover:text-text-primary transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    {/if}
    <div class="p-5">
      {@render children?.()}
    </div>
  </div>
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(8px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
</style>
