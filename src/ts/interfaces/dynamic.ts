import type { Radian } from '../types';
import type { Entity } from './entity';
import type { Level } from './level';

export interface Dynamic extends Entity {
  rotate(amount: Radian): void;
  move(amount: number, level: Level): void;
}
