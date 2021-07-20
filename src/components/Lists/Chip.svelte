<script lang="ts">
  export let name = '';
  export let color = '#E5E5E5';
</script>

<span style="background: {color}">{name}</span>

<style>
  span {
    padding: 2px;
    border-radius: 4px;
    padding: 1px 8px;
  }
</style>
