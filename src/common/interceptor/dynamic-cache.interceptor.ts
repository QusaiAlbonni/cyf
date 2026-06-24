import { ExecutionContext, Inject, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';
import {
  CacheKeyFactory,
  DYNAMIC_CACHE_KEY_METADATA,
} from '../decorator/dynamic-cache-key.decorator';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class DynamicCacheInterceptor extends CacheInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) protected readonly cacheManager: any,
    protected readonly reflector: Reflector,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    super(cacheManager, reflector);
  }

  trackBy(
    context: ExecutionContext,
  ): string | Promise<string | null | undefined> | null | undefined {
    const handler = context.getHandler();
    const keyFactory = this.reflector.get<CacheKeyFactory>(
      DYNAMIC_CACHE_KEY_METADATA,
      handler,
    );

    if (keyFactory) {
      try {
        return keyFactory(context);
      } catch (e) {
        this.logger.warn('Error generating dynamic cache key:', e);
        return undefined;
      }
    }

    return super.trackBy(context);
  }
}
