import type { IncomingMessage, ServerResponse } from 'node:http';
import { getRedis } from '../src/lib/redis';
import { verifyEntitlement } from '../src/lib/entitlement';
import { getClientIp, hashIp, checkRateLimit } from '../src/lib/security';

interface ExtendedRequest extends IncomingMessage {
  headers: Record<string, string | string[] | undefined>;
}

interface ExtendedResponse extends ServerResponse {
  status: (statusCode: number) => ExtendedResponse;
  json: (data: unknown) => void;
  setHeader: (name: string, value: string) => this;
}

export default async function handler(req: ExtendedRequest, res: ExtendedResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = String(req.headers.authorization || req.headers.Authorization || '');
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Bearer entitlement token is required in Authorization header.',
      });
    }

    const token = authHeader.slice(7).trim();
    const keyPem = process.env.ENTITLEMENT_PRIVATE_KEY || process.env.ENTITLEMENT_PUBLIC_KEY;
    if (!keyPem) {
      throw new Error('Entitlement verification key is not configured on the server');
    }

    const payload = verifyEntitlement(token, keyPem);
    if (!payload || !payload.bg_id) {
      return res.status(401).json({
        error: 'invalid_entitlement',
        message: 'The provided entitlement token is invalid or corrupted.',
      });
    }

    // Rate limit per IP (60 requests per hour)
    const redis = getRedis();
    const clientIp = getClientIp(req.headers);
    const ipHash = hashIp(clientIp);
    const rateLimit = await checkRateLimit(redis, `rl:assets:${ipHash}`, 60, 3600);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'rate_limited',
        message: 'Asset download rate limit reached. Please try again later.',
      });
    }

    // Fetch Blob URLs stored in Redis
    const bgMeta = await redis.hgetall<Record<string, string>>(`bg:${payload.bg_id}`);

    return res.status(200).json({
      success: true,
      bgId: payload.bg_id,
      rarity: payload.rarity,
      expand: bgMeta?.url_expand || null,
      compact: bgMeta?.url_compact || null,
    });
  } catch (err) {
    console.error('[api/assets] Internal error:', err);
    return res.status(500).json({
      error: 'internal_error',
      message: err instanceof Error ? err.message : 'Failed to retrieve reward assets',
    });
  }
}
