import React, { useMemo } from 'react';
import { Img, staticFile } from 'remotion';
import { defaultAssetRegistry, AssetRegistry } from '../assets/registry';
import { CharacterProps } from './types';
import { solveCharacterParts } from './solver';

export interface ExtendedCharacterProps extends CharacterProps {
  registry?: AssetRegistry;
  partOverrides?: Record<string, string>;
  showShadow?: boolean;
}

/**
 * Character Component renders a modular character composed of compatible parts
 * solved deterministically through socket attachment coordinates.
 */
export const Character: React.FC<ExtendedCharacterProps> = ({
  definition,
  variant,
  x = 0,
  y = 0,
  scale = 1.0,
  rotation = 0,
  opacity = 1.0,
  flipX = false,
  registry = defaultAssetRegistry,
  partOverrides,
  showShadow = true,
  style,
}) => {
  const parts = useMemo(() => {
    return solveCharacterParts(definition, registry, {
      variant,
      partOverrides,
    });
  }, [definition, registry, variant, partOverrides]);

  const baseScale = definition.defaultScale ?? 1.0;
  const finalScale = scale * baseScale;
  const flipMultiplier = flipX ? -1 : 1;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `scale(${finalScale * flipMultiplier}, ${finalScale}) rotate(${rotation}deg)`,
        transformOrigin: '0 0',
        opacity,
        pointerEvents: 'none',
        ...style,
      }}
    >
      {showShadow && (
        <div
          data-testid="character-ground-shadow"
          style={{
            position: 'absolute',
            left: -110,
            top: -18,
            width: 220,
            height: 36,
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.45) 0%, rgba(15, 23, 42, 0.15) 55%, rgba(15, 23, 42, 0) 75%)',
            zIndex: 0,
            transformOrigin: 'center center',
          }}
        />
      )}
      {parts.map((part) => (
        <div
          key={`${part.slot}-${part.asset.id}`}
          style={{
            position: 'absolute',
            left: part.x,
            top: part.y,
            width: part.width,
            height: part.height,
            zIndex: part.zIndex,
            transform: `scale(${part.scale}) rotate(${part.rotation}deg)`,
            transformOrigin: 'center center',
            opacity: part.opacity,
          }}
        >
          <Img
            src={staticFile(part.asset.path)}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
            alt={`${part.slot}: ${part.asset.name}`}
          />
        </div>
      ))}
    </div>
  );
};
