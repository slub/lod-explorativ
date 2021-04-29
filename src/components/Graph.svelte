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

  let width = 400;
  let height = 300;

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
    .strength(0.1);

  $: radial = forceRadial((d: GraphNode) =>
    d.text === $query
      ? 0
      : d.type === NodeType.secondary
      ? null
      : Math.min(width, height) / 2
  ).strength(0.1);

  let collide = forceCollide()
    .strength(0.1)
    .radius((d: GraphNode) => Math.max(radiusScale(d.count) * 2, 20))
    .iterations(3);
  let charge = forceManyBody(-300).strength((d: GraphNode) =>
    d.type === NodeType.primary ? -10 : -400
  );
  let x = forceX();
  let y = forceY();
  let center = forceCenter();

  // SIMULATION

  $: simulation = forceSimulation()
    .on('tick', () => {
      simNodes = simulation.nodes().map((node) => {
        const { r, x, y, text } = node;
        return {
          ...node,
          textX:
            text === $query
              ? 0
              : Math.abs(x) < width / 2
              ? 0
              : Math.sign(x) * (r + 5),
          textY: text === $query ? 24 : Math.sign(y) * (r + 15),
          textAnchor: text === $query ? 'middle' : x < 0 ? 'end' : 'start'
        };
      });
      simLinks = link.links();
    })
    .stop();

  $: n = $graph.nodes.map((n) => ({ ...n, r: radiusScale(n.count) }));

  // ADD FORCES
  $: simulation.nodes(n);
  $: simulation.force('collide', collide);
  $: simulation.force('link', link);
  $: simulation.force('radial', radial);
  // $: simulation.force('y', y)
  // $: simulation.force('x', x)
  // $: simulation.force('center', center)
  // $: simulation.force('charge', charge)

  $: if ($graph || width || height) {
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
          class="node"
          class:primary={type === NodeType.primary}
          class:secondary={type === NodeType.secondary}
          class:zeroHits={count === 0}
          class:selected={text === $query}
          class:highlight={text === $queryExtension}
          on:click={() => handleClick(text)}
          in:scale={{ duration: 1000 }}
          out:scale={{ duration: 300 }}
        >
          <circle {r} fill="#f00" fill-opacity="0.5" />
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
            font-style={type === NodeType.primary ? 'normal' : 'italic'}
            >{text}</text
          >
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
  .primary circle {
    fill: lightgray;
    stroke: grey;
  }

  .secondary circle {
    fill: black;
    stroke: transparent;
  }

  .selected circle {
    stroke: lightgrey;
    stroke-width: 2px;
    fill: rgb(161, 216, 209);
  }

  .highlight circle {
    stroke: lightgrey;
    fill: rgb(163, 216, 161);
    stroke-width: 2px;
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
