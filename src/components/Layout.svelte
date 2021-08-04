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
    grid-template-columns: minmax(300px, 0.5fr) 3fr minmax(400px, 1fr);
    grid-template-rows: 10vh 75vh 15vh;
    grid-template-areas:
      'header header header'
      'left center right'
      'left bottom right';
  }

  .header,
  .left,
  .center,
  .right,
  .bottom {
    padding: 2rem;
  }

  .header {
    grid-area: header;
  }

  .left {
    grid-area: left;
    z-index: 3;
    padding-right: 4rem;
    background: linear-gradient(
      to right,
      rgba(248, 248, 247, 1) 0 calc(100% - 4rem),
      rgba(248, 248, 247, 0)
    );
  }

  .center {
    grid-area: center;
  }

  .right {
    grid-area: right;
    z-index: 3;
    padding-left: 4rem;
    background: linear-gradient(
      to left,
      rgba(248, 248, 247, 1) 0 calc(100% - 4rem),
      rgba(248, 248, 247, 0)
    );
  }

  .bottom {
    grid-area: bottom;
  }
</style>
