import { Point } from './point';

export interface Sprite extends Point {
  active: boolean;
  scale: number;
  textureId: number;
  properties: number;
  distance?: number;
}
