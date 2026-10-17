import React from 'react';
import { Composition } from 'remotion';
import { PeerProSandbox } from './compositions/PeerProSandbox';
import { CharacterShowcase } from './compositions/CharacterShowcase';
import { defaultAssetRegistry } from './core/assets/registry';
import starterManifest from '../asset-packs/starter-kit/manifest.json';

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
    </>
  );
};
