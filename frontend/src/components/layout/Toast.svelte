<script>
  let toasts = $state([]);
  let nextId = 0;

  /**
   * Show a toast notification.
   * @param {string} message
   * @param {'info'|'success'|'error'|'warning'} [type='info']
   * @param {number} [duration=3000]
   */
  export function showToast(message, type = 'info', duration = 3000) {
    const id = nextId++;
    toasts = [...toasts, { id, message, type }];
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, duration);
  }

  // Expose globally for non-Svelte callers
  if (typeof window !== 'undefined') {
    window.__myrlinToast = showToast;
  }

  const typeColors = {
    info: 'bg-th-blue',
    success: 'bg-th-green',
    error: 'bg-th-red',
    warning: 'bg-th-yellow',
  };
</script>

<div class="fixed bottom-4 right-4 flex flex-col gap-2 z-[9999] pointer-events-none">
  {#each toasts as toast (toast.id)}
    <div
      class="px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium text-crust pointer-events-auto
             animate-[slideIn_0.2s_ease-out] {typeColors[toast.type] || typeColors.info}"
    >
      {toast.message}
    </div>
  {/each}
</div>

<style>
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
