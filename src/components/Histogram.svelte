<script lang="ts">
  import { scale } from 'svelte/transition';
  import { datePublished } from '../state/dataAPI';
  import { max, extent } from 'd3-array';
  import { scaleLinear } from 'd3-scale';

  let width = 400;
  let height = 100;
  let padH = 16;
  let barWidth = 4;

  $: paddingBottom = height - 16;
  $: maxCount = max($datePublished, (x) => x[1]);
  $: yearExtent = extent($datePublished, (x) => x[0]);
  $: yScale = scaleLinear()
    .domain([0, maxCount])
    .range([2, height - 48]);
  $: xScale = scaleLinear()
    .domain(yearExtent)
    .range([padH, width - padH])
    .nice();
  $: ticks = xScale.ticks(8);

  $: {
    console.log($datePublished);
  }
</script>

<div bind:clientWidth={width}>
  <svg
    {width}
    {height}
    viewBox="0 0 {width} {height}"
    transition:scale={{ duration: 0 }}
  >
    {#each $datePublished as [year, count]}
      <rect
        x={xScale(year) - barWidth / 2}
        y={paddingBottom - yScale(count)}
        width={barWidth}
        height={yScale(count)}
        fill="grey"
      />
    {/each}
    <line
      x1="0"
      y1={paddingBottom}
      x2={width}
      y2={paddingBottom}
      stroke="lightgrey"
    />
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
