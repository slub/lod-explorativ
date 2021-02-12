<script lang="ts">
  import { query } from "../UIState";

  function handleChange(e) {
    query.set(e.target.value);
  }
</script>

<input
  type="text"
  placeholder="Nach Thema suchen..."
  bind:value={$query}
  on:input={handleChange}
/>
