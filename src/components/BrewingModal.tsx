import React, { useState } from 'react';
import { CRAFT_RECIPES, ITEMS, type CraftRecipe } from '../data/gameData';
import { getMissingIngredientsSpec, RUNE_RECIPE_UNLOCK_COSTS } from '../monetization/runeEngine';
import { gameStore, useGameStore } from '../state/gameStore';
import { sound } from '../audio/soundEngine';
import { CauldronStirStage, PoulticeFoldStage } from './GestureWorkStages';

interface Props {
  station: 'cauldron' | 'poultice';
}

export const BrewingModal: React.FC<Props> = ({ station }) => {
  const state = useGameStore();
  const stationRecipes = CRAFT_RECIPES.filter((r) => r.station === station);
  const unlockedList = stationRecipes.filter((r) => state.unlockedRecipes.includes(r.id));
  const [selectedId, setSelectedId] = useState<string>(unlockedList[0]?.id || stationRecipes[0].id);
  const [addedIngredients, setAddedIngredients] = useState<boolean>(false);

  const selected: CraftRecipe =
    stationRecipes.find((r) => r.id === selectedId) || unlockedList[0] || stationRecipes[0];
  const isUnlocked = state.unlockedRecipes.includes(selected.id);
  const outItem = ITEMS[selected.outputId];
  const stationEmblem =
    station === 'cauldron' ? './assets/ui/emblem_cauldron.png?v=7' : './assets/ui/emblem_poultice.png?v=7';

  const canCraft =
    isUnlocked &&
    selected.ingredients.every((req) => (state.inventory[req.itemId] || 0) >= req.count);

  const missingSpec = getMissingIngredientsSpec(selected.id, state.inventory);
  const unlockRuneCost = RUNE_RECIPE_UNLOCK_COSTS[selected.id] ?? 18;

  const selectRecipe = (id: string) => {
    sound.playTap();
    setSelectedId(id);
    setAddedIngredients(false);
  };

  const handleAddIngredients = () => {
    if (!canCraft) return;
    sound.playHarvest();
    setAddedIngredients(true);
  };

  const handleFinishWithRunes = () => {
    const ok = gameStore.finishMissingIngredientsWithRunes(selected.id);
    if (ok) {
      setAddedIngredients(true);
    }
  };

  const handleGestureComplete = () => {
    gameStore.completeCraft(selected.id);
    setAddedIngredients(false);
  };

  return (
    <div className="modal-backdrop" onClick={() => gameStore.closeAllModals()}>
      <div className="modal-sheet parchment-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-emblem">
            <img src={stationEmblem} alt="" className="header-station-emblem" />
            <div>
              <span className="eyebrow-tag">
                {station === 'cauldron' ? 'COPPER CAULDRON HEARTH' : 'POULTICE FOLDING BENCH'}
              </span>
              <h2>{station === 'cauldron' ? 'Brew Potions' : 'Fold Poultices & Salves'}</h2>
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

        <div className="recipe-strip">
          {stationRecipes.map((r) => {
            const item = ITEMS[r.outputId];
            const unlocked = state.unlockedRecipes.includes(r.id);
            const ready =
              unlocked && r.ingredients.every((req) => (state.inventory[req.itemId] || 0) >= req.count);
            return (
              <button
                key={r.id}
                aria-label={unlocked ? item.name : 'Locked Formula'}
                className={`recipe-chip pictorial ${r.id === selected.id ? 'active' : ''} ${
                  !unlocked ? 'locked' : ready ? 'available' : 'empty'
                }`}
                onClick={() => selectRecipe(r.id)}
              >
                <img
                  src={item.icon}
                  alt={item.name}
                  style={{ filter: unlocked ? 'none' : 'grayscale(1) opacity(0.45)' }}
                />
                <span className="chip-badge">×{state.inventory[r.outputId] || 0}</span>
              </button>
            );
          })}
        </div>

        <div className="craft-detail-card">
          <div className="craft-hero-row">
            <img
              src={outItem.icon}
              alt={outItem.name}
              className="craft-hero-icon"
              style={{ filter: isUnlocked ? 'none' : 'grayscale(1) brightness(0.6)' }}
            />
            <div className="craft-hero-info">
              <h3>{outItem.name}</h3>
              <p>{isUnlocked ? outItem.description : selected.unlockHint}</p>
              {isUnlocked && (
                <div className="value-pill-row">
                  <span className="gold-tag">
                    <img src="./assets/ui/icon_coin.png?v=7" alt="" className="inline-coin-xs" />
                    {gameStore.getSellPrice(outItem.id)}
                  </span>
                  <span className="stock-tag">×{state.inventory[outItem.id] || 0}</span>
                </div>
              )}
            </div>
          </div>

          {!isUnlocked ? (
            <div className="empty-hint-box">
              <strong>Village Story Discovery</strong>
              <span>{selected.unlockHint} (Free through villager quests!)</span>
              <div className="empty-rune-row">
                <button
                  className="graphic-rune-cta subtle"
                  aria-label={`Quick Unlock ${outItem.name}`}
                  onClick={() => gameStore.unlockRecipeWithRunes(selected.id)}
                >
                  <img src="./assets/ui/icon_rune.png?v=7" alt="" />
                  <span>Quick Unlock ({unlockRuneCost})</span>
                </button>
              </div>
            </div>
          ) : !addedIngredients ? (
            <>
              <div className="ingredient-req-list">
                {selected.ingredients.map((req) => {
                  const ing = ITEMS[req.itemId];
                  const have = state.inventory[req.itemId] || 0;
                  const enough = have >= req.count;
                  return (
                    <div key={req.itemId} className={`ing-req-pill ${enough ? 'ok' : 'missing'}`}>
                      <img src={ing.icon} alt={ing.name} />
                      <div className="ing-req-text">
                        <strong>{ing.name}</strong>
                        {!enough && <span>{ing.sourceHint}</span>}
                      </div>
                      {enough ? (
                        <img src="./assets/ui/emblem_check.png?v=7" alt="" className="ing-check-icon" />
                      ) : (
                        <span className="ing-check">
                          {have}/{req.count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="graphic-action-bar centered">
                <button
                  className={`graphic-work-medallion wide ${!canCraft ? 'disabled' : ''}`}
                  disabled={!canCraft}
                  aria-label="Add Ingredients to Station"
                  onClick={handleAddIngredients}
                >
                  <div className="gwm-icons">
                    <img src={stationEmblem} alt="" className="gwm-main" />
                    <img src={outItem.icon} alt="" className="gwm-sub" />
                  </div>
                </button>

                {!canCraft && missingSpec.runeCost > 0 && (
                  <button
                    className="graphic-rune-finish-medallion"
                    aria-label="Quick-Supply Missing Ingredients with Runes"
                    onClick={handleFinishWithRunes}
                  >
                    <img src="./assets/ui/icon_rune.png?v=7" alt="" className="grfm-rune" />
                    <strong>{missingSpec.runeCost}</strong>
                  </button>
                )}
              </div>
            </>
          ) : station === 'cauldron' ? (
            <CauldronStirStage
              key={selected.id}
              brewColor={selected.brewColor}
              outIcon={outItem.icon}
              onComplete={handleGestureComplete}
            />
          ) : (
            <PoulticeFoldStage
              key={selected.id}
              brewColor={selected.brewColor}
              outIcon={outItem.icon}
              onComplete={handleGestureComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
};
