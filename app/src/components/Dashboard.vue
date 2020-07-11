<template>
  <div class="dashboard">
    <section class="section-data">
      <div class="data-header">
        <div class="data-tab">Status</div>
        <div class="data-tab">Node Name</div>
        <div class="data-tab">Phala Address</div>
        <div class="data-tab">City</div>
        <div class="data-tab">Node Eras</div>
        <div class="data-tab">Gatekeeper Eras</div>
        <div class="data-tab">Connect at</div>
        <div class="data-tab">Rewards</div>
      </div>

      <div class="data-table">
        <div class="th">
          <div class="td"><input type="checkbox" v-model="disp_tee">only tee</div>
          <div class="td-gatekeeper"><input type="checkbox" v-model="disp_gatekeeper">only gatekeeper</div>
          <div class="td"><input type="checkbox" v-model="disp_online" @click="set_online">only online</div>
          <div class="td"><input type="checkbox" v-model="disp_offline" @click="set_offline">only offline</div>
          <div class="td">&nbsp;</div>
          <div class="td">&nbsp;</div>
          <div class="td">&nbsp;</div>
          <div class="td">&nbsp;</div>
        </div>
        <div class="tbody">
          <div v-for="item in nodeData" v-bind:key="item.id" class="tr">
            <div class="td td-status">{{ item.online === 1 ? "Online":"Offline" }}</div>
            <div class="td td-name">{{ item.node_name }}</div>
            <div class="td td-account">{{ item.controller?item.controller:"" }}</div>
            <div class="td td-city">{{ item.city }}</div>
            <div class="td td-num">{{ item.node_eras?item.node_eras:0 }}</div>
            <div class="td td-num">{{ item.gatekeeper_eras?item.gatekeeper_eras:0 }}</div>
            <div class="td td-timestamp">{{ get_date_str(item.timestamp) }}</div>
            <div class="td td-num">0</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'Dashboard',
  data () {
    return {
      nodeData: [],
      disp_tee: false,
      disp_gatekeeper: false,
      disp_online: false,
      disp_offline: false
    }
  },

  methods: {
    set_online: function () {
      this.disp_online = !this.disp_online
      if (this.disp_online) {
        this.disp_offline = false
      }
    },

    set_offline: function () {
      this.disp_offline = !this.disp_offline
      if (this.disp_offline) {
        this.disp_online = false
      }
    },

    process_data: function (data) {
      let that = this

      that.nodeData = []
      let tmp = []
      if (that.disp_gatekeeper) {
        for (let i in data) {
          if (data[i].is_gatekeeper && data[i].is_gatekeeper === 1) {
            tmp.push(data[i])
          }
        }

        data = tmp
        tmp = []
      }

      if (that.disp_tee) {
        for (let i in data) {
          if (data[i].is_tee && data[i].is_tee === 1) {
            tmp.push(data[i])
          }
        }

        data = tmp
        tmp = []
      }

      if (that.disp_online) {
        for (let i in data) {
          if (data[i].online === 1) {
            tmp.push(data[i])
          }
        }

        data = tmp
        tmp = []
      }

      if (that.disp_offline) {
        for (let i in data) {
          if (data[i].online === 0) {
            tmp.push(data[i])
          }
        }

        data = tmp
      }

      that.nodeData = data
    },

    get_date_str: function (timestamp) {
      let now = new Date()
      let timezone = now.getTimezoneOffset()
      now.setTime(timestamp * 1000 - timezone * 60 * 1000)
      let year = now.getFullYear()
      let month = now.getMonth()
      let day = now.getUTCDay()
      let hour = now.getUTCHours()
      let minute = now.getUTCMinutes()
      // let second = timestamp / 1000 % 60
      if (hour < 10) {
        hour = '0' + hour
      }
      if (minute < 10) {
        minute = '0' + minute
      }

      return year + '-' + month + '-' + day + ' ' + hour + ':' + minute
    }
  },

  mounted () {
    let that = this
    let fetchData = function () {
      /* that.$http.get('/nodes').then((res) => {
        if (res.data.status === 'ok') {
          // console.log(JSON.stringify(res.data.result))
          that.process_data(res.data.result)
        }
      }) */
      let data = []
      const node1 = JSON.parse('{"id":8877,"node_id":0,"node_name":"EPC-8","node_impl":"Parity Polkadot","node_version":"0.8.13-90d5dbe5-x86_64-linux-gnu","city":"Piscataway","peer_count":25,"timestamp":1593741094,"online":1,"created_or_updated":1594350191,"controller":"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY","stash":"5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY","is_tee":1,"tee_score":0,"is_gatekeeper":1,"gatekeeper_eras":1,"node_eras":0}')
      const node2 = JSON.parse('{"id":8878,"node_id":1,"node_name":"P2P_ORG - P2P Validator 41","node_impl":"Parity Polkadot","node_version":"0.8.13-90d5dbe5-x86_64-linux-gnu","city":"Helsinki","peer_count":50,"timestamp":1593690597,"online":1,"created_or_updated":1594350191,"controller":null,"stash":null,"is_tee":null,"tee_score":null,"is_gatekeeper":null,"gatekeeper_eras":null,"node_eras":null}')
      const node3 = JSON.parse('{"id":8879,"node_id":2,"node_name":"Huobi Wallet","node_impl":"Parity Polkadot","node_version":"0.8.10-183848b6-x86_64-linux-gnu","city":"Tokyo","peer_count":25,"timestamp":1592465823,"online":0,"created_or_updated":1594350191,"controller":null,"stash":null,"is_tee":null,"tee_score":null,"is_gatekeeper":null,"gatekeeper_eras":null,"node_eras":null}')
      const node4 = JSON.parse('{"id":8880,"node_id":253,"node_name":"novanode","node_impl":"Parity Polkadot","node_version":"0.8.10-183848b6-x86_64-linux-gnu","city":"","peer_count":21,"timestamp":1594349499,"online":0,"created_or_updated":1594351976,"controller":null,"stash":null,"is_tee":null,"tee_score":null,"is_gatekeeper":null,"gatekeeper_eras":null,"node_eras":null}')
      const node5 = JSON.parse('{"id":8881,"node_id":4,"node_name":"?????????? ?????? 02","node_impl":"Parity Polkadot","node_version":"0.8.13-90d5dbe5-x86_64-linux-gnu","city":"Toronto","peer_count":88,"timestamp":1594297810,"online":1,"created_or_updated":1594350191,"controller":null,"stash":null,"is_tee":null,"tee_score":null,"is_gatekeeper":null,"gatekeeper_eras":null,"node_eras":null}')
      data.push(node1)
      data.push(node2)
      data.push(node3)
      data.push(node4)
      data.push(node5)
      for (let i = 0; i < 40; i++) {
        data.push(node1)
      }

      that.process_data(data)
    }
    fetchData()
    window.setInterval(fetchData, 5000)
  }
}
</script>
<style scoped>
::-webkit-scrollbar{
  width: 6px;
  background: none;
}

::-webkit-scrollbar-thumb{
  border-radius:5px;
  background-color: #b48503;
}
</style>
<style lang="scss" scoped>
.dashboard {
  .section-data {
    width: 100%;
    min-height: 1000px;
    box-sizing: border-box;
    margin-top: 10px;
    margin-bottom: 50px;
    float: left;
    background: rgba(53, 53, 56, 0.75);
    box-shadow: 0px 2px 6px 0px rgba(19, 13, 51, 0.5);
    border-radius: 8px;
    border: 1px solid rgba(80, 70, 128, 0.5);

    .data-header {
      position: relative;
      display: flex;
      height: 62px;
      line-height: 60px;
      border-bottom: 1px solid rgba(80, 70, 128, 0.5);
      background-repeat: no-repeat;
      background-position: -11px -11px;
      background-size: 346px 20px;
      background:linear-gradient(180deg,rgb(2, 109, 47) 0%,rgb(4, 170, 45) 100%);
      border-radius: 8px 8px 0 0;
      // background-image: url(../assets/img/home_data_header.png);
      .data-tab {
        margin: 0 20px;
        font-size: 13px;
        font-weight: 400;
        color: rgb(215, 214, 221);
      }
    }

    .data-table {
      font-size: 14px;
      font-weight: 500;

      .tbody {
        height: 900px;
        margin-right: 3px;
        overflow-y: scroll;
      }

      .tr,
      .th {
        width: 100%;
        display: flex;
      }

      .th {
        height: 40px;
        line-height: 40px;
        background-color: #b48503;
        color: #f9fafa;
      }

      .td-gatekeeper {
        width: 150px;
      }

      .tr {
        position: relative;
        height: 32px;
        line-height: 27px;
        background-color: #656468;

        &:nth-child(odd) {
          background-color: rgba(53, 53, 56, 0.75);
        }

        .td {
          flex: 1;
          color: #f9fafa;
          text-align: left;
        }

        .td-status {
          width: 60px;
          flex: none;
        }

        .td-name {
          overflow: hidden;
          width: 280px;
          margin-left: 10px;
          flex: none;
        }

        .td-account {
          overflow: hidden;
          width: 200px;
          margin-left: 10px;
          flex: none;
          color: rgb(129, 220, 243);
          text-decoration: none;
          &:hover {
            cursor: pointer;
          }
        }

        .td-city {
          overflow: hidden;
          width: 150px;
          margin-left: 10px;
          flex: none;
        }

        .td-num {
          text-align: center;
          width:80px;
        }

        .td-timestamp {
          width:180px;
        }
      }

      .td {
        flex: 1;
        color: #f9fafa;
        text-align: left;
      }

      .td-block-href {
        color: rgb(148, 135, 216);
        text-decoration: none;
        &:hover {
          cursor: pointer;
        }
      }

      .td-block-href-light {
        color: #C9C3E6;
        text-decoration: none;
        &:hover {
          cursor: pointer;
        }
      }

      .th-td-player {
        flex: none;
        width: 140px;
        padding: 0 40px;
      }

      .td-player {
        flex: none;
        width: 140px;
        padding: 0 40px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>
