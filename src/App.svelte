<script lang="ts">
  export let name: string;

  import SearchInput from './components/SearchInput.svelte';
  import Graph from './components/Graph.svelte';
  import Title from './components/Title.svelte';
  import Layout from './components/Layout.svelte';
  import Navigation from './components/Navigation.svelte';
  import Stats from './components/Genres.svelte';
  import Histogram from './components/Histogram.svelte';
  import ResourceList from './components/ResourceList.svelte';
  import AuthorList from './components/AuthorList.svelte';
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
