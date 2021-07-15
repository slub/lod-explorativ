<div class="layout">
  <div class="header"><slot name="header">Header</slot></div>
  <div class="left"><slot name="left">left</slot></div>
  <div class="center"><slot name="main">content</slot></div>
  <div class="right"><slot name="right">right</slot></div>
  <div class="bottom"><slot name="bottom">bottom</slot></div>
</div>

<style>
  .layout {
    height: 100vh;
    display: grid;
    overflow: hidden;
    grid-template-columns: minmax(300px, 1fr) 3fr minmax(400px, 1fr);
    grid-template-rows: 10vh 70vh 20vh;
    grid-template-areas:
      'header header header'
      'left center right'
      'left bottom right';
  }

  .layout div {
    /* border: 1px solid rgba(147, 232, 238, 0.5); */
    padding: 2rem;
  }

  .header {
    grid-area: header;
  }

  .left {
    grid-area: left;
  }

  .center {
    grid-area: center;
  }

  .right {
    grid-area: right;
  }

  .bottom {
    grid-area: bottom;
  }
</style>
