<script lang="ts">
  import { query } from '../state/uiState';
  import { currentTopicGenres } from '../state/dataAPI';
</script>

<h2>Statistik für {$query}</h2>

<ul>
  {#await $currentTopicGenres}
    <li>Lade Genres...</li>
  {:then g}
    {#each g as [name, count]}
      <li>{name} ({count})</li>
    {/each}
  {/await}
</ul>

<style>
  ul {
    list-style: none;
    padding: 0;
  }

  li {
    margin-bottom: 0.25rem;
    white-space: nowrap;
  }

  li:hover {
    cursor: pointer;
    font-weight: bold;
  }
</style>
