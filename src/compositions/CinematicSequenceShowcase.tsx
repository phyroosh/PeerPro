import React from 'react';
import { SequenceRenderer } from '../core/sequence/SequenceRenderer';
import { SequenceManifest } from '../core/sequence/types';
import { defaultAssetRegistry } from '../core/assets/registry';

export const cinematicSequenceManifest: SequenceManifest = {
  id: 'cinematic-sequence-showcase',
  name: 'PeerPro 3-Shot Cinematic Sequence',
  description: 'Multi-shot sequence demonstrating wide establishing, medium close-up with shallow DoF and handheld drift, and reaction shot with cinemascope letterboxing.',
  fps: 30,
  width: 1920,
  height: 1080,
  compositing: {
    vignette: true,
    letterbox: 'cinemascope',
    colorGrade: 'golden-hour',
  },
  shots: [
    // SHOT 1: Wide Establishing Shot (0-70 frames)
    {
      id: 'shot-01-wide-establishing',
      name: 'Wide Classroom Establishing',
      durationInFrames: 70,
      manifest: {
        id: 'scene-shot-01',
        name: 'Shot 1 Scene',
        canvas: { width: 1920, height: 1080, fps: 30, durationInFrames: 70 },
        camera: {
          preset: 'slow-push-in',
          intensity: 0.6,
          focalDepth: 1.0,
        },
        environment: {
          preset: 'japanese-classroom',
        },
        characters: [
          {
            id: 'teacher-ren',
            characterId: 'student-articulated',
            depth: 1.0,
            position: { x: 480, y: 890 },
            scale: 0.95,
            animation: {
              actions: [
                {
                  action: 'wave',
                  startFrame: 15,
                  durationInFrames: 50,
                  blendInFrames: 8,
                  blendOutFrames: 8,
                },
              ],
            },
          },
        ],
        dialog: [
          {
            id: 'd1',
            speaker: 'Ren',
            text: 'Welcome to multi-shot cinematography in PeerPro.',
            startFrame: 10,
            endFrame: 65,
          },
        ],
      },
    },

    // SHOT 2: Medium Close-Up Dialogue with Shallow DoF & Handheld Drift (70-140 frames)
    {
      id: 'shot-02-medium-dialogue',
      name: 'Medium Close-up with DoF',
      durationInFrames: 70,
      transition: {
        type: 'cut',
        durationInFrames: 1,
      },
      manifest: {
        id: 'scene-shot-02',
        name: 'Shot 2 Scene',
        canvas: { width: 1920, height: 1080, fps: 30, durationInFrames: 70 },
        camera: {
          preset: 'static',
          focalDepth: 1.0,
          depthOfField: {
            enabled: true,
            aperture: 1.6,
            focalDepth: 1.0,
            maxBlur: 5.5,
          },
          shake: {
            enabled: true,
            frequency: 0.4,
            amplitudeX: 2.2,
            amplitudeY: 1.4,
            rotational: 0.2,
          },
          atmosphericHaze: {
            enabled: true,
            minDepth: 0.5,
            density: 0.25,
            color: '#fef08a',
          },
        },
        environment: {
          preset: 'japanese-classroom',
        },
        characters: [
          {
            id: 'teacher-ren-closeup',
            characterId: 'student-articulated',
            depth: 1.0, // Exactly on focal depth -> crisp focus!
            position: { x: 960, y: 890 },
            scale: 1.15, // Closer camera framing
            animation: {
              actions: [
                {
                  action: 'talk',
                  startFrame: 5,
                  durationInFrames: 60,
                  blendInFrames: 8,
                  blendOutFrames: 8,
                },
              ],
            },
          },
        ],
        dialog: [
          {
            id: 'd2',
            speaker: 'Ren',
            text: 'Notice how optical depth-of-field gently blurs the blackboard background.',
            startFrame: 8,
            endFrame: 65,
          },
        ],
      },
    },

    // SHOT 3: Reverse Reaction Shot with Polite Bow (140-210 frames)
    {
      id: 'shot-03-bow-reaction',
      name: 'Respectful Bow Resolution',
      durationInFrames: 70,
      transition: {
        type: 'dissolve',
        durationInFrames: 12,
      },
      manifest: {
        id: 'scene-shot-03',
        name: 'Shot 3 Scene',
        canvas: { width: 1920, height: 1080, fps: 30, durationInFrames: 70 },
        camera: {
          preset: 'slow-pull-out',
          intensity: 0.5,
          focalDepth: 1.0,
        },
        environment: {
          preset: 'japanese-classroom',
        },
        characters: [
          {
            id: 'teacher-ren-bow',
            characterId: 'student-articulated',
            depth: 1.0,
            position: { x: 960, y: 890 },
            scale: 1.0,
            animation: {
              actions: [
                {
                  action: 'bow',
                  startFrame: 10,
                  durationInFrames: 50,
                  blendInFrames: 8,
                  blendOutFrames: 8,
                },
              ],
            },
          },
        ],
        dialog: [
          {
            id: 'd3',
            speaker: 'Ren',
            text: 'Seamless multi-shot storytelling without manual timeline slicing.',
            startFrame: 10,
            endFrame: 65,
          },
        ],
      },
    },
  ],
};

export const CinematicSequenceShowcase: React.FC = () => {
  return (
    <SequenceRenderer
      manifest={cinematicSequenceManifest}
      registry={defaultAssetRegistry}
      showHud={true}
    />
  );
};
