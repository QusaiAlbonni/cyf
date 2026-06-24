import { ExecutionContext, SetMetadata } from '@nestjs/common';

export const DYNAMIC_CACHE_KEY_METADATA = 'DYNAMIC_CACHE_KEY_METADATA';

export const DynamicCacheKey = (factory: CacheKeyFactory) =>
  SetMetadata(DYNAMIC_CACHE_KEY_METADATA, factory);


export type CacheKeyFactory = (context: ExecutionContext) => string;