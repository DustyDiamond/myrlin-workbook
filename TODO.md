# TODO - Claude Workspace Manager

## Completed
- [x] Core state store with JSON persistence (src/state/store.js)
- [x] Theme system with dark Linear/Raycast aesthetic (src/ui/theme.js)
- [x] Session manager - launch/stop/restart processes (src/core/session-manager.js)
- [x] Workspace manager - CRUD + business logic (src/core/workspace-manager.js)
- [x] Process tracker - PID monitoring + health checks (src/core/process-tracker.js)
- [x] Recovery system - auto-detect stale sessions, re-launch (src/core/recovery.js)
- [x] Notification system - event-based with store integration (src/core/notifications.js)
- [x] Status bar UI (src/ui/status-bar.js)
- [x] Workspace panel - left sidebar with keybindings (src/ui/workspace-panel.js)
- [x] Session list - right panel with status indicators (src/ui/session-list.js)
- [x] Session detail - key-value display + logs (src/ui/session-detail.js)
- [x] Notification bar - bottom notifications (src/ui/notification-bar.js)
- [x] Dialogs - input prompt, confirm, help overlay (src/ui/dialogs.js)
- [x] App orchestrator - layout, events, keybindings (src/ui/app.js)
- [x] Main entry point with CLI args (src/index.js)
- [x] Demo mode with sample data (src/demo.js)
- [x] Test suite - 26 tests, all passing (test/run.js)
- [x] Screenshot capture - HTML + text (test/screenshot.js)

## UX Overhaul (Completed)
- [x] Catppuccin Mocha color palette (src/ui/theme.js)
- [x] Global "All Sessions" view - `a` key (src/ui/session-list.js)
- [x] Recent Sessions view - `e` key (src/ui/session-list.js)
- [x] Quick Switcher - Ctrl+K (src/ui/dialogs.js)
- [x] View mode indicator in status bar (src/ui/status-bar.js)
- [x] Updated help dialog with new keybindings (src/ui/dialogs.js)
- [x] Recent sessions tracking in store (src/state/store.js)
- [x] Updated HTML screenshots with Catppuccin theme (test/screenshot.js)

## GUI Web Interface (Completed)
- [x] Express web server with REST API (src/web/server.js)
- [x] Token-based authentication with timing-safe comparison (src/web/auth.js)
- [x] Web SPA frontend - Catppuccin Mocha, Linear-inspired (src/web/public/)
- [x] SSE for live updates from store events
- [x] Quick switcher (Ctrl+K) in web UI
- [x] GUI entry point with --demo flag (src/gui.js)
- [x] Full workspace CRUD via GUI
- [x] Full session CRUD + start/stop/restart via GUI
- [x] View mode tabs (Workspace/All/Recent)
- [x] Responsive layout with mobile sidebar toggle
- [x] Toast notifications for all actions
- [x] Color picker for workspace colors
- [x] Activity log display in session detail

## Upcoming
- [ ] Resource tracking per Claude session (memory + CPU)
- [ ] Subagent tracking per session
- [ ] Cloudflare tunnel to myrlin.dev (remote access)
- [ ] Password-protected web access

## Future Enhancements
- [ ] Windows Terminal tab integration (wt.exe panes)
- [ ] Session output capture / log streaming
- [ ] Workspace import/export
- [ ] Custom keybinding config
- [ ] Session templates (pre-configured commands + dirs)
- [ ] Multi-monitor / split-pane views
