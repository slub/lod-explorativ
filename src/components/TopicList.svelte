<script lang="ts">
  import { flip } from 'svelte/animate';
  import { topics } from '../dataAPI';
  import Topic from './Topic.svelte';
</script>

<div class="topicList">
  <h2>Themenliste</h2>

  {#await $topics then result}
    <ul>
      {#each result as topic (topic.id)}
        <li animate:flip={{ duration: 1000 }}>
          <Topic
            name={topic.name}
            additionalTypes={topic.additionalTypes}
            resourcesCount={topic.resourcesCount}
          />
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
