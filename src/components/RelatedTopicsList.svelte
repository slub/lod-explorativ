<script lang="ts">
  import type { Topic } from 'types/es';

  export let topics: Map<Topic, number>;
</script>

<div class="container">
  <h4>Verwandte Themen</h4>
  <ul class="authorList">
    {#each Array.from(topics) as [topic, count]}
      <li>{topic.preferredName} ({count})</li>
    {/each}
  </ul>
</div>

<style>
  .container {
    margin-bottom: 2rem;
  }
</style>
