import React, { useState } from 'react';
import { ITEMS, QUESTS, SHOP_UPGRADES, TOOL_UPGRADES } from '../data/gameData';
import { RUNE_UPGRADE_COSTS } from '../monetization/runeEngine';
import { gameStore, useGameStore, type PricingTier } from '../state/gameStore';

export const ShopShelfModal: React.FC = () => {
  const state = useGameStore();
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const maxSlots = gameStore.getMaxShelfSlots();

  const ownedUpgrades =
    SHOP_UPGRADES.filter((u) => state.upgrades[u.id]).length +
    TOOL_UPGRADES.filter((t) => state.upgrades[t.id]).length;
  const totalMilestones = SHOP_UPGRADES.length + TOOL_UPGRADES.length + QUESTS.length;
  const unlockedMilestones = ownedUpgrades + state.completedQuests.length;
  const prosperityPct = Math.round((unlockedMilestones / totalMilestones) * 100);

  const sellableItems = Object.values(ITEMS).filter(
    (it) =>
      (it.category === 'potion' || it.category === 'poultice') &&
      (state.inventory[it.id] || 0) > 0
  );

  const pricingOptions: { id: PricingTier; icon: string; badge: string }[] = [
    { id: 'kind', icon: './assets/ui/icon_heart.png?v=7', badge: '-15%' },
    { id: 'fair', icon: './assets/ui/btn_shelves.png?v=7', badge: '100%' },
    { id: 'artisan', icon: './assets/ui/icon_coin.png?v=7', badge: '+25%' }
  ];

  return (
    <div className="modal-backdrop" onClick={() => gameStore.closeAllModals()}>
      <div className="modal-sheet parchment-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-emblem">
            <img src="./assets/ui/btn_shelves.png?v=7" alt="" className="header-station-emblem" />
            <div>
              <span className="eyebrow-tag">SHOPFRONT & HOMESTEAD</span>
              <h2>Display Shelves & Upgrades</h2>
            </div>
          </div>
          <button
            className="wax-close-btn"
            aria-label="Close"
            onClick={() => gameStore.closeAllModals()}
          >
            <img src="./assets/ui/emblem_close.png?v=7" alt="" />
          </button>
        </div>

        <div className="prosperity-card">
          <div className="prosperity-top">
            <strong>Homestead Flourishing</strong>
            <span>{prosperityPct}%</span>
          </div>
          <div className="prosperity-bar-bg">
            <div className="prosperity-bar-fill" style={{ width: `${Math.max(8, prosperityPct)}%` }} />
          </div>
        </div>

        <div className="shop-open-banner">
          <div>
            <strong>{state.shopOpen ? 'Shop Doors Open' : 'Shop Doors Closed'}</strong>
            <span>
              {state.shopOpen
                ? 'Villagers browse and buy remedies stocked on your wall shelves.'
                : 'Tap the cottage sign medallion to welcome customers inside.'}
            </span>
          </div>
          <button
            className={`graphic-door-toggle ${state.shopOpen ? 'open' : ''}`}
            aria-label="Toggle Shop Open"
            onClick={() => gameStore.toggleShopOpen()}
          >
            <img src="./assets/ui/btn_shop.png?v=7" alt="" className="gdt-main" />
            {state.shopOpen && <img src="./assets/ui/emblem_check.png?v=7" alt="" className="gdt-check" />}
          </button>
        </div>

        {state.upgrades.upg_garden_beds && !state.planterReady && (
          <div className="shop-open-banner rune-bloom-banner">
            <div>
              <strong>Kitchen-Garden Harvested Today</strong>
              <span>Instantly bloom a fresh Moonpetal & Lavender harvest with Starlight Runes!</span>
            </div>
            <button
              className="graphic-rune-cta"
              aria-label="Instant Garden Bloom"
              onClick={() => gameStore.instantBloomPlantersWithRunes(5)}
            >
              <img src="./assets/ui/icon_rune.png?v=7" alt="" />
              <span>5</span>
            </button>
          </div>
        )}

        <div className="shelf-grid">
          {state.shelfSlots.slice(0, maxSlots).map((slot, idx) => {
            const item = slot ? ITEMS[slot.itemId] : null;
            const isSel = idx === selectedSlot;
            return (
              <div
                key={idx}
                className={`shelf-slot-card ${isSel ? 'selected' : ''} ${item ? 'filled' : 'empty'}`}
                onClick={() => setSelectedSlot(idx)}
              >
                <span className="slot-num">#{idx + 1}</span>
                {item ? (
                  <>
                    <button
                      className="slot-wax-remove"
                      aria-label="Remove from shelf"
                      onClick={(e) => {
                        e.stopPropagation();
                        gameStore.unstockShelf(idx);
                      }}
                    >
                      <img src="./assets/ui/emblem_close.png?v=7" alt="" />
                    </button>
                    <img src={item.icon} alt={item.name} className="slot-item-img" />
                    <span className="gold-tag">
                      <img src="./assets/ui/icon_coin.png?v=7" alt="" className="inline-coin-xs" />
                      {gameStore.getSellPrice(item.id)}
                    </span>
                  </>
                ) : (
                  <div className="empty-shelf-placeholder">
                    <img src="./assets/ui/btn_shelves.png?v=7" alt="" className="empty-cubby-icon" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="stock-picker-box">
          <div className="section-label">Shelf #{selectedSlot + 1}</div>
          {sellableItems.length > 0 ? (
            <div className="sellable-list">
              {sellableItems.map((it) => (
                <button
                  key={it.id}
                  className="sellable-pill"
                  onClick={() => gameStore.stockShelf(selectedSlot, it.id)}
                >
                  <img src={it.icon} alt={it.name} />
                  <div>
                    <strong>{it.name}</strong>
                    <span>×{state.inventory[it.id]}</span>
                  </div>
                  <div className="graphic-coin-cta">
                    <img src="./assets/ui/icon_coin.png?v=7" alt="" />
                    <span>{gameStore.getSellPrice(it.id)}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-hint-box compact">
              <span>Brew potions or fold poultices in the NW Workshop to stock your shelves.</span>
            </div>
          )}
        </div>

        <div className="pricing-row">
          {pricingOptions.map((opt) => (
            <button
              key={opt.id}
              aria-label={opt.id}
              className={`pricing-pill graphic ${state.pricingTier === opt.id ? 'active' : ''}`}
              onClick={() => gameStore.setPricingTier(opt.id)}
            >
              <img src={opt.icon} alt="" />
              <strong>{opt.badge}</strong>
            </button>
          ))}
        </div>

        <div className="section-label">Foraging & Expedition Tool Upgrades</div>
        <div className="upgrades-list" style={{ marginBottom: 16 }}>
          {TOOL_UPGRADES.map((tool) => {
            const owned = !!state.upgrades[tool.id];
            const canBuyGold = !owned && state.gold >= tool.cost;
            return (
              <div key={tool.id} className={`upgrade-row ${owned ? 'owned' : ''}`}>
                <img src={tool.icon} alt={tool.name} />
                <div className="upgrade-info">
                  <strong>{tool.name}</strong>
                  <span>{tool.description}</span>
                </div>
                {owned ? (
                  <img src="./assets/ui/emblem_check.png?v=7" alt="" className="owned-check-lg" />
                ) : (
                  <div className="upgrade-cta-stack">
                    <button
                      className="graphic-coin-cta"
                      disabled={!canBuyGold}
                      aria-label={`Buy ${tool.name} with Gold`}
                      onClick={() => gameStore.buyUpgrade(tool.id)}
                    >
                      <img src="./assets/ui/icon_coin.png?v=7" alt="" />
                      <span>{tool.cost}</span>
                    </button>
                    <button
                      className="graphic-rune-cta"
                      aria-label={`Instant Unlock ${tool.name} with Runes`}
                      onClick={() => gameStore.buyUpgradeWithRunes(tool.id)}
                    >
                      <img src="./assets/ui/icon_rune.png?v=7" alt="" />
                      <span>{tool.runeCost}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="section-label">Homestead & Cottage Upgrades</div>
        <div className="upgrades-list">
          {SHOP_UPGRADES.map((upg) => {
            const owned = !!state.upgrades[upg.id];
            const canBuyGold = !owned && state.gold >= upg.cost;
            const runeCost = RUNE_UPGRADE_COSTS[upg.id] ?? 20;
            return (
              <div key={upg.id} className={`upgrade-row ${owned ? 'owned' : ''}`}>
                <img src={upg.icon} alt={upg.name} />
                <div className="upgrade-info">
                  <strong>{upg.name}</strong>
                  <span>{upg.description}</span>
                </div>
                {owned ? (
                  <img src="./assets/ui/emblem_check.png?v=7" alt="" className="owned-check-lg" />
                ) : (
                  <div className="upgrade-cta-stack">
                    <button
                      className="graphic-coin-cta"
                      disabled={!canBuyGold}
                      aria-label={`Buy ${upg.name} with Gold`}
                      onClick={() => gameStore.buyUpgrade(upg.id)}
                    >
                      <img src="./assets/ui/icon_coin.png?v=7" alt="" />
                      <span>{upg.cost}</span>
                    </button>
                    <button
                      className="graphic-rune-cta"
                      aria-label={`Instant Unlock ${upg.name} with Runes`}
                      onClick={() => gameStore.buyUpgradeWithRunes(upg.id)}
                    >
                      <img src="./assets/ui/icon_rune.png?v=7" alt="" />
                      <span>{runeCost}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
