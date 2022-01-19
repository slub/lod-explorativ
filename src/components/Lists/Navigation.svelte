<script lang="ts">
  import { author, query, restrict } from 'state/uiState';
  import { additionalTypes } from 'state/dataAPI';

  function handleClick(q) {
    query.set(q);
    restrict.set(null);
    author.set(null);
  }
</script>

<style>
  div {
    height: 21vh;
    overflow-y: auto;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    margin-bottom: 0.25rem;
  }

  span:hover {
    cursor: pointer;
    border-bottom: 1px solid black;
  }
</style>

<h2>Ähnliche Suchbegriffe</h2>
<div>
  <ul>
    {#each $additionalTypes as [type] (type)}
      <li on:click={() => handleClick(type)}>
        <span>{type}</span>
      </li>
    {/each}
  </ul>
</div>
