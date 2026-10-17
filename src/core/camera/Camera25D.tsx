import React, { createContext, useContext, useMemo } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { CameraConfig, CameraState } from './types';
import { computeCameraState } from './presets';

interface CameraContextValue {
  camera: CameraState;
  frame: number;
}

const CameraContext = createContext<CameraContextValue>({
  camera: { x: 0, y: 0, zoom: 1.0, roll: 0, focalDepth: 1.0 },
  frame: 0,
});

export const useCamera25D = (): CameraContextValue => useContext(CameraContext);

export interface Camera25DProps {
  config: CameraConfig;
  children: React.ReactNode;
}

/**
 * Camera25D Provider manages virtual camera trajectory and passes
 * frame-deterministic camera state to child layers and effects.
 */
export const Camera25D: React.FC<Camera25DProps> = ({ config, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const camera = useMemo(() => {
    const duration = config.durationInFrames ?? durationInFrames;
    return computeCameraState(frame, duration, config);
  }, [frame, durationInFrames, config]);

  return (
    <CameraContext.Provider value={{ camera, frame }}>
      {children}
    </CameraContext.Provider>
  );
};
