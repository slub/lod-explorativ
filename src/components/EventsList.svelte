<script lang="ts">
  import type { Event } from 'types/es';

  export let events: Event[];
</script>

<div class="container">
  <h4>Ereignisse</h4>
  <ul class="authorList">
    {#each events as event}
      <li>{event.preferredName}</li>
    {/each}
  </ul>
</div>

<style>
  .container {
    margin-bottom: 2rem;
  }
</style>
