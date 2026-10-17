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
import { SceneRenderer, SceneRendererProps } from './core/scene/SceneRenderer';
import { defaultAssetRegistry } from './core/assets/registry';
import starterManifest from '../asset-packs/starter-kit/manifest.json';
import agentSceneFixture from '../scenes/agent-dialog-scene.json';

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
    </>
  );
};
