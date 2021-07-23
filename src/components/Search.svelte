<script lang="ts">
  import { debounce } from 'lodash';
  import {
    author,
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
    author.set(null);
  }, 500);

  const handleRestrict = debounce((e) => {
    search.setRestrict(e.target.value);
    author.set(null);
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

<h2>Graphdarstellung</h2>

<div>
  <Tooltip
    title="Der Jaccard-Koeffizient als Ähnlichkeitsmaß stellt dar, wie stark sich die Mengen an Titeldaten zweier Themen A und B ÜBERSCHNEIDEN. Der Maximalwert von 1 bedeutet, dass beide Themen immer gemeinsam verwendet werden bzw. alle Titeldaten aus dem Thema A auch dem Thema B angehören und umgegehrt."
    ><button
      class="left"
      class:checked={$relationMode === RelationMode.jaccard}
      on:mousedown={() => relationMode.set(RelationMode.jaccard)}
      >Jaccard</button
    ></Tooltip
  >

  <Tooltip
    title="Das Berechnungsverfahren MeetMin als Ähnlichkeitsmaß stellt dar, wie stark sich die Mengen an Titeldaten zweier Themen A und B ÜBERLAPPEN. Der Maximalwert von 1 bedeutet, dass das kleinere Thema A immer gemeinsam mit B verwendet wird bzw. alle Titeldaten aus dem Thema A auch dem Thema B angehören."
    ><button
      class="right"
      class:checked={$relationMode === RelationMode.meetMin}
      on:mousedown={() => relationMode.set(RelationMode.meetMin)}
      >Meet/Min</button
    ></Tooltip
  >
</div>

<div>
  <Tooltip
    title="Die Kantenstärke wird relativ zum höchsten ermittelten Ähnlichkeitswert skaliert."
    ><button
      class="left"
      class:checked={$relationContext === RelationContext.relative}
      on:mousedown={() => relationContext.set(RelationContext.relative)}
      >Relativ</button
    ></Tooltip
  >

  <Tooltip
    title="Die Kantenstärke wird relativ zum maximal möglichen Ähnlichkeitswert von 1 skaliert."
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
    cursor: pointer;
  }

  button:hover:not(.checked) {
    background: rgb(245, 245, 245);
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
