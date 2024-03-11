import knex from 'knex';

import { env } from '../utils/env-helper';
import configs from './knexfile';

const environment = env.string('NODE_ENV', 'development');
const config = configs[environment];

export const db = knex(config);
