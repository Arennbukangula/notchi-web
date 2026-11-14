import { Redis } from '@upstash/redis';

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (!redisInstance) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    if (!url || !token) {
      throw new Error(
        'Upstash Redis URL and Token must be configured in environment (UPSTASH_REDIS_REST_URL / KV_REST_API_URL)'
      );
    }

    redisInstance = new Redis({
      url,
      token,
    });
  }

  return redisInstance;
}
