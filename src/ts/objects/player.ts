import { Dynamic } from '../interfaces/dynamic';
import { Level } from '../interfaces/level';
import { Point } from '../interfaces/point';
import { Entity } from '../interfaces/entity';
import { CastResult } from '../interfaces/raycaster';
import { Vector } from '../interfaces/vector';

import { CellType, Face } from '../enums.js';
import { levels } from '../data/levels/levels.js';
import { setCurrentLevel } from '../state.js';
import { isBlocked, isInteractive, isSolid } from '../utils/cell-utils.js';
import { getCell } from '../utils/level-utils.js';
import { backBufferProps } from '../config.js';
import { radiansToDegrees } from '../utils/math-utils.js';
import * as vu from '../utils/vector-utils.js';


// FIXME: Slimmed down copy of the raycast function from raycaster.ts, should merge
function castRay(column: number, entity: Entity, level: Level, maxDepth: number = 50): CastResult | undefined {
  const camera = (2 * column) / backBufferProps.width - 1;
  const rayDirectionX = entity.dx + entity.cx * camera;
  const rayDirectionY = entity.dy + entity.cy * camera;

  // Calculate the distance from one cell boundary to the next boundary in the X or Y direction.
  const deltaDistanceX = Math.abs(1 / rayDirectionX);
  const deltaDistanceY = Math.abs(1 / rayDirectionY);

  // Tracks the current Cell as the line is cast.
  const castCell: Point = { x: Math.floor(entity.x), y: Math.floor(entity.y) };

  // Tracks the total distance from the ray's origin as the line is cast.
  const castDistance: Point = { x: 0, y: 0 };

  // Counts the steps along each axis as the line is cast.
  const castStep: Point = { x: 0, y: 0 };

  // Step to the next Cell on the X Axis.
  if (rayDirectionX < 0) {
    castStep.x = -1;
    castDistance.x = (entity.x - castCell.x) * deltaDistanceX;
  } else {
    castStep.x = 1;
    castDistance.x = (castCell.x + 1 - entity.x) * deltaDistanceX;
  }

  // Step to the next Cell on the Y Axis.
  if (rayDirectionY < 0) {
    castStep.y = -1;
    castDistance.y = (entity.y - castCell.y) * deltaDistanceY;
  } else {
    castStep.y = 1;
    castDistance.y = (castCell.y + 1 - entity.y) * deltaDistanceY;
  }

  // Count the number of DDA steps executed, so that we can break if the maximum depth is reached.
  let count = 0;

  // Tracks if the DDA step was in the X or the Y axis.
  let side;

  // Use DDA to step through all the cell boundaries the ray touches.
  while (count++ < maxDepth) {
    // Advance along either the X or the Y axis to the next Cell boundary.
    if (castDistance.x < castDistance.y) {
      castDistance.x += deltaDistanceX;
      castCell.x += castStep.x;
      side = castStep.x < 0 ? Face.EAST : Face.WEST;
    } else {
      castDistance.y += deltaDistanceY;
      castCell.y += castStep.y;
      side = castStep.y > 0 ? Face.NORTH : Face.SOUTH;
    }

    // Get the Cell that the ray has hit.
    const cell = getCell(level, castCell.x, castCell.y);

    // If the cell is not valid, then most likely exceeded the boundaries of the level hence give up.
    if (cell === undefined) {
      break;
    }

    // Check if the Cell is Solid.
    if (isInteractive(cell)) {
      // Calculate the distance from the ray's origin to the solid that was hit, and the specific point on the wall the ray hit.
      let distance = 0;
      let wall = 0;
      switch (side) {
        case Face.EAST:
        case Face.WEST:
          distance = Math.abs((castCell.x - entity.x + (1 - castStep.x) / 2) / rayDirectionX);
          wall = entity.y + ((castCell.x - entity.x + (1 - castStep.x) / 2) / rayDirectionX) * rayDirectionY;
          wall -= Math.floor(wall);
          break;

        case Face.NORTH:
        case Face.SOUTH:
          distance = Math.abs((castCell.y - entity.y + (1 - castStep.y) / 2) / rayDirectionY);
          wall = entity.x + ((castCell.y - entity.y + (1 - castStep.y) / 2) / rayDirectionY) * rayDirectionX;
          wall -= Math.floor(wall);
          break;
      }

      return {
        ...castCell,
        cell,
        face: side,
        wall,
        distance: distance
      };
    }
  }
  return undefined;
}

export class Player implements Dynamic {
  x: number;
  y: number;
  dx: number;
  dy: number;
  cx: number;
  cy: number;
  active: boolean;
  scale: number;
  radius: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.dx = 1.0;
    this.dy = 0.0;
    this.cx = 0.0;
    this.cy = 0.66;
    this.active = true;
    this.scale = 1.0;
    this.radius = 0.5;
  }

  getDirection(): Vector {
    return {
      x: this.dx,
      y: this.dy
    }
  }

  getCamera(): Vector {
    return {
      x: this.cx,
      y: this.cy
    }
  }

  getAngle(): number {
    const radians = vu.angle(this.getDirection());
    return radiansToDegrees(radians);
  }

  // Returns the Entities Field of View, in Radians
  getFOV(): number {
    const a: Vector = vu.normalise(vu.subtract(this.getDirection(), this.getCamera()));
    const b: Vector = vu.normalise(vu.add(this.getDirection(), this.getCamera()));
    const radians = vu.angle(a, b);
    return radiansToDegrees(radians);
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
    if (xCell !== undefined && !isSolid(xCell) && !isBlocked(xCell)) {
      this.x = newX;
    }
    // Check for a collision on the Y Axis
    const yCell = getCell(level, Math.floor(this.x), Math.floor(newY));
    if (yCell !== undefined && !isSolid(yCell) && !isBlocked(yCell)) {
      this.y = newY;
    }

    // Check if we walked into a hole.
    const newCell = getCell(level, Math.floor(this.x), Math.floor(this.y));
    if (newCell != undefined) {
      if (newCell.type === CellType.EXIT) {
        // FIXME: This is a temporary hack as this needs to be called outside of the animation loop.
        setTimeout(() => {
          const newLevel = level.exit.destination ? levels[level.exit.destination] : levels[level.depth + 1];
          setCurrentLevel(newLevel, newLevel.entrance);
        }, 0);
      }
    }
  }

  interact(level: Level): void {
    const result = castRay(backBufferProps.width / 2, this, level);
    if (result != undefined) {
      const cell = result.cell;
      const reach = 1 + this.radius;

      // Check we can reach the target.
      if (result.distance < reach) {
        // Target cell can be interacted with, and the specific face is stateful...
        if (isInteractive(cell)) {
          for (const activator of cell.activators) {
            activator(cell);
          }
        }

        // Target is an entrance...
        if (result.cell.type === CellType.ENTRANCE) {
          // FIXME: This is a temporary hack as this needs to be called outside of the animation loop.
          setTimeout(() => {
            const newLevel = level.entrance.destination ? levels[level.entrance.destination] : levels[level.depth - 1];
            setCurrentLevel(newLevel, newLevel.exit);
          }, 0);
        }

        // Target is an exit...
        if (result.cell.type === CellType.EXIT) {
          // FIXME: This is a temporary hack as this needs to be called outside of the animation loop.
          setTimeout(() => {
            const newLevel = level.exit.destination ? levels[level.exit.destination] : levels[level.depth + 1];
            setCurrentLevel(newLevel, newLevel.entrance);
          }, 0);
        }
      }
    }
  }
}
