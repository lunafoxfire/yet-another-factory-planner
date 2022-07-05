import express from 'express';
import helmet from 'helmet';
import 'express-async-errors';
import { createLogger } from 'util/logger';
import { registerRoutes } from 'app/api/routes';

export default class App {
  public static server = express();
  public static logger = createLogger('api');

  public static async init() {
    const port = App.getPort();

    App.server.use(express.json());
    App.server.use(helmet());
    registerRoutes();

    App.server.listen(port, () => {
      App.logger.info(`API listening on port ${port}`);
    });
  }

  public static getPort(): number {
    return Number(process.env.PORT);
  }
}
