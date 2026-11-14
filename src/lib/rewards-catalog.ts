export type RewardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface RewardItem {
  readonly id: string;
  readonly name: string;
  readonly rarity: RewardRarity;
  readonly weight: number; // Raw integer weight for random roll
  readonly quota?: number; // Optional maximum total quota
  readonly description: string;
  readonly badgeId: string;
  readonly previewColor: string;
}

export const REWARDS_CATALOG: readonly RewardItem[] = [
  {
    id: 'bg_01',
    name: 'Midnight Obsidian',
    rarity: 'common',
    weight: 25,
    description: 'Deep matte dark theme inspired by industrial carbon architecture.',
    badgeId: 'badge_obsidian',
    previewColor: 'linear-gradient(135deg, #18181b, #09090b)',
  },
  {
    id: 'bg_02',
    name: 'Aero Cyber',
    rarity: 'common',
    weight: 25,
    description: 'Electric cyan and midnight blue gradient with retro-futuristic HUD vibes.',
    badgeId: 'badge_cyber',
    previewColor: 'linear-gradient(135deg, #0284c7, #0f172a)',
  },
  {
    id: 'bg_03',
    name: 'Glacier Frost',
    rarity: 'common',
    weight: 24,
    description: 'Subtle icy crystalline textures crafted for minimalist desktop aesthetics.',
    badgeId: 'badge_frost',
    previewColor: 'linear-gradient(135deg, #38bdf8, #1e293b)',
  },
  {
    id: 'bg_04',
    name: 'Sakura Twilight',
    rarity: 'rare',
    weight: 12,
    description: 'Warm dusk magenta and cherry blossom gradients over darkened slate.',
    badgeId: 'badge_sakura',
    previewColor: 'linear-gradient(135deg, #f43f5e, #18181b)',
  },
  {
    id: 'bg_05',
    name: 'Solar Amber',
    rarity: 'rare',
    weight: 10,
    description: 'Rich sunset gold and deep burnished amber glowing at the edges.',
    badgeId: 'badge_amber',
    previewColor: 'linear-gradient(135deg, #f59e0b, #1c1917)',
  },
  {
    id: 'bg_06',
    name: 'Void Nebula',
    rarity: 'epic',
    weight: 3,
    quota: 500,
    description: 'Cosmic violet deep space star-field with layered atmospheric nebulae.',
    badgeId: 'badge_nebula',
    previewColor: 'linear-gradient(135deg, #8b5cf6, #09090b)',
  },
  {
    id: 'bg_07',
    name: 'Prismatic Aurora',
    rarity: 'legendary',
    weight: 1,
    quota: 100,
    description: 'Ultra-rare holographic shifting spectrum designed for milestone celebratory builds.',
    badgeId: 'badge_aurora',
    previewColor: 'linear-gradient(135deg, #ec4899, #6366f1, #14b8a6)',
  },
] as const;

export function getRewardById(id: string): RewardItem | undefined {
  return REWARDS_CATALOG.find((item) => item.id === id);
}

export function calculateDropRates(): { id: string; name: string; rarity: RewardRarity; percentage: number }[] {
  const totalWeight = REWARDS_CATALOG.reduce((acc, item) => acc + item.weight, 0);
  return REWARDS_CATALOG.map((item) => ({
    id: item.id,
    name: item.name,
    rarity: item.rarity,
    percentage: Math.round((item.weight / totalWeight) * 1000) / 10,
  }));
}
