import React from 'react';
import { Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { SceneAudioTrack } from './types';
import { SceneDialogLine } from '../scene/types';
import { computeTrackVolume } from './mixing';

export interface AudioRendererProps {
  tracks?: SceneAudioTrack[];
  dialog?: SceneDialogLine[];
}

export const AudioRenderer: React.FC<AudioRendererProps> = ({ tracks, dialog }) => {
  if (!tracks || tracks.length === 0) {
    return null;
  }

  const dialogLines = dialog ?? [];

  return (
    <>
      {tracks.map((track) => {
        if (!track.src) {
          return null;
        }

        const resolvedSrc =
          track.src.startsWith('http://') ||
          track.src.startsWith('https://') ||
          track.src.startsWith('data:')
            ? track.src
            : staticFile(track.src);

        return (
          <Sequence
            key={track.id}
            from={track.startFrame}
            durationInFrames={track.durationInFrames}
            name={`Audio-${track.type}-${track.id}`}
          >
            <Audio
              src={resolvedSrc}
              volume={(frame) => computeTrackVolume(track.startFrame + frame, track, dialogLines)}
              playbackRate={track.playbackRate ?? 1.0}
              loop={track.loop ?? false}
            />
          </Sequence>
        );
      })}
    </>
  );
};
