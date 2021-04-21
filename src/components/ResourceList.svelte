<script lang="ts">
  import { resources } from '../state/dataAPI';
</script>

<h2>Ressourcen</h2>

<ul>
  {#each $resources as { title, yearPublished, score }}
    <li>[{yearPublished ?? '-'}] {title}</li>
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
  }
</style>
