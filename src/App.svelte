<script lang="ts">
  export let name: string;

  import SearchInput from './components/Search.svelte';
  import Graph from './components/Graph/Graph.svelte';
  import Title from './components/Title.svelte';
  import Layout from './components/Layout.svelte';
  import Navigation from './components/Lists/Navigation.svelte';
  import Stats from './components/Lists/Genres.svelte';
  import ResourceList from './components/Lists/Resources.svelte';
  import AuthorList from './components/Lists/Authors.svelte';
  import Histogram from './components/Histogram.svelte';
  import Notification from './components/Notification.svelte';
</script>

<Layout>
  <Title {name} slot="header" />
  <svelte:fragment slot="left">
    <SearchInput />
    <Navigation />
    <Stats />
  </svelte:fragment>
  <svelte:fragment slot="main">
    <Notification />
    <Graph />
  </svelte:fragment>
  <Histogram slot="bottom" />
  <svelte:fragment slot="right">
    <ResourceList />
    <AuthorList />
  </svelte:fragment>
</Layout>

<style>
</style>
