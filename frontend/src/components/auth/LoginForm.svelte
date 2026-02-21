<script>
  import { auth } from '$lib/stores/auth.svelte.js';

  let { onlogin } = $props();
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password.trim()) return;

    loading = true;
    error = '';

    try {
      const success = await auth.login(password);
      if (success) {
        onlogin?.();
      } else {
        error = 'Invalid password';
      }
    } catch (err) {
      error = err.message || 'Login failed';
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex items-center justify-center h-full bg-bg-primary">
  <div class="w-full max-w-sm p-8 bg-bg-secondary rounded-xl border border-border-subtle shadow-lg">
    <div class="flex items-center gap-3 mb-6">
      <img src="/logo-cropped.png" alt="Myrlin" class="w-10 h-10" />
      <h1 class="text-xl font-semibold text-text-primary">Myrlin Workbook</h1>
    </div>

    <form onsubmit={handleSubmit} class="flex flex-col gap-4">
      <div>
        <label for="password" class="block text-sm text-text-secondary mb-1.5">Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          placeholder="Enter password"
          disabled={loading}
          class="w-full px-3 py-2 bg-bg-elevated text-text-primary border border-border-default rounded-md
                 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent
                 disabled:opacity-50 font-mono text-sm"
        />
      </div>

      {#if error}
        <p class="text-sm text-th-red">{error}</p>
      {/if}

      <button
        type="submit"
        disabled={loading || !password.trim()}
        class="px-4 py-2 bg-accent text-crust font-medium rounded-md
               hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  </div>
</div>
