import { useSyncExternalStore } from 'react';
import {
  CRAFT_RECIPES,
  ITEMS,
  PREP_RECIPES,
  QUEST_ACCEPT_RECIPES,
  QUESTS,
  SHOP_UPGRADES,
  TOOL_UPGRADES,
  VILLAGERS,
  type ToolUpgradeId,
  type ZoneId
} from '../data/gameData';
import {
  activePaymentProvider,
  getMissingIngredientsSpec,
  getRawHerbPackRuneCost,
  RUNE_PACKAGES,
  RUNE_RARE_BUNDLES,
  RUNE_RECIPE_UNLOCK_COSTS,
  RUNE_UPGRADE_COSTS,
  type CheckoutReceipt
} from '../monetization/runeEngine';
import { sound } from '../audio/soundEngine';

export type TimePhase = 'Morning' | 'Golden Afternoon' | 'Starlight Evening';
export type PricingTier = 'kind' | 'fair' | 'artisan';
export type ModalType =
  | null
  | 'prep'
  | 'cauldron'
  | 'poultice'
  | 'shelf'
  | 'inventory'
  | 'recipes'
  | 'quests'
  | 'mainmenu'
  | 'runeshop'
  | 'rest';

export interface ToastItem {
  id: number;
  text: string;
  icon?: string;
  accent?: string;
}

export interface PersistedState {
  version: number;
  playerName: string;
  shopName: string;
  day: number;
  timePhase: TimePhase;
  phaseActions: number;
  gold: number;
  runes: number;
  health: number;
  maxHealth: number;
  wardUntilMs: number;
  runeReceipts: CheckoutReceipt[];
  shopOpen: boolean;
  pricingTier: PricingTier;
  currentZone: ZoneId;
  inventory: Record<string, number>;
  unlockedRecipes: string[];
  shelfSlots: ({ itemId: string } | null)[];
  upgrades: Record<string, boolean>;
  planterReady: boolean;
  forageCollectedToday: Record<string, boolean>;
  activeQuests: string[];
  completedQuests: string[];
  villagerHearts: Record<string, number>;
  nutmegPets: number;
  totalSold: number;
  totalCrafted: number;
  seenIntro: boolean;
}

export interface StoreSnapshot extends PersistedState {
  activeModal: ModalType;
  talkingVillagerId: string | null;
  activeCareQuestId: string | null;
  toasts: ToastItem[];
}

const SAVE_KEY = 'genevieves-apothecary-save-v1';

function createInitialPersistedState(): PersistedState {
  return {
    version: 2,
    playerName: 'Genevieve',
    shopName: "Genevieve's Apothecary",
    day: 1,
    timePhase: 'Morning',
    phaseActions: 0,
    gold: 35,
    runes: 20,
    health: 5,
    maxHealth: 5,
    wardUntilMs: 0,
    runeReceipts: [],
    shopOpen: false,
    pricingTier: 'fair',
    currentZone: 'interior',
    inventory: {
      raw_chamomile: 3,
      raw_mint: 3,
      raw_resin: 2,
      raw_willowbark: 1,
      raw_linen: 3
    },
    unlockedRecipes: CRAFT_RECIPES.filter((r) => r.starterUnlocked).map((r) => r.id),
    shelfSlots: [null, null, null, null, null, null],
    upgrades: {},
    planterReady: true,
    forageCollectedToday: {},
    activeQuests: ['q1_bram_burn'],
    completedQuests: [],
    villagerHearts: {
      bram: 1,
      clara: 1,
      pip: 1,
      rowan: 1,
      maeve: 1
    },
    nutmegPets: 0,
    totalSold: 0,
    totalCrafted: 0,
    seenIntro: false
  };
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialPersistedState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const defaults = createInitialPersistedState();
    const mergedUpgrades = { ...defaults.upgrades, ...(parsed.upgrades || {}) };
    const dynMaxHealth = mergedUpgrades.tool_lantern ? 6 : 5;
    return {
      ...defaults,
      ...parsed,
      upgrades: mergedUpgrades,
      runes: typeof parsed.runes === 'number' ? parsed.runes : defaults.runes,
      health:
        typeof parsed.health === 'number' && parsed.health > 0
          ? Math.min(dynMaxHealth, parsed.health)
          : dynMaxHealth,
      maxHealth: dynMaxHealth,
      wardUntilMs: typeof parsed.wardUntilMs === 'number' ? parsed.wardUntilMs : 0,
      runeReceipts: Array.isArray(parsed.runeReceipts) ? parsed.runeReceipts : [],
      shelfSlots:
        Array.isArray(parsed.shelfSlots) && parsed.shelfSlots.length === 6
          ? parsed.shelfSlots
          : [null, null, null, null, null, null]
    };
  } catch {
    return createInitialPersistedState();
  }
}

class GameStore {
  private state: StoreSnapshot;
  private listeners = new Set<() => void>();
  private toastSeq = 1;

  constructor() {
    this.state = {
      ...loadState(),
      activeModal: null,
      talkingVillagerId: null,
      activeCareQuestId: null,
      toasts: []
    };
  }

  public getSnapshot = (): StoreSnapshot => this.state;

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emit(persist = true) {
    if (persist) {
      try {
        const { activeModal: _m, talkingVillagerId: _v, activeCareQuestId: _c, toasts: _t, ...persisted } =
          this.state;
        localStorage.setItem(SAVE_KEY, JSON.stringify(persisted));
      } catch {
        // ignore storage quota errors
      }
    }
    this.listeners.forEach((l) => l());
  }

  public addToast(text: string, icon?: string, accent = '#f5d27a') {
    const id = this.toastSeq++;
    this.state = {
      ...this.state,
      toasts: [...this.state.toasts.slice(-3), { id, text, icon, accent }]
    };
    this.emit(false);
    window.setTimeout(() => {
      this.state = {
        ...this.state,
        toasts: this.state.toasts.filter((t) => t.id !== id)
      };
      this.emit(false);
    }, 3200);
  }

  private advanceGentleTime() {
    let { phaseActions, timePhase } = this.state;
    phaseActions += 1;
    if (phaseActions >= 6 && timePhase === 'Morning') {
      timePhase = 'Golden Afternoon';
      phaseActions = 0;
    } else if (phaseActions >= 6 && timePhase === 'Golden Afternoon') {
      timePhase = 'Starlight Evening';
      phaseActions = 0;
    }
    this.state = { ...this.state, phaseActions, timePhase };
  }

  public dismissIntro() {
    sound.unlock();
    sound.playTap();
    this.state = { ...this.state, seenIntro: true };
    this.emit(true);
  }

  public setZone(zone: ZoneId) {
    if (this.state.currentZone === zone) return;
    sound.playTap();
    this.state = {
      ...this.state,
      currentZone: zone,
      // Stepping inside the cozy cottage warms & restores Genevieve's vitality!
      health: zone === 'interior' ? this.state.maxHealth : this.state.health,
      activeModal: null,
      talkingVillagerId: null
    };
    this.emit(true);
  }

  public sipFieldPotion(): boolean {
    const candidates: { id: string; heal: number; wardSec: number }[] = [
      { id: 'potion_starfall', heal: 6, wardSec: 120 },
      { id: 'potion_warding', heal: 5, wardSec: 90 },
      { id: 'potion_ginger', heal: 3, wardSec: 45 },
      { id: 'potion_moonpetal', heal: 5, wardSec: 60 },
      { id: 'potion_lavender', heal: 3, wardSec: 30 },
      { id: 'potion_chamomile', heal: 2, wardSec: 0 }
    ];
    const chosen = candidates.find((c) => (this.state.inventory[c.id] || 0) > 0);
    if (!chosen) {
      this.addToast('Brew a Potion or Lantern-Ward Elixir in your Cauldron for frontier protection!', './assets/ui/emblem_cauldron.png?v=8');
      return false;
    }
    const item = ITEMS[chosen.id];
    const inv = { ...this.state.inventory, [chosen.id]: (this.state.inventory[chosen.id] || 0) - 1 };
    sound.playCraftSuccess();
    const now = Date.now();
    const beltMult = this.state.upgrades.tool_satchel ? 1.5 : 1.0;
    const effectiveWardSec = Math.round(chosen.wardSec * beltMult);
    const nextWard =
      effectiveWardSec > 0
        ? Math.max(this.state.wardUntilMs, now) + effectiveWardSec * 1000
        : this.state.wardUntilMs;
    this.state = {
      ...this.state,
      inventory: inv,
      health: Math.min(this.state.maxHealth, this.state.health + chosen.heal),
      wardUntilMs: nextWard
    };
    this.addToast(
      effectiveWardSec > 0
        ? `Sipped ${item.name}: +${chosen.heal}♥ & ${effectiveWardSec}s Ward Shield!`
        : `Sipped ${item.name}: Restored +${chosen.heal}♥!`,
      item.icon,
      '#fde047'
    );
    this.emit(true);
    return true;
  }

  public applyHazardHit(hazardLabel: string): 'warded' | 'hit' | 'retreated' {
    if (Date.now() < this.state.wardUntilMs) {
      sound.playTap();
      return 'warded';
    }
    const nextHp = this.state.health - 1;
    if (nextHp <= 0) {
      sound.playBell();
      this.state = {
        ...this.state,
        currentZone: 'interior',
        health: this.state.maxHealth,
        activeModal: null,
        talkingVillagerId: null
      };
      this.addToast(
        `${hazardLabel} chilled Genevieve—she hurried safely home to warm by the hearth (all herbs kept!).`,
        './assets/ui/emblem_sleep.png?v=8',
        '#fbbf24'
      );
      this.emit(true);
      return 'retreated';
    }
    this.state = {
      ...this.state,
      health: nextHp
    };
    this.addToast(`${hazardLabel}! (-1♥ • Brew or sip a Potion to ward against hazards)`, './assets/ui/hazard_wisp.png?v=8', '#f87171');
    this.emit(true);
    return 'hit';
  }

  public openModal(modal: ModalType) {
    sound.playTap();
    const nextModal = this.state.activeModal === modal ? null : modal;
    this.state = {
      ...this.state,
      activeModal: nextModal,
      talkingVillagerId: null
    };
    this.emit(false);
  }

  public closeAllModals() {
    this.state = {
      ...this.state,
      activeModal: null,
      talkingVillagerId: null,
      activeCareQuestId: null
    };
    this.emit(false);
  }

  public openVillager(villagerId: string) {
    sound.playTap();
    this.state = {
      ...this.state,
      talkingVillagerId: villagerId,
      activeModal: null
    };
    this.emit(false);
  }

  public petNutmeg() {
    sound.playPurr();
    const nutmegPets = this.state.nutmegPets + 1;
    this.state = { ...this.state, nutmegPets };
    this.addToast('Nutmeg purrs happily by the hearth! ♥', './assets/characters/nutmeg.png?v=8', '#f5a65b');
    this.emit(true);
  }

  public harvestNode(
    nodeId: string,
    itemId: string,
    count = 2,
    requiredToolId?: ToolUpgradeId
  ): boolean {
    if (this.state.forageCollectedToday[nodeId]) return false;
    if (requiredToolId && !this.state.upgrades[requiredToolId]) {
      const tool = TOOL_UPGRADES.find((t) => t.id === requiredToolId);
      sound.playBell();
      this.addToast(
        `Requires ${tool ? tool.name : 'Artisan Tool'} — forge at Bram's Anvil or Shop Upgrades!`,
        tool?.icon || './assets/ui/emblem_tool_badge.png?v=12',
        '#fbbf24'
      );
      return false;
    }
    const item = ITEMS[itemId];
    if (!item) return false;

    const floralSet = new Set([
      'raw_chamomile',
      'raw_mint',
      'raw_lavender',
      'raw_moonpetal',
      'raw_ghostcap',
      'raw_sundew',
      'raw_heartwood',
      'raw_starlotus'
    ]);
    const crystalRootSet = new Set([
      'raw_willowbark',
      'raw_ginger',
      'raw_resin',
      'raw_frostbloom',
      'raw_prismcrystal'
    ]);

    let toolBonus = 0;
    if (this.state.upgrades.tool_shears && floralSet.has(itemId)) toolBonus += 1;
    if (this.state.upgrades.tool_pick && crystalRootSet.has(itemId)) toolBonus += 1;
    const totalYield = count + toolBonus;

    sound.playHarvest();
    const inv = { ...this.state.inventory, [itemId]: (this.state.inventory[itemId] || 0) + totalYield };
    const collected = { ...this.state.forageCollectedToday, [nodeId]: true };

    const unlocked = [...this.state.unlockedRecipes];
    if (itemId === 'raw_heartwood' && !unlocked.includes('craft_heartwood_poultice')) {
      unlocked.push('craft_heartwood_poultice');
      window.setTimeout(() => {
        this.addToast("Discovered Formula: Druid's Heartwood Poultice!", './assets/items/poultice_heartwood.png?v=12', '#f59e0b');
      }, 650);
    } else if (itemId === 'raw_prismcrystal' && !unlocked.includes('craft_starfall_elixir')) {
      unlocked.push('craft_starfall_elixir');
      window.setTimeout(() => {
        this.addToast('Discovered Formula: Astral Sovereign Elixir!', './assets/items/potion_starfall.png?v=12', '#c084fc');
      }, 650);
    }

    this.state = {
      ...this.state,
      inventory: inv,
      unlockedRecipes: unlocked,
      forageCollectedToday: collected
    };
    this.advanceGentleTime();
    this.addToast(
      toolBonus > 0
        ? `Gathered +${totalYield} ${item.name} (+${toolBonus} Tool Bonus!)`
        : `Gathered +${totalYield} ${item.name}`,
      item.icon,
      item.accentColor
    );
    this.emit(true);
    return true;
  }

  public harvestPlanters() {
    if (!this.state.upgrades.upg_garden_beds || !this.state.planterReady) return false;
    sound.playHarvest();
    const inv = { ...this.state.inventory };
    inv.raw_ginger = (inv.raw_ginger || 0) + 2;
    inv.raw_lavender = (inv.raw_lavender || 0) + 2;
    inv.raw_moonpetal = (inv.raw_moonpetal || 0) + 1;
    this.state = {
      ...this.state,
      inventory: inv,
      planterReady: false
    };
    this.addToast(
      'Harvested Cottage Planters: Ginger, Lavender & Moonpetal!',
      './assets/items/raw_moonpetal.png?v=8',
      '#7be3f5'
    );
    this.emit(true);
    return true;
  }

  public completePrep(prepRecipeId: string, batches = 1): boolean {
    const recipe = PREP_RECIPES.find((r) => r.id === prepRecipeId);
    if (!recipe) return false;
    const have = this.state.inventory[recipe.inputId] || 0;
    const actualBatches = Math.min(batches, have);
    if (actualBatches <= 0) return false;

    const bonusPerBatch = this.state.upgrades.upg_golden_mortar ? 1 : 0;
    const produced = actualBatches * (1 + bonusPerBatch);

    const inv = { ...this.state.inventory };
    inv[recipe.inputId] = have - actualBatches;
    inv[recipe.outputId] = (inv[recipe.outputId] || 0) + produced;

    const outItem = ITEMS[recipe.outputId];
    sound.playCraftSuccess();
    this.state = { ...this.state, inventory: inv };
    this.advanceGentleTime();
    this.addToast(`Prepared +${produced} ${outItem.name}`, outItem.icon, outItem.accentColor);
    this.emit(true);
    return true;
  }

  public completeCraft(craftRecipeId: string): boolean {
    const recipe = CRAFT_RECIPES.find((r) => r.id === craftRecipeId);
    if (!recipe) return false;
    for (const req of recipe.ingredients) {
      if ((this.state.inventory[req.itemId] || 0) < req.count) return false;
    }

    const inv = { ...this.state.inventory };
    for (const req of recipe.ingredients) {
      inv[req.itemId] = (inv[req.itemId] || 0) - req.count;
    }
    const produced =
      recipe.station === 'poultice' && this.state.upgrades.tool_satchel ? 2 : 1;
    inv[recipe.outputId] = (inv[recipe.outputId] || 0) + produced;

    const outItem = ITEMS[recipe.outputId];
    sound.playCraftSuccess();
    this.state = {
      ...this.state,
      inventory: inv,
      totalCrafted: this.state.totalCrafted + produced
    };
    this.advanceGentleTime();
    this.addToast(
      produced > 1 ? `Crafted +${produced} ${outItem.name} (Alchemist Belt Bonus!)` : `Crafted ${outItem.name}!`,
      outItem.icon,
      outItem.accentColor
    );
    this.emit(true);
    return true;
  }

  public getMaxShelfSlots(): number {
    return this.state.upgrades.upg_shelf_6 ? 6 : 3;
  }

  public getSellPrice(itemId: string): number {
    const item = ITEMS[itemId];
    if (!item) return 10;
    const tierMult = this.state.pricingTier === 'kind' ? 0.85 : this.state.pricingTier === 'artisan' ? 1.25 : 1.0;
    const lanternMult = this.state.upgrades.upg_lantern_sign ? 1.25 : 1.0;
    return Math.max(5, Math.round(item.baseValue * tierMult * lanternMult));
  }

  public stockShelf(slotIndex: number, itemId: string): boolean {
    if (slotIndex < 0 || slotIndex >= this.getMaxShelfSlots()) return false;
    if ((this.state.inventory[itemId] || 0) <= 0) return false;

    const inv = { ...this.state.inventory };
    const prev = this.state.shelfSlots[slotIndex];
    if (prev) {
      inv[prev.itemId] = (inv[prev.itemId] || 0) + 1;
    }
    inv[itemId] = (inv[itemId] || 0) - 1;

    const slots = [...this.state.shelfSlots];
    slots[slotIndex] = { itemId };
    sound.playTap();
    this.state = { ...this.state, inventory: inv, shelfSlots: slots };
    this.emit(true);
    return true;
  }

  public unstockShelf(slotIndex: number) {
    const cur = this.state.shelfSlots[slotIndex];
    if (!cur) return;
    const inv = { ...this.state.inventory, [cur.itemId]: (this.state.inventory[cur.itemId] || 0) + 1 };
    const slots = [...this.state.shelfSlots];
    slots[slotIndex] = null;
    sound.playTap();
    this.state = { ...this.state, inventory: inv, shelfSlots: slots };
    this.emit(true);
  }

  public toggleShopOpen() {
    const next = !this.state.shopOpen;
    sound.playBell();
    this.state = { ...this.state, shopOpen: next };
    this.addToast(
      next ? 'Apothecary Sign flipped to OPEN! Villagers may browse.' : 'Apothecary Sign set to PREPARING.',
      './assets/items/potion_chamomile.png?v=8',
      next ? '#67db9a' : '#e6b96e'
    );
    this.emit(true);
  }

  public setPricingTier(tier: PricingTier) {
    sound.playTap();
    this.state = { ...this.state, pricingTier: tier };
    this.emit(true);
  }

  public processCustomerSale(slotIndex: number, villagerId?: string): number {
    const slot = this.state.shelfSlots[slotIndex];
    if (!slot) return 0;
    const item = ITEMS[slot.itemId];
    const price = this.getSellPrice(slot.itemId);

    const slots = [...this.state.shelfSlots];
    slots[slotIndex] = null;

    const chosenVillager =
      VILLAGERS.find((v) => v.id === villagerId) ||
      VILLAGERS[Math.floor(Math.random() * VILLAGERS.length)];

    const hearts = { ...this.state.villagerHearts };
    const heartGain = this.state.pricingTier === 'kind' ? 0.5 : 0.25;
    hearts[chosenVillager.id] = Math.min(5, +((hearts[chosenVillager.id] || 0) + heartGain).toFixed(2));

    sound.playCoin();
    this.state = {
      ...this.state,
      shelfSlots: slots,
      gold: this.state.gold + price,
      totalSold: this.state.totalSold + 1,
      villagerHearts: hearts
    };
    this.addToast(`${chosenVillager.name} bought ${item.name} (+${price}g)!`, item.icon, '#f7d154');
    this.emit(true);
    return price;
  }

  public buyUpgrade(upgradeId: string): boolean {
    const upg = [...SHOP_UPGRADES, ...TOOL_UPGRADES].find((u) => u.id === upgradeId);
    if (!upg || this.state.upgrades[upgradeId] || this.state.gold < upg.cost) return false;
    sound.playCraftSuccess();
    const nextUpgrades = { ...this.state.upgrades, [upgradeId]: true };
    const nextMaxHealth = nextUpgrades.tool_lantern ? 6 : 5;
    this.state = {
      ...this.state,
      gold: this.state.gold - upg.cost,
      upgrades: nextUpgrades,
      maxHealth: nextMaxHealth,
      health: upgradeId === 'tool_lantern' ? nextMaxHealth : this.state.health,
      planterReady: upgradeId === 'upg_garden_beds' ? true : this.state.planterReady
    };
    this.addToast(`Unlocked ${upg.name}!`, upg.icon, '#7be3f5');
    this.emit(true);
    return true;
  }

  /* =========================================================
     STARLIGHT RUNES MONETIZATION & INSTANT UNLOCK ENGINE
     ========================================================= */

  public async purchaseRunePack(packId: string): Promise<CheckoutReceipt | null> {
    const pack = RUNE_PACKAGES.find((p) => p.id === packId);
    if (!pack) return null;
    sound.unlock();
    const receipt = await activePaymentProvider.authorizePackagePurchase(pack);
    sound.playCraftSuccess();
    sound.playCoin();
    this.state = {
      ...this.state,
      runes: this.state.runes + receipt.runesGranted,
      runeReceipts: [receipt, ...this.state.runeReceipts].slice(0, 25)
    };
    this.addToast(
      `+${receipt.runesGranted} Starlight Runes (${pack.name})`,
      './assets/ui/icon_rune.png?v=8',
      '#b794f4'
    );
    this.emit(true);
    return receipt;
  }

  public buyUpgradeWithRunes(upgradeId: string): boolean {
    const upg = [...SHOP_UPGRADES, ...TOOL_UPGRADES].find((u) => u.id === upgradeId);
    if (!upg || this.state.upgrades[upgradeId]) return false;
    const runeCost = RUNE_UPGRADE_COSTS[upgradeId] ?? 20;
    if (this.state.runes < runeCost) {
      this.openModal('runeshop');
      return false;
    }
    sound.playCraftSuccess();
    const nextUpgrades = { ...this.state.upgrades, [upgradeId]: true };
    const nextMaxHealth = nextUpgrades.tool_lantern ? 6 : 5;
    this.state = {
      ...this.state,
      runes: this.state.runes - runeCost,
      upgrades: nextUpgrades,
      maxHealth: nextMaxHealth,
      health: upgradeId === 'tool_lantern' ? nextMaxHealth : this.state.health,
      planterReady: upgradeId === 'upg_garden_beds' ? true : this.state.planterReady
    };
    this.addToast(`Rune Unlock: ${upg.name}!`, upg.icon, '#b794f4');
    this.emit(true);
    return true;
  }

  public instantBloomPlantersWithRunes(runeCost = 5): boolean {
    if (!this.state.upgrades.upg_garden_beds || this.state.planterReady) return false;
    if (this.state.runes < runeCost) {
      this.openModal('runeshop');
      return false;
    }
    sound.playCraftSuccess();
    this.state = {
      ...this.state,
      runes: this.state.runes - runeCost,
      planterReady: true
    };
    this.addToast('Garden Beds bloomed instantly with Starlight Runes!', './assets/ui/icon_rune.png?v=8', '#7be3f5');
    this.emit(true);
    return true;
  }

  public unlockRecipeWithRunes(craftRecipeId: string): boolean {
    const recipe = CRAFT_RECIPES.find((r) => r.id === craftRecipeId);
    if (!recipe || this.state.unlockedRecipes.includes(craftRecipeId)) return false;
    const runeCost = RUNE_RECIPE_UNLOCK_COSTS[craftRecipeId] ?? 18;
    if (this.state.runes < runeCost) {
      this.openModal('runeshop');
      return false;
    }
    const outItem = ITEMS[recipe.outputId];
    sound.playCraftSuccess();
    this.state = {
      ...this.state,
      runes: this.state.runes - runeCost,
      unlockedRecipes: [...this.state.unlockedRecipes, craftRecipeId]
    };
    this.addToast(`Formula Unlocked: ${outItem.name}!`, outItem.icon, '#b794f4');
    this.emit(true);
    return true;
  }

  public buyRareBundleWithRunes(bundleId: string): boolean {
    const bundle = RUNE_RARE_BUNDLES.find((b) => b.id === bundleId);
    if (!bundle) return false;
    if (this.state.runes < bundle.runeCost) {
      return false;
    }
    const inv = { ...this.state.inventory };
    for (const g of bundle.grants) {
      inv[g.itemId] = (inv[g.itemId] || 0) + g.count;
    }
    sound.playCraftSuccess();
    this.state = {
      ...this.state,
      runes: this.state.runes - bundle.runeCost,
      inventory: inv
    };
    this.addToast(`Acquired ${bundle.name}!`, bundle.icon, '#7be3f5');
    this.emit(true);
    return true;
  }

  public buyRawHerbPackWithRunes(itemId: string, count = 3): boolean {
    const item = ITEMS[itemId];
    if (!item) return false;
    const runeCost = getRawHerbPackRuneCost(itemId, count);
    if (this.state.runes < runeCost) {
      this.openModal('runeshop');
      return false;
    }
    sound.playHarvest();
    const inv = { ...this.state.inventory, [itemId]: (this.state.inventory[itemId] || 0) + count };
    this.state = {
      ...this.state,
      runes: this.state.runes - runeCost,
      inventory: inv
    };
    this.addToast(`Conjured +${count} ${item.name}!`, item.icon, '#b794f4');
    this.emit(true);
    return true;
  }

  public finishMissingIngredientsWithRunes(craftRecipeId: string): boolean {
    const { missing, runeCost } = getMissingIngredientsSpec(craftRecipeId, this.state.inventory);
    if (missing.length === 0) return true;
    if (this.state.runes < runeCost) {
      this.openModal('runeshop');
      return false;
    }
    const inv = { ...this.state.inventory };
    for (const m of missing) {
      inv[m.itemId] = (inv[m.itemId] || 0) + m.count;
    }
    sound.playCraftSuccess();
    this.state = {
      ...this.state,
      runes: this.state.runes - runeCost,
      inventory: inv
    };
    this.addToast('Missing ingredients supplied via Starlight Runes!', './assets/ui/icon_rune.png?v=8', '#b794f4');
    this.emit(true);
    return true;
  }

  public buyVillagerTrade(itemId: string, price: number): boolean {
    if (this.state.gold < price) return false;
    const item = ITEMS[itemId];
    if (!item) return false;
    sound.playCoin();
    const inv = { ...this.state.inventory, [itemId]: (this.state.inventory[itemId] || 0) + 1 };
    this.state = {
      ...this.state,
      gold: this.state.gold - price,
      inventory: inv
    };
    this.addToast(`Traded for +1 ${item.name} (-${price}g)`, item.icon, item.accentColor);
    this.emit(true);
    return true;
  }

  public acceptQuest(questId: string) {
    const quest = QUESTS.find((q) => q.id === questId);
    if (!quest) return;
    if (this.state.activeQuests.includes(questId) || this.state.completedQuests.includes(questId)) return;

    const unlocked = [...this.state.unlockedRecipes];
    const grantRecipeId = QUEST_ACCEPT_RECIPES[questId];
    if (grantRecipeId && !unlocked.includes(grantRecipeId)) {
      unlocked.push(grantRecipeId);
      const r = CRAFT_RECIPES.find((cr) => cr.id === grantRecipeId);
      if (r) {
        const outItem = ITEMS[r.outputId];
        this.addToast(`New Recipe Learned: ${outItem.name}!`, outItem.icon, outItem.accentColor);
      }
    }

    sound.playCraftSuccess();
    this.state = {
      ...this.state,
      activeQuests: [...this.state.activeQuests, questId],
      unlockedRecipes: unlocked
    };
    this.addToast(`Quest Started: ${quest.title}`, './assets/items/raw_linen.png?v=8', '#f5d27a');
    this.emit(true);
  }

  public startCareQuest(questId: string) {
    const quest = QUESTS.find((q) => q.id === questId);
    if (!quest || !quest.requiresCareApplication) return;
    if ((this.state.inventory[quest.requiredItemId] || 0) < quest.requiredCount) return;
    sound.playTap();
    this.state = {
      ...this.state,
      talkingVillagerId: null,
      activeModal: null,
      activeCareQuestId: questId
    };
    this.emit(false);
  }

  public completeQuest(questId: string) {
    const quest = QUESTS.find((q) => q.id === questId);
    if (!quest) return;
    if ((this.state.inventory[quest.requiredItemId] || 0) < quest.requiredCount) return;

    const inv = { ...this.state.inventory };
    inv[quest.requiredItemId] = (inv[quest.requiredItemId] || 0) - quest.requiredCount;

    if (quest.rewardItems) {
      for (const ri of quest.rewardItems) {
        inv[ri.itemId] = (inv[ri.itemId] || 0) + ri.count;
      }
    }

    const unlocked = [...this.state.unlockedRecipes];
    if (quest.rewardRecipeId && !unlocked.includes(quest.rewardRecipeId)) {
      unlocked.push(quest.rewardRecipeId);
      const r = CRAFT_RECIPES.find((cr) => cr.id === quest.rewardRecipeId);
      if (r) {
        const outItem = ITEMS[r.outputId];
        window.setTimeout(() => {
          this.addToast(`Recipe Unlocked: ${outItem.name}!`, outItem.icon, outItem.accentColor);
        }, 700);
      }
    }

    const hearts = { ...this.state.villagerHearts };
    hearts[quest.giverId] = Math.min(5, (hearts[quest.giverId] || 1) + 1);

    sound.playCraftSuccess();
    this.state = {
      ...this.state,
      inventory: inv,
      gold: this.state.gold + quest.rewardGold,
      runes: this.state.runes + 4,
      unlockedRecipes: unlocked,
      activeQuests: this.state.activeQuests.filter((id) => id !== questId),
      completedQuests: [...this.state.completedQuests, questId],
      villagerHearts: hearts,
      activeCareQuestId: null,
      talkingVillagerId: null
    };
    this.addToast(
      `Quest Complete: +${quest.rewardGold}g & +4 Runes!`,
      './assets/items/potion_moonpetal.png?v=8',
      '#f7d154'
    );
    this.emit(true);
  }

  public restUntilMorning() {
    sound.playCraftSuccess();
    this.state = {
      ...this.state,
      day: this.state.day + 1,
      timePhase: 'Morning',
      phaseActions: 0,
      health: this.state.maxHealth,
      forageCollectedToday: {},
      planterReady: true,
      activeModal: null
    };
    this.addToast(
      `Good morning, Genevieve! Day ${this.state.day} dawns bright & fresh.`,
      './assets/items/raw_chamomile.png?v=8',
      '#f6d365'
    );
    this.emit(true);
  }

  public resetGameSave() {
    localStorage.removeItem(SAVE_KEY);
    this.state = {
      ...createInitialPersistedState(),
      seenIntro: true,
      activeModal: null,
      talkingVillagerId: null,
      activeCareQuestId: null,
      toasts: []
    };
    this.addToast('Started a fresh new journal in Willowmere!', './assets/items/raw_chamomile.png?v=8');
    this.emit(true);
  }
}

export const gameStore = new GameStore();

export function useGameStore(): StoreSnapshot {
  return useSyncExternalStore(gameStore.subscribe, gameStore.getSnapshot);
}
