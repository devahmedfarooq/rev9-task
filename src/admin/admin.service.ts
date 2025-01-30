import { Injectable, ForbiddenException } from '@nestjs/common';
import Redis from 'ioredis';
import { updateRatelimitDto } from './dto/updateRateLimit.dto';





@Injectable()
export class AdminService {

    private redisClient: Redis;
    constructor() {
        this.redisClient = new Redis({ host: 'localhost', port: 6379 });
    }



    async updateLimit(updateRateLimitDto: updateRatelimitDto) {
        const { route, limit, timeWindow } = updateRateLimitDto;

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
