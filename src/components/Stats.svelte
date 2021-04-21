<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { scaleLinear } from 'd3-scale';
  import { max } from 'd3-array';
  import { genres } from '../state/dataAPI';
  import { query } from '../state/uiState';

  $: maxCount = max($genres, (x) => x[1]);
  $: scale = scaleLinear().domain([0, maxCount]).range([0, 30]);
</script>

<h2>Statistik für {$query}</h2>

<table>
  {#each $genres as [name, count], i}
    <tr transition:fade>
      <td class="name">{name}</td>
      <td class="count">{count}</td>
      <td><span class="bar" style="width: {scale(count)}px" /></td>
    </tr>
  {/each}
</table>

<!-- in:fade={{ duration: 200, delay: i * 10 }} out:fade={{ duration: 200 }} -->
<style>
  table {
    table-layout: fixed;
    width: 100%;
  }
  td {
    white-space: nowrap;
  }
  .name {
    width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .count {
    width: 40px;
  }
  .bar {
    display: inline-block;
    height: 8px;
    background: grey;
    transition: width 200ms ease-in-out;
  }
</style>
