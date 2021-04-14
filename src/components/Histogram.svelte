<script lang="ts">
  import { currentTopicPublished } from '../state/dataAPI';
  import { max, extent } from 'd3-array';
  import { scaleLinear } from 'd3-scale';

  let w;
  let h;

  $: height = h - 5;
  $: width = w;

  $: result = [];
  $: maxCount = max(result, (x) => x[1]);
  $: yearExtent = extent(result, (x) => x[0]);
  $: yScale = scaleLinear().domain([0, maxCount]).range([0, 30]);
  $: xScale = scaleLinear().domain(yearExtent).range([0, width]);
  $: ticks = xScale.ticks();

  currentTopicPublished.subscribe(async (value) => {
    result = await value;
  });
</script>

<div bind:clientWidth={w} bind:clientHeight={h}>
  {#if result.length > 0}
    <svg {width} {height} viewBox="0 0 {width} {height}">
      {#each result as [year, count]}
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
  {/if}
</div>

<style>
  div {
    /* border: 1px solid grey; */
    height: 100px;
  }
</style>
