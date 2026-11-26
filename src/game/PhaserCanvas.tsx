import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { WorldScene } from './WorldScene';

export const PhaserCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const initW = el.clientWidth || window.innerWidth;
    const initH = el.clientHeight || window.innerHeight;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: el,
      backgroundColor: '#1a261f',
      input: {
        // Critical: bind pointer/touch listeners strictly to <canvas>, never window,
        // so React HUD buttons and modals never click through to move the character!
        windowEvents: false
      },
      scale: {
        mode: Phaser.Scale.NONE,
        width: initW,
        height: initH
      },
      render: {
        antialias: true,
        pixelArt: false,
        powerPreference: 'high-performance'
      },
      scene: [WorldScene]
    });

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(240, Math.round(entry.contentRect.width));
        const h = Math.max(320, Math.round(entry.contentRect.height));
        if (game.scale) {
          game.scale.resize(w, h);
        }
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      game.destroy(true);
    };
  }, []);

  return <div ref={containerRef} className="phaser-viewport" />;
};
