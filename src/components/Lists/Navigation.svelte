<script lang="ts">
  import { search } from 'state/uiState';
  import { additionalTypes } from 'state/dataAPI';

  function handleClick(q) {
    search.set({
      query: q,
      restrict: null
    });
  }
</script>

<h2>Ähnliche Suchbegriffe</h2>
<div>
  <ul>
    {#each $additionalTypes as [type]}
      <li on:click={() => handleClick(type)}><span>{type}</span></li>
    {/each}
  </ul>
</div>

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
