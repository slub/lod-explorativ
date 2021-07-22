<script lang="ts">
  import { draw } from 'svelte/transition';

  export let strokeWidth;
  export let x1;
  export let y1;
  export let x2;
  export let y2;
  export let stroke = '#dfe2e3';

  $: centerX = 0;
  $: centerY = 0;
</script>

<path
  stroke-width={strokeWidth}
  {stroke}
  stroke-opacity="0.66"
  fill="none"
  d={`M ${x1} ${y1} S ${centerX} ${centerY}, ${x2} ${y2}`}
  transition:draw
/>
