<script lang="ts">
  import { fade } from 'svelte/transition';
  import { authors } from '../state/dataAPI';
  import Tooltip from './Tooltip.svelte';
</script>

<h2>Top Autoren</h2>

<ul>
  {#each $authors as [author, count] (author['@id'])}
    <li transition:fade>
      <!-- TODO: move birth date create to dataAPI -->
      <Tooltip title={author.hasOccupation?.map((o) => o.name).join(', ')}
        >[{count}] {author.preferredName} // {author.birthDate
          ? new Date(author.birthDate['@value']).getFullYear() || '-'
          : '-'}</Tooltip
      >
    </li>
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    padding: 0;
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
