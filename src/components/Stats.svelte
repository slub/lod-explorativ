<script lang="ts">
  import { scaleLinear } from 'd3-scale';
  import { max } from 'd3-array';
  import { genres } from '../state/dataAPI';
  import { query } from '../state/uiState';

  $: maxCount = max($genres, (x) => x[1]);
  $: scale = scaleLinear().domain([0, maxCount]).range([0, 30]);
</script>

<h2>Statistik für {$query}</h2>

<table>
  {#each $genres as [name, count]}
    <tr>
      <td>{name}</td>
      <td>{count}</td>
      <td><span class="bar" style="width: {scale(count)}px" /></td>
    </tr>
  {/each}
</table>

<style>
  td {
    padding-right: 2rem;
    white-space: nowrap;
  }
  .bar {
    display: inline-block;
    height: 8px;
    background: grey;
  }
</style>
