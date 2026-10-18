import {
  CameraConfig,
  CameraPresetName,
} from '../camera/types';
import {
  DepthEmphasis,
  EmotionalTone,
  FramingSolution,
  ScreenRegion,
  ShotIntentSpec,
  ShotIntentType,
} from './types';

/**
 * Resolves screen X coordinate from semantic screen region.
 */
export function resolveScreenRegionX(
  region: ScreenRegion,
  canvasWidth: number
): number {
  switch (region) {
    case 'rule_of_thirds_left':
      return Math.round(canvasWidth * (1 / 3)); // ~640px in 1080p
    case 'rule_of_thirds_right':
      return Math.round(canvasWidth * (2 / 3)); // ~1280px in 1080p
    case 'edge_left':
      return Math.round(canvasWidth * 0.18); // ~345px
    case 'edge_right':
      return Math.round(canvasWidth * 0.82); // ~1575px
    case 'center':
    default:
      return Math.round(canvasWidth * 0.5); // ~960px
  }
}

/**
 * Pure mathematical solver that converts high-level ShotIntentSpec
 * into a concrete FramingSolution (camera config, character staging, DoF, telemetry).
 */
export function resolveCinematicIntent(
  spec: ShotIntentSpec,
  canvasWidth = 1920,
  canvasHeight = 1080
): FramingSolution {
  const intent = spec.intent;
  const overrides = spec.overrides ?? {};

  // 1. Baseline Scaling & Depth by Shot Intent
  let baseScale = 1.0;
  let baseDepth = 1.0;
  let defaultZoom = 1.0;
  let defaultPreset: CameraPresetName = 'static';
  let defaultCameraIntensity = 0.5;

  switch (intent) {
    case 'establishing':
      baseScale = 0.65;
      baseDepth = 1.1;
      defaultZoom = 0.95;
      defaultPreset = 'slow-push-in';
      defaultCameraIntensity = 0.35;
      break;

    case 'wide':
      baseScale = 0.85;
      baseDepth = 1.0;
      defaultZoom = 1.0;
      defaultPreset = 'slow-push-in';
      defaultCameraIntensity = 0.45;
      break;

    case 'medium':
      baseScale = 1.15;
      baseDepth = 0.95;
      defaultZoom = 1.05;
      defaultPreset = 'slow-push-in';
      defaultCameraIntensity = 0.4;
      break;

    case 'close_up':
      baseScale = 1.5;
      baseDepth = 0.9;
      defaultZoom = 1.12;
      defaultPreset = 'slow-push-in';
      defaultCameraIntensity = 0.35;
      break;

    case 'insert_detail':
      baseScale = 1.8;
      baseDepth = 0.85;
      defaultZoom = 1.25;
      defaultPreset = 'static';
      break;

    case 'over_the_shoulder':
      baseScale = 1.1;
      baseDepth = 1.0;
      defaultZoom = 1.05;
      defaultPreset = 'static';
      break;

    case 'reveal':
      baseScale = 0.9;
      baseDepth = 1.0;
      defaultZoom = 1.0;
      defaultPreset = 'pan-left-to-right';
      defaultCameraIntensity = 0.7;
      break;

    case 'follow':
      baseScale = 0.95;
      baseDepth = 1.0;
      defaultZoom = 1.0;
      defaultPreset = 'tracking';
      defaultCameraIntensity = 0.6;
      break;

    case 'hold':
    default:
      baseScale = 1.0;
      baseDepth = 1.0;
      defaultZoom = 1.0;
      defaultPreset = 'static';
      break;
  }

  // 2. Adjust for Prominence
  if (spec.subject.prominence === 'dominant') {
    baseScale *= 1.08;
  } else if (spec.subject.prominence === 'secondary') {
    baseScale *= 0.88;
  } else if (spec.subject.prominence === 'environmental') {
    baseScale *= 0.75;
  }

  // 3. Screen Region & Subject Horizontal Placement
  const screenRegion = spec.subject.screenRegion ?? 'center';
  let targetX = resolveScreenRegionX(screenRegion, canvasWidth);

  // Apply look direction & lead room
  const lookDir = spec.subject.lookDirection ?? 'direct_camera';
  const flipX = lookDir === 'screen_left';
  let leadRoomDir: 'left' | 'right' | 'none' = 'none';

  if (lookDir === 'screen_right') {
    leadRoomDir = 'right';
  } else if (lookDir === 'screen_left') {
    leadRoomDir = 'left';
  }

  // Offset anchor if requested
  if (spec.subject.anchorOffset?.x) {
    targetX += spec.subject.anchorOffset.x;
  }

  // 4. Vertical Staging & Headroom / Eye Line Alignment
  // Standard character height in PeerPro starter rig is ~600px, eyes at ~500px from root base.
  const characterHeight = 600 * baseScale;
  const eyeHeightFromBase = 500 * baseScale;
  const groundY = 890; // default outdoor/indoor floor line

  let targetY = groundY;
  const targetEyeLineY = Math.round(canvasHeight * 0.35); // Upper third line (~378px)

  if (intent === 'close_up' || intent === 'insert_detail') {
    // Elevate character base so chest & head are framed with eyes near upper third (lower body cropped)
    targetY = targetEyeLineY + eyeHeightFromBase;
  } else {
    // Wide / Establishing / Medium / Hold locks to floor plane
    targetY = groundY;
  }

  if (spec.subject.anchorOffset?.y) {
    targetY += spec.subject.anchorOffset.y;
  }

  // Computed Headroom: distance from top of screen to head top
  const headTopY = targetY - characterHeight;
  const targetHeadroomPx = Math.max(0, headTopY);

  // 5. Depth of Field & Optics
  const depthEmphasis: DepthEmphasis = spec.depthEmphasis ?? 'neutral';
  let dofConfig = undefined;

  if (depthEmphasis === 'shallow_focus' || intent === 'close_up') {
    dofConfig = {
      enabled: true,
      aperture: 1.8,
      focalDepth: baseDepth,
      maxBlur: 6.0,
    };
  } else if (depthEmphasis === 'foreground_silhouette') {
    dofConfig = {
      enabled: true,
      aperture: 1.5,
      focalDepth: 1.0,
      maxBlur: 5.0,
    };
  } else if (depthEmphasis === 'deep_focus' || intent === 'establishing') {
    dofConfig = {
      enabled: false,
    };
  }

  // 6. Camera Motion & Emotional Tone
  const emotionalTone: EmotionalTone = spec.emotionalTone ?? 'calm';
  let shakeConfig = undefined;

  if (emotionalTone === 'tense') {
    shakeConfig = {
      enabled: true,
      frequency: 0.8,
      amplitudeX: 2.8,
      amplitudeY: 2.0,
      rotational: 0.3,
    };
  } else if (emotionalTone === 'intimate' || emotionalTone === 'pensive') {
    shakeConfig = {
      enabled: true,
      frequency: 0.3,
      amplitudeX: 1.4,
      amplitudeY: 1.0,
      rotational: 0.12,
    };
  }

  // Override camera motion if specified
  if (spec.cameraMotion === 'static_hold') {
    defaultPreset = 'static';
  } else if (spec.cameraMotion === 'slow_push_in') {
    defaultPreset = 'slow-push-in';
  } else if (spec.cameraMotion === 'slow_pull_out') {
    defaultPreset = 'slow-pull-out';
  } else if (spec.cameraMotion === 'handheld_drift') {
    defaultPreset = 'static';
    shakeConfig = {
      enabled: true,
      frequency: 0.4,
      amplitudeX: 2.0,
      amplitudeY: 1.5,
      rotational: 0.2,
    };
  } else if (spec.cameraMotion === 'pan_reveal') {
    defaultPreset = 'pan-left-to-right';
  }

  // 7. Assemble Camera Config with Overrides
  const cameraConfig: CameraConfig = {
    preset: overrides.cameraPreset ?? defaultPreset,
    durationInFrames: spec.durationInFrames,
    intensity: defaultCameraIntensity,
    focalDepth: baseDepth,
    depthOfField: overrides.depthOfField
      ? { ...dofConfig, ...overrides.depthOfField, enabled: true }
      : dofConfig,
    shake: overrides.shake
      ? { ...shakeConfig, ...overrides.shake, enabled: true }
      : shakeConfig,
    atmosphericHaze: overrides.atmosphericHaze
      ? { enabled: true, ...overrides.atmosphericHaze }
      : undefined,
  };

  // 8. Secondary Subject Staging (e.g. for Over-the-Shoulder)
  let secondarySubjectSolution = undefined;
  if (spec.secondarySubject) {
    const secRegion = spec.secondarySubject.screenRegion ?? 'edge_left';
    const secX = resolveScreenRegionX(secRegion, canvasWidth);
    const secLook = spec.secondarySubject.lookDirection ?? 'screen_right';
    const isOTS = intent === 'over_the_shoulder';

    secondarySubjectSolution = {
      characterId: spec.secondarySubject.characterId,
      position: {
        x: overrides.subjectPosition?.x ?? secX,
        y: isOTS ? targetY + 60 : groundY,
      },
      scale: isOTS ? baseScale * 1.35 : baseScale * 0.9,
      depth: isOTS ? 0.7 : baseDepth + 0.1,
      flipX: secLook === 'screen_left',
    };
  }

  // Final subject coordinates with overrides
  const finalSubjectX = overrides.subjectPosition?.x ?? targetX;
  const finalSubjectY = overrides.subjectPosition?.y ?? targetY;
  const finalSubjectScale = overrides.subjectScale ?? baseScale;
  const finalSubjectDepth = overrides.subjectDepth ?? baseDepth;

  return {
    intentId: spec.id,
    intent,
    camera: cameraConfig,
    subject: {
      characterId: spec.subject.characterId,
      position: { x: finalSubjectX, y: finalSubjectY },
      scale: finalSubjectScale,
      depth: finalSubjectDepth,
      flipX,
    },
    secondarySubject: secondarySubjectSolution,
    environmentDepth: 1.0,
    debugTelemetry: {
      computedZoom: overrides.zoom ?? defaultZoom,
      computedCameraX: overrides.cameraPosition?.x ?? 0,
      computedCameraY: overrides.cameraPosition?.y ?? 0,
      targetHeadroomPx,
      targetEyeLineY,
      leadRoomDirection: leadRoomDir,
      shotScaleFactor: finalSubjectScale,
    },
  };
}
