import type { IncomingMessage, ServerResponse } from 'node:http';
import { getRedis } from '../src/lib/redis';

interface ExtendedRequest extends IncomingMessage {
  query?: Record<string, string>;
}

interface ExtendedResponse extends ServerResponse {
  status: (statusCode: number) => ExtendedResponse;
  json: (data: unknown) => void;
  setHeader: (name: string, value: string) => this;
}

export default async function handler(req: ExtendedRequest, res: ExtendedResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const redis = getRedis();
    const [isOpenVal, counterVal] = await Promise.all([
      redis.get<string>('claims:open'),
      redis.get<string | number>('claim:counter'),
    ]);

    const isOpen = isOpenVal === '1' || isOpenVal === 'true';
    const totalClaims = Number(counterVal) || 0;

    return res.status(200).json({
      status: 'success',
      isOpen,
      totalClaims,
    });
  } catch (err) {
    // If Redis is not yet configured or fails, fallback to closed state gracefully
    return res.status(200).json({
      status: 'success',
      isOpen: false,
      totalClaims: 0,
      notice: err instanceof Error ? err.message : 'Database unavailable',
    });
  }
}
