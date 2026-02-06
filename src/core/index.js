/**
 * Core module barrel export
 * Re-exports all core modules for convenient access.
 */

const sessionManager = require('./session-manager');
const workspaceManager = require('./workspace-manager');
const processTracker = require('./process-tracker');
const recovery = require('./recovery');
const { NotificationManager, getNotificationManager } = require('./notifications');

module.exports = {
  // Session lifecycle
  launchSession: sessionManager.launchSession,
  stopSession: sessionManager.stopSession,
  restartSession: sessionManager.restartSession,
  getSessionProcess: sessionManager.getSessionProcess,

  // Workspace operations
  createWorkspace: workspaceManager.createWorkspace,
  switchWorkspace: workspaceManager.switchWorkspace,
  deleteWorkspace: workspaceManager.deleteWorkspace,
  addSessionToWorkspace: workspaceManager.addSessionToWorkspace,
  getWorkspaceStats: workspaceManager.getWorkspaceStats,

  // Process tracking
  processTracker,

  // Recovery
  recovery,

  // Notifications
  NotificationManager,
  getNotificationManager,
};
