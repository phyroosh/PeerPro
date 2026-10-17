import { defaultAssetRegistry, AssetRegistry } from '../assets/registry';
import { defaultCharacterPresets } from '../characters/presets';
import { defaultEnvironmentPresets } from '../environments/presets';
import { CharacterDefinition, CharacterPoseName } from '../characters/types';
import { EnvironmentDefinition } from '../environments/types';
import { CharacterActionName, EasingType } from '../animation/types';
import {
  AgentDiscoveryData,
  AgentActionVocabularySummary,
  AgentCharacterPresetSummary,
  AgentEnvironmentPresetSummary,
} from './types';

const ACTION_VOCABULARY: AgentActionVocabularySummary[] = [
  {
    name: 'idle',
    description: 'Natural respiratory cycle (0.5 Hz), subtle weight shifting, and blinking posture',
    category: 'posture',
    defaultDurationInFrames: 90,
    supportsSecondaryLag: false,
    options: ['breathing', 'headTilt'],
  },
  {
    name: 'bow',
    description: 'Polite Japanese greeting bow with forward pitch foreshortening, vertical knee dip, and apex hold',
    category: 'greeting',
    defaultDurationInFrames: 60,
    supportsSecondaryLag: false,
    options: ['pitchDown (degrees)', 'kneeDip (px)', 'scaleYForeshortening', 'holdFrames'],
  },
  {
    name: 'wave',
    description: 'Harmonic forearm greeting wave with overshoot anticipation and friendly head tilt',
    category: 'gesture',
    defaultDurationInFrames: 45,
    supportsSecondaryLag: false,
    options: ['arm (left|right)', 'frequency (Hz)', 'amplitude (degrees)'],
  },
  {
    name: 'talk',
    description: 'Conversational arm gesturing with speech-cadenced micro-nods and subtle torso bobbing',
    category: 'gesture',
    defaultDurationInFrames: 60,
    supportsSecondaryLag: false,
    options: ['arm (left|right)', 'intensity', 'speechCadence'],
  },
  {
    name: 'point',
    description: 'Directive pointing gesture with arm extension, index aim, and holding posture',
    category: 'gesture',
    defaultDurationInFrames: 45,
    supportsSecondaryLag: false,
    options: ['arm (left|right)', 'targetAngle (degrees)'],
  },
  {
    name: 'nod',
    description: 'Affirmative head pitch nod with settle deceleration',
    category: 'reaction',
    defaultDurationInFrames: 30,
    supportsSecondaryLag: false,
    options: ['cycles', 'intensity'],
  },
  {
    name: 'shake_head',
    description: 'Subtle horizontal head oscillation expressing disagreement or disbelief',
    category: 'reaction',
    defaultDurationInFrames: 35,
    supportsSecondaryLag: false,
    options: ['cycles', 'intensity'],
  },
  {
    name: 'shrug',
    description: 'Upward shoulder/chest displacement, flared forearm angles, and puzzled posture',
    category: 'posture',
    defaultDurationInFrames: 45,
    supportsSecondaryLag: false,
    options: ['shoulderLift (px)', 'intensity'],
  },
  {
    name: 'think',
    description: 'Contemplative hand-to-chin pose with inquisitive head tilt',
    category: 'posture',
    defaultDurationInFrames: 60,
    supportsSecondaryLag: false,
    options: ['arm (left|right)', 'headTilt (degrees)'],
  },
  {
    name: 'surprise',
    description: 'Sudden vertical recoil hop, vertical squash-and-stretch, and wide eyes cue',
    category: 'reaction',
    defaultDurationInFrames: 30,
    supportsSecondaryLag: false,
    options: ['recoilDistance (px)', 'squashStretch'],
  },
  {
    name: 'walk_cycle',
    description: 'In-place rhythmic walking stride with alternating pendulum arm swings and vertical bobbing',
    category: 'locomotion',
    defaultDurationInFrames: 30,
    supportsSecondaryLag: false,
    options: ['frequency (Hz)', 'strideLength (px)', 'armSwing (degrees)'],
  },
];

const CHARACTER_POSES: CharacterPoseName[] = [
  'idle',
  'talk_gesture',
  'wave',
  'point',
  'thinking',
  'crossed',
];

const EASING_CURVES: EasingType[] = [
  'linear',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'ease-in-quad',
  'ease-out-quad',
  'ease-in-out-quad',
  'ease-in-cubic',
  'ease-out-cubic',
  'ease-in-out-cubic',
  'ease-out-back',
  'ease-in-out-sine',
];

export interface DiscoveryOptions {
  registry?: AssetRegistry;
  characterPresets?: Record<string, CharacterDefinition>;
  environmentPresets?: Record<string, EnvironmentDefinition>;
}

/**
 * Returns complete, structured capabilities and registry introspection for an AI agent.
 */
export function getAgentDiscoveryData(options: DiscoveryOptions = {}): AgentDiscoveryData {
  const registry = options.registry ?? defaultAssetRegistry;
  const characterPresets = options.characterPresets ?? defaultCharacterPresets;
  const environmentPresets = options.environmentPresets ?? defaultEnvironmentPresets;

  const charactersList: AgentCharacterPresetSummary[] = Object.entries(characterPresets).map(
    ([id, def]) => {
      const rootAsset = registry.has(def.rootPart.assetId) ? registry.get(def.rootPart.assetId) : null;
      return {
        id,
        name: def.name,
        styleFamily: def.styleFamily,
        angle: rootAsset?.style.angle || 'front',
        slots: Object.keys(def.slots),
        variants: def.variants ? ['default', ...Object.keys(def.variants)] : ['default'],
        availablePoses: CHARACTER_POSES,
      };
    }
  );

  const environmentsList: AgentEnvironmentPresetSummary[] = Object.entries(environmentPresets).map(
    ([id, def]) => {
      let floorY = 920;
      if (id.includes('classroom')) {
        floorY = 920;
      } else if (id.includes('street')) {
        floorY = 940;
      }

      return {
        id,
        name: def.name,
        description: def.description,
        roomGrammar: {
          floorY,
          wallBounds: { left: 100, right: 1820 },
          defaultDepth: 1.0,
        },
        layers: def.layers.map((l) => ({
          id: l.id,
          name: l.name,
          depth: l.depth,
          order: l.order,
          assetId: l.assetId,
        })),
      };
    }
  );

  return {
    version: '1.0.0',
    description: 'PeerPro AI-Agent Scene Composition Capabilities & Registry Introspection',
    assets: {
      total: registry.getAll().length,
      categories: registry.getCategories(),
      tags: registry.getTags(),
      list: registry.getAll().map((a) => ({
        id: a.id,
        name: a.name,
        kind: a.kind,
        category: a.category,
        angle: a.style.angle || 'front',
        styleFamily: a.style.family,
        dimensions: a.dimensions,
        attachmentSockets: a.attachmentSockets ? Object.keys(a.attachmentSockets) : [],
        requiredSockets: a.requiredSockets || [],
        capabilities: a.capabilities || [],
      })),
    },
    characters: {
      presets: charactersList,
      poses: CHARACTER_POSES,
    },
    environments: {
      presets: environmentsList,
    },
    animation: {
      actions: ACTION_VOCABULARY,
      easingCurves: EASING_CURVES,
    },
    camera: {
      presets: [
        { name: 'static', description: 'Fixed stationary viewport' },
        { name: 'slow-push-in', description: 'Gentle smooth zoom in' },
        { name: 'slow-pull-out', description: 'Gentle smooth zoom out' },
        { name: 'pan-left-to-right', description: 'Cinematic horizontal pan left to right' },
        { name: 'pan-right-to-left', description: 'Cinematic horizontal pan right to left' },
        { name: 'tilt-up', description: 'Vertical tilt from ground upward' },
        { name: 'tilt-down', description: 'Vertical tilt from sky downward' },
        { name: 'tracking', description: 'Dynamic compound camera tracking' },
        { name: 'custom', description: 'Custom frame-by-frame procedural movement' },
      ],
      defaultFocalDepth: 1.0,
      safetyLimits: {
        maxDisplacementX: 150,
        maxDisplacementY: 80,
        minZoom: 0.9,
        maxZoom: 1.25,
      },
      cinematography: {
        depthOfField: {
          minAperture: 0.1,
          maxAperture: 1.5,
          maxBlurCeiling: 25.0,
          description: 'Optical Gaussian bokeh proportional to |depth - focalDepth| * aperture * 10',
        },
        shake: {
          frequencies: ['0.05 Hz (slow drift)', '0.12 Hz (handheld)', '0.35 Hz (shivering)'],
          maxAmplitude: 20.0,
          description: 'Bounded multi-octave sinusoidal handheld camera drift and roll',
        },
        atmosphericHaze: {
          densityRange: [0.0, 1.0],
          description: 'Non-linear atmospheric sky tint for distant background layers (depth < 0.6)',
        },
      },
    },
    sequence: {
      transitions: ['cut', 'dissolve', 'fade_to_black', 'dip_to_white'],
      letterbox: ['none', 'cinemascope', 'standard'],
      colorGrades: ['none', 'anime-warm', 'anime-cool', 'golden-hour'],
    },
    audio: {
      trackTypes: ['bgm', 'ambient', 'sfx', 'voiceover'],
      supportsDucking: true,
      supportsLipSync: true,
      visemes: ['closed', 'open', 'half', 'wide', 'smile'],
    },
    sceneManifestTemplate: {
      $schema: '../schemas/scene-definition.schema.json',
      id: 'agent-directed-scene',
      name: 'Agent Directed Scene',
      canvas: { width: 1920, height: 1080, fps: 30, durationInFrames: 150 },
      camera: {
        preset: 'slow-push-in',
        intensity: 0.8,
        focalDepth: 1.0,
        depthOfField: { enabled: true, aperture: 0.7, maxBlur: 10.0 },
      },
      environment: { preset: 'japanese-classroom' },
      characters: [
        {
          id: 'ren',
          characterId: 'student-ren-v2',
          variant: 'default',
          depth: 1.0,
          position: { x: 960, y: 920 },
          scale: 1.0,
          animation: {
            breathing: { frequency: 0.5, amplitude: 3.5 },
            actions: [
              { action: 'bow', startFrame: 30, durationInFrames: 50, blendInFrames: 8, blendOutFrames: 10 },
              { action: 'wave', startFrame: 85, durationInFrames: 45, blendInFrames: 6, blendOutFrames: 8 },
            ],
          },
        },
      ],
      effects: [{ type: 'petals', count: 25, depth: 1.2 }],
      dialog: [
        { id: 'd1', speaker: 'Ren', text: 'Welcome to PeerPro!', startFrame: 30, endFrame: 120 },
      ],
    },
  };
}
