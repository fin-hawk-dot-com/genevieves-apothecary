import React from 'react';
import { CRAFT_RECIPES, ITEMS, PREP_RECIPES, QUESTS, TOOL_UPGRADES, VILLAGERS } from '../data/gameData';
import { RUNE_RECIPE_UNLOCK_COSTS } from '../monetization/runeEngine';
import { gameStore, useGameStore } from '../state/gameStore';

interface Props {
  mode: 'inventory' | 'recipes' | 'quests';
}

export const CompendiumModal: React.FC<Props> = ({ mode }) => {
  const state = useGameStore();

  const activeQuestObjs = QUESTS.filter((q) => state.activeQuests.includes(q.id));
  const availableNewQuests = QUESTS.filter(
    (q) =>
      !state.activeQuests.includes(q.id) &&
      !state.completedQuests.includes(q.id) &&
      (!q.prerequisiteQuestId || state.completedQuests.includes(q.prerequisiteQuestId))
  );
  const completedQuestObjs = QUESTS.filter((q) => state.completedQuests.includes(q.id));

  const ownedItems = Object.values(ITEMS).filter((it) => (state.inventory[it.id] || 0) > 0);
  const rawOwned = ownedItems.filter((it) => it.category === 'raw');
  const prepOwned = ownedItems.filter((it) => it.category === 'prepared');
  const remedyOwned = ownedItems.filter((it) => it.category === 'potion' || it.category === 'poultice');

  const headerEmblem =
    mode === 'inventory'
      ? './assets/ui/btn_inventory.png?v=7'
      : mode === 'recipes'
      ? './assets/ui/btn_recipes.png?v=7'
      : './assets/ui/btn_quests.png?v=7';

  const headerEyebrow =
    mode === 'inventory'
      ? 'APOTHECARY SATCHEL & PANTRY'
      : mode === 'recipes'
      ? 'HERBALIST FORMULA GRIMOIRE'
      : 'WILLOWMERE VILLAGE REQUESTS';

  const headerTitle =
    mode === 'inventory'
      ? 'Inventory Satchel'
      : mode === 'recipes'
      ? 'Recipes & Prep Guide'
      : 'Quest Tracker';

  return (
    <div className="modal-backdrop" onClick={() => gameStore.closeAllModals()}>
      <div className="modal-sheet parchment-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-emblem">
            <img src={headerEmblem} alt="" className="header-station-emblem" />
            <div>
              <span className="eyebrow-tag">{headerEyebrow}</span>
              <h2>{headerTitle}</h2>
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

        {/* =========================================================
           MODE 1: INVENTORY SATCHEL
           ========================================================= */}
        {mode === 'inventory' && (
          <div className="journal-scroll">
            <div className="section-label">Herbalist Field Gear & Foraging Tools</div>
            <div className="tool-gear-strip">
              {TOOL_UPGRADES.map((tool) => {
                const owned = !!state.upgrades[tool.id];
                return (
                  <div
                    key={tool.id}
                    className={`tool-gear-chip ${owned ? 'equipped' : 'unowned'}`}
                    onClick={() => {
                      if (!owned) gameStore.openModal('shelf');
                    }}
                  >
                    <img src={tool.icon} alt={tool.name} />
                    <div>
                      <strong>{tool.shortLabel}</strong>
                      <small>{owned ? 'Equipped ✓' : `${tool.cost}g • Forge`}</small>
                    </div>
                  </div>
                );
              })}
            </div>

            {ownedItems.length === 0 ? (
              <div className="empty-hint-box">
                <strong>Your satchel is empty</strong>
                <span>Walk out the South Cottage Door to gather wild blossoms in the Outskirts Meadow!</span>
              </div>
            ) : (
              <>
                {remedyOwned.length > 0 && (
                  <>
                    <div className="section-label">Brewed Potions & Poultices</div>
                    <div className="satchel-grid">
                      {remedyOwned.map((it) => (
                        <div key={it.id} className="satchel-cell">
                          <img src={it.icon} alt={it.name} />
                          <strong>{it.name}</strong>
                          <span className="qty-pill">×{state.inventory[it.id]}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {prepOwned.length > 0 && (
                  <>
                    <div className="section-label">Prepared Essences, Pastes & Powders</div>
                    <div className="satchel-grid">
                      {prepOwned.map((it) => (
                        <div key={it.id} className="satchel-cell">
                          <img src={it.icon} alt={it.name} />
                          <strong>{it.name}</strong>
                          <span className="qty-pill">×{state.inventory[it.id]}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {rawOwned.length > 0 && (
                  <>
                    <div className="section-label">Raw Botanicals & Supplies</div>
                    <div className="satchel-grid">
                      {rawOwned.map((it) => (
                        <div key={it.id} className="satchel-cell">
                          <img src={it.icon} alt={it.name} />
                          <strong>{it.name}</strong>
                          <span className="qty-pill">×{state.inventory[it.id]}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* =========================================================
           MODE 2: RECIPES & TOUCH-MOTION PREP GUIDE
           ========================================================= */}
        {mode === 'recipes' && (
          <div className="journal-scroll">
            <div className="section-label">
              Cauldron Potions & Poultices ({state.unlockedRecipes.length}/{CRAFT_RECIPES.length})
            </div>
            {CRAFT_RECIPES.map((r) => {
              const out = ITEMS[r.outputId];
              const unlocked = state.unlockedRecipes.includes(r.id);
              const runeCost = RUNE_RECIPE_UNLOCK_COSTS[r.id] ?? 18;
              return (
                <div key={r.id} className={`recipe-book-row ${unlocked ? 'unlocked' : 'locked'}`}>
                  <img
                    src={out.icon}
                    alt={out.name}
                    style={{ filter: unlocked ? 'none' : 'grayscale(1) opacity(0.45)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <strong>{out.name}</strong>
                    <p>{unlocked ? out.description : `${r.unlockHint} (Free via village quest)`}</p>
                    {unlocked && (
                      <div className="recipe-ing-icons">
                        {r.ingredients.map((i) => {
                          const have = state.inventory[i.itemId] || 0;
                          return (
                            <span key={i.itemId} className={`recipe-ing-tag ${have >= i.count ? 'ok' : ''}`}>
                              <img src={ITEMS[i.itemId].icon} alt={ITEMS[i.itemId].name} />
                              <small>
                                {have}/{i.count}
                              </small>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {!unlocked && (
                    <button
                      className="graphic-rune-cta subtle"
                      aria-label={`Quick Unlock ${out.name}`}
                      onClick={() => gameStore.unlockRecipeWithRunes(r.id)}
                    >
                      <img src="./assets/ui/icon_rune.png?v=7" alt="" />
                      <span>{runeCost}</span>
                    </button>
                  )}
                </div>
              );
            })}

            <div className="section-label">Prep Bench Touch-Motion Conversions</div>
            {PREP_RECIPES.map((pr) => {
              const raw = ITEMS[pr.inputId];
              const out = ITEMS[pr.outputId];
              const gestureTag =
                pr.method === 'grind'
                  ? '↻ Circular Mortar Grind'
                  : pr.method === 'slice'
                  ? '⌿ Swipe Cutting Board'
                  : '⇅ Stroke Alembic Bellows';
              return (
                <div key={pr.id} className="recipe-book-row">
                  <img src={raw.icon} alt={raw.name} />
                  <div style={{ flex: 1 }}>
                    <strong>
                      {raw.name} ➔ {out.name}
                    </strong>
                    <p>{gestureTag}</p>
                  </div>
                  <img src={out.icon} alt={out.name} style={{ width: 42, height: 42 }} />
                </div>
              );
            })}
          </div>
        )}

        {/* =========================================================
           MODE 3: QUEST & VILLAGER TRACKER (Walking Directions)
           ========================================================= */}
        {mode === 'quests' && (
          <div className="journal-scroll">
            {activeQuestObjs.length > 0 ? (
              activeQuestObjs.map((q) => {
                const giver = VILLAGERS.find((v) => v.id === q.giverId)!;
                const req = ITEMS[q.requiredItemId];
                const have = state.inventory[q.requiredItemId] || 0;
                const walkHint =
                  giver.zone === 'outskirts'
                    ? 'Walk South out of Cottage -> Outskirts Cobblestone Fork'
                    : 'Walk South out of Cottage -> East Road -> Willowmere Square';
                return (
                  <div key={q.id} className="journal-quest-card active">
                    <div className="jq-top">
                      <img src={giver.portrait} alt={giver.name} />
                      <div>
                        <strong>{q.title}</strong>
                        <span>
                          {giver.name} • {walkHint}
                        </span>
                      </div>
                    </div>
                    <p>{q.summary}</p>
                    <div className="jq-progress">
                      <img src={req.icon} alt={req.name} />
                      <strong>
                        {req.name}: {have}/{q.requiredCount}
                      </strong>
                      <span className="gold-tag">
                        <img src="./assets/ui/icon_coin.png?v=7" alt="" className="inline-coin-xs" />+
                        {q.rewardGold}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-hint-box compact">
                <span>No active requests—walk to Willowmere Square to chat with your neighbors!</span>
              </div>
            )}

            {availableNewQuests.length > 0 && (
              <>
                <div className="section-label">Villagers Ready to Chat</div>
                {availableNewQuests.map((q) => {
                  const giver = VILLAGERS.find((v) => v.id === q.giverId)!;
                  return (
                    <div key={q.id} className="journal-quest-card hint">
                      <div className="jq-top">
                        <img src={giver.portrait} alt={giver.name} />
                        <div>
                          <strong>{q.title}</strong>
                          <span>
                            Visit {giver.name} in{' '}
                            {giver.zone === 'village' ? 'Willowmere Village Square' : 'the Outskirts Homestead'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {completedQuestObjs.length > 0 && (
              <div className="section-label">
                Completed Stories ({completedQuestObjs.length}/{QUESTS.length})
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
