<script lang="ts">
  import { query } from '../state/uiState';
  import { currentTopicGenres } from '../state/dataAPI';
  import { max } from 'd3-array';
  import { scaleLinear } from 'd3-scale';

  let scale;

  currentTopicGenres.subscribe(async (value) => {
    const counts = await value;
    const maxCount = max(counts, (x) => x[1]);
    scale = scaleLinear().domain([0, maxCount]).range([0, 30]);
  });
</script>

<h2>Statistik für {$query}</h2>

{#await $currentTopicGenres}
  Lade Genres...
{:then g}
  <table>
    {#each g as [name, count]}
      <tr>
        <td>{name}</td>
        <td>{count}</td>
        <td><span class="bar" style="width: {scale(count)}px" /></td>
      </tr>
    {/each}
  </table>
{/await}

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
