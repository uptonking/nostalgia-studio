import { createLogger, type LoggerOptions, transports } from 'winston';

const options: LoggerOptions = {
  transports: [
    new transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    }),
    new transports.File({ filename: 'debug.log', level: 'debug' }),
  ],
};

export const logger = createLogger(options);

if (process.env.NODE_ENV !== 'production') {
  logger.debug('Logging initialized at debug level.');
}

export default logger;
