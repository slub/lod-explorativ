<script lang="ts">
  import { scale } from 'svelte/transition';
  import { min, max, extent, bin } from 'd3-array';
  import { scaleLinear } from 'd3-scale';
  import { flatten } from 'lodash';
  import { datePublished } from 'state/dataAPI';

  type Bin = { x0: number; x1: number; length: number };

  let width = 400;
  let height = 100;
  let padH = 16;

  $: paddingBottom = height - 16;
  $: maxCount = max($datePublished, (x) => x[1]);
  $: yearExtent = extent($datePublished, (x) => x[0]);
  $: allValues = flatten(
    $datePublished.map(([year, count]) => new Array(count).fill(year))
  );
  $: binned = <Bin[]>(allValues.length ? bin().thresholds(100)(allValues) : []);

  $: yScale = scaleLinear()
    .domain([0, maxCount])
    .rangeRound([0, height - 48]);

  $: xScale = scaleLinear()
    .domain(yearExtent)
    .range([padH, width - padH])
    .nice();

  $: ticks = xScale.ticks(
    Math.min(10, Math.abs(yearExtent[0] - yearExtent[1]))
  );

  $: firstYear = min($datePublished, (d) => d[0]);
  $: barWidth = Math.min(
    Math.max(Math.floor(xScale(firstYear + 1) - xScale(firstYear) - 2), 1),
    padH
  );
</script>

<div bind:clientWidth={width}>
  <svg {width} {height} viewBox="0 0 {width} {height}">
    {#each binned as bin}
      <rect
        transform="translate({xScale(bin.x0) - barWidth / 2},{paddingBottom -
          yScale(bin.length)})"
        width={barWidth}
        height={yScale(bin.length)}
        fill="#CBCBCB"
        transition:scale
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
