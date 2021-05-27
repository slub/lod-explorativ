<script lang="ts">
  import { spring } from 'svelte/motion';
  import { scale, draw, fade } from 'svelte/transition';
  import { scaleSqrt, scaleLinear } from 'd3-scale';
  import { max, extent } from 'd3-array';
  import {
    forceSimulation,
    forceLink,
    forceRadial,
    forceCollide
  } from 'd3-force';
  import { flatten, map } from 'lodash';
  import type { GraphLink, GraphNode } from 'types/app';
  import { LinkType, NodeType } from 'types/app';
  import { graph, selectedTopic } from '../state/dataAPI';
  import { query, queryExtension } from '../state/uiState';
  import pannable from '../pannable';
  import { areEqual } from '../utils';

  const { PRIMARY_NODE, AUTHOR_NODE } = NodeType;

  let width = 400;
  let height = 300;

  let simNodes = [];
  let simLinks = [];

  let status = 'finished';
  const showControl = false;

  let enableRadial = true;
  let radialStrength = 0.1;
  let radiusFrac = 1;

  let enableLinks = true;
  let linkStrength = 0;

  $: shortSide = Math.min(width, height);
  $: radius = Math.round((shortSide / 2) * radiusFrac);
  $: maxCount = max(
    $graph.nodes.filter((d) => !areEqual(d.id, $query)),
    (n) => n.count
  );
  $: yearExtent = extent(
    flatten(map($graph.nodes, (n) => n.datePublished?.map((d) => d.year)))
  );

  ///////////////////////////////////////////////////////
  // SCALES
  ///////////////////////////////////////////////////////
  $: radiusScale = scaleSqrt().domain([0, maxCount]).range([0, 40]);
  $: edgeWidthScale = scaleLinear()
    .domain([0, max($graph.links, (l) => l.weight)])
    .range([1, 10]);
  $: histoScale = scaleLinear()
    .domain(yearExtent)
    .range([0.1 * Math.PI, 1.9 * Math.PI]);
  $: colorScale = scaleLinear().domain(yearExtent).range(['blue', 'red']);

  ///////////////////////////////////////////////////////
  // SIMULATION: NODES & LINKS
  ///////////////////////////////////////////////////////

  const simulation = forceSimulation()
    .on('tick', () => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const { r, x, y, text } = node;
        const isSelected = areEqual(text, $query);
        const isHighlighted = areEqual(text, $queryExtension);
        const isSH = isSelected || isHighlighted;

        node.x = isSelected ? 0 : x;
        node.y = isSelected ? 0 : y;
        node.textX = isSH
          ? 0
          : Math.abs(x) < width / 2
          ? 0
          : Math.sign(x) * (r + 5);
        node.textY = isSH ? 24 : Math.sign(y) * (r + 15);
        node.textAnchor = isSH ? 'middle' : x < 0 ? 'end' : 'start';
      }

      status = 'running';
      simNodes = nodes;
      simLinks = links;
    })
    .on('end', () => {
      status = 'finished';
    });

  // Simulation nodes
  $: nodes = $graph.nodes.map((n) => {
    /// restore previous node position
    const prev = nodes.find((x) => x.text === n.text);
    const x = prev?.x;
    const y = prev?.y;
    const r = areEqual(n.id, $query) ? shortSide * 0.4 : radiusScale(n.count);
    const dates = n.datePublished?.map(({ year, count }) => {
      const pos = histoScale(year);
      const dr = radiusScale(count);
      const x = Math.sin(pos);
      const y = -Math.cos(pos);
      const a = {
        dx: x * r,
        dy: y * r,
        dr,
        dc: colorScale(year)
      };
      return a;
    });

    // let datePath;

    // if (dates) {
    //   const p = path();
    //   const { px, py } = dates[0];
    //   p.moveTo(px, py);
    //   dates.forEach(({ px, py }) => {
    //     p.lineTo(px, py);
    //   });
    //   datePath = p.toString();
    // }

    return {
      ...n,
      x,
      y,
      r,
      dates
      // datePath
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
    ? forceRadial((d: GraphNode) => {
        const frac =
          d.type === PRIMARY_NODE ? 1 : d.type === AUTHOR_NODE ? 0.7 : 0.25;
        return radius * frac;
      }).strength(radialStrength)
    : null;

  let collideForce = forceCollide()
    .strength(0.1)
    .radius((d: GraphNode) => Math.max(radiusScale(d.count), 20))
    .iterations(3);

  $: simulation.force('link', linkForce);
  $: simulation.force('radial', radialForce);
  $: simulation.force('collide', collideForce);

  // re-heat simulation if nodes or dimensions change
  $: if (nodes || width || height) {
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

  function handleClick(name) {
    // reset query extension
    if (areEqual(name, $query)) {
      queryExtension.set(null);
      // refinement query becomes primary query
    } else if (areEqual(name, $queryExtension)) {
      query.set(name);
      queryExtension.set(null);
    } else if (!!$selectedTopic && $selectedTopic.count !== 0) {
      queryExtension.set(name);
    } else {
      query.set(name);
    }
  }
</script>

<div class="wrapper" bind:clientWidth={width} bind:clientHeight={height}>
  {#if showControl}
    <div
      class="control"
      style="transform:translate({$coords.x}px,{$coords.y}px)"
    >
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
        <input
          type="checkbox"
          bind:checked={enableRadial}
          on:change={refresh}
        />
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
  {/if}
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
      {#each simNodes as { id, text, x, y, count, type, r, textX, textY, textAnchor, dates, datePath } (id)}
        <g
          transform="translate({x}, {y})"
          class="node {type}"
          class:zeroHits={count === 0}
          class:selected={areEqual(text, $query)}
          class:highlight={areEqual(text, $queryExtension)}
          on:click={() => handleClick(id)}
          out:scale={{ duration: 300 }}
        >
          <circle class="circle" {r} in:scale={{ duration: 500 }} />
          {#if dates}
            {#each dates as { dx, dy, dr, dc }, i (i)}
              <circle
                r={dr}
                cx={dx}
                cy={dy}
                fill={dc}
                fill-opacity="0.2"
                transition:fade
              />
            {/each}
          {/if}

          <!-- {#if datePath}
            <path
              d={datePath}
              fill="none"
              stroke="lightgrey"
              stroke-width={1}
              transition:draw
            />
          {/if} -->

          <!-- Halo -->
          <!-- FIXME: Firefox vertical alignment -->
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
          {#if type !== AUTHOR_NODE && !areEqual(text, $queryExtension)}
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
    user-select: none;
  }
  .node :hover {
    cursor: pointer;
  }

  .circle {
    fill-opacity: 0.5;
  }
  .PRIMARY_NODE .circle {
    fill: lightgray;
    stroke: grey;
  }

  .SECONDARY_NODE .circle {
    fill: black;
    stroke: transparent;
  }

  .AUTHOR_NODE .circle {
    fill: white;
    stroke-dasharray: 2 2;
    stroke: black;
  }

  .selected .circle {
    stroke: lightgrey;
    stroke-width: 4px;
    fill: white;
    fill-opacity: 0.6;
  }

  .highlight .circle {
    stroke: grey;
    fill: transparent;
    stroke-width: 4px;
  }

  .selected text {
    font-size: 18px;
    font-weight: bold;
  }

  .highlight text {
    font-size: 16px;
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
