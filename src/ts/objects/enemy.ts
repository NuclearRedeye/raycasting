import { Level } from '../interfaces/level';
import { Movable } from '../interfaces/movable';

import { isSolid } from '../utils/cell-utils.js';
import { getCell } from '../utils/level-utils.js';

export class Enemy implements Movable {
  x: number;
  y: number;
  dx: number;
  dy: number;
  cx: number;
  cy: number;
  active: boolean;
  textureId: number;
  scale: number;
  radius: number;

  constructor(x: number, y: number, textureId: number, scale: number = 1.0) {
    this.x = x;
    this.y = y;
    this.dx = 1.0;
    this.dy = 0.0;
    this.cx = 0.0;
    this.cy = 0.66;
    this.active = true;
    this.textureId = textureId;
    this.scale = scale;
    this.radius = 0.5;
  }

  // eslint-disable-next-line
  update(elapsed: number): void {}

  rotate(amount: number): void {
    // Rotate Player
    const dx = this.dx;
    this.dx = this.dx * Math.cos(amount) - this.dy * Math.sin(amount);
    this.dy = dx * Math.sin(amount) + this.dy * Math.cos(amount);

    // Rotate Camera
    const cx = this.cx;
    this.cx = this.cx * Math.cos(amount) - this.cy * Math.sin(amount);
    this.cy = cx * Math.sin(amount) + this.cy * Math.cos(amount);
  }

  move(amount: number, level: Level): void {
    const newX = this.x + this.dx * amount;
    const newY = this.y + this.dy * amount;

    // Check for a collision on the X Axis
    const xCell = getCell(level, Math.floor(newX), Math.floor(this.y));
    if (xCell !== undefined && !isSolid(xCell)) {
      this.x = newX;
    }
    // Check for a collision on the Y Axis
    const yCell = getCell(level, Math.floor(this.x), Math.floor(newY));
    if (yCell !== undefined && !isSolid(yCell)) {
      this.y = newY;
    }
  }
}
