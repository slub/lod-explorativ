<script lang="ts">
  import LogoSlub from './LogoSlub.svelte';

  export let name = 'title';
</script>

<a href="/explore/" class="title"
  ><LogoSlub />
  <h1>{name}</h1></a
>

<a href="/">← API Dokumentation</a>

<style>
  h1 {
    white-space: nowrap;
  }

  .title {
    text-decoration: none;
    display: flex;
    align-items: center;
  }
</style>
