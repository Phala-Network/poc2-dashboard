import program, { Command } from "commander";

import { ApiPromise, WsProvider } from '@polkadot/api';
import { TypeRegistry } from '@polkadot/types';

import * as Mysql from './db/mysql';

const url = 'ws://localhost:9944';
//const url = 'wss://kusama-rpc.polkadot.io/';

const main = async (cmd: Command) => {
  const wsProvider = new WsProvider(url);
  const registry = new TypeRegistry();
  registry.register({"SequenceType": "u32"});

  const api = await ApiPromise.create({ provider: wsProvider, registry});
  console.log("api is ready.");

  const era_duration = await get_era_duration(api);
  console.log('era duration in seconds:', era_duration);
  
  while (true) { //main loop

    const controllers = init_gatekeepers();
    console.log('controllers:', controllers);
    
    // read machine_id and TEE score from chain
    await set_tee(api, controllers);

    // set stash and gatekeeper
    await set_gatekeeper(api, controllers);
    
    // gatekeeper eras
    set_gatekeeper_eras(controllers);

    // node eras
    set_node_eras(controllers, era_duration);

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

    if (isTee) {
      const machine = await api.query.phalaModule.machine(machine_id);
      const score = parseInt(JSON.stringify(machine[1]));
      Mysql.update_tee_score(controllers[i], score); 
    }
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

function set_node_eras(controllers: string[], era_duration: number) {
  for (let i in controllers) {
    let controller = controllers[i];
    let online_eras = 0;
    const node_name = Mysql.query_node_name_by_controller(controller);
    if (node_name)
      online_eras = calculate_node_online_time(node_name) / era_duration;
    Mysql.set_node_eras(controller, online_eras);
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
      let end_second = online_hist[index].timestamp;
      total_online_second += (start_second - end_second);
      online = false;
    } else {
      while (index + 1 < total_hist && online_hist[index+1].online == 0) index++;
      start_second = online_hist[index].timestamp;
      online = true;
    }
    
    index++;
    if (index >= total_hist) break;
  }
  //console.log('total_online_seconds:', total_online_second);
  
  return total_online_second;
}

async function get_era_duration(api: ApiPromise): Promise<number> {
  let epochDuration = await api.consts.babe.epochDuration.toNumber();
  let blockTime = await api.consts.babe.expectedBlockTime.toNumber() / 1000;
  let sessionPerEra = await api.consts.staking.sessionsPerEra.toNumber();

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
  //.option("--config <directory>", "The path to the config directory.", "config")
  .action((cmd: Command) => catchAndQuit(main(cmd)));

program.version("1.2.21");
program.parse(process.argv);
