<script>
  import { stringToColor } from '$lib/utils.js';
  import Icon from '../shared/Icon.svelte';
  import Button from '../shared/Button.svelte';

  let { feature, onEdit, onDelete, onSelect } = $props();

  let showContextMenu = $state(false);
  let menuX = $state(0);
  let menuY = $state(0);

  function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', feature.id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    menuX = e.clientX;
    menuY = e.clientY;
    showContextMenu = true;
  }

  function closeMenu() {
    showContextMenu = false;
  }

  function menuAction(action) {
    showContextMenu = false;
    if (action === 'view') onSelect?.(feature);
    else if (action === 'edit') onEdit?.(feature);
    else if (action === 'delete') onDelete?.(feature);
  }

  const priorityColors = {
    urgent: 'text-th-red',
    high: 'text-th-peach',
    normal: 'text-text-tertiary',
    low: 'text-text-muted',
  };
</script>

<svelte:window onclick={closeMenu} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="group p-2.5 bg-bg-primary rounded-md border border-border-subtle cursor-grab
         hover:border-accent/50 transition-colors active:cursor-grabbing relative"
  draggable="true"
  ondragstart={handleDragStart}
  oncontextmenu={handleContextMenu}
  role="listitem"
>
  <div class="flex items-start gap-1.5">
    <!-- Feature name — click opens detail drawer -->
    <button
      onclick={(e) => { e.stopPropagation(); onSelect?.(feature); }}
      class="text-xs font-medium text-text-primary leading-tight flex-1 text-left
             hover:text-accent hover:underline transition-colors cursor-pointer"
      draggable="false"
    >{feature.name}</button>

    {#if feature.priority && feature.priority !== 'normal'}
      <span class="text-[10px] font-mono {priorityColors[feature.priority] || ''} shrink-0 mt-0.5">
        {feature.priority}
      </span>
    {/if}

    <!-- Action icons (visible on hover) -->
    <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
      <Button variant="ghost" size="icon" title="View details" draggable="false"
        onclick={(e) => { e.stopPropagation(); onSelect?.(feature); }}
      ><Icon name="box-arrow-up-right" size="12" /></Button>
      <Button variant="ghost" size="icon" title="Edit feature" draggable="false"
        onclick={(e) => { e.stopPropagation(); onEdit?.(feature); }}
      ><Icon name="pencil" size="12" /></Button>
      <Button variant="danger" size="icon" title="Delete feature" draggable="false"
        onclick={(e) => { e.stopPropagation(); onDelete?.(feature); }}
      ><Icon name="x-lg" size="12" /></Button>
    </div>
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

<!-- Right-click context menu -->
{#if showContextMenu}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed z-[999] bg-bg-elevated border border-border-default rounded-md shadow-lg py-1 min-w-[160px]"
    style:left="{menuX}px"
    style:top="{menuY}px"
    onclick={(e) => e.stopPropagation()}
  >
    <Button variant="ghost" size="sm" class="w-full text-left flex items-center gap-2 rounded-none"
      onclick={() => menuAction('view')}
    ><Icon name="eye" size="14" /> View Details</Button>
    <Button variant="ghost" size="sm" class="w-full text-left flex items-center gap-2 rounded-none"
      onclick={() => menuAction('edit')}
    ><Icon name="pencil" size="14" /> Edit</Button>
    <div class="border-t border-border-subtle my-1"></div>
    <Button variant="danger" size="sm" class="w-full text-left flex items-center gap-2 rounded-none"
      onclick={() => menuAction('delete')}
    ><Icon name="x-lg" size="14" /> Delete</Button>
  </div>
{/if}
