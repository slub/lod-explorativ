<script lang="ts">
  import { fade } from 'svelte/transition';
  import { topicsEnriched } from '../state/dataAPI';
  import Topic from './Topic.svelte';
</script>

<div class="topicList">
  <h2>Themen</h2>

  <ul>
    {#each $topicsEnriched as topic (topic.id)}
      <li transition:fade>
        <Topic {topic} />
      </li>
    {/each}
  </ul>
</div>

<!--
@component
List of topics for search query

-->
<style>
  .topicList {
    overflow-y: auto;
  }
</style>
