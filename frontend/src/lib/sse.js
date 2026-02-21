/**
 * Server-Sent Events manager.
 * Connects to /api/events with auth token and dispatches events to handlers.
 */

import { auth } from './stores/auth.svelte.js';

/** @type {EventSource|null} */
let eventSource = null;

/** @type {Map<string, Set<Function>>} */
const listeners = new Map();

/** @type {number|null} */
let reconnectTimer = null;

const RECONNECT_DELAY = 3000;

/**
 * Connect to the SSE endpoint.
 * Automatically called after login.
 */
export function connect() {
  disconnect();

  const token = auth.token;
  if (!token) return;

  eventSource = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);

  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      const type = payload.type;
      const data = payload.data;

      // Dispatch to registered listeners
      const handlers = listeners.get(type);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(data);
          } catch (err) {
            console.error(`SSE handler error for ${type}:`, err);
          }
        }
      }

      // Also dispatch to wildcard listeners
      const wildcardHandlers = listeners.get('*');
      if (wildcardHandlers) {
        for (const handler of wildcardHandlers) {
          try {
            handler(type, data);
          } catch (err) {
            console.error('SSE wildcard handler error:', err);
          }
        }
      }
    } catch (err) {
      console.error('SSE message parse error:', err);
    }
  };

  eventSource.onerror = () => {
    disconnect();
    // Auto-reconnect
    reconnectTimer = setTimeout(() => {
      if (auth.token) connect();
    }, RECONNECT_DELAY);
  };
}

/**
 * Disconnect from the SSE endpoint.
 */
export function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
}

/**
 * Subscribe to an SSE event type.
 * @param {string} type - Event type (e.g. 'session:started') or '*' for all
 * @param {Function} handler - Callback function
 * @returns {Function} Unsubscribe function
 */
export function on(type, handler) {
  if (!listeners.has(type)) {
    listeners.set(type, new Set());
  }
  listeners.get(type).add(handler);

  return () => {
    const handlers = listeners.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) listeners.delete(type);
    }
  };
}

/**
 * Check if SSE is currently connected.
 * @returns {boolean}
 */
export function isConnected() {
  return eventSource !== null && eventSource.readyState === EventSource.OPEN;
}
