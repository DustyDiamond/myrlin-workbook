<script>
  import { stringToColor } from '$lib/utils.js';

  let { features = [] } = $props();

  // Kahn's algorithm for topological sorting into waves
  let waves = $derived(computeWaves(features));

  function computeWaves(feats) {
    if (!feats.length) return [];

    const byId = new Map(feats.map(f => [f.id, f]));
    const inDegree = new Map();
    const adjList = new Map();

    for (const f of feats) {
      inDegree.set(f.id, 0);
      adjList.set(f.id, []);
    }

    for (const f of feats) {
      if (f.dependsOn) {
        for (const depId of f.dependsOn) {
          if (byId.has(depId)) {
            adjList.get(depId).push(f.id);
            inDegree.set(f.id, (inDegree.get(f.id) || 0) + 1);
          }
        }
      }
    }

    const result = [];
    let queue = [...inDegree.entries()].filter(([, d]) => d === 0).map(([id]) => id);

    while (queue.length > 0) {
      result.push(queue.map(id => byId.get(id)));
      const nextQueue = [];
      for (const id of queue) {
        for (const next of (adjList.get(id) || [])) {
          const newDeg = inDegree.get(next) - 1;
          inDegree.set(next, newDeg);
          if (newDeg === 0) nextQueue.push(next);
        }
      }
      queue = nextQueue;
    }

    return result;
  }
</script>

<div class="flex-1 p-4 overflow-y-auto">
  {#if waves.length === 0}
    <div class="flex items-center justify-center h-32 text-text-muted text-sm">
      No features to display
    </div>
  {:else}
    <div class="flex flex-col gap-4">
      {#each waves as wave, i}
        <div>
          <h3 class="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
            Wave {i + 1}
          </h3>
          <div class="flex flex-wrap gap-2">
            {#each wave as feature}
              <div class="px-3 py-2 bg-bg-secondary rounded-md border border-border-subtle text-sm">
                <span class="text-text-primary">{feature.name}</span>
                {#if feature.workspaceName}
                  <span
                    class="ml-2 px-1.5 py-0.5 text-[10px] rounded-full"
                    style:background="{stringToColor(feature.workspaceName)}20"
                    style:color={stringToColor(feature.workspaceName)}
                  >
                    {feature.workspaceName}
                  </span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
