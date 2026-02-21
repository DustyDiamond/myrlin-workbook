<script>
  import { stringToColor } from '$lib/utils.js';

  let { feature, onEdit, onDelete } = $props();

  function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', feature.id);
    e.dataTransfer.effectAllowed = 'move';
  }

  const priorityColors = {
    urgent: 'text-th-red',
    high: 'text-th-peach',
    normal: 'text-text-tertiary',
    low: 'text-text-muted',
  };
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="group p-2.5 bg-bg-primary rounded-md border border-border-subtle cursor-grab
         hover:border-accent/50 transition-colors active:cursor-grabbing"
  draggable="true"
  ondragstart={handleDragStart}
  ondblclick={() => onEdit?.(feature)}
  role="listitem"
>
  <div class="flex items-start gap-2">
    <span class="text-xs font-medium text-text-primary leading-tight flex-1">{feature.name}</span>
    {#if feature.priority && feature.priority !== 'normal'}
      <span class="text-[10px] font-mono {priorityColors[feature.priority] || ''}">
        {feature.priority}
      </span>
    {/if}
    <!-- Delete button (visible on hover) -->
    <button
      onclick={(e) => { e.stopPropagation(); onDelete?.(feature); }}
      class="opacity-0 group-hover:opacity-100 text-text-muted hover:text-th-red text-xs transition-opacity shrink-0"
      title="Delete feature"
    >x</button>
  </div>

  {#if feature.description}
    <p class="mt-1 text-[11px] text-text-muted line-clamp-2">{feature.description}</p>
  {/if}

  <div class="flex items-center gap-2 mt-2">
    {#if feature.workspaceName}
      <span
        class="px-1.5 py-0.5 text-[10px] rounded-full font-medium"
        style:background="{stringToColor(feature.workspaceName)}20"
        style:color={stringToColor(feature.workspaceName)}
      >
        {feature.workspaceName}
      </span>
    {/if}
    {#if feature.complexity}
      <span class="text-[10px] text-text-muted">{feature.complexity}</span>
    {/if}
  </div>
</div>
