<script lang="ts">
  import { debounce } from 'lodash';
  import {
    relationContext,
    RelationContext,
    relationMode,
    RelationMode,
    search,
    searchMode,
    SearchMode
  } from '../state/uiState';
  import CatalogLink from './CatalogLink.svelte';
  import Tooltip from './Tooltip.svelte';

  $: ({ query, restrict } = $search);

  const handleQuery = debounce((e) => {
    search.setQuery(e.target.value);
  }, 500);

  const handleRestrict = debounce((e) => {
    search.setRestrict(e.target.value);
  }, 500);
</script>

<h2>Suche</h2>
<div class="search">
  <input
    class="query"
    type="text"
    placeholder="Nach Thema suchen..."
    value={query}
    size={query?.length + 3}
    on:input={handleQuery}
  />

  <div class="and"><span>&</span></div>

  <input
    class="restrict"
    type="search"
    placeholder="..."
    value={restrict}
    size={restrict?.length + 3}
    on:input={handleRestrict}
  />
</div>

<div>
  <Tooltip title="In allen Feldern der Titeldaten nach den Themen suchen."
    ><button
      class="left"
      class:checked={$searchMode === SearchMode.phrase}
      on:mousedown={() => searchMode.set(SearchMode.phrase)}>Text</button
    ></Tooltip
  >

  <Tooltip
    title="Nur nach Ressourcen suchen, die explizit mit den Themen verlinkt sind."
    ><button
      class="right"
      class:checked={$searchMode === SearchMode.topic}
      on:mousedown={() => searchMode.set(SearchMode.topic)}>Thema</button
    ></Tooltip
  >
</div>

<CatalogLink />

<h2>Darstellung</h2>

<div>
  <Tooltip title="Wie stark hängen zwei Themen voneinander ab"
    ><button
      class="left"
      class:checked={$relationMode === RelationMode.jaccard}
      on:mousedown={() => relationMode.set(RelationMode.jaccard)}
      >Symmetrisch</button
    ></Tooltip
  >

  <Tooltip
    title="Wie stark hängen kleine von ihren verwandten größeren Themen ab"
    ><button
      class="right"
      class:checked={$relationMode === RelationMode.meetMin}
      on:mousedown={() => relationMode.set(RelationMode.meetMin)}
      >Asymmetrisch</button
    ></Tooltip
  >
</div>

<div>
  <Tooltip title="Kanten relativ zur stärksten Verwandtschaft skalieren"
    ><button
      class="left"
      class:checked={$relationContext === RelationContext.relative}
      on:mousedown={() => relationContext.set(RelationContext.relative)}
      >Relativ</button
    ></Tooltip
  >

  <Tooltip title="Kanten relativ zum möglichen Wertebereich skalieren"
    ><button
      class="right"
      class:checked={$relationContext === RelationContext.absolute}
      on:mousedown={() => relationContext.set(RelationContext.absolute)}
      >Absolut</button
    ></Tooltip
  >
</div>

<style>
  input {
    border: none;
    border-bottom: 2px solid lightgray;
    padding: 0 0.5rem;
    outline: none;
    border-radius: 0;
    height: 2.5rem;
    width: auto;
  }

  input:focus {
    border-bottom: 2px solid #404055;
  }

  button {
    border: none;
    border-radius: 0;
    outline: none;
    background: white;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.4px;
  }

  button:hover:not(.checked) {
    background: rgb(245, 245, 245);
    cursor: pointer;
  }

  .checked {
    background: #404055;
    color: white;
  }

  .search {
    white-space: nowrap;
  }

  .query {
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
    padding-right: 2rem;
  }

  .restrict {
    padding-left: 2rem;
    margin-left: calc(-2.5rem - 6px);
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
  }

  .left {
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
  }

  .right {
    margin-left: -3px;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
  }

  .and {
    font-size: 22px;
    font-weight: 300;
    color: grey;
    transform: translateX(-50%);
    background: rgb(245, 245, 245);
    height: calc(2.5rem - 4px);
    width: calc(2.5rem - 4px);
    border-radius: calc(2.5rem - 4px);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    top: 3px;
    left: -4px;
  }
</style>
