<script lang="ts">
  import type { Topic } from 'types/es';

  export let topics: Topic[];
</script>

<div class="container">
  <h4>Erwähnte Themen</h4>
  <ul class="authorList">
    {#each topics as topic}
      <li>{topic.preferredName}</li>
    {/each}
  </ul>
</div>

<style>
  .container {
    margin-bottom: 2rem;
  }
</style>
