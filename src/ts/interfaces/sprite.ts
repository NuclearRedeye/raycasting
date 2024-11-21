import { Point } from './point';

export interface Sprite {
  position: Point;
  active: boolean;
  scale: number;
  textureId: number;
  properties: number;
  distance?: number;
}
