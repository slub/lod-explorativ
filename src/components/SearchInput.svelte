<script lang="ts">
  import { debounce } from 'lodash';
  import {
    query,
    searchMode,
    queryExtension,
    SearchMode
  } from '../state/uiState';

  const handleChange = debounce((e) => {
    query.set(e.target.value);
  }, 500);

  const handleMode = (e) => {
    searchMode.set(e.target.value);
  };
</script>

<input
  type="text"
  placeholder="Nach Thema suchen..."
  value={$query}
  on:input={handleChange}
/>

{#if $queryExtension}
  <div>
    & {$queryExtension}
    <button on:click={() => queryExtension.set(null)}>entfernen</button>
  </div>
{/if}

<div>
  <input
    type="radio"
    id="text"
    name="mode"
    value={SearchMode.phrase}
    checked={$searchMode === SearchMode.phrase}
    on:change={handleMode}
  />
  <label for="text">Text</label>

  <input
    type="radio"
    id="thema"
    name="mode"
    value={SearchMode.topic}
    checked={$searchMode === SearchMode.topic}
    on:change={handleMode}
  />
  <label for="thema">Thema</label>
</div>

<style>
  input {
    border: none;
    border-bottom: 2px solid black;
    padding: 0.5rem 0.25rem;
  }

  label {
    display: inline-block;
  }
</style>
