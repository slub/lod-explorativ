<script lang="ts">
  import type { Geo } from 'types/es';

  export let locations: Geo[];
</script>

<div class="container">
  <h4>Erwähnte Orte</h4>
  <ul class="authorList">
    {#each locations as geo}
      <li>{geo.preferredName}</li>
    {/each}
  </ul>
</div>

<style>
  .container {
    margin-bottom: 2rem;
  }
</style>
