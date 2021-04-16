<script lang="ts">
  import { scaleLinear, scaleSqrt } from 'd3-scale';
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
  import { query } from '../state/uiState';

  let width = 400;
  let height = 300;

  $: simNodes = [];
  $: simLinks = [];
  $: maxCount = max($graph.nodes, (n) => n.count);

  $: radiusScale = scaleSqrt().domain([0, maxCount]).range([0, 100]);
  // $: edgeWidthScale = scaleLinear()
  //   .domain([0, max($graph.links, (l) => l.weight)])
  //   .range([1, 10]);

  // FORCES
  $: link = forceLink($graph.links)
    .id((d: GraphLink) => d.id)
    .strength(0);

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
    .on('tick', (x) => {
      simNodes = simulation.nodes();
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
    query.set(name);
  }
</script>

<div class="wrapper" bind:clientWidth={width} bind:clientHeight={height}>
  <svg {width} {height} viewBox="{-width / 2} {-height / 2} {width} {height}">
    <g stroke="#999" stroke-opacity={0.6}>
      {#each simLinks as { source, target, weight, type }}
        <line
          class:mentions_name_link={type === LinkType.MENTIONS_NAME_LINK}
          class:mentions_id_link={type === LinkType.MENTIONS_ID_LINK}
          stroke-width={1}
          x1={source.x}
          y1={source.y}
          x2={target.x}
          y2={target.y}
        />
      {/each}
    </g>

    <g>
      {#each simNodes as { id, doc, text, x, y, count, type, r } (id)}
        <g
          transform="translate({x}, {y})"
          class="node"
          class:primary={type === NodeType.primary}
          class:secondary={type === NodeType.secondary}
          class:zeroHits={count === 0}
          class:selected={text === $query}
          on:click={() => handleClick(text)}
        >
          <circle {r} fill="#f00" fill-opacity="0.5" />
          <text
            alignment-baseline="middle"
            font-size="12"
            x={text === $query
              ? 0
              : Math.abs(x) < width / 2
              ? 0
              : Math.sign(x) * (r + 5)}
            y={text === $query ? 0 : Math.sign(y) * (r + 15)}
            text-anchor={text === $query ? 'middle' : x < 0 ? 'end' : 'start'}
            >{text} ({count})</text
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
    fill: transparent;
    stroke: grey;
  }

  text {
    font-size: 14px;
  }

  .secondary text {
    fill: grey;
    font-style: italic;
  }

  .secondary circle {
    fill: black;
    stroke: transparent;
  }

  .selected circle {
    stroke: black;
    stroke-width: 2px;
    fill: white;
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
