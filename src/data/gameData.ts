export type ItemCategory = 'raw' | 'prepared' | 'potion' | 'poultice';
export type PrepMethod = 'slice' | 'grind' | 'distill';
export type ZoneId =
  | 'interior'
  | 'outskirts'
  | 'village'
  | 'whisperwood'
  | 'mire'
  | 'crag'
  | 'grove'
  | 'sanctum'
  | 'grotto';

export type ToolUpgradeId = 'tool_shears' | 'tool_lantern' | 'tool_pick' | 'tool_satchel';

export const ZONE_INFO: Record<
  ZoneId,
  { name: string; dangerLevel: 0 | 1 | 2 | 3 | 4; regionTag: string }
> = {
  interior: { name: "Genevieve's Apothecary", dangerLevel: 0, regionTag: 'Safe Sanctuary' },
  outskirts: { name: 'Outskirts Homestead & Brook', dangerLevel: 0, regionTag: 'Sunny Meadow' },
  village: { name: 'Willowmere Village Square', dangerLevel: 0, regionTag: 'Town Hub' },
  whisperwood: { name: 'Thornveil Deepwood', dangerLevel: 1, regionTag: 'Spore Woods (Danger ★)' },
  mire: { name: 'Sunken Mistfen Bog', dangerLevel: 2, regionTag: 'Miasma Marsh (Danger ★★)' },
  crag: { name: 'Frostpeak Crags & Grotto', dangerLevel: 3, regionTag: 'Alpine Gales (Danger ★★★)' },
  grove: { name: 'Hollowroot Druid Grove', dangerLevel: 2, regionTag: 'Inner Deepwood (Danger ★★)' },
  sanctum: { name: 'Standing-Stone Sanctum', dangerLevel: 3, regionTag: 'Sunken Temple (Danger ★★★)' },
  grotto: { name: 'Starfall Crystal Grotto', dangerLevel: 4, regionTag: 'Deep Cavern (Danger ★★★★)' }
};

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  icon: string;
  description: string;
  baseValue: number;
  accentColor: string;
  sourceHint?: string;
}

export interface PrepRecipe {
  id: string;
  inputId: string;
  outputId: string;
  method: PrepMethod;
  methodLabel: string;
  actionVerb: string;
  stepsRequired: number;
}

export interface CraftRecipe {
  id: string;
  outputId: string;
  station: 'cauldron' | 'poultice';
  ingredients: { itemId: string; count: number }[];
  brewColor: string;
  starterUnlocked?: boolean;
  unlockHint: string;
  effectSummary: string;
}

export interface VillagerDef {
  id: string;
  name: string;
  title: string;
  sprite: string;
  portrait: string;
  zone: ZoneId;
  x: number;
  y: number;
  accentColor: string;
  greeting: string;
  favoriteItemIds: string[];
  tradeOffers: { itemId: string; price: number; label: string }[];
}

export interface CareTargetSpec {
  limbTitle: string;
  ailmentDesc: string;
  remedyItemId: string;
  spotLabels: [string, string, string];
  pasteColor: string;
  thankYouLine: string;
}

export interface QuestDef {
  id: string;
  title: string;
  giverId: string;
  chapter: number;
  summary: string;
  dialogueIntro: string;
  dialogueComplete: string;
  requiredItemId: string;
  requiredCount: number;
  requiresCareApplication?: CareTargetSpec;
  rewardGold: number;
  rewardRecipeId?: string;
  rewardItems?: { itemId: string; count: number }[];
  prerequisiteQuestId?: string;
}

export interface ShopUpgradeDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
}

export interface ToolUpgradeDef {
  id: ToolUpgradeId;
  name: string;
  shortLabel: string;
  description: string;
  perkSummary: string;
  cost: number;
  runeCost: number;
  icon: string;
}

export const ITEMS: Record<string, ItemDef> = {
  // Raw Botanicals & Base Supplies
  raw_chamomile: {
    id: 'raw_chamomile',
    name: 'Sunblossom Chamomile',
    category: 'raw',
    icon: './assets/items/raw_chamomile.png?v=8',
    description: 'Golden-centered meadow blossoms warm to the touch.',
    baseValue: 6,
    accentColor: '#f3c65f',
    sourceHint: 'Forage in Outskirts Meadow'
  },
  raw_mint: {
    id: 'raw_mint',
    name: 'Silverleaf Mint',
    category: 'raw',
    icon: './assets/items/raw_mint.png?v=8',
    description: 'Dewy frosted mint sprigs gathered beside the cool brook.',
    baseValue: 6,
    accentColor: '#58d5a8',
    sourceHint: 'Forage near Outskirts Brook'
  },
  raw_willowbark: {
    id: 'raw_willowbark',
    name: 'Willowbark',
    category: 'raw',
    icon: './assets/items/raw_willowbark.png?v=8',
    description: 'Aromatic russet bark prized by herbalists for soothing joints.',
    baseValue: 8,
    accentColor: '#c97b53',
    sourceHint: 'Forage near Whispering Trees'
  },
  raw_ginger: {
    id: 'raw_ginger',
    name: 'Emberginger Root',
    category: 'raw',
    icon: './assets/items/raw_ginger.png?v=8',
    description: 'Knobby sun-warmed root that radiates gentle spice.',
    baseValue: 9,
    accentColor: '#ef8b3b',
    sourceHint: 'Forage on Sunny Ridge'
  },
  raw_resin: {
    id: 'raw_resin',
    name: 'Amber Pine Resin',
    category: 'raw',
    icon: './assets/items/raw_resin.png?v=8',
    description: 'Translucent golden droplets from ancient forest pines.',
    baseValue: 10,
    accentColor: '#e9ad3b',
    sourceHint: 'Forage under Pines or trade with Rowan'
  },
  raw_lavender: {
    id: 'raw_lavender',
    name: 'Starlight Lavender',
    category: 'raw',
    icon: './assets/items/raw_lavender.png?v=8',
    description: 'Fragrant violet stalks that hum with peaceful twilight calm.',
    baseValue: 11,
    accentColor: '#a97cf8',
    sourceHint: 'Forage in Upper Glade'
  },
  raw_moonpetal: {
    id: 'raw_moonpetal',
    name: 'Moonpetal Lily',
    category: 'raw',
    icon: './assets/items/raw_moonpetal.png?v=8',
    description: 'Rare pearlescent blossom blooming beside misty waters.',
    baseValue: 16,
    accentColor: '#7be3f5',
    sourceHint: 'Forage by Deep Brookside'
  },
  raw_linen: {
    id: 'raw_linen',
    name: 'Woven Linen & Honey',
    category: 'raw',
    icon: './assets/items/raw_linen.png?v=8',
    description: 'Soft breathable village linen paired with wildflower honey.',
    baseValue: 7,
    accentColor: '#eddab8',
    sourceHint: 'Trade in Willowmere Village'
  },
  raw_ghostcap: {
    id: 'raw_ghostcap',
    name: 'Luminescent Ghostcap',
    category: 'raw',
    icon: './assets/items/raw_ghostcap.png?v=8',
    description: 'Bioluminescent cyan-violet fungi growing in shadowy Thornveil Deepwood.',
    baseValue: 18,
    accentColor: '#67e8f9',
    sourceHint: 'Forage East of Village in Thornveil Deepwood'
  },
  raw_sundew: {
    id: 'raw_sundew',
    name: 'Crimson Mire Sundew',
    category: 'raw',
    icon: './assets/items/raw_sundew.png?v=8',
    description: 'Glistening ruby-amber marsh flower found along Sunken Mistfen boardwalks.',
    baseValue: 22,
    accentColor: '#fb7185',
    sourceHint: 'Forage South of Village in Sunken Mistfen Bog'
  },
  raw_frostbloom: {
    id: 'raw_frostbloom',
    name: 'Frostpeak Edelweiss',
    category: 'raw',
    icon: './assets/items/raw_frostbloom.png?v=8',
    description: 'Crystalline alpine star-flower blooming high on Frostpeak Crags.',
    baseValue: 26,
    accentColor: '#93c5fd',
    sourceHint: 'Forage North of Village on Frostpeak Crags'
  },
  raw_heartwood: {
    id: 'raw_heartwood',
    name: 'Heartwood Briar-Blossom',
    category: 'raw',
    icon: './assets/items/raw_heartwood.png?v=12',
    description: 'Golden-crimson blossom growing on silver briar vines inside Hollowroot Druid Grove.',
    baseValue: 32,
    accentColor: '#f59e0b',
    sourceHint: 'Prune with Silver Shears in Hollowroot Druid Grove'
  },
  raw_starlotus: {
    id: 'raw_starlotus',
    name: 'Abyssal Star-Lotus',
    category: 'raw',
    icon: './assets/items/raw_starlotus.png?v=12',
    description: 'Pearlescent twilight lotus blooming on dark sanctum pools when illuminated by Sunfire light.',
    baseValue: 36,
    accentColor: '#818cf8',
    sourceHint: 'Gather with Sunfire Lantern in Standing-Stone Sanctum'
  },
  raw_prismcrystal: {
    id: 'raw_prismcrystal',
    name: 'Starfall Prism Crystal',
    category: 'raw',
    icon: './assets/items/raw_prismcrystal.png?v=12',
    description: 'Resonant amethyst-and-cyan crystal shard chiming softly inside Starfall Crystal Grotto.',
    baseValue: 42,
    accentColor: '#c084fc',
    sourceHint: 'Mine with Crystal Pick-Hammer in Starfall Crystal Grotto'
  },

  // Prepared Ingredients
  prep_chamomile: {
    id: 'prep_chamomile',
    name: 'Chamomile Essence',
    category: 'prepared',
    icon: './assets/items/prep_chamomile.png?v=8',
    description: 'Pure sunlit floral essence distilled in the copper alembic.',
    baseValue: 12,
    accentColor: '#f7d469',
    sourceHint: 'Distill Sunblossom Chamomile at Prep Bench'
  },
  prep_mint: {
    id: 'prep_mint',
    name: 'Cooling Mint Paste',
    category: 'prepared',
    icon: './assets/items/prep_mint.png?v=8',
    description: 'Velvety emerald herbal paste ground in the stone mortar.',
    baseValue: 12,
    accentColor: '#4ad39e',
    sourceHint: 'Grind Silverleaf Mint at Prep Bench'
  },
  prep_willowbark: {
    id: 'prep_willowbark',
    name: 'Sliced Willowbark',
    category: 'prepared',
    icon: './assets/items/prep_willowbark.png?v=8',
    description: 'Thinly shaved ribbons ready to steep or infuse into wraps.',
    baseValue: 15,
    accentColor: '#d4865c',
    sourceHint: 'Slice Willowbark at Prep Bench'
  },
  prep_ginger: {
    id: 'prep_ginger',
    name: 'Crushed Emberginger',
    category: 'prepared',
    icon: './assets/items/prep_ginger.png?v=8',
    description: 'Aromatic warming spice powder freshly crushed by hand.',
    baseValue: 16,
    accentColor: '#f59542',
    sourceHint: 'Grind Emberginger Root at Prep Bench'
  },
  prep_resin: {
    id: 'prep_resin',
    name: 'Purified Golden Resin',
    category: 'prepared',
    icon: './assets/items/prep_resin.png?v=8',
    description: 'Clarified honey-gold balm base that seals healing wraps.',
    baseValue: 18,
    accentColor: '#f2ba49',
    sourceHint: 'Warm Amber Pine Resin at Prep Bench'
  },
  prep_lavender: {
    id: 'prep_lavender',
    name: 'Fragrant Lavender Buds',
    category: 'prepared',
    icon: './assets/items/prep_lavender.png?v=8',
    description: 'Neatly trimmed violet buds bursting with soothing oil.',
    baseValue: 19,
    accentColor: '#b58af9',
    sourceHint: 'Slice Starlight Lavender at Prep Bench'
  },
  prep_moonpetal: {
    id: 'prep_moonpetal',
    name: 'Luminous Moon Powder',
    category: 'prepared',
    icon: './assets/items/prep_moonpetal.png?v=8',
    description: 'Shimmering celestial petal dust for masterwork elixirs.',
    baseValue: 28,
    accentColor: '#84ecff',
    sourceHint: 'Grind Moonpetal Lily at Prep Bench'
  },
  prep_ghostcap: {
    id: 'prep_ghostcap',
    name: 'Sliced Ghostcap Gills',
    category: 'prepared',
    icon: './assets/items/prep_ghostcap.png?v=8',
    description: 'Delicately sliced glowing mushroom ribbons humming with warding light.',
    baseValue: 30,
    accentColor: '#67e8f9',
    sourceHint: 'Slice Luminescent Ghostcap on Cutting Board'
  },
  prep_sundew: {
    id: 'prep_sundew',
    name: 'Distilled Sundew Nectar',
    category: 'prepared',
    icon: './assets/items/prep_sundew.png?v=8',
    description: 'Warm ruby-amber marsh nectar condensed in the copper alembic.',
    baseValue: 34,
    accentColor: '#fb7185',
    sourceHint: 'Distill Crimson Mire Sundew in Copper Alembic'
  },
  prep_frostbloom: {
    id: 'prep_frostbloom',
    name: 'Crystalline Frost Powder',
    category: 'prepared',
    icon: './assets/items/prep_frostbloom.png?v=8',
    description: 'Sparkling alpine crystal powder ground fine in the granite mortar.',
    baseValue: 38,
    accentColor: '#93c5fd',
    sourceHint: 'Grind Frostpeak Edelweiss in Stone Mortar'
  },
  prep_heartwood: {
    id: 'prep_heartwood',
    name: 'Heartwood Briar Ribbons',
    category: 'prepared',
    icon: './assets/items/prep_heartwood.png?v=12',
    description: 'Warm amber-infused briar shavings humming with ancient grove vitality.',
    baseValue: 46,
    accentColor: '#f59e0b',
    sourceHint: 'Slice Heartwood Briar-Blossom on Cutting Board'
  },
  prep_starlotus: {
    id: 'prep_starlotus',
    name: 'Star-Lotus Ambrosia',
    category: 'prepared',
    icon: './assets/items/prep_starlotus.png?v=12',
    description: 'Luminous indigo-gold nectar condensed from sanctum star-lotus petals.',
    baseValue: 52,
    accentColor: '#818cf8',
    sourceHint: 'Distill Abyssal Star-Lotus in Copper Alembic'
  },
  prep_prismcrystal: {
    id: 'prep_prismcrystal',
    name: 'Astral Prism Dust',
    category: 'prepared',
    icon: './assets/items/prep_prismcrystal.png?v=12',
    description: 'Iridescent starlight crystal dust ground fine in the stone mortar.',
    baseValue: 58,
    accentColor: '#c084fc',
    sourceHint: 'Grind Starfall Prism Crystal in Stone Mortar'
  },

  // Brewed Potions (Cauldron)
  potion_chamomile: {
    id: 'potion_chamomile',
    name: 'Soothing Chamomile Draught',
    category: 'potion',
    icon: './assets/items/potion_chamomile.png?v=8',
    description: 'Warm golden tonic that melts away fatigue and brightens spirits.',
    baseValue: 34,
    accentColor: '#f7cd5d'
  },
  potion_ginger: {
    id: 'potion_ginger',
    name: 'Emberginger Warming Tonic',
    category: 'potion',
    icon: './assets/items/potion_ginger.png?v=8',
    description: 'Ruby-amber hearth tonic that chases away chill and restores vigor.',
    baseValue: 44,
    accentColor: '#f2783b'
  },
  potion_lavender: {
    id: 'potion_lavender',
    name: 'Dreamweaver Lavender Elixir',
    category: 'potion',
    icon: './assets/items/potion_lavender.png?v=8',
    description: 'Swirling amethyst elixir gifting peaceful, starlit slumber.',
    baseValue: 52,
    accentColor: '#a875fa'
  },
  potion_moonpetal: {
    id: 'potion_moonpetal',
    name: 'Moonpetal Restoration Elixir',
    category: 'potion',
    icon: './assets/items/potion_moonpetal.png?v=8',
    description: "Willowmere's legendary radiant cure-all, shimmering like moonlight on water.",
    baseValue: 85,
    accentColor: '#72e7fb'
  },
  potion_warding: {
    id: 'potion_warding',
    name: 'Lantern-Ward Elixir',
    category: 'potion',
    icon: './assets/items/potion_warding.png?v=8',
    description: 'Sunfire lantern draught that shields explorers from deepwood spores, mire miasma & frost.',
    baseValue: 74,
    accentColor: '#fbbf24'
  },
  potion_starfall: {
    id: 'potion_starfall',
    name: 'Astral Sovereign Elixir',
    category: 'potion',
    icon: './assets/items/potion_starfall.png?v=12',
    description: 'Legendary starlit panacea brewed from all three inner sanctums; grants a 120s Sovereign Ward & full vitality.',
    baseValue: 148,
    accentColor: '#c084fc'
  },

  // Herbal Poultices & Salves (Poultice Table)
  poultice_mint: {
    id: 'poultice_mint',
    name: 'Cooling Mint Poultice',
    category: 'poultice',
    icon: './assets/items/poultice_mint.png?v=8',
    description: 'Breathable linen herbal compress that cools forge burns on contact.',
    baseValue: 38,
    accentColor: '#56d6a1'
  },
  poultice_willow: {
    id: 'poultice_willow',
    name: 'Willowbark Joint Poultice',
    category: 'poultice',
    icon: './assets/items/poultice_willow.png?v=8',
    description: 'Comforting herbal wrist wrap infused with willowbark & cool mint.',
    baseValue: 42,
    accentColor: '#cf8960'
  },
  poultice_ginger: {
    id: 'poultice_ginger',
    name: 'Warming Ginger Ankle Poultice',
    category: 'poultice',
    icon: './assets/items/poultice_ginger.png?v=8',
    description: 'Quilted herbal compress radiating gentle heat for sprained ankles.',
    baseValue: 48,
    accentColor: '#ee9244'
  },
  poultice_resin: {
    id: 'poultice_resin',
    name: 'Golden Resin Healing Salve',
    category: 'poultice',
    icon: './assets/items/poultice_resin.png?v=8',
    description: 'Rich honey-pine salve & linen dressing for thorns and bee stings.',
    baseValue: 54,
    accentColor: '#ebbe47'
  },
  poultice_frostfire: {
    id: 'poultice_frostfire',
    name: 'Frostfire Alpine Poultice',
    category: 'poultice',
    icon: './assets/items/poultice_frostfire.png?v=8',
    description: 'Dual-tempered masterwork compress soothing deep mountain frostbite and bog chills.',
    baseValue: 96,
    accentColor: '#60a5fa'
  },
  poultice_heartwood: {
    id: 'poultice_heartwood',
    name: "Druid's Heartwood Poultice",
    category: 'poultice',
    icon: './assets/items/poultice_heartwood.png?v=12',
    description: 'Ancient elder-grove compress infused with Heartwood Briar & Star-Lotus Ambrosia.',
    baseValue: 124,
    accentColor: '#f59e0b'
  }
};

export const PREP_RECIPES: PrepRecipe[] = [
  {
    id: 'prep_r_chamomile',
    inputId: 'raw_chamomile',
    outputId: 'prep_chamomile',
    method: 'distill',
    methodLabel: 'Copper Alembic Still',
    actionVerb: 'Warm & Distill',
    stepsRequired: 3
  },
  {
    id: 'prep_r_mint',
    inputId: 'raw_mint',
    outputId: 'prep_mint',
    method: 'grind',
    methodLabel: 'Stone Mortar & Pestle',
    actionVerb: 'Crush & Grind',
    stepsRequired: 3
  },
  {
    id: 'prep_r_willowbark',
    inputId: 'raw_willowbark',
    outputId: 'prep_willowbark',
    method: 'slice',
    methodLabel: 'Herb Cutting Board',
    actionVerb: 'Slice Thinly',
    stepsRequired: 3
  },
  {
    id: 'prep_r_ginger',
    inputId: 'raw_ginger',
    outputId: 'prep_ginger',
    method: 'grind',
    methodLabel: 'Stone Mortar & Pestle',
    actionVerb: 'Crush Root',
    stepsRequired: 3
  },
  {
    id: 'prep_r_resin',
    inputId: 'raw_resin',
    outputId: 'prep_resin',
    method: 'distill',
    methodLabel: 'Copper Alembic Still',
    actionVerb: 'Clarify Resin',
    stepsRequired: 3
  },
  {
    id: 'prep_r_lavender',
    inputId: 'raw_lavender',
    outputId: 'prep_lavender',
    method: 'slice',
    methodLabel: 'Herb Cutting Board',
    actionVerb: 'Trim Blossoms',
    stepsRequired: 3
  },
  {
    id: 'prep_r_moonpetal',
    inputId: 'raw_moonpetal',
    outputId: 'prep_moonpetal',
    method: 'grind',
    methodLabel: 'Stone Mortar & Pestle',
    actionVerb: 'Grind Petals',
    stepsRequired: 3
  },
  {
    id: 'prep_r_ghostcap',
    inputId: 'raw_ghostcap',
    outputId: 'prep_ghostcap',
    method: 'slice',
    methodLabel: 'Herb Cutting Board',
    actionVerb: 'Slice Gills',
    stepsRequired: 3
  },
  {
    id: 'prep_r_sundew',
    inputId: 'raw_sundew',
    outputId: 'prep_sundew',
    method: 'distill',
    methodLabel: 'Copper Alembic Still',
    actionVerb: 'Distill Nectar',
    stepsRequired: 3
  },
  {
    id: 'prep_r_frostbloom',
    inputId: 'raw_frostbloom',
    outputId: 'prep_frostbloom',
    method: 'grind',
    methodLabel: 'Stone Mortar & Pestle',
    actionVerb: 'Grind Crystals',
    stepsRequired: 3
  },
  {
    id: 'prep_r_heartwood',
    inputId: 'raw_heartwood',
    outputId: 'prep_heartwood',
    method: 'slice',
    methodLabel: 'Herb Cutting Board',
    actionVerb: 'Slice Briar',
    stepsRequired: 3
  },
  {
    id: 'prep_r_starlotus',
    inputId: 'raw_starlotus',
    outputId: 'prep_starlotus',
    method: 'distill',
    methodLabel: 'Copper Alembic Still',
    actionVerb: 'Distill Ambrosia',
    stepsRequired: 3
  },
  {
    id: 'prep_r_prismcrystal',
    inputId: 'raw_prismcrystal',
    outputId: 'prep_prismcrystal',
    method: 'grind',
    methodLabel: 'Stone Mortar & Pestle',
    actionVerb: 'Grind Prism',
    stepsRequired: 3
  }
];

export const CRAFT_RECIPES: CraftRecipe[] = [
  {
    id: 'craft_chamomile',
    outputId: 'potion_chamomile',
    station: 'cauldron',
    ingredients: [
      { itemId: 'prep_chamomile', count: 1 },
      { itemId: 'prep_mint', count: 1 }
    ],
    brewColor: '#f5cc5c',
    starterUnlocked: true,
    unlockHint: 'Known from Genevieve’s Starter Journal',
    effectSummary: 'Restores calm & gentle energy'
  },
  {
    id: 'craft_mint_poultice',
    outputId: 'poultice_mint',
    station: 'poultice',
    ingredients: [
      { itemId: 'prep_mint', count: 1 },
      { itemId: 'prep_resin', count: 1 },
      { itemId: 'raw_linen', count: 1 }
    ],
    brewColor: '#56d6a1',
    starterUnlocked: true,
    unlockHint: 'Known from Genevieve’s Starter Journal',
    effectSummary: 'Cools burns & soothes skin'
  },
  {
    id: 'craft_willow_poultice',
    outputId: 'poultice_willow',
    station: 'poultice',
    ingredients: [
      { itemId: 'prep_willowbark', count: 1 },
      { itemId: 'prep_mint', count: 1 },
      { itemId: 'raw_linen', count: 1 }
    ],
    brewColor: '#cf8960',
    starterUnlocked: false,
    unlockHint: 'Shared by Clara the Baker in Willowmere',
    effectSummary: 'Relieves sore wrists & joints'
  },
  {
    id: 'craft_ginger_tonic',
    outputId: 'potion_ginger',
    station: 'cauldron',
    ingredients: [
      { itemId: 'prep_ginger', count: 1 },
      { itemId: 'prep_chamomile', count: 1 }
    ],
    brewColor: '#f2783b',
    starterUnlocked: false,
    unlockHint: 'Reward from Bram the Blacksmith',
    effectSummary: 'Warms chills & tired muscles'
  },
  {
    id: 'craft_ginger_poultice',
    outputId: 'poultice_ginger',
    station: 'poultice',
    ingredients: [
      { itemId: 'prep_ginger', count: 1 },
      { itemId: 'prep_willowbark', count: 1 },
      { itemId: 'raw_linen', count: 1 }
    ],
    brewColor: '#ee9244',
    starterUnlocked: false,
    unlockHint: 'Shared by Pip the Courier by the Village Bridge',
    effectSummary: 'Mends sprained ankles & aches'
  },
  {
    id: 'craft_resin_salve',
    outputId: 'poultice_resin',
    station: 'poultice',
    ingredients: [
      { itemId: 'prep_resin', count: 1 },
      { itemId: 'prep_lavender', count: 1 },
      { itemId: 'raw_linen', count: 1 }
    ],
    brewColor: '#ebbe47',
    starterUnlocked: false,
    unlockHint: 'Shared by Old Rowan the Beekeeper',
    effectSummary: 'Heals bramble scrapes & stings'
  },
  {
    id: 'craft_lavender_elixir',
    outputId: 'potion_lavender',
    station: 'cauldron',
    ingredients: [
      { itemId: 'prep_lavender', count: 1 },
      { itemId: 'prep_chamomile', count: 1 }
    ],
    brewColor: '#a875fa',
    starterUnlocked: false,
    unlockHint: 'Shared by Maeve the Weaver',
    effectSummary: 'Grants restful starlit sleep'
  },
  {
    id: 'craft_moonpetal_elixir',
    outputId: 'potion_moonpetal',
    station: 'cauldron',
    ingredients: [
      { itemId: 'prep_moonpetal', count: 1 },
      { itemId: 'prep_lavender', count: 1 },
      { itemId: 'prep_resin', count: 1 }
    ],
    brewColor: '#72e7fb',
    starterUnlocked: false,
    unlockHint: 'Unlocked during Maeve’s Willowmere Lantern Quest',
    effectSummary: 'Radiant festival restorative'
  },
  {
    id: 'craft_warding_elixir',
    outputId: 'potion_warding',
    station: 'cauldron',
    ingredients: [
      { itemId: 'prep_ghostcap', count: 1 },
      { itemId: 'prep_resin', count: 1 }
    ],
    brewColor: '#fbbf24',
    starterUnlocked: true,
    unlockHint: 'Known from Genevieve’s Frontier Expedition Notes',
    effectSummary: 'Grants 90s Golden Ward Shield against wild hazards'
  },
  {
    id: 'craft_frostfire_poultice',
    outputId: 'poultice_frostfire',
    station: 'poultice',
    ingredients: [
      { itemId: 'prep_frostbloom', count: 1 },
      { itemId: 'prep_sundew', count: 1 },
      { itemId: 'raw_linen', count: 1 }
    ],
    brewColor: '#60a5fa',
    starterUnlocked: false,
    unlockHint: 'Shared by Old Rowan for Frontier Expeditions',
    effectSummary: 'Heals deep alpine frostbite & mire chills'
  },
  {
    id: 'craft_heartwood_poultice',
    outputId: 'poultice_heartwood',
    station: 'poultice',
    ingredients: [
      { itemId: 'prep_heartwood', count: 1 },
      { itemId: 'prep_starlotus', count: 1 },
      { itemId: 'raw_linen', count: 1 }
    ],
    brewColor: '#f59e0b',
    starterUnlocked: false,
    unlockHint: 'Discovered in Hollowroot Grove or shared by Pip',
    effectSummary: 'Elder-grove restorative compress for deep strain'
  },
  {
    id: 'craft_starfall_elixir',
    outputId: 'potion_starfall',
    station: 'cauldron',
    ingredients: [
      { itemId: 'prep_prismcrystal', count: 1 },
      { itemId: 'prep_starlotus', count: 1 },
      { itemId: 'prep_heartwood', count: 1 }
    ],
    brewColor: '#c084fc',
    starterUnlocked: false,
    unlockHint: 'Discovered in Starfall Crystal Grotto or shared by Clara',
    effectSummary: 'Grants 120s Sovereign Ward Shield & full vitality'
  }
];

export const VILLAGERS: VillagerDef[] = [
  {
    id: 'bram',
    name: 'Bram',
    title: 'Village Blacksmith',
    sprite: './assets/characters/bram.png?v=8',
    portrait: './assets/portraits/bram.png?v=8',
    zone: 'village',
    x: 345,
    y: 470,
    accentColor: '#e07a47',
    greeting: "Welcome to Willowmere, Genevieve! That cottage on the outskirts hasn't smelled of fresh herbs in years.",
    favoriteItemIds: ['poultice_mint', 'potion_ginger'],
    tradeOffers: [
      { itemId: 'raw_ginger', price: 8, label: 'Mountain Emberginger' },
      { itemId: 'raw_resin', price: 9, label: 'Forge-Side Pine Resin' }
    ]
  },
  {
    id: 'clara',
    name: 'Clara',
    title: 'Hearthstone Baker',
    sprite: './assets/characters/clara.png?v=8',
    portrait: './assets/portraits/clara.png?v=8',
    zone: 'village',
    x: 675,
    y: 465,
    accentColor: '#e9b458',
    greeting: 'Oh, Genevieve dear! I baked cinnamon rolls this morning—though my poor kneading wrist is grumbling again!',
    favoriteItemIds: ['poultice_willow', 'potion_chamomile'],
    tradeOffers: [
      { itemId: 'raw_linen', price: 5, label: 'Flour-Soft Linen & Honey' },
      { itemId: 'raw_chamomile', price: 5, label: 'Sunny Meadow Chamomile' }
    ]
  },
  {
    id: 'pip',
    name: 'Pip',
    title: 'Swiftfoot Courier',
    sprite: './assets/characters/pip.png?v=8',
    portrait: './assets/portraits/pip.png?v=8',
    zone: 'outskirts',
    x: 720,
    y: 815,
    accentColor: '#67c587',
    greeting: "Heya Genevieve! I carry letters all across the valley—and spot all the best wild herbs along the creek!",
    favoriteItemIds: ['poultice_ginger', 'potion_chamomile'],
    tradeOffers: [
      { itemId: 'raw_willowbark', price: 7, label: 'Creekside Willowbark' },
      { itemId: 'raw_mint', price: 5, label: 'Fresh Brook Mint' }
    ]
  },
  {
    id: 'rowan',
    name: 'Old Rowan',
    title: 'Meadow Beekeeper',
    sprite: './assets/characters/rowan.png?v=8',
    portrait: './assets/portraits/rowan.png?v=8',
    zone: 'village',
    x: 468,
    y: 995,
    accentColor: '#dfb14b',
    greeting: 'Ah, young Genevieve! My bees have been visiting your cottage garden already. Finest blossoms in the shire.',
    favoriteItemIds: ['poultice_resin', 'potion_chamomile'],
    tradeOffers: [
      { itemId: 'raw_linen', price: 5, label: 'Honeycomb & Linen Wrap' },
      { itemId: 'raw_resin', price: 8, label: 'Golden Pine Resin' },
      { itemId: 'raw_moonpetal', price: 15, label: 'Pressed Moonpetal Lily' }
    ]
  },
  {
    id: 'maeve',
    name: 'Maeve',
    title: 'Starlight Weaver',
    sprite: './assets/characters/maeve.png?v=8',
    portrait: './assets/portraits/maeve.png?v=8',
    zone: 'village',
    x: 635,
    y: 1195,
    accentColor: '#ab80f5',
    greeting: 'May gentle winds bless your shop, Genevieve. Whenever you need soft poultice cloth or twilight lore, come see me.',
    favoriteItemIds: ['potion_lavender', 'potion_moonpetal'],
    tradeOffers: [
      { itemId: 'raw_linen', price: 5, label: 'Fine Woven Poultice Linen' },
      { itemId: 'raw_lavender', price: 10, label: 'Starlight Lavender Bundle' }
    ]
  }
];

export const QUESTS: QuestDef[] = [
  {
    id: 'q1_bram_burn',
    title: 'Sparks at the Anvil',
    giverId: 'bram',
    chapter: 1,
    summary: 'Craft a Cooling Mint Poultice and gently apply it to Bram’s singed forearm in Willowmere.',
    dialogueIntro:
      'A stray horseshoe spark nicked my forearm this morning! Could you grind some Silverleaf Mint, fold a Cooling Mint Poultice, and help wrap it for me?',
    dialogueComplete:
      'That cool mint relief is pure magic, Genevieve! Take my granddad’s Emberginger Warming Tonic recipe—every traveler in Willowmere loves it.',
    requiredItemId: 'poultice_mint',
    requiredCount: 1,
    requiresCareApplication: {
      limbTitle: "Bram's Singed Forearm",
      ailmentDesc: 'Warm forge soot and redness along the forearm.',
      remedyItemId: 'poultice_mint',
      spotLabels: ['Soot Spot', 'Cinder Mark', 'Forge Ash'],
      pasteColor: '#4edba3',
      thankYouLine: 'Ahhh—cool as mountain snow! You have a true healer’s touch, Genevieve.'
    },
    rewardGold: 45,
    rewardRecipeId: 'craft_ginger_tonic',
    rewardItems: [{ itemId: 'raw_ginger', count: 2 }]
  },
  {
    id: 'q2_clara_wrist',
    title: "The Baker's Kneading Ache",
    giverId: 'clara',
    chapter: 1,
    summary: 'Learn Clara’s family Willowbark Poultice recipe, craft one, and wrap her aching wrist.',
    dialogueIntro:
      'Kneading forty loaves left my wrist stiff as oak! Here—let me jot down Nana’s Willowbark Joint Poultice recipe for you. Bring one back and help me wrap it?',
    dialogueComplete:
      'Goodness, the stiffness vanished already! Here are fresh coins and linen wraps for your shop shelves, dear!',
    requiredItemId: 'poultice_willow',
    requiredCount: 1,
    requiresCareApplication: {
      limbTitle: "Clara's Kneading Wrist",
      ailmentDesc: 'Flour dust and tender joint strain across the wrist.',
      remedyItemId: 'poultice_willow',
      spotLabels: ['Flour Dust', 'Tender Joint', 'Stiff Tendon'],
      pasteColor: '#cf8960',
      thankYouLine: 'Oh bless your heart, Genevieve! My wrist feels twenty years younger!'
    },
    rewardGold: 55,
    rewardItems: [
      { itemId: 'raw_linen', count: 3 },
      { itemId: 'raw_chamomile', count: 2 }
    ]
  },
  {
    id: 'q3_pip_ankle',
    title: 'Twisted on the Brook Trail',
    giverId: 'pip',
    chapter: 2,
    summary: 'Craft a Warming Ginger Ankle Poultice and apply it to Pip’s sprained ankle on the Outskirts path.',
    dialogueIntro:
      'Oof—I hopped the creek stones too fast and twisted my ankle! Here’s the scouts’ Warming Ginger Ankle Poultice note. Think you could make one and patch me up?',
    dialogueComplete:
      'Whoa, toasty warm and good as new! Look—I found rare Moonpetal Lilies blooming by the water for you!',
    requiredItemId: 'poultice_ginger',
    requiredCount: 1,
    requiresCareApplication: {
      limbTitle: "Pip's Sprained Ankle",
      ailmentDesc: 'Trail mud and a swollen ankle from hopping brook stones.',
      remedyItemId: 'poultice_ginger',
      spotLabels: ['Trail Mud', 'Creek Splash', 'Swollen Spot'],
      pasteColor: '#f29441',
      thankYouLine: 'I can bounce again! Best apothecary in the whole valley!'
    },
    rewardGold: 65,
    rewardItems: [{ itemId: 'raw_moonpetal', count: 2 }]
  },
  {
    id: 'q4_rowan_bees',
    title: 'Honeycomb & Bramble Stings',
    giverId: 'rowan',
    chapter: 2,
    summary: 'Prepare Golden Resin Healing Salve and soothe Old Rowan’s bee-stung hands.',
    dialogueIntro:
      'The wildflower hives were feisty today—brambles and three little bee stings on my hands! Use my Golden Resin Healing Salve recipe and dress them for an old friend?',
    dialogueComplete:
      'Sweet lavender and pine—not a sting left! Keep this jar of rare Moonpetals and golden honey with my gratitude.',
    requiredItemId: 'poultice_resin',
    requiredCount: 1,
    requiresCareApplication: {
      limbTitle: "Old Rowan's Hands",
      ailmentDesc: 'Sticky propolis, bramble scratches, and tender bee stings.',
      remedyItemId: 'poultice_resin',
      spotLabels: ['Bee Sting', 'Bramble Scratch', 'Sticky Sap'],
      pasteColor: '#f0be46',
      thankYouLine: 'Gentle as summer rain, Genevieve. My bees and I thank you kindly!'
    },
    rewardGold: 75,
    rewardItems: [
      { itemId: 'raw_moonpetal', count: 2 },
      { itemId: 'raw_linen', count: 3 }
    ]
  },
  {
    id: 'q5_maeve_dreams',
    title: 'Starlight for Restless Nights',
    giverId: 'maeve',
    chapter: 3,
    summary: 'Brew a Dreamweaver Lavender Elixir in your cauldron and deliver it to Maeve.',
    dialogueIntro:
      'Lately I’ve stayed up weaving past midnight and cannot quiet my thoughts. Take my Dreamweaver Lavender Elixir scroll—could you simmer a bottle for me?',
    dialogueComplete:
      'Just uncorking the stopper smells like a quiet starlit meadow! Now you are ready for Willowmere’s highest herbalist secret: the Moonpetal Restoration Elixir.',
    requiredItemId: 'potion_lavender',
    requiredCount: 1,
    rewardGold: 85,
    rewardRecipeId: 'craft_moonpetal_elixir',
    rewardItems: [{ itemId: 'raw_moonpetal', count: 2 }]
  },
  {
    id: 'q6_festival_masterpiece',
    title: 'Lantern Night Masterpiece',
    giverId: 'maeve',
    chapter: 4,
    summary: 'Brew the radiant Moonpetal Restoration Elixir for Willowmere’s Lantern Gathering.',
    dialogueIntro:
      'Tonight the whole village celebrates your apothecary’s grand flourishing! Grind Luminous Moon Powder, blend Lavender & Golden Resin, and brew the Moonpetal Restoration Elixir!',
    dialogueComplete:
      'Look how it glows! Every villager in Willowmere raises a lantern to Genevieve—our beloved Master Apothecary!',
    requiredItemId: 'potion_moonpetal',
    requiredCount: 1,
    prerequisiteQuestId: 'q5_maeve_dreams',
    rewardGold: 180,
    rewardItems: [
      { itemId: 'raw_moonpetal', count: 3 },
      { itemId: 'raw_lavender', count: 3 }
    ]
  },
  {
    id: 'q7_deepwood_ward',
    title: 'Lanterns for Thornveil Deepwood',
    giverId: 'bram',
    chapter: 2,
    summary: 'Follow Willowmere’s East trail into Thornveil Deepwood, gather Ghostcaps, and brew a Lantern-Ward Elixir.',
    dialogueIntro:
      'Timber crews heading down the East Village Trail keep getting turned back by drifting spore wisps in Thornveil Deepwood! Could you brave the woods, gather Luminescent Ghostcaps, and brew a Lantern-Ward Elixir?',
    dialogueComplete:
      'By the anvil, it shines like liquid noon! With this warding draught, our woodcutters can safely travel the East Trail again!',
    requiredItemId: 'potion_warding',
    requiredCount: 1,
    prerequisiteQuestId: 'q1_bram_burn',
    rewardGold: 115,
    rewardItems: [{ itemId: 'raw_ghostcap', count: 2 }]
  },
  {
    id: 'q8_frontier_frostfire',
    title: 'Between Mistfen & Frostpeak',
    giverId: 'rowan',
    chapter: 3,
    summary: 'Gather Sundew in Sunken Mistfen (South) & Edelweiss on Frostpeak Crags (North) to apply a Frostfire Poultice.',
    dialogueIntro:
      'I ventured up the North Mountain Trail and down into Sunken Mistfen checking wild hives, and the bog-damp & frost stiffened my hands! Take my Frostfire Alpine Poultice formula—can you brave both trails and dress them?',
    dialogueComplete:
      'Warm as hearthfire, cool as mountain snow! You’ve mastered every wild frontier around Willowmere, Genevieve!',
    requiredItemId: 'poultice_frostfire',
    requiredCount: 1,
    prerequisiteQuestId: 'q4_rowan_bees',
    requiresCareApplication: {
      limbTitle: "Rowan's Frost-Chilled Hands",
      ailmentDesc: 'Mire dampness and alpine frost chill across the knuckles.',
      remedyItemId: 'poultice_frostfire',
      spotLabels: ['Frost Rime', 'Mire Damp', 'Chilled Knuckle'],
      pasteColor: '#60a5fa',
      thankYouLine: 'Incredible—the frostfire warmth spreads right to my fingertips!'
    },
    rewardGold: 165,
    rewardItems: [
      { itemId: 'raw_frostbloom', count: 2 },
      { itemId: 'raw_sundew', count: 2 }
    ]
  },
  {
    id: 'q9_druid_poultice',
    title: 'Heart of the Elder Grove',
    giverId: 'pip',
    chapter: 3,
    summary:
      'Use Silver Pruning Shears in Hollowroot Grove & Sunfire Lantern in Standing-Stone Sanctum to craft a Druid’s Heartwood Poultice.',
    dialogueIntro:
      'Beyond Thornveil Deepwood’s mossy stone arch lies Hollowroot Druid Grove, and beyond Mistfen lies the sunken Standing-Stone Sanctum! Forging Pruning Shears & a Sunfire Lantern lets you gather Heartwood Briar and Star-Lotus to mend my strained courier shoulder!',
    dialogueComplete:
      'Whoa—it feels like warm sunlight straight from the Elder Tree! With gear like yours, no hidden sanctum in the valley is out of reach!',
    requiredItemId: 'poultice_heartwood',
    requiredCount: 1,
    prerequisiteQuestId: 'q3_pip_ankle',
    requiresCareApplication: {
      limbTitle: "Pip's Strained Courier Shoulder",
      ailmentDesc: 'Deep briar scratches and satchel strain from exploring the inner druid arch.',
      remedyItemId: 'poultice_heartwood',
      spotLabels: ['Briar Scratch', 'Deep Strain', 'Sore Tendon'],
      pasteColor: '#f59e0b',
      thankYouLine: 'Good as new! Those inner-grove herbs work wonders, Genevieve!'
    },
    rewardGold: 195,
    rewardItems: [
      { itemId: 'raw_heartwood', count: 2 },
      { itemId: 'raw_starlotus', count: 2 }
    ]
  },
  {
    id: 'q10_starfall_panacea',
    title: 'The Starfall Grotto Panacea',
    giverId: 'clara',
    chapter: 4,
    summary:
      'Enter Starfall Crystal Grotto north of Frostpeak Crags with the Gilded Crystal Pick-Hammer and brew the Astral Sovereign Elixir.',
    dialogueIntro:
      'Village elders tell of a shimmering Astral Sovereign Elixir brewed from Starfall Prism Crystals deep inside Frostpeak’s northern cavern! With a Gilded Crystal Pick-Hammer, could you mine those crystals and brew a flask for Willowmere’s apothecary hall?',
    dialogueComplete:
      'Heavenly stars above—it sparkles like the night sky itself! Genevieve, your name will be remembered among the greatest master apothecaries in history!',
    requiredItemId: 'potion_starfall',
    requiredCount: 1,
    prerequisiteQuestId: 'q2_clara_wrist',
    rewardGold: 260,
    rewardItems: [
      { itemId: 'raw_prismcrystal', count: 2 },
      { itemId: 'raw_starlotus', count: 2 }
    ]
  }
];

// Recipes unlocked immediately when accepting a villager's quest!
export const QUEST_ACCEPT_RECIPES: Record<string, string> = {
  q2_clara_wrist: 'craft_willow_poultice',
  q3_pip_ankle: 'craft_ginger_poultice',
  q4_rowan_bees: 'craft_resin_salve',
  q5_maeve_dreams: 'craft_lavender_elixir',
  q8_frontier_frostfire: 'craft_frostfire_poultice',
  q9_druid_poultice: 'craft_heartwood_poultice',
  q10_starfall_panacea: 'craft_starfall_elixir'
};

export const TOOL_UPGRADES: ToolUpgradeDef[] = [
  {
    id: 'tool_shears',
    name: 'Silver-Blade Pruning Shears',
    shortLabel: 'Silver Shears',
    description:
      'Unlocks Heartwood Briar-Blossom harvesting in Hollowroot Druid Grove and yields +1 bonus blossom/leaf on floral & herb nodes.',
    perkSummary: 'Unlocks Briar-Blossoms + +1 Floral Herb Yield',
    cost: 65,
    runeCost: 16,
    icon: './assets/ui/tool_shears.png?v=12'
  },
  {
    id: 'tool_lantern',
    name: 'Sunfire Brass Trail Lantern',
    shortLabel: 'Sunfire Lantern',
    description:
      'Unlocks Abyssal Star-Lotus in Standing-Stone Sanctum, casts a warm light aura, calms nearby wisps (-25% speed), and adds +1 Max Heart (6♥).',
    perkSummary: 'Unlocks Star-Lotus + 6♥ Max Vitality & Wisp Calm',
    cost: 85,
    runeCost: 20,
    icon: './assets/ui/tool_lantern.png?v=12'
  },
  {
    id: 'tool_satchel',
    name: 'Master Herbalist Alchemist Belt',
    shortLabel: 'Alchemist Belt',
    description:
      'Velvet-lined leather field belt that extends Potion Ward Shield duration by +50% and folds +1 bonus Poultice every batch.',
    perkSummary: '+50% Ward Shield Duration & +1 Bonus Poultice',
    cost: 95,
    runeCost: 22,
    icon: './assets/ui/tool_satchel.png?v=12'
  },
  {
    id: 'tool_pick',
    name: 'Gilded Crystal Pick-Hammer',
    shortLabel: 'Crystal Pick',
    description:
      'Unlocks Starfall Prism Crystal mining inside Starfall Crystal Grotto and yields +1 bonus resin, root & alpine crystal per node.',
    perkSummary: 'Unlocks Prism Crystals + +1 Root/Crystal Yield',
    cost: 110,
    runeCost: 24,
    icon: './assets/ui/tool_pick.png?v=12'
  }
];

export const SHOP_UPGRADES: ShopUpgradeDef[] = [
  {
    id: 'upg_shelf_6',
    name: 'Grand Gilded Apothecary Hutch',
    description: 'Visually upgrades your west-wall shelf into a 6-slot gilded hutch with glowing crystal tiers.',
    cost: 60,
    icon: './assets/stations/shelf_grand.png?v=8'
  },
  {
    id: 'upg_cozy_residence',
    name: 'Cozy Residence Armchair & Tea Nook',
    description: 'Furnishes Genevieve’s bedroom with a plush emerald wingback chair, porcelain teapot & warm hearth comforts.',
    cost: 65,
    icon: './assets/stations/reading_nook.png?v=8'
  },
  {
    id: 'upg_garden_beds',
    name: 'Homestead Kitchen-Garden Beds',
    description: 'Builds 3 blooming cedar herb beds in your fenced cottage yard yielding Moonpetal, Lavender & Ginger each dawn.',
    cost: 75,
    icon: './assets/buildings/planter.png?v=8'
  },
  {
    id: 'upg_golden_mortar',
    name: 'Master Alchemist Backroom Rig',
    description: 'Expands your backroom prep bench & yields +1 bonus prepared ingredient every batch!',
    cost: 95,
    icon: './assets/stations/prep_bench.png?v=8'
  },
  {
    id: 'upg_lantern_sign',
    name: 'Wrought-Iron Entrance Lanterns',
    description: 'Adorns your shopfront & cottage gate with glowing lanterns and flower tubs (+25% Gold Tips!).',
    cost: 110,
    icon: './assets/stations/lantern_pair.png?v=8'
  }
];
