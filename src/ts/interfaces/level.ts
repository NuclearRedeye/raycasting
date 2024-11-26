import { Portal } from './portal';
import { Cell } from './cell';
import { Sprite } from './sprite';

export interface Level {
  depth: number;
  name?: string;
  entrance: Portal;
  exit: Portal;
  data: Cell[][];
  entities: Sprite[];
  sprites: Sprite[];
  floor?: number;
  loot?: number;
  ceiling?: number;
  skybox?: number;
}
