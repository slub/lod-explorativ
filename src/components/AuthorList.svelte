<script lang="ts">
  import type { Person } from 'types/es';

  export let authors: Map<Person, number>;
</script>

<div class="container">
  <h4>Top Autoren</h4>
  <ul class="authorList">
    {#each Array.from(authors) as [author, count]}
      <li>{author.preferredName} ({count})</li>
    {/each}
  </ul>
</div>

<style>
  .container {
    margin-bottom: 2rem;
  }
</style>
