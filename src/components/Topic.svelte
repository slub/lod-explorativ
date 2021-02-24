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
    authors,
    id,
    score
  } = topic;
</script>

<div class="topic">
  {#if additionalTypes}
    {#each additionalTypes as { name }}
      <span class="addType">{name}</span>{' / '}
    {/each}
  {/if}
  <h3>{alternateName || name}</h3>
  <p class:count={name === $query}>
    {aggregations.resourcesCount} Ressourcen gefunden mit dem Begriff "{name}".
    {#if name === $query}
      Entspricht nicht der Anzahl an Dokumenten mit dem Begriff "{alternateName}"!
    {/if}
  </p>
  <div>PreferredName: {name}</div>
  <div>alternateName: {alternateName}</div>
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
