import type { NextFunction, Request, Response } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

import { ApiError } from '../utils/error-handler';

// import { client } from '../helpers/cache';

const limiter = new RateLimiterMemory({
  // Redis is recommended as it's fast and scalable.

  /*
    If you want memory based cache check-out https://github.com/animir/node-rate-limiter-flexible/wiki/Memory#ratelimitermemory
    or any other client https://github.com/animir/node-rate-limiter-flexible/wiki
    and modify code as per need
  */

  // storeClient: client, // -> redis client
  // keyPrefix: 'middleware',
  points: 6, // 10 requests
  duration: 60, // per 60 second by IP
});

type RateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

/**
 * @param points
 * @param duration
 * @returns rate-limit Middleware
 */
export const rateLimiter = (
  points?: number,
  duration?: number,
): RateLimitMiddleware => {
  if (points) limiter.points = points;
  if (duration) limiter.duration = duration;

  return (req, res, next): void => {
    limiter
      .consume(req.ip)
      .then(() => {
        next();
      })
      .catch(() => {
        return next(ApiError.limited());
      });
  };
};
