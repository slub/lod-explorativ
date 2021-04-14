<script lang="ts">
  import { query } from '../state/uiState';
  import { currentTopicPublished } from '../state/dataAPI';
  import { max, extent } from 'd3-array';
  import { scaleLinear } from 'd3-scale';

  let w;
  let h;

  $: height = h - 5;
  $: width = w;

  let yScale;
  let xScale;
  let ticks: number[];

  currentTopicPublished.subscribe(async (value) => {
    const counts = await value;
    const maxCount = max(counts, (x) => x[1]);
    const yearExtent = extent(counts, (x) => x[0]);

    // TODO: make reactive
    yScale = scaleLinear().domain([0, maxCount]).range([0, 30]);
    xScale = scaleLinear().domain(yearExtent).range([0, width]);
    ticks = xScale.ticks();
  });
</script>

<div bind:clientWidth={w} bind:clientHeight={h}>
  {#await $currentTopicPublished}
    Lade Histogram...
  {:then g}
    <svg {width} {height} viewBox="0 0 {width} {height}">
      {#each g as [year, count]}
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
  {/await}
</div>

<style>
  div {
    /* border: 1px solid grey; */
    height: 100px;
  }
</style>
