<script lang="ts">
  import { scaleLinear, scaleSqrt } from 'd3-scale';
  import { max } from 'd3-array';
  import {
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCollide,
    forceX,
    forceY
  } from 'd3-force';
  import type { GraphNode, GraphLink } from 'types/app';
  import { LinkType, NodeType } from 'types/app';
  import { graph } from '../state/dataAPI';
  import { query } from '../state/uiState';

  export let width = window.innerWidth;
  export let height = window.innerHeight - 200;

  let simulation;
  let radiusScale;
  let edgeWidthScale;

  $: simNodes = <GraphNode[]>[];
  $: simLinks = <GraphLink[]>[];

  graph.subscribe(async (value) => {
    const { links, nodes } = await value;

    radiusScale = scaleSqrt()
      .domain([0, max(nodes, (n) => n.count)])
      .range([5, 40]);

    edgeWidthScale = scaleLinear()
      .domain([0, max(links, (l) => l.weight)])
      .range([1, 10]);

    console.log('node extent', radiusScale.domain());
    console.log('link extent', edgeWidthScale.domain());

    // TODO: add link force
    const link = forceLink(links)
      .id((d: GraphLink) => d.id)
      .distance(75);

    // Create simulation
    simulation = forceSimulation(nodes)
      .force('link', link)
      .force(
        'charge',
        forceManyBody().strength((d: GraphNode) =>
          d.type === NodeType.primary ? -10 : -400
        )
      )
      .force(
        'collide',
        forceCollide()
          .strength(0.1)
          .radius((d: GraphNode) => (d.type === NodeType.secondary ? 30 : 100))
          .iterations(3)
      )
      .force('x', forceX())
      .force('y', forceY());

    simulation.on('tick', (x) => {
      simNodes = simulation.nodes();
      simLinks = link.links();
    });
  });

  function handleClick(name) {
    query.set(name);
  }
</script>

<div>
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
          on:click={() => handleClick(text)}
        >
          <circle r={radiusScale(count)} fill="#f00" fill-opacity="0.5" />
          <text font-size="12" x="10"
            >{text}{#if count}
              ({count})
            {/if}</text
          >
        </g>
      {/each}
    </g>
  </svg>
</div>

<style>
  .node :hover {
    cursor: pointer;
  }
  .primary circle {
    fill: red;
  }

  .primary text {
    font-size: 14px;
    font-weight: bold;
  }

  .secondary circle {
    fill: blue;
  }
  .zeroHits circle {
    fill: #333;
  }

  .mentions_name_link {
    stroke: black;
    stroke-dasharray: 4 6;
  }

  .mentions_id_link {
    stroke: black;
    stroke-width: 2;
    stroke-opacity: 0.025;
  }
</style>
