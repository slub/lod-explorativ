<script lang="ts">
  import { fade } from 'svelte/transition';
  import {
    query,
    queryExtension,
    searchMode,
    SearchMode
  } from '../state/uiState';
  import { resources } from '../state/dataAPI';
  import Chip from './Chip.svelte';
  import Tooltip from './Tooltip.svelte';
  import { areEqual } from '../utils';
  import { last } from 'lodash';
</script>

<h2>{$resources.total} Ressourcen</h2>

<ul class="resourceList">
  {#each $resources.items as { title, yearPublished, description, mentions, id }}
    <li transition:fade class="resourceItem" {title}>
      <Tooltip title={description}
        >[{yearPublished ?? '-'}]
        <a
          href={'https://katalog.slub-dresden.de/id/0-' + last(id.split('/'))}
          target="_blank"
          rel="noopener">{title}</a
        ></Tooltip
      >
      <ul class="topicList">
        {#each mentions as mention}
          <!-- do not show selected topic if SearchMode is 'topic'
            as it exists for all elements  -->
          {#if $searchMode == SearchMode.phrase || !areEqual(mention.name, $query)}
            <li
              class="topicItem"
              on:click={() => {
                query.set(mention.name);
                queryExtension.set(null);
              }}
            >
              <Chip name={mention.name} />
            </li>
          {/if}
        {/each}
      </ul>
    </li>
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    padding: 0;
  }
  .resourceList {
    max-height: 40vh;
    overflow-y: auto;
  }

  .topicList {
    display: flex;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }

  .resourceItem {
    margin-bottom: 0.25rem;
    border-bottom: 1px solid lightgray;
    padding-bottom: 0.25rem;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .topicItem {
    margin: 2px;
    cursor: pointer;
  }
</style>
