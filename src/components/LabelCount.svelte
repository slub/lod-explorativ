<script>
  import { formatNumber } from 'utils';

  import Label from './Label.svelte';

  export let count;
  export let fontSize;
  export let type;
  export let strokeWidth = 4;
  export let stroke = 'dimGrey';
  export let fill = 'white';
</script>

<Label
  {fontSize}
  {type}
  {stroke}
  {strokeWidth}
  {fill}
  text={formatNumber(count)}
  textAnchor="middle"
  fontWeight="bold"
/>
