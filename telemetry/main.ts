import * as fs from "fs";
import program, { Command } from "commander";

import TelemetryClient from "./telemetry";

const loadConfig = (configPath: string) => {
  let conf = fs.readFileSync(configPath, { encoding: "utf-8" });
  if (conf.startsWith("'")) {
    conf = conf.slice(1).slice(0, -1);
  }
  return JSON.parse(conf);
};

const main = async (cmd: Command) => {
  let config = loadConfig('config.json');
  console.log(config);

  const telemetry = new TelemetryClient(config);
  telemetry.start();
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
  //.option("--config <directory>", "The path to the config directory.", "config")
  .action((cmd: Command) => catchAndQuit(main(cmd)));

program.version("1.2.21");
program.parse(process.argv);

