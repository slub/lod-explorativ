<script lang="ts">
  export let name = 'title';

  function handleTitleClick() {
    window.location.href = window.location.origin;
  }
</script>

<h1 on:click={handleTitleClick}>{name}</h1>

<style>
  h1 {
    cursor: pointer;
    margin-right: 15%;
  }
</style>
