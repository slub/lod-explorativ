<script lang="ts">
  export let name: string;

  import TopicList from './components/TopicList.svelte';
  import SearchInput from './components/SearchInput.svelte';
  import Graph from './components/Graph.svelte';

  let width;
  let height;
</script>

<svelte:window bind:innerWidth={width} bind:innerHeight={height} />

<main>
  <h1>{name}</h1>
  <SearchInput />
  <Graph {width} {height} />
  <TopicList />
</main>

<style>
</style>
