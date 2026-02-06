/**
 * Theme configuration for Claude Workspace Manager
 * Catppuccin Mocha palette - warm pastels on dark, readable and refined
 * https://github.com/catppuccin/catppuccin
 */

const theme = {
  // ─── Catppuccin Mocha Palette ───────────────────────
  colors: {
    primary: '#cba6f7',      // Mauve - main accent
    primaryDim: '#9876c4',
    accent: '#89b4fa',       // Blue
    accentDim: '#7497d4',

    success: '#a6e3a1',      // Green
    warning: '#f9e2af',      // Yellow
    error: '#f38ba8',        // Red
    info: '#89b4fa',         // Blue

    // Catppuccin surface hierarchy
    bg: '#1e1e2e',           // Base
    surface: '#181825',      // Mantle
    surfaceHover: '#313244', // Surface0
    surfaceActive: '#45475a', // Surface1
    border: '#313244',       // Surface0
    borderFocus: '#585b70',  // Surface2

    // Catppuccin text hierarchy
    text: '#cdd6f4',         // Text
    textSecondary: '#a6adc8', // Subtext0
    textTertiary: '#6c7086', // Overlay0
    textMuted: '#45475a',    // Surface1

    // Extra Catppuccin accents (for variety)
    peach: '#fab387',
    teal: '#94e2d5',
    sky: '#89dceb',
    pink: '#f5c2e7',
    lavender: '#b4befe',
    flamingo: '#f2cdcd',
    rosewater: '#f5e0dc',
    sapphire: '#74c7ec',
    maroon: '#eba0ac',
  },

  // ─── Blessed Style Objects ───────────────────────────
  panel: {
    border: { type: 'line', fg: '#313244' },
    style: {
      fg: '#cdd6f4',
      bg: '#1e1e2e',
      border: { fg: '#313244' },
      label: { fg: '#a6adc8', bold: true },
    },
  },

  panelFocused: {
    border: { type: 'line', fg: '#cba6f7' },
    style: {
      fg: '#cdd6f4',
      bg: '#1e1e2e',
      border: { fg: '#cba6f7' },
      label: { fg: '#cba6f7', bold: true },
    },
  },

  list: {
    style: {
      fg: '#cdd6f4',
      bg: '#1e1e2e',
      selected: {
        fg: '#cdd6f4',
        bg: '#313244',
        bold: true,
      },
      item: {
        fg: '#a6adc8',
        bg: '#1e1e2e',
      },
    },
  },

  listFocused: {
    style: {
      fg: '#cdd6f4',
      bg: '#1e1e2e',
      selected: {
        fg: '#1e1e2e',
        bg: '#cba6f7',
        bold: true,
      },
      item: {
        fg: '#cdd6f4',
        bg: '#1e1e2e',
      },
    },
  },

  statusBar: {
    style: {
      fg: '#a6adc8',
      bg: '#181825',
    },
  },

  notification: {
    info: { fg: '#89b4fa', bg: '#1e1e2e' },
    success: { fg: '#a6e3a1', bg: '#1e1e2e' },
    warning: { fg: '#f9e2af', bg: '#1e1e2e' },
    error: { fg: '#f38ba8', bg: '#1e1e2e' },
  },

  // ─── Status Colors ──────────────────────────────────
  sessionStatus: {
    running: '#a6e3a1',
    stopped: '#6c7086',
    error: '#f38ba8',
    idle: '#f9e2af',
  },

  // ─── Workspace Colors (for visual distinction) ──────
  workspaceColors: ['#cba6f7', '#89b4fa', '#a6e3a1', '#fab387', '#f5c2e7', '#94e2d5'],

  // ─── View Modes ─────────────────────────────────────
  viewModes: {
    workspace: { label: 'Workspace', key: 'w', color: '#cba6f7' },
    all: { label: 'All', key: 'a', color: '#89b4fa' },
    recent: { label: 'Recent', key: 'e', color: '#fab387' },
  },

  // ─── Unicode Characters ─────────────────────────────
  icons: {
    running: '\u25CF',     // ●
    stopped: '\u25CB',     // ○
    error: '\u2717',       // ✗
    idle: '\u25D2',        // ◒
    workspace: '\u25A0',   // ■
    session: '\u2500',     // ─
    arrow: '\u25B8',       // ▸
    arrowDown: '\u25BE',   // ▾
    dot: '\u00B7',         // ·
    bar: '\u2502',         // │
    check: '\u2713',       // ✓
    cross: '\u2717',       // ✗
    ellipsis: '\u2026',    // …
    clock: '\u25F7',       // ◷
    search: '\u2315',      // ⌕
    recent: '\u25F7',      // ◷
    globe: '\u25C9',       // ◉
  },

  // ─── Formatting Helpers ─────────────────────────────
  formatStatus(status) {
    const icon = theme.icons[status] || theme.icons.stopped;
    const color = theme.sessionStatus[status] || theme.sessionStatus.stopped;
    return { icon, color, label: status.charAt(0).toUpperCase() + status.slice(1) };
  },

  formatTimestamp(isoString) {
    if (!isoString) return 'never';
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  },

  truncate(str, maxLen) {
    if (!str) return '';
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 1) + theme.icons.ellipsis;
  },
};

module.exports = theme;
