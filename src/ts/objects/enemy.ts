import type { Radian } from '../types';
import { Vector } from '../interfaces/vector';
import { Level } from '../interfaces/level';
import { Dynamic } from '../interfaces/dynamic';

import { isBlocked, isSolid } from '../utils/cell-utils.js';
import { getCell } from '../utils/level-utils.js';
import * as vu from '../utils/vector-utils.js'


export class Enemy implements Dynamic {
  position: Vector;
  direction: Vector;
  camera: Vector;

  active: boolean;
  textureId: number;
  scale: number;
  radius: number;

  constructor(x: number, y: number, textureId: number, scale: number = 1.0) {
    this.position = {
      x,
      y
    }

    this.direction = {
      x: 1.0,
      y: 0.0
    }

    this.camera = {
      x: 0.0,
      y: 0.66
    }

    this.active = true;
    this.textureId = textureId;
    this.scale = scale;
    this.radius = 0.5;
  }

  // eslint-disable-next-line
  update(elapsed: number): void {}

  rotate(amount: Radian): void {
    this.direction = vu.rotate(this.direction, amount)
    this.camera = vu.rotate(this.camera, amount)
  }

  move(amount: number, level: Level): void {
    const position = vu.add(this.position, vu.scale(this.direction, amount))

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
  }
}
