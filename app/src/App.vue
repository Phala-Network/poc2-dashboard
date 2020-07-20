<template>
  <div id="app" class="app">
    <div class="header">
      <div class="title">
        Phala Network PoC-2 Dashboard
      </div>
      <div class="links">
        <a href="https://phala.network">Home Page</a>
        -
        <a href="https://app.phala.network">Testnet Web Apps</a>
        -
        <a href="https://github.com/Phala-Network">Github</a>
        -
        <a href="https://t.me/phalanetwork">Telegram</a>
      </div>
    </div>

    <div class="container">
      <router-view/>
    </div>

    <div class="footer">
      <div class="footer-copyright">COPYRIGHT © 2020 PHALA NETWORK ALL RIGHTS RESERVED. - Made with love by Phala Network</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
</style>
<style lang="scss">
body {
    font-size: 12px;
    font-family: monospace;
    font-weight: 500;
    color: rgb(13, 143, 52);
}

html, body {
  height: 100%;
  margin: 0;
}

.app {
  min-height: 100%;
  background: #050308 no-repeat center top;
  background-size: cover;
  .container {
    display: flex;
    max-width: 1200px;
    margin: 0 auto;
  }
}

.header {
  padding: 20px;
    text-align: center;
    color: #ddd;
    font-family: monospace;

  .title {
    font-size: 24px;
  }

  .links {
    margin-top: 10px;
    color: rgb(4, 170, 45);
    a {
      color: rgb(4, 170, 45);
    }
  }
}

.footer {
  width: 100%;
  box-sizing: border-box;
  margin-top: 20px;
  padding: 15px 0;
  border-top: 3px solid #1f5f35;
  text-align: center;
}
</style>
