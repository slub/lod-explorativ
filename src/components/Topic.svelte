<script lang="ts">
  import type { Topic } from '../types/app';
  import AuthorList from './AuthorList.svelte';
  import { query } from '../state/uiState';
  import RelatedTopicList from './RelatedTopicList.svelte';

  export let topic: Topic;

  const {
    additionalTypes,
    name,
    alternateName,
    aggregations,
    alternateAggs,
    authors,
    id,
    score
  } = topic;

  const altAgg = alternateAggs.get(alternateName);
  const altCount = altAgg?.resourcesCount;
  const { mentions } = aggregations;
</script>

<div class="topic">
  {#if additionalTypes}
    {#each additionalTypes as { name }}
      <span class="addType">{name}</span>{' / '}
    {/each}
  {/if}
  <h3>
    {name}
    {#if alternateName && alternateName !== name}
      // {alternateName}
    {/if}
  </h3>

  <div>PreferredName: {name} (Ressourcen: {aggregations.resourcesCount})</div>
  <div>
    alternateName: {alternateName || '-'}
    {#if !!alternateName}
      <span class:count={altCount === 0}>(Ressourcen: {altCount})</span>
    {/if}
  </div>
  <div>Score: {Math.round(score)}</div>
  <div>ID: {id}</div>

  <AuthorList {authors} />
  <RelatedTopicList {mentions} listName="Erwähnungen nach `preferredName`" />
  {#if altCount > 0}
    <RelatedTopicList
      mentions={altAgg.mentions}
      listName="Erwähnungen nach `alternateName[0]`"
    />
  {/if}
</div>

<style>
  .count {
    color: red;
  }
  .topic {
    padding: 1rem;
  }
  .addType {
    color: grey;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 1px;
  }
</style>
