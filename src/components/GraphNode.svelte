<script lang="ts">
  import { scale } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  import { NodeType } from '../types/app';
  import type { GraphNode } from '../types/app';
  import Label from './Label.svelte';
  import Scatter from './Scatter.svelte';
  import LabelCount from './LabelCount.svelte';
  import { spring } from 'svelte/motion';

  const { PRIMARY_NODE, SECONDARY_NODE } = NodeType;

  export let data: GraphNode;
  export let showLabel = true;
  export let onClick;

  const fillMap = {
    [PRIMARY_NODE]: '#ebebea',
    [SECONDARY_NODE]: 'black'
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

  const radius = spring(0);

  $: if (r) radius.set(r);
</script>

<g
  transform="translate({x}, {y})"
  on:click={() => onClick(id, type)}
  on:mouseenter
  on:mouseleave
>
  <circle
    {fill}
    {stroke}
    stroke-width={isSelected || isHighlighted ? 4 : 1}
    fill-opacity={type === SECONDARY_NODE ? 0.6 : 1}
    r={$radius}
  />
  {#if dates}
    <Scatter {dates} isInteractive={isSelected} on:enterDate on:leaveDate />
  {/if}

  {#if showLabel}
    <Label
      x={textX}
      y={textY}
      {type}
      {text}
      {textAnchor}
      {fontSize}
      {fontWeight}
      fill={isHighlighted ? '#4d4d4d' : undefined}
    />

    {#if !isHighlighted}
      <LabelCount {type} {count} fontSize={16} />
    {/if}
  {/if}
</g>

<style>
  g {
    cursor: pointer;
  }
</style>
