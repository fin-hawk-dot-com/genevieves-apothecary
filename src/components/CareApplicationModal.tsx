import React, { useRef, useState } from 'react';
import { ITEMS, QUESTS, VILLAGERS } from '../data/gameData';
import { gameStore, useGameStore } from '../state/gameStore';
import { sound } from '../audio/soundEngine';

export const CareApplicationModal: React.FC = () => {
  const state = useGameStore();
  const quest = QUESTS.find((q) => q.id === state.activeCareQuestId);

  const [spotCleanPct, setSpotCleanPct] = useState<number[]>([0, 0, 0]);
  const [pastePct, setPastePct] = useState<number>(0);
  const [wrapSwipes, setWrapSwipes] = useState<number>(0);

  const draggingRef = useRef<boolean>(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const startPtRef = useRef<{ x: number; y: number } | null>(null);
  const swipedThisStrokeRef = useRef<boolean>(false);

  if (!quest || !quest.requiresCareApplication) return null;
  const spec = quest.requiresCareApplication;
  const villager = VILLAGERS.find((v) => v.id === quest.giverId)!;
  const remedy = ITEMS[spec.remedyItemId];

  const allCleaned = spotCleanPct.every((v) => v >= 1);
  const pasteDone = pastePct >= 1;
  const wrapped = wrapSwipes >= 2;

  const rubCleanSpot = (idx: number, deltaPx: number) => {
    setSpotCleanPct((prev) => {
      if (prev[idx] >= 1) return prev;
      const next = [...prev];
      const nv = Math.min(1, next[idx] + deltaPx / 75);
      if (nv >= 1 && next[idx] < 1) {
        sound.playPrepStep('distill');
      }
      next[idx] = nv;
      return next;
    });
  };

  return (
    <div className="modal-backdrop care-fullscreen">
      <div
        className="care-sheet"
        style={{
          backgroundImage: `linear-gradient(rgba(22,16,12,0.35), rgba(22,16,12,0.68)), url('./assets/backgrounds/care_table.png?v=7')`
        }}
      >
        <div className="care-top-bar">
          <div className="villager-care-badge">
            <img src={villager.portrait} alt={villager.name} />
            <div>
              <span className="eyebrow-tag" style={{ color: '#f5cf86' }}>
                HEALER’S WORKBENCH
              </span>
              <h2>{spec.limbTitle}</h2>
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

        <p className="care-instruction">
          {!allCleaned && '1/3 • Rub across each chamomile mark to gently cleanse.'}
          {allCleaned && !pasteDone && `2/3 • Rub soothing circles (${Math.round(pastePct * 100)}%) to spread ${remedy.name}.`}
          {pasteDone && !wrapped && `3/3 • Swipe across (${wrapSwipes}/2) to wind & tie the woven linen poultice!`}
          {wrapped && `“${spec.thankYouLine}”`}
        </p>

        <div className="care-workbench-card">
          <div className="limb-silhouette">
            <span className="limb-label">{spec.ailmentDesc}</span>

            {!allCleaned && (
              <div
                className="care-spots-row touch-rub-zone"
                onPointerDown={(e) => {
                  sound.unlock();
                  draggingRef.current = true;
                  lastPtRef.current = { x: e.clientX, y: e.clientY };
                }}
                onPointerUp={() => {
                  draggingRef.current = false;
                  lastPtRef.current = null;
                }}
                onPointerCancel={() => {
                  draggingRef.current = false;
                  lastPtRef.current = null;
                }}
              >
                {spec.spotLabels.map((lbl, idx) => {
                  const done = spotCleanPct[idx] >= 1;
                  return (
                    <div
                      key={lbl}
                      aria-label={lbl}
                      className={`soot-spot-btn graphic ${done ? 'cleaned' : ''}`}
                      onPointerDown={(e) => {
                        sound.unlock();
                        draggingRef.current = true;
                        lastPtRef.current = { x: e.clientX, y: e.clientY };
                        rubCleanSpot(idx, 28);
                      }}
                      onPointerMove={(e) => {
                        if (!draggingRef.current) return;
                        const prev = lastPtRef.current || { x: e.clientX, y: e.clientY };
                        const step = Math.hypot(e.clientX - prev.x, e.clientY - prev.y);
                        lastPtRef.current = { x: e.clientX, y: e.clientY };
                        rubCleanSpot(idx, Math.max(8, step));
                      }}
                    >
                      <img
                        src={
                          done
                            ? './assets/ui/emblem_check.png?v=7'
                            : './assets/items/raw_chamomile.png?v=7'
                        }
                        alt=""
                        className="care-spot-img"
                        draggable={false}
                        style={{ opacity: done ? 1 : 0.45 + spotCleanPct[idx] * 0.55 }}
                      />
                      <div className="mini-rub-bar">
                        <div style={{ width: `${Math.round(spotCleanPct[idx] * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {allCleaned && !pasteDone && (
              <div
                className="care-rub-pad"
                onPointerDown={(e) => {
                  sound.unlock();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  draggingRef.current = true;
                  lastPtRef.current = { x: e.clientX, y: e.clientY };
                }}
                onPointerMove={(e) => {
                  if (!draggingRef.current || !lastPtRef.current) return;
                  const step = Math.hypot(e.clientX - lastPtRef.current.x, e.clientY - lastPtRef.current.y);
                  lastPtRef.current = { x: e.clientX, y: e.clientY };
                  setPastePct((prev) => {
                    const next = Math.min(1, prev + Math.min(40, step) / 280);
                    if (Math.floor(next * 4) > Math.floor(prev * 4)) {
                      sound.playPrepStep('grind');
                    }
                    return next;
                  });
                }}
                onPointerUp={() => {
                  draggingRef.current = false;
                  lastPtRef.current = null;
                }}
              >
                <div className="gwm-icons">
                  <img src="./assets/ui/emblem_poultice.png?v=7" alt="" className="gwm-main" draggable={false} />
                  <img src={remedy.icon} alt="" className="gwm-sub" draggable={false} />
                </div>
                <div className="balm-track">
                  <div
                    className="balm-fill-bar"
                    style={{ width: `${Math.round(pastePct * 100)}%`, background: spec.pasteColor }}
                  />
                </div>
                <div className="gesture-motion-badge">↻ Rub Gently to Smooth Balm</div>
              </div>
            )}

            {pasteDone && !wrapped && (
              <div
                className="care-rub-pad"
                onPointerDown={(e) => {
                  sound.unlock();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  draggingRef.current = true;
                  swipedThisStrokeRef.current = false;
                  startPtRef.current = { x: e.clientX, y: e.clientY };
                }}
                onPointerMove={(e) => {
                  if (!draggingRef.current || swipedThisStrokeRef.current || !startPtRef.current) return;
                  const dist = Math.hypot(
                    e.clientX - startPtRef.current.x,
                    e.clientY - startPtRef.current.y
                  );
                  if (dist >= 48) {
                    swipedThisStrokeRef.current = true;
                    const next = wrapSwipes + 1;
                    if (next >= 2) {
                      sound.playCraftSuccess();
                    } else {
                      sound.playPrepStep('slice');
                    }
                    setWrapSwipes(next);
                  }
                }}
                onPointerUp={() => {
                  draggingRef.current = false;
                  startPtRef.current = null;
                }}
              >
                <div className="gwm-icons">
                  <img src="./assets/items/raw_linen.png?v=7" alt="" className="gwm-main" draggable={false} />
                </div>
                <div className="gesture-motion-badge">⇆ Swipe Across to Wrap Linen ({wrapSwipes}/2)</div>
              </div>
            )}

            {wrapped && (
              <div className="wrapped-success-stack">
                <div className="wrapped-success-banner">
                  <img src={remedy.icon} alt={remedy.name} />
                  <div>
                    <h3>{remedy.name}</h3>
                    <p>{villager.name} feels immediate relief!</p>
                  </div>
                </div>
                <button
                  className="graphic-coin-cta large-reward"
                  aria-label="Complete Care"
                  onClick={() => gameStore.completeQuest(quest.id)}
                >
                  <img src="./assets/ui/emblem_check.png?v=7" alt="" />
                  <img src="./assets/ui/icon_coin.png?v=7" alt="" />
                  <span>+{quest.rewardGold}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
