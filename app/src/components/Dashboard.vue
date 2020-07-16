<template>
  <div class="dashboard">
    <section class="section-data">
      <div class="th">
        <span class="th-tee"><input type="checkbox" v-model="disp_tee" @click="set_tee">only tee</span>
        <span class="th-gatekeeper"><input type="checkbox" v-model="disp_gatekeeper" @click="set_gatekeeper">only gatekeeper</span>
        <span class="th-status"><input type="checkbox" v-model="disp_online" @click="set_online">only online</span>
        <span class="th-status"><input type="checkbox" v-model="disp_offline" @click="set_offline">only offline</span>
      </div>
      <div class="data-header">
        <div class="data-tab tab-status">Status</div>
        <div class="data-tab tab-role">Role</div>
        <div class="data-tab tab-name ">Node Name</div>
        <div class="data-tab tab-account">Phala Address</div>
        <div class="data-tab tab-city">City</div>
        <div class="data-tab tab-era">Node Eras</div>
        <div class="data-tab tab-era">Gatekeeper Eras</div>
        <div class="data-tab tab-era">Slashed Eras</div>
        <div class="data-tab tab-time">Connect at</div>
      </div>

      <div class="data-table">
        <div class="tbody">
          <div v-for="item in filteredData" v-bind:key="item.id" class="tr">
            <div class="td td-status" v-bind:class="{ 'td td-status-offline': item.online === 0 || item.online == null, 'td-v td-status': item.online === 1 && item.id == null }">{{ item.online === 1 ? "Online":"Offline" }}</div>
            <div class="td td-role" v-bind:class="{ 'td-v td-role': item.id == null }">
              <span v-if="item.is_gatekeeper">{{ "Gk" }}</span>
              <span v-else-if="item.is_tee && !item.is_gatekeeper">{{ "TEE" }}</span>
              <span v-else-if="item.id != null">{{ "Node" }}</span>
              <span v-else>{{ "" }}</span>
            </div>
            <div class="td td-name" v-bind:class="{ 'td-v td-name': item.id == null }">{{ item.node_name }}</div>
            <div class="td td-account" v-bind:class="{ 'td-v td-account-v': item.id == null }">{{ item.controller?item.controller:"" }}</div>
            <div class="td td-city" v-bind:class="{ 'td-v td-city': item.id == null }">{{ item.city }}</div>
            <div class="td td-num" v-bind:class="{ 'td-v td-num': item.id == null }">{{ item.node_eras?item.node_eras:"" }}</div>
            <div class="td td-num" v-bind:class="{ 'td-v td-num': item.id == null }">{{ item.gatekeeper_eras?item.gatekeeper_eras:0 }}</div>
            <div class="td td-num" v-bind:class="{ 'td-v td-num': item.id == null }">{{ item.slash_eras?item.slash_eras:0 }}</div>
            <div class="td td-timestamp" v-bind:class="{ 'td-v td-timestamp': item.id == null }">{{ get_date_str(item.timestamp) }}</div>
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
      filteredData: [],
      disp_tee: false,
      disp_gatekeeper: false,
      disp_online: false,
      disp_offline: false
    }
  },

  methods: {
    set_tee: function () {
      this.disp_tee = !this.disp_tee
      if (this.disp_tee) {
        this.disp_gatekeeper = false
      }
      this.filter_data()
    },

    set_gatekeeper: function () {
      this.disp_gatekeeper = !this.disp_gatekeeper
      if (this.disp_gatekeeper) {
        this.disp_tee = false
      }
      this.filter_data()
    },

    set_online: function () {
      this.disp_online = !this.disp_online
      if (this.disp_online) {
        this.disp_offline = false
      }
      this.filter_data()
    },

    set_offline: function () {
      this.disp_offline = !this.disp_offline
      if (this.disp_offline) {
        this.disp_online = false
      }
      this.filter_data()
    },

    filter_data: function () {
      let that = this
      let data = that.nodeData

      that.filteredData = []
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
          if (data[i].is_tee && data[i].is_tee === 1 && (!data[i].is_gatekeeper || (data[i].is_gatekeeper && data[i].is_gatekeeper === 0))) {
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
          if (data[i].online === 0 || data[i].online == null) {
            tmp.push(data[i])
          }
        }

        data = tmp
      }

      for (let i in data) {
        if (data.id == null) {
          data[i].controller = data[i].b_controller
        }
      }
      that.filteredData = data
    },

    get_date_str: function (timestamp) {
      if (timestamp === null || timestamp.length === 0) {
        return ''
      }

      return new Date(timestamp * 1000).toLocaleString('en-US')
    }
  },

  mounted () {
    const that = this
    const test = false
    const fetchData = function () {
      if (!test) {
        const now = new Date().getTime() / 1000
        that.$http.get('/nodes').then((res) => {
          if (res.data.status === 'ok') {
            // filter nodes in offline for 1 era (6 hours)
            const tmp = res.data.result
            that.nodeData = []
            for (let i in tmp) {
              if (tmp[i].online === 0 && now - tmp[i].created_or_updated > 6 * 3600) {
                continue
              }
              that.nodeData.push(tmp[i])
            }

            that.filter_data()
          }
        })
      } else {
        let data = []
        const node1 = JSON.parse('{"id":8877,"node_id":0,"node_name":"EPC-8 | 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY","node_impl":"Parity Polkadot","node_version":"0.8.13-90d5dbe5-x86_64-linux-gnu","city":"Piscataway","peer_count":25,"timestamp":1593741094,"online":1,"created_or_updated":1594350191,"controller":"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY","stash":"5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY","is_tee":1,"slash_eras":3,"is_gatekeeper":1,"gatekeeper_eras":1,"node_eras":0}')
        const node2 = JSON.parse('{"id":8878,"node_id":1,"node_name":"P2P_ORG - P2P Validator 41","node_impl":"Parity Polkadot","node_version":"0.8.13-90d5dbe5-x86_64-linux-gnu","city":"Helsinki","peer_count":50,"timestamp":1593690597,"online":1,"created_or_updated":1594350191,"controller":null,"stash":null,"is_tee":null,"slash_eras":null,"is_gatekeeper":null,"gatekeeper_eras":null,"node_eras":null}')
        const node3 = JSON.parse('{"id":8879,"node_id":2,"node_name":"Huobi Wallet","node_impl":"Parity Polkadot","node_version":"0.8.10-183848b6-x86_64-linux-gnu","city":"Tokyo","peer_count":25,"timestamp":1592465823,"online":0,"created_or_updated":1594350191,"controller":null,"stash":null,"is_tee":null,"slash_eras":null,"is_gatekeeper":null,"gatekeeper_eras":null,"node_eras":null}')
        const node4 = JSON.parse('{"id":8880,"node_id":253,"node_name":"novanode","node_impl":"Parity Polkadot","node_version":"0.8.10-183848b6-x86_64-linux-gnu","city":"","peer_count":21,"timestamp":1594349499,"online":0,"created_or_updated":1594351976,"controller":null,"stash":null,"is_tee":1,"slash_eras":null,"is_gatekeeper":0,"gatekeeper_eras":null,"node_eras":null}')
        const node5 = JSON.parse('{"id":8881,"node_id":4,"node_name":"?????????? ?????? 02","node_impl":"Parity Polkadot","node_version":"0.8.13-90d5dbe5-x86_64-linux-gnu","city":"Toronto","peer_count":88,"timestamp":1594297810,"online":1,"created_or_updated":1594350191,"controller":null,"stash":null,"is_tee":null,"slash_eras":null,"is_gatekeeper":null,"gatekeeper_eras":null,"node_eras":null}')
        data.push(node1)
        data.push(node2)
        data.push(node3)
        data.push(node4)
        data.push(node5)
        for (let i = 0; i < 40; i++) {
          data.push(node1)
        }

        that.nodeData = data
        that.filter_data()
      }
    }
    fetchData()
    window.setInterval(fetchData, 60 * 1000)
  }
}
</script>
<style scoped>
::-webkit-scrollbar{
  width: 5px;
  background: none;
}

::-webkit-scrollbar-thumb{
  border-radius:5px;
  background-color: rgb(4, 170, 45);
}
</style>
<style lang="scss" scoped>
.dashboard {
  max-width: 1280px;
  .section-data {
    width: 100%;
    min-height: 750px;
    box-sizing: border-box;
    margin-top: 10px;
    margin-bottom: 30px;
    float: left;
    background: rgba(53, 53, 56, 0.75);
    box-shadow: 0px 2px 6px 0px rgba(19, 13, 51, 0.5);
    border-radius: 8px;
    border: 1px solid rgba(80, 70, 128, 0.5);

    .th {
      width: 100%;
      display: flex;
      height: 40px;
      line-height: 40px;
      background-color: #b48503;
      color: #f9fafa;
      border-radius: 8px 8px 0 0;
    }

    .th-tee {
      width: 100px;
    }

    .th-gatekeeper {
      width: 150px;
    }

    .th-status {
      width: 120px;
    }

    .data-header {
      position: relative;
      display: flex;
      height: 50px;
      line-height: 48px;
      border-bottom: 1px solid rgba(207, 206, 214, 0.5);
      background-repeat: no-repeat;
      background-position: -11px -11px;
      background-size: 346px 20px;
      background:linear-gradient(180deg,rgb(2, 109, 47) 0%,rgb(4, 170, 45) 100%);
      .data-tab {
        font-size: 13px;
        font-weight: 400;
        color: rgb(215, 214, 221);
        text-align: center;
      }

      .tab-status {
        width: 60px;
      }

      .tab-role {
        width: 50px;
      }

      .tab-name {
        width: 280px;
      }

      .tab-account {
        width: 200px;
      }

      .tab-era {
        width: 115px;
        word-wrap: false;
      }

      .tab-city {
        width: 140px;
      }

      .tab-time {
        width: 180px;
      }

      .tab-rewards {
        width: 90px;
      }
    }

    .data-table {
      font-size: 14px;
      font-weight: 500;

      .tbody {
        height: 700px;
        margin-right: 3px;
        overflow-y: scroll;
      }

      .tr {
        width: 100%;
        display: flex;
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

        .td-v {
          flex: 1;
          color: #54eb0e;
          text-align: left;
        }

        .td-status {
          width: 60px;
          flex: none;
        }

        .td-status-offline {
          width: 60px;
          flex: none;
          color: rgb(226, 76, 76);
        }

        .td-role {
          width: 50px;
          flex: none;
        }

        .td-name {
          overflow: hidden;
          width: 280px;
          margin-left: 10px;
          flex: none;
          white-space: nowrap;
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

        .td-account-v {
          overflow: hidden;
          width: 200px;
          margin-left: 10px;
          flex: none;
          color: #54eb0e;
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
          width:105px;
          flex: none;
        }

        .td-timestamp {
          width:180px;
          flex: none;
        }

        .td-rewards {
          text-align: left;
          width:80px;
          flex: none;
        }
      }

      .td {
        flex: 1;
        color: #f9fafa;
        text-align: left;
      }
    }
  }
}
</style>
