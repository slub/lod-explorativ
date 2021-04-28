<script lang="ts">
  export let name: string;

  import SearchInput from './components/SearchInput.svelte';
  import Graph from './components/Graph.svelte';
  import Title from './components/Title.svelte';
  import Suggestions from './components/Suggestions.svelte';
  import Layout from './components/Layout.svelte';
  import Navigation from './components/Navigation.svelte';
  import Stats from './components/Stats.svelte';
  import Histogram from './components/Histogram.svelte';
  import ResourceList from './components/ResourceList.svelte';
  import AuthorList from './components/AuthorList.svelte';
</script>

<Layout>
  <div class="header" slot="header">
    <Title {name} />
    <Navigation />
  </div>
  <svelte:fragment slot="left">
    <SearchInput />
    <Suggestions />
    <Stats />
  </svelte:fragment>
  <Graph slot="main" />
  <Histogram slot="bottom" />
  <svelte:fragment slot="right">
    <ResourceList />
    <AuthorList />
  </svelte:fragment>
</Layout>

<!-- <TopicList /> -->
<style>
  .header {
    display: flex;
    align-items: baseline;
  }
</style>
