<script lang="ts">
  import LogoSlub from './LogoSlub.svelte';

  export let name = 'title';
</script>

<a href="/explore/"
  ><LogoSlub />
  <h1>{name}</h1></a
>

<style>
  h1 {
    white-space: nowrap;
  }

  a {
    text-decoration: none;
    color: black;
    display: flex;
    align-items: center;
  }
</style>
