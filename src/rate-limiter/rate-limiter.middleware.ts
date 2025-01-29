import { HttpException, HttpStatus, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import * as jwt from 'jsonwebtoken';

// Default rate limits (fallback if not found in Redis)
const DEFAULT_LIMITS = {
  public: { limit: 10, window: 60 }, // 10 requests per minute for unauthenticated users
  private: { limit: 20, window: 60 }, // 20 requests per minute for authenticated users
};

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private redisClient: Redis;

  constructor() {
    this.redisClient = new Redis({ host: 'localhost', port: 6379 });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    let key: string;
    let limit: number;
    let window: number;
    const route = req.originalUrl; // Get the requested route

    // Check if the user is authenticated
    const authHeader = req.headers.authorization;
    let userId: string | null = null;

    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'your_secret_key') as { userId: string };
        userId = decoded.userId;
      } catch (error) {
        throw new UnauthorizedException('Invalid token');
      }
    }

    if (userId) {
      key = `rate-limit:user:${userId}:${route}`;
    } else {
      key = `rate-limit:ip:${req.ip}:${route}`;
    }

    // Get route-specific limit from Redis (if set)
    const routeLimitData = await this.redisClient.hgetall(`rate-limit-config:${route}`);
    if (routeLimitData && routeLimitData.limit && routeLimitData.window) {
      limit = parseInt(routeLimitData.limit, 10);
      window = parseInt(routeLimitData.window, 10);
    } else {
      limit = userId ? DEFAULT_LIMITS.private.limit : DEFAULT_LIMITS.public.limit;
      window = userId ? DEFAULT_LIMITS.private.window : DEFAULT_LIMITS.public.window;
    }

    // Increment request count
    const currentRequests = await this.redisClient.incr(key);

    // Set TTL if it's the first request
    if (currentRequests === 1) {
      await this.redisClient.expire(key, window);
    }

    // If limit exceeded, throw error
    if (currentRequests > limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too Many Requests. Try again later.',
          retry_after: window, // Time left before reset
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Set rate-limit headers
    const ttl = await this.redisClient.ttl(key);
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - currentRequests));
    res.setHeader('X-RateLimit-Reset', ttl);

    next();
  }
}
