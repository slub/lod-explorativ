<script lang="ts">
  import { fade } from 'svelte/transition';
  import { topicsRequest } from '../state/dataAPI';
  import Topic from './Topic.svelte';
</script>

<div class="topicList">
  <h2>Themen</h2>

  {#await $topicsRequest then topics}
    <ul>
      {#each topics as { name, additionalTypes, resourcesCount, id } (id)}
        <li transition:fade>
          <Topic {name} {additionalTypes} {resourcesCount} />
        </li>
      {/each}
    </ul>
  {/await}
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
