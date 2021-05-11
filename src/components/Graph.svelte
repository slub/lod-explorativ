<script lang="ts">
  import { spring } from 'svelte/motion';
  import { forceSimulation, forceLink, forceRadial } from 'd3-force';
  import type { GraphLink } from 'types/app';
  import { graph } from '../state/dataAPI';
  import { query } from '../state/uiState';
  import pannable from '../pannable';

  let width = 400;
  let height = 300;

  let simNodes = [];
  let simLinks = [];

  let status = 'finished';

  let enableRadial = true;
  let radialStrength = 0.5;
  let radiusFrac = 1;

  let enableLinks = true;
  let linkStrength = 0.5;

  $: radius = Math.round((Math.min(width, height) / 2) * radiusFrac);

  ///////////////////////////////////////////////////////
  // SIMULATION: NODES & LINKS
  ///////////////////////////////////////////////////////

  const simulation = forceSimulation()
    .on('tick', () => {
      status = 'running';
      simNodes = nodes;
      simLinks = links;
    })
    .on('end', () => {
      status = 'finished';
    });

  // Simulation nodes
  $: nodes = $graph.nodes.map((n) => {
    // check previous node position
    const prev = nodes.find((x) => x.text === n.text);
    const x = prev?.x;
    const y = prev?.y;

    return {
      ...n,
      x,
      y,
      r: n.id === $query ? 50 : 5
    };
  });

  // Simulation links, update links if nodes change
  $: links = !!nodes && $graph.links.map((l) => ({ ...l }));

  // Update simulation nodes
  $: simulation.nodes(nodes);

  ///////////////////////////////////////////////////////
  // FORCES
  ///////////////////////////////////////////////////////
  $: linkForce = enableLinks
    ? forceLink(links)
        .id((d: GraphLink) => {
          return d.id;
        })
        .strength(linkStrength)
    : null;

  $: radialForce = enableRadial
    ? forceRadial(radius).strength(radialStrength)
    : null;

  $: simulation.force('link', linkForce);
  $: simulation.force('radial', radialForce);

  $: if (width || height) {
    refresh();
  }

  function refresh() {
    simulation.alpha(1);
    simulation.restart();
  }

  const coords = spring(
    { x: 0, y: 0 },
    {
      stiffness: 0.2,
      damping: 0.4
    }
  );

  function handlePanMove(event) {
    coords.update(($coords) => ({
      x: $coords.x + event.detail.dx,
      y: $coords.y + event.detail.dy
    }));
  }
</script>

<div class="wrapper" bind:clientWidth={width} bind:clientHeight={height}>
  <div class="control" style="transform:translate({$coords.x}px,{$coords.y}px)">
    <div class="pan" use:pannable on:panmove={handlePanMove}>↔</div>
    <div>size: {width} x {height}</div>
    <div>nodes: {nodes.length}</div>
    <div>links: {links.length}</div>
    <div
      class="status"
      style="background: {status === 'running' ? 'orange' : 'green'}"
    >
      status: {status}
    </div>

    <div class="force_container">
      <input type="checkbox" bind:checked={enableRadial} on:change={refresh} />
      Radial strength: {radialStrength}
      <input
        type="range"
        bind:value={radialStrength}
        on:change={refresh}
        min="0"
        max="1"
        step="0.1"
      />
      radius: {radius}
      <input
        type="range"
        bind:value={radiusFrac}
        on:change={refresh}
        min="0"
        max="1"
        step="0.1"
      />
      <div />
    </div>
    <div class="force_container">
      <input type="checkbox" bind:checked={enableLinks} on:change={refresh} />
      Link strength: {linkStrength}
      <input
        type="range"
        bind:value={linkStrength}
        on:change={refresh}
        disabled={!enableLinks}
        min="0"
        max="1"
        step="0.1"
      />
    </div>
  </div>
  <svg {width} {height} viewBox="{-width / 2} {-height / 2} {width} {height}">
    <g>
      {#each simLinks as { source, target }}
        <line
          x1={source.x}
          y1={source.y}
          x2={target.x}
          y2={target.y}
          stroke="#000"
        />
      {/each}
    </g>

    <g>
      {#each simNodes as { id, x, y, r } (id)}
        <g transform="translate({x}, {y})">
          <circle {r} fill="#000" />
        </g>
      {/each}
    </g>
  </svg>
</div>

<style>
  .wrapper {
    height: 100%;
  }

  .status {
    color: white;
    padding: 2px 4px;
    display: inline-block;
  }

  .control {
    position: absolute;
    background: rgba(255, 255, 255, 0.8);
    padding: 0.5rem;
    z-index: 10;
    user-select: none;
  }

  svg {
    overflow: visible;
    position: absolute;
    left: 0;
    top: 0;
  }

  input {
    display: block;
  }

  input[type='checkbox'] {
    display: inline;
  }

  .force_container {
    margin: 2rem 0;
    border-bottom: 1px solid lightgray;
  }

  .pan {
    cursor: grab;
  }
</style>
