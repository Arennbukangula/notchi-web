import type { IncomingMessage, ServerResponse } from 'node:http';
import { getRedis } from '../src/lib/redis';
import { rollGachaReward } from '../src/lib/gacha';
import { generateClaimCode } from '../src/lib/code';
import { getClientIp, hashIp, checkRateLimit, verifyTurnstileToken } from '../src/lib/security';

interface ExtendedRequest extends IncomingMessage {
  body?: unknown;
}

interface ExtendedResponse extends ServerResponse {
  status: (statusCode: number) => ExtendedResponse;
  json: (data: unknown) => void;
  setHeader: (name: string, value: string) => this;
}

export default async function handler(req: ExtendedRequest, res: ExtendedResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = req.body;
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody || {};
    const turnstileToken = String(body.turnstileToken || '');

    const redis = getRedis();

    // 1. Check if claims are open
    const isOpenVal = await redis.get<string>('claims:open');
    if (isOpenVal !== '1' && isOpenVal !== 'true') {
      return res.status(403).json({
        error: 'claims_closed',
        message: 'Reward claims are currently closed.',
      });
    }

    // 2. Client IP & Turnstile verification
    const clientIp = getClientIp(req.headers);
    const ipHash = hashIp(clientIp);

    const isHuman = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!isHuman) {
      return res.status(400).json({
        error: 'invalid_captcha',
        message: 'Anti-bot verification failed. Please try again.',
      });
    }

    // 3. Rate limit per IP (3 claims per 24 hours = 86400s)
    const rateLimit = await checkRateLimit(redis, `rl:claim:${ipHash}`, 3, 86400);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'rate_limited',
        message: 'Daily claim limit reached for this network (maximum 3 per day).',
      });
    }

    // 4. Roll for Gacha Reward with atomic quota check
    const reward = await rollGachaReward(redis);

    // 5. Increment global claim counter
    const claimNumber = await redis.incr('claim:counter');

    // 6. Generate unique claim code (with collision retry)
    let code = generateClaimCode();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await redis.exists(`claim:${code}`);
      if (!exists) break;
      code = generateClaimCode();
      attempts += 1;
    }

    // 7. Store claim details in Redis hash
    await redis.hset(`claim:${code}`, {
      claim_number: claimNumber,
      bg_id: reward.id,
      badge_id: reward.badgeId,
      rarity: reward.rarity,
      created_at: new Date().toISOString(),
      ip_hash: ipHash,
    });

    // 8. Fetch preview URL if uploaded to Blob
    const bgMeta = await redis.hgetall<Record<string, string>>(`bg:${reward.id}`);
    const previewUrl = bgMeta?.url_compact || bgMeta?.url_expand || null;

    return res.status(200).json({
      success: true,
      code,
      claimNumber,
      bg: {
        id: reward.id,
        name: reward.name,
        rarity: reward.rarity,
        description: reward.description,
        previewColor: reward.previewColor,
        previewUrl,
      },
    });
  } catch (err) {
    console.error('[api/claim] Internal error:', err);
    return res.status(500).json({
      error: 'internal_error',
      message: err instanceof Error ? err.message : 'Failed to process reward claim',
    });
  }
}
