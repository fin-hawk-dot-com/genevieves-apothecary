import React, { useState } from 'react';
import { CRAFT_RECIPES, ITEMS } from '../data/gameData';
import {
  RUNE_PACKAGES,
  RUNE_RARE_BUNDLES,
  RUNE_RECIPE_UNLOCK_COSTS,
  type RunePackDef
} from '../monetization/runeEngine';
import { gameStore, useGameStore } from '../state/gameStore';
import { sound } from '../audio/soundEngine';

export const RuneShopModal: React.FC = () => {
  const state = useGameStore();
  const [tab, setTab] = useState<'packages' | 'exchange'>('packages');
  const [checkoutPack, setCheckoutPack] = useState<RunePackDef | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);

  const lockedRecipes = CRAFT_RECIPES.filter((r) => !state.unlockedRecipes.includes(r.id));

  const handleOpenCheckout = (pack: RunePackDef) => {
    sound.playTap();
    setCheckoutPack(pack);
  };

  const handleConfirmTestCheckout = async () => {
    if (!checkoutPack || processing) return;
    setProcessing(true);
    await gameStore.purchaseRunePack(checkoutPack.id);
    setProcessing(false);
    setCheckoutPack(null);
  };

  return (
    <div className="modal-backdrop" onClick={() => gameStore.closeAllModals()}>
      <div className="modal-sheet rune-emporium-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-emblem">
            <img src="./assets/ui/icon_rune.png?v=7" alt="" className="header-station-emblem" />
            <div>
              <span className="eyebrow-tag rune-eyebrow">CELESTIAL APOTHECARY VAULT</span>
              <h2>Starlight Runes</h2>
            </div>
          </div>

          <div className="rune-header-right">
            <div className="rune-balance-chip">
              <img src="./assets/ui/icon_rune.png?v=7" alt="" />
              <strong>{state.runes}</strong>
            </div>
            <button
              className="wax-close-btn"
              aria-label="Close"
              onClick={() => gameStore.closeAllModals()}
            >
              <img src="./assets/ui/emblem_close.png?v=7" alt="" />
            </button>
          </div>
        </div>

        <p className="rune-optional-note">
          Optional quick-advancement time-savers only — every recipe, botanical, and cottage upgrade can be earned
          freely in Willowmere!
        </p>

        {/* Graphic Storefront Tabs: Rune Packages vs Rare Botanical & Formula Exchange */}
        <div className="rune-tab-bar">
          <button
            className={`graphic-tab-btn rune-tab ${tab === 'packages' ? 'active' : ''}`}
            aria-label="Rune Packages"
            onClick={() => setTab('packages')}
          >
            <img src="./assets/ui/rune_pack_chest.png?v=7" alt="" />
            <span className="gtb-count">+Runes</span>
          </button>
          <button
            className={`graphic-tab-btn rune-tab ${tab === 'exchange' ? 'active' : ''}`}
            aria-label="Rare Botanicals & Formulas"
            onClick={() => setTab('exchange')}
          >
            <img src="./assets/items/raw_moonpetal.png?v=7" alt="" />
            <span className="gtb-count">Spend</span>
          </button>
        </div>

        {tab === 'packages' ? (
          <div className="rune-pack-grid">
            {RUNE_PACKAGES.map((pack) => {
              const total = pack.runes + pack.bonusRunes;
              return (
                <button
                  key={pack.id}
                  className="rune-pack-card"
                  style={{ '--pack-accent': pack.accent } as React.CSSProperties}
                  onClick={() => handleOpenCheckout(pack)}
                >
                  {pack.badge && <span className="rune-pack-ribbon">{pack.badge}</span>}
                  <img src={pack.icon} alt={pack.name} className="rune-pack-art" />
                  <strong className="rune-pack-title">{pack.name}</strong>
                  <div className="rune-pack-amount">
                    <img src="./assets/ui/icon_rune.png?v=7" alt="" />
                    <span>{total}</span>
                  </div>
                  {pack.bonusRunes > 0 && (
                    <small className="rune-bonus-note">
                      {pack.runes} + {pack.bonusRunes} Bonus
                    </small>
                  )}
                  <div className="rune-price-seal">{pack.priceUsd}</div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="journal-scroll">
            <div className="section-label">Rare & Hard-to-Find Botanicals</div>
            <div className="upgrades-list">
              {RUNE_RARE_BUNDLES.map((b) => {
                const canAfford = state.runes >= b.runeCost;
                return (
                  <div key={b.id} className="upgrade-row">
                    <img src={b.icon} alt={b.name} />
                    <div className="upgrade-info">
                      <strong>{b.name}</strong>
                      <span>{b.description}</span>
                    </div>
                    <button
                      className="graphic-rune-cta"
                      aria-label={b.name}
                      onClick={() => {
                        if (!canAfford) {
                          setTab('packages');
                        } else {
                          gameStore.buyRareBundleWithRunes(b.id);
                        }
                      }}
                    >
                      <img src="./assets/ui/icon_rune.png?v=7" alt="" />
                      <span>{b.runeCost}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {lockedRecipes.length > 0 && (
              <>
                <div className="section-label">Instant Formula Scrolls</div>
                <div className="upgrades-list">
                  {lockedRecipes.map((r) => {
                    const out = ITEMS[r.outputId];
                    const cost = RUNE_RECIPE_UNLOCK_COSTS[r.id] ?? 18;
                    return (
                      <div key={r.id} className="upgrade-row">
                        <img src={out.icon} alt={out.name} />
                        <div className="upgrade-info">
                          <strong>{out.name}</strong>
                          <span>{out.description}</span>
                        </div>
                        <button
                          className="graphic-rune-cta"
                          aria-label={`Unlock ${out.name}`}
                          onClick={() => {
                            if (state.runes < cost) {
                              setTab('packages');
                            } else {
                              gameStore.unlockRecipeWithRunes(r.id);
                            }
                          }}
                        >
                          <img src="./assets/ui/icon_rune.png?v=7" alt="" />
                          <span>{cost}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* SANDBOX AUTO-APPROVING CHECKOUT WINDOW OVERLAY */}
        {checkoutPack && (
          <div className="checkout-window-backdrop" onClick={() => !processing && setCheckoutPack(null)}>
            <div className="checkout-window-card" onClick={(e) => e.stopPropagation()}>
              <div className="checkout-header">
                <span className="sandbox-test-pill">TESTING MODE • AUTO-APPROVE</span>
                <button
                  className="wax-close-btn sm"
                  aria-label="Cancel Checkout"
                  disabled={processing}
                  onClick={() => setCheckoutPack(null)}
                >
                  <img src="./assets/ui/emblem_close.png?v=7" alt="" />
                </button>
              </div>

              <div className="checkout-summary-box">
                <img src={checkoutPack.icon} alt={checkoutPack.name} className="checkout-pack-img" />
                <div>
                  <h3>{checkoutPack.name}</h3>
                  <div className="checkout-rune-grant">
                    <img src="./assets/ui/icon_rune.png?v=7" alt="" />
                    <strong>+{checkoutPack.runes + checkoutPack.bonusRunes} Starlight Runes</strong>
                  </div>
                </div>
              </div>

              <div className="checkout-line-items">
                <div className="cli-row">
                  <span>Package Total</span>
                  <strong>{checkoutPack.priceUsd}</strong>
                </div>
                <div className="cli-row muted">
                  <span>Payment Method</span>
                  <span>Sandbox Test Pass (No Charge)</span>
                </div>
              </div>

              <p className="checkout-disclaimer">
                No payment details are collected during testing. Tap Confirm below to auto-approve and credit your
                Runes immediately.
              </p>

              <button
                className="checkout-confirm-seal-btn"
                disabled={processing}
                aria-label="Confirm Sandbox Purchase"
                onClick={handleConfirmTestCheckout}
              >
                <img src="./assets/ui/emblem_check.png?v=7" alt="" className="ccsb-check" />
                <span>{processing ? 'Approving…' : `Confirm • ${checkoutPack.priceUsd}`}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
