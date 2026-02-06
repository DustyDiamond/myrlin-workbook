# myrlin's workbook

A workspace manager for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) sessions. Run multiple Claude instances side by side, organize them into workspaces, and manage everything from a single browser tab.

<!-- TODO: Screenshot of the main terminal view with 2 panes active -->
<!-- ![myrlin's workbook](screenshots/hero.png) -->

## What it does

- **Embedded terminals** — Up to 4 Claude Code sessions in a 2x2 grid, right in your browser. Real terminal emulation via xterm.js + node-pty. No delays, no buffering.
- **Workspace organization** — Group sessions into named workspaces. Group workspaces under team labels (e.g. "myrlin", "Day & Zim"). Drag to reorder.
- **Project discovery** — Scans `~/.claude/projects/` and surfaces every Claude project on your machine. See file counts, sizes, last activity. Expand any project to browse individual session files.
- **Drag and drop** — Drag a project (or a specific session file) from the sidebar into a workspace to create a session, or directly onto a terminal pane to start it immediately.
- **Session launch modes** — Right-click any session for options: bypass permissions, verbose mode, model selection (Opus, Sonnet, Haiku). Flags persist across restarts.
- **Crash recovery** — All state is saved to disk continuously. If your machine crashes or the server restarts, workspaces, sessions, groups, and terminal layout are restored.
- **Live updates** — Server-Sent Events push changes to all connected clients. Open the same workbook in multiple tabs or devices.
- **Resizable, collapsible sidebar** — Drag the edge to resize. Click the collapse button to minimize it to a thin strip.
- **Password protected** — Token-based auth with timing-safe comparison. Designed for local use, but works behind a reverse proxy too.

<!-- TODO: Screenshot of the sidebar with projects expanded -->
<!-- ![Projects sidebar](screenshots/sidebar-projects.png) -->

## Quick start

```bash
git clone https://github.com/myrlin-code/myrlin-workbook.git
cd myrlin-workbook
npm install
```

Set your password in `src/web/auth.js` (default is already set — change it):

```js
const MASTER_PASSWORD = 'your-password-here';
```

Launch:

```bash
npm run gui        # Starts server + opens browser at localhost:3456
npm run gui:demo   # Same, but with sample data pre-loaded
```

The TUI (terminal-only, no browser) is also available:

```bash
npm start          # blessed-based TUI
npm run demo       # TUI with sample data
```

## Requirements

- **Node.js 18+** (tested on 22.x)
- **Windows** — node-pty uses ConPTY. Linux/macOS support is untested but should work with minor adjustments.
- A C++ build toolchain for node-pty compilation (Visual Studio Build Tools on Windows, or `build-essential` on Linux)

## How it works

### Architecture

```
Browser (vanilla JS SPA)
  │
  ├── REST API ──────── Express server (src/web/server.js)
  │                       ├── State store (src/state/store.js) ── JSON persistence
  │                       ├── Session manager (src/core/session-manager.js)
  │                       └── Workspace groups, discovery, stats
  │
  ├── SSE ───────────── Real-time updates (store events → all clients)
  │
  └── WebSocket ─────── Terminal I/O (src/web/pty-server.js)
                           └── node-pty (src/web/pty-manager.js)
                                └── ConPTY / PTY processes
```

### Terminal performance

Terminal I/O is the one thing that can't be slow. The design prioritizes it:

- **Raw binary WebSocket frames** for terminal output (no JSON wrapping)
- **Direct `pty.write()`** from WebSocket messages (no queueing)
- **Scrollback buffer** per session, capped at 100KB (replayed on reconnect)
- **ResizeObserver** auto-fits terminal to container dimensions

### State persistence

All state lives in `./state/` as JSON files, written on every mutation (debounced at 100ms). This includes:

- Workspaces, sessions, groups, ordering
- Terminal pane layout
- Session flags (model, bypass, verbose)

If the server crashes mid-write, the worst case is losing the last 100ms of changes. No database, no migrations, no setup.

### Session discovery

The `/api/discover` endpoint scans `~/.claude/projects/` and decodes Claude's encoded directory names back to real filesystem paths. It uses greedy filesystem matching to correctly handle directory names with hyphens (e.g. `claude-workspace-manager` won't be split into `claude/workspace/manager`).

Results are cached for 30 seconds server-side and in `sessionStorage` client-side.

<!-- TODO: Screenshot of the terminal grid with 4 panes -->
<!-- ![Terminal grid](screenshots/terminal-grid.png) -->

## Project structure

```
src/
├── state/store.js           # Core state (JSON persistence + EventEmitter)
├── core/
│   ├── session-manager.js   # Launch/stop/restart processes
│   ├── workspace-manager.js # Workspace CRUD + business logic
│   ├── process-tracker.js   # PID monitoring
│   ├── recovery.js          # Auto-recovery on startup
│   └── notifications.js     # Event-based notifications
├── ui/                      # TUI (blessed library)
│   ├── theme.js             # Catppuccin Mocha theme
│   ├── app.js               # Main screen + layout
│   └── ...                  # Panels, dialogs, status bar
├── web/
│   ├── server.js            # Express API + SSE + WebSocket attachment
│   ├── auth.js              # Token-based authentication
│   ├── pty-manager.js       # PTY session lifecycle management
│   ├── pty-server.js        # WebSocket server for terminal I/O
│   └── public/
│       ├── index.html       # SPA shell
│       ├── styles.css       # Catppuccin Mocha CSS
│       ├── app.js           # Frontend application (CWMApp class)
│       ├── terminal.js      # TerminalPane (xterm.js client)
│       └── vendor/          # Vendored xterm.js + addons
├── index.js                 # TUI entry point
├── demo.js                  # TUI demo mode
└── gui.js                   # GUI entry point (auto-opens browser)
```

## Configuration

### Password

Edit `src/web/auth.js`. The password is compared using timing-safe comparison.

### Port

Default is 3456. Change in `src/web/server.js`:

```js
const PORT = process.env.PORT || 3456;
```

### Theme

The entire UI uses [Catppuccin Mocha](https://github.com/catppuccin/catppuccin). All colors are defined as CSS custom properties in `styles.css`. Swap the palette variables to use a different Catppuccin flavor or your own colors.

## Testing

```bash
npm test
```

26 tests covering store operations, theme utilities, session management, notifications, and recovery.

<!-- TODO: Screenshot of the context menu with launch options -->
<!-- ![Context menu](screenshots/context-menu.png) -->

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+K` / `Cmd+K` | Quick switcher (search workspaces and sessions) |
| `Escape` | Close modals, quick switcher, context menu |
| Right-click session | Context menu with launch modes, model selection |

## Roadmap

- [ ] Resource tracking per Claude session (memory + CPU)
- [ ] Subagent tracking per session
- [ ] Remote access via Cloudflare tunnel
- [ ] Session file content preview
- [ ] Export/import workspace configurations

## License

[BSL 1.1](LICENSE) — Free to use, fork, and modify. Commercial use requires a license from the author.

---

Built by [myrlin](https://github.com/myrlin-code). Made for managing Claude Code at scale.
