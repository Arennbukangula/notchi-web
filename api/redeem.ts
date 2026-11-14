import type { IncomingMessage, ServerResponse } from 'node:http';
import { getRedis } from '../src/lib/redis';
import { isValidCodeFormat, normalizeClaimCode } from '../src/lib/code';
import { getClientIp, hashIp, checkRateLimit } from '../src/lib/security';
import { createEntitlement } from '../src/lib/entitlement';

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
    const codeRaw = String(body.code || '');
    const deviceHash = String(body.deviceHash || '').trim();

    if (!codeRaw || !deviceHash) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Claim code and deviceHash are required.',
      });
    }

    if (!isValidCodeFormat(codeRaw)) {
      return res.status(400).json({
        error: 'invalid_code_format',
        message: 'Invalid claim code format. Example: NOTCHI-XXXX-XXXX',
      });
    }

    const normalizedCode = normalizeClaimCode(codeRaw);
    const redis = getRedis();

    // 1. Rate limit per IP to deter brute-forcing (30 attempts per hour = 3600s)
    const clientIp = getClientIp(req.headers);
    const ipHash = hashIp(clientIp);
    const rateLimit = await checkRateLimit(redis, `rl:redeem:${ipHash}`, 30, 3600);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'rate_limited',
        message: 'Too many redemption attempts. Please try again later.',
      });
    }

    // 2. Fetch claim from Redis
    const claimData = await redis.hgetall<Record<string, string>>(`claim:${normalizedCode}`);
    if (!claimData || !claimData.bg_id) {
      return res.status(404).json({
        error: 'code_not_found',
        message: 'Claim code does not exist or has expired.',
      });
    }

    // 3. Check and enforce 3-device limit
    const devicesKey = `claim:${normalizedCode}:devices`;
    const isAlreadyRegistered = await redis.sismember(devicesKey, deviceHash);

    if (!isAlreadyRegistered) {
      const currentDeviceCount = await redis.scard(devicesKey);
      if (currentDeviceCount >= 3) {
        return res.status(403).json({
          error: 'device_limit',
          message: 'Maximum limit of 3 devices has been reached for this claim code.',
        });
      }
      await redis.sadd(devicesKey, deviceHash);
    }

    // 4. Generate signed entitlement
    const privateKey = process.env.ENTITLEMENT_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('ENTITLEMENT_PRIVATE_KEY is not configured on the server');
    }

    const entitlement = createEntitlement(
      {
        v: 1,
        code: normalizedCode,
        claim_number: Number(claimData.claim_number) || 0,
        bg_id: claimData.bg_id,
        badge_id: claimData.badge_id || '',
        rarity: claimData.rarity || 'common',
        device_hash: deviceHash,
        issued_at: Math.floor(Date.now() / 1000),
      },
      privateKey
    );

    return res.status(200).json({
      success: true,
      entitlement,
      claimNumber: Number(claimData.claim_number) || 0,
      rarity: claimData.rarity,
      bgId: claimData.bg_id,
      badgeId: claimData.badge_id,
    });
  } catch (err) {
    console.error('[api/redeem] Internal error:', err);
    return res.status(500).json({
      error: 'internal_error',
      message: err instanceof Error ? err.message : 'Failed to redeem reward code',
    });
  }
}
