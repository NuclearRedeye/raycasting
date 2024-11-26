import type { Circle } from './circle';
import type { Vector } from './vector';

export interface Entity extends Circle {
  direction: Vector;
  camera: Vector;
  active: boolean;
  update(elapsed: number): void;
}
