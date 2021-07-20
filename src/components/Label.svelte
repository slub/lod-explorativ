<script lang="ts">
  export let text;
  export let x = 0;
  export let y = 0;
  export let fontSize = 14;
  export let strokeWidth = 4;
  export let fontWeight = 'normal';
  export let fill = 'dimGrey';
  export let stroke = '#f8f8f7';
  export let textAnchor = 'start';

  $: sharedProps = {
    x,
    y,
    'dominant-baseline': 'central',
    'font-size': fontSize,
    'text-anchor': textAnchor,
    'font-style': 'normal',
    'font-weight': fontWeight
  };
</script>

<!-- Halo -->
<text
  {...sharedProps}
  {stroke}
  stroke-width={strokeWidth}
  stroke-opacity={0.7}
  fill="transparent"
  stroke-linecap="round"
  stroke-linejoin="bevel">{text}</text
>
<!-- Text -->
<text {...sharedProps} {fill}>{text}</text>
