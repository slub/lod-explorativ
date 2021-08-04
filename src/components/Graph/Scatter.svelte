<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { fade } from 'svelte/transition';
  import LabelsYear from './LabelsYear.svelte';

  const dispatch = createEventDispatcher();

  export let dates;
  export let isInteractive;
  export let radius;
</script>

{#if isInteractive}
  <LabelsYear {radius} />
{/if}

{#each dates as { dx, dy, dr, dc, year, count }, i (i)}
  <circle
    class:isInteractive
    r={dr}
    cx={dx * radius}
    cy={dy * radius}
    fill={dc}
    stroke={dc}
    stroke-width="1"
    stroke-opacity="0.33"
    fill-opacity="0.33"
    on:mouseenter={(e) => {
      dispatch('enterDate', { e, year, count });
    }}
    on:mouseleave={() => dispatch('leaveDate', null)}
    on:click|stopPropagation
    transition:fade
  />
{/each}

<style>
  .isInteractive:hover {
    stroke-width: 2px;
    stroke-opacity: 1;
  }
</style>
