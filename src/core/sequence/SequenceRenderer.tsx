import React, { useMemo } from 'react';
import { Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { SequenceManifest } from './types';
import { resolveActiveShot } from './resolver';
import { SceneRenderer } from '../scene/SceneRenderer';
import { defaultAssetRegistry, AssetRegistry } from '../assets/registry';

export interface SequenceRendererProps {
  manifest: SequenceManifest;
  registry?: AssetRegistry;
  showHud?: boolean;
}

export const SequenceRenderer: React.FC<SequenceRendererProps> = ({
  manifest,
  registry = defaultAssetRegistry,
  showHud = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const width = manifest.width ?? 1920;
  const height = manifest.height ?? 1080;

  // Compute accumulated shot start frames
  const shotSegments = useMemo(() => {
    let accumulated = 0;
    return manifest.shots.map((shot, idx) => {
      const start = accumulated;
      accumulated += shot.durationInFrames;
      return { shot, start, index: idx };
    });
  }, [manifest.shots]);

  const resolution = useMemo(() => {
    return resolveActiveShot(frame, manifest.shots);
  }, [frame, manifest.shots]);

  const compositing = manifest.compositing;

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        backgroundColor: '#000000',
        overflow: 'hidden',
      }}
    >
      {/* Shots Timeline */}
      {shotSegments.map(({ shot, start, index }) => (
        <Sequence
          key={shot.id || `shot-${index}`}
          from={start}
          durationInFrames={shot.durationInFrames}
        >
          <SceneRenderer manifest={shot.manifest} registry={registry} />
        </Sequence>
      ))}

      {/* Transition Overlay (Fade to Black / Dip to White) */}
      {resolution.transition && resolution.transition.overlayOpacity > 0 && (
        <div
          data-testid="sequence-transition-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor:
              resolution.transition.type === 'dip_to_white' ? '#ffffff' : '#000000',
            opacity: resolution.transition.overlayOpacity,
            zIndex: 2200,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Color Grade Atmosphere Overlay */}
      {compositing?.colorGrade && compositing.colorGrade !== 'none' && (
        <div
          data-testid="sequence-color-grade"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor:
              compositing.colorGrade === 'golden-hour'
                ? 'rgba(245, 158, 11, 0.08)'
                : compositing.colorGrade === 'anime-cool'
                ? 'rgba(56, 189, 248, 0.07)'
                : 'rgba(251, 146, 60, 0.07)',
            mixBlendMode: 'color',
            pointerEvents: 'none',
            zIndex: 2300,
          }}
        />
      )}

      {/* Cinematic Vignette Overlay */}
      {compositing?.vignette && (
        <div
          data-testid="sequence-vignette"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(10, 15, 30, 0.55) 100%)',
            pointerEvents: 'none',
            zIndex: 2400,
          }}
        />
      )}

      {/* Cinemascope 2.39:1 Letterbox Bars */}
      {compositing?.letterbox === 'cinemascope' && (
        <>
          <div
            data-testid="letterbox-top"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 138,
              backgroundColor: '#000000',
              zIndex: 2500,
              pointerEvents: 'none',
            }}
          />
          <div
            data-testid="letterbox-bottom"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: 138,
              backgroundColor: '#000000',
              zIndex: 2500,
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      {/* Sequence Telemetry HUD Overlay */}
      {showHud && (
        <div
          data-testid="sequence-telemetry-hud"
          style={{
            position: 'absolute',
            top: compositing?.letterbox === 'cinemascope' ? 150 : 36,
            left: 44,
            padding: '16px 24px',
            background: 'rgba(15, 23, 42, 0.90)',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            borderRadius: 12,
            color: '#f8fafc',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: 14,
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 3000,
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>
            CINEMATOGRAPHY SEQUENCE DIRECTOR
          </div>
          <div>
            Sequence Frame: {frame} / {resolution.totalDurationInFrames} ({(frame / fps).toFixed(2)}s)
          </div>
          <div>
            Active Shot: [{resolution.shotIndex + 1}/{manifest.shots.length}]{' '}
            <span style={{ color: '#facc15', fontWeight: 600 }}>
              {resolution.shot.name || resolution.shot.id}
            </span>
          </div>
          <div>
            Shot Frame: {resolution.localFrame} / {resolution.shot.durationInFrames}
          </div>
          {resolution.transition && (
            <div style={{ color: '#a7f3d0' }}>
              Transition: {resolution.transition.type.toUpperCase()} (
              {(resolution.transition.progress * 100).toFixed(0)}%)
            </div>
          )}
        </div>
      )}
    </div>
  );
};
