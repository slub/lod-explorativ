<script lang="ts">
  import { fade } from 'svelte/transition';
  export let title;
  export let x = 0;
  export let y = 0;
</script>

{#if title !== ''}
  <div in:fade out:fade class="tooltip" style="top:{y - 32}px; left:{x}px;">
    {title}
  </div>
{/if}

<style>
  .tooltip {
    border: 1px solid lightgray;
    box-shadow: 1px 1px 1px lightgray;
    background: white;
    border-radius: 4px;
    padding: 4px;
    position: absolute;
    pointer-events: none;
    transform: translate(-50%);
  }
</style>
