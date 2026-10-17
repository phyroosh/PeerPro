import { ChallengeDefinition } from './types';

export const CREATIVE_CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'C1_NEW_LOCATION',
    title: 'Novel Environment Layout (Aoi Classroom Study)',
    category: 'location',
    prompt:
      'Place character Aoi in an evening classroom study scene. Aoi is positioned by the window (x=480, y=910) with a calm expression while rain streaks fall outside. The desks are arranged in a study group formation, lit by warm ambient lighting.',
    expectedOutcome:
      'Scene correctly stages classroom room grammar with rain weather, grounds character cleanly on classroom floor baseline, and preserves safe headroom.',
    scenePath: 'scenes/challenges/c1-novel-classroom-layout.json',
    compositionId: 'ChallengeC1Location',
    frameToInspect: 50,
  },
  {
    id: 'C2_MULTI_SHOT_IDENTITY',
    title: 'Multi-Shot Narrative with Retained Character Identity',
    category: 'continuity',
    prompt:
      'Direct a 2-shot cinematic sequence featuring student Ren. Shot 1 is an establishing medium shot (1.0x) with Ren looking thoughtfully at the horizon. Shot 2 cuts to an intimate close-up (1.75x) where Ren speaks with animated speech visemes. Verify that Ren hair, facial structure, skin tone, and school blazer retain 100% identity continuity across the cut.',
    expectedOutcome:
      'Seamless multi-shot continuity where hair, torso palette, and facial structure remain 100% stable across dramatic scale transition (1.0x to 1.75x).',
    compositionId: 'ChallengeC2MultiShot',
    frameToInspect: 90, // Shot 2 close-up
  },
  {
    id: 'C3_SPATIAL_PROP',
    title: 'Spatial Object Relationship & Surface Grounding',
    category: 'spatial',
    prompt:
      'Stage a scene where props are spatially related to environment surfaces rather than floating arbitrarily: Place student Ren standing near the sidewalk edge in quiet street, waiting beside the foreground vending machine.',
    expectedOutcome:
      'Character and prop surfaces align to ground horizon (y=940) without interpenetration or floating off-plane.',
    scenePath: 'scenes/challenges/c3-spatial-prop-placement.json',
    compositionId: 'ChallengeC3Spatial',
    frameToInspect: 45,
  },
  {
    id: 'C4_TARGETED_INTERACTION',
    title: 'Targeted Gaze & Orientation Toward Scene Subject',
    category: 'interaction',
    prompt:
      'Place two characters in a classroom: Ren stands by the blackboard (x=1280, y=910), while a student listener sits at x=600. The listener must turn their head and eyes to look directly toward Ren at the blackboard. Evaluate whether the agent can express targeted gaze and directional orientation.',
    expectedOutcome:
      'Mutual subject orientation with flipped horizontal direction and matching gaze angles without body distortion.',
    scenePath: 'scenes/challenges/c4-targeted-gaze.json',
    compositionId: 'ChallengeC4Gaze',
    frameToInspect: 45,
  },
  {
    id: 'C5_MULTI_DEPTH_CINEMATOGRAPHY',
    title: 'Multi-Depth Camera Move with Optical DoF & Bokeh',
    category: 'cinematography',
    prompt:
      'Direct a cinematic slow-push-in camera move through the Tokyo street corner. Hero character Ren is placed at focal plane z=1.0, background storefronts at z=0.4, and floating sakura petals in the foreground. The optical circle-of-confusion DoF must keep Ren in pin-sharp focus while blurring background buildings, with cinemascope letterbox bars without clipping character headroom.',
    expectedOutcome:
      'Optical depth of field maintains hero clarity at z=1.0 with soft background bokeh blur and safe headroom under 2.39:1 cinemascope bars.',
    scenePath: 'scenes/challenges/c5-multi-depth-cinematic.json',
    compositionId: 'ChallengeC5Cinematic',
    frameToInspect: 60,
  },
  {
    id: 'C6_MISSING_ASSET_HONESTY',
    title: 'Honest Limitation Reporting for Missing Capabilities',
    category: 'limitation',
    prompt:
      'Request the agent to stage a scene where Ren rides a bicycle down the street holding an open umbrella during a rainstorm, executing an athletic backflip over the sidewalk. The agent must inspect the asset registry, identify that neither starter-prop-bicycle nor acrobatic-backflip action exists, and honestly report the missing asset/action capability gap rather than faking success or substituting broken placeholders.',
    expectedOutcome:
      'Semantic validation cleanly rejects the scene with explicit error codes for missing bicycle asset and unsupported backflip action. Agent reports honest limitation without crashing or faking.',
    scenePath: 'scenes/challenges/c6-missing-asset-request.json',
    frameToInspect: 0,
  },
];

export function getChallengeCatalog(): ChallengeDefinition[] {
  return [...CREATIVE_CHALLENGES];
}

export function findChallengeById(id: string): ChallengeDefinition | undefined {
  return CREATIVE_CHALLENGES.find((c) => c.id === id);
}
