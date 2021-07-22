<script>
  import { formatNumber } from 'utils';

  import Label from './Label.svelte';

  export let count;
  export let fontSize;
  export let strokeWidth = 4;
  export let stroke = '#404055';
  export let fill = 'white';
</script>

<Label
  {fontSize}
  {stroke}
  {strokeWidth}
  {fill}
  text={formatNumber(count)}
  textAnchor="middle"
  fontWeight="bold"
/>
