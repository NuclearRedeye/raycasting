import type { Radian } from '../types';
import type { Vector } from '../interfaces/vector';

import * as vu from '../utils/vector-utils.js';
import { radiansToDegrees } from '../utils/math-utils.js';

export class Entity {
  position: Vector;
  direction: Vector;
  camera: Vector;

  active: boolean;
  scale: number;
  radius: number;

  constructor(x: number, y: number) {
    this.position = vu.create(x, y);
    this.direction = vu.create(1, 0);
    this.camera = vu.create(0, 0.66);

    this.active = true;
    this.scale = 1.0;
    this.radius = 0.5;
  }

  getAngle(): number {
    const radians = vu.angle(this.direction);
    return radiansToDegrees(radians);
  }

  // Returns the Entities Field of View, in Radians
  getFOV(): number {
    const a: Vector = vu.normalise(vu.subtract(this.direction, this.camera));
    const b: Vector = vu.normalise(vu.add(this.direction, this.camera));
    const radians = vu.angle(a, b);
    return radiansToDegrees(radians);
  }

  // eslint-disable-next-line
  update(elapsed: number): void {}

  rotate(amount: Radian): void {
    this.direction = vu.rotate(this.direction, amount)
    this.camera = vu.rotate(this.camera, amount)
  }

  move(amount: number): void {
    const position = vu.add(this.position, vu.scale(this.direction, amount))
  }
}
