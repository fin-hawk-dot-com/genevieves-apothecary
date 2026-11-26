import React, { useState } from 'react';
import { QUESTS, SHOP_UPGRADES, TOOL_UPGRADES, ZONE_INFO } from '../data/gameData';
import { gameStore, useGameStore } from '../state/gameStore';
import { sound } from '../audio/soundEngine';

export const MainMenuModal: React.FC = () => {
  const state = useGameStore();
  const [muted, setMuted] = useState<boolean>(sound.isMuted());
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  const ownedUpgrades =
    SHOP_UPGRADES.filter((u) => state.upgrades[u.id]).length +
    TOOL_UPGRADES.filter((t) => state.upgrades[t.id]).length;
  const totalMilestones = SHOP_UPGRADES.length + TOOL_UPGRADES.length + QUESTS.length;
  const prosperityPct = Math.round(((ownedUpgrades + state.completedQuests.length) / totalMilestones) * 100);

  const zoneLabel = ZONE_INFO[state.currentZone].name;
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true);

  return (
    <div className="modal-backdrop" onClick={() => gameStore.closeAllModals()}>
      <div className="modal-sheet parchment-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-emblem">
            <img src="./assets/ui/btn_menu.png?v=7" alt="" className="header-station-emblem" />
            <div>
              <span className="eyebrow-tag">OUTSKIRTS OF WILLOWMERE</span>
              <h2>Genevieve’s Apothecary</h2>
            </div>
          </div>
          <button
            className="wax-close-btn"
            aria-label="Resume Game"
            onClick={() => gameStore.closeAllModals()}
          >
            <img src="./assets/ui/emblem_close.png?v=7" alt="" />
          </button>
        </div>

        {/* Save Summary Card */}
        <div className="menu-save-card">
          <img src="./assets/ui/title_hero.png?v=7" alt="" className="menu-cover-thumb" />
          <div className="menu-save-meta">
            <strong>
              Day {state.day} • {state.timePhase}
            </strong>
            <span>Location: {zoneLabel}</span>
            <span>
              Flourishing: {prosperityPct}% • Quests: {state.completedQuests.length}/{QUESTS.length}
            </span>
          </div>
        </div>

        {/* Walking World Connection Guide */}
        <div className="menu-world-guide">
          <span className="eyebrow-tag">9 INTERCONNECTED REGIONS & INNER SANCTUMS</span>
          <p>
            <strong>Outskirts Homestead:</strong> Cottage Door (North), Brook Bridge ➔{' '}
            <strong>Thornveil Deepwood</strong> (SW), Village Road (East).
            <br />
            <strong>Willowmere Square:</strong> <strong>Frostpeak Crags</strong> (North),{' '}
            <strong>Thornveil Deepwood</strong> (East), <strong>Sunken Mistfen Bog</strong> (South).
            <br />
            <strong>Inner Sanctums:</strong> Deepwood NE Arch ➔ <strong>Hollowroot Druid Grove</strong> • Mistfen SE
            Ruins ➔ <strong>Standing-Stone Sanctum</strong> • Frostpeak Cavern ➔{' '}
            <strong>Starfall Crystal Grotto</strong>.
          </p>
        </div>

        {/* Quick Controls */}
        <div className="menu-controls-list">
          <div className="upgrade-row">
            <img
              src={muted ? './assets/ui/btn_sound_off.png?v=7' : './assets/ui/btn_sound_on.png?v=7'}
              alt=""
            />
            <div className="upgrade-info">
              <strong>Acoustic Music & Sound Effects</strong>
              <span>{muted ? 'Currently Muted' : 'Playing Gentle Apothecary Audio'}</span>
            </div>
            <button
              className="graphic-coin-cta"
              onClick={() => setMuted(sound.toggleMute())}
            >
              <span>{muted ? 'Unmute' : 'Mute'}</span>
            </button>
          </div>

          {isIOS && !isStandalone && (
            <div className="upgrade-row">
              <img src="./assets/ui/apple_touch_icon.png" alt="" style={{ borderRadius: 10 }} />
              <div className="upgrade-info">
                <strong>Install to Genevieve’s iPhone Home Screen</strong>
                <span>Tap Safari’s Share button (↑) ➔ “Add to Home Screen” for full-screen offline play.</span>
              </div>
            </div>
          )}

          <div className="upgrade-row">
            <img src="./assets/ui/emblem_sleep.png?v=7" alt="" />
            <div className="upgrade-info">
              <strong>Auto-Save Active</strong>
              <span>Progress saves automatically on your device after every action.</span>
            </div>
            <img src="./assets/ui/emblem_check.png?v=7" alt="" className="owned-check-lg" />
          </div>

          <div className="upgrade-row">
            <img src="./assets/ui/icon_rune.png?v=7" alt="" />
            <div className="upgrade-info">
              <strong>Optional Quick-Advancement Vault</strong>
              <span>Optional time-savers only—all recipes & herbs are free in-world.</span>
            </div>
            <button
              className="graphic-rune-cta"
              onClick={() => gameStore.openModal('runeshop')}
            >
              <img src="./assets/ui/icon_rune.png?v=7" alt="" />
              <span>{state.runes}</span>
            </button>
          </div>
        </div>

        <div className="menu-footer-actions">
          {!confirmReset ? (
            <button className="menu-reset-link" onClick={() => setConfirmReset(true)}>
              Start a Fresh New Journey…
            </button>
          ) : (
            <div className="menu-reset-confirm">
              <span>Reset save to Day 1 Morning?</span>
              <button
                className="graphic-coin-cta"
                onClick={() => {
                  gameStore.resetGameSave();
                  setConfirmReset(false);
                }}
              >
                <span>Confirm Reset</span>
              </button>
              <button className="menu-reset-link" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
