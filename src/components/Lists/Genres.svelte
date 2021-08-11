<script lang="ts">
  import { fade } from 'svelte/transition';
  import { scaleLinear } from 'd3-scale';
  import { max } from 'd3-array';
  import { genres } from 'state/dataAPI';
  import { formatNumber } from 'utils';

  $: maxCount = max($genres, (x) => x[1]);
  $: scale = scaleLinear().domain([0, maxCount]).range([0, 30]);
</script>

<h2>Medientyp</h2>

<div>
  <table>
    {#each $genres as [name, count], i}
      <tr transition:fade>
        <td class="name" title={name}>{name}</td>
        <td class="count">{formatNumber(count)}</td>
        <td><span class="bar" style="width: {scale(count)}px" /></td>
      </tr>
    {/each}
  </table>
</div>

<!-- in:fade={{ duration: 200, delay: i * 10 }} out:fade={{ duration: 200 }} -->
<style>
  div {
    overflow-y: auto;
    max-height: 25vh;
  }

  table {
    table-layout: fixed;
  }
  td {
    white-space: nowrap;
    border-bottom: 1px solid lightgray;
    padding-right: 1rem;
    max-width: 112px;
  }
  .name {
    width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .count {
    width: 40px;
    text-align: right;
  }
  .bar {
    display: inline-block;
    height: 8px;
    background: #404055;
    transition: width 200ms ease-in-out;
  }

  tr {
    border-bottom: 1px solid #404055;
  }
</style>
