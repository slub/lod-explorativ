<script lang="ts">
  import config from '../config';
  import { query, restrict } from '../state/uiState';
</script>

<a
  href={`${config.catalogURL}%22${$query}%22${$restrict ? '+%22' + $restrict + '%22' : ''}`}
  target="_blank"
  rel="“noopener">
  ↗ In den Katalog wechseln
</a>
