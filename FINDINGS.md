# Myrlin Workbook — Findings

> Source: codebase audit of src/web/, src/mcp/, src/state/, test/
> Context: Event-driven task architecture (Phases 1-4) complete. Extended feature fields, review status, get_execution_plan, and store throttling already implemented. Items below are remaining work.

## Bug Fixes [high]

- **Inconsistent error handling in frontend fetch calls** — Most fetch() chains have .catch() handlers, but a few paths (especially in settings and workspace switching) still lack error handling. Audit and fill gaps.
  files: src/web/public/app.js
  criteria: All fetch() calls have error handling; network errors surface in UI; no silent failures on any path
  complexity: simple

- **Silent error suppression in catch blocks** — 10+ locations use catch (_) {} hiding real errors. Add stderr/debug logging for all silent catches.
  files: src/web/pty-manager.js, src/state/store.js
  criteria: All catch blocks log to stderr or debug channel; no empty catch blocks remain
  complexity: simple

## MCP Server Enhancements

- **Add delete_feature MCP tool** — Backend DELETE /api/features/:id endpoint exists but no corresponding MCP tool. Needed for cleanup after pipeline runs.
  files: src/mcp/workspace.js
  context: src/web/server.js
  criteria: delete_feature MCP tool calls existing backend endpoint; returns success/error
  complexity: simple

## Testing

- [high] **E2E API test coverage for feature endpoints** — Feature CRUD endpoints (create, update, delete, list) have no test coverage
  files: test/e2e-api.js
  context: src/web/server.js
  criteria: Tests cover create, read, update, delete features; test status transitions including "review" status
  complexity: medium

- **MCP workspace server test harness** — No automated tests for the 13 MCP tools. Create a test that sends JSON-RPC messages and validates responses.
  files: test/mcp-workspace.js
  create: test/mcp-workspace.js
  context: src/mcp/workspace.js
  criteria: All 13 tools tested via stdio JSON-RPC; tests run in CI
  complexity: medium

- **Frontend test foundation** — 11,106 lines of frontend code with zero tests. Set up Playwright test scaffolding for critical paths.
  files: test/frontend/
  create: test/frontend/workspace.spec.js, test/frontend/kanban.spec.js
  context: src/web/public/app.js, package.json
  criteria: Playwright tests for workspace switching, kanban drag-and-drop, session launch; tests pass in CI
  complexity: complex

## State & Data Layer

- **Generalize schema migration system** — store.js has feature-specific migration logic (v1→v2 for feature fields) but no generalized migration framework. Future schema changes will need a repeatable pattern.
  files: src/state/store.js
  criteria: Migration system handles arbitrary version bumps; each migration is a named function; existing data preserved on upgrade
  complexity: medium

## Frontend Quality

- **Audit innerHTML for user-input paths** — Most innerHTML assignments use escapeHtml() or insert static content, but a targeted audit should confirm no user-controlled data reaches innerHTML unescaped. Focus on feature names, session names, and workspace names.
  files: src/web/public/app.js
  criteria: Confirm all user-input paths through innerHTML use escapeHtml(); document any safe static paths that don't need it
  complexity: simple

- **System dark mode detection** — Themes hardcoded with no prefers-color-scheme detection on first load
  files: src/web/public/app.js
  criteria: First visit respects OS dark mode preference; user override persists in localStorage
  complexity: simple

- **Scrollback replay chunking** — 100KB scrollback sent at once on reconnect. Implement chunked replay for slow connections.
  files: src/web/pty-manager.js
  criteria: Scrollback replayed in chunks with configurable size; no visible delay on fast connections
  complexity: medium

## CI & Operations

- **Add Node 22 to CI test matrix** — Currently only tests Node 18 and 20. package.json says >=18.
  files: .github/workflows/ci.yml
  criteria: CI matrix includes Node 22; all tests pass on 22
  complexity: simple

- **Configure Dependabot** — No automated dependency updates. node-pty, ws, express all have regular security patches.
  create: .github/dependabot.yml
  criteria: Dependabot creates PRs for outdated dependencies weekly
  complexity: simple

## Documentation [low]

- [low] **Architecture overview with Mermaid diagram** — No visual overview of how PTY manager, store, API server, MCP servers, and frontend interact
  create: docs/architecture.md
  context: src/web/server.js, src/web/pty-manager.js, src/state/store.js, src/mcp/workspace.js
  criteria: Single-page architecture doc with Mermaid component diagram; covers data flow from browser to PTY
  complexity: simple

- [low] **API endpoint reference** — 80+ endpoints in server.js with JSDoc comments but no standalone reference doc
  create: docs/api-reference.md
  context: src/web/server.js
  criteria: All API endpoints listed with method, path, auth requirement, request/response shape
  complexity: medium

- [low] **MCP tool usage examples** — 13 MCP tools defined but no usage examples for Claude Code sessions
  create: docs/mcp-tools.md
  context: src/mcp/workspace.js
  criteria: Each tool has example invocation showing arguments and response
  complexity: simple
