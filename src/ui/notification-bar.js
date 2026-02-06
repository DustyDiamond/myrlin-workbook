/**
 * Notification Bar - Bottom area showing recent notifications
 * Displays the last 2-3 notifications with timestamps and level-colored icons.
 * Format: ` 14:32 ● Session "api" started successfully `
 */

const blessed = require('blessed');
const theme = require('./theme');

// Maximum notifications to display
const MAX_VISIBLE = 2;

/**
 * Create the notification bar widget
 * @param {blessed.screen} parent - The parent screen
 * @returns {{ widget: blessed.box, push: function, update: function }}
 */
function create(parent) {
  const bar = blessed.box({
    parent,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    tags: true,
    border: { type: 'line', fg: theme.colors.border },
    style: {
      fg: theme.colors.textSecondary,
      bg: theme.colors.bg,
      border: { fg: theme.colors.border },
    },
  });

  // Internal notification buffer
  bar._notifications = [];

  return bar;
}

/**
 * Push a single notification onto the bar and re-render
 * @param {blessed.box} bar - The notification bar widget
 * @param {{ level: string, message: string, timestamp?: string }} notification
 */
function push(bar, notification) {
  bar._notifications = bar._notifications || [];
  bar._notifications.push({
    level: notification.level || 'info',
    message: notification.message,
    timestamp: notification.timestamp || new Date().toISOString(),
  });

  // Keep only recent notifications
  if (bar._notifications.length > 50) {
    bar._notifications = bar._notifications.slice(-50);
  }

  _render(bar);
}

/**
 * Bulk update notifications
 * @param {blessed.box} bar - The notification bar widget
 * @param {Array} notifications - Array of notification objects
 */
function update(bar, notifications) {
  bar._notifications = notifications || [];
  _render(bar);
}

/**
 * Internal render function - builds content from recent notifications
 * @param {blessed.box} bar
 */
function _render(bar) {
  const notifs = bar._notifications || [];
  const recent = notifs.slice(-MAX_VISIBLE);

  if (recent.length === 0) {
    bar.setContent(` {${theme.colors.textTertiary}-fg}No notifications{/}`);
    if (bar.screen) bar.screen.render();
    return;
  }

  const lines = recent.map(n => {
    const levelStyle = theme.notification[n.level] || theme.notification.info;
    const iconColor = levelStyle.fg;

    // Format time as HH:MM
    const d = new Date(n.timestamp);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const timeStr = `${h}:${m}`;

    return ` {${theme.colors.textTertiary}-fg}${timeStr}{/} {${iconColor}-fg}${theme.icons.running}{/} {${theme.colors.text}-fg}${n.message}{/}`;
  });

  bar.setContent(lines.join('\n'));
  if (bar.screen) bar.screen.render();
}

module.exports = { create, push, update };
