import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { useCamera25D } from '../camera/Camera25D';
import { computeParallax } from '../camera/parallax';

export interface RainEffectProps {
  count?: number;
  speed?: number;
  angle?: number; // degrees, default: -12
  opacity?: number;
  depth?: number;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * RainEffect renders deterministic directional rain streaks.
 * Dynamically reacts to 2.5D camera pan/tilt/zoom with depth-scaled parallax.
 */
export const RainEffect: React.FC<RainEffectProps> = ({
  count = 60,
  speed = 35,
  angle = -12,
  opacity = 0.45,
  depth = 1.4,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { camera } = useCamera25D();
  const parallax = computeParallax(camera, depth);

  const rng = mulberry32(999);

  const drops = React.useMemo(() => {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        x: rng() * (width + 400) - 200,
        y: rng() * height,
        len: 25 + rng() * 35,
        spd: speed * (0.85 + rng() * 0.3),
      });
    }
    return list;
  }, [count, width, height, speed]);

  const rad = (angle * Math.PI) / 180;
  const sinAngle = Math.sin(rad);
  const cosAngle = Math.cos(rad);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: Math.round(depth * 100),
      }}
    >
      <svg width={width} height={height} style={{ display: 'block' }}>
        {drops.map((drop, idx) => {
          const wrapH = height + 100;
          const rawY = drop.y + frame * drop.spd + parallax.offsetY;
          const currentY = (((rawY % wrapH) + wrapH) % wrapH) - 50;
          const currentX = drop.x + currentY * Math.tan(rad) + parallax.offsetX;

          return (
            <line
              key={idx}
              x1={currentX}
              y1={currentY}
              x2={currentX + sinAngle * drop.len}
              y2={currentY + cosAngle * drop.len}
              stroke="#93c5fd"
              strokeWidth={1.5}
              strokeOpacity={opacity}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </div>
  );
};
