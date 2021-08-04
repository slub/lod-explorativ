<script lang="ts">
  import { tweened } from 'svelte/motion';
  import { NodeType } from 'types/app';
  import type { GraphNode } from 'types/app';
  import Label from './Label.svelte';
  import Scatter from './Dots.svelte';
  import LabelCount from './LabelCount.svelte';

  const { PRIMARY_NODE, SECONDARY_NODE } = NodeType;

  export let data: GraphNode;
  export let showLabel = true;
  export let highlight = false;
  export let onClick;

  const fillMap = {
    [PRIMARY_NODE]: '#ebebea',
    [SECONDARY_NODE]: '#404055'
  };

  const strokeMap = {
    [PRIMARY_NODE]: '#d5d5d4',
    [SECONDARY_NODE]: 'transparent'
  };

  $: ({
    id,
    x,
    y,
    r,
    type,
    textX,
    textY,
    textAnchor,
    text,
    isHighlighted,
    isSelected,
    dates,
    count
  } = data);

  $: fill = isSelected ? 'white' : isHighlighted ? '#f8f8f7' : fillMap[type];

  $: stroke = isSelected || isHighlighted ? '#ebebea' : strokeMap[type];

  $: fontWeight = isSelected ? 900 : isHighlighted ? 600 : 400;

  $: fontSize = isHighlighted ? 16 : 14;

  const radius = tweened(0);

  $: if (r) radius.set(r);
</script>

<g
  class:hover={(!isSelected && !isHighlighted) || highlight}
  class:highlight={highlight && !isSelected && !isHighlighted}
  transform="translate({x}, {y})"
  on:click={() => onClick(id, type)}
  on:mouseenter
  on:mouseleave
>
  <circle
    {fill}
    {stroke}
    stroke-width={isSelected || isHighlighted ? 4 : 1}
    fill-opacity={type === SECONDARY_NODE ? 0.9 : 1}
    r={Math.max(0, $radius)}
  />
  {#if dates}
    <Scatter
      {dates}
      isInteractive={isSelected}
      radius={$radius}
      on:enterDate
      on:leaveDate
    />
  {/if}

  {#if showLabel}
    <Label
      x={textX}
      y={textY}
      {text}
      {textAnchor}
      {fontSize}
      {fontWeight}
      fill={isHighlighted ? '#4d4d4d' : undefined}
      on:enterLabel
      on:leaveLabel
    />

    {#if !isHighlighted}
      <LabelCount {count} fontSize={16} />
    {/if}
  {/if}
</g>

<style>
  g {
    cursor: pointer;
  }

  .hover:hover :global(text),
  .highlight :global(text) {
    font-weight: bold;
  }

  .hover:hover circle,
  .highlight circle {
    fill-opacity: 1;
  }
</style>
