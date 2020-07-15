const mysql_js: any = require("./mysql_js.js");

export function query_all_nodes(): any {
  const sql = "select * from kanban.node";
  return mysql_js.execute(sql);
}

export function query_by_node_name(node_name: string): any {
  const sql = "select * from kanban.node where node_name = \"" + node_name + "\"";
  return mysql_js.execute(sql);
}

export function query_gatekeeper(controller: string): any {
  const sql = "select * from kanban.gatekeeper where controller = \"" + controller + "\"";
  return mysql_js.execute(sql);
}

export function insert_gatekeeper(node_name: string, controller: string) {
  let result = query_gatekeeper(controller);
  let deleted = false;
  if (result.length > 0 && result[0].node_name != node_name) {
    mysql_js.execute("delete from kanban.gatekeeper where controller = \"" + controller + "\"");
    deleted = true;
  }

  if (result.length == 0 || deleted) {
    const sql = "insert kanban.gatekeeper(node_name, controller) values(\"" + node_name + "\", \"" + controller +"\")";
    mysql_js.execute(sql);
  }
}

export function update_stash(controller: string, stash: string) {
  const sql = "update kanban.gatekeeper set stash = \"" + stash + "\" where controller = \"" + controller + "\"";
  mysql_js.execute(sql);
}

export function update_isTee(controller: string, isTee: boolean) {
  const sql = "update kanban.gatekeeper set is_tee = " + (isTee?1:0).toString() + " where controller = \"" + controller + "\"";
  mysql_js.execute(sql);
}

export function update_tee_score(controller: string, score: number) {
  const sql = "update kanban.gatekeeper set tee_score = " + score.toString() + " where controller = \"" + controller + "\"";
  mysql_js.execute(sql);
}

export function update_isGatekeeper(controller: string, isGatekeeper: boolean) {
  const sql = "update kanban.gatekeeper set is_gatekeeper = " + (isGatekeeper?1:0).toString() + " where controller = \"" + controller + "\"";
  mysql_js.execute(sql);
}

//gatekeeper
export function query_gatekeeper_era(era: number, controller: string): any {
  const sql = "select * from kanban.gatekeeper_era_history where era = "+ era.toString() + " and controller = \"" + controller + "\"";
  return mysql_js.execute(sql);
}

export function insert_gatekeeper_era(era: number, controller: string, stash: string): boolean {
  const result = query_gatekeeper_era(era, controller);
  if (result.length == 0) {
    const sql = "insert kanban.gatekeeper_era_history(era, controller, stash) values(" + era.toString() + ", \"" + controller + "\", \"" + stash + "\")";
    mysql_js.execute(sql);
    return true;
  }

  return false;
}

export function query_node_name_by_controller(controller: string): string {
  let sql = "select node_name from kanban.gatekeeper where controller = \"" + controller + "\"";
  let result = mysql_js.execute(sql);
  if (result && result.length > 0) return result[0].node_name;
  return null;
}

export function update_gatekeeper_eras_and_slash(controller: string) {
  let sql = "select count(*) as count from kanban.gatekeeper_era_history where controller = \"" + controller + "\"";
  const result = mysql_js.execute(sql);

  sql = "select count(*) as count from kanban.gatekeeper_era_history where controller = \"" + controller + "\" and slash > 0";
  const result1 = mysql_js.execute(sql);

  sql = "update kanban.gatekeeper set gatekeeper_eras = " + result[0].count.toString() +", slash_eras = " + result1[0].count.toString() +" where controller = \"" + controller + "\"";
  mysql_js.execute(sql);
}

export function set_node_eras(node_name: string, eras: number) {
  let sql = "update kanban.node set node_eras = " + eras.toString() +" where node_name = \"" + node_name + "\"";
  mysql_js.execute(sql);
}

export function gatekeeper_need_query_slash(controller: string, current_era: number): any {
  let sql = "SELECT * FROM kanban.gatekeeper_era_history where controller = \"" + controller +"\" and slash = -1 and era <" + current_era.toString();
  return mysql_js.execute(sql);
}

export function update_gatekeeper_slash(id: number, flag: number) {
  let sql = "update kanban.gatekeeper_era_history set slash = " + flag.toString() + " where id = " + id.toString();
  mysql_js.execute(sql);
}

//online
export function query_online(node_name: string): any {
  const sql = "select online, connect_at, timestamp from kanban.online where node_name = \"" + node_name + "\" order by id desc";
  const result = mysql_js.execute(sql);
  return result;
}

//
export function clear_db() {
  let sql = "delete from kanban.gatekeeper";
  console.log(sql);
  mysql_js.execute(sql);
  sql = "delete from kanban.gatekeeper_era_history"; 
  console.log(sql);
  mysql_js.execute(sql);
}
