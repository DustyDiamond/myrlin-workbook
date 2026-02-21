<script>
  let {
    title = 'Confirm',
    message = 'Are you sure?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmClass = 'bg-th-red',
    onconfirm,
    oncancel,
  } = $props();

  function handleKeydown(e) {
    if (e.key === 'Escape') oncancel?.();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 bg-crust/60 backdrop-blur-sm flex items-center justify-center z-50"
  onclick={oncancel}
>
  <div
    class="w-full max-w-sm bg-bg-secondary rounded-xl border border-border-default shadow-xl p-5"
    onclick={(e) => e.stopPropagation()}
  >
    <h3 class="text-sm font-semibold text-text-primary mb-2">{title}</h3>
    <p class="text-sm text-text-secondary mb-4">{message}</p>

    <div class="flex justify-end gap-2">
      <button
        onclick={oncancel}
        class="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        {cancelText}
      </button>
      <button
        onclick={onconfirm}
        class="px-4 py-1.5 text-sm text-crust rounded-md hover:opacity-90 transition-opacity {confirmClass}"
      >
        {confirmText}
      </button>
    </div>
  </div>
</div>
