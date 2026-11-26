import React from 'react';
import { ITEMS, QUESTS, TOOL_UPGRADES, VILLAGERS } from '../data/gameData';
import { gameStore, useGameStore } from '../state/gameStore';

export const VillagerModal: React.FC = () => {
  const state = useGameStore();
  const villager = VILLAGERS.find((v) => v.id === state.talkingVillagerId);
  if (!villager) return null;

  const hearts = Math.floor(state.villagerHearts[villager.id] || 1);

  const villagerQuests = QUESTS.filter((q) => {
    if (q.giverId !== villager.id) return false;
    if (state.completedQuests.includes(q.id)) return false;
    if (q.prerequisiteQuestId && !state.completedQuests.includes(q.prerequisiteQuestId)) return false;
    return true;
  });

  const currentQuest = villagerQuests[0] || null;
  const isQuestActive = currentQuest ? state.activeQuests.includes(currentQuest.id) : false;
  const reqItem = currentQuest ? ITEMS[currentQuest.requiredItemId] : null;
  const haveReq = currentQuest
    ? (state.inventory[currentQuest.requiredItemId] || 0) >= currentQuest.requiredCount
    : false;

  return (
    <div className="modal-backdrop" onClick={() => gameStore.closeAllModals()}>
      <div className="modal-sheet parchment-panel" onClick={(e) => e.stopPropagation()}>
        <div className="villager-header-card">
          <img src={villager.portrait} alt={villager.name} className="villager-portrait-lg" />
          <div className="villager-title-col">
            <span className="eyebrow-tag">{villager.title.toUpperCase()}</span>
            <h2>{villager.name}</h2>
            <div className="hearts-row" aria-label={`${hearts} of 5 hearts`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <img
                  key={n}
                  src="./assets/ui/icon_heart.png?v=7"
                  alt=""
                  className={`heart-icon-sm ${n <= hearts ? 'on' : 'off'}`}
                />
              ))}
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

        <blockquote className="villager-dialogue">
          “{currentQuest ? currentQuest.dialogueIntro : villager.greeting}”
        </blockquote>

        {currentQuest && reqItem && (
          <div className="quest-offer-card">
            <div className="eyebrow-tag">APOTHECARY REQUEST</div>
            <h3>{currentQuest.title}</h3>
            <p>{currentQuest.summary}</p>

            <div className="quest-req-row">
              <img src={reqItem.icon} alt={reqItem.name} />
              <div>
                <strong>
                  {reqItem.name} ({state.inventory[currentQuest.requiredItemId] || 0}/{currentQuest.requiredCount})
                </strong>
                <span className="quest-reward-inline">
                  <img src="./assets/ui/icon_coin.png?v=7" alt="" className="inline-coin-xs" />+{currentQuest.rewardGold}
                </span>
              </div>

              {!isQuestActive ? (
                <button
                  className="graphic-quest-action-btn"
                  aria-label="Accept Request"
                  onClick={() => gameStore.acceptQuest(currentQuest.id)}
                >
                  <img src="./assets/ui/emblem_quest.png?v=7" alt="" />
                  <img src="./assets/ui/emblem_check.png?v=7" alt="" className="gqa-sub" />
                </button>
              ) : haveReq ? (
                currentQuest.requiresCareApplication ? (
                  <button
                    className="graphic-quest-action-btn ready"
                    aria-label="Apply Poultice Care"
                    onClick={() => gameStore.startCareQuest(currentQuest.id)}
                  >
                    <img src="./assets/ui/emblem_poultice.png?v=7" alt="" />
                    <img src="./assets/ui/emblem_check.png?v=7" alt="" className="gqa-sub" />
                  </button>
                ) : (
                  <button
                    className="graphic-quest-action-btn ready"
                    aria-label="Deliver Remedy"
                    onClick={() => gameStore.completeQuest(currentQuest.id)}
                  >
                    <img src={reqItem.icon} alt="" />
                    <img src="./assets/ui/emblem_check.png?v=7" alt="" className="gqa-sub" />
                  </button>
                )
              ) : null}
            </div>
          </div>
        )}

        {villager.id === 'bram' && (
          <>
            <div className="section-label">Blacksmith’s Artisan Foraging Tools</div>
            <div className="upgrades-list" style={{ marginBottom: 14 }}>
              {TOOL_UPGRADES.map((tool) => {
                const owned = !!state.upgrades[tool.id];
                const canBuyGold = !owned && state.gold >= tool.cost;
                return (
                  <div key={tool.id} className={`upgrade-row ${owned ? 'owned' : ''}`}>
                    <img src={tool.icon} alt={tool.name} />
                    <div className="upgrade-info">
                      <strong>{tool.name}</strong>
                      <span>{tool.perkSummary}</span>
                    </div>
                    {owned ? (
                      <img src="./assets/ui/emblem_check.png?v=7" alt="" className="owned-check-lg" />
                    ) : (
                      <div className="upgrade-cta-stack">
                        <button
                          className="graphic-coin-cta"
                          disabled={!canBuyGold}
                          aria-label={`Forge ${tool.name} with Gold`}
                          onClick={() => gameStore.buyUpgrade(tool.id)}
                        >
                          <img src="./assets/ui/icon_coin.png?v=7" alt="" />
                          <span>{tool.cost}</span>
                        </button>
                        <button
                          className="graphic-rune-cta"
                          aria-label={`Unlock ${tool.name} with Runes`}
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
          </>
        )}

        <div className="section-label">Trade Basket</div>
        <div className="trade-list">
          {villager.tradeOffers.map((offer) => {
            const item = ITEMS[offer.itemId];
            const canAfford = state.gold >= offer.price;
            return (
              <div key={offer.itemId} className="trade-row">
                <img src={item.icon} alt={item.name} />
                <div className="trade-info">
                  <strong>{offer.label}</strong>
                  <span>×{state.inventory[offer.itemId] || 0}</span>
                </div>
                <button
                  className="graphic-coin-cta"
                  disabled={!canAfford}
                  aria-label={`Buy ${offer.label}`}
                  onClick={() => gameStore.buyVillagerTrade(offer.itemId, offer.price)}
                >
                  <img src="./assets/ui/icon_coin.png?v=7" alt="" />
                  <span>{offer.price}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
