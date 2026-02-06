/**
 * TerminalPane — xterm.js terminal connected via WebSocket to server-side PTY
 * Performance-critical: raw binary I/O, no JSON wrapping for terminal data
 */
class TerminalPane {
  constructor(containerId, sessionId, sessionName) {
    this.containerId = containerId;
    this.sessionId = sessionId;
    this.sessionName = sessionName || 'Terminal';
    this.term = null;
    this.fitAddon = null;
    this.ws = null;
    this.connected = false;
    this.reconnectTimer = null;
  }

  mount() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    container.innerHTML = ''; // clear placeholder

    this.term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
      lineHeight: 1.2,
      scrollback: 5000,
      theme: {
        background: '#1e1e2e',
        foreground: '#cdd6f4',
        cursor: '#f5e0dc',
        cursorAccent: '#1e1e2e',
        selectionBackground: 'rgba(203, 166, 247, 0.25)',
        selectionForeground: '#cdd6f4',
        black: '#45475a',
        red: '#f38ba8',
        green: '#a6e3a1',
        yellow: '#f9e2af',
        blue: '#89b4fa',
        magenta: '#cba6f7',
        cyan: '#94e2d5',
        white: '#bac2de',
        brightBlack: '#585b70',
        brightRed: '#f38ba8',
        brightGreen: '#a6e3a1',
        brightYellow: '#f9e2af',
        brightBlue: '#89b4fa',
        brightMagenta: '#cba6f7',
        brightCyan: '#94e2d5',
        brightWhite: '#a6adc8',
      },
    });

    this.fitAddon = new FitAddon.FitAddon();
    this.term.loadAddon(this.fitAddon);

    // Load web links addon if available
    if (typeof WebLinksAddon !== 'undefined') {
      this.term.loadAddon(new WebLinksAddon.WebLinksAddon());
    }

    this.term.open(container);

    // Small delay to ensure container has dimensions before fitting
    requestAnimationFrame(() => {
      this.fitAddon.fit();
      this.connect();
    });

    // Forward user input to WebSocket — RAW, no JSON wrapping
    this.term.onData((data) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    // Auto-resize on container size change
    this._resizeObserver = new ResizeObserver(() => {
      if (this.fitAddon) {
        this.fitAddon.fit();
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'resize', cols: this.term.cols, rows: this.term.rows }));
        }
      }
    });
    this._resizeObserver.observe(container);
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    const token = localStorage.getItem('cwm_token');
    if (!token) return;

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}/ws/terminal?token=${encodeURIComponent(token)}&sessionId=${this.sessionId}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.connected = true;
      // Send initial terminal size
      this.ws.send(JSON.stringify({ type: 'resize', cols: this.term.cols, rows: this.term.rows }));
    };

    this.ws.onmessage = (event) => {
      // Check if it's a control message (JSON) or raw terminal output
      const data = event.data;
      if (typeof data === 'string' && data.charAt(0) === '{') {
        try {
          const msg = JSON.parse(data);
          if (msg.type === 'exit') {
            this.term.write('\r\n\x1b[1;31m[Process exited with code ' + msg.exitCode + ']\x1b[0m\r\n');
            this.connected = false;
          } else if (msg.type === 'error') {
            this.term.write('\r\n\x1b[1;31m[Error: ' + msg.message + ']\x1b[0m\r\n');
          } else if (msg.type === 'output') {
            // Fallback: server sent JSON-wrapped output
            this.term.write(msg.data);
          }
          return;
        } catch (_) { /* not JSON, treat as raw output */ }
      }
      // Raw terminal output — write directly (fastest path)
      this.term.write(data);
    };

    this.ws.onclose = () => {
      this.connected = false;
      // Auto-reconnect after 2s
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connect(), 2000);
    };

    this.ws.onerror = () => {
      // Will trigger onclose
    };
  }

  dispose() {
    clearTimeout(this.reconnectTimer);
    if (this._resizeObserver) this._resizeObserver.disconnect();
    if (this.ws) { this.ws.onclose = null; this.ws.close(); }
    if (this.term) this.term.dispose();
    this.term = null;
    this.ws = null;
  }
}

// Export for use by app.js
if (typeof window !== 'undefined') window.TerminalPane = TerminalPane;
