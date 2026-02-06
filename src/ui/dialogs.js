/**
 * Dialogs - Modal dialog helpers for user input
 * Provides text input prompts, confirmations, help overlay, and quick switcher.
 */

const blessed = require('blessed');
const theme = require('./theme');

/**
 * Show a text input prompt dialog
 */
function promptInput(screen, title, callback) {
  const overlay = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    style: { bg: 'black', transparent: true },
  });

  const form = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    width: 50,
    height: 7,
    tags: true,
    border: { type: 'line', fg: theme.colors.primary },
    style: {
      fg: theme.colors.text,
      bg: theme.colors.surface,
      border: { fg: theme.colors.primary },
    },
  });

  const label = blessed.text({
    parent: form,
    top: 0,
    left: 1,
    content: `{${theme.colors.primary}-fg}{bold}${title}{/bold}{/}`,
    tags: true,
    style: { fg: theme.colors.text, bg: theme.colors.surface },
  });

  const input = blessed.textbox({
    parent: form,
    top: 2,
    left: 1,
    right: 1,
    height: 1,
    inputOnFocus: true,
    style: {
      fg: theme.colors.text,
      bg: theme.colors.surfaceActive,
      focus: {
        fg: theme.colors.text,
        bg: theme.colors.surfaceActive,
      },
    },
  });

  const hint = blessed.text({
    parent: form,
    top: 4,
    left: 1,
    content: `{${theme.colors.textTertiary}-fg}Enter to confirm ${theme.icons.dot} Esc to cancel{/}`,
    tags: true,
    style: { fg: theme.colors.textTertiary, bg: theme.colors.surface },
  });

  function cleanup(result) {
    overlay.destroy();
    form.destroy();
    screen.render();
    callback(result);
  }

  input.key(['escape'], () => {
    cleanup(null);
  });

  input.on('submit', (value) => {
    cleanup(value && value.trim() ? value.trim() : null);
  });

  screen.render();
  input.focus();
}

/**
 * Show a yes/no confirmation dialog
 */
function confirmDialog(screen, message, callback) {
  const overlay = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    style: { bg: 'black', transparent: true },
  });

  const dialog = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    width: 50,
    height: 7,
    tags: true,
    border: { type: 'line', fg: theme.colors.warning },
    style: {
      fg: theme.colors.text,
      bg: theme.colors.surface,
      border: { fg: theme.colors.warning },
    },
  });

  const msgText = blessed.text({
    parent: dialog,
    top: 1,
    left: 1,
    right: 1,
    content: `{${theme.colors.text}-fg}${message}{/}`,
    tags: true,
    style: { fg: theme.colors.text, bg: theme.colors.surface },
  });

  const hintText = blessed.text({
    parent: dialog,
    top: 4,
    left: 1,
    content: `{${theme.colors.success}-fg}[y]{/} Yes   {${theme.colors.error}-fg}[n]{/} No   {${theme.colors.textTertiary}-fg}Esc{/} Cancel`,
    tags: true,
    style: { fg: theme.colors.textSecondary, bg: theme.colors.surface },
  });

  function cleanup(result) {
    overlay.destroy();
    dialog.destroy();
    screen.render();
    callback(result);
  }

  dialog.key(['y', 'Y'], () => cleanup(true));
  dialog.key(['n', 'N', 'escape'], () => cleanup(false));

  screen.render();
  dialog.focus();
}

/**
 * Quick Switcher - Ctrl+K fuzzy search for sessions and workspaces
 */
function quickSwitcher(screen, store, callback) {
  const overlay = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    style: { bg: 'black', transparent: true },
  });

  const container = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    width: 64,
    height: 18,
    tags: true,
    border: { type: 'line', fg: theme.colors.primary },
    style: {
      fg: theme.colors.text,
      bg: theme.colors.surface,
      border: { fg: theme.colors.primary },
    },
    label: ` {${theme.colors.primary}-fg}${theme.icons.search} Quick Switcher{/} `,
  });

  const input = blessed.textbox({
    parent: container,
    top: 0,
    left: 1,
    right: 1,
    height: 1,
    inputOnFocus: true,
    style: {
      fg: theme.colors.text,
      bg: theme.colors.surfaceActive,
      focus: {
        fg: theme.colors.text,
        bg: theme.colors.surfaceActive,
      },
    },
  });

  const resultsList = blessed.list({
    parent: container,
    top: 2,
    left: 0,
    right: 0,
    bottom: 1,
    tags: true,
    keys: true,
    vi: false,
    mouse: true,
    style: {
      fg: theme.colors.text,
      bg: theme.colors.surface,
      selected: {
        fg: theme.colors.surface,
        bg: theme.colors.primary,
        bold: true,
      },
      item: {
        fg: theme.colors.textSecondary,
        bg: theme.colors.surface,
      },
    },
  });

  const hint = blessed.text({
    parent: container,
    bottom: 0,
    left: 1,
    tags: true,
    content: `{${theme.colors.textTertiary}-fg}Enter select ${theme.icons.dot} ↑↓ navigate ${theme.icons.dot} Esc close{/}`,
    style: { fg: theme.colors.textTertiary, bg: theme.colors.surface },
  });

  // Build searchable items
  const allItems = [];

  // Add workspaces
  for (const ws of store.getAllWorkspacesList()) {
    allItems.push({
      type: 'workspace',
      id: ws.id,
      name: ws.name,
      detail: `${store.getWorkspaceSessions(ws.id).length} sessions`,
      searchText: ws.name.toLowerCase() + ' ' + (ws.description || '').toLowerCase(),
    });
  }

  // Add sessions
  for (const sess of store.getAllSessionsList()) {
    const ws = store.getWorkspace(sess.workspaceId);
    allItems.push({
      type: 'session',
      id: sess.id,
      workspaceId: sess.workspaceId,
      name: sess.name,
      detail: ws ? ws.name : '',
      searchText: (sess.name + ' ' + (sess.topic || '') + ' ' + (sess.workingDir || '') + ' ' + (ws ? ws.name : '')).toLowerCase(),
    });
  }

  let filteredItems = [...allItems];
  let selectedIdx = 0;

  function renderResults() {
    const items = filteredItems.map(item => {
      const typeIcon = item.type === 'workspace'
        ? `{${theme.colors.primary}-fg}${theme.icons.workspace}{/}`
        : `{${theme.colors.accent}-fg}${theme.icons.session}{/}`;
      const typeBadge = item.type === 'workspace'
        ? `{${theme.colors.primary}-fg}WS{/}`
        : `{${theme.colors.teal}-fg}S{/}`;
      return ` ${typeIcon} {${theme.colors.text}-fg}${item.name}{/}  {${theme.colors.textTertiary}-fg}${item.detail}{/}`;
    });

    resultsList.setItems(items.length > 0 ? items : [`{${theme.colors.textTertiary}-fg}  No matches{/}`]);
    resultsList.select(selectedIdx);
    screen.render();
  }

  function filterItems(query) {
    if (!query || !query.trim()) {
      filteredItems = [...allItems];
    } else {
      const q = query.toLowerCase().trim();
      filteredItems = allItems.filter(item => {
        // Simple fuzzy: check if all chars of query appear in order
        let searchIdx = 0;
        for (let i = 0; i < q.length && searchIdx < item.searchText.length; searchIdx++) {
          if (item.searchText[searchIdx] === q[i]) i++;
        }
        return searchIdx <= item.searchText.length && q.length === 0 ||
          item.searchText.includes(q) ||
          item.name.toLowerCase().includes(q);
      });
    }
    selectedIdx = 0;
    renderResults();
  }

  function cleanup(result) {
    overlay.destroy();
    container.destroy();
    screen.render();
    callback(result);
  }

  // Handle input changes - poll the value
  let lastValue = '';
  const pollTimer = setInterval(() => {
    const currentValue = input.value || '';
    if (currentValue !== lastValue) {
      lastValue = currentValue;
      filterItems(currentValue);
    }
  }, 100);

  input.key(['escape'], () => {
    clearInterval(pollTimer);
    cleanup(null);
  });

  input.key(['up', 'C-k'], () => {
    if (selectedIdx > 0) selectedIdx--;
    resultsList.select(selectedIdx);
    screen.render();
  });

  input.key(['down', 'C-j'], () => {
    if (selectedIdx < filteredItems.length - 1) selectedIdx++;
    resultsList.select(selectedIdx);
    screen.render();
  });

  input.on('submit', () => {
    clearInterval(pollTimer);
    if (filteredItems[selectedIdx]) {
      cleanup(filteredItems[selectedIdx]);
    } else {
      cleanup(null);
    }
  });

  resultsList.on('select', (item, index) => {
    clearInterval(pollTimer);
    if (filteredItems[index]) {
      cleanup(filteredItems[index]);
    }
  });

  // Initial render
  renderResults();
  screen.render();
  input.focus();
}

/**
 * Show a keybinding help overlay
 */
function helpDialog(screen) {
  const overlay = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    style: { bg: 'black', transparent: true },
  });

  const helpBox = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    width: 56,
    height: 26,
    tags: true,
    scrollable: true,
    keys: true,
    vi: true,
    border: { type: 'line', fg: theme.colors.primary },
    style: {
      fg: theme.colors.text,
      bg: theme.colors.surface,
      border: { fg: theme.colors.primary },
      label: { fg: theme.colors.primary, bold: true },
    },
    label: ' Keyboard Shortcuts ',
  });

  const p = theme.colors.primary;
  const t = theme.colors.text;
  const s = theme.colors.textSecondary;
  const d = theme.colors.textTertiary;
  const a = theme.colors.accent;
  const pe = theme.colors.peach;

  const helpContent = [
    ``,
    ` {${p}-fg}{bold}Navigation{/bold}{/}`,
    ` {${t}-fg}Tab{/}         {${s}-fg}Cycle focus between panels{/}`,
    ` {${t}-fg}j / k{/}       {${s}-fg}Move up / down in lists{/}`,
    ` {${t}-fg}Arrow keys{/}  {${s}-fg}Move up / down in lists{/}`,
    ` {${t}-fg}Enter{/}       {${s}-fg}Select / activate item{/}`,
    ``,
    ` {${p}-fg}{bold}View Modes{/bold}{/}`,
    ` {${p}-fg}w{/}           {${s}-fg}Workspace sessions (default){/}`,
    ` {${a}-fg}a{/}           {${s}-fg}All sessions across workspaces{/}`,
    ` {${pe}-fg}e{/}           {${s}-fg}Recent sessions{/}`,
    ` {${p}-fg}Ctrl+K{/}      {${s}-fg}Quick switcher (fuzzy search){/}`,
    ``,
    ` {${p}-fg}{bold}Workspaces{/bold}{/}  {${d}-fg}(left panel focused){/}`,
    ` {${t}-fg}n{/}           {${s}-fg}Create new workspace{/}`,
    ` {${t}-fg}d{/}           {${s}-fg}Delete workspace{/}`,
    ` {${t}-fg}r{/}           {${s}-fg}Rename workspace{/}`,
    ``,
    ` {${p}-fg}{bold}Sessions{/bold}{/}    {${d}-fg}(right panel focused){/}`,
    ` {${t}-fg}n{/}           {${s}-fg}Create new session{/}`,
    ` {${t}-fg}s{/}           {${s}-fg}Start session{/}`,
    ` {${t}-fg}x{/}           {${s}-fg}Stop session{/}`,
    ` {${t}-fg}d{/}           {${s}-fg}Delete session{/}`,
    ``,
    ` {${p}-fg}{bold}General{/bold}{/}`,
    ` {${t}-fg}?{/}           {${s}-fg}Show this help{/}`,
    ` {${t}-fg}q / Ctrl-c{/}  {${s}-fg}Quit application{/}`,
    ``,
    ` {${d}-fg}Press Esc or ? to close{/}`,
  ];

  helpBox.setContent(helpContent.join('\n'));

  function cleanup() {
    overlay.destroy();
    helpBox.destroy();
    screen.render();
  }

  helpBox.key(['escape', '?', 'q'], () => cleanup());

  screen.render();
  helpBox.focus();
}

module.exports = { promptInput, confirmDialog, helpDialog, quickSwitcher };
