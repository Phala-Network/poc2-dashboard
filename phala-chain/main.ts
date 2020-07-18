import * as fs from "fs";
import program, { Command } from "commander";

import { ApiPromise, WsProvider } from '@polkadot/api';
import { TypeRegistry } from '@polkadot/types';

import * as Mysql from './db/mysql';

const loadConfig = (configPath: string) => {
  let conf = fs.readFileSync(configPath, { encoding: "utf-8" });
  if (conf.startsWith("'")) {
    conf = conf.slice(1).slice(0, -1);
  }
  return JSON.parse(conf);
};

const SLEEP = 5 * 60;

const main = async (cmd: Command) => {
  if (cmd.init !== undefined) {
    Mysql.clear_db();
    return;
  }

  let config = loadConfig('config.json');
  console.log(config);

  const wsProvider = new WsProvider(config.ws_rpc);
  const registry = new TypeRegistry();
  registry.register({"SequenceType": "u32"});

  console.log("connecting ws rpc server at " + config.ws_rpc + " ...");
  const api = await ApiPromise.create({ provider: wsProvider, registry});
  console.log("api is ready.");

  const era_duration = await get_era_duration(api);
  console.log('era duration in seconds:', era_duration);
  
  while (true) { //main loop

    // node eras
    console.log("\nset node eras");
    set_node_eras(era_duration);

    // set stash and gatekeeper
    const current_era = parseInt((await api.query.staking.currentEra()).toString());
    console.log('current era:', current_era);

    console.log("\nset gatekeeper")
    const controllers = await set_gatekeeper_of_staking(api);
    
    console.log("\nset telemetry gatekeeper");
    set_gatekeeper_of_telemetry(api, controllers);

    // gatekeeper slash
    console.log("\nset gatekeeper slash")
    set_gatekeeper_slash(api, controllers, current_era);

    // set gatekeeper eras and slash
    console.log("\nset gatekeeper and slash eras")
    set_gatekeeper_and_slash_eras(controllers);

    Mysql.set_heartbeat();
    
    console.log("\nsleep " + SLEEP.toString() + " seconds ...");
    await sleep(SLEEP * 1000);
  }
}

async function set_gatekeeper_of_staking(api: ApiPromise): Promise<string[]> {
  // gatekeeper
  const staking_overview = await api.derive.staking.overview();
  //console.log("staking_overview:", JSON.stringify(staking_overview));
  const current_era: number = parseInt(staking_overview.currentEra.toString());
  const validators = staking_overview.validators;
  let controllers = [];
  for (let index = 0; index < validators.length; index++) {
    let stash = validators[index];
    let controller = await api.query.staking.bonded(stash);
    let insert_ok = false;
    if (controller.isSome)
      insert_ok = Mysql.insert_gatekeeper(controller.unwrap().toString(), stash.toString());
      
    if (insert_ok) {
      Mysql.insert_gatekeeper_era(current_era, controller.unwrap().toString(), stash.toString());

      controllers.push(controller.unwrap().toString());
    } else {
      console.log("failed to insert gatekeeper:", controller);
    }
  }

  return controllers;
}

async function set_gatekeeper_of_telemetry(api: ApiPromise, controllers: string[]) {
  let telemetry_controllers = Mysql.get_telemetry_controllers();
  Mysql.reset_tee_and_gatekeeper_flag();
  for (let i in telemetry_controllers) {
    let controller = telemetry_controllers[i].controller;
    const ledger = await api.query.staking.ledger(controller);
    //console.log(JSON.stringify(ledger));
    if (ledger && ledger.isSome) {
      let stash = ledger.unwrap().stash;
      Mysql.insert_gatekeeper(controller, stash.toString());
    }

    const machine_id = (await api.query.phalaModule.miner(controller)).toString();
    const isTee = machine_id.startsWith('0x') && machine_id.length > 2;
    Mysql.update_isTee(controller, isTee);
    
    const isGateKeepr = controllers.includes(controller);
    Mysql.update_isGatekeeper(controller, isTee && isGateKeepr);
  }
}

async function set_gatekeeper_slash(api: ApiPromise, controllers: string[], current_era) {
  for (let i in controllers) {
    let result = Mysql.gatekeeper_need_query_slash(controllers[i], current_era);
    if (result && result.length > 0) {
      for (let i in result) {
        let slash = await api.query.staking.validatorSlashInEra(result[i].era, result[i].stash);
        let flag = slash && slash.isSome ? 1:0;
        Mysql.update_gatekeeper_slash(result[i].id, flag);   
      }
    }
  }
}

function set_gatekeeper_and_slash_eras(controllers: string[]) {
  for (let i in controllers) {
    Mysql.update_gatekeeper_and_slash_eras(controllers[i]);
  }
}

function set_node_eras(era_duration: number) {
  const nodes = Mysql.query_all_nodes();
  for (let i in nodes) {
    const node_name = nodes[i].node_name;
    const online_eras = calculate_node_online_time(node_name) / era_duration;
    Mysql.set_node_eras(node_name, online_eras);
  }
}

function calculate_node_online_time(node_name: string): number {
  const online_hist = Mysql.query_online(node_name);
  
  let total_hist = online_hist.length;
  let total_online_second = 0;
  let index = 0;
  let start_second: number;
  let online = online_hist[index].online == 1;
  if (online) start_second = new Date().getTime() / 1000
  
  while (true) {
    if (online) {
      while (index + 1 < total_hist && online_hist[index+1].online == 1) index++;
      let end_second = online_hist[index].connect_at;
      if (start_second - end_second > 0)
        total_online_second += (start_second - end_second);
      online = false;
    } else {
      while (index + 1 < total_hist && online_hist[index+1].online == 0) index++;
      start_second = online_hist[index].connect_at;
      online = true;
    }
    
    index++;
    if (index >= total_hist) break;
  }
  //console.log('total_online_seconds:', total_online_second);
  
  return total_online_second;
}

async function get_era_duration(api: ApiPromise): Promise<number> {
  let epochDuration = api.consts.babe.epochDuration.toNumber();
  let blockTime = api.consts.babe.expectedBlockTime.toNumber() / 1000;
  let sessionPerEra = api.consts.staking.sessionsPerEra.toNumber();

  return epochDuration * blockTime * sessionPerEra;
}

const catchAndQuit = async (fn: any) => {
  try {
    await fn;
  } catch (e) {
    console.error(e.toString());
    process.exit(1);
  }
}

function sleep(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

program
  .option("--init", "Initialize database.", "init")
  .action((cmd: Command) => catchAndQuit(main(cmd)));

program.version("1.2.21");
program.parse(process.argv);
