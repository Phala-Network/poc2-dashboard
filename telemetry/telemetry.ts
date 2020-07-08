import ReconnectingWebSocket from "reconnecting-websocket";
import WS from "ws";

import * as Mysql from "../db/mysql";
import logger from "./logger";

enum TelemetryMessage {
  FeedVersion = 0x00,
  BestBlock = 0x01,
  BestFinalized = 0x02,
  AddedNode = 0x03,
  RemovedNode = 0x04,
}

const DEFAULT_HOST = "ws://localhost:8000/feed";

const MemNodes = {};

export default class TelemetryClient {
  private config: any;
  //private db: Database;
  private host: string;
  private socket: ReconnectingWebSocket;

  constructor(config: any) {
    this.config = config;
    //this.db = db;
    this.host = this.config.telemetry.host || DEFAULT_HOST;

    const options = {
      WebSocket: WS,
      connectionTimeout: 10000,
      maxRetries: 10,
    };

    this.socket = new ReconnectingWebSocket(this.host, [], options);
  }

  async start(): Promise<null> {
    return new Promise((resolve: any, reject: any) => {
      this.socket.onopen = () => {
        logger.info(`Connected to substrate-telemetry on host ${this.host}`);
        for (const chain of this.config.telemetry.chains) {
          this._subscribe(chain);
        }
        resolve();
      };

      this.socket.onclose = () => {
        logger.info(
          `Connection to substrate-telemetry on host ${this.host} closed`
        );
        reject();
      };

      this.socket.onerror = (err: any) => {
        logger.info(
          `Could not connect to substrate-telemetry on host ${
            this.host
          }: ${err.toString()}`
        );
        reject();
      };

      this.socket.onmessage = (msg: any) => {
        const messages = this._deserialize(msg);
        for (const message of messages) {
          this._handle(message);
        }
      };
    });
  }

  private _deserialize(msg: any) {
    const data = JSON.parse(msg.data);
    const messages = new Array(data.length / 2);

    for (const index of messages.keys()) {
      const [action, payload] = data.slice(index * 2);
      // eslint-disable-next-line security/detect-object-injection
      messages[index] = { action, payload };
    }

    return messages;
  }

  private async _handle(message: any) {
    const { action, payload } = message;
    //console.log('message:', message);

    switch (action) {
      case TelemetryMessage.AddedNode:
        {
          const [id, nodeDetails, nodeStats, , , , location, connectedAt] = payload;
          
          const mem = MemNodes[parseInt(id)];
          if (mem) {
            const details = mem[0];
            if (details && details[0] != nodeDetails[0]) {
              logger.info(`Node id ${id}, its name changed from ${details[0]} to ${nodeDetails[0]}`);
            }
          }

          MemNodes[parseInt(id)] = [nodeDetails, nodeStats, location];
          logger.info(`Reporting ${id}, ${nodeDetails[0]} ONLINE`);
          Mysql.insert_node(id, nodeDetails, nodeStats, location, connectedAt);
        }
        break;
      case TelemetryMessage.RemovedNode:
        {
          const id = payload;
          
          const [details, stat, location] = MemNodes[parseInt(id)];

          if (!details) {
            logger.info(`Unknown node with ${id} reported offline.`);
          } 
          else
          {
            logger.info(`Reporting ${id}, ${details[0]} OFFLINE`);
            Mysql.delete_node(details[0]);
          }
        }
        break;
    }
  }

  private async _subscribe(chain: string, finality = false) {
    if (this.config.telemetry.chains.includes(chain)) {
      this.socket.send(`subscribe:${chain}`);
      logger.info(`Subscribed to ${chain}`);

      if (finality) {
        this.socket.send(`send-finality:${chain}`);
        logger.info("Request finality data");
      }
    }
  }
}
