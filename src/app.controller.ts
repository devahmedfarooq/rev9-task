import { Body, Controller, Get, Param, Post, UseGuards, UseInterceptors, ForbiddenException } from '@nestjs/common';
import { AppService } from './app.service';
import { CacheInterceptor, CacheKey } from '@nestjs/cache-manager';
import { AuthGuard } from './auth/auth.guard';
import Redis from 'ioredis';
import * as jwt from 'jsonwebtoken'


interface RateLimitConfig {
  route: string;
  limit: number;
  timeWindow: number;
}


interface ReqBody {
  key: string,
  value: string
}

@Controller()
@UseInterceptors(CacheInterceptor)
export class AppController {
  private redisClient: Redis;
  private readonly jwtSecret = 'your_secret_key'; 


  constructor(private readonly appService: AppService) {
    this.redisClient = new Redis({ host: 'localhost', port: 6379 });
  }

  @Post()
  async setCacheKey(@Body() body: ReqBody) {
    const { key, value } = body;
    await this.appService.setCacheKey(key, value);
    return { success: true, message: 'Key Cached successfully' };
  }

  @Get('/get/:key')
  @CacheKey('testing')
  async getCacheKey(@Param('key') key: string) {
    const data = await this.appService.getCacheKey(key);
    return { success: true, message: 'Cached Key Sent successfully', data };
  }


  @Get('/public')
  getPublic() {
    return { message: 'Public endpoint accessed.' };
  }

  @Get('/protected')
  @UseGuards(AuthGuard)
  getProtected() {
    return { message: 'Protected endpoint accessed.' };
  }


  @Get('/fake-token')
  generateFakeToken() {
    const fakeUser = {
      userId: '12345', // Fake user ID
    };

    const token = jwt.sign(fakeUser, this.jwtSecret, { expiresIn: '1h' });

    return {
      success: true,
      token,
      message: 'Use this token in the Authorization header as "Bearer <token>"',
    };
  }


  @Post('/update-limits')
  async updateRateLimits(@Body() config: RateLimitConfig) {
    const { route, limit, timeWindow } = config;

    if (!route || !limit || !timeWindow) {
      throw new ForbiddenException('Missing required fields');
    }

    // Store the limit for the specific route in Redis
    await this.redisClient.hmset(`rate-limit-config:${route}`, {
      limit: limit.toString(),
      window: timeWindow.toString(),
    });

    return {
      success: true,
      message: `Rate limit for ${route} updated: ${limit} requests per ${timeWindow} seconds`,
    };
  }

}
