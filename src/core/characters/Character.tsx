import React, { useMemo } from 'react';
import { Img, staticFile } from 'remotion';
import { defaultAssetRegistry, AssetRegistry } from '../assets/registry';
import { CharacterProps } from './types';
import { solveCharacterParts } from './solver';

export interface ExtendedCharacterProps extends CharacterProps {
  registry?: AssetRegistry;
  partOverrides?: Record<string, string>;
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
