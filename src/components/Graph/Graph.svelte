<script lang="ts">
  import { scaleSqrt, scaleLinear } from 'd3-scale';
  import { max, extent } from 'd3-array';
  import {
    forceSimulation,
    forceLink,
    forceRadial,
    forceCollide,
    forceManyBody
  } from 'd3-force';
  import { flatten, map } from 'lodash';
  import { graph, selectedTopic } from 'state/dataAPI';
  import { RelationMode, relationMode, search } from 'state/uiState';
  import Node from './Node.svelte';
  import Link from './Link.svelte';
  import Label from './Label.svelte';
  import LabelCount from './LabelCount.svelte';
  import TooltipSvg from './TooltipSVG.svelte';
  import { NodeType } from 'types/app';
  import type { GraphLink, GraphNode, GraphDot } from 'types/app';
  import { areEqual } from 'utils';

  const { PRIMARY_NODE } = NodeType;

  let width = 400;
  let height = 300;

  let tooltip = [0, 0];
  let tooltipTxt = '';

  // data from dataAPI
  let nodes = [];
  let selectedNode;
  let unselectedNodes = [];

  // data that will be continuously updated on simulation tick events
  let simNodes = [];
  let simLinks = [];
  let simSelectedNode;
  let simUnselectedNodes = [];

  // forces
  const radialStrength = 0.1;
  const linkStrength = 0;
  const manyBodyStrength = -200;

  $: query = $search.query;
  $: restrict = $search.restrict;

  // dimensions
  $: shortSide = Math.min(width, height);
  $: radius = Math.round(shortSide / 2);

  // reactive variables for the scales
  $: maxCount = max(
    $graph.nodes.filter((d) => !areEqual(d.id, query)),
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
    .domain([0, $relationMode === RelationMode.jaccard ? 0.5 : 1])
    .range([0, 10]);

  $: histoScale = scaleLinear()
    .domain(yearExtent)
    .range([0.1 * Math.PI, 1.9 * Math.PI]);

  $: colorScale = scaleLinear()
    .domain(yearExtent)
    .range(['#6A8AFB', '#F05E84']);

  ///////////////////////////////////////////////////////
  // SIMULATION: NODES & LINKS
  ///////////////////////////////////////////////////////

  const simulation = forceSimulation().on('tick', () => {
    // update label orientation
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const { r, x, y, isSelected, isHighlighted } = node;
      const isSH = isSelected || isHighlighted;

      node.textX = isSH
        ? 0
        : Math.abs(x) < width / 2
        ? 0
        : Math.sign(x) * (r + 5);
      node.textY = isSH ? 0 : Math.sign(y) * (r + 15);
      node.textAnchor = isSH ? 'middle' : x < 0 ? 'end' : 'start';
    }

    // Trigger update
    simNodes = nodes;
    simSelectedNode = selectedNode;
    simUnselectedNodes = unselectedNodes;
    simLinks = links;
  });

  $: if ($graph.nodes) {
    const newNodes = $graph.nodes.map((n) => {
      /// restore previous node position
      const prev = nodes.find((x) => x.id === n.id);
      const isSelected = areEqual(n.text, query);
      const isHighlighted = areEqual(n.text, restrict);
      const r = isSelected ? radius : radiusScale(n.count);

      const dates = n.datePublished?.map(({ year, count }) => {
        const pos = histoScale(year);
        const dr = radiusScale(count);
        const x = Math.sin(pos);
        const y = -Math.cos(pos);
        const dot: GraphDot = {
          year,
          count,
          dx: x * r,
          dy: y * r,
          dr,
          dc: colorScale(year)
        };

        return dot;
      });

      const graphNode: GraphNode = {
        ...n,
        isHighlighted,
        isSelected,
        fx: isSelected ? 0 : undefined,
        fy: isSelected ? 0 : undefined,
        r,
        dates
      };

      if (prev) {
        graphNode.x = prev.x;
        graphNode.y = prev.y;
        graphNode.vx = prev.vx;
        graphNode.vy = prev.vy;
      }

      if (isSelected) selectedNode = graphNode;

      return graphNode;
    });

    nodes = newNodes;
    unselectedNodes = newNodes.filter((n) => !n.isSelected);
  }

  // simulation links, update links if nodes change
  $: links = !!nodes && $graph.links.slice();

  // update simulation
  $: simulation.nodes(nodes);

  ///////////////////////////////////////////////////////
  // FORCES
  ///////////////////////////////////////////////////////

  $: linkForce = forceLink(links)
    .id((d: GraphLink) => d.id)
    .strength(linkStrength);

  $: radialForce = forceRadial()
    .radius((d: GraphNode) => (d.type === PRIMARY_NODE ? 1 : 0.33) * radius)
    .strength(radialStrength);

  let collideForce = forceCollide()
    .strength(0.1)
    .radius((d: GraphNode) => Math.max(radiusScale(d.count), 20));

  let manyBodyForce = forceManyBody().strength(manyBodyStrength);

  $: simulation.force('link', linkForce);
  $: simulation.force('radial', radialForce);
  $: simulation.force('manyBody', manyBodyForce);
  // $: simulation.force('collide', collideForce);

  // re-heat simulation if nodes or dimensions change
  $: if (nodes || width || height) {
    refresh();
  }

  function refresh() {
    simulation.alpha(1);
    simulation.restart();
  }

  function handleClick(name, type) {
    // if outer primary node was clicked -> update primary query
    if (type === PRIMARY_NODE && !areEqual(name, query)) {
      search.setQuery(name);
    }
    // primary selected topic was clicked again -> reset query extension
    else if (areEqual(name, query)) {
      search.setRestrict(null);
      // secondary topic was clicked again -> becomes primary topic
    } else if (areEqual(name, restrict)) {
      search.set({
        query: name,
        restrict: null
      });
      // topic exists, which matches query  -> set primary query to topic name
    } else if (!!$selectedTopic && $selectedTopic.count !== 0) {
      search.setRestrict(name);
    } else {
      search.setQuery(name);
    }
  }

  function handleDateEnter(e) {
    const { x, y, year, count } = e.detail;
    tooltipTxt = `${year}: ${count} Titeldaten`;
    moveTooltip(x, y);
  }

  function handleEnterNode(data) {
    const { x, y, r, description } = data;
    if (description) {
      tooltipTxt = description;
      moveTooltip(x, y - r);
    }
  }

  function moveTooltip(x, y) {
    tooltip = [x + width / 2, y + height / 2 - 8];
  }

  function hideTooltip() {
    tooltipTxt = '';
  }
</script>

<div class="container" bind:clientWidth={width} bind:clientHeight={height}>
  <svg {width} {height} viewBox="{-width / 2} {-height / 2} {width} {height}">
    {#if selectedNode}
      <Node
        data={selectedNode}
        showLabel={false}
        onClick={handleClick}
        on:enterDate={handleDateEnter}
        on:leaveDate={hideTooltip}
      />
    {/if}

    <g>
      {#each simLinks as { source, target, weight, id } (id)}
        <Link
          strokeWidth={edgeWidthScale(weight)}
          x1={source.x}
          y1={source.y}
          x2={target.x}
          y2={target.y}
        />
      {/each}
    </g>

    <g>
      {#each simUnselectedNodes as data (data.id)}
        <Node
          {data}
          onClick={handleClick}
          on:mouseenter={() => handleEnterNode(data)}
          on:mouseleave={hideTooltip}
        />
      {/each}
    </g>

    {#if selectedNode}
      <Label
        y={28}
        text={selectedNode.text}
        textAnchor="middle"
        fontSize={20}
        fontWeight="bold"
        strokeWidth={8}
        fill="#4d4d4d"
      />

      <LabelCount count={selectedNode.count} fontSize={24} strokeWidth={5} />
    {/if}
  </svg>
  <TooltipSvg title={tooltipTxt} x={tooltip[0]} y={tooltip[1]} />
</div>

<style>
  .container {
    height: 100%;
  }

  svg {
    overflow: visible;
    position: absolute;
    left: 0;
    top: 0;
    user-select: none;
  }
</style>
