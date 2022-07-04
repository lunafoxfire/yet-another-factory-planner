import './src/config';

export const knexSettings = {
  client: 'pg',
  connection: {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
  },
  migrations: {
    directory: './db/migrations',
    tableName: 'knex_migrations',
  },
};

export default {
  development: {
    ...knexSettings,
  },
  test: {
    ...knexSettings,
  },
  staging: {
    ...knexSettings,
  },
  production: {
    ...knexSettings,
  },
};
