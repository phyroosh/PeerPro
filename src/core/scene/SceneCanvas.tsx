import React from 'react';
import { AbsoluteFill } from 'remotion';

export interface SceneCanvasProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  backgroundColor?: string;
  style?: React.CSSProperties;
}

/**
 * SceneCanvas establishes the 2.5D viewport container.
 * Default standard is 1920x1080 design space.
 */
export const SceneCanvas: React.FC<SceneCanvasProps> = ({
  children,
  width = 1920,
  height = 1080,
  backgroundColor = '#0f172a',
  style,
}) => {
  return (
    <AbsoluteFill
      style={{
        width,
        height,
        backgroundColor,
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
