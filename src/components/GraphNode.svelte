<script lang="ts">
  import { scale } from 'svelte/transition';
  import { NodeType } from '../types/app';
  import type { GraphNode } from '../types/app';
  import Label from './Label.svelte';
  import Scatter from './Scatter.svelte';

  const { PRIMARY_NODE, SECONDARY_NODE } = NodeType;

  export let data: GraphNode;
  export let onClick;
  export let handleHover;
  export let handleOut;

  const fillMap = {
    [PRIMARY_NODE]: 'lightgrey',
    [SECONDARY_NODE]: 'black'
  };

  const strokeMap = {
    [PRIMARY_NODE]: 'grey',
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

  $: fill = isSelected
    ? 'white'
    : isHighlighted
    ? 'transparent'
    : fillMap[type];

  $: stroke = isSelected
    ? 'lightgrey'
    : isHighlighted
    ? 'grey'
    : strokeMap[type];

  $: fontWeight = isSelected || isHighlighted ? 'bold' : 'normal';

  $: fontSize = isSelected ? 18 : isHighlighted ? 16 : 14;
</script>

<g transform="translate({x}, {y})" on:click={() => onClick(id, type)}>
  <circle
    {fill}
    {stroke}
    stroke-width={isSelected || isHighlighted ? 4 : 1}
    fill-opacity="0.5"
    {r}
    transition:scale
  />
  {#if dates}
    <Scatter {dates} onMouseEnter={handleHover} onMouseLeave={handleOut} />
  {/if}

  <Label
    x={textX}
    y={textY}
    {type}
    {text}
    {textAnchor}
    fill="dimGrey"
    {fontSize}
    {fontWeight}
    stroke="#f8f8f7"
  />

  {#if !isHighlighted}
    <Label
      {type}
      text={count}
      textAnchor="middle"
      fill="white"
      stroke="grey"
      {fontSize}
      fontWeight="bold"
    />
  {/if}
</g>

<style>
  g {
    cursor: pointer;
  }
</style>
