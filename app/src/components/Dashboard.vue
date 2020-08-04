<template>
  <div class="dashboard">
    <section class="section-data">
      <div class="checks">
        <span><input type="checkbox" v-model="disp_tee" @click="set_tee">TEE Only</span>
        <span><input type="checkbox" v-model="disp_gatekeeper" @click="set_gatekeeper">Gatekeeper Only</span>
        <span><input type="checkbox" v-model="disp_online" @click="set_online">Online Only</span>
        <span><input type="checkbox" v-model="disp_offline" @click="set_offline">Offline Only</span>
      </div>

      <table>
        <thead>
          <tr>
            <th class="data-tab tab-status">Status</th>
            <th class="data-tab tab-role">Role</th>
            <th class="data-tab tab-name ">Node</th>
            <th class="data-tab tab-account">Addr</th>
            <th v-if="false" class="data-tab tab-city">City</th>
            <th class="data-tab tab-era">Online Eras</th>
            <th class="data-tab tab-era">Gatekeeper Eras</th>
            <th class="data-tab tab-era">Slashed Eras</th>
            <th v-if="false" class="data-tab tab-time">Connect at</th>
            <th>Node Points</th>
            <th>GK Points</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredData" v-bind:key="item.id" class="tr">
            <td class="td-status" v-bind:class="{ 'text-alert': item.online === 0 || item.online == null, 'text-hilight td-status': item.online === 1 && item.id == null }">
              {{ item.online === 1 ? "Online":"Offline" }}
            </td>
            <td class="td-role" v-bind:class="{ 'text-hilight td-role': item.id == null }">
              <span v-if="item.is_gatekeeper">{{ "GK" }}</span>
              <span v-else-if="item.is_tee && !item.is_gatekeeper">{{ "TEE" }}</span>
              <span v-else-if="item.id != null">{{ "Node" }}</span>
              <span v-else>{{ "" }}</span>
            </td>
            <td class="td-name" v-bind:class="{ 'text-hilight td-name': item.id == null }">{{ name_components(item)[0] }}</td>
            <td class="td-account" v-bind:class="{ 'text-hilight': item.id == null || !!item.controller }">
              {{ item.controller ? item.controller : name_components(item)[1] }}
            </td>
            <td class="td-city" v-if="false" v-bind:class="{ 'text-hilight td-city': item.id == null }">{{ item.city }}</td>
            <td class="text-center" v-bind:class="{ 'text-hilight td-num': item.id == null }">{{ item.node_eras>=0?item.node_eras:"" }}</td>
            <td class="text-center" v-bind:class="{ 'text-hilight td-num': item.id == null }">{{ item.gatekeeper_eras?item.gatekeeper_eras:0 }}</td>
            <td class="text-center" v-bind:class="{ 'text-hilight td-num': item.id == null, 'text-alert': item.slash_eras > 0 }">{{ item.slash_eras?item.slash_eras:0 }}</td>
            <td v-if="false" class="td-timestamp" v-bind:class="{ 'text-hilight td-timestamp': item.id == null }">{{ get_date_str(item.timestamp) }}</td>
            <td class="text-center">{{node_points(item)}}<br>{{node_points_perc(item)}}</td>
            <td class="text-center">{{gk_points(item)}}<br>{{gk_points_perc(item)}}</td>
          </tr>
        </tbody>
      </table>
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

  computed: {
    all_node_points () {
      return this.filteredData
        .filter(item => item.controller || this.name_components(item)[1])
        .map(item => this.node_points(item))
        .reduce((x, a) => a + x, 0)
    },
    all_gk_points () {
      return this.filteredData
        .filter(item => item.controller || this.name_components(item)[1])
        .map(item => this.gk_points(item))
        .reduce((x, a) => a + x, 0)
    }
  },

  methods: {
    node_points (item) {
      const n = item.node_eras
      if (n >= 84) {
        return 200 + 20 * n
      } else if (n >= 56) {
        return 200 + 15 * n
      } else if (n >= 28) {
        return 200 + 10 * n
      } else if (n > 0) {
        return 200
      } else {
        return 0
      }
    },
    gk_points (item) {
      return (
        (item.gatekeeper_eras > 0 ? 200 : 0) +
        (item.gatekeeper_eras >= 28 && item.slash_eras === 0 ? 500 : 0) +
        (item.gatekeeper_eras >= 80 ? 700 : 0))
    },
    node_points_perc (item) {
      const full = this.all_node_points
      if (!full || (!item.controller && !this.name_components(item)[1])) return ''
      const myself = this.node_points(item)
      const percent = (myself / full * 100).toFixed(2)
      return `${percent}%`
    },
    gk_points_perc (item) {
      const full = this.all_gk_points
      if (!full || (!item.controller && !this.name_components(item)[1])) return ''
      const myself = this.gk_points(item)
      const percent = (myself / full * 100).toFixed(2)
      return `${percent}%`
    },
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
    },

    name_components (item) {
      if (!item.node_name) {
        return ['', '']
      }
      const components = item.node_name.split('|').filter(x => !!x.trim())
      if (components.length < 1) {
        return ['', '']
      } else if (components.length === 1) {
        return [components[0], '']
      } else {
        return [components[0], components[1]]
      }
    }
  },

  mounted () {
    const that = this
    const test = false
    // https://poc2-dashboard.phala.network/nodes
    const apiUrl = '/nodes'
    const fetchData = function () {
      if (!test) {
        const now = new Date().getTime() / 1000
        that.$http.get(apiUrl).then((res) => {
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

</style>
<style lang="scss" scoped>
.dashboard {
  font-size: 12px;
  font-family: 'Courier New', Courier, monospace;
  width: 100%;

  .section-data {
    width: 100%;
    padding: 0 20px;
    min-height: 750px;
    box-sizing: border-box;
    margin-top: 10px;
    margin-bottom: 30px;
    float: left;
    background: rgba(53, 53, 56, 0.75);
    .checks {
      width: 100%;
      display: flex;
      height: 40px;
      line-height: 40px;
      color: rgb(4, 170, 45);
      border-bottom: solid #0f0 1px;
      margin-bottom: 10px;
      span {
        margin: 0 10px;
      }
    }
    table {
      width: 100%;

      td:nth-child(1) { width: 7%; }
      td:nth-child(2) { width: 5%; }
      td:nth-child(3) { width: 20%; max-width: 180px; }
      td:nth-child(4) { width: 40%; }
      td:nth-child(5) { width: 5%; }
      td:nth-child(6) { width: 5%; }
      td:nth-child(7) { width: 5%; }
      td:nth-child(8) { width: 5%; }
    }
    thead {
      color: #0f0;
    }
    tbody td {
      text-overflow: ellipsis;
      overflow: hidden;
      word-wrap: break-word;
    }
  }
}

.text-center {
  text-align: center;
}

.text-alert {
  color: rgb(255, 20, 20);
}

.text-hilight {
  color: #54eb0e;
}

</style>
