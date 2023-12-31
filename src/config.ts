import { CSSProperties } from 'react';

export const NODE_SPACE = {
  x: 12,
  y: 40,
};

export const BORDER_RADIUS = 8;

export const DEFAULT_STRIPE = 0.1;

export const DEFAULT_SCALE_EXTENT: [number, number] = [0.1, 3];

export const DEFAULT_DURATION = 300;

export const DEFAULT_BACKGROUND: Exclude<
  CSSProperties['backgroundColor'],
  undefined
> = 'transparent';
