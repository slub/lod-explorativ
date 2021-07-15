<script lang="ts">
  import { fade } from 'svelte/transition';
  import { search, searchMode, SearchMode } from '../state/uiState';
  import { resources, selectedTopic } from '../state/dataAPI';
  import Chip from './Chip.svelte';
  import { areEqual } from '../utils';
  import { last } from 'lodash';

  $: ({ query, restrict } = $search);

  function chipColor(id) {
    if (/geo/.test(id)) return '#D5E7D0';
    if (/topic/.test(id)) return '#CEDBE3';
    if (/person/.test(id)) return '#F5C6B1';
  }
</script>

{#if $selectedTopic?.count > 0}
  <h2>{$resources.total} Ressourcen</h2>
  <ul class="resourceList">
    {#each $resources.items as { title, yearPublished, mentions, id }}
      <li transition:fade class="resourceItem" {title}>
        {#if yearPublished}
          <span class="year">{yearPublished}</span>
        {/if}
        <a
          href={'https://katalog.slub-dresden.de/id/0-' + last(id.split('/'))}
          target="_blank"
          rel="noopener"
          title="">{title}</a
        >
        <ul class="topicList">
          {#each mentions as mention}
            <!-- do not show selected topic if SearchMode is 'topic'
            as it exists for all elements  -->
            {#if $searchMode == SearchMode.phrase || (!areEqual(mention.name, query) && !areEqual(mention.name, restrict))}
              <li
                class="topicItem"
                on:click={() => {
                  search.setRestrict(mention.name);
                }}
              >
                <Chip name={mention.name} color={chipColor(mention.id)} />
              </li>
            {/if}
          {/each}
        </ul>
      </li>
    {/each}
  </ul>
{/if}

<style>
  ul {
    list-style: none;
    padding: 0;
  }

  a {
    color: #333;
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
  }

  .topicItem {
    margin: 4px 2px;
    cursor: pointer;
  }

  .year {
    font-weight: bold;
  }
</style>
