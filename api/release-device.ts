import type { IncomingMessage, ServerResponse } from 'node:http';
import { getRedis } from '../src/lib/redis';
import { isValidCodeFormat, normalizeClaimCode } from '../src/lib/code';

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
        message: 'Invalid claim code format.',
      });
    }

    const normalizedCode = normalizeClaimCode(codeRaw);
    const redis = getRedis();

    const removedCount = await redis.srem(`claim:${normalizedCode}:devices`, deviceHash);

    return res.status(200).json({
      success: true,
      released: removedCount > 0,
    });
  } catch (err) {
    console.error('[api/release-device] Internal error:', err);
    return res.status(500).json({
      error: 'internal_error',
      message: err instanceof Error ? err.message : 'Failed to release device',
    });
  }
}
