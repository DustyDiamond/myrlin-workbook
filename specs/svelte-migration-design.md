# Design: Svelte 5 + Vite + Tailwind CSS Migration

## Approach

Migrate the Myrlin Workbook frontend from a vanilla JS/CSS/HTML monolith (app.js: 9787 lines, board.js: 622, terminal.js: 828, styles.css: 5731, index.html: 755) to Svelte 5 components with Vite build tooling and Tailwind CSS. The Express backend (server.js, pty-manager.js, pty-server.js, auth.js, store.js, workspace.js MCP) remains **completely untouched**.

The migration uses a **parallel build** approach: a new `frontend/` directory contains the Svelte project. During development, Vite's dev server on port 5173 proxies all `/api/*` requests and `/ws/*` WebSocket connections to the Express backend on port 3456. For production, `vite build` outputs optimized assets to `src/web/public/`, which Express continues to serve via `express.static()` (server.js:136). This means zero backend changes.

The 9787-line CWMApp monolith (148 methods) decomposes into ~25 Svelte components + 6 Svelte stores + a shared API/SSE layer. The 13-theme system (Catppuccin Mocha/Latte/Frappe/Macchiato + Cherry/Ocean/Amber/Mint + Nord/Dracula/Tokyo Night/Rose Pine Dawn/Gruvbox Light) is preserved using the existing `data-theme` attribute + CSS custom properties, with Tailwind configured to reference these variables via `@theme`. xterm.js moves from vendor-bundled scripts to proper npm imports.

## Files to Modify

| File | What changes | Why |
|------|-------------|-----|
| `package.json` | Add Svelte, Vite, Tailwind, @sveltejs/vite-plugin-svelte devDependencies; add `dev`, `build`, `preview` scripts | Build tooling |
| `src/gui.js` | No change needed | Express serves static from `public/` already; Vite build targets that directory |
| `src/web/server.js` | No changes | Serves `express.static('public')` at line 136 — Vite build output lands there |

## Files to Create

| File | Purpose | Why not modify existing |
|------|---------|----------------------|
| `frontend/vite.config.js` | Vite config: Svelte plugin, Tailwind plugin, dev proxy for API/WS/SSE | New build system |
| `frontend/index.html` | Vite entry HTML (minimal — just `<div id="app">` + `<script type="module">`) | Vite requires its own entry HTML |
| `frontend/src/main.js` | Mount root Svelte component | New entry point |
| `frontend/src/App.svelte` | Root component: auth gate, layout, tab routing | Replaces CWMApp class shell |
| `frontend/src/app.css` | Tailwind imports + CSS custom property themes | Replaces styles.css |
| `frontend/src/lib/api.js` | HTTP client wrapping fetch with auth token | Extracted from CWMApp.api() method |
| `frontend/src/lib/sse.js` | SSE connection manager, dispatches to stores | Extracted from CWMApp SSE handling |
| `frontend/src/lib/stores/auth.js` | Auth state: token, login/logout, auto-check | Extracted from CWMApp auth flow |
| `frontend/src/lib/stores/workspaces.js` | Workspace list, active workspace, CRUD | Extracted from CWMApp workspace methods |
| `frontend/src/lib/stores/sessions.js` | Session list, create/destroy/link/unlink | Extracted from CWMApp session methods |
| `frontend/src/lib/stores/settings.js` | User preferences, theme, UI scale | Extracted from CWMApp.state.settings |
| `frontend/src/lib/stores/board.js` | Kanban feature state, CRUD, filtering | Extracted from BoardView class |
| `frontend/src/lib/stores/terminal.js` | Terminal pane state, groups, tabs | Extracted from CWMApp terminal tracking |
| `frontend/src/lib/themes.js` | Theme list, xterm theme objects | Extracted from TerminalPane.getCurrentTheme() |
| `frontend/src/lib/utils.js` | escapeHtml, formatBytes, debounce | Extracted from CWMApp utility methods |
| `frontend/src/components/layout/Header.svelte` | Logo, 3 tab buttons, stat chips, settings gear | Decomposed from index.html header |
| `frontend/src/components/layout/Sidebar.svelte` | Workspace list + session list | Decomposed from index.html sidebar |
| `frontend/src/components/layout/MobileTabBar.svelte` | Bottom tab bar (3 tabs) for mobile | Decomposed from index.html mobile bar |
| `frontend/src/components/layout/Toast.svelte` | Notification toasts | Extracted from CWMApp toast system |
| `frontend/src/components/auth/LoginForm.svelte` | Login screen | Extracted from index.html login panel |
| `frontend/src/components/terminal/TerminalGrid.svelte` | Terminal layout grid container | Extracted from CWMApp terminal grid mgmt |
| `frontend/src/components/terminal/TerminalPane.svelte` | Individual xterm.js pane with WebSocket | Wraps existing TerminalPane class logic |
| `frontend/src/components/terminal/TerminalTabs.svelte` | Tab bar for terminal groups | Extracted from CWMApp group tabs |
| `frontend/src/components/board/BoardPanel.svelte` | Board view container with toolbar | Decomposed from BoardView |
| `frontend/src/components/board/KanbanColumn.svelte` | Single kanban column | Decomposed from BoardView.renderBoard() |
| `frontend/src/components/board/FeatureCard.svelte` | Draggable feature card | Decomposed from BoardView.renderCard() |
| `frontend/src/components/board/DependencyView.svelte` | Wave visualization | Decomposed from BoardView.renderDependencies() |
| `frontend/src/components/board/FeatureDialog.svelte` | Create/edit feature modal | Decomposed from BoardView.createFeature() |
| `frontend/src/components/resources/ResourcesPanel.svelte` | System metrics display | Extracted from CWMApp.loadResources() |
| `frontend/src/components/shared/Modal.svelte` | Reusable modal | Replaces CWMApp.showModal() |
| `frontend/src/components/shared/ContextMenu.svelte` | Right-click context menu | Extracted from CWMApp.showContextMenu() |
| `frontend/src/components/shared/QuickSwitcher.svelte` | Ctrl+K quick switcher | Extracted from CWMApp quick switcher |
| `frontend/src/components/shared/ConfirmDialog.svelte` | Confirmation dialog | Extracted from CWMApp.showConfirmModal() |
| `frontend/package.json` | Frontend-specific dependencies | Separate from backend |

## Key Decisions

### 1. Standalone Vite + Proxy (not middleware mode)
**Chosen over:** Vite middleware mode embedded in Express.
**Why:** server.js (5048 lines) is complex with SSE, WebSocket upgrade handling, and PTY management. Embedding Vite as middleware would couple build tooling with the production server and complicate the upgrade path. Standalone Vite dev + proxy gives clean separation — dev on :5173, backend on :3456, proxy everything. Verified Vite supports WebSocket proxy natively (Context7: `/vitejs/vite` — `server.proxy` with `ws: true`).
**Cite:** `src/web/server.js:5019-5021` (WebSocket upgrade), `src/web/pty-server.js:44` (upgrade handler on `/ws/terminal`).

### 2. Svelte 5 runes ($state, $derived, $effect) for component state, module-level stores for shared state
**Chosen over:** Svelte 4 stores only, or global reactive context.
**Why:** Svelte 5 runes provide explicit reactivity (Context7: `/websites/svelte_dev_svelte` — `$state`, `$derived`, `$effect`). For shared state (auth token, workspace list, session list), we use `.svelte.js` module files with exported `$state` objects — these are reactive across components without the ceremony of writable/readable stores.
**Cite:** app.js:96-132 (CWMApp.state with 16 localStorage keys) → decomposed into 6 purpose-built stores.

### 3. CSS custom properties preserved, Tailwind references them via @theme
**Chosen over:** Converting all 13 themes to Tailwind config, or dropping themes.
**Why:** The theme system uses `:root[data-theme="..."]` selectors with ~30 CSS custom properties each (styles.css:21-80 for Mocha, then overrides at lines 4381, 4509, 4574, 4638, 4697, 4756, 4815, 5527, 5569, 5611, 5653, 5695). Converting 13x30=390 variable definitions to Tailwind config is error-prone. Instead, keep the CSS variable definitions and let Tailwind reference them: `@theme { --color-base: var(--base); }` so `bg-base` works as a utility.
**Cite:** `styles.css:21-80` (Mocha variables), `styles.css:4381+` (12 theme overrides), `app.js:2146-2167` (setTheme method).

### 4. xterm.js via npm imports (not vendor-bundled)
**Chosen over:** Keeping vendor/ directory with manual script tags.
**Why:** Vite handles npm imports natively with tree-shaking and proper bundling. The current vendor-bundled approach (index.html:748-750) using global `window.Terminal`, `window.FitAddon`, `window.WebLinksAddon` is incompatible with Svelte's module system. npm imports (`import { Terminal } from '@xterm/xterm'`) work with Vite's dev server and production builds.
**Cite:** `index.html:748-750` (script tags), `terminal.js:1` (uses `new Terminal()` as global), `package.json:56-58` (already in devDependencies).

### 5. Build output replaces src/web/public/ contents
**Chosen over:** Separate dist/ directory requiring server.js changes.
**Why:** Express serves `express.static(path.join(__dirname, 'public'))` (server.js:136). Having Vite build to `src/web/public/` means zero backend changes. The old vanilla files are git-tracked and get replaced by the build output. In development, Vite serves directly.
**Cite:** `src/web/server.js:136` (static middleware).

### 6. No SvelteKit — standalone Svelte + Vite
**Chosen over:** SvelteKit with file-based routing.
**Why:** This is a single-page application that talks to an Express API. There's no SSR, no file-based routing, no form actions. SvelteKit would add unnecessary complexity. Standalone Svelte with `@sveltejs/vite-plugin-svelte` is the right fit.
**Cite:** All routing is client-side tab switching (app.js:1047 `setViewMode()`), not URL-based.

### 7. Tailwind CSS v4 with @tailwindcss/vite plugin
**Chosen over:** Tailwind v3 with PostCSS, or keeping vanilla CSS.
**Why:** Tailwind v4 has a dedicated Vite plugin (`@tailwindcss/vite`) that's faster than PostCSS. Configuration is CSS-first (`@import "tailwindcss"` + `@theme {}`) — no `tailwind.config.js` needed. Perfect fit for our CSS custom property theme system.
**Cite:** Context7 docs for Tailwind v4 + Vite integration.

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| xterm.js integration with Svelte lifecycle | Medium | TerminalPane.svelte uses `onMount`/`onDestroy` to manage xterm instances. Wrap existing TerminalPane class logic rather than rewriting from scratch. Test terminal resize, reconnect, and multi-pane layouts early. |
| Theme CSS size (13 themes x 30 variables) | Low | Keep theme definitions in a dedicated `themes.css` file imported by app.css. Tailwind purges unused utilities but custom properties are always included. This is the same size as current — no regression. |
| WebSocket proxy during Vite dev | Low | Vite natively supports WebSocket proxy (`ws: true` in proxy config). Verified in Context7 docs. SSE proxying also works (standard HTTP streaming). |
| Drag-and-drop complexity (terminal panes + kanban cards) | Medium | Port existing drag-and-drop logic to Svelte actions (`use:draggable`). Test thoroughly. Terminal pane drag-and-drop is the most complex (~200 lines in app.js). |
| Build output size vs vanilla | Low | Vite's tree-shaking + code splitting will likely produce smaller output than the current monolith. xterm.js is the largest dependency either way. |
| Parallel dev workflow (old public/ vs new frontend/) | Medium | During migration, Express serves old files. Devs use `npm run dev` (Vite) for new UI. Once migration is complete, `npm run build` replaces public/ contents. Keep old files in `.backup/` until verified. |
| 16 localStorage keys need coordinated migration | Low | New stores read from same localStorage keys (cwm_token, cwm_theme, cwm_settings, etc.). Forward-compatible — new app reads old data seamlessly. |

## Component Dependency Graph

```
App.svelte
├── LoginForm.svelte (shown when not authenticated)
└── (authenticated layout)
    ├── Header.svelte
    │   ├── Tab buttons (Terminal / Board / Resources)
    │   └── Stat chips (sessions, cost)
    ├── Sidebar.svelte
    │   ├── Workspace list
    │   └── Session list
    ├── TerminalGrid.svelte (tab: terminal)
    │   ├── TerminalTabs.svelte
    │   └── TerminalPane.svelte (multiple)
    ├── BoardPanel.svelte (tab: board)
    │   ├── KanbanColumn.svelte (x5)
    │   │   └── FeatureCard.svelte (multiple)
    │   ├── DependencyView.svelte
    │   └── FeatureDialog.svelte
    ├── ResourcesPanel.svelte (tab: resources)
    ├── MobileTabBar.svelte
    ├── Toast.svelte
    ├── ContextMenu.svelte
    ├── QuickSwitcher.svelte
    ├── Modal.svelte
    └── ConfirmDialog.svelte
```

## Store Architecture

```
auth.js         → token, isAuthenticated, login(), logout(), checkAuth()
workspaces.js   → workspaces[], activeWorkspace, create/update/delete/switch
sessions.js     → sessions[], create/destroy/start/stop, hiddenSessions
settings.js     → theme, uiScale, preferences, sidebarWidth
board.js        → features[], filteredFeatures, CRUD, dragDrop status changes
terminal.js     → panes Map, groups, activeGroup, spawn/kill/resize
```

## Migration Order (Waves)

1. **Wave 1 — Scaffolding:** `frontend/` setup, vite.config.js, package.json, app.css with themes
2. **Wave 2 — Core:** API client, SSE manager, auth store, settings store
3. **Wave 3 — Layout:** App.svelte, Header, Sidebar, LoginForm, Toast, MobileTabBar
4. **Wave 4 — Terminal:** TerminalGrid, TerminalPane, TerminalTabs (most complex)
5. **Wave 5 — Board:** BoardPanel, KanbanColumn, FeatureCard, DependencyView, FeatureDialog
6. **Wave 6 — Polish:** Resources, ContextMenu, QuickSwitcher, Modal, ConfirmDialog, keyboard shortcuts
7. **Wave 7 — Integration:** Build pipeline, replace public/, E2E testing
