/**
 * Auth store — manages authentication token and login/logout.
 * Uses Svelte 5 runes for reactive state.
 */

const STORAGE_KEY = 'cwm_token';

function createAuth() {
  let token = $state(localStorage.getItem(STORAGE_KEY) || null);
  let isAuthenticated = $derived(!!token);

  return {
    get token() { return token; },
    get isAuthenticated() { return isAuthenticated; },

    /**
     * Log in with password.
     * @param {string} password
     * @returns {Promise<boolean>} Success
     */
    async login(password) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        token = data.token;
        localStorage.setItem(STORAGE_KEY, token);
        return true;
      }
      return false;
    },

    /**
     * Log out — clear token.
     */
    logout() {
      const oldToken = token;
      token = null;
      localStorage.removeItem(STORAGE_KEY);
      // Fire and forget server-side logout
      if (oldToken) {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${oldToken}` },
        }).catch(() => {});
      }
    },

    /**
     * Check if current token is still valid.
     * @returns {Promise<boolean>}
     */
    async check() {
      if (!token) return false;
      try {
        const res = await fetch('/api/auth/check', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.authenticated) {
          token = null;
          localStorage.removeItem(STORAGE_KEY);
          return false;
        }
        return true;
      } catch {
        return false;
      }
    },

    /**
     * Set token directly (e.g. from SSE reconnection).
     * @param {string|null} newToken
     */
    setToken(newToken) {
      token = newToken;
      if (newToken) {
        localStorage.setItem(STORAGE_KEY, newToken);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
  };
}

export const auth = createAuth();
