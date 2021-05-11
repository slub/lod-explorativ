<script lang="ts">
  import { forceSimulation, forceLink, forceRadial } from 'd3-force';
  import type { GraphLink } from 'types/app';
  import { graph } from '../state/dataAPI';
  import { query } from '../state/uiState';

  let width = 400;
  let height = 300;

  let simNodes = [];
  let simLinks = [];

  let status = 'finished';
  let update = true;

  let radialStrength = 0.5;
  let linkStrength = 0.5;
  let radius = 300;
  let enableLinks = true;

  $: shortSide = Math.min(width, height);

  $: color = !!shortSide && randomColor();

  const simulation = forceSimulation()
    .on('tick', () => {
      status = 'running';
      if (update) {
        simNodes = nodes;
        simLinks = links;
      }
    })
    .on('end', () => {
      status = 'finished';
    });

  $: nodes = $graph.nodes.map((n) => {
    const prev = nodes.find((x) => x.text === n.text);
    const x = prev?.x;
    const y = prev?.y;

    return {
      ...n,
      x,
      y,
      r: n.id === $query ? 50 : 5,
      color
    };
  });
  $: links = !!nodes && $graph.links.map((l) => ({ ...l }));

  $: simulation.nodes(nodes);

  $: link = enableLinks
    ? forceLink(links)
        .id((d: GraphLink) => {
          return d.id;
        })
        .strength(linkStrength)
    : null;

  $: radial = forceRadial(radius).strength(radialStrength);

  $: simulation.force('link', link);
  $: simulation.force('radial', radial);

  $: if (width || height) {
    refresh();
  }

  function refresh() {
    simulation.alpha(1);
    simulation.restart();
  }

  function randomColor() {
    const r = Math.round(Math.random() * 255);
    const g = Math.round(Math.random() * 255);
    const b = Math.round(Math.random() * 255);

    return `rgb(${r},${g},${b})`;
  }
</script>

<div class="wrapper" bind:clientWidth={width} bind:clientHeight={height}>
  <div class="control">
    <div>{width}x{height}</div>
    <div>short: {shortSide}</div>
    <div>color: <span style="background: {color}">{color}</span></div>
    <div>graphNodes: {$graph.nodes.length}</div>
    <div>graphLinks: {$graph.links.length}</div>
    <div>nodes: {nodes.length}</div>
    <div>links: {links.length}</div>
    <div>simNodes: {simNodes.length}</div>
    <div>simLinks: {simLinks.length}</div>
    <div>status: {status}</div>
    <div>update: {update.toString()}</div>

    <div>
      Enable links
      <input
        type="checkbox"
        bind:checked={enableLinks}
        on:change={refresh}
        min="0"
        max="1"
        step="0.1"
      />
    </div>
    <div>
      Radial strength: {radialStrength}
      <input
        type="range"
        bind:value={radialStrength}
        on:change={refresh}
        min="0"
        max="1"
        step="0.1"
      />
    </div>
    <div>
      Link strength: {linkStrength}
      <input
        type="range"
        bind:value={linkStrength}
        on:change={refresh}
        min="0"
        max="1"
        step="0.1"
      />
    </div>
    <div>
      radius: {radius}
      <input
        type="range"
        bind:value={radius}
        on:change={refresh}
        min="0"
        max="500"
        step="10"
      />
    </div>

    <button
      on:mousedown={() => {
        if (link.links().length > 0) {
          link.links([]);
        } else {
          link.links(links);
        }
        refresh();
      }}>remove links</button
    >
  </div>
  <svg {width} {height} viewBox="{-width / 2} {-height / 2} {width} {height}">
    <g>
      {#each simLinks as { source, target }}
        <line
          x1={source.x}
          y1={source.y}
          x2={target.x}
          y2={target.y}
          stroke={source.color}
        />
      {/each}
    </g>

    <g>
      {#each simNodes as { id, x, y, color, r } (id)}
        <g transform="translate({x}, {y})">
          <circle {r} fill={color} />
        </g>
      {/each}
    </g>
  </svg>
</div>

<style>
  .wrapper {
    height: 100%;
  }

  .control {
    position: absolute;
    background: rgba(255, 255, 255, 0.8);
    padding: 0.5rem;
    z-index: 10;
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
</style>
