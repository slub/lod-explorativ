<script lang="ts">
  import { extent } from 'd3-array';
  import { scaleLinear } from 'd3-scale';
  import { datePublished } from 'state/dataAPI';

  export let radius;
  export let offset = 20;

  $: yearExtent = extent($datePublished, (x) => x[0]);

  $: posScale = scaleLinear()
    .domain(yearExtent)
    .range([0.1 * Math.PI, 1.9 * Math.PI]);

  $: ticks = posScale.ticks(
    Math.min(10, Math.abs(yearExtent[0] - yearExtent[1]))
  );

  $: labels = ticks.map((t) => ({
    x: Math.sin(posScale(t)) * (radius - offset),
    y: -Math.cos(posScale(t)) * (radius - offset),
    text: t
  }));
</script>

{#each labels as { x, y, text }}
  <text
    {x}
    {y}
    text-anchor={x < 0 ? 'start' : x > 0 ? 'end' : 'middle'}
    font-style="italic"
    fill="#8F8F8F"
    font-size="13">{text}</text
  >
{/each}

<style>
</style>
