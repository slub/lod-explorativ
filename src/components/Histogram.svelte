<script lang="ts">
  import { scale } from 'svelte/transition';
  import { datePublished } from '../state/dataAPI';
  import { max, extent } from 'd3-array';
  import { scaleLinear } from 'd3-scale';

  let width = 400;
  let height = 100;

  $: maxCount = max($datePublished, (x) => x[1]);
  $: yearExtent = extent($datePublished, (x) => x[0]);
  $: yScale = scaleLinear().domain([0, maxCount]).range([0, 30]);
  $: xScale = scaleLinear().domain(yearExtent).range([0, width]);
  $: ticks = xScale.ticks();
</script>

<div bind:clientWidth={width}>
  <!-- <div class="test" style="width: {width}px">{w} / {width}</div> -->

  <svg
    {width}
    {height}
    viewBox="0 0 {width} {height}"
    transition:scale={{ duration: 0 }}
  >
    {#each $datePublished as [year, count]}
      <rect
        x={xScale(year)}
        y={height - 16 - yScale(count)}
        width={8}
        height={yScale(count)}
        fill="grey"
      />
    {/each}
    {#each ticks as t}
      <text x={xScale(t)} y={height} text-anchor="middle">{t}</text>
    {/each}
  </svg>
</div>

<style>
  svg {
    position: absolute;
    left: 0;
    top: 0;
  }
</style>
