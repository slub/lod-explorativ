<script lang="ts">
  import type { Event } from 'types/es';

  export let events: Map<Event, number>;
</script>

<div class="container">
  <h4>Ereignisse</h4>
  <ul class="authorList">
    {#each Array.from(events) as [event, count]}
      <li>{event.preferredName} ({count})</li>
    {/each}
  </ul>
</div>

<style>
  .container {
    margin-bottom: 2rem;
  }
</style>
