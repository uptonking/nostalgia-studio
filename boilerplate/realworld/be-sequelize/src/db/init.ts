import { Sequelize } from 'sequelize';

import { dbConfig } from '../config/config';
import { Article } from '../models/article';
import { Comment } from '../models/comment';
import { Tag } from '../models/tag';
import { User } from '../models/user';
import { isDev } from '../utils/common';
import { logger } from '../utils/logger';

export const sequelizeConnection = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: isDev ? (msg) => logger.debug(msg) : false,
  },
);

export const modelsDefs = {
  User,
  Article,
  Tag,
  Comment,
};
Object.keys(modelsDefs).forEach((name) => {
  modelsDefs[name]['initModel']?.(sequelizeConnection);
});
Object.keys(modelsDefs).forEach((name) => {
  if (modelsDefs[name].associate) {
    modelsDefs[name].associate(modelsDefs);
  }
});

/** synchronize all models to db by performing SQL queries to the db */
export async function dbSync() {
  try {
    await sequelizeConnection.sync({ alter: isDev });
    return { success: true };
  } catch (error) {
    throw error;
  }
}

// todo remove effects - sync db when init
dbSync()
  .then((res) => {
    logger.info(`DB sync with status: ${res.success}`);
  })
  .catch((err) => {
    logger.error('Failed to sync DB', err);
  });

export default sequelizeConnection;
