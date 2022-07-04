import express from 'express';
import { createLogger } from 'util/logger';

export default class App {
  public static server = express();
  public static logger = createLogger('api');

  public static async init() {
    const port = App.getPort();

    App.server.listen(port, () => {
      this.logger.info(`API listening on port ${port}`);
    });
  }

  public static getPort(): number {
    return Number(process.env.API_PORT);
  }
}
