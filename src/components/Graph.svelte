<script lang="ts">
  import * as d3 from 'd3';
  import { countBy, flatten, uniqBy } from 'lodash';
  import { topicsEnriched } from '../state/dataAPI';

  export let width = window.innerWidth;
  export let height = window.innerHeight - 200;

  let simulation;

  topicsEnriched.subscribe(async (value) => {
    const topics = await value;

    const maxCount = topics.map((t) => t.aggregationsLoose?.docCount);
    const radiusScale = d3
      .scaleSqrt()
      .domain([0, d3.max(maxCount)])
      .range([5, 40]);

    const allNodes = [];
    const links = [];

    // TODO: move graph generation to dataAPI
    topics.forEach((primary) => {
      const primaryNode = {
        id: primary.id,
        radius: radiusScale(primary.aggregationsLoose?.docCount),
        doc: primary,
        type: 'primary',
        text: primary.name
      };

      allNodes.push(primaryNode);

      primary.related.forEach((_, related) => {
        const secNode = {
          id: related['@id'],
          radius: 5,
          doc: related,
          type: 'secondary',
          text: related.preferredName
        };

        const link = {
          id: `${primaryNode.id}-${secNode.id}`,
          source: primaryNode.id,
          target: secNode.id
        };

        allNodes.push(secNode);
        links.push(link);
      });
    });

    const uniqNodes = uniqBy(allNodes, 'id');

    console.log(uniqNodes);

    // TODO: add link force
    const link = d3.forceLink(links).id((d) => d.id);
    // .distance(600);

    simulation = d3
      .forceSimulation(uniqNodes)
      .force('link', link)
      .force('charge', d3.forceManyBody().strength(-400))
      .force(
        'collide',
        d3
          .forceCollide()
          .strength(0.1)
          .radius((d) => d.radius + 5)
          .iterations(3)
      )
      .force('x', d3.forceX())
      .force('y', d3.forceY());

    simulation.on('tick', (x) => {
      simNodes = simulation.nodes();
      simLinks = link.links();
    });
  });

  $: simNodes = [];
  $: simLinks = [];
</script>

<div>
  <svg {width} {height} viewBox="{-width / 2} {-height / 2} {width} {height}">
    <g stroke="#999" stroke-opacity={0.6}>
      {#each simLinks as { source, target, value }}
        <line
          stroke-width={2}
          x1={source.x}
          y1={source.y}
          x2={target.x}
          y2={target.y}
        />
      {/each}
    </g>

    <g>
      {#each simNodes as { id, doc, text, x, y, radius, type } (id)}
        <g transform="translate({x}, {y})">
          <circle
            class:primary={type === 'primary'}
            class:secondary={type === 'secondary'}
            class:zeroHits={doc.aggregationsLoose?.docCount === 0}
            r={radius}
            fill="#f00"
            fill-opacity="0.5"
          />
          <text font-size="12" x="10"
            >{text}
            {doc.aggregationsLoose
              ? ` (${doc.aggregationsLoose?.docCount})`
              : ''}</text
          >
        </g>
      {/each}
    </g>
  </svg>
</div>

<style>
  .primary {
    fill: red;
  }
  .secondary {
    fill: blue;
  }
  .zeroHits {
    fill: #333;
  }
</style>
