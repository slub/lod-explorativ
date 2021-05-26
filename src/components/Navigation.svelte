<script lang="ts">
  import { query } from '../state/uiState';
  import { additionalTypes } from '../state/dataAPI';

  function handleClick(q) {
    query.set(q);
  }
</script>

<h2>Ähnliche Suchbegriffe</h2>
<ul>
  {#each $additionalTypes as [type]}
    <li on:click={() => handleClick(type)}><span>{type}</span></li>
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

  span:hover {
    cursor: pointer;
    border-bottom: 1px solid black;
  }
</style>
