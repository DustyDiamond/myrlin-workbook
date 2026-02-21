#!/usr/bin/env node
/**
 * Myrlin Workspace MCP Server
 *
 * Gives Claude Code sessions access to Myrlin Workbook's REST API —
 * workspaces, docs, kanban features, sessions, cost tracking, and stats.
 * Exposes 12 tools over JSON-RPC 2.0 / stdio (MCP protocol).
 *
 * Environment:
 *   CWM_HOST=localhost     Override API host
 *   CWM_PORT=3456          Override API port
 *   CWM_PROTOCOL=https     Override protocol (https or http)
 *   CWM_PASSWORD=...       Override auth password
 *
 * Password is loaded from (in priority order):
 *   1. CWM_PASSWORD environment variable
 *   2. ~/.myrlin/config.json
 *   3. ./state/config.json (relative to project root)
 *
 * Part of Myrlin Workbook (claude-workspace-manager).
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const readline = require('readline');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── Configuration ────────────────────────────────────────

const CWM_HOST = process.env.CWM_HOST || 'localhost';
const CWM_PORT = parseInt(process.env.CWM_PORT, 10) || 3456;
// Default to http unless CWM_PROTOCOL or CWM_SSL_CERT is set.
// The server (gui.js) only uses HTTPS when CWM_SSL_CERT + CWM_SSL_KEY are provided.
const CWM_PROTOCOL = process.env.CWM_PROTOCOL || (process.env.CWM_SSL_CERT ? 'https' : 'http');

const HOME_CONFIG_FILE = path.join(os.homedir(), '.myrlin', 'config.json');
const LOCAL_CONFIG_FILE = path.join(__dirname, '..', '..', 'state', 'config.json');

/** Server metadata returned during MCP initialize handshake. */
const SERVER_INFO = {
  name: 'myrlin',
  version: '1.0.0',
};

/** MCP protocol version we support. */
const PROTOCOL_VERSION = '2024-11-05';

// ─── Auth ─────────────────────────────────────────────────

/** @type {string|null} Cached bearer token. */
let _authToken = null;

/**
 * Load the Myrlin password from env, ~/.myrlin/config.json, or ./state/config.json.
 * @returns {string|null} Password or null if not found.
 */
function loadPassword() {
  // 1. Environment variable (highest priority)
  if (process.env.CWM_PASSWORD) {
    return process.env.CWM_PASSWORD;
  }

  // 2. Home directory config
  try {
    if (fs.existsSync(HOME_CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(HOME_CONFIG_FILE, 'utf-8'));
      if (config.password && typeof config.password === 'string') {
        return config.password;
      }
    }
  } catch (_) {}

  // 3. Local project config
  try {
    if (fs.existsSync(LOCAL_CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(LOCAL_CONFIG_FILE, 'utf-8'));
      if (config.password && typeof config.password === 'string') {
        return config.password;
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Authenticate with Myrlin and cache the bearer token.
 * @returns {Promise<string>} Bearer token.
 */
async function ensureAuth() {
  if (_authToken) return _authToken;

  const password = loadPassword();
  if (!password) {
    throw new Error(
      'No Myrlin password found. Set CWM_PASSWORD env var or ensure ~/.myrlin/config.json exists.'
    );
  }

  const data = JSON.stringify({ password });
  const response = await rawRequest('POST', '/api/auth/login', data, null);

  if (!response.success || !response.token) {
    throw new Error(`Auth failed: ${response.error || 'Unknown error'}`);
  }

  _authToken = response.token;
  return _authToken;
}

// ─── HTTP Client ──────────────────────────────────────────

/**
 * Make a raw HTTP(S) request to the Myrlin API.
 * @param {string} method - HTTP method.
 * @param {string} urlPath - API path (e.g. /api/stats).
 * @param {string|null} body - JSON body string or null.
 * @param {string|null} token - Bearer token or null.
 * @returns {Promise<object>} Parsed JSON response.
 */
function rawRequest(method, urlPath, body, token) {
  return new Promise((resolve, reject) => {
    const mod = CWM_PROTOCOL === 'https' ? https : http;
    const options = {
      hostname: CWM_HOST,
      port: CWM_PORT,
      path: urlPath,
      method,
      headers: { 'Content-Type': 'application/json' },
      rejectUnauthorized: false, // Self-signed cert on localhost
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = mod.request(options, (res) => {
      let chunks = '';
      res.on('data', (d) => (chunks += d));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(chunks);
          parsed._statusCode = res.statusCode;
          resolve(parsed);
        } catch {
          resolve({ _statusCode: res.statusCode, _raw: chunks });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

/**
 * Authenticated API request with automatic 401 retry (re-auth).
 * @param {string} method - HTTP method.
 * @param {string} urlPath - API path.
 * @param {object|null} body - Request body (will be JSON-stringified).
 * @returns {Promise<object>} Parsed JSON response.
 */
async function apiRequest(method, urlPath, body) {
  const token = await ensureAuth();
  const bodyStr = body ? JSON.stringify(body) : null;
  let response = await rawRequest(method, urlPath, bodyStr, token);

  // On 401, clear token, re-auth, retry once
  if (response._statusCode === 401) {
    _authToken = null;
    const newToken = await ensureAuth();
    response = await rawRequest(method, urlPath, bodyStr, newToken);
  }

  // Remove internal status code before returning
  const statusCode = response._statusCode;
  delete response._statusCode;
  delete response._raw;

  // Throw on error status codes
  if (statusCode >= 400) {
    throw new Error(response.error || response.message || `HTTP ${statusCode}`);
  }

  return response;
}

// ─── Helpers ──────────────────────────────────────────────

/**
 * Resolve a workspace ID — use provided value or fall back to active workspace.
 * @param {string|undefined} workspaceId - Optional workspace ID.
 * @returns {Promise<string>} Resolved workspace ID.
 */
async function resolveWorkspaceId(workspaceId) {
  if (workspaceId) return workspaceId;

  const stats = await apiRequest('GET', '/api/stats');
  if (stats.activeWorkspace && stats.activeWorkspace.id) {
    return stats.activeWorkspace.id;
  }

  throw new Error('No workspaceId provided and no active workspace set in Myrlin.');
}

/**
 * Format a successful MCP tool response.
 * @param {*} data - Data to return.
 * @returns {object} MCP content array.
 */
function ok(data) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Format an error MCP tool response.
 * @param {string} message - Error message.
 * @returns {object} MCP content array with isError flag.
 */
function err(message) {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

// ─── Tool Definitions ─────────────────────────────────────

const TOOLS = [
  {
    name: 'get_workspace_info',
    description:
      'Get details for a specific workspace or the active workspace. Returns name, description, color, session list, and creation date.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: {
          type: 'string',
          description: 'Workspace ID. Omit to use the active workspace.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'list_workspaces',
    description:
      'List all workspaces with their IDs, names, descriptions, and session counts.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'get_workspace_docs',
    description:
      'Read workspace documentation: notes, goals, tasks, roadmap items, and rules. Each section is an array of items with text, done/status, and index.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: {
          type: 'string',
          description: 'Workspace ID. Omit to use the active workspace.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'add_doc_item',
    description:
      'Add an item to a workspace docs section (notes, goals, tasks, roadmap, or rules). For roadmap items, you can also pass a status (planned, in-progress, done).',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: {
          type: 'string',
          description: 'Workspace ID. Omit to use the active workspace.',
        },
        section: {
          type: 'string',
          enum: ['notes', 'goals', 'tasks', 'roadmap', 'rules'],
          description: 'Which section to add the item to.',
        },
        text: {
          type: 'string',
          description: 'The item text to add.',
        },
        status: {
          type: 'string',
          description: 'For roadmap items only: planned, in-progress, or done. Defaults to planned.',
        },
      },
      required: ['section', 'text'],
      additionalProperties: false,
    },
  },
  {
    name: 'toggle_doc_item',
    description:
      'Toggle a task or goal as done/undone, or cycle a roadmap item\'s status (planned → in-progress → done → planned).',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: {
          type: 'string',
          description: 'Workspace ID. Omit to use the active workspace.',
        },
        section: {
          type: 'string',
          enum: ['goals', 'tasks', 'roadmap'],
          description: 'Section containing the item.',
        },
        index: {
          type: 'number',
          description: 'Zero-based index of the item to toggle.',
        },
      },
      required: ['section', 'index'],
      additionalProperties: false,
    },
  },
  {
    name: 'remove_doc_item',
    description:
      'Remove an item from a workspace docs section by index.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: {
          type: 'string',
          description: 'Workspace ID. Omit to use the active workspace.',
        },
        section: {
          type: 'string',
          enum: ['notes', 'goals', 'tasks', 'roadmap', 'rules'],
          description: 'Section containing the item.',
        },
        index: {
          type: 'number',
          description: 'Zero-based index of the item to remove.',
        },
      },
      required: ['section', 'index'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_features',
    description:
      'List kanban features. If workspaceId is provided, returns features for that workspace. If omitted, returns ALL features across all workspaces (global view) with workspaceName enriched on each feature.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: {
          type: 'string',
          description: 'Workspace ID. Omit to get all features globally.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'create_feature',
    description:
      'Create a new kanban feature in a workspace. Features track work items with status columns (backlog, planned, in-progress, review, done). Supports structured spec fields for pipeline execution.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: {
          type: 'string',
          description: 'Workspace ID. Omit to use the active workspace.',
        },
        name: {
          type: 'string',
          description: 'Feature name/title.',
        },
        description: {
          type: 'string',
          description: 'Optional description of the feature.',
        },
        status: {
          type: 'string',
          enum: ['backlog', 'planned', 'in-progress', 'review', 'done'],
          description: 'Initial status column. Defaults to backlog.',
        },
        priority: {
          type: 'string',
          enum: ['low', 'normal', 'high', 'urgent'],
          description: 'Priority level. Defaults to normal.',
        },
        filesToModify: {
          type: 'array',
          items: { type: 'string' },
          description: 'Exact file paths to modify.',
        },
        filesToCreate: {
          type: 'array',
          items: { type: 'string' },
          description: 'Exact file paths to create.',
        },
        contextFiles: {
          type: 'array',
          items: { type: 'string' },
          description: 'Files to read for context (not modify).',
        },
        acceptanceCriteria: {
          type: 'array',
          items: { type: 'string' },
          description: 'Testable conditions defining "done".',
        },
        dependsOn: {
          type: 'array',
          items: { type: 'string' },
          description: 'Feature IDs this depends on.',
        },
        complexity: {
          type: 'string',
          enum: ['simple', 'medium', 'complex'],
          description: 'Task complexity. Auto-detected if omitted.',
        },
        wave: {
          type: 'number',
          description: 'Execution wave number.',
        },
        specDocument: {
          type: 'string',
          description: 'Path to detailed markdown spec file.',
        },
        maxRetries: {
          type: 'number',
          description: 'Max retry count before escalation. Defaults to 3.',
        },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
  {
    name: 'update_feature',
    description:
      'Update a kanban feature — move between columns, change name/description/priority, update spec fields. Pass only the fields you want to change.',
    inputSchema: {
      type: 'object',
      properties: {
        featureId: {
          type: 'string',
          description: 'Feature ID to update.',
        },
        name: {
          type: 'string',
          description: 'New name.',
        },
        description: {
          type: 'string',
          description: 'New description.',
        },
        status: {
          type: 'string',
          enum: ['backlog', 'planned', 'in-progress', 'review', 'done'],
          description: 'Move to this status column.',
        },
        priority: {
          type: 'string',
          enum: ['low', 'normal', 'high', 'urgent'],
          description: 'New priority level.',
        },
        filesToModify: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated file paths to modify.',
        },
        filesToCreate: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated file paths to create.',
        },
        contextFiles: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated context files.',
        },
        acceptanceCriteria: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated acceptance criteria.',
        },
        dependsOn: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated dependency feature IDs.',
        },
        complexity: {
          type: 'string',
          enum: ['simple', 'medium', 'complex'],
          description: 'Updated complexity.',
        },
        wave: {
          type: 'number',
          description: 'Updated wave number.',
        },
        specDocument: {
          type: 'string',
          description: 'Updated spec document path.',
        },
        reviewNotes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated review notes (accumulated failure reasons).',
        },
        attempts: {
          type: 'number',
          description: 'Updated attempt count.',
        },
        maxRetries: {
          type: 'number',
          description: 'Updated max retries.',
        },
      },
      required: ['featureId'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_execution_plan',
    description:
      'Get the execution plan for a workspace. Returns features topologically sorted into waves by dependency graph, with circular dependency detection. Filters by status (default: planned).',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: {
          type: 'string',
          description: 'Workspace ID. Omit to use the active workspace.',
        },
        status: {
          type: 'string',
          enum: ['backlog', 'planned', 'in-progress', 'review', 'done'],
          description: 'Filter features by status. Defaults to planned.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'list_sessions',
    description:
      'List sessions for a workspace. Shows session IDs, names, status (running/stopped), working directories, and topics. Useful for conflict awareness — see what other sessions are working on.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: {
          type: 'string',
          description: 'Workspace ID. Omit to use the active workspace.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_workspace_cost',
    description:
      'Get token usage and cost breakdown for a workspace. Shows input/output/cache tokens, cost in dollars, model breakdown, and session count.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: {
          type: 'string',
          description: 'Workspace ID. Omit to use the active workspace.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_stats',
    description:
      'Get global Myrlin overview: total workspaces, total sessions, running sessions count, and active workspace info.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
];

// ─── Validation Helpers ──────────────────────────────────

const VALID_SECTIONS = ['notes', 'goals', 'tasks', 'roadmap', 'rules'];
const VALID_TOGGLE_SECTIONS = ['goals', 'tasks', 'roadmap'];
const VALID_STATUSES = ['backlog', 'planned', 'in-progress', 'review', 'done'];
const VALID_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const VALID_COMPLEXITIES = ['simple', 'medium', 'complex'];

function requireString(args, field) {
  if (typeof args[field] !== 'string' || !args[field].trim()) {
    throw new Error(`${field} must be a non-empty string`);
  }
}

function requireNumber(args, field) {
  if (typeof args[field] !== 'number' || !Number.isFinite(args[field])) {
    throw new Error(`${field} must be a number`);
  }
}

function validateEnum(args, field, allowed) {
  if (args[field] !== undefined && !allowed.includes(args[field])) {
    throw new Error(`${field} must be one of: ${allowed.join(', ')}`);
  }
}

function validateArray(args, field) {
  if (args[field] !== undefined && !Array.isArray(args[field])) {
    throw new Error(`${field} must be an array`);
  }
}

// ─── Tool Handlers ────────────────────────────────────────

async function handleGetWorkspaceInfo(args) {
  const id = await resolveWorkspaceId(args.workspaceId);
  const data = await apiRequest('GET', `/api/workspaces/${encodeURIComponent(id)}`);
  return ok(data);
}

async function handleListWorkspaces() {
  const data = await apiRequest('GET', '/api/workspaces');
  return ok(data);
}

async function handleGetWorkspaceDocs(args) {
  const id = await resolveWorkspaceId(args.workspaceId);
  const data = await apiRequest('GET', `/api/workspaces/${encodeURIComponent(id)}/docs`);
  return ok(data);
}

async function handleAddDocItem(args) {
  requireString(args, 'section');
  requireString(args, 'text');
  validateEnum(args, 'section', VALID_SECTIONS);
  const id = await resolveWorkspaceId(args.workspaceId);
  const { section, text, status } = args;

  const body = { text };
  if (section === 'roadmap' && status) {
    body.status = status;
  }

  const data = await apiRequest(
    'POST',
    `/api/workspaces/${encodeURIComponent(id)}/docs/${encodeURIComponent(section)}`,
    body
  );
  return ok(data);
}

async function handleToggleDocItem(args) {
  requireString(args, 'section');
  requireNumber(args, 'index');
  validateEnum(args, 'section', VALID_TOGGLE_SECTIONS);
  const id = await resolveWorkspaceId(args.workspaceId);
  const { section, index } = args;
  const data = await apiRequest(
    'PUT',
    `/api/workspaces/${encodeURIComponent(id)}/docs/${encodeURIComponent(section)}/${index}`
  );
  return ok(data);
}

async function handleRemoveDocItem(args) {
  requireString(args, 'section');
  requireNumber(args, 'index');
  validateEnum(args, 'section', VALID_SECTIONS);
  const id = await resolveWorkspaceId(args.workspaceId);
  const { section, index } = args;
  const data = await apiRequest(
    'DELETE',
    `/api/workspaces/${encodeURIComponent(id)}/docs/${encodeURIComponent(section)}/${index}`
  );
  return ok(data);
}

async function handleListFeatures(args) {
  if (args.workspaceId) {
    const data = await apiRequest('GET', `/api/workspaces/${encodeURIComponent(args.workspaceId)}/features`);
    return ok(data);
  }
  // No workspaceId — return global feature list
  const data = await apiRequest('GET', '/api/features');
  return ok(data);
}

async function handleCreateFeature(args) {
  requireString(args, 'name');
  validateEnum(args, 'status', VALID_STATUSES);
  validateEnum(args, 'priority', VALID_PRIORITIES);
  validateEnum(args, 'complexity', VALID_COMPLEXITIES);
  validateArray(args, 'filesToModify');
  validateArray(args, 'filesToCreate');
  validateArray(args, 'contextFiles');
  validateArray(args, 'acceptanceCriteria');
  validateArray(args, 'dependsOn');
  const id = await resolveWorkspaceId(args.workspaceId);
  const {
    name, description, status, priority,
    filesToModify, filesToCreate, contextFiles, acceptanceCriteria,
    dependsOn, complexity, wave, specDocument, maxRetries,
  } = args;
  const body = { name };
  if (description) body.description = description;
  if (status) body.status = status;
  if (priority) body.priority = priority;
  if (filesToModify) body.filesToModify = filesToModify;
  if (filesToCreate) body.filesToCreate = filesToCreate;
  if (contextFiles) body.contextFiles = contextFiles;
  if (acceptanceCriteria) body.acceptanceCriteria = acceptanceCriteria;
  if (dependsOn) body.dependsOn = dependsOn;
  if (complexity) body.complexity = complexity;
  if (wave !== undefined && wave !== null) body.wave = wave;
  if (specDocument) body.specDocument = specDocument;
  if (maxRetries !== undefined) body.maxRetries = maxRetries;

  const data = await apiRequest(
    'POST',
    `/api/workspaces/${encodeURIComponent(id)}/features`,
    body
  );
  return ok(data);
}

async function handleUpdateFeature(args) {
  requireString(args, 'featureId');
  validateEnum(args, 'status', VALID_STATUSES);
  validateEnum(args, 'priority', VALID_PRIORITIES);
  validateEnum(args, 'complexity', VALID_COMPLEXITIES);
  validateArray(args, 'filesToModify');
  validateArray(args, 'filesToCreate');
  validateArray(args, 'contextFiles');
  validateArray(args, 'acceptanceCriteria');
  validateArray(args, 'dependsOn');
  validateArray(args, 'reviewNotes');
  const { featureId, ...fields } = args;
  const body = {};
  if (fields.name) body.name = fields.name;
  if (fields.description !== undefined) body.description = fields.description;
  if (fields.status) body.status = fields.status;
  if (fields.priority) body.priority = fields.priority;
  if (fields.filesToModify) body.filesToModify = fields.filesToModify;
  if (fields.filesToCreate) body.filesToCreate = fields.filesToCreate;
  if (fields.contextFiles) body.contextFiles = fields.contextFiles;
  if (fields.acceptanceCriteria) body.acceptanceCriteria = fields.acceptanceCriteria;
  if (fields.dependsOn) body.dependsOn = fields.dependsOn;
  if (fields.complexity) body.complexity = fields.complexity;
  if (fields.wave !== undefined) body.wave = fields.wave;
  if (fields.specDocument !== undefined) body.specDocument = fields.specDocument;
  if (fields.reviewNotes) body.reviewNotes = fields.reviewNotes;
  if (fields.attempts !== undefined) body.attempts = fields.attempts;
  if (fields.maxRetries !== undefined) body.maxRetries = fields.maxRetries;

  const data = await apiRequest(
    'PUT',
    `/api/features/${encodeURIComponent(featureId)}`,
    body
  );
  return ok(data);
}

async function handleGetExecutionPlan(args) {
  const id = await resolveWorkspaceId(args.workspaceId);
  const status = args.status || 'planned';
  const data = await apiRequest(
    'GET',
    `/api/workspaces/${encodeURIComponent(id)}/execution-plan?status=${encodeURIComponent(status)}`
  );
  return ok(data);
}

async function handleListSessions(args) {
  const id = await resolveWorkspaceId(args.workspaceId);
  const data = await apiRequest(
    'GET',
    `/api/sessions?mode=workspace&workspaceId=${encodeURIComponent(id)}`
  );
  return ok(data);
}

async function handleGetWorkspaceCost(args) {
  const id = await resolveWorkspaceId(args.workspaceId);
  const data = await apiRequest('GET', `/api/workspaces/${encodeURIComponent(id)}/cost`);
  return ok(data);
}

async function handleGetStats() {
  const data = await apiRequest('GET', '/api/stats');
  return ok(data);
}

/**
 * Route a tool call to the appropriate handler.
 * @param {string} name - Tool name.
 * @param {object} args - Tool arguments.
 * @returns {Promise<object>} MCP tool result.
 */
async function handleToolCall(name, args) {
  switch (name) {
    case 'get_workspace_info':
      return handleGetWorkspaceInfo(args);
    case 'list_workspaces':
      return handleListWorkspaces();
    case 'get_workspace_docs':
      return handleGetWorkspaceDocs(args);
    case 'add_doc_item':
      return handleAddDocItem(args);
    case 'toggle_doc_item':
      return handleToggleDocItem(args);
    case 'remove_doc_item':
      return handleRemoveDocItem(args);
    case 'list_features':
      return handleListFeatures(args);
    case 'create_feature':
      return handleCreateFeature(args);
    case 'update_feature':
      return handleUpdateFeature(args);
    case 'get_execution_plan':
      return handleGetExecutionPlan(args);
    case 'list_sessions':
      return handleListSessions(args);
    case 'get_workspace_cost':
      return handleGetWorkspaceCost(args);
    case 'get_stats':
      return handleGetStats();
    default:
      return err(`Unknown tool: ${name}`);
  }
}

// ─── JSON-RPC 2.0 Transport ──────────────────────────────

/**
 * Send a JSON-RPC response to stdout.
 * @param {object} msg - JSON-RPC response object.
 */
function sendResponse(msg) {
  const json = JSON.stringify(msg);
  process.stdout.write(json + '\n');
}

/**
 * Handle an incoming JSON-RPC request.
 * Implements the MCP protocol subset: initialize, notifications/initialized,
 * tools/list, tools/call, and ping.
 * @param {object} request - Parsed JSON-RPC request.
 */
async function handleRequest(request) {
  const { id, method, params } = request;

  // Notifications (no id) - acknowledge silently
  if (id === undefined || id === null) {
    return;
  }

  switch (method) {
    case 'initialize':
      sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        },
      });
      break;

    case 'ping':
      sendResponse({ jsonrpc: '2.0', id, result: {} });
      break;

    case 'tools/list':
      sendResponse({
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS },
      });
      break;

    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      try {
        const result = await handleToolCall(toolName, toolArgs);
        sendResponse({ jsonrpc: '2.0', id, result });
      } catch (error) {
        const errMsg = error.code === 'ECONNREFUSED'
          ? `Cannot connect to Myrlin at ${CWM_PROTOCOL}://${CWM_HOST}:${CWM_PORT}. Is Myrlin Workbook running?`
          : `Tool error: ${error.message}`;
        sendResponse({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: errMsg }],
            isError: true,
          },
        });
      }
      break;
    }

    default:
      sendResponse({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      });
  }
}

// ─── Main: stdio readline loop ────────────────────────────

/** Track in-flight requests so we don't exit mid-response. */
let _pendingRequests = 0;
/** True once stdin has closed (EOF received). */
let _stdinClosed = false;

/**
 * Clean up and exit once all pending requests have completed.
 */
function shutdownIfReady() {
  if (_stdinClosed && _pendingRequests === 0) {
    process.exit(0);
  }
}

/**
 * Start the MCP server. Reads JSON-RPC messages from stdin line-by-line,
 * dispatches to handleRequest, and writes responses to stdout.
 */
function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let request;
    try {
      request = JSON.parse(trimmed);
    } catch {
      sendResponse({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' },
      });
      return;
    }

    _pendingRequests++;
    try {
      await handleRequest(request);
    } finally {
      _pendingRequests--;
      shutdownIfReady();
    }
  });

  rl.on('close', () => {
    _stdinClosed = true;
    shutdownIfReady();
  });

  process.stderr.write(`[myrlin] MCP server started. Target: ${CWM_PROTOCOL}://${CWM_HOST}:${CWM_PORT}\n`);
}

main();
