<script lang="ts">
  import type { Mention } from 'types/app';

  export let listName: string;
  export let mentions: Mention[];
</script>

<div class="container">
  <h4>{listName}</h4>
  <ul class="authorList">
    {#each mentions as { name, docCount }}
      <li>{name} ({docCount})</li>
    {/each}
  </ul>
</div>

<style>
  .container {
    margin-bottom: 2rem;
  }
</style>
