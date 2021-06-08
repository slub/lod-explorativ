<script lang="ts">
  import { fade } from 'svelte/transition';
  import { authors, selectedTopic } from '../state/dataAPI';
  import { author } from '../state/uiState';
  import Tooltip from './Tooltip.svelte';

  function handleClick(name) {
    if (name === $author) {
      author.set(null);
    } else {
      author.set(name);
    }
  }
</script>

{#if $selectedTopic}
  <h2>Top Autoren & Beteiligte</h2>
  {#if $author}
    <div class="filter" on:click={() => author.set(null)}>
      <span class="remove">X</span>
      {$author}
    </div>
    <hr />
  {/if}
  <ul>
    {#each $authors as { person, authorCount, contribCount } (person.id)}
      <li transition:fade>
        <!-- TODO: move birth date create to dataAPI -->
        <Tooltip title={person.occupation.join(', ')}
          ><span on:click={() => handleClick(person.name)}
            >[{authorCount || '-'}/{contribCount || '-'}] {person.name}</span
          ></Tooltip
        >
      </li>
    {/each}
  </ul>
{/if}

<style>
  ul {
    list-style: none;
    padding: 0;
  }

  .remove {
    font-weight: bold;
  }

  .filter:hover {
    cursor: pointer;
  }

  li {
    margin-bottom: 0.25rem;
    border-bottom: 1px solid lightgray;
    padding-bottom: 0.25rem;
    /* max-height: 120px; */
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
