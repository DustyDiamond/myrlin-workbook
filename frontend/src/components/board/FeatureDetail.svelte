<script>
  import { boardStore } from '$lib/stores/board.svelte.js';
  import { stringToColor } from '$lib/utils.js';
  import Icon from '../shared/Icon.svelte';
  import Button from '../shared/Button.svelte';

  let { feature, onclose, onEdit } = $props();

  let showRejectForm = $state(false);
  let rejectReason = $state('');

  const statusColors = {
    backlog: 'bg-surface-2 text-text-muted',
    planned: 'bg-th-blue text-crust',
    'in-progress': 'bg-th-yellow text-crust',
    review: 'bg-th-mauve text-crust',
    done: 'bg-th-green text-crust',
  };

  const priorityColors = {
    urgent: 'bg-th-red text-crust',
    high: 'bg-th-peach text-crust',
    normal: 'bg-surface-2 text-text-secondary',
    low: 'bg-surface-1 text-text-muted',
  };

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  async function handleApprove() {
    await boardStore.moveToStatus(feature.id, 'done');
    onclose?.();
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    await boardStore.rejectFeature(feature.id, rejectReason.trim());
    onclose?.();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') onclose?.();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 bg-crust/60 backdrop-blur-sm z-50 flex justify-end"
  onclick={onclose}
>
  <div
    class="h-full w-[70vw] max-w-3xl min-w-[400px] bg-bg-secondary border-l border-border-default
           shadow-xl flex flex-col overflow-hidden animate-slide-in"
    onclick={(e) => e.stopPropagation()}
  >
    <!-- Header -->
    <div class="flex items-start gap-3 px-6 py-4 border-b border-border-subtle shrink-0">
      <div class="flex-1 min-w-0">
        <h2 class="text-base font-semibold text-text-primary truncate">{feature.name}</h2>
        <div class="flex items-center gap-2 mt-1.5 flex-wrap">
          <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full {statusColors[feature.status] || ''}">
            {feature.status}
          </span>
          <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full {priorityColors[feature.priority] || ''}">
            {feature.priority}
          </span>
          {#if feature.complexity}
            <span class="px-2 py-0.5 text-[10px] rounded-full bg-surface-1 text-text-muted">{feature.complexity}</span>
          {/if}
          {#if feature.workspaceName}
            <span
              class="px-2 py-0.5 text-[10px] rounded-full font-medium"
              style:background="{stringToColor(feature.workspaceName)}20"
              style:color={stringToColor(feature.workspaceName)}
            >{feature.workspaceName}</span>
          {/if}
        </div>
      </div>
      <Button variant="ghost" size="icon" title="Close" class="shrink-0 mt-0.5 w-7 h-7"
        onclick={onclose}
      ><Icon name="x-lg" size="14" /></Button>
    </div>

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
      <!-- Metadata -->
      <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
        {#if feature.wave != null}
          <div><span class="text-text-muted">Wave:</span> <span class="text-text-primary">{feature.wave}</span></div>
        {/if}
        <div><span class="text-text-muted">Attempts:</span> <span class="text-text-primary">{feature.attempts ?? 0} / {feature.maxRetries ?? 3}</span></div>
        <div><span class="text-text-muted">Created:</span> <span class="text-text-primary">{formatDate(feature.createdAt)}</span></div>
        <div><span class="text-text-muted">Updated:</span> <span class="text-text-primary">{formatDate(feature.updatedAt)}</span></div>
      </div>

      <!-- Description -->
      {#if feature.description}
        <div>
          <h3 class="text-xs font-semibold text-text-secondary mb-1">Description</h3>
          <p class="text-sm text-text-primary whitespace-pre-wrap">{feature.description}</p>
        </div>
      {/if}

      <!-- Spec Files -->
      {#if (feature.filesToModify?.length || feature.filesToCreate?.length || feature.contextFiles?.length || feature.specDocument || feature.dependsOn?.length)}
        <div>
          <h3 class="text-xs font-semibold text-text-secondary mb-1">Spec</h3>
          <div class="space-y-1.5 text-[11px]">
            {#if feature.filesToModify?.length}
              <div>
                <span class="text-text-muted">Modify:</span>
                {#each feature.filesToModify as f}
                  <span class="ml-1 px-1.5 py-0.5 bg-bg-elevated rounded text-text-primary font-mono">{f}</span>
                {/each}
              </div>
            {/if}
            {#if feature.filesToCreate?.length}
              <div>
                <span class="text-text-muted">Create:</span>
                {#each feature.filesToCreate as f}
                  <span class="ml-1 px-1.5 py-0.5 bg-bg-elevated rounded text-th-green font-mono">{f}</span>
                {/each}
              </div>
            {/if}
            {#if feature.contextFiles?.length}
              <div>
                <span class="text-text-muted">Context:</span>
                {#each feature.contextFiles as f}
                  <span class="ml-1 px-1.5 py-0.5 bg-bg-elevated rounded text-text-muted font-mono">{f}</span>
                {/each}
              </div>
            {/if}
            {#if feature.specDocument}
              <div>
                <span class="text-text-muted">Spec doc:</span>
                <span class="ml-1 text-accent font-mono">{feature.specDocument}</span>
              </div>
            {/if}
            {#if feature.dependsOn?.length}
              <div>
                <span class="text-text-muted">Depends on:</span>
                {#each feature.dependsOn as depId}
                  <span class="ml-1 px-1.5 py-0.5 bg-bg-elevated rounded text-text-primary font-mono text-[10px]">{depId.slice(0, 8)}</span>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Acceptance Criteria -->
      {#if feature.acceptanceCriteria?.length}
        <div>
          <h3 class="text-xs font-semibold text-text-secondary mb-1">Acceptance Criteria</h3>
          <ul class="space-y-1">
            {#each feature.acceptanceCriteria as criterion}
              <li class="flex items-start gap-2 text-xs text-text-primary">
                <span class="text-text-muted shrink-0 mt-0.5"><Icon name="circle-fill" size="6" /></span>
                <span>{criterion}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      <!-- Execute Notes -->
      {#if (feature.executeNotes || []).length}
        <div>
          <h3 class="text-xs font-semibold text-th-blue mb-1">Execution Log</h3>
          <div class="space-y-2">
            {#each feature.executeNotes as note}
              <div class="px-3 py-2 bg-bg-elevated rounded-md border border-border-subtle text-xs text-text-primary font-mono whitespace-pre-wrap">{note}</div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Review Notes -->
      {#if (feature.reviewNotes || []).length}
        <div>
          <h3 class="text-xs font-semibold text-th-mauve mb-1">Automated Review</h3>
          <div class="space-y-2">
            {#each feature.reviewNotes as note}
              <div class="px-3 py-2 bg-bg-elevated rounded-md border border-border-subtle text-xs text-text-primary font-mono whitespace-pre-wrap">{note}</div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Rejection Feedback -->
      {#if (feature.rejectNotes || []).length}
        <div>
          <h3 class="text-xs font-semibold text-th-red mb-1">Rejection Feedback</h3>
          <div class="space-y-2">
            {#each feature.rejectNotes as note}
              <div class="px-3 py-2 bg-th-red/5 rounded-md border border-th-red/30 text-xs text-text-primary whitespace-pre-wrap">{note}</div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Action Bar -->
    <div class="px-6 py-3 border-t border-border-subtle shrink-0 space-y-2">
      {#if showRejectForm}
        <div class="flex flex-col gap-2">
          <textarea
            bind:value={rejectReason}
            rows="3"
            class="w-full px-3 py-2 text-xs bg-bg-elevated text-text-primary border border-th-red/30 rounded-md
                   placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-th-red resize-y"
            placeholder="Explain why this task is being rejected..."
          ></textarea>
          <div class="flex items-center gap-2">
            <Button variant="danger" size="sm" disabled={!rejectReason.trim()} onclick={handleReject}>Submit Rejection</Button>
            <Button variant="secondary" size="sm" onclick={() => { showRejectForm = false; rejectReason = ''; }}>Cancel</Button>
          </div>
        </div>
      {:else}
        <div class="flex items-center gap-2">
          {#if feature.status === 'review'}
            <Button variant="success" size="sm" onclick={handleApprove}>Approve</Button>
            <Button variant="danger" size="sm" onclick={() => showRejectForm = true}>Reject</Button>
          {/if}
          <Button variant="secondary" size="sm" onclick={() => onEdit?.(feature)}>Edit</Button>
          <div class="flex-1"></div>
          <span class="text-[10px] text-text-muted font-mono">{feature.id.slice(0, 8)}</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .animate-slide-in {
    animation: slideIn 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
</style>
