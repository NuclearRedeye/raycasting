import type { Radian } from '../types';
import type { Vector } from '../interfaces/vector';
import type { Dynamic } from '../interfaces/dynamic';
import type { Level } from '../interfaces/level';

import * as vu from '../utils/vector-utils.js';
import { radiansToDegrees } from '../utils/math-utils.js';
import { isBlocked, isSolid } from '../utils/cell-utils.js';
import { getCell } from '../utils/level-utils.js';

export class Entity implements Dynamic {
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
    this.direction = vu.rotate(this.direction, amount);
    this.camera = vu.rotate(this.camera, amount);
  }

  move(amount: number, level: Level): void {
    const position = vu.add(this.position, vu.scale(this.direction, amount));

    // Check for a collision on the X Axis
    const xCell = getCell(level, Math.floor(position.x), Math.floor(this.position.y));
    if (xCell !== undefined && !isSolid(xCell) && !isBlocked(xCell)) {
      this.position.x = position.x;
    }

    // Check for a collision on the Y Axis
    const yCell = getCell(level, Math.floor(this.position.x), Math.floor(position.y));
    if (yCell !== undefined && !isSolid(yCell) && !isBlocked(yCell)) {
      this.position.y = position.y;
    }

    /*
    // FIXME: Generalise Portals
    // Check if we walked into a hole.
    const newCell = getCell(level, Math.floor(this.position.x), Math.floor(this.position.y));
    if (newCell != undefined) {
      if (newCell.type === CellType.EXIT) {
        // FIXME: This is a temporary hack as this needs to be called outside of the animation loop.
        setTimeout(() => {
          const newLevel = level.exit.destination ? levels[level.exit.destination] : levels[level.depth + 1];
          setCurrentLevel(newLevel, newLevel.entrance);
        }, 0);
      }
    }
    */
  }
}
