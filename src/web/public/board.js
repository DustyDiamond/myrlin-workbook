/**
 * BoardView — Global kanban board + dependency visualization
 * Extracted from app.js feature board + pipeline deps code.
 * Loaded as a top-level panel (not nested under docs).
 */
class BoardView {
  constructor(app) {
    this.app = app;
    this.features = [];
    this.filterWorkspaceId = null; // null = all workspaces

    // Cache DOM elements
    this.els = {
      panel: document.getElementById('board-panel'),
      columns: document.getElementById('board-columns'),
      addBtn: document.getElementById('board-add-btn'),
      filter: document.getElementById('board-filter'),
      dependencies: document.getElementById('board-dependencies'),
    };

    this.bindEvents();
  }

  bindEvents() {
    // Add feature button
    if (this.els.addBtn) {
      this.els.addBtn.addEventListener('click', () => this.createFeature());
    }

    // Workspace filter dropdown
    if (this.els.filter) {
      this.els.filter.addEventListener('change', (e) => {
        this.setFilter(e.target.value || null);
      });
    }

    // Sub-tab switching (Board / Dependencies)
    document.querySelectorAll('.board-sub-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.board-sub-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const view = tab.dataset.boardTab;
        if (this.els.columns) this.els.columns.hidden = view !== 'board';
        if (this.els.dependencies) this.els.dependencies.hidden = view !== 'dependencies';
        if (view === 'dependencies') this.renderDependencies(this.getFilteredFeatures());
      });
    });
  }

  // ─── Data Loading ──────────────────────────────────────────

  async loadFeatures() {
    try {
      const data = await this.app.api('GET', '/api/features');
      this.features = data.features || [];
      this.updateFilterDropdown();
      this.renderBoard(this.getFilteredFeatures());
    } catch (err) {
      this.app.showToast(err.message || 'Failed to load features', 'error');
    }
  }

  getFilteredFeatures() {
    if (!this.filterWorkspaceId) return this.features;
    return this.features.filter(f => f.workspaceId === this.filterWorkspaceId);
  }

  // ─── Workspace Filter ─────────────────────────────────────

  setFilter(workspaceId) {
    this.filterWorkspaceId = workspaceId;
    this.renderBoard(this.getFilteredFeatures());
    // Also update deps if visible
    const depsTab = document.querySelector('.board-sub-tab[data-board-tab="dependencies"]');
    if (depsTab && depsTab.classList.contains('active')) {
      this.renderDependencies(this.getFilteredFeatures());
    }
  }

  updateFilterDropdown() {
    if (!this.els.filter) return;
    const workspaces = new Map();
    for (const f of this.features) {
      if (f.workspaceId && f.workspaceName) {
        workspaces.set(f.workspaceId, f.workspaceName);
      }
    }
    let html = '<option value="">All Workspaces</option>';
    for (const [id, name] of workspaces) {
      const selected = this.filterWorkspaceId === id ? ' selected' : '';
      html += `<option value="${this.app.escapeHtml(id)}"${selected}>${this.app.escapeHtml(name)}</option>`;
    }
    this.els.filter.innerHTML = html;
  }

  // ─── Board Rendering ──────────────────────────────────────

  renderBoard(features) {
    if (!this.els.columns) return;

    const statuses = ['backlog', 'planned', 'in-progress', 'review', 'done'];

    for (const status of statuses) {
      const body = this.els.columns.querySelector(`.board-column-body[data-status="${status}"]`);
      const countEl = this.els.columns.querySelector(`[data-count="${status}"]`);
      if (!body) continue;

      const statusFeatures = features.filter(f => f.status === status);
      if (countEl) countEl.textContent = statusFeatures.length;

      body.innerHTML = statusFeatures.map(f => this.renderCard(f)).join('');
    }

    this.initDragAndDrop();
    this.bindCardEvents();
  }

  renderCard(feature) {
    const priorityClass = `board-card-priority-${feature.priority || 'normal'}`;
    const wsColor = this.workspaceColor(feature.workspaceName || '');
    const complexityBadge = feature.complexity
      ? `<span class="board-card-complexity board-card-complexity-${feature.complexity}">${feature.complexity}</span>`
      : '';
    const waveBadge = feature.wave
      ? `<span class="board-card-wave">W${feature.wave}</span>`
      : '';

    return `<div class="board-card" draggable="true" data-feature-id="${feature.id}" data-status="${feature.status}">
      <div class="board-card-title">${this.app.escapeHtml(feature.name)}</div>
      ${feature.description ? `<div class="board-card-desc">${this.app.escapeHtml(feature.description).substring(0, 80)}</div>` : ''}
      <div class="board-card-meta">
        <span class="board-card-workspace" style="--ws-color: ${wsColor}">${this.app.escapeHtml(feature.workspaceName || 'Unknown')}</span>
        <span class="board-card-priority ${priorityClass}">${feature.priority || 'normal'}</span>
        ${complexityBadge}${waveBadge}
      </div>
    </div>`;
  }

  workspaceColor(name) {
    // Deterministic hue from workspace name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 55%)`;
  }

  bindCardEvents() {
    if (!this.els.columns) return;
    this.els.columns.querySelectorAll('.board-card').forEach(card => {
      card.addEventListener('click', () => {
        this.openFeatureDetail(card.dataset.featureId);
      });
      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showFeatureContextMenu(card.dataset.featureId, e.clientX, e.clientY);
      });
    });
  }

  // ─── Drag and Drop ────────────────────────────────────────

  initDragAndDrop() {
    if (!this.els.columns) return;

    this.els.columns.querySelectorAll('.board-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.dataset.featureId);
        card.classList.add('board-card-dragging');
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('board-card-dragging');
        this.els.columns.querySelectorAll('.board-column-body').forEach(col => col.classList.remove('board-column-drop-target'));
      });
    });

    this.els.columns.querySelectorAll('.board-column-body').forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.classList.add('board-column-drop-target');
      });
      col.addEventListener('dragleave', () => {
        col.classList.remove('board-column-drop-target');
      });
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('board-column-drop-target');
        const featureId = e.dataTransfer.getData('text/plain');
        const newStatus = col.dataset.status;
        if (featureId && newStatus) {
          this.handleDrop(featureId, newStatus);
        }
      });
    });
  }

  async handleDrop(featureId, newStatus) {
    // Optimistically update local state
    const feature = this.features.find(f => f.id === featureId);
    if (feature && feature.status === newStatus) return;
    if (feature) feature.status = newStatus;

    this.renderBoard(this.getFilteredFeatures());

    try {
      await this.app.api('PUT', `/api/features/${encodeURIComponent(featureId)}`, { status: newStatus });
    } catch (err) {
      this.app.showToast(err.message || 'Failed to move feature', 'error');
      await this.loadFeatures(); // Reload on failure
    }
  }

  // ─── CRUD ─────────────────────────────────────────────────

  async createFeature() {
    const workspaces = this.app.state.workspaces || [];
    if (workspaces.length === 0) {
      this.app.showToast('Create a workspace first', 'warning');
      return;
    }

    const wsOptions = workspaces.map(ws =>
      `<option value="${this.app.escapeHtml(ws.id)}"${ws.id === (this.app.state.activeWorkspace?.id) ? ' selected' : ''}>${this.app.escapeHtml(ws.name)}</option>`
    ).join('');

    const result = await this.app.showModal({
      title: 'New Feature',
      body: `
        <div class="input-group" style="margin-bottom:12px">
          <label class="input-label">Workspace</label>
          <select class="input" id="modal-feature-ws">${wsOptions}</select>
        </div>
        <div class="input-group" style="margin-bottom:12px">
          <label class="input-label">Name</label>
          <input class="input" id="modal-feature-name" placeholder="Feature name" autofocus>
        </div>
        <div class="input-group" style="margin-bottom:12px">
          <label class="input-label">Description</label>
          <textarea class="input" id="modal-feature-desc" rows="3" placeholder="Optional description"></textarea>
        </div>
        <div class="input-group" style="margin-bottom:12px">
          <label class="input-label">Priority</label>
          <select class="input" id="modal-feature-priority">
            <option value="low">Low</option>
            <option value="normal" selected>Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      `,
      confirmText: 'Create',
    });

    if (!result) return;

    const name = document.getElementById('modal-feature-name')?.value?.trim();
    const description = document.getElementById('modal-feature-desc')?.value?.trim();
    const workspaceId = document.getElementById('modal-feature-ws')?.value;
    const priority = document.getElementById('modal-feature-priority')?.value;

    if (!name) {
      this.app.showToast('Feature name is required', 'warning');
      return;
    }

    try {
      const body = { name };
      if (description) body.description = description;
      if (priority) body.priority = priority;
      await this.app.api('POST', `/api/workspaces/${encodeURIComponent(workspaceId)}/features`, body);
      this.app.showToast('Feature created', 'success');
      await this.loadFeatures();
    } catch (err) {
      this.app.showToast(err.message || 'Failed to create feature', 'error');
    }
  }

  async editFeature(featureId) {
    const feature = this.features.find(f => f.id === featureId);
    if (!feature) return;

    const result = await this.app.showModal({
      title: 'Edit Feature',
      body: `
        <div class="input-group" style="margin-bottom:12px">
          <label class="input-label">Name</label>
          <input class="input" id="modal-edit-name" value="${this.app.escapeHtml(feature.name)}" autofocus>
        </div>
        <div class="input-group" style="margin-bottom:12px">
          <label class="input-label">Description</label>
          <textarea class="input" id="modal-edit-desc" rows="3">${this.app.escapeHtml(feature.description || '')}</textarea>
        </div>
        <div class="input-group" style="margin-bottom:12px">
          <label class="input-label">Priority</label>
          <select class="input" id="modal-edit-priority">
            <option value="low"${feature.priority === 'low' ? ' selected' : ''}>Low</option>
            <option value="normal"${(!feature.priority || feature.priority === 'normal') ? ' selected' : ''}>Normal</option>
            <option value="high"${feature.priority === 'high' ? ' selected' : ''}>High</option>
            <option value="urgent"${feature.priority === 'urgent' ? ' selected' : ''}>Urgent</option>
          </select>
        </div>
        <div class="input-group" style="margin-bottom:12px">
          <label class="input-label">Status</label>
          <select class="input" id="modal-edit-status">
            <option value="backlog"${feature.status === 'backlog' ? ' selected' : ''}>Backlog</option>
            <option value="planned"${feature.status === 'planned' ? ' selected' : ''}>Planned</option>
            <option value="in-progress"${feature.status === 'in-progress' ? ' selected' : ''}>In Progress</option>
            <option value="review"${feature.status === 'review' ? ' selected' : ''}>Review</option>
            <option value="done"${feature.status === 'done' ? ' selected' : ''}>Done</option>
          </select>
        </div>
      `,
      confirmText: 'Save',
    });

    if (!result) return;

    const updates = {};
    const name = document.getElementById('modal-edit-name')?.value?.trim();
    const description = document.getElementById('modal-edit-desc')?.value?.trim();
    const priority = document.getElementById('modal-edit-priority')?.value;
    const status = document.getElementById('modal-edit-status')?.value;

    if (name && name !== feature.name) updates.name = name;
    if (description !== feature.description) updates.description = description;
    if (priority !== feature.priority) updates.priority = priority;
    if (status !== feature.status) updates.status = status;

    if (Object.keys(updates).length === 0) return;

    try {
      await this.app.api('PUT', `/api/features/${encodeURIComponent(featureId)}`, updates);
      this.app.showToast('Feature updated', 'success');
      await this.loadFeatures();
    } catch (err) {
      this.app.showToast(err.message || 'Failed to update feature', 'error');
    }
  }

  async deleteFeature(featureId) {
    const feature = this.features.find(f => f.id === featureId);
    if (!feature) return;

    const confirmed = await this.app.showConfirmModal({
      title: 'Delete Feature',
      message: `Delete "${feature.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      confirmClass: 'btn-danger',
    });

    if (!confirmed) return;

    try {
      await this.app.api('DELETE', `/api/features/${encodeURIComponent(featureId)}`);
      this.app.showToast('Feature deleted', 'success');
      await this.loadFeatures();
    } catch (err) {
      this.app.showToast(err.message || 'Failed to delete feature', 'error');
    }
  }

  async moveFeature(featureId, newStatus) {
    try {
      await this.app.api('PUT', `/api/features/${encodeURIComponent(featureId)}`, { status: newStatus });
      await this.loadFeatures();
    } catch (err) {
      this.app.showToast(err.message || 'Failed to move feature', 'error');
    }
  }

  // ─── Feature Detail ───────────────────────────────────────

  openFeatureDetail(featureId) {
    const feature = this.features.find(f => f.id === featureId);
    if (!feature) return;

    const overlay = document.getElementById('feature-detail-overlay');
    const title = document.getElementById('feature-detail-title');
    const body = document.getElementById('feature-detail-body');
    if (!overlay || !body) return;

    title.textContent = feature.name;

    const priorityClass = `board-card-priority-${feature.priority || 'normal'}`;
    const wsColor = this.workspaceColor(feature.workspaceName || '');

    body.innerHTML = `
      <div class="feature-detail-meta">
        <div class="meta-row"><span class="meta-label">Status</span><span class="meta-value"><span class="pd-status pd-status-${feature.status}">${feature.status}</span></span></div>
        <div class="meta-row"><span class="meta-label">Priority</span><span class="meta-value"><span class="board-card-priority ${priorityClass}">${feature.priority || 'normal'}</span></span></div>
        <div class="meta-row"><span class="meta-label">Workspace</span><span class="meta-value"><span class="board-card-workspace" style="--ws-color: ${wsColor}">${this.app.escapeHtml(feature.workspaceName || 'Unknown')}</span></span></div>
        ${feature.complexity ? `<div class="meta-row"><span class="meta-label">Complexity</span><span class="meta-value">${feature.complexity}</span></div>` : ''}
        ${feature.wave ? `<div class="meta-row"><span class="meta-label">Wave</span><span class="meta-value">${feature.wave}</span></div>` : ''}
        ${feature.attempts > 0 ? `<div class="meta-row"><span class="meta-label">Attempts</span><span class="meta-value">${feature.attempts} / ${feature.maxRetries}</span></div>` : ''}
      </div>
      ${feature.description ? `<div class="feature-detail-section"><h4>Description</h4><p>${this.app.escapeHtml(feature.description)}</p></div>` : ''}
      ${(feature.filesToModify?.length) ? `<div class="feature-detail-section"><h4>Files to Modify</h4><ul>${feature.filesToModify.map(f => '<li class="mono">' + this.app.escapeHtml(f) + '</li>').join('')}</ul></div>` : ''}
      ${(feature.filesToCreate?.length) ? `<div class="feature-detail-section"><h4>Files to Create</h4><ul>${feature.filesToCreate.map(f => '<li class="mono">' + this.app.escapeHtml(f) + '</li>').join('')}</ul></div>` : ''}
      ${(feature.contextFiles?.length) ? `<div class="feature-detail-section"><h4>Context Files</h4><ul>${feature.contextFiles.map(f => '<li class="mono">' + this.app.escapeHtml(f) + '</li>').join('')}</ul></div>` : ''}
      ${(feature.acceptanceCriteria?.length) ? `<div class="feature-detail-section"><h4>Acceptance Criteria</h4><ul>${feature.acceptanceCriteria.map(c => '<li>' + this.app.escapeHtml(c) + '</li>').join('')}</ul></div>` : ''}
      ${(feature.dependsOn?.length) ? `<div class="feature-detail-section"><h4>Dependencies</h4><ul>${feature.dependsOn.map(d => { const dep = this.features.find(f => f.id === d); return '<li>' + this.app.escapeHtml(dep ? dep.name : d.substring(0, 12)) + '</li>'; }).join('')}</ul></div>` : ''}
      ${(feature.reviewNotes?.length) ? `<div class="feature-detail-section"><h4>Review Notes</h4><ul>${feature.reviewNotes.map(n => '<li>' + this.app.escapeHtml(n) + '</li>').join('')}</ul></div>` : ''}
      <div class="feature-detail-actions" style="margin-top:16px;display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" id="fd-edit-btn">Edit</button>
        <button class="btn btn-ghost btn-sm" id="fd-delete-btn" style="color:var(--red)">Delete</button>
      </div>
    `;

    overlay.hidden = false;

    // Bind action buttons
    document.getElementById('fd-edit-btn')?.addEventListener('click', () => {
      this.closeFeatureDetail();
      this.editFeature(featureId);
    });
    document.getElementById('fd-delete-btn')?.addEventListener('click', () => {
      this.closeFeatureDetail();
      this.deleteFeature(featureId);
    });

    // Close handlers
    document.getElementById('feature-detail-close')?.addEventListener('click', () => this.closeFeatureDetail());
    document.getElementById('feature-detail-backdrop')?.addEventListener('click', () => this.closeFeatureDetail());
  }

  closeFeatureDetail() {
    const overlay = document.getElementById('feature-detail-overlay');
    if (overlay) overlay.hidden = true;
  }

  // ─── Context Menu ─────────────────────────────────────────

  showFeatureContextMenu(featureId, x, y) {
    const feature = this.features.find(f => f.id === featureId);
    if (!feature) return;

    const statuses = ['backlog', 'planned', 'in-progress', 'review', 'done'];
    const items = [
      { label: 'Edit', action: () => this.editFeature(featureId) },
      { separator: true },
      ...statuses.filter(s => s !== feature.status).map(s => ({
        label: `Move to ${s}`,
        action: () => this.moveFeature(featureId, s),
      })),
      { separator: true },
      { label: 'Delete', action: () => this.deleteFeature(featureId), danger: true },
    ];

    this.app.showContextMenuItems(items, x, y);
  }

  // ─── Dependencies View ────────────────────────────────────

  renderDependencies(features) {
    if (!this.els.dependencies) return;

    if (features.length === 0) {
      this.els.dependencies.innerHTML = '<div class="board-deps-empty">No features yet. Add features to see the dependency graph.</div>';
      return;
    }

    // Build dependency graph (Kahn's algorithm)
    const featureMap = {};
    for (const f of features) featureMap[f.id] = f;
    const allIds = new Set(features.map(f => f.id));

    // Detect orphaned deps
    const orphanedIds = new Set();
    for (const f of features) {
      for (const depId of (f.dependsOn || [])) {
        if (!allIds.has(depId)) orphanedIds.add(f.id);
      }
    }

    // Topological sort
    const inDegree = {};
    const adj = {};
    for (const f of features) { inDegree[f.id] = 0; adj[f.id] = []; }
    for (const f of features) {
      for (const depId of (f.dependsOn || [])) {
        if (allIds.has(depId)) { inDegree[f.id]++; adj[depId].push(f.id); }
      }
    }

    const waves = [];
    let queue = features.filter(f => inDegree[f.id] === 0).map(f => f.id);
    const visited = new Set();
    while (queue.length > 0) {
      waves.push({ wave: waves.length + 1, features: queue.map(id => featureMap[id]) });
      const nextQueue = [];
      for (const id of queue) {
        visited.add(id);
        for (const depId of adj[id]) {
          inDegree[depId]--;
          if (inDegree[depId] === 0) nextQueue.push(depId);
        }
      }
      queue = nextQueue;
    }
    const circularIds = features.filter(f => !visited.has(f.id)).map(f => f.id);

    // Build warnings
    let warnings = '';
    if (circularIds.length > 0) {
      const names = circularIds.map(id => this.app.escapeHtml(featureMap[id]?.name || id.slice(0, 8))).join(', ');
      warnings += `<div class="pd-warning pd-warning-circular">Circular dependency detected: ${names}</div>`;
    }
    if (orphanedIds.size > 0) {
      const names = [...orphanedIds].map(id => this.app.escapeHtml(featureMap[id]?.name || id.slice(0, 8))).join(', ');
      warnings += `<div class="pd-warning pd-warning-orphan">Orphaned dependencies: ${names}</div>`;
    }

    // Render wave rows
    const waveRows = waves.map(w => {
      const cards = w.features.map(f => {
        const priorityClass = `board-card-priority-${f.priority || 'normal'}`;
        const wsColor = this.workspaceColor(f.workspaceName || '');
        const complexityBadge = f.complexity ? `<span class="board-card-complexity board-card-complexity-${f.complexity}">${f.complexity}</span>` : '';
        const statusBadge = `<span class="pd-status pd-status-${f.status}">${f.status}</span>`;
        return `<div class="pd-card" data-feature-id="${f.id}">
          <div class="pd-card-name">${this.app.escapeHtml(f.name)}</div>
          <div class="pd-card-meta">
            <span class="board-card-workspace" style="--ws-color: ${wsColor}">${this.app.escapeHtml(f.workspaceName || '')}</span>
            <span class="board-card-priority ${priorityClass}">${f.priority || 'normal'}</span>
            ${complexityBadge}${statusBadge}
          </div>
        </div>`;
      }).join('');
      return `<div class="pd-wave">
        <div class="pd-wave-label">Wave ${w.wave}</div>
        <div class="pd-wave-cards">${cards}</div>
      </div>`;
    }).join('');

    // Circular section
    let circularSection = '';
    if (circularIds.length > 0) {
      const cards = circularIds.map(id => {
        const f = featureMap[id];
        return `<div class="pd-card pd-card-circular" data-feature-id="${f.id}">
          <div class="pd-card-name">${this.app.escapeHtml(f.name)}</div>
          <div class="pd-card-meta"><span class="pd-status pd-status-circular">circular</span></div>
        </div>`;
      }).join('');
      circularSection = `<div class="pd-wave pd-wave-circular">
        <div class="pd-wave-label">Unresolved</div>
        <div class="pd-wave-cards">${cards}</div>
      </div>`;
    }

    this.els.dependencies.innerHTML = `
      ${warnings}
      <div class="pd-graph" id="pd-graph">
        ${waveRows}${circularSection}
        <svg class="pd-arrows" id="pd-arrows"></svg>
      </div>
    `;

    // Draw arrows
    this._drawDepArrows(features, featureMap);

    // Redraw on resize
    if (this._pdResizeObserver) this._pdResizeObserver.disconnect();
    const graphEl = document.getElementById('pd-graph');
    if (graphEl) {
      this._pdResizeObserver = new ResizeObserver(() => this._drawDepArrows(features, featureMap));
      this._pdResizeObserver.observe(graphEl);
    }

    // Bind click on dep cards to open detail
    this.els.dependencies.querySelectorAll('.pd-card').forEach(card => {
      card.addEventListener('click', () => this.openFeatureDetail(card.dataset.featureId));
    });
  }

  _drawDepArrows(features, featureMap) {
    const svg = document.getElementById('pd-arrows');
    const graph = document.getElementById('pd-graph');
    if (!svg || !graph) return;

    const graphRect = graph.getBoundingClientRect();
    svg.setAttribute('width', graph.scrollWidth);
    svg.setAttribute('height', graph.scrollHeight);
    svg.innerHTML = '';

    for (const f of features) {
      for (const depId of (f.dependsOn || [])) {
        if (!featureMap[depId]) continue;
        const fromEl = graph.querySelector(`.pd-card[data-feature-id="${depId}"]`);
        const toEl = graph.querySelector(`.pd-card[data-feature-id="${f.id}"]`);
        if (!fromEl || !toEl) continue;

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        const x1 = fromRect.left + fromRect.width / 2 - graphRect.left;
        const y1 = fromRect.bottom - graphRect.top;
        const x2 = toRect.left + toRect.width / 2 - graphRect.left;
        const y2 = toRect.top - graphRect.top;
        const midY = (y1 + y2) / 2;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`);
        path.setAttribute('stroke', 'var(--overlay0)');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', 'url(#pd-arrowhead)');
        svg.appendChild(path);
      }
    }

    // Add arrowhead marker
    if (!svg.querySelector('#pd-arrowhead')) {
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.innerHTML = `<marker id="pd-arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
        <path d="M0,0 L8,3 L0,6" fill="var(--overlay0)"/>
      </marker>`;
      svg.prepend(defs);
    }
  }
}
