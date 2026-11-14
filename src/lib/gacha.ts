import { randomInt } from 'node:crypto';
import type { Redis } from '@upstash/redis';
import { REWARDS_CATALOG, type RewardItem } from './rewards-catalog';

/**
 * Picks a reward item from candidates using cryptographic randomInt based on weights.
 */
export function pickWeightedItem(candidates: readonly RewardItem[]): RewardItem {
  if (candidates.length === 0) {
    throw new Error('No candidate rewards available');
  }

  const totalWeight = candidates.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    return candidates[0];
  }

  const roll = randomInt(0, totalWeight);
  let cumulative = 0;

  for (const item of candidates) {
    cumulative += item.weight;
    if (roll < cumulative) {
      return item;
    }
  }

  return candidates[candidates.length - 1];
}

/**
 * Rolls for a gacha reward with Redis-backed atomic quota enforcement.
 * If an item's quota is exhausted, it is removed from candidates and re-rolled.
 */
export async function rollGachaReward(redis: Redis): Promise<RewardItem> {
  let candidates: RewardItem[] = [...REWARDS_CATALOG];

  while (candidates.length > 0) {
    const selected = pickWeightedItem(candidates);

    if (!selected.quota || selected.quota <= 0) {
      return selected;
    }

    // Atomically increment quota counter
    const count = await redis.incr(`bg:${selected.id}:count`);
    if (count <= selected.quota) {
      return selected;
    }

    // Rollback counter if quota exceeded
    await redis.decr(`bg:${selected.id}:count`);
    candidates = candidates.filter((item) => item.id !== selected.id);
  }

  return REWARDS_CATALOG[0];
}
