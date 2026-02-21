/**
 * HTTP API client for Myrlin backend.
 * Wraps fetch with auth token injection and error handling.
 */

import { auth } from './stores/auth.svelte.js';

const BASE = '';  // Same origin in production; proxied in dev

/**
 * Make an authenticated API request.
 * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} method
 * @param {string} path - API path (e.g. '/api/workspaces')
 * @param {object} [body] - Request body (auto-serialized to JSON)
 * @returns {Promise<any>} Parsed JSON response
 */
export async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = auth.token;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const opts = { method, headers };
  if (body !== undefined && method !== 'GET') {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${path}`, opts);

  if (res.status === 401) {
    auth.logout();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  return res.json();
}
