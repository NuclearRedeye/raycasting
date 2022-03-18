import { Entity } from './entity';
import { Level } from './level';

export interface Movable extends Entity {
  rotate(amount: number): void;
  move(amount: number, level: Level): void;
}
