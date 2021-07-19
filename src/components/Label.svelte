<script lang="ts">
  import { NodeType } from '../types/app';

  const { PRIMARY_NODE } = NodeType;

  export let text;
  export let x = 0;
  export let y = 0;
  export let fontSize = 14;
  export let fontWeight = 'normal';
  export let fill = 'black';
  export let stroke = 'white';
  export let textAnchor = 'start';
  export let type = PRIMARY_NODE;

  $: sharedProps = {
    x,
    y,
    'dominant-baseline': 'central',
    'font-size': fontSize,
    'text-anchor': textAnchor,
    'font-style': type === PRIMARY_NODE ? 'normal' : 'italic',
    'font-weight': fontWeight
  };
</script>

<!-- Halo -->
<text
  {...sharedProps}
  {stroke}
  stroke-width={4}
  stroke-opacity={0.7}
  fill="transparent"
  stroke-linecap="round"
  stroke-linejoin="bevel">{text}</text
>
<!-- Text -->
<text {...sharedProps} {fill}>{text}</text>
