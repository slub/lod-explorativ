<script lang="ts">
  import type { AdditionalType } from "../Types";

  export let name: string;
  export let additionalTypes: AdditionalType[];
  export let resourcesCount: number;
</script>

<div class="topic">
  {#if additionalTypes}
    {#each additionalTypes as { name }}
      <span class="addType">{name}</span>{" / "}
    {/each}
  {/if}
  <h3>{name} ({resourcesCount})</h3>
</div>

<style>
  .addType {
    color: grey;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 1px;
  }
</style>
