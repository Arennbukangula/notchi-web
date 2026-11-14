import { describe, expect, it } from 'vitest';
import { pickWeightedItem } from '../src/lib/gacha';
import { REWARDS_CATALOG, type RewardItem } from '../src/lib/rewards-catalog';

describe('Gacha Weighted Distribution', () => {
  it('picks candidate proportionally to weight over large sample', () => {
    const testItems: RewardItem[] = [
      { id: 'item_a', name: 'Item A', rarity: 'common', weight: 80, description: '', badgeId: '', previewColor: '' },
      { id: 'item_b', name: 'Item B', rarity: 'rare', weight: 20, description: '', badgeId: '', previewColor: '' },
    ];

    const counts: Record<string, number> = { item_a: 0, item_b: 0 };
    const TOTAL_ROLLS = 10000;

    for (let i = 0; i < TOTAL_ROLLS; i++) {
      const picked = pickWeightedItem(testItems);
      counts[picked.id] += 1;
    }

    // Expected ~80% A and ~20% B (allowing +/- 3% tolerance)
    const ratioA = counts.item_a / TOTAL_ROLLS;
    const ratioB = counts.item_b / TOTAL_ROLLS;

    expect(ratioA).toBeGreaterThan(0.76);
    expect(ratioA).toBeLessThan(0.84);
    expect(ratioB).toBeGreaterThan(0.16);
    expect(ratioB).toBeLessThan(0.24);
  });

  it('works with standard REWARDS_CATALOG', () => {
    for (let i = 0; i < 50; i++) {
      const picked = pickWeightedItem(REWARDS_CATALOG);
      expect(picked).toBeDefined();
      expect(picked.id).toMatch(/^bg_0[1-7]$/);
    }
  });

  it('throws error when candidates array is empty', () => {
    expect(() => pickWeightedItem([])).toThrow('No candidate rewards available');
  });
});
