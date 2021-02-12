<script lang="ts">
  import { topics } from "../dataAPI";
  import Topic from "./Topic.svelte";
</script>

<div class="topicList">
  <h2>Themenliste</h2>

  {#await $topics}
    Suche Themen ...
  {:then result}
    <ul>
      {#each result as { name, additionalTypes, resources }}
        <li>
          <Topic {name} {additionalTypes} resourcesCount={resources} />
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
