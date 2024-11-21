import type { Circle } from './circle';
import type { Point } from './point';
import type { Vector } from './vector';

export interface Entity extends Circle {
  position: Point
  direction: Vector
  camera: Vector
  active: boolean;
  update(elapsed: number): void;
}
