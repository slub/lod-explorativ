<script lang="ts">
  import { query } from '../state/uiState';
  import { additionalTypes } from '../state/dataAPI';

  function handleClick(q) {
    query.set(q);
  }
</script>

<ul>
  {#each $additionalTypes as type}
    <li on:click={() => handleClick(type)}>{type}</li>
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    padding: 0;
  }

  li {
    display: inline-block;
    margin-bottom: 0.5rem;
    margin-right: 1.5rem;
    text-transform: uppercase;
  }

  li:hover {
    cursor: pointer;
    border-bottom: 1px solid black;
  }
</style>
