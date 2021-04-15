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

  let simulation;
  let radiusScale;
  let edgeWidthScale;

  $: simNodes = <GraphNode[]>[];
  $: simLinks = <GraphLink[]>[];

  graph.subscribe(async ({ links, nodes }) => {
    console.log(nodes, links);
    const maxCount = max(nodes, (n) => n.count);

    radiusScale = scaleSqrt().domain([0, maxCount]).range([0, 100]);

    edgeWidthScale = scaleLinear()
      .domain([0, max(links, (l) => l.weight)])
      .range([1, 10]);

    const link = forceLink(links).id((d: GraphLink) => d.id);
    // .distance(300);
    // .strength((d: GraphLink) =>
    //   d.type === LinkType.MENTIONS_ID_LINK ? 1 : 0
    // )
    // .distance((d: GraphLink) =>
    //   d.type === LinkType.MENTIONS_ID_LINK ? 100 : 400
    // );

    // Create simulation
    simulation = forceSimulation(nodes)
      .force('link', link)
      .force(
        'charge',
        forceManyBody(-300).strength((d: GraphNode) =>
          d.type === NodeType.primary ? -10 : -400
        )
        // .distanceMax(200)
      )
      .force(
        'collide',
        forceCollide()
          .strength(0.1)
          .radius((d: GraphNode) => Math.max(radiusScale(d.count) * 2, 20))
          .iterations(3)
      )
      .force('x', forceX())
      .force('y', forceY())
      .force('center', forceCenter())
      .force(
        'radial',
        forceRadial((d: GraphNode) => (d.text === $query ? 0 : height / 2))
      );

    simulation.on('tick', (x) => {
      simNodes = simulation.nodes();
      simLinks = link.links();
    });
  });

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
      {#each simNodes as { id, doc, text, x, y, count, type } (id)}
        <g
          transform="translate({x}, {y})"
          class="node"
          class:primary={type === NodeType.primary}
          class:secondary={type === NodeType.secondary}
          class:zeroHits={count === 0}
          class:selected={text === $query}
          on:click={() => handleClick(text)}
        >
          <circle r={radiusScale(count)} fill="#f00" fill-opacity="0.5" />
          <!-- TODO: do not call function radiusScale(count) twice -->
          <text font-size="12" x={radiusScale(count) + 5}>{text} ({count})</text
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
