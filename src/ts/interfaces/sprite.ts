import { Vector } from './vector';

export interface Sprite {
  position: Vector;
  active: boolean;
  scale: number;
  textureId: number;
  properties: number;
  distance?: number;
}
