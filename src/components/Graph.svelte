<script lang="ts">
  import * as d3 from 'd3';
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

    const topicNodes = topics.map((t) => ({
      id: t.id,
      radius: radiusScale(t.aggregationsLoose?.docCount),
      doc: t
    }));

    // TODO: add link force
    // const link = d3.forceLink(links).id((d) => d.id);

    simulation = d3
      .forceSimulation(topicNodes)
      // .force('link', link)
      .force('charge', d3.forceManyBody())
      .force(
        'collide',
        d3
          .forceCollide()
          .strength(0.1)
          .radius((d) => d.radius + 75)
          .iterations(3)
      )
      .force('x', d3.forceX())
      .force('y', d3.forceY());

    simulation.on('tick', (x) => {
      simNodes = simulation.nodes();
      // simLinks = link.links();
    });
  });

  $: simNodes = [];
  // $: simLinks = [];
</script>

<div>
  <svg {width} {height} viewBox="{-width / 2} {-height / 2} {width} {height}">
    <!-- <g stroke="#999" stroke-opacity={0.6}>
      {#each simLinks as { source, target, value }}
        <line
          stroke-width={2}
          x1={source.x}
          y1={source.y}
          x2={target.x}
          y2={target.y}
        />
      {/each}
    </g> -->

    <g>
      {#each simNodes as { id, doc, x, y, radius } (id)}
        <g transform="translate({x}, {y})">
          <circle
            class:zeroHits={doc.aggregationsLoose?.docCount === 0}
            r={radius}
            fill="#f00"
            fill-opacity="0.5"
          />
          <text font-size="12"
            >{doc.name} ({doc.aggregationsLoose?.docCount})</text
          >
        </g>
      {/each}
    </g>
  </svg>
</div>

<style>
  .zeroHits {
    fill: #333;
  }
</style>
