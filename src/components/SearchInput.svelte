<script lang="ts">
  import { debounce } from 'lodash';
  import { query } from '../uiState';

  const handleChange = debounce((e) => {
    query.set(e.target.value);
  }, 500);
</script>

<input
  type="text"
  placeholder="Nach Thema suchen..."
  value={$query}
  on:input={handleChange}
/>
