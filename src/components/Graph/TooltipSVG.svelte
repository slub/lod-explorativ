<script lang="ts">
  import { fade } from 'svelte/transition';

  export let text;
  export let title = '';
  export let x = 0;
  export let y = 0;
</script>

{#if text}
  <div in:fade out:fade class="tooltip" style="top:{y}px; left:{x}px;">
    <h3>{title}</h3>
    <div>{text}</div>
  </div>
{/if}

<style>
  .tooltip {
    box-shadow: 1px 1px 1px lightgray;
    background: white;
    border-radius: 4px;
    padding: 1rem 0.5rem;
    position: absolute;
    pointer-events: none;
    transform: translate(-50%, -100%);
    max-width: 300px;
  }
</style>
