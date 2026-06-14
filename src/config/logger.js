/***
 * @fileoverview Application-wide structured logger (Pino).
 */

import pino from 'pino';
import { env } from './env.js';

const isProd = env.NODE_ENV === 'production';

/** @type {import('pino').LoggerOptions} */
const options = {
  level: env.LOG_LEVEL,
  base: { service: 'auth-system' },
  timestamp: pino.stdTimeFunctions.isoTime
};

if (!isProd) {
  options.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss.l',
      ignore: 'pid,hostname,service',
      singleLine: false,
      errorLikeObjectKeys: ['err', 'error'],
      errorProps: 'code,message,stack,details,statusCode'
    }
  };
}

/*** @type {import('pino').Logger} */
export const logger = pino(options);
