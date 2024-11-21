import { Radian } from '../types';
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
  const rayDirectionX = entity.direction.x + entity.camera.x * camera;
  const rayDirectionY = entity.direction.y + entity.camera.y * camera;

  // Calculate the distance from one cell boundary to the next boundary in the X or Y direction.
  const deltaDistanceX = Math.abs(1 / rayDirectionX);
  const deltaDistanceY = Math.abs(1 / rayDirectionY);

  // Tracks the current Cell as the line is cast.
  const castCell: Point = { x: Math.floor(entity.position.x), y: Math.floor(entity.position.y) };

  // Tracks the total distance from the ray's origin as the line is cast.
  const castDistance: Point = { x: 0, y: 0 };

  // Counts the steps along each axis as the line is cast.
  const castStep: Point = { x: 0, y: 0 };

  // Step to the next Cell on the X Axis.
  if (rayDirectionX < 0) {
    castStep.x = -1;
    castDistance.x = (entity.position.x - castCell.x) * deltaDistanceX;
  } else {
    castStep.x = 1;
    castDistance.x = (castCell.x + 1 - entity.position.x) * deltaDistanceX;
  }

  // Step to the next Cell on the Y Axis.
  if (rayDirectionY < 0) {
    castStep.y = -1;
    castDistance.y = (entity.position.y - castCell.y) * deltaDistanceY;
  } else {
    castStep.y = 1;
    castDistance.y = (castCell.y + 1 - entity.position.y) * deltaDistanceY;
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
          distance = Math.abs((castCell.x - entity.position.x + (1 - castStep.x) / 2) / rayDirectionX);
          wall = entity.position.y + ((castCell.x - entity.position.x + (1 - castStep.x) / 2) / rayDirectionX) * rayDirectionY;
          wall -= Math.floor(wall);
          break;

        case Face.NORTH:
        case Face.SOUTH:
          distance = Math.abs((castCell.y - entity.position.y + (1 - castStep.y) / 2) / rayDirectionY);
          wall = entity.position.x + ((castCell.y - entity.position.y + (1 - castStep.y) / 2) / rayDirectionY) * rayDirectionX;
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
  position: Point
  direction: Vector
  camera: Vector

  active: boolean;
  scale: number;
  radius: number;

  constructor(x: number, y: number) {
    this.position = {
      x,
      y
    };
    
    this.direction = {
      x: 1.0,
      y: 0.0
    };

    this.camera = {
      x: 0.0,
      y: 0.66
    };

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
