import type { NextFunction, Request, Response } from 'express';
import pino from 'pino';

import { env } from '../env-helper';
import { getResponseTime } from './utils';

const config: pino.LoggerOptions = {
  level: env.string('LOG_LEVEL', 'debug'),
  timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
    },
  },
};

let logger: pino.BaseLogger;
if (env.string('NODE_ENV') !== 'production') {
  logger = pino({ ...config });
} else {
  logger = pino(
    config,
    pino.destination({
      dest: 'debug.log',
      sync: false,
    }),
  );
}

const apiLogger = (req: Request, res: Response, next: NextFunction): void => {
  (async () => {
    const delta = getResponseTime(process.hrtime()).toLocaleString();
    const message = `${req.method} ${req.url} (${delta} ms)`;
    logger.debug(message);
    next();
  })();
};

//! Do-not rename logger and apiLogger
export { logger, apiLogger };
