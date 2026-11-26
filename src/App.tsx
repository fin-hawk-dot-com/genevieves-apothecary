import React, { useEffect, useState } from 'react';
import { PhaserCanvas } from './game/PhaserCanvas';
import { gameStore, useGameStore } from './state/gameStore';
import { ITEMS, QUESTS, TOOL_UPGRADES, VILLAGERS, ZONE_INFO } from './data/gameData';
import { PrepStationModal } from './components/PrepStationModal';
import { BrewingModal } from './components/BrewingModal';
import { ShopShelfModal } from './components/ShopShelfModal';
import { VillagerModal } from './components/VillagerModal';
import { CompendiumModal } from './components/CompendiumModal';
import { CareApplicationModal } from './components/CareApplicationModal';
import { RuneShopModal } from './components/RuneShopModal';
import { MainMenuModal } from './components/MainMenuModal';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { sound } from './audio/soundEngine';

const stopBgPointer = (e: React.SyntheticEvent) => {
  e.stopPropagation();
};

export const App: React.FC = () => {
  const state = useGameStore();
  const [muted, setMuted] = useState<boolean>(sound.isMuted());
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    document.title = `${ZONE_INFO[state.currentZone].name} — Genevieve's Apothecary`;
  }, [state.currentZone]);

  useEffect(() => {
    if (state.wardUntilMs <= Date.now()) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [state.wardUntilMs]);

  const pinnedQuest = QUESTS.find((q) => state.activeQuests.includes(q.id)) || null;
  const pinnedGiver = pinnedQuest ? VILLAGERS.find((v) => v.id === pinnedQuest.giverId) : null;
  const pinnedItem = pinnedQuest ? ITEMS[pinnedQuest.requiredItemId] : null;
  const pinnedHave = pinnedQuest ? state.inventory[pinnedQuest.requiredItemId] || 0 : 0;
  const pinnedReady = pinnedQuest ? pinnedHave >= pinnedQuest.requiredCount : false;

  const phaseGlyph =
    state.timePhase === 'Morning' ? '☀' : state.timePhase === 'Golden Afternoon' ? '◐' : '☾';

  const zoneMeta = ZONE_INFO[state.currentZone];
  const inFrontier = zoneMeta.dangerLevel > 0;
  const wardSecRemaining = Math.max(0, Math.ceil((state.wardUntilMs - nowMs) / 1000));

  const fieldPotionId = [
    'potion_starfall',
    'potion_warding',
    'potion_ginger',
    'potion_moonpetal',
    'potion_lavender',
    'potion_chamomile'
  ].find((pid) => (state.inventory[pid] || 0) > 0);

  const equippedTools = TOOL_UPGRADES.filter((t) => state.upgrades[t.id]);

  return (
    <div className="app-shell">
      <PhaserCanvas />

      {/* Top Pictorial Medallion HUD */}
      <header className="hud-top">
        <div
          className="hud-status-row"
          onPointerDown={stopBgPointer}
          onTouchStart={stopBgPointer}
          onMouseDown={stopBgPointer}
        >
          <button
            className="portrait-hud-btn"
            aria-label="Open Main Menu"
            onClick={() => gameStore.openModal('mainmenu')}
          >
            <img src="./assets/portraits/genevieve.png?v=8" alt="Genevieve" className="hud-avatar-lg" />
            <span className="day-orb">
              {phaseGlyph} {state.day}
            </span>
          </button>

          {pinnedQuest && pinnedItem && pinnedGiver && (
            <button
              className={`quest-pictorial-pill ${pinnedReady ? 'ready' : ''}`}
              aria-label={pinnedQuest.title}
              onClick={() => gameStore.openModal('quests')}
            >
              <img src={pinnedGiver.portrait} alt={pinnedGiver.name} className="qp-avatar" />
              <img src={pinnedItem.icon} alt={pinnedItem.name} className="qp-item" />
              <span className="qp-count">
                {pinnedHave}/{pinnedQuest.requiredCount}
              </span>
              {pinnedReady && <img src="./assets/ui/emblem_check.png?v=8" alt="" className="qp-check" />}
            </button>
          )}

          <div className="hud-right-Cluster">
            <button
              className="rune-pill"
              aria-label="Optional Quick-Advancement Runes"
              onClick={() => gameStore.openModal('runeshop')}
            >
              <img src="./assets/ui/icon_rune.png?v=8" alt="" className="hud-mini-icon" />
              <strong>{state.runes}</strong>
              <span className="rune-plus-dot">+</span>
            </button>

            <button
              className="gold-pill"
              aria-label="Gold & Shop Shelves"
              onClick={() => gameStore.openModal('shelf')}
            >
              <img src="./assets/ui/icon_coin.png?v=8" alt="" className="hud-mini-icon" />
              <strong>{state.gold}</strong>
            </button>

            <button
              className="graphic-icon-btn sound-medallion-btn"
              aria-label={muted ? 'Unmute Sound' : 'Mute Sound'}
              onClick={() => setMuted(sound.toggleMute())}
            >
              <img
                src={muted ? './assets/ui/btn_sound_off.png?v=8' : './assets/ui/btn_sound_on.png?v=8'}
                alt=""
              />
            </button>
          </div>
        </div>

        {/* Frontier Expedition Vitality & Potion Ward Bar (Shown in Dangerous Wild Regions!) */}
        {inFrontier && (
          <div
            className="frontier-vitality-bar"
            onPointerDown={stopBgPointer}
            onTouchStart={stopBgPointer}
            onMouseDown={stopBgPointer}
          >
            <div className="fvb-left">
              <div className="fvb-title-row">
                <strong className="fvb-zone-title">{zoneMeta.name}</strong>
                {equippedTools.length > 0 && (
                  <span className="fvb-tool-badges">
                    {equippedTools.map((t) => (
                      <img key={t.id} src={t.icon} alt={t.shortLabel} title={t.name} />
                    ))}
                  </span>
                )}
              </div>
              <div className="fvb-hearts" aria-label={`Vitality ${state.health} of ${state.maxHealth}`}>
                {Array.from({ length: state.maxHealth }).map((_, idx) => (
                  <img
                    key={idx}
                    src="./assets/ui/icon_heart.png?v=8"
                    alt=""
                    className={`fvb-heart ${idx < state.health ? 'on' : 'off'}`}
                  />
                ))}
                {wardSecRemaining > 0 && <span className="ward-shield-tag">✦ {wardSecRemaining}s</span>}
              </div>
            </div>

            <button
              className="quick-sip-medallion"
              aria-label="Sip Protective or Healing Potion"
              onClick={() => gameStore.sipFieldPotion()}
            >
              <img
                src={fieldPotionId ? ITEMS[fieldPotionId].icon : './assets/items/potion_warding.png?v=8'}
                alt=""
                style={{ opacity: fieldPotionId ? 1 : 0.45 }}
              />
            </button>
          </div>
        )}
      </header>

      {/* Floating Toast Feed */}
      <div className="toast-stack">
        {state.toasts.map((t) => (
          <div key={t.id} className="toast-pill" style={{ borderColor: t.accent }}>
            {t.icon && <img src={t.icon} alt="" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      {/* 4 Non-Teleporting Bottom Graphic Medallions: Inventory, Recipes, Quests, Main Menu */}
      <nav className="hud-bottom-dock four-menu-dock">
        <button
          className={`medallion-dock-btn ${state.activeModal === 'inventory' ? 'active' : ''}`}
          aria-label="Inventory Satchel"
          onPointerDown={stopBgPointer}
          onTouchStart={stopBgPointer}
          onMouseDown={stopBgPointer}
          onClick={() => gameStore.openModal('inventory')}
        >
          <img src="./assets/ui/btn_inventory.png?v=8" alt="" />
        </button>

        <button
          className={`medallion-dock-btn ${state.activeModal === 'recipes' ? 'active' : ''}`}
          aria-label="Recipe Menu"
          onPointerDown={stopBgPointer}
          onTouchStart={stopBgPointer}
          onMouseDown={stopBgPointer}
          onClick={() => gameStore.openModal('recipes')}
        >
          <img src="./assets/ui/btn_recipes.png?v=8" alt="" />
        </button>

        <button
          className={`medallion-dock-btn ${state.activeModal === 'quests' ? 'active' : ''}`}
          aria-label="Quest Tracker"
          onPointerDown={stopBgPointer}
          onTouchStart={stopBgPointer}
          onMouseDown={stopBgPointer}
          onClick={() => gameStore.openModal('quests')}
        >
          <img src="./assets/ui/btn_quests.png?v=8" alt="" />
          {pinnedReady && <span className="open-gem-dot" />}
        </button>

        <button
          className={`medallion-dock-btn ${state.activeModal === 'mainmenu' ? 'active' : ''}`}
          aria-label="Main Menu"
          onPointerDown={stopBgPointer}
          onTouchStart={stopBgPointer}
          onMouseDown={stopBgPointer}
          onClick={() => gameStore.openModal('mainmenu')}
        >
          <img src="./assets/ui/btn_menu.png?v=8" alt="" />
        </button>
      </nav>

      <WelcomeOverlay />
      {state.activeModal === 'prep' && <PrepStationModal />}
      {state.activeModal === 'cauldron' && <BrewingModal station="cauldron" />}
      {state.activeModal === 'poultice' && <BrewingModal station="poultice" />}
      {state.activeModal === 'shelf' && <ShopShelfModal />}
      {state.activeModal === 'inventory' && <CompendiumModal mode="inventory" />}
      {state.activeModal === 'recipes' && <CompendiumModal mode="recipes" />}
      {state.activeModal === 'quests' && <CompendiumModal mode="quests" />}
      {state.activeModal === 'mainmenu' && <MainMenuModal />}
      {state.activeModal === 'runeshop' && <RuneShopModal />}
      {state.talkingVillagerId && <VillagerModal />}
      {state.activeCareQuestId && <CareApplicationModal />}
    </div>
  );
};
