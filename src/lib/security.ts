import { createHmac } from 'node:crypto';
import type { Redis } from '@upstash/redis';

/**
 * Extracts client IP from common forward headers.
 */
export function getClientIp(headers: Headers | Record<string, string | string[] | undefined>): string {
  const getHeader = (name: string): string | undefined => {
    if (headers instanceof Headers) {
      return headers.get(name) || undefined;
    }
    const val = headers[name] || headers[name.toLowerCase()];
    if (Array.isArray(val)) return val[0];
    return val;
  };

  const forwarded = getHeader('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }

  return getHeader('cf-connecting-ip') || getHeader('x-real-ip') || '127.0.0.1';
}

/**
 * Anonymously hashes IP address with salt. Only the hash is stored, never raw IP.
 */
export function hashIp(ip: string, salt: string = process.env.IP_HASH_SALT || 'notchi-default-salt'): string {
  return createHmac('sha256', salt).update(ip).digest('hex').slice(0, 32);
}

/**
 * Redis-backed fixed window rate limiter.
 */
export async function checkRateLimit(
  redis: Redis,
  key: string,
  maxLimit: number,
  ttlSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, ttlSeconds);
  }

  const remaining = Math.max(0, maxLimit - count);
  return {
    allowed: count <= maxLimit,
    remaining,
  };
}

/**
 * Verifies Cloudflare Turnstile token via Cloudflare siteverify endpoint.
 */
export async function verifyTurnstileToken(token: string, clientIp?: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[security] TURNSTILE_SECRET_KEY not set, bypassing in development');
      return true;
    }
    return false;
  }

  if (!token) return false;

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (clientIp) formData.append('remoteip', clientIp);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) return false;
    const json = (await res.json()) as { success: boolean };
    return Boolean(json.success);
  } catch (err) {
    console.error('[security] Turnstile verification error:', err);
    return false;
  }
}
