import React from 'react';
import { Composition } from 'remotion';
import { PeerProSandbox } from './compositions/PeerProSandbox';

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
    </>
  );
};
