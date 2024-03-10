import 'dotenv/config';

const env = process.env;

/** @type { [key: string]: import("knex").Knex.Config; } */
const configs = {
  development: {
    client: 'pg',
    connection: {
      host: env['DB_DEV_HOST'] || 'localhost',
      port: env['DB_DEV_PORT'] || 5432,
      database: env['DB_DEV_DATABASE'] || 'template2',
      user: env['DB_DEV_USER'] || 'postgres',
      password: env['DB_DEV_PASS'] || '111111',
    },
    pool: {
      min: 2,
      max: 10,
    },

    migrations: {
      tableName: 'knex_migrations',
      directory: './knex/migrations',
      loadExtensions: ['.mjs'],
    },
  },
  // test: {
  //   client: 'postgresql',
  //   connection: {
  //     host: env.string('DB_TEST_HOST', 'localhost'),
  //     port: env.number('DB_TEST_PORT', 5432),
  //     database: env.string('DB_TEST_DATABASE', 'template_test'),
  //     user: env.string('DB_TEST_USER', 'postgres'),
  //     password: env.string('DB_TEST_PASS', 'root'),
  //   },
  //   pool: {
  //     min: 2,
  //     max: 10,
  //   },
  //   migrations: {
  //     tableName: 'knex_migrations',
  //   },
  // },
  // production: {
  //   client: 'postgresql',
  //   connection: {
  //     host: env.string('DB_PROD_HOST', 'localhost'),
  //     port: env.number('DB_PROD_PORT', 5432),
  //     database: env.string('DB_PROD_DATABASE', 'template'),
  //     user: env.string('DB_PROD_USER', 'username'),
  //     password: env.string('DB_PROD_PASS', 'password'),
  //   },
  //   pool: {
  //     min: 2,
  //     max: 10,
  //   },
  //   migrations: {
  //     tableName: 'knex_migrations',
  //   },
  // },
};

/**
 * export default is required for knex to resolve
 * Knex required configuration option 'client' is missing error
 */
export default configs.development;
// export default process.env.NODE_ENV === 'development'
//   ? configs['development']
//   : {};
