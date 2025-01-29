import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager'
@Injectable()

export class AppService {


  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }


  async setCacheKey(key: string, value: string): Promise<void> {
    await this.cacheManager.set
  }


  async getCacheKey(key: string): Promise<string | null> {
    return await this.cacheManager.get(key);
  }





}
