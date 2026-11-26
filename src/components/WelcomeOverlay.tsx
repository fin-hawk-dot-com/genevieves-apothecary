import React from 'react';
import { gameStore, useGameStore } from '../state/gameStore';

export const WelcomeOverlay: React.FC = () => {
  const state = useGameStore();
  if (state.seenIntro) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;

  return (
    <div className="modal-backdrop welcome-screen">
      <div className="welcome-card parchment-panel">
        <div className="welcome-hero-stack">
          <img src="./assets/ui/title_hero.png?v=7" alt="Genevieve's Apothecary" className="welcome-hero-img" />
          <img src="./assets/portraits/genevieve.png?v=7" alt="Genevieve" className="welcome-avatar-badge" />
        </div>
        <span className="eyebrow-tag">OUTSKIRTS OF WILLOWMERE</span>
        <h1>Genevieve’s Apothecary</h1>
        <p className="welcome-letter">
          Welcome home, <strong>Genevieve</strong>! Your sunlit shingled cottage on the edge of Willowmere awaits—with a
          stone-hearth alchemy workshop, a cozy quilted bedroom, and sleepy little <strong>Nutmeg</strong> curled by the fire.
        </p>

        <div className="welcome-icon-trio">
          <div className="wi-cell">
            <img src="./assets/ui/btn_meadow.png?v=7" alt="" />
          </div>
          <div className="wi-cell">
            <img src="./assets/ui/emblem_cauldron.png?v=7" alt="" />
          </div>
          <div className="wi-cell">
            <img src="./assets/ui/emblem_poultice.png?v=7" alt="" />
          </div>
          <div className="wi-cell">
            <img src="./assets/ui/btn_shelves.png?v=7" alt="" />
          </div>
        </div>

        {isIOS && !isStandalone && (
          <div className="ios-pwa-tip">
            <strong>iPhone Fullscreen:</strong> Tap Safari’s <strong>Share</strong> icon ➔ <strong>Add to Home Screen</strong>.
          </div>
        )}

        <div className="welcome-enter-wrap">
          <button
            className="graphic-enter-seal-btn"
            aria-label="Enter Apothecary"
            onClick={() => gameStore.dismissIntro()}
          >
            <img src="./assets/ui/btn_shop.png?v=7" alt="" className="enter-main-medallion" />
            <img src="./assets/ui/emblem_door.png?v=7" alt="" className="enter-sub-boot" />
          </button>
        </div>
      </div>
    </div>
  );
};
