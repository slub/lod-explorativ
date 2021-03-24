<script lang="ts">
  export let name = 'title';

  function handleTitleClick() {
    window.location.href = window.location.origin;
  }
</script>

<h1 class="title" on:click={handleTitleClick}>{name}</h1>

<style>
  .title {
    cursor: pointer;
  }
</style>
