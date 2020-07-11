<template>
  <div id="app" class="app">
    <div class="header">
      <div class="header-wrap">
        <router-link class="header-logo-link" to="/">
          <img class="header-logo" src="@/assets/img/logo.png" alt="PHALA LOGO">
        </router-link>
        <div class="header-title">Phala.Network</div>
        <div class="header-sub-title">Blockchain Confidentiality by Trusted Computing</div>
      </div>
    </div>

    <div class="container">
      <router-view/>
    </div>

    <div class="footer">
      <div class="footer-social">
        <a href="https://t.me/phala.network" target="_blank" class="social">
          <img src="@/assets/img/telegram.png" alt="" class="social-icon">
        </a>
        <a href="https://twitter.com/phala_network" target="_blank" class="social">
          <img src="@/assets/img/twitter.png" alt="" class="social-icon">
        </a>
      </div>
      <div class="footer-copyright">COPYRIGHT © 2020 PHALA.LTD ALL RIGHTS RESERVED. - Made with love by Phala.LTD</div>
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
::-webkit-scrollbar {
    width: 6px;
    background: none;
}

::-webkit-scrollbar-thumb {
    border-radius:5px;
    background-color: #02681b;
}

body {
    font-family: "Exo 2", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "PingFang", "Droid Sans", "Helvetica Neue", sans-serif;
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
    width: 100%;
    max-width: 1110px;
    margin: 0 auto 20px;
    padding-top: 130px;
    min-height: calc(150vh - 241px);
    circle {
      -webkit-transition: stroke-dasharray .25s;
      transition: stroke-dasharray .25s;
    }
  }
}

.header {
  position: fixed;
  height: 120px;
  right: 0;
  left: 0;
  z-index: 9;
  transition: all .3s;
  .header-wrap {
    width: 1200px;
    height: 100%;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.header-logo {
  margin-left: 0px;
  transition: width .3s;
  width: 80px;
  height: 80px;
}

.header-logo-link {
  display: block;
  outline: none;

  &:hover {
    cursor: pointer;
  }
}

.header-title {
  font-size: 48px;
  color:rgb(230, 239, 240);
}

.header-sub-title {
  font-size: 24px;
}

.footer {
  width: 100%;
  height: 80px;
  box-sizing: border-box;
  margin-top: 30px;
  padding: 15px 0;
  background:linear-gradient(180deg, #050308 0%,rgb(70, 71, 71) 100%);
  border-top: 3px solid #1f5f35;

  .footer-social {
    display: flex;
    justify-content: center;

    .social {
      margin: 0 30px;
    }
  }

  .footer-copyright {
    margin: 8px 0 0;
    text-align: center;
    font-size: 12px;
    font-weight: 400;
    color: #047727;
  }
}
</style>
