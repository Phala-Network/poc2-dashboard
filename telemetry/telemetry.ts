import ReconnectingWebSocket from "reconnecting-websocket";
import WS from "ws";

import * as Mysql from "./db/mysql";
import logger from "./logger";

enum TelemetryMessage {
  FeedVersion = 0x00,
  BestBlock = 0x01,
  BestFinalized = 0x02,
  AddedNode = 0x03,
  RemovedNode = 0x04,
}

const DEFAULT_HOST = "ws://localhost:8000/feed";
const REPORT_INTERVAL = 60 * 5;
const STATUS_CHANGED_INTERVAL = 60 * 5;
    
const MemNodes = {};

export default class TelemetryClient {
  private config: any;
  private host: string;
  private socket: ReconnectingWebSocket;

  constructor(config: any) {
    this.config = config;
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

        Mysql.mark_node_offlined_ex(REPORT_INTERVAL * 2);

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
          const nodeName = nodeDetails[0];
          const now = new Date().getTime()/1000;
          
          if (MemNodes[parseInt(id)]) {
            const [details, stats, loc] = MemNodes[parseInt(id)]; 
            if (details[0] != nodeName) {
              logger.info(`Node id ${id}, its name changed from ${details[0]} to ${nodeName}`);
            }
          }

          if (MemNodes['_' + nodeName]) {
            const [last_id, last_now, last_online] = MemNodes['_' + nodeName];
            if (last_online == 0 && now - last_now < STATUS_CHANGED_INTERVAL) {
              logger.info(`Deleting ${nodeName} last OFFLINE record`);
              Mysql.delete_last_offline_record(nodeName);
              MemNodes['_' + nodeName] = undefined;
              break;
            }
            if (last_online == 1 && last_id != id) {
              logger.info(`Duplicated id for ${nodeName}, skip`);
              break;
            }
            if (last_online == 1 && now - last_now < REPORT_INTERVAL) {
              logger.info(`Reporting ONLINE in ${REPORT_INTERVAL} seconds for ${nodeName}, skip`);
              break;
            }
          }

          logger.info(`Reporting ${id}, ${nodeName} ONLINE`);
          Mysql.insert_node(id, nodeDetails, nodeStats, location, connectedAt, now);
          MemNodes[parseInt(id)] = [nodeDetails, nodeStats, location];
          MemNodes['_' + nodeName] = [id, now, 1];
        }
        break;
      case TelemetryMessage.RemovedNode:
        {
          const id = payload;
          const now = new Date().getTime()/1000;

          const mem = MemNodes[parseInt(id)];
          if (!mem) {
            logger.info(`Unknown node with ${id} reported offline.`);
          } 
          else
          {
            const [details, stats, location] = mem;
            const nodeName = details[0];
            logger.info(`Reporting ${id}, ${nodeName} OFFLINE`);
            if (MemNodes['_' + nodeName]) {
              const [last_id, last_now, last_online] = MemNodes['_' + nodeName];
              if (last_online == 1 && now - last_now < STATUS_CHANGED_INTERVAL) {
                logger.info(`Deleting ${nodeName} last ONLINE record`);
                Mysql.delete_last_online_record(nodeName);
                break;
              }
            }
            Mysql.mark_node_offlined(nodeName);
            MemNodes['_' + nodeName] = [id, now, 0];
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

  async close() {
    logger.info("Telemetry client will close connection...");
    this.socket.close();
  }
}
