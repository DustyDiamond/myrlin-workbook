<script>
  import { onMount, onDestroy } from 'svelte';
  import { Terminal } from '@xterm/xterm';
  import { FitAddon } from '@xterm/addon-fit';
  import { WebLinksAddon } from '@xterm/addon-web-links';
  import { getCurrentXtermTheme } from '$lib/themes.js';
  import { terminalStore } from '$lib/stores/terminal.svelte.js';
  import { settings } from '$lib/stores/settings.svelte.js';

  let { session, token } = $props();

  let containerEl;
  let term = null;
  let fitAddon = null;
  let ws = null;
  let resizeObserver = null;

  onMount(() => {
    if (!containerEl || !session?.id || !token) return;

    // Create xterm.js instance
    term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
      lineHeight: 1.2,
      scrollback: 5000,
      theme: getCurrentXtermTheme(),
    });

    fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(containerEl);
    fitAddon.fit();

    // Connect WebSocket to PTY
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}/ws/terminal?token=${encodeURIComponent(token)}&sessionId=${encodeURIComponent(session.id)}&cols=${term.cols}&rows=${term.rows}`;

    ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      term?.write('\r\n');
    };

    ws.onmessage = (event) => {
      if (!term) return;
      if (event.data instanceof ArrayBuffer) {
        term.write(new Uint8Array(event.data));
      } else {
        term.write(event.data);
      }
    };

    ws.onclose = () => {
      term?.write('\r\n\x1b[33m[Session disconnected]\x1b[0m\r\n');
    };

    ws.onerror = () => {
      term?.write('\r\n\x1b[31m[Connection error]\x1b[0m\r\n');
    };

    // Terminal → WebSocket (guard against post-destroy calls)
    term.onData((data) => {
      try {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      } catch {}
    });

    // Handle resize
    term.onResize(({ cols, rows }) => {
      try {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'resize', cols, rows }));
        }
      } catch {}
    });

    // Auto-fit on container resize
    resizeObserver = new ResizeObserver(() => {
      try { fitAddon?.fit(); } catch {}
    });
    resizeObserver.observe(containerEl);

    // Register pane in store
    terminalStore.registerPane(session.id, { term, ws, fitAddon });
  });

  onDestroy(() => {
    if (resizeObserver) resizeObserver.disconnect();
    if (ws) {
      ws.close();
      ws = null;
    }
    if (term) {
      term.dispose();
      term = null;
    }
    if (session?.id) {
      terminalStore.unregisterPane(session.id);
    }
  });

  // React to theme changes
  $effect(() => {
    // Re-read settings.theme to track it
    const _ = settings.theme;
    if (term) {
      term.options.theme = getCurrentXtermTheme();
    }
  });
</script>

<div class="flex flex-col h-full bg-base overflow-hidden">
  <!-- Pane header -->
  <div class="flex items-center px-2 py-1 bg-bg-secondary border-b border-border-subtle shrink-0">
    <span class="w-1.5 h-1.5 rounded-full mr-2
      {session.status === 'running' ? 'bg-th-green' : 'bg-surface-2'}"></span>
    <span class="text-xs font-medium text-text-secondary truncate">{session.name}</span>
    {#if session.topic}
      <span class="ml-2 text-xs text-text-muted truncate">- {session.topic}</span>
    {/if}
  </div>

  <!-- Terminal container -->
  <div
    bind:this={containerEl}
    class="flex-1 p-1"
  ></div>
</div>
