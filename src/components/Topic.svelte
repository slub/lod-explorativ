<script lang="ts">
  import type { Topic } from '../types/app';
  import AuthorList from './AuthorList.svelte';
  import { query } from '../state/uiState';

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

  const altCount = alternateAggs.get(alternateName)?.resourcesCount;
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
