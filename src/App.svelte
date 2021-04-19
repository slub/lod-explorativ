<script lang="ts">
  export let name: string;

  import TopicList from './components/TopicList.svelte';
  import SearchInput from './components/SearchInput.svelte';
  import Graph from './components/Graph.svelte';
  import Title from './components/Title.svelte';
  import Suggestions from './components/Suggestions.svelte';
  import Layout from './components/Layout.svelte';
  import Navigation from './components/Navigation.svelte';
  import Stats from './components/Stats.svelte';
  import Histogram from './components/Histogram.svelte';
  import ResourceList from './components/ResourceList.svelte';
</script>

<Layout>
  <div class="header" slot="header">
    <Title {name} />
    <Navigation />
  </div>
  <div slot="left">
    <SearchInput />
    <Suggestions />
    <Stats />
  </div>
  <Graph slot="main" />
  <Histogram slot="bottom" />
  <ResourceList slot="right" />
</Layout>

<!-- <TopicList /> -->
<style>
  .header {
    display: flex;
    align-items: baseline;
  }
</style>
