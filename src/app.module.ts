import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from '@nestjs/cache-manager'
import { createKeyv } from '@keyv/redis';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';
import { RedisService } from './redis/redis.service';
import { RateLimitMiddleware } from './rate-limiter/rate-limiter.middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';


@Module({
  imports: [CacheModule.registerAsync({
    useFactory: async () => {
      return {
        stores: [
          new Keyv({
            store: new CacheableMemory({ ttl: 1000 * 60 * 60 * 24 * 7 }),
          }),
          createKeyv('redis://172.17.0.3:6379'),
        ],
      };
    },
    isGlobal: true,
  }), MongooseModule.forRootAsync({
    useFactory: async () => {
      return {
        uri: "mongodb://localhost:27017/rev9mongo"
      }
    }
  }), AuthModule, AdminModule],
  controllers: [AppController],
  providers: [AppService, RedisService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('*'); // Apply to all routes
  }
}
