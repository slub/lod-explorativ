<script lang="ts">
  import type { Topic } from '../types/app';
  import AuthorList from './AuthorList.svelte';
  import { query } from '../state/uiState';
  import RelatedTopicList from './RelatedTopicList.svelte';
  import LocationsList from './LocationsList.svelte';

  export let topic: Topic;

  const {
    additionalTypes,
    name,
    alternateName,
    aggregations,
    aggregationsLoose,
    authors,
    locations,
    id,
    score,
    description,
    altCount
  } = topic;

  const { mentions, resourcesCount } = aggregations;
</script>

<div class="topic">
  {#if additionalTypes}
    {#each additionalTypes as { name }}
      <span class="addType">{name}</span>{' / '}
    {/each}
  {/if}
  <h3 {id}>
    {name}
    {#if alternateName && alternateName !== name}
      [{alternateName}]
    {/if}
  </h3>

  <p>
    Das Thema „{name}“ ist in <span class="count">{resourcesCount}</span>
    Ressource{#if resourcesCount > 1}
      n
    {/if} verlinkt.
  </p>

  <p>
    Die Suche nach dem Begriff „{name}“ in *allen* Feldern der Ressourcen ergibt
    {#if resourcesCount === aggregationsLoose.resourcesCount}ebenfalls{/if}
    <span class="count">{aggregationsLoose.resourcesCount}</span>
    Treffer.
  </p>

  {#if !!alternateName && alternateName !== name}
    <p>
      Die Suche nach dem alternativen Namen „{alternateName}“ ergibt
      <span class="count">{altCount}</span>
      Treffer.
    </p>
  {/if}

  <div>Score: {Math.round(score)}</div>
  <div>ID: {id}</div>

  {#if description}
    <p class="description">{description}</p>
  {/if}

  {#if authors.length > 0}
    <AuthorList {authors} />
  {/if}

  {#if locations.length > 0}
    <LocationsList {locations} />
  {/if}

  {#if mentions.length > 0}
    <RelatedTopicList {mentions} listName="Erwähnungen explizit" />
  {/if}
  {#if aggregationsLoose.mentions.length > 0}
    <RelatedTopicList
      mentions={aggregationsLoose.mentions}
      listName="Erwähnungen implizit"
    />
  {/if}
</div>

<style>
  .description {
    font-style: italic;
  }
  .count {
    font-weight: bold;
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
