<script lang="ts">
  import { query, queries } from '../state/uiState';

  function handleClick(q) {
    query.set(q);
  }
</script>

<h2>Populäre Suchbegriffe</h2>

<ul>
  {#each queries as query}
    <li on:click={() => handleClick(query)}>{query}</li>
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    padding: 0;
  }

  li {
    margin-bottom: 0.25rem;
  }

  li:hover {
    cursor: pointer;
    font-weight: bold;
  }
</style>
