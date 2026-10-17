import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneCanvas } from './SceneCanvas';
import { SceneCharacterInstance, SceneManifest } from './types';
import { validateSceneManifest } from './validator';
import { defaultAssetRegistry, AssetRegistry } from '../assets/registry';
import { defaultCharacterPresets } from '../characters/presets';
import { CharacterDefinition } from '../characters/types';
import { defaultEnvironmentPresets } from '../environments/presets';
import { EnvironmentDefinition } from '../environments/types';
import { Camera25D, useCamera25D } from '../camera/Camera25D';
import { computeParallax } from '../camera/parallax';
import {
  computeBreathing,
  computeHeadTilt,
  resolveExpressionSchedule,
} from '../animation/primitives';
import { Character } from '../characters/Character';
import { Environment } from '../environments/Environment';
import { DriftingPetals } from '../effects/DriftingPetals';
import { RainEffect } from '../effects/RainEffect';

export interface SceneRendererProps {
  manifest?: SceneManifest;
  registry?: AssetRegistry;
  characterPresets?: Record<string, CharacterDefinition>;
  environmentPresets?: Record<string, EnvironmentDefinition>;
  showHud?: boolean;
}

const defaultFallbackManifest: SceneManifest = {
  id: 'empty-scene',
  name: 'Empty Scene',
  canvas: { width: 1920, height: 1080, fps: 30, durationInFrames: 120 },
};

/**
 * Renders an animated character instance placed in the scene.
 */
const RenderedSceneCharacter: React.FC<{
  instance: SceneCharacterInstance;
  charDef: CharacterDefinition;
  registry: AssetRegistry;
}> = ({ instance, charDef, registry }) => {
  const { camera, frame } = useCamera25D();
  const { fps } = useVideoConfig();

  const depth = instance.depth ?? 1.0;
  const parallax = computeParallax(camera, depth);

  const breathing = computeBreathing(frame, fps, instance.animation?.breathing);
  const headTilt = computeHeadTilt(frame, fps, instance.animation?.headTilt);

  const scheduledExpressions = instance.animation?.expressionSchedule
    ? resolveExpressionSchedule(frame, instance.animation.expressionSchedule)
    : {};

  const effectivePartOverrides: Record<string, string> = {
    ...(instance.partOverrides || {}),
    ...(scheduledExpressions.eyes ? { eyes: scheduledExpressions.eyes } : {}),
    ...(scheduledExpressions.mouth ? { mouth: scheduledExpressions.mouth } : {}),
  };

  const posX = instance.position.x + parallax.offsetX;
  const posY = instance.position.y + parallax.offsetY + breathing.offsetY;
  const scale = (instance.scale ?? 1.0) * parallax.scale;
  const rotation = (instance.rotation ?? 0) + headTilt;
  const zIndex = Math.round(depth * 100) + 10;

  return (
    <div
      id={`scene-char-${instance.id}`}
      style={{
        position: 'absolute',
        left: posX,
        top: posY,
        zIndex,
        transform: `scale(1, ${breathing.scaleY})`,
        transformOrigin: '0 0',
        pointerEvents: 'none',
      }}
    >
      <Character
        definition={charDef}
        variant={instance.variant}
        partOverrides={effectivePartOverrides}
        scale={scale}
        flipX={instance.flipX}
        rotation={rotation}
        opacity={instance.opacity}
        registry={registry}
      />
    </div>
  );
};

/**
 * Subtitles / dialog banner overlay for active lines.
 */
const SceneDialogOverlay: React.FC<{
  manifest: SceneManifest;
}> = ({ manifest }) => {
  const { frame } = useCamera25D();
  const dialogLines = manifest.dialog || [];

  const activeLines = dialogLines.filter(
    (line) => frame >= line.startFrame && frame <= line.endFrame
  );

  if (activeLines.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 50,
        left: 0,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        zIndex: 2000,
        pointerEvents: 'none',
      }}
    >
      {activeLines.map((line) => (
        <div
          key={line.id}
          style={{
            maxWidth: 1100,
            backgroundColor: 'rgba(11, 15, 25, 0.9)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: 14,
            padding: '16px 32px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7)',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {line.speaker && (
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: '#38bdf8',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginBottom: 4,
              }}
            >
              {line.speaker}
            </div>
          )}
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: '#f8fafc',
              lineHeight: 1.4,
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            }}
          >
            "{line.text}"
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * SceneRenderer interprets a declarative SceneManifest and renders
 * environments, characters, camera trajectories, and atmospheric effects.
 */
export const SceneRenderer: React.FC<SceneRendererProps> = ({
  manifest,
  registry = defaultAssetRegistry,
  characterPresets = defaultCharacterPresets,
  environmentPresets = defaultEnvironmentPresets,
}) => {
  const { width: contextWidth, height: contextHeight, durationInFrames: contextDuration } = useVideoConfig();
  const activeManifest = manifest ?? defaultFallbackManifest;

  // Validate manifest before rendering
  const validation = useMemo(() => {
    return validateSceneManifest(activeManifest, {
      registry,
      characterPresets,
      environmentPresets,
    });
  }, [activeManifest, registry, characterPresets, environmentPresets]);

  if (!validation.valid) {
    return (
      <SceneCanvas width={contextWidth} height={contextHeight} backgroundColor="#450a0a">
        <div
          style={{
            padding: 40,
            fontFamily: 'monospace',
            color: '#fecaca',
            backgroundColor: '#1c1917',
            margin: 40,
            borderRadius: 12,
            border: '2px solid #ef4444',
          }}
        >
          <h2 style={{ color: '#ef4444', marginTop: 0 }}>Scene Manifest Validation Failed</h2>
          <p>The provided SceneManifest has {validation.errors.length} validation errors:</p>
          <ul>
            {validation.errors.map((err, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                <strong>[{err.code}] {err.field}</strong>: {err.message}
                {err.suggestion && <div style={{ color: '#93c5fd' }}>💡 {err.suggestion}</div>}
              </li>
            ))}
          </ul>
        </div>
      </SceneCanvas>
    );
  }

  const width = activeManifest.canvas?.width ?? contextWidth;
  const height = activeManifest.canvas?.height ?? contextHeight;
  const duration = activeManifest.canvas?.durationInFrames ?? contextDuration;
  const backgroundColor = activeManifest.canvas?.backgroundColor ?? '#090d16';

  // Resolve environment definition
  const envDef: EnvironmentDefinition | undefined = activeManifest.environment?.preset
    ? environmentPresets[activeManifest.environment.preset]
    : activeManifest.environment?.custom;

  // Resolve camera config
  const cameraConfig = activeManifest.camera ?? { preset: 'static', focalDepth: 1.0 };

  return (
    <SceneCanvas width={width} height={height} backgroundColor={backgroundColor}>
      <Camera25D config={{ ...cameraConfig, durationInFrames: duration }}>
        {/* Modular Layered Environment */}
        {envDef && <Environment definition={envDef} registry={registry} />}

        {/* Placed Characters */}
        {activeManifest.characters &&
          activeManifest.characters.map((inst) => {
            const charDef = inst.characterId
              ? characterPresets[inst.characterId]
              : inst.customDefinition;
            if (!charDef) return null;

            return (
              <RenderedSceneCharacter
                key={inst.id}
                instance={inst}
                charDef={charDef}
                registry={registry}
              />
            );
          })}

        {/* Atmospheric Effects */}
        {activeManifest.effects &&
          activeManifest.effects.map((effect, idx) => {
            if (effect.type === 'petals') {
              return (
                <DriftingPetals
                  key={effect.id || `effect-${idx}`}
                  count={effect.count}
                  color={effect.color}
                  seed={effect.seed}
                  opacity={effect.opacity}
                  depth={effect.depth ?? 1.3}
                />
              );
            }
            if (effect.type === 'rain') {
              return (
                <RainEffect
                  key={effect.id || `effect-${idx}`}
                  count={effect.count}
                  speed={effect.speed}
                  angle={effect.angle}
                  opacity={effect.opacity}
                  depth={effect.depth ?? 1.4}
                />
              );
            }
            return null;
          })}

        {/* Dialog / Subtitles */}
        <SceneDialogOverlay manifest={activeManifest} />
      </Camera25D>
    </SceneCanvas>
  );
};
