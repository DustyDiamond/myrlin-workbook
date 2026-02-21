/**
 * Settings store — theme, UI scale, user preferences.
 * Reads from localStorage for persistence across sessions.
 */

const SETTINGS_KEY = 'cwm_settings';
const THEME_KEY = 'cwm_theme';

const THEMES = [
  { id: 'mocha', name: 'Catppuccin Mocha', type: 'dark' },
  { id: 'macchiato', name: 'Catppuccin Macchiato', type: 'dark' },
  { id: 'frappe', name: 'Catppuccin Frappé', type: 'dark' },
  { id: 'cherry', name: 'Cherry', type: 'dark' },
  { id: 'ocean', name: 'Ocean', type: 'dark' },
  { id: 'amber', name: 'Amber', type: 'dark' },
  { id: 'mint', name: 'Mint', type: 'dark' },
  { id: 'nord', name: 'Nord', type: 'dark' },
  { id: 'dracula', name: 'Dracula', type: 'dark' },
  { id: 'tokyo-night', name: 'Tokyo Night', type: 'dark' },
  { id: 'latte', name: 'Catppuccin Latte', type: 'light' },
  { id: 'rose-pine-dawn', name: 'Rosé Pine Dawn', type: 'light' },
  { id: 'gruvbox-light', name: 'Gruvbox Light', type: 'light' },
];

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

function createSettings() {
  const saved = loadSettings();
  const initialTheme = localStorage.getItem(THEME_KEY) || 'mocha';
  const initialScale = saved.uiScale || 1;
  let theme = $state(initialTheme);
  let uiScale = $state(initialScale);
  let sidebarWidth = $state(parseInt(localStorage.getItem('cwm_sidebarWidth') || '280', 10));
  let sidebarCollapsed = $state(localStorage.getItem('cwm_sidebarCollapsed') === 'true');

  // Apply theme to DOM on init
  applyTheme(initialTheme);
  applyScale(initialScale);

  function applyTheme(t) {
    if (t === 'mocha') {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = t;
    }
  }

  function applyScale(s) {
    document.documentElement.style.setProperty('--ui-scale', String(s));
  }

  function save() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      uiScale,
    }));
  }

  return {
    themes: THEMES,

    get theme() { return theme; },
    get uiScale() { return uiScale; },
    get sidebarWidth() { return sidebarWidth; },
    get sidebarCollapsed() { return sidebarCollapsed; },

    get isLightTheme() {
      const t = THEMES.find(th => th.id === theme);
      return t ? t.type === 'light' : false;
    },

    setTheme(t) {
      theme = t;
      localStorage.setItem(THEME_KEY, t);
      applyTheme(t);
    },

    cycleTheme() {
      const ids = THEMES.map(t => t.id);
      const idx = ids.indexOf(theme);
      const next = ids[(idx + 1) % ids.length];
      this.setTheme(next);
    },

    setUiScale(s) {
      uiScale = Math.max(0.5, Math.min(2, s));
      applyScale(uiScale);
      save();
    },

    setSidebarWidth(w) {
      sidebarWidth = Math.max(200, Math.min(500, w));
      localStorage.setItem('cwm_sidebarWidth', String(sidebarWidth));
    },

    toggleSidebar() {
      sidebarCollapsed = !sidebarCollapsed;
      localStorage.setItem('cwm_sidebarCollapsed', String(sidebarCollapsed));
    },
  };
}

export const settings = createSettings();
