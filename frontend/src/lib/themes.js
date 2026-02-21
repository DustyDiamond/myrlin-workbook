/**
 * xterm.js theme objects for all 13 Myrlin themes.
 * These map to the CSS data-theme attributes.
 *
 * BUG FIX: The original terminal.js was missing xterm themes for
 * Nord, Dracula, Tokyo Night, Rose Pine Dawn, and Gruvbox Light.
 * Those themes fell back to Mocha colors in the terminal.
 */

export const xtermThemes = {
  mocha: {
    background: '#1e1e2e', foreground: '#cdd6f4',
    cursor: '#f5e0dc', cursorAccent: '#1e1e2e',
    selectionBackground: 'rgba(203, 166, 247, 0.25)', selectionForeground: '#cdd6f4',
    black: '#45475a', red: '#f38ba8', green: '#a6e3a1', yellow: '#f9e2af',
    blue: '#89b4fa', magenta: '#cba6f7', cyan: '#94e2d5', white: '#bac2de',
    brightBlack: '#585b70', brightRed: '#f38ba8', brightGreen: '#a6e3a1', brightYellow: '#f9e2af',
    brightBlue: '#89b4fa', brightMagenta: '#cba6f7', brightCyan: '#94e2d5', brightWhite: '#a6adc8',
  },
  latte: {
    background: '#eff1f5', foreground: '#4c4f69',
    cursor: '#dc8a78', cursorAccent: '#eff1f5',
    selectionBackground: 'rgba(136, 57, 239, 0.2)', selectionForeground: '#4c4f69',
    black: '#5c5f77', red: '#d20f39', green: '#40a02b', yellow: '#df8e1d',
    blue: '#1e66f5', magenta: '#8839ef', cyan: '#179299', white: '#acb0be',
    brightBlack: '#6c6f85', brightRed: '#d20f39', brightGreen: '#40a02b', brightYellow: '#df8e1d',
    brightBlue: '#1e66f5', brightMagenta: '#8839ef', brightCyan: '#179299', brightWhite: '#bcc0cc',
  },
  frappe: {
    background: '#303446', foreground: '#c6d0f5',
    cursor: '#f2d5cf', cursorAccent: '#303446',
    selectionBackground: 'rgba(202, 158, 230, 0.3)', selectionForeground: '#c6d0f5',
    black: '#51576d', red: '#e78284', green: '#a6d189', yellow: '#e5c890',
    blue: '#8caaee', magenta: '#ca9ee6', cyan: '#81c8be', white: '#b5bfe2',
    brightBlack: '#626880', brightRed: '#e78284', brightGreen: '#a6d189', brightYellow: '#e5c890',
    brightBlue: '#8caaee', brightMagenta: '#ca9ee6', brightCyan: '#81c8be', brightWhite: '#c6d0f5',
  },
  macchiato: {
    background: '#24273a', foreground: '#cad3f5',
    cursor: '#f4dbd6', cursorAccent: '#24273a',
    selectionBackground: 'rgba(198, 160, 246, 0.3)', selectionForeground: '#cad3f5',
    black: '#494d64', red: '#ed8796', green: '#a6da95', yellow: '#eed49f',
    blue: '#8aadf4', magenta: '#c6a0f6', cyan: '#8bd5ca', white: '#b8c0e0',
    brightBlack: '#5b6078', brightRed: '#ed8796', brightGreen: '#a6da95', brightYellow: '#eed49f',
    brightBlue: '#8aadf4', brightMagenta: '#c6a0f6', brightCyan: '#8bd5ca', brightWhite: '#cad3f5',
  },
  cherry: {
    background: '#221a22', foreground: '#f0ddf0',
    cursor: '#f5a0d0', cursorAccent: '#221a22',
    selectionBackground: 'rgba(245, 160, 208, 0.25)', selectionForeground: '#f0ddf0',
    black: '#4c404e', red: '#f07888', green: '#a0d890', yellow: '#f0d098',
    blue: '#90b0ea', magenta: '#e890c8', cyan: '#80d8c0', white: '#dcc8e0',
    brightBlack: '#605464', brightRed: '#f07888', brightGreen: '#a0d890', brightYellow: '#f0d098',
    brightBlue: '#90b0ea', brightMagenta: '#e890c8', brightCyan: '#80d8c0', brightWhite: '#f0ddf0',
  },
  ocean: {
    background: '#1a1e28', foreground: '#d8e4f5',
    cursor: '#70a8f0', cursorAccent: '#1a1e28',
    selectionBackground: 'rgba(112, 168, 240, 0.25)', selectionForeground: '#d8e4f5',
    black: '#384254', red: '#f08888', green: '#80d8a0', yellow: '#f0d880',
    blue: '#70a8f0', magenta: '#b0a0ea', cyan: '#60d8d0', white: '#b8ccdc',
    brightBlack: '#4a5668', brightRed: '#f08888', brightGreen: '#80d8a0', brightYellow: '#f0d880',
    brightBlue: '#70a8f0', brightMagenta: '#b0a0ea', brightCyan: '#60d8d0', brightWhite: '#d8e4f5',
  },
  amber: {
    background: '#211e1a', foreground: '#f0e8d8',
    cursor: '#f0d070', cursorAccent: '#211e1a',
    selectionBackground: 'rgba(240, 208, 112, 0.25)', selectionForeground: '#f0e8d8',
    black: '#4c4438', red: '#e08878', green: '#a0d090', yellow: '#f0d070',
    blue: '#88b4d8', magenta: '#d0a8d8', cyan: '#78c8b8', white: '#dcd4bc',
    brightBlack: '#605848', brightRed: '#e08878', brightGreen: '#a0d090', brightYellow: '#f0d070',
    brightBlue: '#88b4d8', brightMagenta: '#d0a8d8', brightCyan: '#78c8b8', brightWhite: '#f0e8d8',
  },
  mint: {
    background: '#1a2120', foreground: '#d8f0e8',
    cursor: '#78e0a0', cursorAccent: '#1a2120',
    selectionBackground: 'rgba(120, 224, 160, 0.25)', selectionForeground: '#d8f0e8',
    black: '#3c4a48', red: '#e09090', green: '#78e0a0', yellow: '#e0d890',
    blue: '#80b4e0', magenta: '#c0a0e0', cyan: '#60e0c8', white: '#c0dcd4',
    brightBlack: '#4e5e5c', brightRed: '#e09090', brightGreen: '#78e0a0', brightYellow: '#e0d890',
    brightBlue: '#80b4e0', brightMagenta: '#c0a0e0', brightCyan: '#60e0c8', brightWhite: '#d8f0e8',
  },
  // NEW: These 5 themes were missing xterm definitions in the original code
  nord: {
    background: '#2e3440', foreground: '#eceff4',
    cursor: '#d8dee9', cursorAccent: '#2e3440',
    selectionBackground: 'rgba(129, 161, 193, 0.3)', selectionForeground: '#eceff4',
    black: '#3b4252', red: '#bf616a', green: '#a3be8c', yellow: '#ebcb8b',
    blue: '#81a1c1', magenta: '#b48ead', cyan: '#88c0d0', white: '#d8dee9',
    brightBlack: '#4c566a', brightRed: '#bf616a', brightGreen: '#a3be8c', brightYellow: '#ebcb8b',
    brightBlue: '#81a1c1', brightMagenta: '#b48ead', brightCyan: '#8fbcbb', brightWhite: '#eceff4',
  },
  dracula: {
    background: '#282a36', foreground: '#f8f8f2',
    cursor: '#f8f8f2', cursorAccent: '#282a36',
    selectionBackground: 'rgba(189, 147, 249, 0.3)', selectionForeground: '#f8f8f2',
    black: '#21222c', red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c',
    blue: '#bd93f9', magenta: '#ff79c6', cyan: '#8be9fd', white: '#f8f8f2',
    brightBlack: '#6272a4', brightRed: '#ff6e6e', brightGreen: '#69ff94', brightYellow: '#ffffa5',
    brightBlue: '#d6acff', brightMagenta: '#ff92df', brightCyan: '#a4ffff', brightWhite: '#ffffff',
  },
  'tokyo-night': {
    background: '#1a1b26', foreground: '#c0caf5',
    cursor: '#c0caf5', cursorAccent: '#1a1b26',
    selectionBackground: 'rgba(122, 162, 247, 0.3)', selectionForeground: '#c0caf5',
    black: '#15161e', red: '#f7768e', green: '#9ece6a', yellow: '#e0af68',
    blue: '#7aa2f7', magenta: '#bb9af7', cyan: '#7dcfff', white: '#a9b1d6',
    brightBlack: '#414868', brightRed: '#f7768e', brightGreen: '#9ece6a', brightYellow: '#e0af68',
    brightBlue: '#7aa2f7', brightMagenta: '#bb9af7', brightCyan: '#7dcfff', brightWhite: '#c0caf5',
  },
  'rose-pine-dawn': {
    background: '#faf4ed', foreground: '#575279',
    cursor: '#575279', cursorAccent: '#faf4ed',
    selectionBackground: 'rgba(144, 122, 169, 0.2)', selectionForeground: '#575279',
    black: '#f2e9e1', red: '#b4637a', green: '#56949f', yellow: '#ea9d34',
    blue: '#286983', magenta: '#907aa9', cyan: '#56949f', white: '#575279',
    brightBlack: '#9893a5', brightRed: '#b4637a', brightGreen: '#56949f', brightYellow: '#ea9d34',
    brightBlue: '#286983', brightMagenta: '#907aa9', brightCyan: '#56949f', brightWhite: '#575279',
  },
  'gruvbox-light': {
    background: '#fbf1c7', foreground: '#3c3836',
    cursor: '#3c3836', cursorAccent: '#fbf1c7',
    selectionBackground: 'rgba(175, 58, 3, 0.2)', selectionForeground: '#3c3836',
    black: '#fbf1c7', red: '#9d0006', green: '#79740e', yellow: '#b57614',
    blue: '#076678', magenta: '#8f3f71', cyan: '#427b58', white: '#3c3836',
    brightBlack: '#928374', brightRed: '#9d0006', brightGreen: '#79740e', brightYellow: '#b57614',
    brightBlue: '#076678', brightMagenta: '#8f3f71', brightCyan: '#427b58', brightWhite: '#3c3836',
  },
};

/**
 * Get the xterm.js theme object for the current document theme.
 * @returns {object} xterm.js ITheme object
 */
export function getCurrentXtermTheme() {
  const t = document.documentElement.dataset.theme || 'mocha';
  return xtermThemes[t] || xtermThemes.mocha;
}
