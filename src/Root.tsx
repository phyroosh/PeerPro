import React from 'react';
import { Composition } from 'remotion';
import { PeerProSandbox } from './compositions/PeerProSandbox';
import { CharacterShowcase } from './compositions/CharacterShowcase';
import { EnvironmentShowcase } from './compositions/EnvironmentShowcase';
import { ParallaxTest } from './compositions/ParallaxTest';
import { StyleShowcase } from './compositions/StyleShowcase';
import { CutoutRigShowcase } from './compositions/CutoutRigShowcase';
import { ClassroomShowcase } from './compositions/ClassroomShowcase';
import { ActionShowcase } from './compositions/ActionShowcase';
import { CinematicSequenceShowcase } from './compositions/CinematicSequenceShowcase';
import { AudioNarrativeShowcase } from './compositions/AudioNarrativeShowcase';
import { EdgeTTSVoiceoverShowcase } from './compositions/EdgeTTSVoiceoverShowcase';
import { RigPreviewShowcase } from './compositions/RigPreviewShowcase';
import { InteractionShowcase } from './compositions/InteractionShowcase';
import { WorldCompositionShowcase } from './compositions/WorldCompositionShowcase';
import { ActionGraphShowcase } from './compositions/ActionGraphShowcase';
import { CinematicIntentShowcase } from './compositions/CinematicIntentShowcase';
import { MultiShotIdentityChallenge } from './compositions/challenges/MultiShotIdentityChallenge';
import { SceneRenderer, SceneRendererProps } from './core/scene/SceneRenderer';
import { defaultAssetRegistry } from './core/assets/registry';
import starterManifest from '../asset-packs/starter-kit/manifest.json';
import agentSceneFixture from '../scenes/agent-dialog-scene.json';
import challengeC1Fixture from '../scenes/challenges/c1-novel-classroom-layout.json';
import challengeC3Fixture from '../scenes/challenges/c3-spatial-prop-placement.json';
import challengeC4Fixture from '../scenes/challenges/c4-targeted-gaze.json';
import challengeC5Fixture from '../scenes/challenges/c5-multi-depth-cinematic.json';

// Initialize default asset registry with starter pack
if (!defaultAssetRegistry.has('starter-char-head-01')) {
  defaultAssetRegistry.registerPack(starterManifest as any, { validate: false });
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PeerProSandbox"
        component={PeerProSandbox}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'PeerPro 2.5D Animation Playground',
          badgeColor: '#38bdf8',
        }}
      />
      <Composition
        id="CharacterShowcase"
        component={CharacterShowcase}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'PeerPro Character Builder Showcase',
        }}
      />
      <Composition
        id="EnvironmentShowcase"
        component={EnvironmentShowcase}
        durationInFrames={160}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          layoutMode: 'sequence',
        }}
      />
      <Composition
        id="ParallaxTest"
        component={ParallaxTest}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          cameraPreset: 'pan-left-to-right',
          cameraIntensity: 1.0,
          showHud: true,
        }}
      />
      <Composition
        id="AgentScene"
        component={SceneRenderer}
        durationInFrames={agentSceneFixture.canvas?.durationInFrames || 120}
        fps={agentSceneFixture.canvas?.fps || 30}
        width={agentSceneFixture.canvas?.width || 1920}
        height={agentSceneFixture.canvas?.height || 1080}
        defaultProps={{
          manifest: agentSceneFixture as any,
        }}
      />
      <Composition
        id="StyleShowcase"
        component={StyleShowcase}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'PeerPro Style & Asset Quality System',
        }}
      />
      <Composition
        id="CutoutRigShowcase"
        component={CutoutRigShowcase}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'PeerPro Cutout-Rig & Articulated Acting System',
        }}
      />
      <Composition
        id="ClassroomShowcase"
        component={ClassroomShowcase}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'PeerPro Indoor Classroom Environment System',
        }}
      />
      <Composition
        id="ActionShowcase"
        component={ActionShowcase}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="CinematicSequenceShowcase"
        component={CinematicSequenceShowcase}
        durationInFrames={210}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="AudioNarrativeShowcase"
        component={AudioNarrativeShowcase}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="EdgeTTSVoiceoverShowcase"
        component={EdgeTTSVoiceoverShowcase}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ChallengeC1Location"
        component={SceneRenderer}
        durationInFrames={challengeC1Fixture.canvas?.durationInFrames || 120}
        fps={challengeC1Fixture.canvas?.fps || 30}
        width={challengeC1Fixture.canvas?.width || 1920}
        height={challengeC1Fixture.canvas?.height || 1080}
        defaultProps={{
          manifest: challengeC1Fixture as any,
        }}
      />
      <Composition
        id="ChallengeC2MultiShot"
        component={MultiShotIdentityChallenge}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ChallengeC3Spatial"
        component={SceneRenderer}
        durationInFrames={challengeC3Fixture.canvas?.durationInFrames || 120}
        fps={challengeC3Fixture.canvas?.fps || 30}
        width={challengeC3Fixture.canvas?.width || 1920}
        height={challengeC3Fixture.canvas?.height || 1080}
        defaultProps={{
          manifest: challengeC3Fixture as any,
        }}
      />
      <Composition
        id="ChallengeC4Gaze"
        component={SceneRenderer}
        durationInFrames={challengeC4Fixture.canvas?.durationInFrames || 120}
        fps={challengeC4Fixture.canvas?.fps || 30}
        width={challengeC4Fixture.canvas?.width || 1920}
        height={challengeC4Fixture.canvas?.height || 1080}
        defaultProps={{
          manifest: challengeC4Fixture as any,
        }}
      />
      <Composition
        id="ChallengeC5Cinematic"
        component={SceneRenderer}
        durationInFrames={challengeC5Fixture.canvas?.durationInFrames || 120}
        fps={challengeC5Fixture.canvas?.fps || 30}
        width={challengeC5Fixture.canvas?.width || 1920}
        height={challengeC5Fixture.canvas?.height || 1080}
        defaultProps={{
          manifest: challengeC5Fixture as any,
        }}
      />
      <Composition
        id="RigPreviewShowcase"
        component={RigPreviewShowcase}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'PeerPro Character Performance System & Rig Profiles',
          showOverlay: true,
        }}
      />
      <Composition
        id="InteractionShowcase"
        component={InteractionShowcase}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'PeerPro Character–Object Interaction Toolkit',
          showOverlay: true,
        }}
      />
      <Composition
        id="WorldCompositionShowcase"
        component={WorldCompositionShowcase}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'PeerPro World Composition & Procedural Environment Layout',
        }}
      />
      <Composition
        id="ActionGraphShowcase"
        component={ActionGraphShowcase}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'PeerPro Action Graph & Timeline Orchestration',
        }}
      />
      <Composition
        id="CinematicIntentShowcase"
        component={CinematicIntentShowcase}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'PeerPro Shot Direction & Cinematic Intent',
        }}
      />
    </>
  );
};
