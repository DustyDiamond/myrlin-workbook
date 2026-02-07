/**
 * Frontend Backup & Restore Module
 *
 * Snapshots frontend files on successful server start.
 * Restores them on demand when an upgrade breaks the UI.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');
const BACKUP_DIR = path.join(PUBLIC_DIR, '.backup');
const MANIFEST_PATH = path.join(BACKUP_DIR, 'manifest.json');

// Only back up the files we write (vendor libs are immutable)
const BACKUP_FILES = [
  'index.html',
  'app.js',
  'terminal.js',
  'styles.css',
  'styles-mobile.css',
];

/**
 * Create a snapshot of all frontend files into .backup/
 * Called once after successful server startup.
 */
function backupFrontend() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const backedUp = [];
    for (const file of BACKUP_FILES) {
      const src = path.join(PUBLIC_DIR, file);
      const dest = path.join(BACKUP_DIR, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        const stat = fs.statSync(src);
        backedUp.push({ file, size: stat.size });
      }
    }

    const manifest = {
      timestamp: new Date().toISOString(),
      files: backedUp,
    };
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

    console.log(`[Backup] Snapshotted ${backedUp.length} frontend files`);
    return manifest;
  } catch (err) {
    console.error('[Backup] Failed to create backup:', err.message);
    return null;
  }
}

/**
 * Restore frontend files from .backup/ to public/
 * Returns the manifest of restored files, or null on failure.
 */
function restoreFrontend() {
  try {
    if (!fs.existsSync(MANIFEST_PATH)) {
      return null;
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    let restored = 0;

    for (const entry of manifest.files) {
      const src = path.join(BACKUP_DIR, entry.file);
      const dest = path.join(PUBLIC_DIR, entry.file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        restored++;
      }
    }

    console.log(`[Backup] Restored ${restored} frontend files from backup (${manifest.timestamp})`);
    return manifest;
  } catch (err) {
    console.error('[Backup] Failed to restore:', err.message);
    return null;
  }
}

/**
 * Get the current backup status.
 * Returns the manifest object or null if no backup exists.
 */
function getBackupStatus() {
  try {
    if (!fs.existsSync(MANIFEST_PATH)) return null;
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  } catch (_) {
    return null;
  }
}

module.exports = { backupFrontend, restoreFrontend, getBackupStatus };
