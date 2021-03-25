<script lang="ts">
  import type { EventES } from 'types/es';

  export let events: Map<EventES, number>;
</script>

<div class="container">
  <h4>Ereignisse</h4>
  <ul class="authorList">
    {#each Array.from(events) as [e, count]}
      <li>{e.name['de']} ({count})</li>
    {/each}
  </ul>
</div>

<style>
  .container {
    margin-bottom: 2rem;
  }
</style>
