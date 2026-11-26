import React, { useEffect, useRef, useState } from 'react';
import { sound } from '../audio/soundEngine';

/* ============================================================================
   1. MORTAR & PESTLE — CIRCULAR TOUCH-MOTION GRINDING STAGE (`method === 'grind'`)
   ============================================================================ */
interface MortarProps {
  rawIcon: string;
  outIcon: string;
  rawName: string;
  outName: string;
  onComplete: () => void;
}

export const MortarGrindStage: React.FC<MortarProps> = ({
  rawIcon,
  outIcon,
  rawName,
  outName,
  onComplete
}) => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<boolean>(false);
  const lastAngleRef = useRef<number | null>(null);
  const accumRadRef = useRef<number>(0);
  const soundMilestoneRef = useRef<number>(0);

  const [progress, setProgress] = useState<number>(0);
  const [pestleOffset, setPestleOffset] = useState<{ x: number; y: number; rot: number }>({
    x: 24,
    y: -18,
    rot: 12
  });
  const [activeDrag, setActiveDrag] = useState<boolean>(false);

  // 2.4 full circular revolutions = cozy, tactile ~2.5s circular grind
  const TARGET_RADIANS = Math.PI * 2 * 2.4;

  const updateFromPointer = (clientX: number, clientY: number, isStart: boolean) => {
    const el = padRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);

    const clampR = Math.min(46, Math.max(14, dist * 0.62));
    const angle = Math.atan2(dy, dx);
    setPestleOffset({
      x: Math.cos(angle) * clampR,
      y: Math.sin(angle) * clampR,
      rot: Math.cos(angle) * 18
    });

    if (isStart) {
      lastAngleRef.current = dist >= 10 ? angle : null;
      return;
    }

    if (dist < 12) return;
    if (lastAngleRef.current !== null) {
      const delta = Math.atan2(
        Math.sin(angle - lastAngleRef.current),
        Math.cos(angle - lastAngleRef.current)
      );
      const absDelta = Math.abs(delta);
      // Ignore sudden teleports > 135 deg
      if (absDelta < 2.35) {
        accumRadRef.current += absDelta;
        if (accumRadRef.current - soundMilestoneRef.current >= 1.15) {
          soundMilestoneRef.current = accumRadRef.current;
          sound.playPrepStep('grind');
        }
        const pct = Math.min(1, accumRadRef.current / TARGET_RADIANS);
        setProgress(pct);

        if (accumRadRef.current >= TARGET_RADIANS) {
          accumRadRef.current = 0;
          soundMilestoneRef.current = 0;
          lastAngleRef.current = angle;
          setProgress(0);
          onComplete();
          return;
        }
      }
    }
    lastAngleRef.current = angle;
  };

  const radius = 88;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="gesture-stage-wrap">
      <div
        ref={padRef}
        className={`gesture-mortar-pad ${activeDrag ? 'dragging' : ''}`}
        onPointerDown={(e) => {
          sound.unlock();
          e.currentTarget.setPointerCapture(e.pointerId);
          draggingRef.current = true;
          setActiveDrag(true);
          updateFromPointer(e.clientX, e.clientY, true);
        }}
        onPointerMove={(e) => {
          if (!draggingRef.current) return;
          updateFromPointer(e.clientX, e.clientY, false);
        }}
        onPointerUp={() => {
          draggingRef.current = false;
          lastAngleRef.current = null;
          setActiveDrag(false);
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
          lastAngleRef.current = null;
          setActiveDrag(false);
        }}
      >
        <svg className="gesture-ring-svg" viewBox="0 0 210 210">
          <circle cx="105" cy="105" r={radius} className="gesture-ring-track" />
          <circle
            cx="105"
            cy="105"
            r={radius}
            className="gesture-ring-fill"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </svg>

        <img src="./assets/ui/stage_mortar_bowl.png?v=7" alt="" className="mortar-bowl-bg" draggable={false} />

        {/* Raw herb morphing smoothly into crushed paste/powder */}
        <img
          src={rawIcon}
          alt={rawName}
          className="mortar-inner-herb"
          draggable={false}
          style={{
            opacity: Math.max(0.15, 1 - progress * 0.9),
            transform: `scale(${1 - progress * 0.35}) rotate(${progress * 140}deg)`
          }}
        />
        {progress > 0.25 && (
          <img
            src={outIcon}
            alt={outName}
            className="mortar-inner-result"
            draggable={false}
            style={{
              opacity: Math.min(0.95, (progress - 0.2) * 1.25),
              transform: `scale(${0.55 + progress * 0.45})`
            }}
          />
        )}

        <img
          src="./assets/ui/tool_pestle.png?v=7"
          alt=""
          className="mortar-pestle-sprite"
          draggable={false}
          style={{
            transform: `translate(${pestleOffset.x}px, ${pestleOffset.y}px) rotate(${pestleOffset.rot}deg)`
          }}
        />

        <div className="gesture-motion-badge">↻ Swirl Pestle in Circles ({Math.round(progress * 100)}%)</div>
      </div>
    </div>
  );
};

/* ============================================================================
   2. CUTTING BOARD — SWIPE SLICING MOTION STAGE (`method === 'slice'`)
   ============================================================================ */
interface SliceProps {
  rawIcon: string;
  rawName: string;
  stepsRequired: number;
  onComplete: () => void;
}

export const CuttingSliceStage: React.FC<SliceProps> = ({
  rawIcon,
  rawName,
  stepsRequired,
  onComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokePtsRef = useRef<{ x: number; y: number }[]>([]);
  const draggingRef = useRef<boolean>(false);
  const slicedThisStrokeRef = useRef<boolean>(false);
  const [cuts, setCuts] = useState<number>(0);
  const [chopAnim, setChopAnim] = useState<boolean>(false);

  useEffect(() => {
    setCuts(0);
  }, [rawIcon]);

  const drawTrail = (pts: { x: number; y: number }[]) => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    if (pts.length < 2) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255, 245, 196, 0.92)';
    ctx.shadowColor = 'rgba(255, 200, 88, 0.85)';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
  };

  const toLocal = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 280,
      y: ((e.clientY - r.top) / r.height) * 185
    };
  };

  return (
    <div className="gesture-stage-wrap">
      <div
        className={`gesture-cutting-board ${chopAnim ? 'chop' : ''}`}
        onPointerDown={(e) => {
          sound.unlock();
          e.currentTarget.setPointerCapture(e.pointerId);
          draggingRef.current = true;
          slicedThisStrokeRef.current = false;
          const pt = toLocal(e);
          strokePtsRef.current = [pt];
          drawTrail(strokePtsRef.current);
        }}
        onPointerMove={(e) => {
          if (!draggingRef.current) return;
          const pt = toLocal(e);
          strokePtsRef.current.push(pt);
          if (strokePtsRef.current.length > 14) strokePtsRef.current.shift();
          drawTrail(strokePtsRef.current);

          if (!slicedThisStrokeRef.current && strokePtsRef.current.length >= 2) {
            const first = strokePtsRef.current[0];
            const dist = Math.hypot(pt.x - first.x, pt.y - first.y);
            // Must cross through central herb region
            const nearCenter = pt.x > 65 && pt.x < 215 && pt.y > 32 && pt.y < 155;
            if (dist >= 46 && nearCenter) {
              slicedThisStrokeRef.current = true;
              sound.playPrepStep('slice');
              setChopAnim(true);
              window.setTimeout(() => setChopAnim(false), 160);

              const next = cuts + 1;
              if (next >= stepsRequired) {
                setCuts(0);
                onComplete();
              } else {
                setCuts(next);
              }
            }
          }
        }}
        onPointerUp={() => {
          draggingRef.current = false;
          strokePtsRef.current = [];
          drawTrail([]);
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
          strokePtsRef.current = [];
          drawTrail([]);
        }}
      >
        <div className="slice-guide-overlay">
          {Array.from({ length: stepsRequired }).map((_, idx) => (
            <span key={idx} className={`slice-cut-line ${idx < cuts ? 'cut-done' : ''}`} />
          ))}
        </div>

        <img src={rawIcon} alt={rawName} className="board-herb-sprite" draggable={false} />
        <canvas ref={canvasRef} width={280} height={185} className="slice-slash-canvas" />

        <div className="gesture-motion-badge">
          ⌿ Swipe Across Herb to Slice ({cuts}/{stepsRequired})
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   3. COPPER ALEMBIC STILL — BELLOWS FANNING STROKE STAGE (`method === 'distill'`)
   ============================================================================ */
interface DistillProps {
  rawIcon: string;
  outIcon: string;
  onComplete: () => void;
}

export const AlembicDistillStage: React.FC<DistillProps> = ({ rawIcon, outIcon, onComplete }) => {
  const draggingRef = useRef<boolean>(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const distAccumRef = useRef<number>(0);
  const soundMilestoneRef = useRef<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [flameGlow, setFlameGlow] = useState<boolean>(false);

  const TARGET_STROKE_PX = 380;

  return (
    <div className="gesture-stage-wrap">
      <div
        className={`gesture-alembic-pad ${flameGlow ? 'stoking' : ''}`}
        onPointerDown={(e) => {
          sound.unlock();
          e.currentTarget.setPointerCapture(e.pointerId);
          draggingRef.current = true;
          lastPtRef.current = { x: e.clientX, y: e.clientY };
          setFlameGlow(true);
        }}
        onPointerMove={(e) => {
          if (!draggingRef.current || !lastPtRef.current) return;
          const step = Math.hypot(e.clientX - lastPtRef.current.x, e.clientY - lastPtRef.current.y);
          lastPtRef.current = { x: e.clientX, y: e.clientY };
          if (step > 85) return;

          distAccumRef.current += step;
          if (distAccumRef.current - soundMilestoneRef.current >= 105) {
            soundMilestoneRef.current = distAccumRef.current;
            sound.playPrepStep('distill');
          }

          const pct = Math.min(1, distAccumRef.current / TARGET_STROKE_PX);
          setProgress(pct);

          if (distAccumRef.current >= TARGET_STROKE_PX) {
            distAccumRef.current = 0;
            soundMilestoneRef.current = 0;
            setProgress(0);
            onComplete();
          }
        }}
        onPointerUp={() => {
          draggingRef.current = false;
          lastPtRef.current = null;
          setFlameGlow(false);
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
          lastPtRef.current = null;
          setFlameGlow(false);
        }}
      >
        <div className="alembic-visual-row">
          <img src={rawIcon} alt="" className="alembic-side-icon" draggable={false} />
          <div className="alembic-coil-track">
            <div className="alembic-vapor-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <img
            src={outIcon}
            alt=""
            className="alembic-side-icon"
            draggable={false}
            style={{ transform: `scale(${0.88 + progress * 0.22})` }}
          />
        </div>

        <div className="gesture-motion-badge">
          ⇅ Stroke Up & Down to Fan Alembic Flame ({Math.round(progress * 100)}%)
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   4. CAULDRON CIRCULAR LADLE STIRRING STAGE (`station === 'cauldron'`)
   ============================================================================ */
interface CauldronStirProps {
  brewColor: string;
  outIcon: string;
  onComplete: () => void;
}

export const CauldronStirStage: React.FC<CauldronStirProps> = ({
  brewColor,
  outIcon,
  onComplete
}) => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<boolean>(false);
  const lastAngleRef = useRef<number | null>(null);
  const accumRadRef = useRef<number>(0);
  const soundMilestoneRef = useRef<number>(0);

  const [progress, setProgress] = useState<number>(0);
  const [ladlePos, setLadlePos] = useState<{ x: number; y: number; rot: number }>({
    x: 26,
    y: -16,
    rot: 10
  });
  const [vortexDeg, setVortexDeg] = useState<number>(0);

  const TARGET_RADIANS = Math.PI * 2 * 2.5;

  const handlePointer = (clientX: number, clientY: number, isStart: boolean) => {
    const el = padRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);

    const r = Math.min(48, Math.max(14, dist * 0.62));
    const angle = Math.atan2(dy, dx);
    setLadlePos({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      rot: Math.sin(angle) * 16
    });

    if (isStart) {
      lastAngleRef.current = dist >= 10 ? angle : null;
      return;
    }

    if (dist < 12) return;
    if (lastAngleRef.current !== null) {
      const delta = Math.atan2(
        Math.sin(angle - lastAngleRef.current),
        Math.cos(angle - lastAngleRef.current)
      );
      const absDelta = Math.abs(delta);
      if (absDelta < 2.35) {
        accumRadRef.current += absDelta;
        setVortexDeg((d) => d + (delta * 180) / Math.PI);
        if (accumRadRef.current - soundMilestoneRef.current >= 1.2) {
          soundMilestoneRef.current = accumRadRef.current;
          sound.playPrepStep('distill');
        }
        const pct = Math.min(1, accumRadRef.current / TARGET_RADIANS);
        setProgress(pct);

        if (accumRadRef.current >= TARGET_RADIANS) {
          accumRadRef.current = 0;
          soundMilestoneRef.current = 0;
          setProgress(0);
          onComplete();
          return;
        }
      }
    }
    lastAngleRef.current = angle;
  };

  const radius = 90;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="gesture-stage-wrap">
      <div
        ref={padRef}
        className="gesture-cauldron-pad"
        style={{ '--brew-color': brewColor } as React.CSSProperties}
        onPointerDown={(e) => {
          sound.unlock();
          e.currentTarget.setPointerCapture(e.pointerId);
          draggingRef.current = true;
          handlePointer(e.clientX, e.clientY, true);
        }}
        onPointerMove={(e) => {
          if (!draggingRef.current) return;
          handlePointer(e.clientX, e.clientY, false);
        }}
        onPointerUp={() => {
          draggingRef.current = false;
          lastAngleRef.current = null;
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
          lastAngleRef.current = null;
        }}
      >
        <svg className="gesture-ring-svg" viewBox="0 0 210 210">
          <circle cx="105" cy="105" r={radius} className="gesture-ring-track" />
          <circle
            cx="105"
            cy="105"
            r={radius}
            className="gesture-ring-fill"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </svg>

        <img
          src="./assets/ui/stage_cauldron_top.png?v=7"
          alt=""
          className="cauldron-top-bg"
          draggable={false}
        />

        <div
          className="cauldron-vortex-tint"
          style={{
            background: `radial-gradient(circle, ${brewColor}cc 0%, ${brewColor}44 52%, transparent 72%)`,
            transform: `rotate(${vortexDeg}deg)`
          }}
        />

        {progress > 0.35 && (
          <img
            src={outIcon}
            alt=""
            className="mortar-inner-result"
            draggable={false}
            style={{
              opacity: (progress - 0.3) * 1.2,
              transform: `scale(${0.6 + progress * 0.4})`
            }}
          />
        )}

        <img
          src="./assets/ui/tool_ladle.png?v=7"
          alt=""
          className="mortar-pestle-sprite"
          draggable={false}
          style={{
            transform: `translate(${ladlePos.x}px, ${ladlePos.y}px) rotate(${ladlePos.rot}deg)`
          }}
        />

        <div className="gesture-motion-badge">↻ Stir Cauldron in Circles ({Math.round(progress * 100)}%)</div>
      </div>
    </div>
  );
};

/* ============================================================================
   5. POULTICE RUB-BALM & FOLD-LINEN STAGE (`station === 'poultice'`)
   ============================================================================ */
interface PoulticeFoldProps {
  brewColor: string;
  outIcon: string;
  onComplete: () => void;
}

export const PoulticeFoldStage: React.FC<PoulticeFoldProps> = ({
  brewColor,
  outIcon,
  onComplete
}) => {
  const draggingRef = useRef<boolean>(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const startPtRef = useRef<{ x: number; y: number } | null>(null);
  const foldedThisSwipeRef = useRef<boolean>(false);
  const spreadPxRef = useRef<number>(0);

  const [spreadPct, setSpreadPct] = useState<number>(0);
  const [folds, setFolds] = useState<number>(0);

  const SPREAD_TARGET = 280;

  return (
    <div className="gesture-stage-wrap">
      <div
        className="gesture-poultice-cloth"
        onPointerDown={(e) => {
          sound.unlock();
          e.currentTarget.setPointerCapture(e.pointerId);
          draggingRef.current = true;
          foldedThisSwipeRef.current = false;
          const pt = { x: e.clientX, y: e.clientY };
          lastPtRef.current = pt;
          startPtRef.current = pt;
        }}
        onPointerMove={(e) => {
          if (!draggingRef.current || !lastPtRef.current) return;
          const cur = { x: e.clientX, y: e.clientY };
          const step = Math.hypot(cur.x - lastPtRef.current.x, cur.y - lastPtRef.current.y);
          lastPtRef.current = cur;

          if (spreadPct < 1) {
            spreadPxRef.current += Math.min(45, step);
            const nextPct = Math.min(1, spreadPxRef.current / SPREAD_TARGET);
            if (Math.floor(nextPct * 4) > Math.floor(spreadPct * 4)) {
              sound.playPrepStep('grind');
            }
            setSpreadPct(nextPct);
          } else if (!foldedThisSwipeRef.current && startPtRef.current) {
            const swipeDist = Math.hypot(cur.x - startPtRef.current.x, cur.y - startPtRef.current.y);
            if (swipeDist >= 48) {
              foldedThisSwipeRef.current = true;
              sound.playPrepStep('slice');
              const nextFolds = folds + 1;
              if (nextFolds >= 2) {
                spreadPxRef.current = 0;
                setSpreadPct(0);
                setFolds(0);
                onComplete();
              } else {
                setFolds(nextFolds);
              }
            }
          }
        }}
        onPointerUp={() => {
          draggingRef.current = false;
          lastPtRef.current = null;
          startPtRef.current = null;
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
          lastPtRef.current = null;
          startPtRef.current = null;
        }}
      >
        <div className="linen-weave-sheet">
          <div
            className="linen-balm-layer"
            style={{
              background: brewColor,
              opacity: spreadPct * 0.78,
              transform: `scale(${0.35 + spreadPct * 0.65})`
            }}
          />
          {folds >= 1 && <div className="linen-flap left-folded" />}
          <img
            src={spreadPct < 1 ? './assets/items/raw_linen.png?v=7' : outIcon}
            alt=""
            className="poultice-stage-center-icon"
            draggable={false}
          />
        </div>

        <div className="gesture-motion-badge">
          {spreadPct < 1
            ? `⇆ Rub Across Linen to Spread Balm (${Math.round(spreadPct * 100)}%)`
            : `➔ Swipe Inward to Fold & Tie (${folds}/2)`}
        </div>
      </div>
    </div>
  );
};
