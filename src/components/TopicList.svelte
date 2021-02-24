<script lang="ts">
  import { fade } from 'svelte/transition';
  import { topicsEnriched } from '../state/dataAPI';
  import Topic from './Topic.svelte';
</script>

<div class="topicList">
  <h2>Themen</h2>

  {#await $topicsEnriched then topics}
    <ul>
      {#each topics as { name, additionalTypes, aggregations, authors, id } (id)}
        <li transition:fade>
          <Topic
            {name}
            {additionalTypes}
            resourcesCount={aggregations.resourcesCount}
          />
          <ul class="authorList">
            {#each authors as author}
              <li>{author.preferredName}</li>
            {/each}
          </ul>
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
  .authorList {
    margin-bottom: 2rem;
  }
  .topicList {
    overflow-y: auto;
  }
</style>
