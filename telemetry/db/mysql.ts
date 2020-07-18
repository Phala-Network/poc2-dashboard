const mysql_js: any = require("./mysql_js.js");

export function query(node_name: string): any {
  const sql = "select * from kanban.node where node_name = \"" + node_name + "\"";
  return mysql_js.execute(sql);
}

export function insert_node(id: number, nodeDetails: any, nodeStats: any, location: any, connectedAt: number, now: number) {
  let [ node_name, node_impl, node_version ] = nodeDetails;
  let [ peer_count] = nodeStats;
  let city: any;
  if (location)
    [, , city] = location;
  else 
    city = "";
  
  let result = query(node_name);

  let sql: any;
  if (result.length == 0) {
    //console.log("insert node...");
    let controller = node_name.split('|').slice(-1)[0].trim();
    if (controller != node_name.split('|')[0].trim() && controller.length == 48 && controller.startsWith('5')) {
      sql = "insert into kanban.node(node_id, node_name, node_impl, node_version, peer_count, city, timestamp, created_or_updated, online, controller) ";
      sql += "values(" + id.toString() + ", \"" + node_name + "\", \"" + node_impl + "\", \"" + node_version + "\", " + peer_count + ", \"" + city + "\", " + (connectedAt/1000).toString() + ", " + now.toString() +", 1, \"" + controller + "\")";
    } else {
      sql = "insert into kanban.node(node_id, node_name, node_impl, node_version, peer_count, city, timestamp, created_or_updated, online) ";
      sql += "values(" + id.toString() + ", \"" + node_name + "\", \"" + node_impl + "\", \"" + node_version + "\", " + peer_count + ", \"" + city + "\", " + (connectedAt/1000).toString() + ", " + now.toString() +", 1)";
    }
    let ret = mysql_js.execute(sql);
    if (ret) {
      insert_online(node_name, 1, connectedAt/1000, now);
    }
  } else {
    let online = result[0].online;
    //console.log("update node...");
    sql = "update kanban.node set"
    sql += " node_id = " + id.toString();
    sql += ", node_impl = \"" + node_impl +"\"";
    sql += ", node_version = \"" + node_version +"\"";
    sql += ", city = \"" + city +"\"";
    sql += ", peer_count = " + peer_count;
    if (online == 0) {
      sql += ", timestamp = " + (connectedAt/1000).toString();
      sql += ", online = 1";
    }
    sql += ", created_or_updated = " + now.toString();
    sql += " where node_name = \"" + node_name + "\"";
    
    let ret = mysql_js.execute(sql);
    if (online == 0 && ret) {
      insert_online(node_name, 1, connectedAt/1000, now);
    }
  }
}

export function mark_node_offlined(node_name: string) {
  let now = new Date().getTime()/1000;

  let sql = "update kanban.node set online = 0, created_or_updated = " + now.toString() + " where node_name = \"" + node_name + "\"";
  let ret = mysql_js.execute(sql);
  if (ret) {
    insert_online(node_name, 0, now, now);
  }
}

export function mark_node_offlined_ex(interval: number) {
  let sql = "select node_name from kanban.node where online = 1 and created_or_updated < " + (new Date().getTime()/1000 - interval).toString();
  let result = mysql_js.execute(sql);
  for (let i in result) {
    mark_node_offlined(result[i].node_name);
  }
}

function insert_online(node_name: string, status: number, connect_at: number, now: number) {
  let result = mysql_js.execute("select * from kanban.online where node_name = \"" + node_name + "\" order by id desc");
  if (result.length == 0 && status == 1 || result[0].online != status) {
    let sql = "insert kanban.online(node_name, online, timestamp, connect_at) values(\"" + node_name + "\", " + status.toString() + ", " + now.toString() + ", " + connect_at.toString() + ")";
    mysql_js.execute(sql);
  }
}

export function clear_db() {
  let sql = "delete from kanban.node";
  console.log(sql);
  mysql_js.execute(sql);
  sql = "delete from kanban.online";
  console.log(sql);
  mysql_js.execute(sql);
}

export function delete_last_offline_record(node_name: string) {
  let result = mysql_js.execute("select * from kanban.online where node_name = \"" + node_name + "\" order by id desc");
  if (result.length > 0 && result[0].online == 0) {
    mysql_js.execute("delete from kanban.online where id=" + result[0].id);
  }
}

export function delete_last_online_record(node_name: string) {
  let result = mysql_js.execute("select * from kanban.online where node_name = \"" + node_name + "\" order by id desc");
  if (result.length > 1 && result[0].online == 1) {
    mysql_js.execute("delete from kanban.online where id=" + result[0].id);
  }
}

//heartbeat
export function get_heartbeat(): number {
  let result = mysql_js.execute("select value1 from kanban.dict where key1 = 'heartbeat'");
  if (result.length > 0) {
    let last_ms = parseInt(result[0].value1);
    if (isNaN(last_ms)) return 0;
    return last_ms;
  }

  return 0;
}