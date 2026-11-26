import React, { useState } from 'react';
import { ITEMS, PREP_RECIPES, type PrepRecipe } from '../data/gameData';
import { getRawHerbPackRuneCost } from '../monetization/runeEngine';
import { gameStore, useGameStore } from '../state/gameStore';
import { sound } from '../audio/soundEngine';
import { AlembicDistillStage, CuttingSliceStage, MortarGrindStage } from './GestureWorkStages';

export const PrepStationModal: React.FC = () => {
  const state = useGameStore();
  const [selectedId, setSelectedId] = useState<string>(PREP_RECIPES[0].id);

  const selected: PrepRecipe = PREP_RECIPES.find((r) => r.id === selectedId) || PREP_RECIPES[0];
  const rawItem = ITEMS[selected.inputId];
  const outItem = ITEMS[selected.outputId];
  const rawCount = state.inventory[selected.inputId] || 0;
  const outCount = state.inventory[selected.outputId] || 0;
  const bonusYield = state.upgrades.upg_golden_mortar ? 2 : 1;
  const herbBundleRuneCost = getRawHerbPackRuneCost(rawItem.id, 3);

  const handleSelect = (id: string) => {
    sound.playTap();
    setSelectedId(id);
  };

  const handleCompleteGesture = () => {
    gameStore.completePrep(selected.id, 1);
  };

  return (
    <div className="modal-backdrop" onClick={() => gameStore.closeAllModals()}>
      <div className="modal-sheet parchment-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-emblem">
            <img src="./assets/ui/emblem_prep.png?v=7" alt="" className="header-station-emblem" />
            <div>
              <span className="eyebrow-tag">WORKSHOP PREP & ALEMBIC</span>
              <h2>{selected.methodLabel}</h2>
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
          {PREP_RECIPES.map((r) => {
            const raw = ITEMS[r.inputId];
            const have = state.inventory[r.inputId] || 0;
            const active = r.id === selected.id;
            return (
              <button
                key={r.id}
                aria-label={raw.name}
                className={`recipe-chip pictorial ${active ? 'active' : ''} ${have > 0 ? 'available' : 'empty'}`}
                onClick={() => handleSelect(r.id)}
              >
                <img src={raw.icon} alt={raw.name} />
                <span className="chip-badge">×{have}</span>
              </button>
            );
          })}
        </div>

        <div className="station-stage">
          <div className="conversion-row">
            <div className="item-card-mini">
              <img src={rawItem.icon} alt={rawItem.name} />
              <div className="mini-title">{rawItem.name}</div>
              <div className="mini-stock">×{rawCount}</div>
            </div>

            <div className="arrow-column">
              <img src="./assets/ui/emblem_prep.png?v=7" alt="" className="conv-emblem" />
              <div className="arrow-glyph">➔</div>
            </div>

            <div className="item-card-mini result">
              <img src={outItem.icon} alt={outItem.name} />
              <div className="mini-title">{outItem.name}</div>
              <div className="mini-stock">
                ×{outCount} (+{bonusYield})
              </div>
            </div>
          </div>

          {rawCount > 0 ? (
            <>
              {selected.method === 'grind' && (
                <MortarGrindStage
                  key={selected.id}
                  rawIcon={rawItem.icon}
                  outIcon={outItem.icon}
                  rawName={rawItem.name}
                  outName={outItem.name}
                  onComplete={handleCompleteGesture}
                />
              )}
              {selected.method === 'slice' && (
                <CuttingSliceStage
                  key={selected.id}
                  rawIcon={rawItem.icon}
                  rawName={rawItem.name}
                  stepsRequired={selected.stepsRequired}
                  onComplete={handleCompleteGesture}
                />
              )}
              {selected.method === 'distill' && (
                <AlembicDistillStage
                  key={selected.id}
                  rawIcon={rawItem.icon}
                  outIcon={outItem.icon}
                  onComplete={handleCompleteGesture}
                />
              )}
            </>
          ) : (
            <div className="empty-hint-box">
              <strong>No {rawItem.name} in Satchel</strong>
              <span>{rawItem.sourceHint || 'Forage freely outside in the Outskirts Meadow & Brookside.'}</span>
              <div className="empty-rune-row">
                <button
                  className="graphic-rune-cta subtle"
                  aria-label={`Quick-Supply 3 ${rawItem.name}`}
                  onClick={() => gameStore.buyRawHerbPackWithRunes(rawItem.id, 3)}
                >
                  <img src="./assets/ui/icon_rune.png?v=7" alt="" />
                  <span>Quick +3 ({herbBundleRuneCost})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
