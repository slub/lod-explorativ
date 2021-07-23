<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { fade } from 'svelte/transition';

  const dispatch = createEventDispatcher();

  export let dates;
  export let isInteractive;
</script>

{#each dates as { dx, dy, dr, dc, year, count }, i (i)}
  <circle
    class:isInteractive
    r={dr}
    cx={dx}
    cy={dy}
    fill={dc}
    stroke={dc}
    stroke-width="1"
    stroke-opacity="0.33"
    fill-opacity="0.33"
    on:mouseenter={(e) => {
      dispatch('enterDate', { e, year, count });
    }}
    on:mouseleave={() => dispatch('leaveDate', null)}
    transition:fade
  />
{/each}

<style>
  .isInteractive:hover {
    stroke-width: 2px;
    stroke-opacity: 1;
  }
</style>
