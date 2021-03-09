<script lang="ts">
  export let name: string;

  import TopicList from './components/TopicList.svelte';
  import SearchInput from './components/SearchInput.svelte';
  import Graph from './components/Graph.svelte';
</script>

<main>
  <h1>{name}</h1>
  <SearchInput />
  <Graph />
  <TopicList />
</main>

<style>
</style>
