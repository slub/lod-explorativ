<script lang="ts">
  import type { GeoES } from 'types/es';

  export let locations: Map<GeoES, number>;
</script>

<div class="container">
  <h4>Erwähnte Orte</h4>
  <ul class="authorList">
    {#each Array.from(locations) as [geo, count]}
      <li>{geo.preferredName} ({count})</li>
    {/each}
  </ul>
</div>

<style>
  .container {
    margin-bottom: 2rem;
  }
</style>
