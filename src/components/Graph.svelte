<script lang="ts">
  import { scale, draw } from 'svelte/transition';
  import { scaleSqrt, scaleLinear } from 'd3-scale';
  import { max } from 'd3-array';
  import {
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCollide,
    forceX,
    forceY,
    forceCenter,
    forceRadial
  } from 'd3-force';
  import type { GraphNode, GraphLink } from 'types/app';
  import { LinkType, NodeType } from 'types/app';
  import { graph } from '../state/dataAPI';
  import { query, queryExtension } from '../state/uiState';

  const { PRIMARY_NODE, SECONDARY_NODE, AUTHOR_NODE } = NodeType;

  let width = 400;
  let height = 300;

  $: shortSide = Math.min(width, height);
  $: simNodes = [];
  $: simLinks = [];
  $: maxCount = max($graph.nodes, (n) => n.count);

  $: radiusScale = scaleSqrt().domain([0, maxCount]).range([0, 100]);
  $: edgeWidthScale = scaleLinear()
    .domain([0, max($graph.links, (l) => l.weight)])
    .range([1, 10]);

  // FORCES
  $: link = forceLink($graph.links)
    .id((d: GraphLink) => d.id)
    .strength(0);

  $: radial = forceRadial((d: GraphNode) => {
    return d.type === PRIMARY_NODE ? shortSide * 0.5 : shortSide * 0.45;
  }); //.strength(0.1);

  let collide = forceCollide()
    .strength(0.1)
    .radius((d: GraphNode) => Math.max(radiusScale(d.count) * 2, 20))
    .iterations(3);
  let charge = forceManyBody(-300).strength((d: GraphNode) =>
    d.type === PRIMARY_NODE ? -10 : -400
  );
  let x = forceX();
  let y = forceY();
  let center = forceCenter();

  // SIMULATION

  $: simulation = forceSimulation().on('tick', () => {
    simNodes = simulation.nodes().map((node) => {
      const { r, x, y, text } = node;
      const isSelected = text === $query;
      return {
        ...node,
        x: isSelected ? 0 : x,
        y: isSelected ? 0 : y,
        textX: isSelected
          ? 0
          : Math.abs(x) < width / 2
          ? 0
          : Math.sign(x) * (r + 5),
        textY: isSelected ? 24 : Math.sign(y) * (r + 15),
        textAnchor: isSelected ? 'middle' : x < 0 ? 'end' : 'start'
      };
    });
    simLinks = link.links();
  });
  // .stop();

  // add radius to nodes
  $: newNodes = $graph.nodes.map((n) => {
    // restore previous node position
    const prev = newNodes.find((x) => x.text === n.text);
    const x = prev?.x || undefined;
    const y = prev?.y || undefined;
    const vx = prev?.vx || undefined;
    const vy = prev?.vy || undefined;
    return {
      ...n,
      x,
      y,
      vx,
      vy,
      r: n.id === $query ? shortSide * 0.4 : radiusScale(n.count)
    };
  });

  // ADD FORCES
  $: simulation.nodes(newNodes);
  $: simulation.force('collide', collide);
  // $: simulation.force('link', link);
  $: simulation.force('radial', radial);
  // $: simulation.force('y', y)
  // $: simulation.force('x', x)
  // $: simulation.force('center', center)
  // $: simulation.force('charge', charge)

  $: if (newNodes || width || height) {
    simulation.alpha(1);
    simulation.restart();
  }

  function handleClick(name) {
    // reset query extension
    if (name === $query) {
      queryExtension.set(null);
      // refinement query becomes primary query
    } else if (name === $queryExtension) {
      query.set(name);
      queryExtension.set(null);
    } else {
      queryExtension.set(name);
    }
  }
</script>

<div class="wrapper" bind:clientWidth={width} bind:clientHeight={height}>
  <svg {width} {height} viewBox="{-width / 2} {-height / 2} {width} {height}">
    <g stroke="#999" stroke-opacity={0.6}>
      {#each simLinks as { source, target, weight, type }}
        <line
          class:mentions_name_link={type === LinkType.MENTIONS_NAME_LINK}
          class:mentions_id_link={type === LinkType.MENTIONS_ID_LINK}
          stroke-width={edgeWidthScale(weight)}
          x1={source.x}
          y1={source.y}
          x2={target.x}
          y2={target.y}
          transition:draw
        />
      {/each}
    </g>

    <g>
      {#each simNodes as { id, doc, text, x, y, count, type, r, textX, textY, textAnchor } (id)}
        <g
          transform="translate({x}, {y})"
          class="node {type}"
          class:zeroHits={count === 0}
          class:selected={text === $query}
          class:highlight={text === $queryExtension}
          on:click={() => handleClick(id)}
          out:scale={{ duration: 300 }}
        >
          <circle {r} in:scale={{ duration: 500 }} />
          <!-- Halo -->
          <text
            alignment-baseline="middle"
            font-size="14"
            x={textX}
            y={textY}
            text-anchor={textAnchor}
            stroke-width={6}
            stroke="white"
            stroke-opacity={0.7}
            fill="transparent"
            stroke-linecap="butt"
            stroke-linejoin="miter">{text}</text
          >
          <!-- Label -->
          <text
            alignment-baseline="middle"
            font-size="14"
            x={textX}
            y={textY}
            text-anchor={textAnchor}
            fill="dimGrey"
            font-style={type === PRIMARY_NODE ? 'normal' : 'italic'}
            >{text}</text
          >
          {#if type !== AUTHOR_NODE}
            <!-- Count Halo -->
            <text
              alignment-baseline="middle"
              font-size="14"
              text-anchor="middle"
              font-weight="bold"
              fill="transparent"
              stroke-linecap="butt"
              stroke-linejoin="miter"
              stroke-width={4}
              stroke="grey">{count}</text
            >
            <!-- Count -->
            <text
              alignment-baseline="middle"
              font-size="14"
              text-anchor="middle"
              font-weight="bold"
              fill="white"
              fill-opacity={1}>{count}</text
            >
          {/if}
        </g>
      {/each}
    </g>
  </svg>
</div>

<style>
  .wrapper {
    height: 100%;
  }

  svg {
    overflow: visible;
    position: absolute;
    left: 0;
    top: 0;
  }
  .node :hover {
    cursor: pointer;
  }

  circle {
    fill-opacity: 0.5;
  }
  .PRIMARY_NODE circle {
    fill: lightgray;
    stroke: grey;
  }

  .SECONDARY_NODE circle {
    fill: black;
    stroke: transparent;
  }

  .AUTHOR_NODE circle {
    fill: white;
    stroke-dasharray: 2 2;
    stroke: black;
  }

  .selected circle {
    stroke: lightgrey;
    stroke-width: 4px;
    fill: white;
    fill-opacity: 0.6;
  }

  .highlight circle {
    stroke: lightgrey;
    fill: rgb(221, 135, 120);
    stroke-width: 0;
    fill-opacity: 0.3;
  }

  .selected text {
    font-size: 18px;
    font-weight: bold;
  }
  .zeroHits {
    opacity: 0.2;
  }

  .mentions_name_link {
    stroke: black;
    stroke-opacity: 0.1;
    /* stroke-dasharray: 8 4; */
  }

  .mentions_id_link {
    stroke: red;
    stroke-width: 1;
    /* stroke-opacity: 0; */
  }
</style>
