import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { useCamera25D } from '../camera/Camera25D';
import { computeParallax } from '../camera/parallax';

export interface DriftingPetalsProps {
  count?: number;
  color?: string;
  seed?: number;
  opacity?: number;
  depth?: number;
}

// Simple deterministic pseudorandom number generator (Mulberry32)
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * DriftingPetals renders deterministic floating sakura petals across the scene.
 * Dynamically reacts to 2.5D camera pan/tilt/zoom with depth-scaled parallax.
 */
export const DriftingPetals: React.FC<DriftingPetalsProps> = ({
  count = 35,
  color = '#fbcfe8',
  seed = 1337,
  opacity = 0.85,
  depth = 1.2,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { camera } = useCamera25D();
  const parallax = computeParallax(camera, depth);

  const rng = mulberry32(seed);

  // Generate deterministic particle configurations
  const particles = React.useMemo(() => {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        initialX: rng() * width,
        initialY: rng() * height,
        size: 8 + rng() * 10,
        speedX: 0.8 + rng() * 1.5,
        speedY: 1.2 + rng() * 2.0,
        swayFreq: 0.03 + rng() * 0.04,
        swayAmp: 15 + rng() * 25,
        rotationSpeed: 0.8 + rng() * 1.6,
        rotPhase: rng() * 360,
      });
    }
    return list;
  }, [count, width, height, seed]);

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
      {particles.map((p, idx) => {
        // Deterministic position calculation as a pure function of frame + camera parallax
        const wrapW = width + 100;
        const wrapH = height + 100;
        const rawX = p.initialX + frame * p.speedX + Math.sin(frame * p.swayFreq) * p.swayAmp + parallax.offsetX;
        const rawY = p.initialY + frame * p.speedY + parallax.offsetY;
        const x = (((rawX % wrapW) + wrapW) % wrapW) - 50;
        const y = (((rawY % wrapH) + wrapH) % wrapH) - 50;
        const rot = p.rotPhase + frame * p.rotationSpeed;

        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: p.size,
              height: p.size * 0.6,
              backgroundColor: color,
              borderRadius: '50% 10% 50% 10%',
              transform: `rotate(${rot}deg)`,
              opacity,
              boxShadow: '0 0 6px rgba(251, 207, 232, 0.4)',
            }}
          />
        );
      })}
    </div>
  );
};
