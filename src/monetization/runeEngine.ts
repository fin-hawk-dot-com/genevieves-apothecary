import { CRAFT_RECIPES, ITEMS } from '../data/gameData';

/**
 * Starlight Runes Monetization & Pluggable Checkout Engine
 * - Currently wired to `SandboxTestCheckoutProvider` (instant auto-approval on user confirm,
 *   collecting zero payment credentials while testing).
 * - Cleanly structured so Apple StoreKit 2 / RevenueCat / Google Play Billing / Stripe
 *   can replace `activePaymentProvider` in production without changing game store or modal code.
 */

export interface RunePackDef {
  id: string;
  name: string;
  runes: number;
  bonusRunes: number;
  priceUsd: string;
  badge?: string;
  icon: string;
  accent: string;
}

export interface RareRuneBundleDef {
  id: string;
  name: string;
  description: string;
  runeCost: number;
  icon: string;
  grants: { itemId: string; count: number }[];
}

export interface CheckoutReceipt {
  receiptId: string;
  packId: string;
  runesGranted: number;
  priceDisplay: string;
  mode: 'sandbox-test' | 'live';
  timestampIso: string;
}

export interface PaymentProvider {
  readonly mode: 'sandbox-test' | 'live';
  authorizePackagePurchase(pack: RunePackDef): Promise<CheckoutReceipt>;
}

export const RUNE_PACKAGES: RunePackDef[] = [
  {
    id: 'pack_pouch',
    name: 'Apprentice Pouch',
    runes: 50,
    bonusRunes: 0,
    priceUsd: '$0.99',
    icon: './assets/ui/rune_pack_pouch.png?v=8',
    accent: '#9f7aea'
  },
  {
    id: 'pack_satchel',
    name: 'Herbalist Coffer',
    runes: 150,
    bonusRunes: 25,
    priceUsd: '$2.99',
    badge: 'POPULAR',
    icon: './assets/ui/rune_pack_coffer.png?v=8',
    accent: '#4fd1c5'
  },
  {
    id: 'pack_chest',
    name: 'Alchemist Reliquary',
    runes: 400,
    bonusRunes: 80,
    priceUsd: '$6.99',
    badge: 'BEST VALUE',
    icon: './assets/ui/rune_pack_chest.png?v=8',
    accent: '#ecc94b'
  },
  {
    id: 'pack_vault',
    name: 'Grandmaster Chest',
    runes: 1000,
    bonusRunes: 250,
    priceUsd: '$14.99',
    badge: '+250 BONUS',
    icon: './assets/ui/rune_pack_vault.png?v=8',
    accent: '#f6ad55'
  }
];

export const RUNE_RARE_BUNDLES: RareRuneBundleDef[] = [
  {
    id: 'bundle_moonpetal',
    name: 'Moonpetal Lily ×3',
    description: 'Rare luminous brookside blossoms for masterwork elixirs.',
    runeCost: 12,
    icon: './assets/items/raw_moonpetal.png?v=8',
    grants: [{ itemId: 'raw_moonpetal', count: 3 }]
  },
  {
    id: 'bundle_lavender_resin',
    name: 'Starlight & Amber ×3',
    description: '3 Starlight Lavender bundles + 3 Amber Pine Resin.',
    runeCost: 14,
    icon: './assets/items/raw_lavender.png?v=8',
    grants: [
      { itemId: 'raw_lavender', count: 3 },
      { itemId: 'raw_resin', count: 3 }
    ]
  },
  {
    id: 'bundle_poultice_kit',
    name: 'Healer’s Linen & Bark ×4',
    description: '4 Woven Linen & Honey + 4 Creekside Willowbark.',
    runeCost: 10,
    icon: './assets/items/raw_linen.png?v=8',
    grants: [
      { itemId: 'raw_linen', count: 4 },
      { itemId: 'raw_willowbark', count: 4 }
    ]
  },
  {
    id: 'bundle_essences',
    name: 'Distilled Essences ×2',
    description: 'Ready-to-brew Moon Powder, Chamomile Essence & Mint Paste (×2 each).',
    runeCost: 22,
    icon: './assets/items/prep_moonpetal.png?v=8',
    grants: [
      { itemId: 'prep_moonpetal', count: 2 },
      { itemId: 'prep_chamomile', count: 2 },
      { itemId: 'prep_mint', count: 2 }
    ]
  }
];

export const RUNE_UPGRADE_COSTS: Record<string, number> = {
  upg_shelf_6: 18,
  upg_cozy_residence: 20,
  upg_garden_beds: 22,
  upg_golden_mortar: 28,
  upg_lantern_sign: 32,
  tool_shears: 16,
  tool_lantern: 20,
  tool_satchel: 22,
  tool_pick: 24
};

export const RUNE_RECIPE_UNLOCK_COSTS: Record<string, number> = {
  craft_willow_poultice: 15,
  craft_ginger_tonic: 15,
  craft_ginger_poultice: 18,
  craft_resin_salve: 20,
  craft_lavender_elixir: 24,
  craft_frostfire_poultice: 28,
  craft_heartwood_poultice: 32,
  craft_moonpetal_elixir: 35,
  craft_starfall_elixir: 40
};

/**
 * Computes exact Starlight Rune cost to supply only the missing ingredients of a recipe.
 */
export function getMissingIngredientsSpec(
  craftRecipeId: string,
  inventory: Record<string, number>
): { missing: { itemId: string; count: number }[]; runeCost: number } {
  const recipe = CRAFT_RECIPES.find((r) => r.id === craftRecipeId);
  if (!recipe) return { missing: [], runeCost: 0 };

  const missing: { itemId: string; count: number }[] = [];
  let cost = 0;

  for (const req of recipe.ingredients) {
    const have = inventory[req.itemId] || 0;
    if (have < req.count) {
      const diff = req.count - have;
      missing.push({ itemId: req.itemId, count: diff });
      const item = ITEMS[req.itemId];
      const perUnit = item ? Math.max(4, Math.round(item.baseValue * 0.42)) : 5;
      cost += perUnit * diff;
    }
  }
  return { missing, runeCost: cost };
}

export function getRawHerbPackRuneCost(itemId: string, count = 3): number {
  const item = ITEMS[itemId];
  if (!item) return 9;
  return Math.max(6, Math.round(item.baseValue * 0.25 * count));
}

class SandboxTestCheckoutProvider implements PaymentProvider {
  public readonly mode = 'sandbox-test' as const;

  public async authorizePackagePurchase(pack: RunePackDef): Promise<CheckoutReceipt> {
    // Brief tactile confirmation beat (no card/payment details collected in testing mode)
    await new Promise((resolve) => window.setTimeout(resolve, 260));
    const totalRunes = pack.runes + pack.bonusRunes;
    return {
      receiptId: `TEST-RUNE-${Date.now().toString(36).toUpperCase()}`,
      packId: pack.id,
      runesGranted: totalRunes,
      priceDisplay: pack.priceUsd,
      mode: 'sandbox-test',
      timestampIso: new Date().toISOString()
    };
  }
}

export const activePaymentProvider: PaymentProvider = new SandboxTestCheckoutProvider();
