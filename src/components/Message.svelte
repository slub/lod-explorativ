<script lang="ts">
  export let text: string;
  export let switchToPhrase;
  export let selectAlternate;
  export let removeRestrict;
</script>

<div>{text}</div>
{#if switchToPhrase || selectAlternate || removeRestrict}
  <ul>
    {#if switchToPhrase}
      <li>
        <span class="action" on:click={switchToPhrase}
          >Zur Phrasensuche wechseln</span
        >
      </li>
    {/if}
    {#if removeRestrict}
      <li>
        <span class="action" on:click={removeRestrict}
          >Einschränkung entfernen</span
        >
      </li>
    {/if}
    {#if selectAlternate}
      <li>
        <span class="action" on:click={selectAlternate}
          >Mit ähnlichen Themen fortfahren</span
        >
      </li>
    {/if}
  </ul>
{/if}

<style>
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    margin-top: 1rem;
  }

  .action {
    cursor: pointer;
  }

  .action:hover {
    text-decoration: underline;
  }

  .action::before {
    content: '→ ';
  }
</style>
