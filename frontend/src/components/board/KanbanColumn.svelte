<script>
  import FeatureCard from './FeatureCard.svelte';

  let { column, onDrop, onEdit, onDelete } = $props();

  let dragOver = $state(false);

  function handleDragOver(e) {
    e.preventDefault();
    dragOver = true;
  }

  function handleDragLeave() {
    dragOver = false;
  }

  function handleDrop(e) {
    e.preventDefault();
    dragOver = false;
    const featureId = e.dataTransfer.getData('text/plain');
    if (featureId) {
      onDrop?.(featureId, column.status);
    }
  }

  const statusColors = {
    'backlog': 'bg-surface-2',
    'planned': 'bg-th-blue',
    'in-progress': 'bg-th-yellow',
    'review': 'bg-th-mauve',
    'done': 'bg-th-green',
  };
</script>

<div
  class="flex flex-col min-w-[260px] w-[260px] bg-bg-secondary rounded-lg border transition-colors
         {dragOver ? 'border-accent' : 'border-border-subtle'}"
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  role="list"
>
  <!-- Column Header -->
  <div class="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
    <span class="w-2 h-2 rounded-full {statusColors[column.status] || 'bg-surface-2'}"></span>
    <span class="text-xs font-semibold text-text-primary">{column.label}</span>
    <span class="ml-auto text-xs text-text-muted">{column.features.length}</span>
  </div>

  <!-- Cards -->
  <div class="flex-1 flex flex-col gap-2 p-2 overflow-y-auto min-h-[100px]">
    {#each column.features as feature (feature.id)}
      <FeatureCard {feature} onEdit={() => onEdit?.(feature)} onDelete={() => onDelete?.(feature)} />
    {/each}
  </div>
</div>
