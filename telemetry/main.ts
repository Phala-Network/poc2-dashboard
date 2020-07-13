import * as fs from "fs";
import program, { Command } from "commander";

import TelemetryClient from "./telemetry";
import * as Mysql from "./db/mysql";

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

  while (true) {
    const telemetry = new TelemetryClient(config);
    telemetry.start();
    await sleep(10 * 60 * 1000);
    telemetry.close();
  }
}

function sleep(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

const catchAndQuit = async (fn: any) => {
  try {
    await fn;
  } catch (e) {
    console.error(e.toString());
    process.exit(1);
  }
};

program
  .option("--init", "Initialize database.", "init")
  .action((cmd: Command) => catchAndQuit(main(cmd)));

program.version("1.2.21");
program.parse(process.argv);

