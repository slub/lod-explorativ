<script lang="ts">
  export let name: string;

  import TopicList from './components/TopicList.svelte';
  import SearchInput from './components/SearchInput.svelte';
  import Graph from './components/Graph.svelte';
  import Title from './components/Title.svelte';
  import Suggestions from './components/Suggestions.svelte';
  import Layout from './components/Layout.svelte';
</script>

<main>
  <Layout>
    <Title slot="header" {name} />
    <div slot="left">
      <SearchInput />
      <Suggestions />
    </div>
    <Graph slot="main" />
  </Layout>

  <!-- <TopicList /> -->
</main>

<style>
</style>
