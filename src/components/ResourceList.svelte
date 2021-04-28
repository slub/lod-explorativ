<script lang="ts">
  import { resources } from '../state/dataAPI';
  import Tooltip from './Tooltip.svelte';
</script>

<h2>Ressourcen</h2>

<ul>
  {#each $resources as { title, yearPublished, description }}
    <li {title}>
      <Tooltip title={description}>[{yearPublished ?? '-'}] {title}</Tooltip>
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
