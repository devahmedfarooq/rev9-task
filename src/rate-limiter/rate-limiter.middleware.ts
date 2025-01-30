import { HttpStatus, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import * as jwt from 'jsonwebtoken';

const DEFAULT_LIMITS = {
  public: { limit: 10, window: 60 },
  private: { limit: 20, window: 60 },
};

const PUBLIC_ROUTES = ['/public', '/', '/auth/fake-token'];

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private redisClient: Redis;

  constructor() {
    this.redisClient = new Redis({ host: 'localhost', port: 6379 });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      let key: string = '';
      let limit: number;
      let window: number;
      const route = req.originalUrl;

      // Extract user ID from JWT (if available)
      const authHeader = req.headers.authorization;
      let userId: string | null = null;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWTSECRET ?? 'REV9TASKAHMED') as { userId: string };
            userId = decoded.userId;
          } catch (error) {
            throw new UnauthorizedException('Invalid token');
          }
        }
      }

      let routeConfig: Record<string, string> = {};
      try {
        routeConfig = await this.redisClient.hgetall(`rate-limit-config:${route}`);
      } catch (error) {
        console.error('Redis error while fetching rate limits:', error);
      }
      //    console.log(route, "\tROUTECONFIG : ", routeConfig)

      if (routeConfig && routeConfig.limit && routeConfig.window) {
        limit = parseInt(routeConfig.limit, 10);
        window = parseInt(routeConfig.window, 10);
      } else {


        if (PUBLIC_ROUTES.includes(route)) {
          if (userId) {
            key = `rate-limit:user:${userId}:${route}`;
            limit = DEFAULT_LIMITS.private.limit;
            window = DEFAULT_LIMITS.private.window;
          } else {
            key = `rate-limit:ip:${req.ip}:${route}`;
            limit = DEFAULT_LIMITS.public.limit;
            window = DEFAULT_LIMITS.public.window;
          }
        } else {
          if (userId) {
            key = `rate-limit:user:${userId}:${route}`;
            limit = DEFAULT_LIMITS.private.limit;
            window = DEFAULT_LIMITS.private.window;
          } else {
            key = `rate-limit:ip:${req.ip}:${route}`;
            limit = DEFAULT_LIMITS.public.limit;
            window = DEFAULT_LIMITS.public.window;
          }
        }
      }

      let currentRequests = 0;
      try {
        currentRequests = await this.redisClient.incr(key);
      } catch (error) {
        console.error('Redis error while incrementing request count:', error);
      }

      if (currentRequests === 1) {
        await this.redisClient.expire(key, window);
      }

      if (currentRequests > limit) {
        console.log("Current Limit Hit")
        return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too Many Requests. Try again later.',
          retry_after: window,
        });
      }

      const ttl = await this.redisClient.ttl(key);
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - currentRequests));
      res.setHeader('X-RateLimit-Reset', ttl);

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next(error);
    }
  }
}
