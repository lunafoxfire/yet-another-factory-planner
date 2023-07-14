import knexConfig, { Knex } from 'knex';
import { createLogger } from '@/util/logger';
import { isTruthy } from '@/util/string';
import { knexSettings } from '@/../knexfile';

const logger = createLogger('db');

export default class DB {
  public static knex: Knex;

  public static async init() {
    logger.info('Connecting to database...');
    DB.knex = knexConfig({
      client: 'pg',
      connection: DB.getConnectionConfig(),
      pool: { min: 0, max: 7 },
      debug: isTruthy(process.env.KNEX_DEBUG),
    });
    await DB.knex.raw("SELECT 'connection test';");
    logger.info('Running migrations...');
    await DB.knex.migrate.latest(knexSettings.migrations);
    logger.info('Database ready!');
  }

  private static getConnectionConfig(): any {
    const config: any = {
      ssl: isTruthy(process.env.PG_SSL) ? { rejectUnauthorized: false } : false, // fix for heroku
    };

    if (process.env.DATABASE_URL) {
      config.connectionString = process.env.DATABASE_URL;
    } else {
      config.host = process.env.PG_HOST;
      config.port = Number(process.env.PG_PORT);
      config.user = process.env.PG_USER;
      config.password = process.env.PG_PASSWORD;
      config.database = process.env.PG_DATABASE;
    }

    return config;
  }
}
