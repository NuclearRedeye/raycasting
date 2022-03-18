import { Portal } from './portal';
import { Cell } from './cell';
import { Enemy } from '../objects/enemy';
import { Sprite } from './sprite';

export interface Level {
  depth: number;
  name?: string;
  entrance: Portal;
  exit: Portal;
  data: Cell[][];
  objects: Sprite[];
  sprites: Sprite[];
  enemies: Enemy[];
  floor?: number;
  loot?: number;
  ceiling?: number;
  skybox?: number;
}
