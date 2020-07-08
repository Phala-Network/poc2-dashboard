const mysql_js: any = require('./mysql_js.js');

export function query(node_name: string): any {
  const sql = "select * from kanban.node where node_name = '" + node_name + "'";
  return mysql_js.execute(sql);
}

export function insert_node(id: number, nodeDetails: any, nodeStats: any, location: any, connectedAt: number) {
  let [ node_name, node_impl, node_version ] = nodeDetails;
  let [ peer_count] = nodeStats;
  let city: any;
  if (location)
    [, , city] = location;
  else 
    city = '';
  let now = new Date().getTime()/1000;

  let result = query(node_name);

  let sql: any;
  if (result.length == 0) {
    //console.log('insert node...');
    sql = "insert into kanban.node(node_id, node_name, node_impl, node_version, peer_count, city, timestamp, created_or_updated, online) ";
    sql += "values(" + id.toString() + ", '" + node_name + "', '" + node_impl + "', '" + node_version + "', " + peer_count + ", '" + city + "', " + (connectedAt/1000).toString() + ", " + now.toString() +", 1)";
    let ret = mysql_js.execute(sql);
    if (ret) {
      insert_online(node_name, 1, now);
    }
  } else {
    let online = result[0].online;
    let last_update = result[0].created_or_updated;
    
    if (online == 0 || now - last_update > 60*5) {
      //console.log('update node...');
      sql = "update kanban.node set"
      sql += " node_id = " + id.toString();
      sql += ", node_impl = '" + node_impl +"'";
      sql += ", node_version = '" + node_version +"'";
      sql += ", city = '" + city +"'";
      sql += ", peer_count = " + peer_count;
      if (online == 0) {
        sql += ", timestamp = " + (connectedAt/1000).toString();
        sql += ", online = 1";
      }
      sql += ", created_or_updated = " + now.toString();
      sql += " where node_name = '" + node_name + "'";
      
      let ret = mysql_js.execute(sql);
      if (online == 0 && ret) {
        insert_online(node_name, 1, now);
      }
    }
  }
}

export function delete_node(node_name: string) {
  let now = new Date().getTime()/1000;

  let sql = "update kanban.node set online = 0, created_or_updated = " + now.toString() + " where node_name = '" + node_name + "'";
  let ret = mysql_js.execute(sql);
  if (ret) {
    insert_online(node_name, 0, now);
  }
}

function insert_online(node_name: string, online: number, now: number) {
  let sql = "insert kanban.online(node_name, online, timestamp) values('" + node_name + "', " + online.toString() + ", " + now.toString() + ")";
  mysql_js.execute(sql);
}
