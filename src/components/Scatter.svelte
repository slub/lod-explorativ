<script lang="ts">
  import { fade } from 'svelte/transition';

  export let dates;
  export let onMouseEnter;
  export let onMouseLeave;
</script>

{#each dates as { dx, dy, dr, dc, year, count }, i (i)}
  <circle
    r={dr}
    cx={dx}
    cy={dy}
    fill={dc}
    fill-opacity="0.2"
    transition:fade
    on:mouseenter={(e) => {
      onMouseEnter(e.offsetX, e.offsetY, year, count);
    }}
    on:mouseleave={onMouseLeave}
  />
{/each}
