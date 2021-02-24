<script lang="ts">
  import type { Person } from 'types/es';

  export let authors: Person[];
</script>

<div class="container">
  <h4>Top Autoren</h4>
  <ul class="authorList">
    {#each authors as author}
      <li>{author.preferredName}</li>
    {/each}
  </ul>
</div>

<style>
  .container {
    margin-bottom: 2rem;
  }
</style>
