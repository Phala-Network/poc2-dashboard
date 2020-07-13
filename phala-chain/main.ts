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

  console.log("connecting ws rpc server(" + config.ws_rpc + ")...");
  const api = await ApiPromise.create({ provider: wsProvider, registry});
  console.log("api is ready.");

  const era_duration = await get_era_duration(api);
  console.log('era duration in seconds:', era_duration);
  
  while (true) { //main loop

    // node eras
    console.log("set node eras \n");
    set_node_eras(era_duration);

    const controllers = init_gatekeepers();
    console.log('controllers:', controllers);
    
    // read machine_id and TEE score from chain
    await set_tee(api, controllers);

    // set stash and gatekeeper
    await set_gatekeeper(api, controllers);
    
    // gatekeeper eras
    set_gatekeeper_eras(controllers);

    await sleep(60 * 1000);
  }
}

function init_gatekeepers(): string[] {
  let controllers = [];
  const nodes = Mysql.query_all_nodes();
  for (let i in nodes) {
    let node_name = nodes[i].node_name;
    let controller = node_name.split('|').slice(-1)[0].trim();
    if (controller != node_name.split('|')[0].trim() && controller.length == 48) {
      Mysql.insert_gatekeeper(node_name, controller);
      controllers.push(controller);
    }
  }

  return controllers;
}

async function set_tee(api: ApiPromise, controllers: string[]) {
  for (let i in controllers) {
    const machine_id = (await api.query.phalaModule.miner(controllers[i])).toString();
    const isTee = machine_id.startsWith('0x') && machine_id.length > 2;
    Mysql.update_isTee(controllers[i], isTee);
    if (!isTee) {
      Mysql.update_isGatekeeper(controllers[i], false);
    }

    //if (isTee) {
    //  const machine = await api.query.phalaModule.machine(machine_id);
    //  const score = parseInt(JSON.stringify(machine[1]));
    //  Mysql.update_tee_score(controllers[i], score); 
    //}
  }
}

async function set_gatekeeper(api: ApiPromise, controllers: string[]) {
  // update stash
  let stashes: any = [];
  let stash_dict: any = {};
  for (let i in controllers) {
    const ledger = await api.query.staking.ledger(controllers[i]);
    //console.log(JSON.stringify(ledger));
    if (ledger && ledger.isSome) {
      let stash = ledger.unwrap().stash;
      Mysql.update_stash(controllers[i], stash.toString());
      stashes.push(stash);
      stash_dict[stash.toString()] = controllers[i]
    }
  }

  if (stashes.length == 0) return;

  // gatekeeper
  const staking_overview = await api.derive.staking.overview();
  const current_era: number = parseInt(staking_overview.currentEra.toString());
  const validators = staking_overview.validators;
  for (let i in stashes) {
    const isGateKeepr = validators.includes(stashes[i]);
    let controller = stash_dict[stashes[i].toString()];
    Mysql.update_isGatekeeper(controller, isGateKeepr);
    if (isGateKeepr) {
      Mysql.insert_gatekeeper_era(current_era, controller);
    }
  }
}

function set_gatekeeper_eras(controllers: string[]) {
  for (let i in controllers) {
    Mysql.update_gatekeeper_eras(controllers[i]);
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